"""
load_datamart.py
================
Loads the transformed star schema tables into the PostgreSQL data warehouse.

LOADING STRATEGY:
  1. Create all tables with DDL (if they don't exist)
  2. Truncate + reload dimensions (small tables, fast)
  3. Append or replace fact table (large table, use chunks)

SQLALCHEMY vs psycopg2:
  psycopg2: low-level PostgreSQL driver (direct SQL execution)
  SQLAlchemy: ORM + connection pooling, works with pandas .to_sql()
  We use SQLAlchemy here because pandas .to_sql() requires it,
  but we also use psycopg2 directly for DDL statements.

CONNECTION STRING FORMAT:
  postgresql://user:password@host:port/database
  postgresql://odoo:odoo_secure_2024@localhost:5432/medtrack_dw
"""

import pandas as pd
import psycopg2
import sqlalchemy
from sqlalchemy import create_engine, text
import os
import sys

# =============================================================================
# DATABASE CONNECTION CONFIGURATION
# In production, store these in environment variables (.env file).
# Never hardcode passwords in source code pushed to version control.
# =============================================================================
DB_CONFIG = {
    "host": os.getenv("DW_HOST", "localhost"),
    "port": int(os.getenv("DW_PORT", "5432")),
    "database": os.getenv("DW_DB", "medtrack_dw"),
    "user": os.getenv("DW_USER", "odoo"),          # ETL user (read/write)
    "password": os.getenv("DW_PASS", "odoo_secure_2024"),
}

def get_engine():
    """
    Create a SQLAlchemy engine (connection pool) to PostgreSQL.
    
    SQLAlchemy engine manages a pool of connections.
    Pool size = number of simultaneous connections to keep open.
    This avoids the overhead of opening/closing a connection per query.
    
    The connection string format is:
    dialect+driver://user:password@host:port/database
    """
    conn_str = (
        f"postgresql+psycopg2://"
        f"{DB_CONFIG['user']}:{DB_CONFIG['password']}"
        f"@{DB_CONFIG['host']}:{DB_CONFIG['port']}"
        f"/{DB_CONFIG['database']}"
    )
    # pool_size: keep 5 connections open at all times
    # max_overflow: allow up to 10 extra connections under load
    engine = create_engine(conn_str, pool_size=5, max_overflow=10)
    return engine


# =============================================================================
# DDL: CREATE TABLE STATEMENTS
# DDL = Data Definition Language (CREATE, ALTER, DROP).
# We use IF NOT EXISTS so re-running is safe (idempotent).
# =============================================================================

DDL_DIM_DATE = """
-- Dimension: Date/Time
-- One row per unique date + hour combination.
-- Surrogate key: date_key (YYYYMMDD integer for fast joins)
CREATE TABLE IF NOT EXISTS warehouse.dim_date (
    date_key        INTEGER PRIMARY KEY,    -- e.g. 20140115
    full_date       TIMESTAMP,              -- Full datetime
    year            SMALLINT NOT NULL,      -- 2014-2019
    quarter         SMALLINT NOT NULL,      -- 1-4
    month_num       SMALLINT NOT NULL,      -- 1-12
    month_name      VARCHAR(10) NOT NULL,   -- January, February, ...
    week_of_year    SMALLINT NOT NULL,      -- ISO week number (1-53)
    day_of_week     SMALLINT NOT NULL,      -- 0=Monday, 6=Sunday
    day_name        VARCHAR(10) NOT NULL,   -- Monday, ..., Sunday
    is_weekend      BOOLEAN NOT NULL,       -- TRUE for Saturday/Sunday
    season          VARCHAR(10) NOT NULL    -- Winter, Spring, Summer, Autumn
);
"""

DDL_DIM_PRODUCT = """
-- Dimension: Pharmaceutical Product
-- One row per drug product (8 drugs total).
-- Natural key: product_key (ATC code, e.g. M01AB)
CREATE TABLE IF NOT EXISTS warehouse.dim_product (
    product_key         VARCHAR(10) PRIMARY KEY,  -- ATC code (e.g. M01AB)
    drug_name           VARCHAR(100) NOT NULL,     -- Full name (e.g. Diclofenac)
    drug_category       VARCHAR(100) NOT NULL,     -- Therapeutic category
    atc_level1          VARCHAR(50) NOT NULL,      -- ATC Level 1: body system
    is_prescription     BOOLEAN NOT NULL,          -- TRUE = Rx only
    drug_form           VARCHAR(20) NOT NULL,      -- Tablet, Inhaler, etc.
    avg_price           NUMERIC(10,2) NOT NULL     -- Average price in EUR
);
"""

DDL_DIM_REGION = """
-- Dimension: Geographic Region
-- 5 regions: North, South, East, West, Central
CREATE TABLE IF NOT EXISTS warehouse.dim_region (
    region_key      SERIAL PRIMARY KEY,         -- Auto-increment surrogate key
    region_name     VARCHAR(50) UNIQUE NOT NULL -- Region name
);
"""

DDL_DIM_CUSTOMER = """
-- Dimension: Customer Channel / Type
-- How the drug was sold (hospital, retail pharmacy, online, etc.)
CREATE TABLE IF NOT EXISTS warehouse.dim_customer (
    customer_key    SERIAL PRIMARY KEY,
    customer_type   VARCHAR(50) UNIQUE NOT NULL  -- Hospital, Retail, etc.
);
"""

DDL_FACT_SALES = """
-- Central FACT TABLE: Individual Sales Transactions
-- This is the largest table. Each row = one drug sale event.
-- All foreign keys reference dimension tables (star schema).
-- Measures: the numbers we analyze (quantity, revenue, profit, margin)
CREATE TABLE IF NOT EXISTS warehouse.fact_sales (
    fact_id             BIGSERIAL PRIMARY KEY,
    
    -- FOREIGN KEYS to dimension tables
    date_key            INTEGER NOT NULL REFERENCES warehouse.dim_date(date_key),
    product_key         VARCHAR(10) NOT NULL REFERENCES warehouse.dim_product(product_key),
    region_key          INTEGER NOT NULL REFERENCES warehouse.dim_region(region_key),
    customer_key        INTEGER NOT NULL REFERENCES warehouse.dim_customer(customer_key),
    
    -- DEGENERATE DIMENSION (stored here, no separate table)
    salesperson_id      VARCHAR(10),
    
    -- MEASURES (the numbers we aggregate in queries)
    quantity_sold       NUMERIC(12,2) NOT NULL,  -- Units sold
    unit_price          NUMERIC(10,2) NOT NULL,  -- Price per unit (EUR)
    revenue             NUMERIC(14,2) NOT NULL,  -- Total revenue (EUR)
    cost                NUMERIC(14,2) NOT NULL,  -- Estimated cost (EUR)
    gross_profit        NUMERIC(14,2) NOT NULL,  -- Revenue - Cost (EUR)
    gross_margin_pct    NUMERIC(5,1),             -- Gross profit %
    
    -- DATA QUALITY FLAG
    is_outlier          BOOLEAN DEFAULT FALSE
);

-- INDEXES: Speed up common query patterns
-- Without indexes, every query scans the entire table.
-- With indexes, queries jump directly to relevant rows.

-- Time-based queries (most common in BI) need date index
CREATE INDEX IF NOT EXISTS idx_fact_sales_date
    ON warehouse.fact_sales(date_key);

-- Product performance queries need product index
CREATE INDEX IF NOT EXISTS idx_fact_sales_product
    ON warehouse.fact_sales(product_key);

-- Regional analysis needs region index
CREATE INDEX IF NOT EXISTS idx_fact_sales_region
    ON warehouse.fact_sales(region_key);

-- Composite index for the most common join pattern
CREATE INDEX IF NOT EXISTS idx_fact_sales_date_product
    ON warehouse.fact_sales(date_key, product_key);
"""


def create_warehouse_tables(engine):
    """
    Execute DDL to create all star schema tables.
    
    We wrap each DDL in a transaction so if one fails, we can see exactly where.
    text() wraps raw SQL strings for SQLAlchemy execution.
    """
    print("\n[1/4] Creating warehouse tables...")
    
    ddl_statements = [
        ("dim_date", DDL_DIM_DATE),
        ("dim_product", DDL_DIM_PRODUCT),
        ("dim_region", DDL_DIM_REGION),
        ("dim_customer", DDL_DIM_CUSTOMER),
        ("fact_sales", DDL_FACT_SALES),
    ]
    
    with engine.begin() as conn:  # begin() creates an auto-commit transaction
        # Set search_path so we can use schema-qualified names
        conn.execute(text("SET search_path TO warehouse, public"))
        
        for table_name, ddl in ddl_statements:
            try:
                conn.execute(text(ddl))
                print(f"  ✅ {table_name} ready")
            except Exception as e:
                print(f"  ❌ Error creating {table_name}: {e}")
                raise


def load_dimension(engine, df: pd.DataFrame, table_name: str, schema: str = "warehouse"):
    """
    Load a dimension table using TRUNCATE + INSERT strategy.
    
    For small dimension tables (< 10k rows), it's safe and simple to:
    1. TRUNCATE: delete all existing rows
    2. INSERT: reload all rows from the DataFrame
    
    This ensures dimension tables are always current with the latest data.
    CASCADE: also truncates tables that reference this one (fact tables).
    We do NOT cascade here to avoid accidentally clearing fact data.
    
    pandas .to_sql() parameters:
    - name: table name
    - con: SQLAlchemy connection/engine
    - schema: PostgreSQL schema name
    - if_exists='append': add to existing table (we truncated it above)
    - index=False: don't write the DataFrame index as a column
    - method='multi': batch insert (much faster than row-by-row)
    - chunksize: rows per INSERT statement (optimal ~1000-5000)
    """
    print(f"  Loading {schema}.{table_name} ({len(df):,} rows)...")
    
    with engine.begin() as conn:
        # TRUNCATE removes all rows efficiently (faster than DELETE)
        conn.execute(text(f"TRUNCATE TABLE {schema}.{table_name} RESTART IDENTITY"))
    
    # Load DataFrame into PostgreSQL using pandas
    df.to_sql(
        name=table_name,
        con=engine,
        schema=schema,
        if_exists="append",  # Table already exists (we created it above)
        index=False,
        method="multi",      # Batch inserts
        chunksize=2000,
    )
    print(f"  ✅ {table_name}: {len(df):,} rows loaded")


def load_fact_table(engine, fact_df: pd.DataFrame, schema: str = "warehouse"):
    """
    Load the fact table in chunks.
    
    The fact table can be millions of rows, so we:
    1. Truncate existing data
    2. Load in chunks of 50k rows (avoids memory issues + gives progress feedback)
    
    CHUNK LOADING STRATEGY:
    Loading all rows at once = high memory usage + long transaction lock time.
    Chunked loading = lower memory, progress visible, easier to resume on error.
    """
    table_name = "fact_sales"
    total_rows = len(fact_df)
    chunk_size = 50000  # 50k rows per batch
    
    print(f"  Loading {schema}.{table_name} ({total_rows:,} rows in chunks of {chunk_size:,})...")
    
    # Truncate fact table before reload
    with engine.begin() as conn:
        conn.execute(text(f"TRUNCATE TABLE {schema}.{table_name} RESTART IDENTITY"))
    
    # Load in chunks
    chunks = range(0, total_rows, chunk_size)
    for i, start in enumerate(chunks):
        chunk = fact_df.iloc[start : start + chunk_size]  # Slice DataFrame
        
        chunk.to_sql(
            name=table_name,
            con=engine,
            schema=schema,
            if_exists="append",
            index=False,
            method="multi",
            chunksize=5000,
        )
        
        loaded = min(start + chunk_size, total_rows)
        pct = loaded / total_rows * 100
        print(f"  Progress: {loaded:,}/{total_rows:,} rows ({pct:.0f}%)")
    
    print(f"  ✅ fact_sales: {total_rows:,} rows loaded")


def run_post_load_verification(engine):
    """
    Verify the load was successful by querying row counts and sample data.
    This is essential in any production ETL pipeline.
    """
    print("\n[4/4] Running post-load verification...")
    
    tables = [
        "warehouse.dim_date",
        "warehouse.dim_product",
        "warehouse.dim_region",
        "warehouse.dim_customer",
        "warehouse.fact_sales",
    ]
    
    with engine.connect() as conn:
        for table in tables:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.scalar()  # .scalar() returns single value
            print(f"  {table}: {count:,} rows")
        
        # Test a simple aggregation query
        test_query = """
            SELECT
                dp.drug_name,
                SUM(fs.revenue) AS total_revenue,
                SUM(fs.quantity_sold) AS total_units
            FROM warehouse.fact_sales fs
            JOIN warehouse.dim_product dp ON fs.product_key = dp.product_key
            GROUP BY dp.drug_name
            ORDER BY total_revenue DESC
            LIMIT 3
        """
        result = conn.execute(text(test_query))
        print("\n  Top 3 drugs by revenue:")
        for row in result:
            print(f"    {row[0]}: €{row[1]:,.0f} ({row[2]:,.0f} units)")


def run_load(transformed_dir: str):
    """
    Main load pipeline:
    1. Read transformed CSV files
    2. Create warehouse tables
    3. Load dimensions
    4. Load fact table
    5. Verify
    """
    print("\n" + "=" * 60)
    print("  MedTrack BI — ETL Load Stage (→ PostgreSQL Data Warehouse)")
    print("=" * 60)
    
    # ── READ TRANSFORMED DATA ─────────────────────────────────────────────────
    print("\n[0/4] Reading transformed data...")
    
    tables_to_load = {
        "dim_date": None,
        "dim_product": None,
        "dim_region": None,
        "dim_customer": None,
        "fact_sales": None,
    }
    
    for table_name in tables_to_load:
        path = os.path.join(transformed_dir, f"{table_name}.csv")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Missing: {path}. Run transform first.")
        tables_to_load[table_name] = pd.read_csv(path)
        print(f"  Loaded {table_name}: {len(tables_to_load[table_name]):,} rows")
    
    # ── CONNECT TO DATABASE ───────────────────────────────────────────────────
    engine = get_engine()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("\n  ✅ Database connection successful")
    except Exception as e:
        print(f"\n  ❌ Database connection failed: {e}")
        print("  Check your PostgreSQL credentials and that the DB is running.")
        sys.exit(1)
    
    # ── EXECUTE LOAD ──────────────────────────────────────────────────────────
    print("\n[1/4] Creating warehouse tables...")
    create_warehouse_tables(engine)
    
    print("\n[2/4] Loading dimension tables...")
    for dim_name in ["dim_date", "dim_product", "dim_region", "dim_customer"]:
        load_dimension(engine, tables_to_load[dim_name], dim_name)
    
    print("\n[3/4] Loading fact table...")
    load_fact_table(engine, tables_to_load["fact_sales"])
    
    # ── VERIFY ────────────────────────────────────────────────────────────────
    run_post_load_verification(engine)
    
    engine.dispose()  # Close all connections in the pool
    
    print("\n" + "=" * 60)
    print("  ✅ Load complete! Data warehouse is ready.")
    print("=" * 60)


if __name__ == "__main__":
    transformed_dir = sys.argv[1] if len(sys.argv) > 1 else "./data/transformed"
    run_load(transformed_dir)
