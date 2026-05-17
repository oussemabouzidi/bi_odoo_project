// ============================================================
// pres2_odoo_module.js  —  Presentation 2: Odoo Module
// MedTrack BI — What the Odoo module does, how it's built,
// how data enters the system, and how Odoo connects to the DW.
// ============================================================
// Theme: "Ocean Gradient" — deep blue / teal / midnight
// Slides: Title · What is Odoo · Module Architecture ·
//         ORM Models Deep-Dive · Data Entry Flow ·
//         Odoo → PostgreSQL Bridge · Summary
// ============================================================
"use strict";
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout  = "LAYOUT_WIDE";   // 13.33" × 7.5"
pres.title   = "MedTrack BI — Odoo Module Guide";
pres.author  = "MedTrack BI Team";

// ── PALETTE ───────────────────────────────────────────────
const C = {
  bg:      "065A82",   // Deep ocean blue (dark slides)
  panel:   "0A3D5C",   // Slightly lighter panel
  card:    "0D4F73",   // Card background
  accent:  "21E6C1",   // Bright teal (primary accent)
  accent2: "00B4D8",   // Cyan (secondary)
  gold:    "F5A623",   // Amber for highlights
  white:   "F0F9FF",   // Ice white text
  muted:   "7ECEE0",   // Muted cyan text
  light:   "E2F4FB",   // Very light blue
  dark:    "021B26",   // Near black for dark backgrounds
  green:   "34D399",   // Emerald for positive
  purple:  "A78BFA",   // Lavender for technical callouts
};

const makeShadow = () => ({ type: "outer", blur: 10, offset: 3, angle: 135, color: "000000", opacity: 0.2 });

// ============================================================
// SLIDE 1: TITLE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  // Full-width gradient band — top strip
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: C.accent }, line: { color: C.accent } });

  // Central content box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 1.5, y: 1.0, w: 10.33, h: 5.0,
    fill: { color: C.panel },
    line: { color: C.accent, width: 1 },
    shadow: makeShadow(),
  });

  // Module icon (big square pill shape suggestion)
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.8, y: 1.4, w: 1.73, h: 1.73,
    fill: { color: C.accent },
    line: { color: C.accent },
    shadow: makeShadow(),
  });
  s.addText("⚙", { x: 5.8, y: 1.38, w: 1.73, h: 1.73, fontSize: 52, align: "center", valign: "middle", margin: 0 });

  s.addText("MedTrack BI", {
    x: 1.5, y: 3.3, w: 10.33, h: 0.7,
    fontSize: 38, bold: true, color: C.white, align: "center", fontFace: "Calibri", margin: 0,
  });
  s.addText("Odoo Module — Architecture & Implementation", {
    x: 1.5, y: 4.05, w: 10.33, h: 0.5,
    fontSize: 18, color: C.accent, align: "center", fontFace: "Calibri", margin: 0,
  });
  s.addText("Presentation 2 of 3  ·  Module: medtrack_bi  ·  Odoo 16 Community", {
    x: 1.5, y: 4.65, w: 10.33, h: 0.35,
    fontSize: 11, color: C.muted, align: "center", margin: 0,
  });

  // Bottom strip
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.38, w: 13.33, h: 0.12, fill: { color: C.accent2 }, line: { color: C.accent2 } });
}

// ============================================================
// SLIDE 2: WHAT IS ODOO — OVERVIEW
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  s.addText("What is Odoo?", { x: 0.5, y: 0.3, w: 12.33, h: 0.6, fontSize: 28, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("Understanding the platform before building on it", { x: 0.5, y: 0.95, w: 12, h: 0.3, fontSize: 13, color: C.muted });

  // 4 concept cards
  const cards = [
    { icon: "🏗", title: "Framework", body: "Open-source ERP framework built on Python. Provides ORM, web framework, and module system." },
    { icon: "🧩", title: "Module System", body: "Functionality in self-contained modules (__manifest__.py, models, views). MedTrack BI is a custom module." },
    { icon: "🗄", title: "PostgreSQL Backend", body: "Every Odoo model maps to a PostgreSQL table. Odoo manages schema creation via migrations." },
    { icon: "🔗", title: "Our Role", body: "We use Odoo as the OLTP data entry system, then ETL the data to the separate DW for analytics." },
  ];

  cards.forEach((c, i) => {
    const x = 0.35 + i * 3.2;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: 3.0, h: 2.8, fill: { color: C.card }, line: { color: C.accent, width: 1 }, shadow: makeShadow() });
    s.addText(c.icon, { x, y: 1.55, w: 3.0, h: 0.9, fontSize: 32, align: "center", margin: 0 });
    s.addText(c.title, { x: x + 0.1, y: 2.5, w: 2.8, h: 0.4, fontSize: 14, bold: true, color: C.accent, align: "center", margin: 0 });
    s.addText(c.body,  { x: x + 0.15, y: 2.95, w: 2.7, h: 1.2, fontSize: 10, color: C.muted, align: "center", valign: "top", margin: 0 });
  });

  // Odoo architecture label at bottom
  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 4.6, w: 12.63, h: 0.05, fill: { color: C.accent2 }, line: { color: C.accent2 } });
  s.addText("Odoo Architecture: Browser → Web Controller → ORM → PostgreSQL", {
    x: 0.35, y: 4.7, w: 12.63, h: 0.4, fontSize: 11, color: C.muted, align: "center", italic: true, margin: 0,
  });

  // Two-column: Odoo does / We add
  const cols = [
    { x: 0.35, title: "What Odoo Gives Us", color: C.accent, items: ["User authentication & roles","Web UI & list/form views","ORM models → auto SQL","Validation & constraints","Built-in audit log"] },
    { x: 6.65, title: "What We Build On Top", color: C.gold,  items: ["Custom PharmaProduct model","Custom PharmaSale model","ETL bridge to medtrack_dw","React BI dashboard","KPI materialized views"] },
  ];

  cols.forEach(col => {
    s.addText(col.title, { x: col.x, y: 5.2, w: 6.0, h: 0.4, fontSize: 13, bold: true, color: col.color, margin: 0 });
    s.addText(col.items.map(t => `▸  ${t}`).join("\n"), {
      x: col.x, y: 5.65, w: 6.0, h: 1.5, fontSize: 11, color: C.white, valign: "top", margin: 0,
    });
  });
}

// ============================================================
// SLIDE 3: MODULE ARCHITECTURE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  s.addText("Module Architecture", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, bold: true, color: C.white });
  s.addText("File structure and responsibility of each component", { x: 0.5, y: 0.95, w: 12, h: 0.3, fontSize: 13, color: C.muted });

  // Folder tree (left column)
  const tree = [
    { indent: 0, text: "medtrack_bi/",             color: C.accent,  bold: true },
    { indent: 1, text: "__manifest__.py",           color: C.gold,    bold: false },
    { indent: 1, text: "__init__.py",               color: C.muted,   bold: false },
    { indent: 1, text: "models/",                  color: C.accent2, bold: true },
    { indent: 2, text: "__init__.py",               color: C.muted,   bold: false },
    { indent: 2, text: "pharma_product.py",         color: C.green,   bold: false },
    { indent: 2, text: "pharma_sale.py",            color: C.green,   bold: false },
    { indent: 1, text: "views/",                   color: C.accent2, bold: true },
    { indent: 2, text: "pharma_product_views.xml", color: C.muted,   bold: false },
    { indent: 2, text: "pharma_sale_views.xml",    color: C.muted,   bold: false },
    { indent: 1, text: "security/",                color: C.accent2, bold: true },
    { indent: 2, text: "ir.model.access.csv",      color: C.muted,   bold: false },
  ];

  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 1.45, w: 5.5, h: 5.5, fill: { color: C.panel }, line: { color: C.accent, width: 1 } });
  s.addText("📁 Module Structure", { x: 0.5, y: 1.55, w: 5.2, h: 0.4, fontSize: 12, bold: true, color: C.accent, margin: 0 });

  tree.forEach((item, i) => {
    const prefix = "  ".repeat(item.indent);
    s.addText(prefix + (item.indent > 0 ? "├─ " : "") + item.text, {
      x: 0.5, y: 2.05 + i * 0.38, w: 5.0, h: 0.35,
      fontSize: 10, bold: item.bold, color: item.color, fontFace: "Consolas", margin: 0,
    });
  });

  // Right: what each file does
  const files = [
    { name: "__manifest__.py",    color: C.gold,    desc: "Module registry — name, version, depends. Odoo reads this to install the module." },
    { name: "pharma_product.py",  color: C.green,   desc: "Drug catalogue ORM model. Defines ATC code, price, Rx/OTC. Stored in medtrack.pharma.product table." },
    { name: "pharma_sale.py",     color: C.green,   desc: "Transaction model. Each row = one sale record. References product & region via Many2one fields." },
    { name: "views/*.xml",        color: C.accent2, desc: "Odoo list/form views (XML). Defines which fields appear in the web UI, filters, and search panels." },
    { name: "ir.model.access.csv",color: C.muted,   desc: "Access control matrix: which user groups can read/write/create/delete each model." },
  ];

  s.addText("File Responsibilities", { x: 6.2, y: 1.55, w: 6.8, h: 0.4, fontSize: 13, bold: true, color: C.white, margin: 0 });

  files.forEach((f, i) => {
    const y = 2.05 + i * 0.95;
    s.addShape(pres.shapes.RECTANGLE, { x: 6.2, y, w: 6.8, h: 0.82, fill: { color: C.card }, line: { color: f.color, width: 1 } });
    s.addText(f.name, { x: 6.35, y: y + 0.05, w: 6.5, h: 0.3, fontSize: 10.5, bold: true, color: f.color, fontFace: "Consolas", margin: 0 });
    s.addText(f.desc, { x: 6.35, y: y + 0.38, w: 6.5, h: 0.38, fontSize: 9.5, color: C.muted, margin: 0 });
  });
}

// ============================================================
// SLIDE 4: ORM MODELS DEEP DIVE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  s.addText("ORM Models Deep Dive", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, bold: true, color: C.white });
  s.addText("How Odoo models map to PostgreSQL tables", { x: 0.5, y: 0.95, w: 12, h: 0.3, fontSize: 13, color: C.muted });

  // Model comparison table
  const headers = ["Odoo Concept", "Python Code", "PostgreSQL Result", "Purpose"];
  const rows = [
    ["models.Model",  "class PharmaSale(models.Model):", "CREATE TABLE medtrack_pharma_sale (...)", "Registers a new table in Odoo's DB"],
    ["_name",         '_name = "medtrack.pharma.sale"',   'Table name: medtrack_pharma_sale',          "Odoo replaces dots with underscores"],
    ["fields.Char",   "drug_name = fields.Char(...)",      "drug_name VARCHAR(255)",                   "Text field → VARCHAR column"],
    ["fields.Float",  "quantity = fields.Float(...)",      "quantity DOUBLE PRECISION",                "Numeric field → float8 column"],
    ["fields.Date",   "sale_date = fields.Date(...)",      "sale_date DATE",                           "Date field → DATE column"],
    ["Many2one",      "product_id = fields.Many2one(...)", "product_id INTEGER (FK)",                  "Relational FK to product table"],
    ["@api.depends",  "@api.depends('qty','price')",       "(stored=True → SQL column)",               "Computed fields stored in DB"],
    ["@api.constrains","@api.constrains('qty')",           "Checked before INSERT/UPDATE",             "Business rule validation"],
  ];

  const colW = [2.5, 3.8, 4.0, 2.6];
  const xPos = [0.35, 2.9, 6.75, 10.8];

  // Header row
  headers.forEach((h, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: xPos[i], y: 1.5, w: colW[i], h: 0.38, fill: { color: C.accent }, line: { color: C.accent } });
    s.addText(h, { x: xPos[i], y: 1.5, w: colW[i], h: 0.38, fontSize: 10, bold: true, color: C.dark, align: "center", valign: "middle", margin: 0 });
  });

  // Data rows
  rows.forEach((row, ri) => {
    const y = 1.92 + ri * 0.56;
    const bg = ri % 2 === 0 ? C.panel : C.card;
    row.forEach((cell, ci) => {
      s.addShape(pres.shapes.RECTANGLE, { x: xPos[ci], y, w: colW[ci], h: 0.52, fill: { color: bg }, line: { color: "0D2E44", width: 1 } });
      const isCode = ci === 1 || ci === 2;
      s.addText(cell, {
        x: xPos[ci] + 0.08, y: y + 0.02, w: colW[ci] - 0.16, h: 0.48,
        fontSize: isCode ? 8.5 : 9.5,
        color: isCode ? C.green : C.white,
        fontFace: isCode ? "Consolas" : "Calibri",
        valign: "middle", margin: 0,
      });
    });
  });
}

// ============================================================
// SLIDE 5: DATA ENTRY FLOW IN ODOO
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  s.addText("Data Entry Flow in Odoo", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, bold: true, color: C.white });
  s.addText("From CSV import to validated Odoo record", { x: 0.5, y: 0.95, w: 12, h: 0.3, fontSize: 13, color: C.muted });

  // Flow diagram — 6 steps
  const steps = [
    { icon: "📄", label: "CSV File",       desc: "saleshourly.csv\nKaggle dataset", color: C.gold },
    { icon: "🐍", label: "ETL Extract",    desc: "generate_synthetic.py\nor extract_kaggle.py", color: C.accent2 },
    { icon: "🔄", label: "Transform",      desc: "Reshape wide→long\nEnrich with metadata", color: C.purple },
    { icon: "🔌", label: "Odoo XML-RPC",   desc: "xmlrpc.client\nCreate model records", color: C.accent },
    { icon: "✅", label: "Validation",     desc: "@api.constrains\nField validation", color: C.green },
    { icon: "🗄", label: "PostgreSQL",     desc: "odoo_medtrack DB\nOLTP storage", color: C.gold },
  ];

  const stepW = 1.85;
  steps.forEach((st, i) => {
    const x = 0.35 + i * 2.15;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.5, w: stepW, h: 2.5, fill: { color: C.card }, line: { color: st.color, width: 2 }, shadow: makeShadow() });
    // Step number
    s.addShape(pres.shapes.OVAL, { x: x + 0.72, y: 1.55, w: 0.4, h: 0.4, fill: { color: st.color }, line: { color: st.color } });
    s.addText(String(i + 1), { x: x + 0.72, y: 1.55, w: 0.4, h: 0.4, fontSize: 11, bold: true, color: C.dark, align: "center", valign: "middle", margin: 0 });
    s.addText(st.icon, { x, y: 2.1, w: stepW, h: 0.65, fontSize: 28, align: "center", margin: 0 });
    s.addText(st.label, { x: x + 0.05, y: 2.82, w: stepW - 0.1, h: 0.35, fontSize: 11, bold: true, color: st.color, align: "center", margin: 0 });
    s.addText(st.desc,  { x: x + 0.08, y: 3.22, w: stepW - 0.16, h: 0.72, fontSize: 9, color: C.muted, align: "center", margin: 0 });

    // Arrow between steps
    if (i < steps.length - 1) {
      s.addShape(pres.shapes.RECTANGLE, { x: x + stepW + 0.05, y: 2.68, w: 0.25, h: 0.08, fill: { color: C.muted }, line: { color: C.muted } });
      s.addText("▶", { x: x + stepW + 0.06, y: 2.55, w: 0.25, h: 0.3, fontSize: 10, color: C.muted, align: "center", margin: 0 });
    }
  });

  // Two notes below
  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 4.25, w: 6.0, h: 1.4, fill: { color: C.panel }, line: { color: C.accent2, width: 1 } });
  s.addText("🔧  Odoo XML-RPC Method", { x: 0.5, y: 4.35, w: 5.7, h: 0.35, fontSize: 11, bold: true, color: C.accent2, margin: 0 });
  s.addText("models.execute_kw(\n  'medtrack.pharma.sale', 'create',\n  [{'drug_name': 'Ibuprofen', ...}]\n)", {
    x: 0.5, y: 4.72, w: 5.7, h: 0.86, fontSize: 9.5, color: C.green, fontFace: "Consolas", margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 6.7, y: 4.25, w: 6.28, h: 1.4, fill: { color: C.panel }, line: { color: C.gold, width: 1 } });
  s.addText("⚡  Why Two Databases?", { x: 6.85, y: 4.35, w: 6.0, h: 0.35, fontSize: 11, bold: true, color: C.gold, margin: 0 });
  s.addText("odoo_medtrack (OLTP): row-level writes, Odoo ORM, transactional\nmedtrack_dw (OLAP): column aggregation, star schema, BI queries\nKeeping them separate prevents BI queries from locking Odoo.", {
    x: 6.85, y: 4.72, w: 6.0, h: 0.86, fontSize: 9.5, color: C.muted, margin: 0,
  });
}

// ============================================================
// SLIDE 6: ODOO → DATAWAREHOUSE BRIDGE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  s.addText("Odoo → Data Warehouse Bridge", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, bold: true, color: C.white });
  s.addText("How OLTP data moves from Odoo to the star schema", { x: 0.5, y: 0.95, w: 12, h: 0.3, fontSize: 13, color: C.muted });

  // Two boxes: Odoo DB + DW connected by ETL
  // LEFT: Odoo
  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 1.5, w: 4.0, h: 4.0, fill: { color: C.panel }, line: { color: C.accent, width: 2 } });
  s.addText("ODOO DB\nodoo_medtrack", { x: 0.35, y: 1.55, w: 4.0, h: 0.65, fontSize: 14, bold: true, color: C.accent, align: "center", margin: 0 });
  const odooTables = ["medtrack_pharma_product","medtrack_pharma_sale","res_users  (auth)","ir_model_access  (ACL)"];
  odooTables.forEach((t, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y: 2.35 + i * 0.68, w: 3.6, h: 0.55, fill: { color: C.card }, line: { color: C.accent2, width: 1 } });
    s.addText(t, { x: 0.6, y: 2.38 + i * 0.68, w: 3.5, h: 0.48, fontSize: 9.5, color: C.white, fontFace: "Consolas", valign: "middle", margin: 0 });
  });

  // MIDDLE: ETL Arrow
  s.addShape(pres.shapes.RECTANGLE, { x: 4.6, y: 3.1, w: 4.1, h: 1.3, fill: { color: C.card }, line: { color: C.gold, width: 2 } });
  s.addText("🔄  ETL Pipeline", { x: 4.65, y: 3.15, w: 4.0, h: 0.4, fontSize: 12, bold: true, color: C.gold, align: "center", margin: 0 });
  s.addText("extract_kaggle.py\ntransform_pharma.py\nload_datamart.py", {
    x: 4.65, y: 3.57, w: 4.0, h: 0.76, fontSize: 9.5, color: C.muted, align: "center", fontFace: "Consolas", margin: 0,
  });
  s.addText("◀────────────────────────────────▶", { x: 4.45, y: 4.55, w: 4.5, h: 0.3, fontSize: 10, color: C.gold, align: "center", margin: 0 });

  // RIGHT: DW
  s.addShape(pres.shapes.RECTANGLE, { x: 8.98, y: 1.5, w: 4.0, h: 4.0, fill: { color: C.panel }, line: { color: C.green, width: 2 } });
  s.addText("DATA WAREHOUSE\nmedtrack_dw", { x: 8.98, y: 1.55, w: 4.0, h: 0.65, fontSize: 14, bold: true, color: C.green, align: "center", margin: 0 });
  const dwTables = ["warehouse.dim_date","warehouse.dim_product","warehouse.dim_region","warehouse.fact_sales"];
  dwTables.forEach((t, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 9.18, y: 2.35 + i * 0.68, w: 3.6, h: 0.55, fill: { color: C.card }, line: { color: C.green, width: 1 } });
    s.addText(t, { x: 9.23, y: 2.38 + i * 0.68, w: 3.5, h: 0.48, fontSize: 9.5, color: C.white, fontFace: "Consolas", valign: "middle", margin: 0 });
  });

  // Bottom note
  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 5.75, w: 12.63, h: 1.4, fill: { color: "021525" }, line: { color: C.muted, width: 1 } });
  s.addText("Key Design Decision: Odoo handles OLTP (writes, validation, user management). The DW handles OLAP (aggregations, KPIs, BI). They share the same PostgreSQL server but are completely separate databases. ETL runs as a daily cron job (or on-demand via 05_run_etl.sh), extracting from Odoo's tables, transforming, and loading into the star schema.", {
    x: 0.5, y: 5.85, w: 12.33, h: 1.15, fontSize: 10, color: C.muted, valign: "middle", margin: 0,
  });
}

// ============================================================
// SLIDE 7: SUMMARY & INSTALLATION COMMANDS
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.dark };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.12, fill: { color: C.accent }, line: { color: C.accent } });

  s.addText("Module Setup — Key Commands", { x: 0.5, y: 0.3, w: 12, h: 0.6, fontSize: 28, bold: true, color: C.white });
  s.addText("Installing and activating the medtrack_bi Odoo module", { x: 0.5, y: 0.95, w: 12, h: 0.3, fontSize: 13, color: C.muted });

  const commands = [
    { step: "1. Copy module",     cmd: "sudo cp -r odoo_module /opt/odoo_custom_addons/medtrack_bi",    note: "Place in custom addons path" },
    { step: "2. Set permissions", cmd: "sudo chown -R odoo:odoo /opt/odoo_custom_addons/medtrack_bi",   note: "Odoo service must own files" },
    { step: "3. Update addons",   cmd: "sudo systemctl restart odoo16",                                  note: "Restart to load addon path" },
    { step: "4. Install module",  cmd: 'odoo-bin -d odoo_medtrack -i medtrack_bi --stop-after-init',     note: "Install into Odoo DB" },
    { step: "5. Verify install",  cmd: "curl http://localhost:8069/web/database/selector",                note: "Check Odoo is running" },
    { step: "6. Run ETL",         cmd: "bash scripts/05_run_etl.sh",                                     note: "Load data into DW" },
  ];

  commands.forEach((c, i) => {
    const y = 1.5 + i * 0.85;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y, w: 12.63, h: 0.78, fill: { color: C.panel }, line: { color: C.card, width: 1 } });
    // step badge
    s.addShape(pres.shapes.RECTANGLE, { x: 0.38, y: y + 0.05, w: 1.5, h: 0.32, fill: { color: C.accent }, line: { color: C.accent } });
    s.addText(c.step, { x: 0.4, y: y + 0.05, w: 1.46, h: 0.32, fontSize: 8.5, bold: true, color: C.dark, align: "center", valign: "middle", margin: 0 });
    s.addText(c.cmd, { x: 2.0, y: y + 0.04, w: 9.0, h: 0.34, fontSize: 10, color: C.green, fontFace: "Consolas", valign: "middle", margin: 0 });
    s.addText(c.note, { x: 11.1, y: y + 0.1, w: 1.7, h: 0.55, fontSize: 8.5, color: C.muted, italic: true, valign: "middle", margin: 0 });
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.38, w: 13.33, h: 0.12, fill: { color: C.accent2 }, line: { color: C.accent2 } });
}

// ── WRITE ─────────────────────────────────────────────────
pres.writeFile({ fileName: "/mnt/user-data/outputs/02_odoo_module.pptx" })
  .then(() => console.log("✅ Presentation 2 saved: 02_odoo_module.pptx"))
  .catch(console.error);
