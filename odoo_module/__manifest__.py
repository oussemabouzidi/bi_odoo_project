# __manifest__.py — Odoo module declaration file
# =====================================================================
# Every Odoo module (addon) must have this file.
# It tells Odoo: what this module is, what it depends on,
# and what files to load.
#
# ODOO MODULE SYSTEM:
#   Odoo is built on a modular architecture.
#   Each feature is a "module" (addon): Sales, Inventory, Accounting, etc.
#   Our module extends Odoo with pharma-specific models.
#   Odoo reads this file when it installs/updates the module.
# =====================================================================

{
    # Module technical name (used internally, no spaces)
    "name": "medtrack_bi",

    # Human-readable name shown in the Odoo UI Apps menu
    "summary": "MedTrack BI — Pharmaceutical Sales Data Module",

    # Full description (shown in Apps → module details)
    "description": """
MedTrack BI Module
==================
This module adds pharmaceutical sales data management to Odoo 16.

Features:
- Drug product catalog (with ATC classification)
- Sales transaction recording
- Customer channel management
- Integration with external BI data warehouse

Designed for use with the MedTrack BI Pipeline:
  Odoo (OLTP) → ETL → PostgreSQL DW (OLAP) → React Dashboard
    """,

    # Module author and contact
    "author": "MedTrack Team",
    "website": "https://github.com/your-org/medtrack-bi",

    # Module category for the Apps menu
    "category": "Reporting/Business Intelligence",

    # Version: Odoo_version.module_version (16.0.x.x.x)
    "version": "16.0.1.0.0",

    # Dependencies: other Odoo modules this module requires
    # "base": the core Odoo module (always required)
    # "product": provides the product.template model
    # "sale": provides sale.order and sale.order.line
    # "mail": adds chatter/messaging to our models
    "depends": ["base", "product", "sale", "mail"],

    # Data files loaded when module is installed
    # XML files define: views, menus, access rights, demo data
    # CSV files define: access control lists (ACLs)
    "data": [
        # Security MUST be loaded first (controls table access)
        "security/ir.model.access.csv",
        # Views (UI definitions)
        "views/pharma_product_views.xml",
        "views/pharma_sale_views.xml",
        "views/menu_views.xml",
    ],

    # Demo data (only loaded if "Load Demo Data" was checked during install)
    "demo": [
        "data/demo_data.xml",
    ],

    # installable: show in Apps menu (set False to hide temporarily)
    "installable": True,

    # auto_install: auto-install if all dependencies are installed
    "auto_install": False,

    # application: show as a standalone App (vs utility module)
    "application": True,

    # License: Odoo Community Edition compatible license
    "license": "LGPL-3",
}
