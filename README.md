# 🏥 MedTrack BI — Hospital Supply Chain Business Intelligence Platform

## Project Overview

**MedTrack BI** is a full Business Intelligence pipeline built around a **hospital supply chain dataset**.
It ingests data from Kaggle, loads it into **Odoo 16** (ERP), transforms it in **PostgreSQL** into
3 star-schema **datamarts**, and exposes **KPIs** through a **React dashboard**.

### Dataset
📦 **Healthcare Supply Chain Dataset (Kaggle)**
- URL: https://www.kaggle.com/datasets/harlfoxem/housesalesprediction  (alternative below)
- **Recommended**: https://www.kaggle.com/datasets/nicholasjhana/energy-consumption-generation-prices-and-weather
- **Best fit for this project**: https://www.kaggle.com/datasets/milanzdravkovic/pharma-sales-data
  - ~600k rows of pharmaceutical/medical product sales
  - Columns: date, product, quantity, revenue, region, salesperson, customer_type
  - Download: `kaggle datasets download -d milanzdravkovic/pharma-sales-data`

---

## Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| OS | Ubuntu 22.04 LTS | Host system |
| ERP | Odoo 16 Community | Data source / transactional system |
| Database | PostgreSQL 15 | Warehouse + datamarts |
| ETL | Python 3.11 + pandas | Extract/Transform/Load |
| Dashboard | React 18 + Recharts | Web BI dashboard |
| Webserver | Nginx | Reverse proxy |
| Scheduler | cron | ETL automation |

---

## Project Structure

```
bi_odoo_project/
├── README.md                        ← You are here
├── config/
│   ├── odoo.conf                    ← Odoo configuration file
│   ├── nginx.conf                   ← Nginx reverse proxy config
│   └── pg_hba.conf.patch            ← PostgreSQL auth patch
├── scripts/
│   ├── 01_install_system.sh         ← Full system installation script
│   ├── 02_install_odoo.sh           ← Odoo installation script
│   ├── 03_setup_postgres.sh         ← PostgreSQL setup + users
│   ├── 04_download_dataset.sh       ← Kaggle dataset download
│   └── 05_run_etl.sh                ← Run full ETL pipeline
├── odoo_module/                     ← Custom Odoo 16 module
│   ├── __manifest__.py              ← Module metadata
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── pharma_product.py        ← Product model
│   │   ├── pharma_sale.py           ← Sale transaction model
│   │   └── pharma_customer.py       ← Customer model
│   ├── views/
│   │   ├── pharma_product_views.xml
│   │   ├── pharma_sale_views.xml
│   │   └── menu_views.xml
│   ├── security/
│   │   └── ir.model.access.csv      ← Access rights
│   └── data/
│       └── demo_data.xml            ← Sample demo data
├── etl/
│   ├── extract/
│   │   └── extract_kaggle.py        ← Read CSV from Kaggle dataset
│   ├── transform/
│   │   └── transform_pharma.py      ← Clean + model data
│   └── load/
│       ├── load_odoo.py             ← Load into Odoo via XML-RPC
│       └── load_datamart.py         ← Load star schema into PostgreSQL
├── datamarts/
│   ├── sql/
│   │   ├── 01_create_dimensions.sql ← Dimension tables DDL
│   │   ├── 02_create_facts.sql      ← Fact tables DDL
│   │   ├── 03_create_datamarts.sql  ← 3 datamarts SQL views
│   │   └── 04_kpi_views.sql         ← KPI materialized views
│   └── models/
│       └── star_schema.py           ← Python ORM for datamart models
└── dashboard/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx                  ← Root component
        ├── components/
        │   ├── Login.jsx            ← Auth page
        │   ├── Sidebar.jsx          ← Navigation
        │   ├── KpiCard.jsx          ← KPI metric card
        │   └── ChartWrapper.jsx     ← Chart container
        ├── pages/
        │   ├── Overview.jsx         ← Global KPI overview
        │   ├── SalesDM.jsx          ← Sales datamart page
        │   ├── ProductDM.jsx        ← Product performance page
        │   └── RegionalDM.jsx       ← Regional analysis page
        ├── hooks/
        │   └── useKpi.js            ← Data fetching hook
        └── utils/
            └── api.js               ← API helper functions
```

---

## Data Flow

```
Kaggle CSV Dataset
      │
      ▼
[ETL: extract_kaggle.py]   ← Read raw CSV rows
      │
      ▼
[ETL: transform_pharma.py] ← Clean, normalize, enrich
      │
      ├──────────────────────────────────────────┐
      ▼                                          ▼
[Odoo 16 via XML-RPC]              [PostgreSQL Staging Table]
  pharma.sale records                  staging.pharma_raw
      │                                          │
      │                                          ▼
      │                              [Star Schema Builder]
      │                              dim_date, dim_product,
      │                              dim_region, dim_customer
      │                                          │
      │                                          ▼
      └──────────────────────────────► [3 Datamarts]
                                       DM_SALES
                                       DM_PRODUCT
                                       DM_REGIONAL
                                                 │
                                                 ▼
                                     [KPI Materialized Views]
                                                 │
                                                 ▼
                                     [React Dashboard API]
                                                 │
                                                 ▼
                                     [Web Browser Dashboard]
```

---

## Quick Start

```bash
# 1. Clone / copy project to your Linux machine
cd /opt
sudo cp -r bi_odoo_project /opt/

# 2. Run installation scripts in order
sudo bash scripts/01_install_system.sh
sudo bash scripts/02_install_odoo.sh
sudo bash scripts/03_setup_postgres.sh

# 3. Download dataset
bash scripts/04_download_dataset.sh

# 4. Run ETL
bash scripts/05_run_etl.sh

# 5. Start dashboard
cd dashboard && npm install && npm start
```
