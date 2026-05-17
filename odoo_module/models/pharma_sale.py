# pharma_sale.py — Pharmaceutical Sale Transaction Model
# =====================================================================
# ODOO ORM CONCEPTS:
#
# MODEL: A Python class that maps to a PostgreSQL table.
#   class PharmaSale(models.Model) → creates table 'pharma.sale'
#
# FIELDS: Class attributes that map to table columns.
#   fields.Char() → VARCHAR column
#   fields.Float() → NUMERIC column
#   fields.Many2one() → Foreign key column
#   fields.Date() → DATE column
#
# _name: The technical name of the model (used in code, XML, security)
# _description: Human-readable description shown in UI
#
# COMPUTED FIELDS: Fields calculated from other fields.
#   compute='_compute_gross_profit' means this field is NOT stored
#   in the database but calculated on-the-fly from other fields.
#   store=True means it IS stored (and re-computed when dependencies change).
#
# @api.depends(): Decorator that tells Odoo which field changes
#   should trigger recomputation of this field.
#
# INHERITANCE: Odoo uses 3 types of inheritance:
#   models.Model: create a new model (new table)
#   _inherit: extend an existing model (add fields to existing table)
#   _inherits: delegation inheritance (share an existing table)
# =====================================================================

from odoo import models, fields, api
from odoo.exceptions import ValidationError


class PharmaSale(models.Model):
    """
    Represents a pharmaceutical product sale transaction.
    Each record = one sale of one drug product at one time.
    
    This is the OLTP equivalent of our warehouse.fact_sales table.
    Odoo stores this in PostgreSQL table: pharma_sale
    """
    
    # Technical name → creates table 'pharma_sale' in PostgreSQL
    # Convention: use dot notation (module.model) for the name
    _name = "pharma.sale"
    
    # Description shown in Odoo UI
    _description = "Pharmaceutical Sale Transaction"
    
    # Order of records when displayed in list views (newest first)
    _order = "sale_date desc, id desc"
    
    # ── IDENTIFICATION FIELDS ─────────────────────────────────────────────────
    
    # Char: variable-length text (like VARCHAR in SQL)
    # required=True: NOT NULL constraint
    # string='...': label shown in the UI
    name = fields.Char(
        string="Transaction Reference",
        required=True,
        # copy=False: when duplicating a record, don't copy this field
        copy=False,
        # Default: auto-generate a sequence number (e.g. "PHARMA-2024-0001")
        # In production, replace with ir.sequence for auto-numbering
        default=lambda self: self.env["ir.sequence"].next_by_code("pharma.sale") or "New",
    )
    
    # ── DATE FIELDS ──────────────────────────────────────────────────────────
    
    # Date: stores a date (no time). Maps to DATE in PostgreSQL.
    sale_date = fields.Date(
        string="Sale Date",
        required=True,
        # Default to today's date
        default=fields.Date.context_today,
        # index=True: creates a PostgreSQL index for faster queries on this field
        index=True,
    )
    
    # Integer: stores a whole number. Maps to INTEGER in PostgreSQL.
    sale_hour = fields.Integer(
        string="Hour of Day",
        help="Hour when the sale occurred (0-23). Used for time-of-day analysis.",
        default=9,
    )
    
    # Selection: dropdown menu. Maps to VARCHAR with constraint in PostgreSQL.
    weekday = fields.Selection(
        string="Weekday",
        selection=[
            ("Monday", "Monday"),
            ("Tuesday", "Tuesday"),
            ("Wednesday", "Wednesday"),
            ("Thursday", "Thursday"),
            ("Friday", "Friday"),
            ("Saturday", "Saturday"),
            ("Sunday", "Sunday"),
        ],
        compute="_compute_weekday",
        store=True,  # stored=True means the computed value is saved to the DB
        help="Automatically computed from the sale date.",
    )
    
    # ── PRODUCT REFERENCE ─────────────────────────────────────────────────────
    
    # Many2one: a foreign key to another model
    # 'pharma.product': the model this field points to
    # ondelete='restrict': prevents deleting a product if sales reference it
    product_id = fields.Many2one(
        comodel_name="pharma.product",
        string="Drug Product",
        required=True,
        ondelete="restrict",
        index=True,
    )
    
    # Related field: reads a field from the linked model
    # Useful for displaying product info without a JOIN in the view
    drug_code = fields.Char(
        related="product_id.drug_code",
        string="ATC Code",
        store=True,   # Storing denormalized copy speeds up searches
    )
    
    drug_category = fields.Char(
        related="product_id.drug_category",
        string="Category",
        store=True,
    )
    
    # ── BUSINESS DIMENSION FIELDS ──────────────────────────────────────────────
    
    region = fields.Selection(
        string="Region",
        selection=[
            ("North", "North"),
            ("South", "South"),
            ("East", "East"),
            ("West", "West"),
            ("Central", "Central"),
        ],
        required=True,
        index=True,
    )
    
    customer_type = fields.Selection(
        string="Customer Channel",
        selection=[
            ("Hospital", "Hospital"),
            ("Retail Pharmacy", "Retail Pharmacy"),
            ("Clinic", "Clinic"),
            ("Online", "Online"),
            ("Wholesaler", "Wholesaler"),
        ],
        required=True,
    )
    
    # Char: 10-character salesperson ID code
    salesperson_id = fields.Char(
        string="Salesperson ID",
        size=10,
    )
    
    # ── FINANCIAL MEASURE FIELDS ──────────────────────────────────────────────
    
    # Float: decimal number. Maps to FLOAT8 (double precision) in PostgreSQL.
    # digits=(12, 2): 12 total digits, 2 decimal places
    quantity_sold = fields.Float(
        string="Quantity Sold (units)",
        required=True,
        digits=(12, 2),
        help="Number of drug units sold in this transaction.",
    )
    
    unit_price = fields.Float(
        string="Unit Price (€)",
        required=True,
        digits=(10, 2),
    )
    
    # Computed field: automatically calculated, NOT editable by user
    revenue = fields.Float(
        string="Revenue (€)",
        compute="_compute_financials",
        store=True,          # Save to DB so it can be searched/aggregated
        digits=(14, 2),
    )
    
    cost = fields.Float(
        string="Cost (€)",
        compute="_compute_financials",
        store=True,
        digits=(14, 2),
        help="Estimated cost (65% of revenue).",
    )
    
    gross_profit = fields.Float(
        string="Gross Profit (€)",
        compute="_compute_financials",
        store=True,
        digits=(14, 2),
    )
    
    gross_margin_pct = fields.Float(
        string="Gross Margin %",
        compute="_compute_financials",
        store=True,
        digits=(5, 1),
    )
    
    # Boolean: TRUE/FALSE flag. Maps to BOOLEAN in PostgreSQL.
    is_outlier = fields.Boolean(
        string="Statistical Outlier",
        default=False,
        help="Flagged if quantity > 3 standard deviations from mean.",
    )
    
    # ── COMPUTED FIELD METHODS ─────────────────────────────────────────────────
    
    # @api.depends tells Odoo to recompute `weekday` whenever `sale_date` changes
    @api.depends("sale_date")
    def _compute_weekday(self):
        """Automatically derive the weekday name from the sale date."""
        for record in self:
            if record.sale_date:
                # Python's strftime('%A') returns full weekday name: Monday, etc.
                record.weekday = record.sale_date.strftime("%A")
            else:
                record.weekday = False
    
    # @api.depends: recompute financials when quantity or price changes
    @api.depends("quantity_sold", "unit_price")
    def _compute_financials(self):
        """Calculate revenue, cost, and profit from quantity × price."""
        COST_RATIO = 0.65  # 65% cost ratio (pharma industry typical)
        
        # self is a recordset (can be 1 or many records)
        # We loop through each record to compute individually
        for record in self:
            rev = record.quantity_sold * record.unit_price
            cost = rev * COST_RATIO
            profit = rev - cost
            
            record.revenue = round(rev, 2)
            record.cost = round(cost, 2)
            record.gross_profit = round(profit, 2)
            
            # Avoid division by zero with a conditional expression
            record.gross_margin_pct = round(profit / rev * 100, 1) if rev > 0 else 0.0
    
    # ── VALIDATION (CONSTRAINTS) ──────────────────────────────────────────────
    
    # @api.constrains: runs validation after save; raises error to user if violated
    @api.constrains("quantity_sold", "unit_price")
    def _check_positive_values(self):
        """Ensure quantity and price are not negative."""
        for record in self:
            if record.quantity_sold < 0:
                raise ValidationError("Quantity sold cannot be negative.")
            if record.unit_price < 0:
                raise ValidationError("Unit price cannot be negative.")
    
    # ── SQL CONSTRAINTS ───────────────────────────────────────────────────────
    
    # _sql_constraints: enforced at the PostgreSQL level (faster than Python)
    # [(name, constraint_sql, error_message), ...]
    _sql_constraints = [
        (
            "positive_quantity",
            "CHECK(quantity_sold >= 0)",
            "Quantity sold must be greater than or equal to 0.",
        ),
        (
            "positive_price",
            "CHECK(unit_price >= 0)",
            "Unit price must be greater than or equal to 0.",
        ),
    ]
    
    # ── ORM OVERRIDE METHODS ─────────────────────────────────────────────────
    
    def name_get(self):
        """
        Override: how a record is displayed when referenced in a Many2one field.
        Default: shows the `name` field. We add the drug code and date.
        """
        result = []
        for record in self:
            display = f"{record.name} — {record.drug_code or '?'} ({record.sale_date})"
            result.append((record.id, display))
        return result
