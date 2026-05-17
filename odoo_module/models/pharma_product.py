# ============================================================
# MedTrack BI — Pharma Product Model
# File: odoo_module/models/pharma_product.py
# ============================================================
# Represents the pharmaceutical product catalogue inside Odoo.
# Each drug has an ATC code (Anatomical Therapeutic Chemical),
# a category, a price, and a flag for Rx vs OTC.
#
# Data flow: CSV → ETL → this model (via XML-RPC or direct SQL)
#            → fact_sales dimension join → datamart
# ============================================================

from odoo import models, fields, api

class PharmaProduct(models.Model):
    # ---- Odoo registry name (used in relations & access rules) ----
    _name        = 'medtrack.pharma.product'
    _description = 'Pharmaceutical Product Catalogue'
    _order       = 'atc_code asc'   # default sort in list views

    # ---- Core identifiers -----------------------------------------------
    name = fields.Char(
        string='Drug Name',
        required=True,
        index=True,       # creates a B-tree index → faster lookups
        help='Generic (INN) or brand name of the drug'
    )

    atc_code = fields.Char(
        string='ATC Code',
        size=7,
        required=True,
        index=True,
        help='WHO Anatomical Therapeutic Chemical code, e.g. M01AB'
    )

    # ---- Classification -------------------------------------------------
    atc_category = fields.Selection(
        selection=[
            ('M01AB', 'Anti-inflammatory / Acetic acid'),
            ('M01AE', 'Anti-inflammatory / Propionic acid'),
            ('N02BA', 'Analgesic / Salicylic acid'),
            ('N02BE', 'Analgesic / Anilide'),
            ('N05B',  'Anxiolytic'),
            ('N05C',  'Hypnotic/Sedative'),
            ('R03',   'Respiratory / Obstructive disease'),
            ('R06',   'Antihistamine'),
        ],
        string='ATC Category',
        required=True,
        help='Second-level ATC therapeutic class'
    )

    drug_type = fields.Selection(
        selection=[
            ('rx',  'Prescription (Rx)'),
            ('otc', 'Over-the-Counter (OTC)'),
        ],
        string='Drug Type',
        required=True,
        default='otc',
        help='Whether a prescription is required'
    )

    # ---- Pricing --------------------------------------------------------
    unit_price = fields.Float(
        string='Unit Price (USD)',
        digits=(10, 2),
        required=True,
        help='Selling price per unit. Used to compute revenue in the datamart.'
    )

    cost_price = fields.Float(
        string='Cost Price (USD)',
        digits=(10, 2),
        compute='_compute_cost_price',
        store=True,           # stored → can be used in SQL datamarts
        help='65 % of unit price — pharmaceutical industry average COGS ratio'
    )

    margin_pct = fields.Float(
        string='Gross Margin %',
        compute='_compute_margin',
        store=True,
        help='(Unit Price − Cost Price) / Unit Price × 100'
    )

    # ---- Status ---------------------------------------------------------
    is_active = fields.Boolean(
        string='Active',
        default=True,
        help='Inactive products are hidden but not deleted (soft delete)'
    )

    # ---- Computed fields -----------------------------------------------
    @api.depends('unit_price')
    def _compute_cost_price(self):
        """
        Cost = 65 % of selling price.
        This is a simplified COGS assumption — in production you would
        import real purchase costs from a procurement module.
        """
        for rec in self:
            rec.cost_price = round(rec.unit_price * 0.65, 2)

    @api.depends('unit_price', 'cost_price')
    def _compute_margin(self):
        """
        Gross Margin % = (Revenue − COGS) / Revenue
        Stored so it can be aggregated in PostgreSQL GROUP BY queries.
        """
        for rec in self:
            if rec.unit_price:
                rec.margin_pct = round(
                    (rec.unit_price - rec.cost_price) / rec.unit_price * 100, 2
                )
            else:
                rec.margin_pct = 0.0

    # ---- Constraints ---------------------------------------------------
    @api.constrains('unit_price')
    def _check_price(self):
        """Ensure prices are positive to avoid corrupting financial KPIs."""
        for rec in self:
            if rec.unit_price <= 0:
                raise models.ValidationError(
                    f'Unit price must be > 0 for product "{rec.name}".'
                )

    # ---- String representation ------------------------------------------
    def name_get(self):
        """
        Display as  "M01AB — Ibuprofen"  in relational dropdowns.
        Odoo calls this method automatically for Many2one fields.
        """
        return [(rec.id, f'{rec.atc_code} — {rec.name}') for rec in self]
