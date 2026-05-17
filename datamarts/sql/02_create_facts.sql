-- ============================================================
-- MedTrack BI — 02_create_facts.sql
-- Creates the central FACT TABLE in the Star Schema.
-- ============================================================
-- FACT TABLE: fact_sales
-- The fact table is the heart of the star schema.
-- It stores one row per sale transaction and contains:
--   • Foreign keys → dimension tables (the "rays of the star")
--   • Additive measures → quantities and amounts that can be
--     SUM'd, AVG'd, or aggregated at any granularity
-- ============================================================
-- Grain: 1 row = 1 hourly drug sale (as in the Kaggle dataset)
-- ============================================================

\c medtrack_dw;

CREATE TABLE IF NOT EXISTS warehouse.fact_sales (
    -- ---- Surrogate key (auto-generated, never exposed to users) ----------
    sale_id         BIGSERIAL PRIMARY KEY,

    -- ---- Dimension foreign keys (the "star points") ---------------------
    -- These reference the surrogate keys in dimension tables, NOT natural keys.
    -- Integer joins are dramatically faster than text/varchar joins.
    date_key        INTEGER     NOT NULL
        REFERENCES warehouse.dim_date(date_key)
        ON DELETE RESTRICT,        -- Prevent orphaned facts

    product_key     INTEGER     NOT NULL
        REFERENCES warehouse.dim_product(product_key)
        ON DELETE RESTRICT,

    region_key      INTEGER     NOT NULL
        REFERENCES warehouse.dim_region(region_key)
        ON DELETE RESTRICT,

    customer_key    INTEGER     NOT NULL
        REFERENCES warehouse.dim_customer(customer_key)
        ON DELETE RESTRICT,

    -- ---- Degenerate dimension (no separate dim table needed) ------------
    -- These low-cardinality text fields live directly in the fact table.
    salesperson_id  VARCHAR(20),      -- e.g. 'SP-042'
    order_id        VARCHAR(30),      -- Source system order reference

    -- ---- Measures (all additive — can be safely SUM'd) ------------------
    quantity        NUMERIC(10, 2) NOT NULL CHECK (quantity >= 0),
        -- Units sold (hourly from dataset). Fractional for bulk packs.

    unit_price      NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
        -- Price at time of sale (may differ from dim_product if price changed)

    revenue         NUMERIC(12, 2) NOT NULL,
        -- quantity × unit_price. Pre-computed for query performance.

    cost            NUMERIC(12, 2) NOT NULL,
        -- quantity × cost_price (65% COGS). Pre-computed.

    gross_profit    NUMERIC(12, 2) NOT NULL,
        -- revenue − cost. Core profitability measure.

    discount_pct    NUMERIC(5, 2) DEFAULT 0,
        -- Discount applied (0–100%). Zero for this dataset.

    -- ---- Audit columns --------------------------------------------------
    load_timestamp  TIMESTAMP DEFAULT NOW(),
        -- When the ETL loaded this row → supports incremental refresh
    source_system   VARCHAR(20) DEFAULT 'kaggle_pharma'
        -- Where the data came from → traceability
)
-- Partitioning by year improves query performance for date-range scans.
-- PostgreSQL will prune partitions automatically when year is in the WHERE clause.
PARTITION BY RANGE (date_key);

-- ---- Create yearly partitions 2014–2019 --------------------------------
-- Each partition stores one year of data. PostgreSQL checks which partitions
-- satisfy the WHERE clause and skips the rest (partition pruning).
CREATE TABLE IF NOT EXISTS warehouse.fact_sales_2014
    PARTITION OF warehouse.fact_sales
    FOR VALUES FROM (20140101) TO (20150101);

CREATE TABLE IF NOT EXISTS warehouse.fact_sales_2015
    PARTITION OF warehouse.fact_sales
    FOR VALUES FROM (20150101) TO (20160101);

CREATE TABLE IF NOT EXISTS warehouse.fact_sales_2016
    PARTITION OF warehouse.fact_sales
    FOR VALUES FROM (20160101) TO (20170101);

CREATE TABLE IF NOT EXISTS warehouse.fact_sales_2017
    PARTITION OF warehouse.fact_sales
    FOR VALUES FROM (20170101) TO (20180101);

CREATE TABLE IF NOT EXISTS warehouse.fact_sales_2018
    PARTITION OF warehouse.fact_sales
    FOR VALUES FROM (20180101) TO (20190101);

CREATE TABLE IF NOT EXISTS warehouse.fact_sales_2019
    PARTITION OF warehouse.fact_sales
    FOR VALUES FROM (20190101) TO (20200101);

-- ---- Indexes for analytical query patterns ----------------------------
-- 1. Date range scans (most common BI pattern: "last N months")
CREATE INDEX IF NOT EXISTS idx_fact_date_key
    ON warehouse.fact_sales (date_key);

-- 2. Product drill-down ("show me all sales for Ibuprofen")
CREATE INDEX IF NOT EXISTS idx_fact_product_key
    ON warehouse.fact_sales (product_key);

-- 3. Regional analysis
CREATE INDEX IF NOT EXISTS idx_fact_region_key
    ON warehouse.fact_sales (region_key);

-- 4. Combined date+product (most selective, used by datamarts)
CREATE INDEX IF NOT EXISTS idx_fact_date_product
    ON warehouse.fact_sales (date_key, product_key);

-- 5. Salesperson performance reports
CREATE INDEX IF NOT EXISTS idx_fact_salesperson
    ON warehouse.fact_sales (salesperson_id);

-- ---- Verification query -----------------------------------------------
-- After ETL loads data, run this to confirm the star schema is consistent:
-- SELECT
--     COUNT(*)                             AS total_rows,
--     COUNT(DISTINCT date_key)             AS distinct_dates,
--     COUNT(DISTINCT product_key)          AS distinct_products,
--     MIN(date_key)                        AS earliest_sale,
--     MAX(date_key)                        AS latest_sale,
--     ROUND(SUM(revenue)::NUMERIC, 2)      AS total_revenue,
--     ROUND(AVG(gross_profit/revenue)*100, 2) AS avg_margin_pct
-- FROM warehouse.fact_sales;

COMMENT ON TABLE warehouse.fact_sales IS
    'Central fact table — grain: one row per hourly drug sale transaction, 2014–2019.';
COMMENT ON COLUMN warehouse.fact_sales.date_key IS
    'FK → dim_date.date_key (YYYYMMDD integer surrogate key).';
COMMENT ON COLUMN warehouse.fact_sales.revenue IS
    'Pre-computed: quantity × unit_price. Additive measure.';
