#!/bin/bash
# =============================================================================
# SCRIPT: 04_download_dataset.sh
# PURPOSE: Download Pharma Sales Dataset from Kaggle
# DATASET: Pharmaceutical Drug Sales — milanzdravkovic/pharma-sales-data
#
# DATASET DESCRIPTION:
#   ~600k rows of real pharmaceutical product sales transactions.
#   Each row = one sale of one drug product.
#   Columns:
#     datum       — sale date (YYYY-MM-DD format)
#     Year        — year (2014–2019)
#     Month       — month number (1–12)
#     Hour        — hour of day (0–23) — simulates pharmacy point-of-sale time
#     Weekday Name — Monday, Tuesday, etc.
#     M01AB        — drug category sales (Acetic acid derivatives - ATC code)
#     M01AE        — drug category (Propionic acid derivatives)
#     N02BA        — drug category (Salicylic acid derivatives)
#     N02BE/B      — drug category (Pyrazolones, Anilides)
#     N05B         — drug category (Anxiolytics)
#     N05C         — drug category (Hypnotics/sedatives)
#     R03          — drug category (Anti-asthmatics)
#     R06          — drug category (Antihistamines)
#
#   ATC = Anatomical Therapeutic Chemical Classification System (WHO standard)
#   Each column represents total units sold per hour for that drug category.
#
# WHY THIS DATASET:
#   - Healthcare/pharma domain = professional, realistic
#   - Multi-year (2014–2019) = time series trends
#   - 8 product categories = good for product analysis
#   - Hourly granularity = rich time dimension
#   - Clean enough for BI, messy enough to need ETL
# =============================================================================

set -e

echo "============================================="
echo " MedTrack BI — Dataset Download"
echo "============================================="

DATA_DIR="$(dirname $0)/../data"
RAW_DIR="$DATA_DIR/raw"
mkdir -p $RAW_DIR

# -----------------------------------------------------------------------------
# METHOD 1: Download via Kaggle API (recommended)
# Requirements:
#   1. Create a Kaggle account at https://www.kaggle.com
#   2. Go to: Account → API → Create New Token
#   3. This downloads a 'kaggle.json' file with your credentials
#   4. Place it at ~/.kaggle/kaggle.json
#   5. chmod 600 ~/.kaggle/kaggle.json
# -----------------------------------------------------------------------------
echo "Attempting Kaggle API download..."

if [ -f "$HOME/.kaggle/kaggle.json" ]; then
    echo " ✅ Kaggle credentials found"
    
    # Install kaggle CLI if not already installed
    pip3 install kaggle 2>/dev/null || true
    
    # Download the pharma sales dataset
    # -d: dataset identifier (owner/dataset-name)
    # -p: download path
    # --unzip: automatically extract the zip
    kaggle datasets download \
        -d milanzdravkovic/pharma-sales-data \
        -p $RAW_DIR \
        --unzip
    
    echo " ✅ Dataset downloaded to $RAW_DIR"

else
    echo " ⚠️  Kaggle credentials not found at ~/.kaggle/kaggle.json"
    echo ""
    echo " MANUAL DOWNLOAD INSTRUCTIONS:"
    echo " 1. Visit: https://www.kaggle.com/datasets/milanzdravkovic/pharma-sales-data"
    echo " 2. Click 'Download' (requires free Kaggle account)"
    echo " 3. Extract the zip file"
    echo " 4. Copy 'salesmonthly.csv' to: $RAW_DIR/"
    echo " 5. Re-run this script or proceed to ETL"
    echo ""
    echo " ALTERNATIVE: Using synthetic data generator..."
    python3 "$(dirname $0)/../etl/extract/generate_synthetic.py" $RAW_DIR
fi

# -----------------------------------------------------------------------------
# Verify the downloaded files
# We expect at minimum: salesmonthly.csv (monthly aggregated)
# Other files: saleshourly.csv (hourly), salesweekly.csv, salesdaily.csv
# -----------------------------------------------------------------------------
echo ""
echo "Downloaded files:"
ls -lh $RAW_DIR/ 2>/dev/null || echo " (no files found)"

echo ""
echo "============================================="
echo " ✅ Dataset ready!"
echo " Location: $RAW_DIR"
echo " Next: bash scripts/05_run_etl.sh"
echo "============================================="
