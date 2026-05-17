#!/bin/bash
# ============================================================
# MedTrack BI — 05_run_etl.sh
# Orchestrates the full Extract → Transform → Load pipeline.
# ============================================================
# Run order:
#   1. Generate / validate source data
#   2. Transform CSV → star schema DataFrames
#   3. Load DataFrames → PostgreSQL warehouse
#   4. Refresh materialized views (datamarts + KPIs)
#
# Usage:
#   chmod +x scripts/05_run_etl.sh
#   sudo -u medtrack bash scripts/05_run_etl.sh
# ============================================================

set -euo pipefail   # e=exit on error, u=undefined var, o pipefail=pipe errors caught

# ---- Project paths ---------------------------------------------------
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ETL_DIR="$PROJECT_DIR/etl"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/etl_$(date +%Y%m%d_%H%M%S).log"

# ---- Colours for terminal output ------------------------------------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $(date '+%H:%M:%S')  $*" | tee -a "$LOG_FILE"; }
success() { echo -e "${GREEN}[OK]${RESET}    $(date '+%H:%M:%S')  $*" | tee -a "$LOG_FILE"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $(date '+%H:%M:%S')  $*" | tee -a "$LOG_FILE"; }
error()   { echo -e "${RED}[ERROR]${RESET} $(date '+%H:%M:%S')  $*" | tee -a "$LOG_FILE"; exit 1; }

# ---- Create log directory -------------------------------------------
mkdir -p "$LOG_DIR"

info "======================================================"
info "  MedTrack BI — ETL Pipeline Starting"
info "======================================================"
info "Project:  $PROJECT_DIR"
info "Log file: $LOG_FILE"

# ---- 1. Check Python environment ------------------------------------
info "Step 1/5 — Checking Python environment..."

if ! command -v python3 &>/dev/null; then
    error "python3 not found. Run: sudo apt-get install python3"
fi

# Verify required packages are installed
python3 -c "import pandas, sqlalchemy, psycopg2, numpy" 2>/dev/null || {
    warn "Missing Python packages. Installing..."
    pip3 install pandas sqlalchemy psycopg2-binary numpy --quiet
}

success "Python environment OK"

# ---- 2. Check PostgreSQL connectivity --------------------------------
info "Step 2/5 — Testing PostgreSQL connectivity..."

# Try to connect as the medtrack user (created in 03_setup_postgres.sh)
PG_CHECK=$(PGPASSWORD="medtrack_secure_pw" psql \
    -h localhost -U medtrack_etl -d medtrack_dw \
    -c "SELECT COUNT(*) FROM warehouse.dim_product;" \
    -t 2>&1) || error "Cannot connect to PostgreSQL. Run 03_setup_postgres.sh first."

PROD_COUNT=$(echo "$PG_CHECK" | tr -d ' ')
info "dim_product rows found: $PROD_COUNT"

if [ "$PROD_COUNT" -eq 0 ]; then
    warn "Dimensions are empty. Running dimension SQL files first..."
    PGPASSWORD="medtrack_secure_pw" psql -h localhost -U medtrack_etl -d medtrack_dw \
        -f "$PROJECT_DIR/datamarts/sql/01_create_dimensions.sql" >> "$LOG_FILE" 2>&1
    PGPASSWORD="medtrack_secure_pw" psql -h localhost -U medtrack_etl -d medtrack_dw \
        -f "$PROJECT_DIR/datamarts/sql/02_create_facts.sql"       >> "$LOG_FILE" 2>&1
fi

success "PostgreSQL connection OK"

# ---- 3. Extract — generate or download source data -------------------
info "Step 3/5 — Extract phase..."

DATA_DIR="$PROJECT_DIR/data/raw"
mkdir -p "$DATA_DIR"

if [ -f "$DATA_DIR/saleshourly.csv" ]; then
    ROW_COUNT=$(wc -l < "$DATA_DIR/saleshourly.csv")
    info "Dataset found: $DATA_DIR/saleshourly.csv  ($ROW_COUNT lines)"
else
    warn "Dataset not found at $DATA_DIR/saleshourly.csv"
    info "Generating synthetic dataset (52,000 rows, 2014–2019)..."
    python3 "$ETL_DIR/extract/generate_synthetic.py" \
        --output "$DATA_DIR/saleshourly.csv" \
        --rows 52000 \
        2>&1 | tee -a "$LOG_FILE"
    success "Synthetic dataset generated"
fi

# ---- 4. Transform — clean, reshape, enrich --------------------------
info "Step 4/5 — Transform phase..."

python3 "$ETL_DIR/transform/transform_pharma.py" \
    --input  "$DATA_DIR/saleshourly.csv" \
    --output "$PROJECT_DIR/data/transformed" \
    2>&1 | tee -a "$LOG_FILE"

success "Transform phase complete"

# ---- 5. Load — write star schema to PostgreSQL ----------------------
info "Step 5/5 — Load phase (dimensions + fact table)..."

python3 "$ETL_DIR/load/load_datamart.py" \
    --data-dir "$PROJECT_DIR/data/transformed" \
    --host localhost \
    --db   medtrack_dw \
    --user medtrack_etl \
    --password medtrack_secure_pw \
    2>&1 | tee -a "$LOG_FILE"

success "Load phase complete"

# ---- 6. Refresh materialized views ----------------------------------
info "Refreshing datamarts and KPI views..."

for VIEW in \
    datamarts.dm_sales_performance \
    datamarts.dm_product_analysis \
    datamarts.dm_regional_intelligence; do
    info "  Refreshing $VIEW ..."
    PGPASSWORD="medtrack_secure_pw" psql \
        -h localhost -U medtrack_etl -d medtrack_dw \
        -c "REFRESH MATERIALIZED VIEW CONCURRENTLY $VIEW;" \
        >> "$LOG_FILE" 2>&1
    success "  $VIEW — refreshed"
done

# ---- 7. Quick validation -------------------------------------------
info "Running data quality checks..."

PGPASSWORD="medtrack_secure_pw" psql -h localhost -U medtrack_etl -d medtrack_dw \
    -c "
    SELECT
        COUNT(*)                              AS total_facts,
        COUNT(DISTINCT date_key)              AS distinct_days,
        COUNT(DISTINCT product_key)           AS distinct_products,
        ROUND(SUM(revenue)::NUMERIC, 0)       AS total_revenue,
        ROUND(AVG(gross_profit/NULLIF(revenue,0))*100, 1) AS avg_margin_pct
    FROM warehouse.fact_sales;
    " 2>&1 | tee -a "$LOG_FILE"

# ---- Done -----------------------------------------------------------
success "======================================================"
success "  ETL Pipeline Completed Successfully!"
success "  Log saved to: $LOG_FILE"
success "======================================================"

echo ""
echo -e "${GREEN}Next steps:${RESET}"
echo "  cd $PROJECT_DIR/dashboard && npm install && npm start"
echo "  Open: http://localhost:3000"
echo "  Login: admin@medtrack.local / admin123"
