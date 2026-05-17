"""
transform_pharma.py
===================
Transforms raw Pharma Sales CSV data into structured, clean tables
ready for loading into Odoo and the PostgreSQL Data Warehouse.

DATA TRANSFORMATION STAGES:
  Stage 1: Reshape (wide → long format)
    The raw CSV has one column per drug category (wide format).
    We "melt" it so each row = one drug + one time period (long format).
    Wide: date | M01AB | M01AE | N02BA | ...
    Long: date | drug_code | drug_name | quantity_sold

  Stage 2: Enrich (add derived columns)
    - Parse dates into components (year, quarter, month, week, day)
    - Map drug codes to full names, categories, ATC levels
    - Simulate business attributes (region, salesperson, price)
    - Calculate revenue = quantity × price

  Stage 3: Validate (data quality checks)
    - Remove rows with null dates
    - Clip negative quantities to 0
    - Flag outliers (values > 3 standard deviations)

  Stage 4: Model (split into fact + dimension tables)
    - dim_date     : date attributes
    - dim_product  : drug product attributes
    - dim_region   : geographic region
    - dim_customer : customer type / channel
    - fact_sales   : transactional fact table

STAR SCHEMA:
    A star schema has one central FACT TABLE surrounded by DIMENSION TABLES.
    Fact tables contain MEASURES (numbers to aggregate: sales, revenue, quantity).
    Dimension tables contain ATTRIBUTES (things to filter/group by: date, product).
    
    The "star" shape comes from the fact table in the center connected
    to multiple dimension tables by foreign keys.
    
         dim_date ──────┐
         dim_product ───┤
         dim_region ────┤──► fact_sales (central fact table)
         dim_customer ──┘
"""

import pandas as pd
import numpy as np
from datetime import datetime
import os

# =============================================================================
# DRUG METADATA
# Maps ATC drug codes (column names in CSV) to human-readable information.
# ATC = Anatomical Therapeutic Chemical Classification System.
# Each drug has: full name, therapeutic area, average price, ATC level 1 category.
# =============================================================================
DRUG_METADATA = {
    "M01AB": {
        "full_name": "Diclofenac (NSAID)",
        "category": "Anti-inflammatory & Antirheumatic",
        "atc_level1": "Musculoskeletal",
        "avg_price": 8.50,        # Average price per unit in EUR
        "is_prescription": True,
        "form": "Tablet",
    },
    "M01AE": {
        "full_name": "Ibuprofen (NSAID)",
        "category": "Anti-inflammatory & Antirheumatic",
        "atc_level1": "Musculoskeletal",
        "avg_price": 5.20,
        "is_prescription": False,   # OTC (over-the-counter)
        "form": "Tablet",
    },
    "N02BA": {
        "full_name": "Aspirin",
        "category": "Analgesics",
        "atc_level1": "Nervous System",
        "avg_price": 3.80,
        "is_prescription": False,
        "form": "Tablet",
    },
    "N02BE": {
        "full_name": "Paracetamol",
        "category": "Analgesics",
        "atc_level1": "Nervous System",
        "avg_price": 4.10,
        "is_prescription": False,
        "form": "Tablet",
    },
    "N05B": {
        "full_name": "Diazepam (Anxiolytic)",
        "category": "Psycholeptics",
        "atc_level1": "Nervous System",
        "avg_price": 12.30,
        "is_prescription": True,
        "form": "Tablet",
    },
    "N05C": {
        "full_name": "Zolpidem (Hypnotic)",
        "category": "Psycholeptics",
        "atc_level1": "Nervous System",
        "avg_price": 15.60,
        "is_prescription": True,
        "form": "Tablet",
    },
    "R03": {
        "full_name": "Salbutamol (Inhaler)",
        "category": "Anti-Asthmatic",
        "atc_level1": "Respiratory",
        "avg_price": 22.40,
        "is_prescription": True,
        "form": "Inhaler",
    },
    "R06": {
        "full_name": "Cetirizine (Antihistamine)",
        "category": "Antihistamine",
        "atc_level1": "Respiratory",
        "avg_price": 6.70,
        "is_prescription": False,
        "form": "Tablet",
    },
}

# =============================================================================
# REGIONS
# We simulate a 5-region distribution for the pharmacy network.
# In real life, this would come from store location data.
# =============================================================================
REGIONS = ["North", "South", "East", "West", "Central"]
REGION_WEIGHTS = [0.20, 0.25, 0.18, 0.22, 0.15]  # Probability weights

# =============================================================================
# CUSTOMER TYPES / CHANNELS
# =============================================================================
CUSTOMER_TYPES = ["Hospital", "Retail Pharmacy", "Clinic", "Online", "Wholesaler"]
CUSTOMER_WEIGHTS = [0.30, 0.35, 0.15, 0.10, 0.10]


def load_raw_data(raw_dir: str) -> pd.DataFrame:
    """
    Load the raw CSV file from disk.
    
    We prefer saleshourly.csv (more detail) but fall back to salesmonthly.csv.
    
    Returns a pandas DataFrame with all raw columns.
    pandas DataFrame = a 2D table of data, similar to an Excel spreadsheet.
    Each column is a pandas Series. Operations are vectorized (fast).
    """
    hourly_path = os.path.join(raw_dir, "saleshourly.csv")
    monthly_path = os.path.join(raw_dir, "salesmonthly.csv")
    
    if os.path.exists(hourly_path):
        print(f"  Loading hourly data from {hourly_path}...")
        # parse_dates: tell pandas to automatically convert date strings to datetime objects
        df = pd.read_csv(hourly_path, parse_dates=["datum"])
        print(f"  Loaded {len(df):,} rows (hourly)")
    elif os.path.exists(monthly_path):
        print(f"  Loading monthly data from {monthly_path}...")
        df = pd.read_csv(monthly_path, parse_dates=["datum"])
        print(f"  Loaded {len(df):,} rows (monthly)")
    else:
        raise FileNotFoundError(
            f"No data files found in {raw_dir}. "
            "Run 04_download_dataset.sh first."
        )
    
    return df


def reshape_wide_to_long(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convert from WIDE format (one column per drug) to LONG format
    (one row per drug per time period).
    
    BEFORE (wide):
        datum       | Year | Month | Hour | M01AB | M01AE | ...
        2014-01-01  | 2014 | 1     | 9    | 15.3  | 22.1  | ...
    
    AFTER (long):
        datum       | Year | Month | Hour | drug_code | quantity
        2014-01-01  | 2014 | 1     | 9    | M01AB     | 15.3
        2014-01-01  | 2014 | 1     | 9    | M01AE     | 22.1
    
    pd.melt() "unpivots" a DataFrame from wide to long format.
    - id_vars: columns to keep as-is (the time/identifier columns)
    - value_vars: columns to melt into rows (the drug columns)
    - var_name: name of new column containing former column names
    - value_name: name of new column containing the values
    """
    drug_codes = list(DRUG_METADATA.keys())
    
    # Determine which ID columns exist in this DataFrame
    id_cols = [c for c in ["datum", "Year", "Month", "Hour", "Weekday Name"] if c in df.columns]
    
    print(f"  Reshaping: {len(id_cols)} ID columns + {len(drug_codes)} drug columns...")
    
    df_long = df.melt(
        id_vars=id_cols,
        value_vars=drug_codes,
        var_name="drug_code",         # Former column names become values in "drug_code"
        value_name="quantity_sold",   # Values from drug columns go into "quantity_sold"
    )
    
    print(f"  Reshaped: {len(df_long):,} rows × {len(df_long.columns)} columns")
    return df_long


def enrich_with_drug_metadata(df: pd.DataFrame) -> pd.DataFrame:
    """
    Join drug metadata (name, category, price) onto each row.
    
    We create a lookup DataFrame from DRUG_METADATA dict,
    then merge it with the sales DataFrame on drug_code.
    
    pd.merge() = SQL JOIN. Default is inner join.
    """
    # Build drug metadata DataFrame (like a reference/lookup table)
    meta_rows = []
    for code, meta in DRUG_METADATA.items():
        meta_rows.append({
            "drug_code": code,
            "drug_name": meta["full_name"],
            "drug_category": meta["category"],
            "atc_level1": meta["atc_level1"],
            "avg_price": meta["avg_price"],
            "is_prescription": meta["is_prescription"],
            "drug_form": meta["form"],
        })
    meta_df = pd.DataFrame(meta_rows)
    
    # Merge: adds drug attributes to each row via drug_code foreign key
    df = df.merge(meta_df, on="drug_code", how="left")
    
    print(f"  Enriched with drug metadata: {df.shape}")
    return df


def enrich_date_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extract additional date/time features from the 'datum' column.
    
    These become attributes in dim_date dimension table.
    Why? So users can filter/group by: quarter, week, day of week, etc.
    
    pandas .dt accessor provides date/time property extraction:
    df["datum"].dt.year     → extracts the year from each datetime
    df["datum"].dt.quarter  → extracts the quarter (1-4)
    etc.
    """
    # Ensure datum is a proper datetime type
    df["datum"] = pd.to_datetime(df["datum"], errors="coerce")
    
    # Extract date components
    df["date_key"] = df["datum"].dt.strftime("%Y%m%d").astype(int)  # e.g. 20140115
    df["year"] = df["datum"].dt.year
    df["quarter"] = df["datum"].dt.quarter            # 1, 2, 3, or 4
    df["month_num"] = df["datum"].dt.month
    df["month_name"] = df["datum"].dt.strftime("%B")  # January, February, ...
    df["week_of_year"] = df["datum"].dt.isocalendar().week.astype(int)
    df["day_of_week"] = df["datum"].dt.dayofweek      # 0=Monday, 6=Sunday
    df["day_name"] = df["datum"].dt.strftime("%A")    # Monday, Tuesday, ...
    df["is_weekend"] = df["day_of_week"] >= 5         # True/False
    df["hour"] = df["datum"].dt.hour if "Hour" not in df.columns else df["Hour"]
    
    # Season mapping based on meteorological seasons
    def get_season(month):
        if month in [12, 1, 2]:
            return "Winter"
        elif month in [3, 4, 5]:
            return "Spring"
        elif month in [6, 7, 8]:
            return "Summer"
        else:
            return "Autumn"
    
    df["season"] = df["month_num"].apply(get_season)
    
    print(f"  Date features added: year, quarter, month, week, day, season")
    return df


def simulate_business_dimensions(df: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    """
    Add simulated business dimensions: region, customer type, salesperson.
    
    In a real project, these would come from actual data.
    Here we use np.random.choice with probability weights to create
    realistic distributions that can be used for regional/channel analysis.
    
    np.random.choice: pick random values from an array
    p=...: probability weights (must sum to 1.0)
    size=len(df): generate one value per row
    """
    rng = np.random.default_rng(seed=seed)  # Seeded RNG for reproducibility
    
    # Assign each row a region (with realistic distribution)
    df["region"] = rng.choice(REGIONS, size=len(df), p=REGION_WEIGHTS)
    
    # Assign customer type
    df["customer_type"] = rng.choice(
        CUSTOMER_TYPES, size=len(df), p=CUSTOMER_WEIGHTS
    )
    
    # Generate salesperson IDs (SP001 through SP020)
    salesperson_ids = [f"SP{i:03d}" for i in range(1, 21)]
    df["salesperson_id"] = rng.choice(salesperson_ids, size=len(df))
    
    # Simulate a price variation: ±10% from average price
    price_variation = rng.uniform(0.90, 1.10, size=len(df))
    df["unit_price"] = (df["avg_price"] * price_variation).round(2)
    
    print(f"  Business dimensions simulated: region, customer_type, salesperson, price")
    return df


def calculate_financial_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate derived financial KPI columns from raw data.
    
    REVENUE = quantity × unit_price
    COST = revenue × cost_margin (estimated 60-70% of revenue is cost for pharma)
    GROSS_PROFIT = revenue - cost
    GROSS_MARGIN_PCT = gross_profit / revenue × 100
    
    These become measures in our fact table — the numbers we aggregate.
    """
    # Revenue
    df["revenue"] = (df["quantity_sold"] * df["unit_price"]).round(2)
    
    # Cost (estimated as 60-70% of revenue — typical pharma margin)
    cost_ratio = 0.65  # 65% cost ratio
    df["cost"] = (df["revenue"] * cost_ratio).round(2)
    
    # Gross profit
    df["gross_profit"] = (df["revenue"] - df["cost"]).round(2)
    
    # Gross margin percentage
    df["gross_margin_pct"] = np.where(
        df["revenue"] > 0,
        (df["gross_profit"] / df["revenue"] * 100).round(1),
        0
    )
    
    print(f"  Financial metrics calculated: revenue, cost, gross_profit, margin%")
    return df


def validate_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Data quality checks and cleanup.
    
    In real ETL, this is critical. Bad data = bad reports = bad decisions.
    
    Checks:
    1. Remove rows with null dates (can't aggregate without a date)
    2. Fix negative quantities (shouldn't exist in sales data)
    3. Flag extreme outliers (> 3 standard deviations)
    4. Check for duplicate rows
    """
    original_len = len(df)
    
    # 1. Drop rows with null date
    df = df.dropna(subset=["datum"])
    null_date_count = original_len - len(df)
    if null_date_count > 0:
        print(f"  ⚠️  Removed {null_date_count} rows with null dates")
    
    # 2. Clip negative quantities to 0 (can happen from data entry errors)
    neg_count = (df["quantity_sold"] < 0).sum()
    if neg_count > 0:
        print(f"  ⚠️  Clipped {neg_count} negative quantities to 0")
        df["quantity_sold"] = df["quantity_sold"].clip(lower=0)
    
    # 3. Flag statistical outliers using Z-score
    # Z-score = (value - mean) / std_dev
    # Values beyond ±3 standard deviations are statistical outliers
    from scipy import stats as scipy_stats
    try:
        z_scores = scipy_stats.zscore(df["quantity_sold"].fillna(0))
        df["is_outlier"] = abs(z_scores) > 3
        outlier_count = df["is_outlier"].sum()
        if outlier_count > 0:
            print(f"  ⚠️  Flagged {outlier_count} statistical outliers (z > 3)")
    except ImportError:
        # scipy not available, skip z-score check
        df["is_outlier"] = False
    
    # 4. Check for exact duplicates
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        print(f"  ⚠️  Removing {dup_count} duplicate rows")
        df = df.drop_duplicates()
    
    print(f"  Validation: {original_len:,} → {len(df):,} rows ({original_len - len(df)} removed)")
    return df


def build_dimension_tables(df: pd.DataFrame) -> dict:
    """
    Extract dimension tables from the enriched fact data.
    
    STAR SCHEMA DIMENSIONS:
    
    dim_date: one row per unique date/time period
      - date_key (PK)
      - full_date, year, quarter, month_num, month_name, week_of_year
      - day_of_week, day_name, season, is_weekend, hour
    
    dim_product: one row per unique drug product
      - product_key (PK = drug_code)
      - drug_name, category, atc_level1, is_prescription, drug_form, avg_price
    
    dim_region: one row per geographic region
      - region_key (PK)
      - region_name
    
    dim_customer: one row per customer type
      - customer_key (PK)
      - customer_type
    
    Returns a dict of {table_name: DataFrame}
    """
    print("  Building dimension tables...")
    
    # ── dim_date ──────────────────────────────────────────────────────────────
    date_cols = [
        "date_key", "datum", "year", "quarter", "month_num", "month_name",
        "week_of_year", "day_of_week", "day_name", "is_weekend", "season"
    ]
    # Keep only existing columns
    date_cols = [c for c in date_cols if c in df.columns]
    dim_date = df[date_cols].drop_duplicates(subset=["date_key"]).reset_index(drop=True)
    dim_date = dim_date.rename(columns={"datum": "full_date"})
    dim_date = dim_date.sort_values("date_key")
    
    # ── dim_product ───────────────────────────────────────────────────────────
    product_cols = [
        "drug_code", "drug_name", "drug_category", "atc_level1",
        "is_prescription", "drug_form", "avg_price"
    ]
    product_cols = [c for c in product_cols if c in df.columns]
    dim_product = df[product_cols].drop_duplicates(subset=["drug_code"]).reset_index(drop=True)
    dim_product = dim_product.rename(columns={"drug_code": "product_key"})
    
    # ── dim_region ────────────────────────────────────────────────────────────
    dim_region = df[["region"]].drop_duplicates().reset_index(drop=True)
    dim_region["region_key"] = range(1, len(dim_region) + 1)
    dim_region = dim_region.rename(columns={"region": "region_name"})
    dim_region = dim_region[["region_key", "region_name"]]
    
    # ── dim_customer ──────────────────────────────────────────────────────────
    dim_customer = df[["customer_type"]].drop_duplicates().reset_index(drop=True)
    dim_customer["customer_key"] = range(1, len(dim_customer) + 1)
    dim_customer = dim_customer[["customer_key", "customer_type"]]
    
    print(f"  dim_date: {len(dim_date)} rows")
    print(f"  dim_product: {len(dim_product)} rows")
    print(f"  dim_region: {len(dim_region)} rows")
    print(f"  dim_customer: {len(dim_customer)} rows")
    
    return {
        "dim_date": dim_date,
        "dim_product": dim_product,
        "dim_region": dim_region,
        "dim_customer": dim_customer,
    }


def build_fact_table(df: pd.DataFrame, dimensions: dict) -> pd.DataFrame:
    """
    Build the central FACT TABLE by:
    1. Joining dimension keys back into the main DataFrame
    2. Selecting only fact-relevant columns (measures + foreign keys)
    
    The fact table contains:
    - Foreign keys to each dimension (date_key, product_key, etc.)
    - Measures (quantity_sold, revenue, cost, gross_profit)
    - No descriptive attributes (those live in dimension tables)
    
    This is the "star" design — facts in the center, dimensions radiating out.
    """
    print("  Building fact table...")
    
    # Join region_key from dim_region
    df = df.merge(
        dimensions["dim_region"],
        left_on="region",
        right_on="region_name",
        how="left"
    )
    
    # Join customer_key from dim_customer
    df = df.merge(
        dimensions["dim_customer"],
        on="customer_type",
        how="left"
    )
    
    # Select fact table columns
    fact_cols = [
        "date_key",          # FK → dim_date
        "drug_code",         # FK → dim_product (product_key)
        "region_key",        # FK → dim_region
        "customer_key",      # FK → dim_customer
        "salesperson_id",    # Degenerate dimension (stored in fact, no table)
        "quantity_sold",     # MEASURE: units sold
        "unit_price",        # MEASURE: price per unit
        "revenue",           # MEASURE: quantity × price
        "cost",              # MEASURE: estimated cost
        "gross_profit",      # MEASURE: revenue - cost
        "gross_margin_pct",  # MEASURE: gross profit percentage
        "is_outlier",        # Data quality flag
    ]
    
    fact_cols = [c for c in fact_cols if c in df.columns]
    fact_sales = df[fact_cols].copy()
    fact_sales = fact_sales.rename(columns={"drug_code": "product_key"})
    
    # Add a surrogate key for the fact table
    # Surrogate key = system-generated unique identifier (not from the business data)
    fact_sales.insert(0, "fact_id", range(1, len(fact_sales) + 1))
    
    print(f"  fact_sales: {len(fact_sales):,} rows × {len(fact_sales.columns)} columns")
    return fact_sales


def run_transform(raw_dir: str, output_dir: str) -> dict:
    """
    Main transformation pipeline.
    
    Returns a dict of DataFrames ready for loading into PostgreSQL:
    {
        "staging_raw":  raw data (for debugging/audit trail),
        "dim_date":     date dimension,
        "dim_product":  product dimension,
        "dim_region":   region dimension,
        "dim_customer": customer dimension,
        "fact_sales":   central fact table,
    }
    """
    print("\n" + "=" * 60)
    print("  MedTrack BI — ETL Transform Stage")
    print("=" * 60)
    
    os.makedirs(output_dir, exist_ok=True)
    
    # ── EXTRACT ──────────────────────────────────────────────────────────────
    print("\n[1/7] Loading raw data...")
    df_raw = load_raw_data(raw_dir)
    
    # Save raw staging copy (audit trail — always keep original)
    staging_path = os.path.join(output_dir, "staging_raw.csv")
    df_raw.to_csv(staging_path, index=False)
    print(f"  Staging copy saved to {staging_path}")
    
    # ── TRANSFORM STEPS ──────────────────────────────────────────────────────
    print("\n[2/7] Reshaping wide → long format...")
    df = reshape_wide_to_long(df_raw)
    
    print("\n[3/7] Enriching with drug metadata...")
    df = enrich_with_drug_metadata(df)
    
    print("\n[4/7] Extracting date features...")
    df = enrich_date_features(df)
    
    print("\n[5/7] Simulating business dimensions...")
    df = simulate_business_dimensions(df)
    
    print("\n[6/7] Calculating financial metrics...")
    df = calculate_financial_metrics(df)
    
    print("\n[7/7] Validating data quality...")
    df = validate_data(df)
    
    # ── BUILD STAR SCHEMA TABLES ──────────────────────────────────────────────
    print("\n[STAR] Building dimension and fact tables...")
    dimensions = build_dimension_tables(df)
    fact_table = build_fact_table(df, dimensions)
    
    # Combine all outputs
    result = {
        "staging_raw": df_raw,
        **dimensions,
        "fact_sales": fact_table,
    }
    
    # Save each table as CSV for inspection
    for table_name, table_df in result.items():
        path = os.path.join(output_dir, f"{table_name}.csv")
        table_df.to_csv(path, index=False)
    
    print("\n" + "=" * 60)
    print("  ✅ Transform complete!")
    print(f"  Output directory: {output_dir}")
    for name, t in result.items():
        print(f"  {name}: {len(t):,} rows × {len(t.columns)} cols")
    print("=" * 60)
    
    return result


# Run if called directly (e.g., python3 transform_pharma.py)
if __name__ == "__main__":
    import sys
    raw_dir = sys.argv[1] if len(sys.argv) > 1 else "./data/raw"
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "./data/transformed"
    run_transform(raw_dir, output_dir)
