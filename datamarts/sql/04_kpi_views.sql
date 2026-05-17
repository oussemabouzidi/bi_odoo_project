-- =============================================================================
-- FILE: 04_kpi_views.sql
-- PURPOSE: Create KPI (Key Performance Indicator) materialized views
--          These are highly aggregated metrics exposed to the dashboard API
--
-- KPI PHILOSOPHY:
--   KPIs answer specific business questions at the EXECUTIVE level.
--   They are pre-computed and stored so the dashboard loads instantly.
--   Each KPI view corresponds to one "KPI Card" in the dashboard.
--
-- REFRESH FREQUENCY:
--   Recommended: Every 1 hour via cron job
--   Cron entry: 0 * * * * psql -d medtrack_dw -c "REFRESH MATERIALIZED VIEW CONCURRENTLY kpi.kpi_executive_summary;"
-- =============================================================================

SET search_path TO kpi, datamarts, warehouse, public;


-- =============================================================================
-- KPI 1: EXECUTIVE SUMMARY
-- High-level company-wide metrics for the C-suite dashboard.
-- Refreshed hourly. Used by: CEO, CFO, Board.
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS kpi.kpi_executive_summary;

CREATE MATERIALIZED VIEW kpi.kpi_executive_summary AS
SELECT
    -- CURRENT YEAR METRICS (most recent year in data)
    MAX(year)                       AS reporting_year,
    
    -- Total Revenue (most important KPI)
    SUM(CASE WHEN year = (SELECT MAX(year) FROM datamarts.dm_sales_performance)
             THEN total_revenue ELSE 0 END)
                                    AS ytd_revenue,
    
    -- Total Units Sold
    SUM(CASE WHEN year = (SELECT MAX(year) FROM datamarts.dm_sales_performance)
             THEN total_units_sold ELSE 0 END)
                                    AS ytd_units_sold,
    
    -- Total Gross Profit
    SUM(CASE WHEN year = (SELECT MAX(year) FROM datamarts.dm_sales_performance)
             THEN total_gross_profit ELSE 0 END)
                                    AS ytd_gross_profit,
    
    -- Overall Gross Margin %
    ROUND(
        SUM(CASE WHEN year = (SELECT MAX(year) FROM datamarts.dm_sales_performance)
                 THEN total_gross_profit ELSE 0 END) /
        NULLIF(SUM(CASE WHEN year = (SELECT MAX(year) FROM datamarts.dm_sales_performance)
                        THEN total_revenue ELSE 0 END), 0) * 100,
        1
    )                               AS ytd_gross_margin_pct,
    
    -- Previous year revenue for comparison
    SUM(CASE WHEN year = (SELECT MAX(year) - 1 FROM datamarts.dm_sales_performance)
             THEN total_revenue ELSE 0 END)
                                    AS prev_year_revenue,
    
    -- Year-over-Year Revenue Growth %
    ROUND(
        (SUM(CASE WHEN year = (SELECT MAX(year) FROM datamarts.dm_sales_performance)
                  THEN total_revenue ELSE 0 END) -
         SUM(CASE WHEN year = (SELECT MAX(year) - 1 FROM datamarts.dm_sales_performance)
                  THEN total_revenue ELSE 0 END)) /
        NULLIF(SUM(CASE WHEN year = (SELECT MAX(year) - 1 FROM datamarts.dm_sales_performance)
                        THEN total_revenue ELSE 0 END), 0) * 100,
        1
    )                               AS yoy_revenue_growth_pct,
    
    -- Number of distinct drug products
    COUNT(DISTINCT drug_code)       AS product_count,
    
    -- Total transactions
    SUM(transaction_count)          AS total_transactions,

    -- Timestamp of last refresh
    NOW()                           AS last_refreshed_at

FROM datamarts.dm_sales_performance;

GRANT SELECT ON kpi.kpi_executive_summary TO bi_reader;


-- =============================================================================
-- KPI 2: MONTHLY REVENUE TREND
-- Revenue + profit by month for the trend line chart.
-- Used by: Sales managers, Finance, Dashboard trend chart.
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS kpi.kpi_monthly_trend;

CREATE MATERIALIZED VIEW kpi.kpi_monthly_trend AS
SELECT
    year,
    month_num,
    month_name,
    quarter,
    season,
    
    -- Aggregate across all drugs for company-wide monthly totals
    SUM(total_units_sold)                AS monthly_units,
    ROUND(SUM(total_revenue), 2)         AS monthly_revenue,
    ROUND(SUM(total_gross_profit), 2)    AS monthly_profit,
    
    -- Average margin % weighted by revenue
    ROUND(
        SUM(total_gross_profit) / NULLIF(SUM(total_revenue), 0) * 100,
        1
    )                                    AS monthly_margin_pct,
    
    -- Running total (cumulative) revenue within each year
    -- SUM() OVER (window) = running total
    ROUND(SUM(SUM(total_revenue)) OVER (
        PARTITION BY year
        ORDER BY month_num
        ROWS UNBOUNDED PRECEDING   -- Include all rows from start of year to current
    ), 2)                                AS cumulative_ytd_revenue,
    
    -- Month-over-Month change amount
    ROUND(
        SUM(total_revenue) -
        LAG(SUM(total_revenue)) OVER (ORDER BY year, month_num),
        2
    )                                    AS mom_revenue_change

FROM datamarts.dm_sales_performance
GROUP BY year, month_num, month_name, quarter, season
ORDER BY year, month_num;

GRANT SELECT ON kpi.kpi_monthly_trend TO bi_reader;


-- =============================================================================
-- KPI 3: TOP PRODUCTS RANKING
-- Drug product performance league table.
-- Used by: Product managers, procurement, marketing team.
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS kpi.kpi_top_products;

CREATE MATERIALIZED VIEW kpi.kpi_top_products AS
SELECT
    year,
    drug_code,
    drug_name,
    drug_category,
    therapeutic_area,
    is_prescription,
    
    -- Annual totals
    SUM(total_units_sold)              AS annual_units,
    ROUND(SUM(total_revenue), 2)       AS annual_revenue,
    ROUND(SUM(total_gross_profit), 2)  AS annual_profit,
    ROUND(AVG(gross_margin_pct), 1)    AS avg_margin_pct,
    
    -- Revenue rank within year (1 = top seller)
    RANK() OVER (
        PARTITION BY year
        ORDER BY SUM(total_revenue) DESC
    )                                  AS annual_revenue_rank,
    
    -- Volume rank within year
    RANK() OVER (
        PARTITION BY year
        ORDER BY SUM(total_units_sold) DESC
    )                                  AS annual_volume_rank,
    
    -- Share of total annual revenue
    ROUND(
        SUM(total_revenue) / NULLIF(SUM(SUM(total_revenue)) OVER (
            PARTITION BY year
        ), 0) * 100,
        2
    )                                  AS annual_market_share_pct,
    
    -- Year-over-Year growth
    ROUND(
        (SUM(total_revenue) - LAG(SUM(total_revenue)) OVER (
            PARTITION BY drug_code ORDER BY year
        )) / NULLIF(LAG(SUM(total_revenue)) OVER (
            PARTITION BY drug_code ORDER BY year
        ), 0) * 100,
        1
    )                                  AS yoy_growth_pct,
    
    -- Growth trend label
    CASE
        WHEN (SUM(total_revenue) - LAG(SUM(total_revenue)) OVER (
                PARTITION BY drug_code ORDER BY year
              )) / NULLIF(LAG(SUM(total_revenue)) OVER (
                PARTITION BY drug_code ORDER BY year
              ), 0) * 100 > 5 THEN '↑ Growing'
        WHEN (SUM(total_revenue) - LAG(SUM(total_revenue)) OVER (
                PARTITION BY drug_code ORDER BY year
              )) / NULLIF(LAG(SUM(total_revenue)) OVER (
                PARTITION BY drug_code ORDER BY year
              ), 0) * 100 < -5 THEN '↓ Declining'
        ELSE '→ Stable'
    END                                AS growth_trend

FROM datamarts.dm_sales_performance
GROUP BY year, drug_code, drug_name, drug_category, therapeutic_area, is_prescription
ORDER BY year DESC, annual_revenue DESC;

GRANT SELECT ON kpi.kpi_top_products TO bi_reader;


-- =============================================================================
-- KPI 4: REGIONAL PERFORMANCE SCORECARD
-- Region vs region performance for the map and regional bar chart.
-- Used by: Regional managers, executive team.
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS kpi.kpi_regional_scorecard;

CREATE MATERIALIZED VIEW kpi.kpi_regional_scorecard AS
SELECT
    year,
    quarter,
    region,
    
    -- Regional totals
    SUM(total_units)                   AS regional_units,
    ROUND(SUM(total_revenue), 2)       AS regional_revenue,
    ROUND(SUM(total_profit), 2)        AS regional_profit,
    ROUND(AVG(revenue_per_transaction), 2) AS avg_transaction_value,
    SUM(transaction_count)             AS total_transactions,
    
    -- Regional profit margin
    ROUND(
        SUM(total_profit) / NULLIF(SUM(total_revenue), 0) * 100,
        1
    )                                  AS regional_margin_pct,
    
    -- Regional revenue rank (1 = top region)
    RANK() OVER (
        PARTITION BY year, quarter
        ORDER BY SUM(total_revenue) DESC
    )                                  AS region_rank,
    
    -- Quarter-over-quarter growth for the region
    ROUND(
        (SUM(total_revenue) - LAG(SUM(total_revenue)) OVER (
            PARTITION BY region ORDER BY year, quarter
        )) / NULLIF(LAG(SUM(total_revenue)) OVER (
            PARTITION BY region ORDER BY year, quarter
        ), 0) * 100,
        1
    )                                  AS qoq_growth_pct,
    
    -- Top channel for this region
    (SELECT channel FROM datamarts.dm_regional_intelligence di2
     WHERE di2.year = di.year AND di2.quarter = di.quarter AND di2.region = di.region
     GROUP BY channel ORDER BY SUM(total_revenue) DESC LIMIT 1
    )                                  AS top_channel

FROM datamarts.dm_regional_intelligence di
GROUP BY year, quarter, region
ORDER BY year DESC, quarter DESC, regional_revenue DESC;

GRANT SELECT ON kpi.kpi_regional_scorecard TO bi_reader;


-- =============================================================================
-- KPI 5: SEASONAL DEMAND PATTERNS
-- Which months have the highest demand for each drug category.
-- Used by: Inventory planning, procurement.
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS kpi.kpi_seasonal_patterns;

CREATE MATERIALIZED VIEW kpi.kpi_seasonal_patterns AS
SELECT
    month_num,
    month_name,
    season,
    drug_code,
    drug_name,
    drug_category,
    
    -- Average monthly revenue across all years (normalizes for growth)
    ROUND(AVG(total_revenue), 2)          AS avg_monthly_revenue,
    ROUND(AVG(total_units_sold), 0)       AS avg_monthly_units,
    ROUND(AVG(gross_margin_pct), 1)       AS avg_margin_pct,
    
    -- Seasonality index: how much above/below the annual average is this month?
    -- Index > 1.0 = above-average demand month (buy more stock!)
    -- Index < 1.0 = below-average demand month
    ROUND(
        AVG(total_revenue) / NULLIF(
            AVG(AVG(total_revenue)) OVER (PARTITION BY drug_code),
            0
        ),
        3
    )                                      AS seasonality_index,
    
    -- Peak season flag
    CASE WHEN AVG(total_revenue) > AVG(AVG(total_revenue)) OVER (
        PARTITION BY drug_code
    ) * 1.15 THEN TRUE ELSE FALSE END      AS is_peak_month

FROM datamarts.dm_sales_performance
GROUP BY month_num, month_name, season, drug_code, drug_name, drug_category
ORDER BY drug_code, month_num;

GRANT SELECT ON kpi.kpi_seasonal_patterns TO bi_reader;


\echo '✅ All 5 KPI views created!'
\echo '  kpi.kpi_executive_summary     → Executive dashboard KPIs'
\echo '  kpi.kpi_monthly_trend         → Revenue trend line chart'
\echo '  kpi.kpi_top_products          → Product rankings table'
\echo '  kpi.kpi_regional_scorecard    → Regional performance map'
\echo '  kpi.kpi_seasonal_patterns     → Seasonal demand analysis'
