-- ============================================================
-- MedTrack BI — 01_create_dimensions.sql
-- Creates the four dimension tables of the Star Schema
-- inside the 'warehouse' schema of the 'medtrack_dw' database.
-- ============================================================
-- DIMENSION TABLES store descriptive context (who, what, where, when).
-- FACT TABLE (next file) stores measurable events (quantities, amounts).
-- The star schema connects facts to dims via integer foreign keys,
-- enabling fast GROUP BY aggregations in BI queries.
-- ============================================================

-- Switch to the data-warehouse database (run via: psql -d medtrack_dw)
\c medtrack_dw;

-- Create schemas if they don't exist
CREATE SCHEMA IF NOT EXISTS warehouse;  -- Star schema tables
CREATE SCHEMA IF NOT EXISTS datamarts;  -- Materialized view aggregates
CREATE SCHEMA IF NOT EXISTS kpi;        -- KPI summary views

-- ============================================================
-- DIM_DATE — Time dimension
-- Pre-computed calendar attributes avoid expensive date functions
-- in analytical queries (e.g. GROUP BY quarter, fiscal_year).
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouse.dim_date (
    date_key        INTEGER PRIMARY KEY,     -- Surrogate key: YYYYMMDD format (e.g. 20180315)
    full_date       DATE NOT NULL UNIQUE,    -- Actual calendar date
    year            SMALLINT NOT NULL,       -- Calendar year: 2014–2019
    quarter         SMALLINT NOT NULL,       -- 1..4
    quarter_label   VARCHAR(6) NOT NULL,     -- e.g. 'Q1 18'
    month           SMALLINT NOT NULL,       -- 1..12
    month_name      VARCHAR(9) NOT NULL,     -- e.g. 'January'
    month_label     VARCHAR(6) NOT NULL,     -- e.g. 'Jan-18' (for chart labels)
    week_of_year    SMALLINT NOT NULL,       -- ISO week 1..53
    day_of_week     SMALLINT NOT NULL,       -- 1 (Mon) .. 7 (Sun) ISO
    day_name        VARCHAR(9) NOT NULL,     -- e.g. 'Monday'
    is_weekend      BOOLEAN NOT NULL,        -- Saturday or Sunday flag
    fiscal_year     SMALLINT NOT NULL,       -- Fiscal year starting April 1
    fiscal_quarter  SMALLINT NOT NULL,       -- Fiscal quarter (Apr=FQ1)
    season          VARCHAR(6) NOT NULL,     -- 'Spring','Summer','Autumn','Winter'
    is_holiday      BOOLEAN DEFAULT FALSE    -- Extend with holiday calendar if needed
);

-- Populate dim_date for 2014-01-01 to 2019-12-31
-- Uses a generate_series to create one row per calendar day
INSERT INTO warehouse.dim_date
SELECT
    -- date_key: integer YYYYMMDD
    TO_CHAR(d, 'YYYYMMDD')::INTEGER                          AS date_key,
    d::DATE                                                  AS full_date,
    EXTRACT(YEAR    FROM d)::SMALLINT                        AS year,
    EXTRACT(QUARTER FROM d)::SMALLINT                        AS quarter,
    -- quarter_label: 'Q1 14'
    'Q' || EXTRACT(QUARTER FROM d)::TEXT ||
    ' '  || TO_CHAR(d, 'YY')                                AS quarter_label,
    EXTRACT(MONTH   FROM d)::SMALLINT                        AS month,
    TO_CHAR(d, 'Month')                                      AS month_name,
    TO_CHAR(d, 'Mon-YY')                                     AS month_label,
    EXTRACT(WEEK    FROM d)::SMALLINT                        AS week_of_year,
    EXTRACT(ISODOW  FROM d)::SMALLINT                        AS day_of_week,
    TO_CHAR(d, 'Day')                                        AS day_name,
    EXTRACT(ISODOW FROM d) IN (6, 7)                         AS is_weekend,
    -- Fiscal year: April 1 start
    CASE WHEN EXTRACT(MONTH FROM d) >= 4
         THEN EXTRACT(YEAR FROM d)::SMALLINT
         ELSE (EXTRACT(YEAR FROM d) - 1)::SMALLINT END       AS fiscal_year,
    -- Fiscal quarter: Apr=1, Jul=2, Oct=3, Jan=4
    CASE
        WHEN EXTRACT(MONTH FROM d) BETWEEN 4 AND 6  THEN 1
        WHEN EXTRACT(MONTH FROM d) BETWEEN 7 AND 9  THEN 2
        WHEN EXTRACT(MONTH FROM d) BETWEEN 10 AND 12 THEN 3
        ELSE 4
    END::SMALLINT                                            AS fiscal_quarter,
    -- Season (Northern Hemisphere)
    CASE
        WHEN EXTRACT(MONTH FROM d) IN (3,4,5)   THEN 'Spring'
        WHEN EXTRACT(MONTH FROM d) IN (6,7,8)   THEN 'Summer'
        WHEN EXTRACT(MONTH FROM d) IN (9,10,11) THEN 'Autumn'
        ELSE 'Winter'
    END                                                      AS season,
    FALSE                                                    AS is_holiday
FROM generate_series('2014-01-01'::DATE, '2019-12-31'::DATE, '1 day') AS g(d)
ON CONFLICT (date_key) DO NOTHING;  -- Idempotent: safe to re-run

-- ============================================================
-- DIM_PRODUCT — Drug / product dimension
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouse.dim_product (
    product_key     SERIAL PRIMARY KEY,          -- Surrogate key
    atc_code        VARCHAR(7)  NOT NULL,         -- ATC level-4 code
    drug_name       VARCHAR(100) NOT NULL,        -- Generic drug name
    atc_category    VARCHAR(80) NOT NULL,         -- Human-readable ATC category
    drug_type       VARCHAR(3) NOT NULL,          -- 'rx' or 'otc'
    unit_price      NUMERIC(10,2) NOT NULL,       -- Selling price per unit
    cost_price      NUMERIC(10,2) NOT NULL,       -- COGS (65% of unit_price)
    margin_pct      NUMERIC(5,2)  NOT NULL,       -- Gross margin %
    is_active       BOOLEAN DEFAULT TRUE,
    -- SCD Type 2 columns (Slowly Changing Dimensions)
    -- Allow tracking price changes over time
    effective_from  DATE DEFAULT CURRENT_DATE,
    effective_to    DATE DEFAULT '9999-12-31',    -- Open-ended: still current
    is_current      BOOLEAN DEFAULT TRUE
);

-- Seed the product dimension with the 8 ATC drug categories
INSERT INTO warehouse.dim_product
    (atc_code, drug_name, atc_category, drug_type, unit_price, cost_price, margin_pct)
VALUES
    ('M01AB', 'Diclofenac',    'Anti-inflammatory (Acetic acid)',  'rx',  12.50,  8.13, 35.0),
    ('M01AE', 'Ibuprofen',     'Anti-inflammatory (Propionic)',    'otc',  8.75,  5.69, 35.0),
    ('N02BA', 'Aspirin',       'Analgesic (Salicylic acid)',       'otc',  4.20,  2.73, 35.0),
    ('N02BE', 'Paracetamol',   'Analgesic (Anilide)',              'otc',  3.80,  2.47, 35.0),
    ('N05B',  'Lorazepam',     'Anxiolytic (Benzodiazepine)',      'rx',  18.90, 12.29, 35.0),
    ('N05C',  'Zolpidem',      'Hypnotic / Sedative',             'rx',  22.40, 14.56, 35.0),
    ('R03',   'Salbutamol',    'Respiratory / Obstructive disease','rx',  27.60, 17.94, 35.0),
    ('R06',   'Cetirizine',    'Antihistamine',                   'otc',  9.30,  6.05, 35.0)
ON CONFLICT DO NOTHING;

-- ============================================================
-- DIM_REGION — Geographic / territory dimension
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouse.dim_region (
    region_key      SERIAL PRIMARY KEY,
    region_name     VARCHAR(50) NOT NULL,      -- e.g. 'North', 'South East'
    country         VARCHAR(50) DEFAULT 'USA',
    time_zone       VARCHAR(40),               -- For multi-timezone analysis
    population_m    NUMERIC(6,2),              -- Regional population (millions)
    -- Hierarchy: region → division → country
    division        VARCHAR(50),               -- Census division (expandable)
    is_urban        BOOLEAN DEFAULT TRUE
);

INSERT INTO warehouse.dim_region (region_name, division, population_m, time_zone)
VALUES
    ('North East',   'New England',     56.1, 'America/New_York'),
    ('North West',   'Pacific Northwest',14.3, 'America/Los_Angeles'),
    ('South East',   'South Atlantic',  67.4, 'America/New_York'),
    ('South West',   'Mountain',        23.8, 'America/Denver'),
    ('Midwest',      'East North Central',68.2,'America/Chicago'),
    ('West Coast',   'Pacific',         53.6, 'America/Los_Angeles'),
    ('Central',      'West South Central',40.1,'America/Chicago'),
    ('Mountain',     'Mountain',        12.4, 'America/Denver')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DIM_CUSTOMER — Customer segment dimension
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouse.dim_customer (
    customer_key    SERIAL PRIMARY KEY,
    customer_type   VARCHAR(30) NOT NULL,    -- 'Hospital', 'Pharmacy Chain', etc.
    segment         VARCHAR(20) NOT NULL,    -- 'B2B' or 'B2C'
    size_category   VARCHAR(10),             -- 'Large', 'Medium', 'Small'
    payment_terms   VARCHAR(20),             -- 'Net-30', 'Net-60', 'COD'
    loyalty_tier    VARCHAR(10)              -- 'Gold', 'Silver', 'Bronze'
);

INSERT INTO warehouse.dim_customer (customer_type, segment, size_category, payment_terms, loyalty_tier)
VALUES
    ('Hospital',          'B2B', 'Large',  'Net-60', 'Gold'),
    ('Pharmacy Chain',    'B2B', 'Large',  'Net-30', 'Gold'),
    ('Independent Pharmacy','B2B','Medium','Net-30', 'Silver'),
    ('Clinic',            'B2B', 'Medium', 'Net-30', 'Silver'),
    ('Online Retailer',   'B2C', 'Large',  'Net-15', 'Bronze'),
    ('Wholesale Distributor','B2B','Large','Net-60', 'Gold'),
    ('Urgent Care',       'B2B', 'Small',  'COD',    'Bronze'),
    ('Government/Tender', 'B2B', 'Large',  'Net-90', 'Gold')
ON CONFLICT DO NOTHING;

-- Performance indexes on foreign key columns
CREATE INDEX IF NOT EXISTS idx_dim_date_year    ON warehouse.dim_date(year);
CREATE INDEX IF NOT EXISTS idx_dim_date_month   ON warehouse.dim_date(year, month);
CREATE INDEX IF NOT EXISTS idx_dim_product_atc  ON warehouse.dim_product(atc_code);
CREATE INDEX IF NOT EXISTS idx_dim_region_name  ON warehouse.dim_region(region_name);
