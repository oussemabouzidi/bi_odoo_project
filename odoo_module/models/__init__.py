# ============================================================
# MedTrack BI — Models Package
# ============================================================
# Importing each model here makes Odoo register all ORM classes
# when the module is installed. Order matters: reference models
# (product, customer) before transaction models (sale).
# ============================================================

from . import pharma_product    # Drug / product catalogue
from . import pharma_sale       # Sales transaction records
