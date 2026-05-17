// pres1_installation.js — Presentation 1: Installation & Setup Guide
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.title = "MedTrack BI — Installation Guide";

// ── COLOR PALETTE ──────────────────────────────────────────────────
// Deep teal/navy theme — professional, medical feel
const C = {
  bg:       "0A1628",   // Very dark navy (slide background)
  panel:    "0F2240",   // Dark panel background
  accent:   "00B4D8",   // Bright cyan (primary accent)
  accent2:  "4ADBC8",   // Teal (secondary accent)
  gold:     "F59E0B",   // Amber (highlights / warnings)
  white:    "F1F5F9",   // Off-white text
  muted:    "64748B",   // Muted/secondary text
  dim:      "1E3A5F",   // Slightly lighter than bg (card borders)
  green:    "4ADE80",   // Success green
  red:      "F87171",   // Error/warning red
};

const makeShadow = () => ({
  type: "outer", blur: 12, offset: 4,
  angle: 135, color: "000000", opacity: 0.25,
});

// ============================================================
// SLIDE 1: TITLE SLIDE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };

  // Large accent bar on left
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 7.5,
    fill: { color: C.accent },
  });

  // Decorative circles (tech feel)
  s.addShape(pres.shapes.OVAL, {
    x: 8.5, y: -1.2, w: 5, h: 5,
    fill: { color: C.dim, transparency: 60 }, line: { color: C.dim, width: 0 },
  });
  s.addShape(pres.shapes.OVAL, {
    x: 9.5, y: 3.5, w: 3, h: 3,
    fill: { color: C.accent, transparency: 85 }, line: { color: C.accent, width: 0 },
  });

  // Pill icon block
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.6, y: 0.7, w: 1.2, h: 1.2,
    fill: { color: C.accent, transparency: 20 },
    line: { color: C.accent, width: 0 },
    rectRadius: 0.2,
    shadow: makeShadow(),
  });
  s.addText("💊", { x: 0.6, y: 0.7, w: 1.2, h: 1.2, fontSize: 36, align: "center", valign: "middle" });

  // Title
  s.addText("MedTrack BI", {
    x: 0.5, y: 2.1, w: 9, h: 1.0,
    fontSize: 52, fontFace: "Trebuchet MS", bold: true,
    color: C.white, align: "left", margin: 0,
  });
  s.addText("INSTALLATION & SETUP GUIDE", {
    x: 0.5, y: 3.1, w: 9, h: 0.5,
    fontSize: 15, fontFace: "Calibri", bold: true,
    color: C.accent, align: "left", margin: 0,
    charSpacing: 5,
  });

  // Subtitle line
  s.addText("Pharmaceutical Sales Business Intelligence Platform\nBuilt on Ubuntu 22.04 · Odoo 16 · PostgreSQL 15 · React 18", {
    x: 0.5, y: 3.75, w: 9, h: 0.9,
    fontSize: 15, fontFace: "Calibri",
    color: C.muted, align: "left", margin: 0,
  });

  // Tech badges row
  const badges = ["Ubuntu 22.04", "Odoo 16", "PostgreSQL 15", "Python 3.11", "React 18", "Node.js 18"];
  badges.forEach((badge, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5 + i * 2.05, y: 5.2, w: 1.9, h: 0.38,
      fill: { color: C.dim }, line: { color: C.accent, width: 1 },
    });
    s.addText(badge, {
      x: 0.5 + i * 2.05, y: 5.2, w: 1.9, h: 0.38,
      fontSize: 9.5, fontFace: "Calibri", bold: true,
      color: C.accent2, align: "center", valign: "middle", margin: 0,
    });
  });

  // Version / date footer
  s.addText("Version 1.0.0   ·   MedTrack BI Team   ·   2024", {
    x: 0.5, y: 6.7, w: 12, h: 0.35,
    fontSize: 10, color: C.muted, align: "left", margin: 0,
  });
}

// ============================================================
// SLIDE 2: SYSTEM REQUIREMENTS & PREREQUISITES
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };

  // Title bar
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.3, h: 1.0, fill: { color: C.panel }, line: { width: 0 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.9, w: 13.3, h: 0.06, fill: { color: C.accent }, line: { width: 0 } });
  s.addText("02", { x: 0.35, y: 0.15, w: 0.65, h: 0.65, fontSize: 10, color: C.accent, bold: true, align: "center", valign: "middle", margin: 0 });
  s.addText("System Requirements & Prerequisites", { x: 1.1, y: 0.1, w: 10, h: 0.8, fontSize: 22, fontFace: "Trebuchet MS", bold: true, color: C.white, valign: "middle", margin: 0 });

  // Left column: Hardware requirements
  const hwItems = [
    ["🖥️  Operating System", "Ubuntu 22.04 LTS (64-bit)"],
    ["💾  RAM", "Minimum 4 GB · Recommended 8 GB"],
    ["💿  Storage", "Minimum 20 GB free space"],
    ["⚡  CPU", "2+ cores · x86_64 architecture"],
    ["🌐  Network", "Internet access for package installation"],
  ];

  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.2, w: 5.8, h: 3.4, fill: { color: C.panel }, line: { color: C.dim, width: 1 }, shadow: makeShadow() });
  s.addText("HARDWARE", { x: 0.5, y: 1.3, w: 5.5, h: 0.35, fontSize: 11, fontFace: "Calibri", bold: true, color: C.accent, charSpacing: 4, margin: 0 });

  hwItems.forEach(([label, value], i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.75 + i * 0.55, w: 5.5, h: 0.45, fill: { color: i % 2 === 0 ? "0D2038" : C.panel }, line: { width: 0 } });
    s.addText(label, { x: 0.6, y: 1.77 + i * 0.55, w: 2.5, h: 0.40, fontSize: 10.5, color: C.muted, valign: "middle", margin: 0 });
    s.addText(value, { x: 3.1, y: 1.77 + i * 0.55, w: 2.7, h: 0.40, fontSize: 10.5, color: C.white, bold: true, valign: "middle", margin: 0 });
  });

  // Right column: Software stack
  const swItems = [
    ["PostgreSQL 15", "Database engine + DW", C.accent],
    ["Odoo 16 Community", "ERP + transactional system", C.accent2],
    ["Python 3.11+", "ETL pipeline runtime", C.gold],
    ["Node.js 18 LTS", "React dashboard build", C.green],
    ["Nginx", "Web server / reverse proxy", C.accent],
    ["wkhtmltopdf 0.12.6", "Odoo PDF report generator", C.muted],
  ];

  s.addShape(pres.shapes.RECTANGLE, { x: 6.8, y: 1.2, w: 6.1, h: 4.0, fill: { color: C.panel }, line: { color: C.dim, width: 1 }, shadow: makeShadow() });
  s.addText("SOFTWARE STACK", { x: 6.9, y: 1.3, w: 5.8, h: 0.35, fontSize: 11, bold: true, color: C.accent, charSpacing: 4, margin: 0 });

  swItems.forEach(([name, desc, color], i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 6.85, y: 1.72 + i * 0.56, w: 0.05, h: 0.38, fill: { color }, line: { width: 0 } });
    s.addText(name, { x: 7.05, y: 1.72 + i * 0.56, w: 2.8, h: 0.38, fontSize: 11, bold: true, color: C.white, valign: "middle", margin: 0 });
    s.addText(desc, { x: 9.85, y: 1.72 + i * 0.56, w: 2.9, h: 0.38, fontSize: 10, color: C.muted, valign: "middle", margin: 0 });
  });

  // Dataset callout
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 4.8, w: 12.5, h: 0.9,
    fill: { color: "0A2540" }, line: { color: C.accent, width: 1 },
  });
  s.addText("📦  DATASET", { x: 0.7, y: 4.85, w: 1.4, h: 0.8, fontSize: 10, bold: true, color: C.accent, valign: "middle", margin: 0 });
  s.addText("Pharma Drug Sales  ·  milanzdravkovic/pharma-sales-data  ·  Kaggle  ·  ~52,000 rows (hourly)  ·  6 years (2014-2019)  ·  8 drug categories (ATC classification)", {
    x: 2.1, y: 4.85, w: 10.5, h: 0.8, fontSize: 10.5, color: C.white, valign: "middle", margin: 0,
  });

  s.addText("Run installation scripts in numbered order: 01 → 02 → 03 → 04 → 05", {
    x: 0.4, y: 5.9, w: 12.5, h: 0.4, fontSize: 10.5, color: C.muted, italic: true, margin: 0,
  });
}

// ============================================================
// SLIDE 3: INSTALLATION STEPS
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.3, h: 1.0, fill: { color: C.panel }, line: { width: 0 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.9, w: 13.3, h: 0.06, fill: { color: C.accent }, line: { width: 0 } });
  s.addText("03", { x: 0.35, y: 0.15, w: 0.65, h: 0.65, fontSize: 10, color: C.accent, bold: true, align: "center", valign: "middle", margin: 0 });
  s.addText("Step-by-Step Installation", { x: 1.1, y: 0.1, w: 10, h: 0.8, fontSize: 22, fontFace: "Trebuchet MS", bold: true, color: C.white, valign: "middle", margin: 0 });

  const steps = [
    {
      num: "01", title: "System Dependencies",
      cmd: "sudo bash scripts/01_install_system.sh",
      what: "Installs: Python 3.11, PostgreSQL 15, Node.js 18, Nginx, wkhtmltopdf, build tools",
      duration: "~10 min",
    },
    {
      num: "02", title: "Odoo 16 Community",
      cmd: "sudo bash scripts/02_install_odoo.sh",
      what: "Clones Odoo 16 from GitHub, creates venv, installs 100+ Python deps, creates systemd service",
      duration: "~20 min",
    },
    {
      num: "03", title: "PostgreSQL Setup",
      cmd: "sudo bash scripts/03_setup_postgres.sh",
      what: "Creates users (odoo, bi_reader), 2 databases (odoo_medtrack, medtrack_dw), schemas, tunes performance",
      duration: "~3 min",
    },
    {
      num: "04", title: "Download Dataset",
      cmd: "bash scripts/04_download_dataset.sh",
      what: "Downloads Pharma Sales dataset from Kaggle, or generates synthetic data if no Kaggle token",
      duration: "~2 min",
    },
    {
      num: "05", title: "Run Full ETL Pipeline",
      cmd: "bash scripts/05_run_etl.sh",
      what: "Extract → Transform → Load into PostgreSQL · Creates star schema + 3 datamarts + 5 KPI views",
      duration: "~5 min",
    },
  ];

  steps.forEach((step, i) => {
    const y = 1.1 + i * 1.2;
    // Background
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.35, y, w: 12.6, h: 1.05,
      fill: { color: C.panel }, line: { color: C.dim, width: 1 }, shadow: makeShadow(),
    });
    // Accent left border
    s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y, w: 0.07, h: 1.05, fill: { color: C.accent }, line: { width: 0 } });
    // Step number circle
    s.addShape(pres.shapes.OVAL, { x: 0.65, y: y + 0.28, w: 0.5, h: 0.5, fill: { color: C.accent }, line: { width: 0 } });
    s.addText(step.num, { x: 0.65, y: y + 0.28, w: 0.5, h: 0.5, fontSize: 10, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });
    // Title
    s.addText(step.title, { x: 1.35, y: y + 0.06, w: 5, h: 0.4, fontSize: 13, bold: true, color: C.white, valign: "middle", margin: 0 });
    // Duration badge
    s.addShape(pres.shapes.RECTANGLE, { x: 10.8, y: y + 0.1, w: 1.8, h: 0.3, fill: { color: "0A2540" }, line: { color: C.gold, width: 1 } });
    s.addText(`⏱ ${step.duration}`, { x: 10.8, y: y + 0.1, w: 1.8, h: 0.3, fontSize: 9, color: C.gold, align: "center", valign: "middle", margin: 0 });
    // Command
    s.addShape(pres.shapes.RECTANGLE, { x: 1.3, y: y + 0.48, w: 5.8, h: 0.28, fill: { color: "061224" }, line: { color: "1A3554", width: 1 } });
    s.addText(`$ ${step.cmd}`, { x: 1.4, y: y + 0.48, w: 5.7, h: 0.28, fontSize: 9.5, color: C.accent2, fontFace: "Consolas", valign: "middle", margin: 0 });
    // Description
    s.addText(step.what, { x: 7.25, y: y + 0.12, w: 5.8, h: 0.8, fontSize: 9.5, color: C.muted, valign: "middle", margin: 0 });
  });
}

// ============================================================
// SLIDE 4: PROJECT FOLDER STRUCTURE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.3, h: 1.0, fill: { color: C.panel }, line: { width: 0 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.9, w: 13.3, h: 0.06, fill: { color: C.accent }, line: { width: 0 } });
  s.addText("04", { x: 0.35, y: 0.15, w: 0.65, h: 0.65, fontSize: 10, color: C.accent, bold: true, align: "center", valign: "middle", margin: 0 });
  s.addText("Project Folder Structure", { x: 1.1, y: 0.1, w: 10, h: 0.8, fontSize: 22, fontFace: "Trebuchet MS", bold: true, color: C.white, valign: "middle", margin: 0 });

  // Tree structure panel
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.1, w: 5.5, h: 5.8, fill: { color: "061224" }, line: { color: "1A3554", width: 1 }, shadow: makeShadow() });
  s.addText("DIRECTORY TREE", { x: 0.6, y: 1.15, w: 5, h: 0.3, fontSize: 9, bold: true, color: C.accent, charSpacing: 4, margin: 0 });

  const tree = [
    ["bi_odoo_project/", C.accent, 0],
    ["├── scripts/", C.accent2, 1],
    ["│   ├── 01_install_system.sh", C.white, 2],
    ["│   ├── 02_install_odoo.sh", C.white, 2],
    ["│   └── 03_setup_postgres.sh", C.white, 2],
    ["├── odoo_module/", C.gold, 1],
    ["│   ├── models/", C.white, 2],
    ["│   ├── views/", C.white, 2],
    ["│   └── security/", C.white, 2],
    ["├── etl/", C.green, 1],
    ["│   ├── extract/", C.white, 2],
    ["│   ├── transform/", C.white, 2],
    ["│   └── load/", C.white, 2],
    ["├── datamarts/", C.accent, 1],
    ["│   └── sql/", C.white, 2],
    ["└── dashboard/", "F87171", 1],
    ["    ├── src/components/", C.white, 2],
    ["    └── src/pages/", C.white, 2],
  ];

  tree.forEach(([text, color, _], i) => {
    s.addText(text, { x: 0.55, y: 1.55 + i * 0.28, w: 5.2, h: 0.27, fontSize: 9.5, color, fontFace: "Consolas", margin: 0 });
  });

  // Right panel: descriptions
  const descriptions = [
    { folder: "scripts/", color: C.accent2, desc: "Shell scripts to install and configure all system dependencies, Odoo, and PostgreSQL in the correct order." },
    { folder: "odoo_module/", color: C.gold, desc: "Custom Odoo 16 addon (medtrack_bi). Contains Python models, XML views, and security rules for pharma data." },
    { folder: "etl/", color: C.green, desc: "Python ETL pipeline: Extract CSVs from Kaggle, Transform into star schema, Load into PostgreSQL warehouse." },
    { folder: "datamarts/sql/", color: C.accent, desc: "SQL scripts that create 3 datamarts and 5 KPI materialized views in the PostgreSQL data warehouse." },
    { folder: "dashboard/", color: "F87171", desc: "React 18 SPA with Recharts visualizations. Professional login + 4 pages (Overview, Sales, Products, Regional)." },
    { folder: "config/", color: C.muted, desc: "Configuration files: odoo.conf, nginx.conf, .env templates with database credentials and service settings." },
  ];

  s.addShape(pres.shapes.RECTANGLE, { x: 6.2, y: 1.1, w: 6.7, h: 5.8, fill: { color: C.panel }, line: { color: C.dim, width: 1 }, shadow: makeShadow() });
  s.addText("FOLDER DESCRIPTIONS", { x: 6.4, y: 1.15, w: 6.2, h: 0.3, fontSize: 9, bold: true, color: C.accent, charSpacing: 4, margin: 0 });

  descriptions.forEach(({ folder, color, desc }, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 6.2, y: 1.55 + i * 0.85, w: 0.07, h: 0.7, fill: { color }, line: { width: 0 } });
    s.addText(folder, { x: 6.4, y: 1.55 + i * 0.85, w: 3, h: 0.32, fontSize: 11, bold: true, color, fontFace: "Consolas", margin: 0 });
    s.addText(desc, { x: 6.4, y: 1.87 + i * 0.85, w: 6.3, h: 0.45, fontSize: 9.5, color: C.muted, margin: 0 });
  });
}

// ============================================================
// SLIDE 5: DATA FLOW ARCHITECTURE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.3, h: 1.0, fill: { color: C.panel }, line: { width: 0 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.9, w: 13.3, h: 0.06, fill: { color: C.accent }, line: { width: 0 } });
  s.addText("05", { x: 0.35, y: 0.15, w: 0.65, h: 0.65, fontSize: 10, color: C.accent, bold: true, align: "center", valign: "middle", margin: 0 });
  s.addText("End-to-End Data Flow Architecture", { x: 1.1, y: 0.1, w: 10, h: 0.8, fontSize: 22, fontFace: "Trebuchet MS", bold: true, color: C.white, valign: "middle", margin: 0 });

  // Flow steps
  const flowSteps = [
    { label: "KAGGLE CSV", sub: "Raw Dataset\n~52K rows", icon: "📥", x: 0.4, color: C.gold },
    { label: "ETL EXTRACT", sub: "pandas read_csv\nData profiling", icon: "🔍", x: 2.65, color: C.accent },
    { label: "ETL TRANSFORM", sub: "Clean · Enrich\nStar Schema", icon: "⚙️", x: 4.9, color: C.accent2 },
    { label: "ETL LOAD", sub: "PostgreSQL\nodoo + DW", icon: "📤", x: 7.15, color: C.green },
    { label: "DATAMARTS", sub: "3 Mat. Views\n5 KPI Views", icon: "🏗️", x: 9.4, color: C.accent },
    { label: "REACT DASHBOARD", sub: "Browser UI\nRecharts", icon: "📊", x: 11.15, color: "F87171" },
  ];

  flowSteps.forEach((step, i) => {
    // Box
    s.addShape(pres.shapes.RECTANGLE, {
      x: step.x, y: 1.6, w: 1.9, h: 1.4,
      fill: { color: C.panel }, line: { color: step.color, width: 1.5 }, shadow: makeShadow(),
    });
    // Icon
    s.addText(step.icon, { x: step.x, y: 1.65, w: 1.9, h: 0.55, fontSize: 24, align: "center", valign: "middle", margin: 0 });
    // Label
    s.addText(step.label, { x: step.x, y: 2.18, w: 1.9, h: 0.35, fontSize: 9, bold: true, color: step.color, align: "center", margin: 0 });
    // Sub
    s.addText(step.sub, { x: step.x, y: 2.52, w: 1.9, h: 0.45, fontSize: 8, color: C.muted, align: "center", margin: 0 });
    // Arrow (except last)
    if (i < flowSteps.length - 1) {
      s.addShape(pres.shapes.LINE, {
        x: step.x + 1.93, y: 2.3, w: 0.67, h: 0,
        line: { color: step.color, width: 2, dashType: "solid" },
      });
      s.addText("►", { x: step.x + 2.38, y: 2.18, w: 0.28, h: 0.28, fontSize: 11, color: step.color, align: "center", margin: 0 });
    }
  });

  // Technology annotations
  const annotations = [
    { x: 0.4,  y: 3.3, text: "saleshourly.csv\nsalesmonthly.csv", color: C.gold },
    { x: 2.65, y: 3.3, text: "extract_kaggle.py\ngenerate_synthetic.py", color: C.accent },
    { x: 4.9,  y: 3.3, text: "transform_pharma.py\nWide→Long · Enrich · Validate", color: C.accent2 },
    { x: 7.15, y: 3.3, text: "load_datamart.py\nSQLAlchemy · psycopg2", color: C.green },
    { x: 9.4,  y: 3.3, text: "03_create_datamarts.sql\n04_kpi_views.sql", color: C.accent },
    { x: 11.15,y: 3.3, text: "App.jsx · Overview.jsx\nRecharts · Login.jsx", color: "F87171" },
  ];

  annotations.forEach((a) => {
    s.addText(a.text, { x: a.x, y: a.y, w: 1.95, h: 0.65, fontSize: 8, color: a.color, align: "center", margin: 0 });
  });

  // Odoo parallel path annotation
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 4.2, w: 8.65, h: 0.85,
    fill: { color: "0D1E35" }, line: { color: C.gold, width: 1, dashType: "dash" },
  });
  s.addText("⚡  ODOO PARALLEL PATH: ETL also loads data into Odoo 16 via XML-RPC API → pharma.sale records · Used for operational reporting within Odoo's UI", {
    x: 0.6, y: 4.25, w: 8.4, h: 0.75, fontSize: 9.5, color: C.gold, valign: "middle", margin: 0,
  });

  s.addText("OLTP (Odoo) → operational data · OLAP (PostgreSQL DW) → analytical data · Star Schema enables fast aggregations", {
    x: 0.4, y: 5.35, w: 12.5, h: 0.4, fontSize: 10, color: C.muted, italic: true, align: "center", margin: 0,
  });
}

// ============================================================
// SLIDE 6: POST-INSTALLATION CHECKLIST
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.bg };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.3, h: 1.0, fill: { color: C.panel }, line: { width: 0 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.9, w: 13.3, h: 0.06, fill: { color: C.green }, line: { width: 0 } });
  s.addText("✅  Post-Installation Verification Checklist", { x: 0.5, y: 0.1, w: 12, h: 0.8, fontSize: 22, fontFace: "Trebuchet MS", bold: true, color: C.white, valign: "middle", margin: 0 });

  const checks = [
    { step: "1", item: "Odoo Web UI accessible", cmd: "curl http://localhost:8069/web/health", expected: "HTTP 200 / {\"status\": \"pass\"}", cat: "Odoo" },
    { step: "2", item: "PostgreSQL running", cmd: "systemctl is-active postgresql", expected: "active", cat: "DB" },
    { step: "3", item: "Odoo DB created", cmd: "psql -U odoo -d odoo_medtrack -c '\\dt' | wc -l", expected: "> 300 (Odoo tables)", cat: "DB" },
    { step: "4", item: "DW schemas exist", cmd: "psql -d medtrack_dw -c '\\dn'", expected: "staging, warehouse, datamarts, kpi", cat: "DW" },
    { step: "5", item: "Fact table loaded", cmd: "psql -d medtrack_dw -c 'SELECT COUNT(*) FROM warehouse.fact_sales'", expected: "> 400,000 rows", cat: "ETL" },
    { step: "6", item: "Datamarts created", cmd: "psql -d medtrack_dw -c '\\dm datamarts.*'", expected: "3 materialized views listed", cat: "DW" },
    { step: "7", item: "React dashboard runs", cmd: "cd dashboard && npm start", expected: "http://localhost:3000 opens in browser", cat: "UI" },
    { step: "8", item: "Login works", cmd: "(browser test)", expected: "admin@medtrack.local / admin123 signs in", cat: "UI" },
  ];

  const catColors = { "Odoo": C.accent, "DB": C.accent2, "ETL": C.gold, "DW": C.green, "UI": "F87171" };

  checks.forEach((c, i) => {
    const y = 1.15 + i * 0.72;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.35, y, w: 12.6, h: 0.63,
      fill: { color: i % 2 === 0 ? C.panel : "0D1E35" }, line: { color: C.dim, width: 1 },
    });
    // Cat badge
    const catColor = catColors[c.cat] || C.muted;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: y + 0.08, w: 0.75, h: 0.27, fill: { color: catColor + "30" }, line: { color: catColor, width: 1 } });
    s.addText(c.cat, { x: 0.4, y: y + 0.08, w: 0.75, h: 0.27, fontSize: 8, bold: true, color: catColor, align: "center", valign: "middle", margin: 0 });
    // Item
    s.addText(c.item, { x: 1.25, y: y + 0.04, w: 3.2, h: 0.28, fontSize: 10.5, bold: true, color: C.white, valign: "middle", margin: 0 });
    s.addText(`$ ${c.cmd}`, { x: 1.25, y: y + 0.34, w: 5.8, h: 0.24, fontSize: 8.5, color: C.accent2, fontFace: "Consolas", margin: 0 });
    s.addText(`Expected: ${c.expected}`, { x: 7.2, y: y + 0.1, w: 5.6, h: 0.42, fontSize: 9, color: C.green, valign: "middle", margin: 0 });
  });
}

// Write file
pres.writeFile({ fileName: "/mnt/user-data/outputs/01_installation_guide.pptx" })
  .then(() => console.log("✅ Presentation 1 saved: 01_installation_guide.pptx"))
  .catch(console.error);
