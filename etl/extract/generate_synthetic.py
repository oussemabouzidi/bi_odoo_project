"""
generate_synthetic.py
=====================
Generates a synthetic pharmaceutical sales dataset that mirrors the structure
of the real Kaggle pharma-sales dataset by milanzdravkovic.

Usage:
    python3 etl/extract/generate_synthetic.py <output_dir>

Output:
    <output_dir>/salesmonthly.csv   — ~72 rows (6 years × 12 months)
    <output_dir>/saleshourly.csv    — ~52,608 rows (6 years × 365 days × 24h)

WHY SYNTHETIC:
    Lets you run the project without a Kaggle account.
    The data distribution mimics realistic pharma sales patterns:
    - Seasonal variation (flu drugs peak in winter)
    - Weekday effects (more sales on weekdays)
    - Time-of-day patterns (peaks at 9am and 6pm)
    - Year-over-year growth trend
"""

import sys
import os
import random
import csv
from datetime import datetime, timedelta

# =============================================================================
# DRUG CATEGORIES (ATC Classification System)
# These are the same column names as the real Kaggle dataset.
# ATC = Anatomical Therapeutic Chemical (WHO drug classification standard)
# =============================================================================
DRUG_CATEGORIES = {
    "M01AB": {
        "name": "Acetic Acid Derivatives (Anti-inflammatory)",
        "base_sales": 15.3,       # Average units per hour
        "seasonal_peak": [10, 11, 12, 1, 2, 3],  # Winter peak (joint pain)
        "growth_rate": 0.03,      # 3% annual growth
    },
    "M01AE": {
        "name": "Propionic Acid Derivatives (Ibuprofen-type)",
        "base_sales": 22.5,
        "seasonal_peak": [10, 11, 12, 1, 2],     # Winter
        "growth_rate": 0.025,
    },
    "N02BA": {
        "name": "Salicylic Acid (Aspirin-type)",
        "base_sales": 18.7,
        "seasonal_peak": [1, 2, 3, 10, 11, 12],  # Winter (heart health)
        "growth_rate": -0.01,     # Declining (generic alternatives)
    },
    "N02BE": {
        "name": "Anilides (Paracetamol/Tylenol)",
        "base_sales": 35.2,       # Most popular category
        "seasonal_peak": [10, 11, 12, 1, 2, 3],  # Flu season
        "growth_rate": 0.04,
    },
    "N05B": {
        "name": "Anxiolytics (Anxiety medications)",
        "base_sales": 8.1,
        "seasonal_peak": [11, 12, 1, 6, 7],      # Holiday stress + summer
        "growth_rate": 0.06,      # Growing category (mental health awareness)
    },
    "N05C": {
        "name": "Hypnotics and Sedatives (Sleep aids)",
        "base_sales": 6.4,
        "seasonal_peak": [1, 2, 11, 12],          # Seasonal depression
        "growth_rate": 0.05,
    },
    "R03": {
        "name": "Anti-Asthmatics",
        "base_sales": 12.8,
        "seasonal_peak": [3, 4, 5, 9, 10],       # Spring/autumn allergens
        "growth_rate": 0.02,
    },
    "R06": {
        "name": "Antihistamines (Allergy medications)",
        "base_sales": 14.2,
        "seasonal_peak": [3, 4, 5, 6],            # Spring allergy season
        "growth_rate": 0.015,
    },
}

# =============================================================================
# WEEKDAY SALES MULTIPLIERS
# People visit pharmacies more on weekdays; less on Sundays.
# =============================================================================
WEEKDAY_MULTIPLIER = {
    "Monday": 1.15,
    "Tuesday": 1.10,
    "Wednesday": 1.12,
    "Thursday": 1.08,
    "Friday": 1.20,    # People pick up prescriptions before weekend
    "Saturday": 0.95,
    "Sunday": 0.70,
}

# =============================================================================
# HOUR-OF-DAY MULTIPLIERS
# Pharmacy traffic follows two peaks: morning and after-work.
# =============================================================================
def hourly_multiplier(hour):
    """Return a multiplier based on time of day."""
    if 9 <= hour <= 11:
        return 1.8   # Morning prescription pickup
    elif 12 <= hour <= 13:
        return 1.3   # Lunch break
    elif 17 <= hour <= 19:
        return 1.9   # After-work peak
    elif 0 <= hour <= 6:
        return 0.1   # Late night (24h pharmacies only)
    elif 7 <= hour <= 8:
        return 0.6   # Early morning
    else:
        return 1.0   # Normal hours


def generate_sales_value(drug_key, date, hour):
    """
    Generate a realistic sales value for a given drug, date, and hour.
    
    Formula:
        value = base_sales
              × year_growth_factor  (compound growth since 2014)
              × seasonal_factor     (1.3 in peak months, 0.8 in off-peak)
              × weekday_multiplier  (higher on weekdays)
              × hourly_multiplier   (higher during busy hours)
              + random noise        (±20% random variation)
    """
    drug = DRUG_CATEGORIES[drug_key]
    
    # Year growth factor: compound annual growth from baseline year 2014
    years_since_base = date.year - 2014
    year_factor = (1 + drug["growth_rate"]) ** years_since_base
    
    # Seasonal factor: 1.3 in peak months, 0.8 in non-peak
    seasonal = 1.3 if date.month in drug["seasonal_peak"] else 0.8
    
    # Weekday factor
    weekday_name = date.strftime("%A")
    weekday = WEEKDAY_MULTIPLIER.get(weekday_name, 1.0)
    
    # Hourly factor
    hourly = hourly_multiplier(hour)
    
    # Base calculation
    base = drug["base_sales"] * year_factor * seasonal * weekday * hourly
    
    # Add ±20% random noise for realism
    noise = random.uniform(0.80, 1.20)
    value = base * noise
    
    # Round to 2 decimal places (units can be fractional in monthly averages)
    return round(max(0, value), 2)


def generate_hourly_data(output_dir, start_year=2014, end_year=2019):
    """
    Generate hourly sales data: one row per hour per day.
    Each row has columns: datum, Year, Month, Hour, Weekday Name, + 8 drug columns.
    This mirrors the exact structure of saleshourly.csv in the Kaggle dataset.
    """
    print(f"  Generating hourly data ({start_year}-{end_year})...")
    
    filepath = os.path.join(output_dir, "saleshourly.csv")
    
    # Build header row
    fieldnames = ["datum", "Year", "Month", "Hour", "Weekday Name"] + list(DRUG_CATEGORIES.keys())
    
    row_count = 0
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        current_date = datetime(start_year, 1, 1)
        end_date = datetime(end_year, 12, 31, 23)
        
        while current_date <= end_date:
            row = {
                "datum": current_date.strftime("%Y-%m-%d %H:%M:%S"),
                "Year": current_date.year,
                "Month": current_date.month,
                "Hour": current_date.hour,
                "Weekday Name": current_date.strftime("%A"),
            }
            
            # Generate sales for each drug category
            for drug_key in DRUG_CATEGORIES:
                row[drug_key] = generate_sales_value(drug_key, current_date, current_date.hour)
            
            writer.writerow(row)
            row_count += 1
            
            # Advance by 1 hour
            current_date += timedelta(hours=1)
    
    print(f"  ✅ saleshourly.csv: {row_count:,} rows")
    return filepath


def generate_monthly_data(output_dir, start_year=2014, end_year=2019):
    """
    Generate monthly aggregated sales data.
    Each row = one month, total sales per drug category.
    """
    print(f"  Generating monthly data ({start_year}-{end_year})...")
    
    filepath = os.path.join(output_dir, "salesmonthly.csv")
    
    fieldnames = ["datum", "Year", "Month"] + list(DRUG_CATEGORIES.keys())
    
    row_count = 0
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for year in range(start_year, end_year + 1):
            for month in range(1, 13):
                date = datetime(year, month, 15)  # Middle of month
                
                row = {
                    "datum": date.strftime("%Y-%m"),
                    "Year": year,
                    "Month": month,
                }
                
                # Monthly totals: sum of all hours × all days in month
                import calendar
                days_in_month = calendar.monthrange(year, month)[1]
                
                for drug_key in DRUG_CATEGORIES:
                    # Average hourly * 24 hours * days in month
                    avg_hourly = sum(
                        generate_sales_value(drug_key, date, h) for h in range(24)
                    ) / 24
                    monthly_total = avg_hourly * 24 * days_in_month
                    row[drug_key] = round(monthly_total, 0)
                
                writer.writerow(row)
                row_count += 1
    
    print(f"  ✅ salesmonthly.csv: {row_count:,} rows")
    return filepath


if __name__ == "__main__":
    # Get output directory from command line argument
    output_dir = sys.argv[1] if len(sys.argv) > 1 else "./data/raw"
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Generating synthetic pharma sales data → {output_dir}")
    print("This mirrors the Kaggle pharma-sales dataset structure.")
    print()
    
    # Set random seed for reproducibility
    random.seed(42)
    
    generate_monthly_data(output_dir)
    generate_hourly_data(output_dir)
    
    print()
    print("✅ Synthetic dataset generation complete!")
    print(f"   Files saved to: {output_dir}")
