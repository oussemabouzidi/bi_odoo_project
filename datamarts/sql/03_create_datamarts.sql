-- =============================================================================
-- FILE: 03_create_datamarts.sql
-- PURPOSE: Create 3 subject-area datamarts as PostgreSQL views/mat-views
--
-- WHAT IS A DATAMART?
--   A datamart is a subset of the data warehouse focused on a specific
--   business domain or subject area. It pre-joins dimensions with facts
--   and pre-calculates common aggregations for faster BI queries.
--
--   Unlike the raw star schema (which is normalized for loading),
--   datamarts are DENORMALIZED for analysis — they join everything
--   together so analysts don't need complex SQL.
--
-- 3 DATAMARTS:
--   1. dm_sales_performance   → Revenue, volume, margin by time & drug
--   2. dm_product_analysis    → Product mix, growth, prescription vs OTC
--   3. dm_regional_intelligence → Geographic distribution, region KPIs
--
-- MATERIALIZED VIEWS:
--   We use MATERIALIZED VIEW (not regular VIEW) for performance.
--   Regular VIEW: SQL runs every time → slow for dashboards
--   Materialized VIEW: SQL runs once, result stored → fast reads
--   Refresh with: REFRESH MATERIALIZED VIEW CONCURRENTLY <view_name>;
-- =============================================================================

SET search_path TO datamarts, warehouse, public;


-- =============================================================================
-- DATAMART 1: SALES PERFORMANCE
-- Focus: Revenue trends, sales volume, profitability over time
-- Used by: Finance team, Sales management, Executive dashboard
--
-- GRAIN: One row per (year, quarter, month, drug_category)
-- MEASURES: total_revenue, total_units, avg_price, gross_profit, margin
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS datamarts.dm_sales_performance;

CREATE MATERIALIZED VIEW datamarts.dm_sales_performance AS
SELECT
    -- TIME ATTRIBUTES (from dim_date)
    d.year,
    d.quarter,
    d.month_num,
    d.month_name,
    d.season,
    
    -- PRODUCT ATTRIBUTES (from dim_product)
    p.product_key          AS drug_code,
    p.drug_name,
    p.drug_category,
    p.atc_level1           AS therapeutic_area,
    p.is_prescription,
    
    -- AGGREGATED MEASURES
    -- COUNT(*): total number of sales transactions
    COUNT(*)               AS transaction_count,
    
    -- SUM(quantity_sold): total units sold in this period
    SUM(f.quantity_sold)   AS total_units_sold,
    
    -- SUM(revenue): total revenue (units × price)
    SUM(f.revenue)         AS total_revenue,
    
    -- AVG(unit_price): average selling price per unit
    AVG(f.unit_price)      AS avg_unit_price,
    
    -- SUM(gross_profit): total profit after estimated cost
    SUM(f.gross_profit)    AS total_gross_profit,
    
    -- Gross margin: profit / revenue as a percentage
    -- NULLIF prevents division by zero
    ROUND(
        SUM(f.gross_profit) / NULLIF(SUM(f.revenue), 0) * 100,
        2
    )                      AS gross_margin_pct,
    
    -- Month-over-Month growth rate (using LAG window function)
    -- LAG(col) OVER (PARTITION BY ... ORDER BY ...):
    --   Returns the value from the PREVIOUS row in the window.
    --   PARTITION BY: restart the window for each drug
    --   ORDER BY: define what "previous" means
    ROUND(
        (SUM(f.revenue) - LAG(SUM(f.revenue)) OVER (
            PARTITION BY p.product_key
            ORDER BY d.year, d.month_num
        )) / NULLIF(LAG(SUM(f.revenue)) OVER (
            PARTITION BY p.product_key
            ORDER BY d.year, d.month_num
        ), 0) * 100,
        2
    )                      AS mom_revenue_growth_pct   -- Month-over-Month %

FROM warehouse.fact_sales f

-- JOIN dim_date to get time attributes
INNER JOIN warehouse.dim_date d ON f.date_key = d.date_key

-- JOIN dim_product to get drug attributes
INNER JOIN warehouse.dim_product p ON f.product_key = p.product_key

-- Exclude outlier data points from BI calculations
WHERE f.is_outlier = FALSE

GROUP BY
    d.year, d.quarter, d.month_num, d.month_name, d.season,
    p.product_key, p.drug_name, p.drug_category, p.atc_level1, p.is_prescription

ORDER BY d.year, d.month_num, total_revenue DESC;

-- Index on the materialized view for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_dm_sales_year_month
    ON datamarts.dm_sales_performance(year, month_num);

CREATE INDEX IF NOT EXISTS idx_dm_sales_drug
    ON datamarts.dm_sales_performance(drug_code);

COMMENT ON MATERIALIZED VIEW datamarts.dm_sales_performance IS
    'Sales Performance Datamart: Monthly sales metrics per drug. Refresh: REFRESH MATERIALIZED VIEW CONCURRENTLY datamarts.dm_sales_performance;';


-- =============================================================================
-- DATAMART 2: PRODUCT ANALYSIS
-- Focus: Product portfolio, category mix, prescription vs OTC split,
--        product-level growth trends and rankings
-- Used by: Product managers, Procurement, Marketing
--
-- GRAIN: One row per (year, drug, customer_channel)
-- MEASURES: market share, growth rate, OTC/Rx split, peak season
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS datamarts.dm_product_analysis;

CREATE MATERIALIZED VIEW datamarts.dm_product_analysis AS
WITH

-- CTE 1: Total revenue per year (for market share calculation)
-- CTE = Common Table Expression: a named subquery used in the main query
-- Gives us the "denominator" for market share percentage
yearly_totals AS (
    SELECT
        d.year,
        SUM(f.revenue) AS total_market_revenue
    FROM warehouse.fact_sales f
    INNER JOIN warehouse.dim_date d ON f.date_key = d.date_key
    WHERE f.is_outlier = FALSE
    GROUP BY d.year
),

-- CTE 2: Drug-level metrics per year
product_yearly AS (
    SELECT
        d.year,
        p.product_key      AS drug_code,
        p.drug_name,
        p.drug_category,
        p.atc_level1       AS therapeutic_area,
        p.is_prescription,
        p.drug_form,
        p.avg_price        AS list_price,
        c.customer_type    AS channel,
        
        -- Volume metrics
        SUM(f.quantity_sold)  AS total_units,
        SUM(f.revenue)        AS total_revenue,
        SUM(f.gross_profit)   AS total_profit,
        
        -- Average transaction size (how many units per sale on average)
        AVG(f.quantity_sold)  AS avg_units_per_transaction,
        
        -- Price realization: actual price vs list price
        ROUND(AVG(f.unit_price) / NULLIF(p.avg_price, 0) * 100, 1)
                              AS price_realization_pct
    FROM warehouse.fact_sales f
    INNER JOIN warehouse.dim_date d ON f.date_key = d.date_key
    INNER JOIN warehouse.dim_product p ON f.product_key = p.product_key
    INNER JOIN warehouse.dim_customer c ON f.customer_key = c.customer_key
    WHERE f.is_outlier = FALSE
    GROUP BY d.year, p.product_key, p.drug_name, p.drug_category,
             p.atc_level1, p.is_prescription, p.drug_form, p.avg_price,
             c.customer_type
)

SELECT
    py.*,
    
    -- MARKET SHARE: this drug's revenue / total market revenue × 100
    ROUND(py.total_revenue / NULLIF(yt.total_market_revenue, 0) * 100, 2)
                        AS market_share_pct,
    
    -- YEAR-OVER-YEAR GROWTH using LAG window function
    -- We look at the previous year's revenue for the same drug + channel
    LAG(py.total_revenue) OVER (
        PARTITION BY py.drug_code, py.channel
        ORDER BY py.year
    )                   AS prev_year_revenue,
    
    ROUND(
        (py.total_revenue - LAG(py.total_revenue) OVER (
            PARTITION BY py.drug_code, py.channel ORDER BY py.year
        )) / NULLIF(LAG(py.total_revenue) OVER (
            PARTITION BY py.drug_code, py.channel ORDER BY py.year
        ), 0) * 100,
        2
    )                   AS yoy_growth_pct,    -- Year-over-Year growth %
    
    -- RANKING: Rank drugs by revenue within each year
    -- RANK(): drugs with equal revenue get the same rank
    -- DENSE_RANK(): no gaps in ranking (1,2,2,3 not 1,2,2,4)
    DENSE_RANK() OVER (
        PARTITION BY py.year
        ORDER BY py.total_revenue DESC
    )                   AS revenue_rank,
    
    -- Prescription vs OTC label (for easier dashboard filtering)
    CASE WHEN py.is_prescription THEN 'Prescription (Rx)'
         ELSE 'Over-the-Counter (OTC)'
    END                 AS rx_otc_label

FROM product_yearly py

-- Join the yearly totals for market share calculation
INNER JOIN yearly_totals yt ON py.year = yt.year

ORDER BY py.year DESC, py.total_revenue DESC;

CREATE INDEX IF NOT EXISTS idx_dm_product_year
    ON datamarts.dm_product_analysis(year);

CREATE INDEX IF NOT EXISTS idx_dm_product_drug
    ON datamarts.dm_product_analysis(drug_code);

COMMENT ON MATERIALIZED VIEW datamarts.dm_product_analysis IS
    'Product Analysis Datamart: Drug portfolio metrics, market share, growth by year and channel.';


-- =============================================================================
-- DATAMART 3: REGIONAL INTELLIGENCE
-- Focus: Geographic performance, region rankings, territory analysis
-- Used by: Regional sales managers, Executive dashboard, HR (salesperson perf)
--
-- GRAIN: One row per (year, quarter, region, drug_category)
-- MEASURES: regional revenue, regional market share, salesperson performance
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS datamarts.dm_regional_intelligence;

CREATE MATERIALIZED VIEW datamarts.dm_regional_intelligence AS
WITH

-- CTE: Regional totals for relative share calculation
regional_context AS (
    SELECT
        d.year,
        d.quarter,
        r.region_name,
        SUM(f.revenue) AS region_quarterly_revenue
    FROM warehouse.fact_sales f
    INNER JOIN warehouse.dim_date d ON f.date_key = d.date_key
    INNER JOIN warehouse.dim_region r ON f.region_key = r.region_key
    WHERE f.is_outlier = FALSE
    GROUP BY d.year, d.quarter, r.region_name
),

-- CTE: Top salesperson per region per year
-- Using ROW_NUMBER() to rank salespersons within each region/year
top_salesperson AS (
    SELECT
        d.year,
        r.region_name,
        f.salesperson_id,
        SUM(f.revenue) AS sp_revenue,
        ROW_NUMBER() OVER (
            PARTITION BY d.year, r.region_name
            ORDER BY SUM(f.revenue) DESC
        ) AS sp_rank   -- ROW_NUMBER: unique rank (no ties)
    FROM warehouse.fact_sales f
    INNER JOIN warehouse.dim_date d ON f.date_key = d.date_key
    INNER JOIN warehouse.dim_region r ON f.region_key = r.region_key
    WHERE f.is_outlier = FALSE
    GROUP BY d.year, r.region_name, f.salesperson_id
)

SELECT
    -- TIME
    d.year,
    d.quarter,
    d.season,
    
    -- GEOGRAPHY
    r.region_name          AS region,
    
    -- PRODUCT
    p.drug_category,
    p.atc_level1           AS therapeutic_area,
    
    -- CUSTOMER
    c.customer_type        AS channel,
    
    -- REGIONAL MEASURES
    COUNT(DISTINCT f.salesperson_id)  AS active_salespersons,
    COUNT(*)                          AS transaction_count,
    SUM(f.quantity_sold)              AS total_units,
    SUM(f.revenue)                    AS total_revenue,
    SUM(f.gross_profit)               AS total_profit,
    AVG(f.revenue)                    AS avg_transaction_value,
    
    -- Revenue per transaction (key efficiency metric)
    ROUND(SUM(f.revenue) / NULLIF(COUNT(*), 0), 2)
                           AS revenue_per_transaction,
    
    -- REGIONAL MARKET SHARE within this quarter
    ROUND(
        SUM(f.revenue) / NULLIF(rc.region_quarterly_revenue, 0) * 100,
        2
    )                      AS category_share_in_region_pct,
    
    -- QUARTER-OVER-QUARTER comparison for regional revenue
    LAG(SUM(f.revenue)) OVER (
        PARTITION BY r.region_name, p.drug_category
        ORDER BY d.year, d.quarter
    )                      AS prev_quarter_revenue,
    
    -- QoQ Growth %
    ROUND(
        (SUM(f.revenue) - LAG(SUM(f.revenue)) OVER (
            PARTITION BY r.region_name, p.drug_category
            ORDER BY d.year, d.quarter
        )) / NULLIF(LAG(SUM(f.revenue)) OVER (
            PARTITION BY r.region_name, p.drug_category
            ORDER BY d.year, d.quarter
        ), 0) * 100,
        2
    )                      AS qoq_growth_pct,
    
    -- Regional ranking within each time period
    DENSE_RANK() OVER (
        PARTITION BY d.year, d.quarter
        ORDER BY SUM(f.revenue) DESC
    )                      AS region_revenue_rank,
    
    -- Top salesperson in this region for this year (from CTE)
    ts.salesperson_id      AS top_salesperson_id,
    ts.sp_revenue          AS top_salesperson_revenue

FROM warehouse.fact_sales f
INNER JOIN warehouse.dim_date d    ON f.date_key    = d.date_key
INNER JOIN warehouse.dim_product p ON f.product_key = p.product_key
INNER JOIN warehouse.dim_region r  ON f.region_key  = r.region_key
INNER JOIN warehouse.dim_customer c ON f.customer_key = c.customer_key

-- Left join the regional context for share calculation
INNER JOIN regional_context rc
    ON d.year = rc.year
    AND d.quarter = rc.quarter
    AND r.region_name = rc.region_name

-- Left join top salesperson (nullable — may not exist for all combos)
LEFT JOIN top_salesperson ts
    ON d.year = ts.year
    AND r.region_name = ts.region_name
    AND ts.sp_rank = 1   -- Only keep the #1 salesperson

WHERE f.is_outlier = FALSE

GROUP BY
    d.year, d.quarter, d.season,
    r.region_name,
    p.drug_category, p.atc_level1,
    c.customer_type,
    rc.region_quarterly_revenue,
    ts.salesperson_id, ts.sp_revenue

ORDER BY d.year, d.quarter, total_revenue DESC;

CREATE INDEX IF NOT EXISTS idx_dm_regional_year_quarter
    ON datamarts.dm_regional_intelligence(year, quarter);

CREATE INDEX IF NOT EXISTS idx_dm_regional_region
    ON datamarts.dm_regional_intelligence(region);

COMMENT ON MATERIALIZED VIEW datamarts.dm_regional_intelligence IS
    'Regional Intelligence Datamart: Geographic performance, channel analysis, salesperson KPIs by quarter.';


-- =============================================================================
-- GRANT ACCESS to BI reader user for all materialized views
-- =============================================================================
GRANT SELECT ON datamarts.dm_sales_performance TO bi_reader;
GRANT SELECT ON datamarts.dm_product_analysis TO bi_reader;
GRANT SELECT ON datamarts.dm_regional_intelligence TO bi_reader;


-- =============================================================================
-- REFRESH COMMAND (run this after new data loads)
-- CONCURRENTLY: allows reads while refreshing (requires unique index)
-- Without CONCURRENTLY: table is locked during refresh
-- =============================================================================
-- REFRESH MATERIALIZED VIEW CONCURRENTLY datamarts.dm_sales_performance;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY datamarts.dm_product_analysis;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY datamarts.dm_regional_intelligence;


\echo '✅ All 3 datamarts created successfully!'
\echo '  1. datamarts.dm_sales_performance'
\echo '  2. datamarts.dm_product_analysis'
\echo '  3. datamarts.dm_regional_intelligence'
