#!/bin/bash
# =============================================================================
# SCRIPT: 03_setup_postgres.sh
# PURPOSE: Configure PostgreSQL for Odoo + BI datamarts
# RUN AS: sudo bash scripts/03_setup_postgres.sh
#
# ARCHITECTURE:
#   We create 2 databases:
#   1. odoo_medtrack   — Odoo's operational database (OLTP)
#      This is where Odoo stores its data: sales orders, products, etc.
#      Tables are managed by Odoo's ORM automatically.
#
#   2. medtrack_dw     — Our Data Warehouse (OLAP)
#      We build this ourselves with star schema tables.
#      Contains: staging tables, dimension tables, fact tables, KPI views.
#
#   OLTP vs OLAP:
#   OLTP (Online Transaction Processing) = fast inserts/updates, normalized
#   OLAP (Online Analytical Processing) = fast reads/aggregations, denormalized
# =============================================================================

set -e

echo "============================================="
echo " MedTrack BI — PostgreSQL Setup"
echo "============================================="

PG_VERSION="15"
ODOO_DB_NAME="odoo_medtrack"
DW_DB_NAME="medtrack_dw"
ODOO_PG_USER="odoo"
BI_PG_USER="bi_reader"

# -----------------------------------------------------------------------------
# STEP 1: Create PostgreSQL user for Odoo
# The 'odoo' PostgreSQL user owns the Odoo database.
# CREATEDB permission is required because Odoo creates databases itself.
# We use --no-superuser for security (principle of least privilege).
# -----------------------------------------------------------------------------
echo "[1/6] Creating PostgreSQL users..."

# Run commands as the postgres system user (default PG admin)
sudo -u postgres psql << 'PSQL'

-- Create Odoo operational user
-- CREATEDB: allows creating databases (Odoo needs this)
-- NOCREATEROLE: cannot create other users (security)
-- NOSUPERUSER: limited privileges
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'odoo') THEN
        CREATE USER odoo WITH
            PASSWORD 'odoo_secure_2024'
            CREATEDB
            NOCREATEROLE
            NOSUPERUSER;
        RAISE NOTICE 'User odoo created';
    ELSE
        RAISE NOTICE 'User odoo already exists';
    END IF;
END$$;

-- Create read-only BI user for the dashboard API
-- This user can only SELECT data from the data warehouse
-- This is best practice: dashboard never writes to DB
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bi_reader') THEN
        CREATE USER bi_reader WITH
            PASSWORD 'bi_reader_2024'
            NOCREATEDB
            NOCREATEROLE
            NOSUPERUSER;
        RAISE NOTICE 'User bi_reader created';
    ELSE
        RAISE NOTICE 'User bi_reader already exists';
    END IF;
END$$;

PSQL

echo " ✅ PostgreSQL users created"

# -----------------------------------------------------------------------------
# STEP 2: Create the Odoo operational database
# This is a standard PostgreSQL database.
# Odoo will populate it with its 300+ tables when it first starts.
# encoding=UTF8: required for Odoo's multi-language support
# lc_collate/ctype: ensures correct text sorting for all locales
# -----------------------------------------------------------------------------
echo "[2/6] Creating Odoo database..."
sudo -u postgres psql << PSQL
SELECT 'CREATE DATABASE $ODOO_DB_NAME
    WITH OWNER = $ODOO_PG_USER
    ENCODING = UTF8
    LC_COLLATE = "en_US.UTF-8"
    LC_CTYPE = "en_US.UTF-8"
    TEMPLATE = template0'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = '$ODOO_DB_NAME'
)\gexec
PSQL
echo " ✅ Odoo database '$ODOO_DB_NAME' ready"

# -----------------------------------------------------------------------------
# STEP 3: Create the Data Warehouse database
# This is OUR database — separate from Odoo.
# We build the star schema here manually.
# Keeping it separate from Odoo is best practice:
#   - Odoo updates don't accidentally affect our warehouse
#   - We can run heavy aggregation queries without slowing Odoo
#   - BI users only need access to this DB, not Odoo's DB
# -----------------------------------------------------------------------------
echo "[3/6] Creating Data Warehouse database..."
sudo -u postgres psql << PSQL
SELECT 'CREATE DATABASE $DW_DB_NAME
    WITH OWNER = postgres
    ENCODING = UTF8
    LC_COLLATE = "en_US.UTF-8"
    LC_CTYPE = "en_US.UTF-8"
    TEMPLATE = template0'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = '$DW_DB_NAME'
)\gexec
PSQL
echo " ✅ Data Warehouse database '$DW_DB_NAME' ready"

# -----------------------------------------------------------------------------
# STEP 4: Create schemas inside the Data Warehouse
# PostgreSQL "schemas" are namespaces inside a database (like folders).
# We organize tables into logical groups:
#
#   staging   — raw data as extracted from sources (dirty, unvalidated)
#   warehouse — cleaned dimension and fact tables (star schema)
#   datamarts — subject-specific views (sales / product / regional)
#   kpi       — materialized views for KPIs (pre-aggregated for speed)
#
# MATERIALIZED VIEW = a view whose query result is physically stored.
# Regular VIEW = query runs every time (slower).
# MATERIALIZED VIEW = query runs once, result cached (much faster for BI).
# -----------------------------------------------------------------------------
echo "[4/6] Creating DW schemas..."
sudo -u postgres psql -d $DW_DB_NAME << 'PSQL'

-- staging: raw imported data (ETL writes here first)
CREATE SCHEMA IF NOT EXISTS staging;

-- warehouse: cleaned star schema (dimensions + facts)
CREATE SCHEMA IF NOT EXISTS warehouse;

-- datamarts: business-domain views derived from warehouse
CREATE SCHEMA IF NOT EXISTS datamarts;

-- kpi: pre-aggregated materialized views for fast dashboard queries
CREATE SCHEMA IF NOT EXISTS kpi;

-- Grant usage on all schemas to bi_reader
GRANT USAGE ON SCHEMA staging, warehouse, datamarts, kpi TO bi_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA datamarts TO bi_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA kpi TO bi_reader;

-- Allow bi_reader access to future tables (important!)
ALTER DEFAULT PRIVILEGES IN SCHEMA datamarts
    GRANT SELECT ON TABLES TO bi_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA kpi
    GRANT SELECT ON TABLES TO bi_reader;

-- Also grant full access to odoo user on staging/warehouse (ETL writes here)
GRANT ALL PRIVILEGES ON SCHEMA staging, warehouse, datamarts, kpi TO odoo;

\echo 'Schemas created successfully'
PSQL

echo " ✅ DW schemas created"

# -----------------------------------------------------------------------------
# STEP 5: Enable useful PostgreSQL extensions
# pg_stat_statements: tracks query performance (useful for optimization)
# uuid-ossp: generates UUIDs (useful for unique keys)
# tablefunc: enables crosstab queries (pivot tables)
# -----------------------------------------------------------------------------
echo "[5/6] Enabling PostgreSQL extensions..."
sudo -u postgres psql -d $DW_DB_NAME << 'PSQL'
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS tablefunc;
\echo 'Extensions enabled'
PSQL

echo " ✅ Extensions enabled"

# -----------------------------------------------------------------------------
# STEP 6: Tune PostgreSQL for BI workloads
# Default PostgreSQL is tuned for small workloads.
# For BI (large reads), we increase memory settings:
#
# shared_buffers: PostgreSQL's own cache (set to 25% of RAM)
# work_mem: memory per sort/hash operation (increase for complex queries)
# maintenance_work_mem: memory for VACUUM, CREATE INDEX, etc.
# effective_cache_size: hints to query planner how much OS cache exists
# max_parallel_workers_per_gather: parallel query workers (use CPU cores)
# wal_level: write-ahead log detail (minimal = less disk I/O for BI)
# -----------------------------------------------------------------------------
echo "[6/6] Tuning PostgreSQL for BI..."
PGCONF="/etc/postgresql/$PG_VERSION/main/postgresql.conf"

# Backup original config
cp $PGCONF ${PGCONF}.bak

# Apply BI-optimized settings
cat >> $PGCONF << 'EOF'

# ==========================================
# MedTrack BI Performance Tuning
# Added by 03_setup_postgres.sh
# ==========================================

# Memory settings (adjust based on your server RAM)
shared_buffers = 512MB          # 25% of RAM for 2GB server
effective_cache_size = 1536MB   # 75% of RAM (tells planner what's available)
work_mem = 32MB                 # Per sort/hash op; multiply by max_connections
maintenance_work_mem = 128MB    # For VACUUM and CREATE INDEX

# Parallel query settings (use CPU cores for large scans)
max_parallel_workers_per_gather = 2
max_parallel_workers = 4
max_parallel_maintenance_workers = 2

# Query planner settings
random_page_cost = 1.1          # Set low for SSD (default 4.0 is for HDD)
effective_io_concurrency = 200  # Concurrent I/O operations (high for SSD)

# Connection settings
max_connections = 100           # Enough for Odoo + ETL + dashboard

# Logging for performance analysis
log_min_duration_statement = 1000  # Log queries slower than 1 second
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
EOF

systemctl restart postgresql
echo " ✅ PostgreSQL tuned and restarted"

echo ""
echo "============================================="
echo " ✅ PostgreSQL setup complete!"
echo ""
echo "  Odoo DB:    $ODOO_DB_NAME  (user: odoo)"
echo "  DW DB:      $DW_DB_NAME   (user: bi_reader)"
echo "  Connect:    psql -U odoo -d $ODOO_DB_NAME"
echo "             psql -U bi_reader -d $DW_DB_NAME"
echo ""
echo " Next: bash scripts/04_download_dataset.sh"
echo "============================================="
