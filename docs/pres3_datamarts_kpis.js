// ============================================================
// pres3_datamarts_kpis.js  —  Presentation 3: Datamarts & KPIs
// MedTrack BI — Star Schema, 3 Datamarts, 5 KPI Views
// ============================================================
// Theme: "Midnight Executive" — navy / ice-blue / gold
// Slides: Title · Star Schema Architecture ·
//         Datamart 1: Sales Performance ·
//         Datamart 2: Product Analysis ·
//         Datamart 3: Regional Intelligence ·
//         5 KPI Views · Dashboard Preview
// ============================================================
"use strict";
const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout  = "LAYOUT_WIDE";
pres.title   = "MedTrack BI — Datamarts & KPIs";
pres.author  = "MedTrack BI Team";

// ── PALETTE ───────────────────────────────────────────────
const C = {
  bg:      "1E2761",   // Midnight navy
  panel:   "16204F",   // Darker panel
  card:    "252F6E",   // Card background
  accent:  "CADCFC",   // Ice blue (text/accent)
  accent2: "90B4F8",   // Medium blue
  gold:    "F5C842",   // Gold for highlights
  white:   "F8FAFF",   // Near white
  muted:   "8A9CC8",   // Muted blue-grey text
  green:   "50E3A4",   // Mint green for KPIs
  coral:   "FF7B7B",   // Coral for warnings
  purple:  "C3A4FB",   // Lavender for schema
  teal:    "4FD9C9",   // Teal for dimensions
};

const makeShadow = () => ({ type: "outer", blur: 10, offset: 3, angle: 135, color: "000000", opacity: 0.22 });

// ============================================================
// SLIDE 1: TITLE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.panel };

  // Decorative top strip
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.1, fill: { color: C.gold }, line: { color: C.gold } });

  // Central card
  s.addShape(pres.shapes.RECTANGLE, {
    x: 1.0, y: 0.9, w: 11.33, h: 5.3,
    fill: { color: C.bg }, line: { color: C.accent2, width: 1 }, shadow: makeShadow(),
  });

  // Big icon row
  const icons = ["⭐", "📊", "🏆"];
  icons.forEach((ico, i) => {
    s.addText(ico, { x: 3.8 + i * 2.2, y: 1.1, w: 1.8, h: 1.0, fontSize: 40, align: "center", margin: 0 });
  });

  s.addText("Datamarts & KPIs", {
    x: 1.0, y: 2.3, w: 11.33, h: 0.85,
    fontSize: 42, bold: true, color: C.white, align: "center", fontFace: "Calibri", margin: 0,
  });
  s.addText("Star Schema · 3 Datamarts · 5 KPI Views · React Dashboard", {
    x: 1.0, y: 3.2, w: 11.33, h: 0.5,
    fontSize: 17, color: C.accent, align: "center", margin: 0,
  });

  // Stats row
  const stats = [
    { n: "3", label: "Datamarts" },
    { n: "5", label: "KPI Views" },
    { n: "4", label: "Dimensions" },
    { n: "52K", label: "Fact Rows" },
    { n: "6yr", label: "Time Range" },
  ];
  stats.forEach((st, i) => {
    const x = 1.2 + i * 2.2;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 3.92, w: 1.95, h: 0.9, fill: { color: C.card }, line: { color: C.accent2, width: 1 } });
    s.addText(st.n, { x, y: 3.97, w: 1.95, h: 0.45, fontSize: 24, bold: true, color: C.gold, align: "center", margin: 0 });
    s.addText(st.label, { x, y: 4.45, w: 1.95, h: 0.3, fontSize: 10, color: C.muted, align: "center", margin: 0 });
  });

  s.addText("Presentation 3 of 3  ·  MedTrack BI — Pharma Sales Intelligence", {
    x: 1.0, y: 5.0, w: 11.33, h: 0.3, fontSize: 10, color: C.muted, align: "center", italic: true, margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.4, w: 13.33, h: 0.1, fill: { color: C.accent2 }, line: { color: C.accent2 } });
}

// ============================================================
// SLIDE 2: STAR SCHEMA ARCHITECTURE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.panel };

  s.addText("Star Schema Architecture", { x: 0.5, y: 0.28, w: 12, h: 0.58, fontSize: 28, bold: true, color: C.white });
  s.addText("Four dimension tables surrounding one central fact table", { x: 0.5, y: 0.9, w: 12, h: 0.3, fontSize: 13, color: C.muted });

  // Central fact table
  s.addShape(pres.shapes.RECTANGLE, {
    x: 4.9, y: 2.4, w: 3.5, h: 2.6,
    fill: { color: C.bg }, line: { color: C.gold, width: 2 }, shadow: makeShadow(),
  });
  s.addText("⭐  FACT_SALES", { x: 4.9, y: 2.48, w: 3.5, h: 0.42, fontSize: 13, bold: true, color: C.gold, align: "center", margin: 0 });
  const factFields = ["sale_id (PK)","date_key (FK)","product_key (FK)","region_key (FK)","customer_key (FK)","quantity","revenue","gross_profit"];
  factFields.forEach((f, i) => {
    const isFK = f.includes("FK") || f.includes("PK");
    s.addText(f, { x: 5.0, y: 2.95 + i * 0.24, w: 3.3, h: 0.22, fontSize: 8.5, color: isFK ? C.teal : C.accent, fontFace: "Consolas", margin: 0 });
  });

  // Four dimension tables
  const dims = [
    { name: "DIM_DATE",     icon: "📅", fields: ["date_key (PK)","year","quarter","month","season"], x: 0.3,  y: 2.8, color: C.teal },
    { name: "DIM_PRODUCT",  icon: "💊", fields: ["product_key (PK)","atc_code","drug_name","drug_type","unit_price"], x: 9.7, y: 2.8, color: C.accent },
    { name: "DIM_REGION",   icon: "🗺",  fields: ["region_key (PK)","region_name","division","time_zone"], x: 0.3,  y: 5.3, color: C.purple },
    { name: "DIM_CUSTOMER", icon: "🏥", fields: ["customer_key (PK)","customer_type","segment","loyalty_tier"], x: 9.7, y: 5.3, color: C.coral },
  ];

  dims.forEach(dim => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: dim.x, y: dim.y, w: 3.3, h: 1.8,
      fill: { color: C.card }, line: { color: dim.color, width: 1 }, shadow: makeShadow(),
    });
    s.addText(`${dim.icon}  ${dim.name}`, { x: dim.x + 0.08, y: dim.y + 0.05, w: 3.14, h: 0.38, fontSize: 11, bold: true, color: dim.color, margin: 0 });
    dim.fields.forEach((f, i) => {
      const isPK = f.includes("PK");
      s.addText(f, { x: dim.x + 0.12, y: dim.y + 0.47 + i * 0.25, w: 3.0, h: 0.22, fontSize: 8.5, color: isPK ? C.gold : C.accent, fontFace: "Consolas", margin: 0 });
    });
  });

  // "Rays of the star" — connecting lines (dashed visual aids as text)
  s.addText("◀── FK ──▶", { x: 3.65, y: 3.6,  w: 1.2, h: 0.3, fontSize: 9, color: C.muted, align: "center", margin: 0 });
  s.addText("◀── FK ──▶", { x: 8.5,  y: 3.6,  w: 1.2, h: 0.3, fontSize: 9, color: C.muted, align: "center", margin: 0 });
  s.addText("FK↑", { x: 6.4, y: 1.85, w: 0.55, h: 0.3, fontSize: 9, color: C.muted, align: "center", margin: 0 });
  s.addText("↓FK", { x: 6.4, y: 5.1,  w: 0.55, h: 0.3, fontSize: 9, color: C.muted, align: "center", margin: 0 });

  // Annotation
  s.addShape(pres.shapes.RECTANGLE, { x: 4.8, y: 1.3, w: 3.7, h: 0.88, fill: { color: "0D1A3A" }, line: { color: C.muted, width: 1 } });
  s.addText("Grain: 1 row = 1 hourly pharma sale\n6 years · 8 drug categories · 8 regions", {
    x: 4.9, y: 1.35, w: 3.5, h: 0.78, fontSize: 9.5, color: C.muted, align: "center", valign: "middle", italic: true, margin: 0,
  });
}

// ============================================================
// SLIDE 3: DATAMART 1 — SALES PERFORMANCE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.panel };

  // DM badge
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.65, fill: { color: C.bg }, line: { color: C.bg } });
  s.addText("DATAMART 1", { x: 0.3, y: 0.08, w: 2.0, h: 0.48, fontSize: 11, bold: true, color: C.gold, valign: "middle", margin: 0 });
  s.addText("dm_sales_performance", { x: 2.4, y: 0.1, w: 5.0, h: 0.45, fontSize: 14, bold: true, color: C.white, fontFace: "Consolas", margin: 0 });

  s.addText("Sales Performance", { x: 0.5, y: 0.85, w: 12, h: 0.58, fontSize: 26, bold: true, color: C.white });
  s.addText("Monthly revenue trends, drug profitability, cost structure, and YoY growth analysis", { x: 0.5, y: 1.48, w: 12, h: 0.3, fontSize: 12.5, color: C.muted });

  // SQL snippet (left)
  s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 1.9, w: 6.3, h: 3.5, fill: { color: "0A1020" }, line: { color: C.accent2, width: 1 } });
  s.addText("SQL Definition", { x: 0.4, y: 1.96, w: 6.1, h: 0.35, fontSize: 10.5, bold: true, color: C.accent2, fontFace: "Consolas", margin: 0 });
  const sql1 = `CREATE MATERIALIZED VIEW
  datamarts.dm_sales_performance AS
SELECT
  d.year,
  d.month,
  d.month_label,
  d.quarter_label,
  d.season,
  p.drug_name,
  p.atc_code,
  p.atc_category,
  SUM(f.quantity)     AS total_units,
  SUM(f.revenue)      AS total_revenue,
  SUM(f.gross_profit) AS total_profit,
  ROUND(AVG(f.gross_profit / f.revenue)*100,2)
                      AS avg_margin_pct,
  LAG(SUM(f.revenue),12) OVER (
    PARTITION BY p.drug_name
    ORDER BY d.year, d.month
  )                   AS revenue_prev_year
FROM warehouse.fact_sales f
JOIN warehouse.dim_date    d ON f.date_key    = d.date_key
JOIN warehouse.dim_product p ON f.product_key = p.product_key
GROUP BY 1,2,3,4,5,6,7,8;`;

  s.addText(sql1, { x: 0.38, y: 2.38, w: 6.1, h: 2.95, fontSize: 7.8, color: C.green, fontFace: "Consolas", valign: "top", margin: 0 });

  // Right: KPI cards
  const kpis = [
    { label: "Total Revenue (2018)",   value: "$741K", delta: "+12.4%", color: C.accent },
    { label: "Gross Profit Margin",    value: "35.0%",  delta: "stable", color: C.green },
    { label: "Best Month",             value: "Dec",    delta: "$78.4K", color: C.gold },
    { label: "Fastest Growth Drug",    value: "Salbutamol", delta: "+14.2%", color: C.purple },
  ];
  kpis.forEach((k, i) => {
    const y = 1.9 + i * 0.92;
    s.addShape(pres.shapes.RECTANGLE, { x: 6.9, y, w: 6.1, h: 0.8, fill: { color: C.card }, line: { color: k.color, width: 1 }, shadow: makeShadow() });
    s.addText(k.label, { x: 7.05, y: y + 0.06, w: 3.8, h: 0.3, fontSize: 10, color: C.muted, margin: 0 });
    s.addText(k.value, { x: 7.05, y: y + 0.38, w: 3.8, h: 0.34, fontSize: 18, bold: true, color: k.color, margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 11.2, y: y + 0.18, w: 1.5, h: 0.42, fill: { color: C.bg }, line: { color: k.color, width: 1 } });
    s.addText(k.delta, { x: 11.2, y: y + 0.18, w: 1.5, h: 0.42, fontSize: 10.5, bold: true, color: k.color, align: "center", valign: "middle", margin: 0 });
  });

  // Column list (what the DM provides)
  s.addShape(pres.shapes.RECTANGLE, { x: 6.9, y: 5.68, w: 6.1, h: 1.0, fill: { color: C.bg }, line: { color: C.muted, width: 1 } });
  s.addText("Columns: year, month, month_label, quarter_label, season, drug_name, atc_code, atc_category, total_units, total_revenue, total_profit, avg_margin_pct, revenue_prev_year, yoy_growth_pct", {
    x: 7.05, y: 5.75, w: 5.8, h: 0.87, fontSize: 8.5, color: C.muted, margin: 0,
  });
}

// ============================================================
// SLIDE 4: DATAMART 2 — PRODUCT ANALYSIS
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.panel };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.65, fill: { color: C.bg }, line: { color: C.bg } });
  s.addText("DATAMART 2", { x: 0.3, y: 0.08, w: 2.0, h: 0.48, fontSize: 11, bold: true, color: C.teal, valign: "middle", margin: 0 });
  s.addText("dm_product_analysis", { x: 2.4, y: 0.1, w: 5.0, h: 0.45, fontSize: 14, bold: true, color: C.white, fontFace: "Consolas", margin: 0 });

  s.addText("Product Analysis", { x: 0.5, y: 0.85, w: 12, h: 0.58, fontSize: 26, bold: true, color: C.white });
  s.addText("Market share, Rx vs OTC split, YoY growth per drug, product mix trends across 6 years", { x: 0.5, y: 1.48, w: 12, h: 0.3, fontSize: 12.5, color: C.muted });

  // Market share data table
  const drugs = [
    { name: "Salbutamol",  share: "19.2%", rev: "$142K", growth: "+14.2%", type: "Rx"  },
    { name: "Zolpidem",    share: "16.0%", rev: "$119K", growth: "+11.5%", type: "Rx"  },
    { name: "Lorazepam",   share: "13.7%", rev: "$101K", growth:  "+6.3%", type: "Rx"  },
    { name: "Ibuprofen",   share: "12.1%", rev:  "$89K", growth:  "+7.1%", type: "OTC" },
    { name: "Cetirizine",  share: "10.3%", rev:  "$76K", growth:  "+8.9%", type: "OTC" },
    { name: "Diclofenac",  share:  "9.3%", rev:  "$69K", growth:  "+4.8%", type: "Rx"  },
    { name: "Paracetamol", share:  "7.3%", rev:  "$54K", growth:  "+3.2%", type: "OTC" },
    { name: "Aspirin",     share:  "5.6%", rev:  "$42K", growth:  "-1.4%", type: "OTC" },
  ];

  const headers = ["Drug", "Market Share", "Revenue", "YoY Growth", "Type"];
  const colX    = [0.3, 3.4, 5.4, 7.2, 9.1];
  const colW    = [3.0, 1.9, 1.7, 1.8, 1.5];

  // Header
  headers.forEach((h, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: colX[i], y: 1.9, w: colW[i], h: 0.38, fill: { color: C.accent2 }, line: { color: C.accent2 } });
    s.addText(h, { x: colX[i], y: 1.9, w: colW[i], h: 0.38, fontSize: 10, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });
  });

  // Data rows
  drugs.forEach((d, ri) => {
    const y   = 2.32 + ri * 0.54;
    const bg  = ri % 2 === 0 ? C.card : C.bg;
    const cells = [d.name, d.share, d.rev, d.growth, d.type];
    cells.forEach((cell, ci) => {
      s.addShape(pres.shapes.RECTANGLE, { x: colX[ci], y, w: colW[ci], h: 0.5, fill: { color: bg }, line: { color: "1A2650", width: 1 } });
      let clr = C.accent;
      if (ci === 3) clr = cell.startsWith("-") ? C.coral : C.green;
      if (ci === 4) clr = cell === "Rx" ? C.purple : C.teal;
      s.addText(cell, { x: colX[ci] + 0.08, y: y + 0.04, w: colW[ci] - 0.16, h: 0.42, fontSize: 10, color: clr, align: ci > 0 ? "center" : "left", valign: "middle", bold: ci === 4, margin: 0 });
    });
  });

  // Right panel: key insight cards
  const insights = [
    { title: "Rx vs OTC Revenue",   body: "Rx drugs (3): $361K — 57% of total\nOTC drugs (5): $271K — 43% of total\nPrescription drugs have higher unit prices.", color: C.purple },
    { title: "Market Concentration", body: "Top 3 drugs = 48.9% of revenue\nNo single drug > 20% (healthy spread)\nSalbutamol gaining share year-over-year.", color: C.gold },
  ];
  insights.forEach((ins, i) => {
    const y = 1.9 + i * 2.5;
    s.addShape(pres.shapes.RECTANGLE, { x: 10.8, y, w: 2.2, h: 2.2, fill: { color: C.bg }, line: { color: ins.color, width: 1 }, shadow: makeShadow() });
    s.addText(ins.title, { x: 10.9, y: y + 0.08, w: 2.0, h: 0.45, fontSize: 9.5, bold: true, color: ins.color, margin: 0 });
    s.addText(ins.body,  { x: 10.9, y: y + 0.58, w: 2.0, h: 1.5,  fontSize: 9,   color: C.muted, margin: 0 });
  });
}

// ============================================================
// SLIDE 5: DATAMART 3 — REGIONAL INTELLIGENCE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.panel };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.65, fill: { color: C.bg }, line: { color: C.bg } });
  s.addText("DATAMART 3", { x: 0.3, y: 0.08, w: 2.0, h: 0.48, fontSize: 11, bold: true, color: C.coral, valign: "middle", margin: 0 });
  s.addText("dm_regional_intelligence", { x: 2.4, y: 0.1, w: 6.5, h: 0.45, fontSize: 14, bold: true, color: C.white, fontFace: "Consolas", margin: 0 });

  s.addText("Regional Intelligence", { x: 0.5, y: 0.85, w: 12, h: 0.58, fontSize: 26, bold: true, color: C.white });
  s.addText("Territory performance, salesperson KPIs, cross-region benchmarks, and seasonal patterns", { x: 0.5, y: 1.48, w: 12, h: 0.3, fontSize: 12.5, color: C.muted });

  // Region cards — 4 top regions
  const regions = [
    { name: "South East",  rev: "$198K", vs: "+4.4%", rank: "#1", color: C.gold },
    { name: "Midwest",     rev: "$187K", vs: "+3.9%", rank: "#2", color: C.accent2 },
    { name: "West Coast",  rev: "$177K", vs: "+4.1%", rank: "#3", color: C.teal },
    { name: "North East",  rev: "$162K", vs: "-1.8%", rank: "#4", color: C.coral },
  ];

  regions.forEach((r, i) => {
    const x = 0.3 + i * 3.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.9, w: 2.85, h: 1.4, fill: { color: C.card }, line: { color: r.color, width: 2 }, shadow: makeShadow() });
    s.addText(r.rank, { x: x + 0.1, y: 2.0, w: 0.55, h: 0.45, fontSize: 16, bold: true, color: r.color, margin: 0 });
    s.addText(r.name, { x: x + 0.72, y: 2.02, w: 2.0, h: 0.38, fontSize: 12, bold: true, color: C.white, margin: 0 });
    s.addText(r.rev, { x: x + 0.1, y: 2.52, w: 1.5, h: 0.38, fontSize: 18, bold: true, color: r.color, margin: 0 });
    s.addText(`vs target: ${r.vs}`, { x: x + 1.7, y: 2.6, w: 1.0, h: 0.3, fontSize: 10, color: r.vs.startsWith("-") ? C.coral : C.green, margin: 0 });
  });

  // SQL snippet
  s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y: 3.5, w: 6.5, h: 3.2, fill: { color: "0A1020" }, line: { color: C.coral, width: 1 } });
  s.addText("SQL — dm_regional_intelligence", { x: 0.4, y: 3.58, w: 6.3, h: 0.35, fontSize: 10, bold: true, color: C.coral, fontFace: "Consolas", margin: 0 });
  const sql3 = `CREATE MATERIALIZED VIEW
  datamarts.dm_regional_intelligence AS
SELECT
  r.region_name,
  r.division,
  d.year,
  d.quarter_label,
  p.drug_name,
  f.salesperson_id,
  COUNT(*)            AS transaction_count,
  SUM(f.quantity)     AS total_units,
  SUM(f.revenue)      AS total_revenue,
  SUM(f.gross_profit) AS total_profit,
  -- National average benchmark for comparison
  AVG(SUM(f.revenue)) OVER (
    PARTITION BY d.year, d.quarter_label
  )                   AS national_avg_revenue,
  -- Regional rank
  RANK() OVER (
    PARTITION BY d.year
    ORDER BY SUM(f.revenue) DESC
  )                   AS revenue_rank
FROM warehouse.fact_sales  f
JOIN warehouse.dim_region  r ON f.region_key  = r.region_key
JOIN warehouse.dim_date    d ON f.date_key    = d.date_key
JOIN warehouse.dim_product p ON f.product_key = p.product_key
GROUP BY 1,2,3,4,5,6;`;

  s.addText(sql3, { x: 0.38, y: 3.98, w: 6.3, h: 2.65, fontSize: 7.5, color: C.green, fontFace: "Consolas", valign: "top", margin: 0 });

  // Salesperson KPI list
  const sps = [
    { n: "Alex Rivera",  reg: "South East", rev: "$68.4K", pct: "105.2%" },
    { n: "Maya Chen",    reg: "Midwest",    rev: "$62.8K", pct: "104.7%" },
    { n: "James Okafor", reg: "West Coast", rev: "$59.3K", pct: "102.2%" },
    { n: "Priya Mehta",  reg: "North East", rev: "$54.2K", pct:  "98.5%" },
  ];
  s.addText("Top Salespeople — Quota Attainment", { x: 7.0, y: 3.55, w: 6.0, h: 0.38, fontSize: 12, bold: true, color: C.accent, margin: 0 });
  sps.forEach((sp, i) => {
    const y = 4.02 + i * 0.65;
    const over = parseFloat(sp.pct) >= 100;
    s.addShape(pres.shapes.RECTANGLE, { x: 7.0, y, w: 6.0, h: 0.55, fill: { color: C.card }, line: { color: over ? C.green : C.coral, width: 1 } });
    s.addText(`${i + 1}. ${sp.n}`, { x: 7.1, y: y + 0.04, w: 2.8, h: 0.45, fontSize: 11, bold: true, color: C.white, valign: "middle", margin: 0 });
    s.addText(sp.reg, { x: 9.9, y: y + 0.04, w: 1.6, h: 0.45, fontSize: 9.5, color: C.muted, valign: "middle", margin: 0 });
    s.addText(sp.rev, { x: 11.55, y: y + 0.04, w: 0.9, h: 0.45, fontSize: 10, color: C.accent, valign: "middle", margin: 0 });
    s.addText(sp.pct, { x: 12.5, y: y + 0.04, w: 0.5, h: 0.45, fontSize: 10.5, bold: true, color: over ? C.green : C.coral, valign: "middle", margin: 0 });
  });
}

// ============================================================
// SLIDE 6: KPI VIEWS
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.panel };

  s.addText("5 KPI Views", { x: 0.5, y: 0.28, w: 12, h: 0.58, fontSize: 28, bold: true, color: C.white });
  s.addText("Materialised SQL views in the kpi schema — consumed by the React dashboard", { x: 0.5, y: 0.9, w: 12, h: 0.3, fontSize: 13, color: C.muted });

  const kpis = [
    {
      name: "kpi_executive_summary",
      icon: "📌",
      color: C.gold,
      desc: "One-row YTD snapshot: total revenue, total profit, avg margin %, units sold, YoY revenue growth. Used for the top KPI card row on the dashboard Overview page.",
      cols: "ytd_revenue, ytd_profit, avg_margin_pct, yoy_growth_pct, units_sold",
    },
    {
      name: "kpi_monthly_trend",
      icon: "📈",
      color: C.green,
      desc: "Monthly revenue, profit, and running year-to-date totals using SUM() OVER window functions. Drives the line chart on the Sales Performance page.",
      cols: "year, month, monthly_revenue, monthly_profit, ytd_cumulative, mom_growth_pct",
    },
    {
      name: "kpi_top_products",
      icon: "🏆",
      color: C.accent,
      desc: "Drug rankings by revenue with market share percentage, YoY growth, and cumulative contribution. Powers the Product Analysis ranking table.",
      cols: "rank, drug_name, atc_code, revenue, market_share_pct, yoy_growth, cumulative_pct",
    },
    {
      name: "kpi_regional_scorecard",
      icon: "🗺",
      color: C.purple,
      desc: "Region-level revenue vs national average benchmark, RANK() placement, and top-performing salesperson per region. Used by Regional Intelligence dashboard.",
      cols: "region_name, revenue, national_avg, vs_benchmark_pct, rank, top_salesperson",
    },
    {
      name: "kpi_seasonal_patterns",
      icon: "❄",
      color: C.teal,
      desc: "Monthly demand index per drug (actual / annual_avg × 100). Index = 100 means exactly average demand. Used for the seasonal heatmap on Regional page.",
      cols: "drug_name, month, avg_units, annual_avg_units, seasonality_index",
    },
  ];

  kpis.forEach((k, i) => {
    const y = 1.4 + i * 1.17;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y, w: 12.73, h: 1.08, fill: { color: C.card }, line: { color: k.color, width: 1 }, shadow: makeShadow() });
    // icon + name
    s.addText(k.icon, { x: 0.38, y: y + 0.07, w: 0.55, h: 0.9, fontSize: 22, align: "center", margin: 0 });
    s.addText(k.name, { x: 0.96, y: y + 0.06, w: 4.0, h: 0.42, fontSize: 11.5, bold: true, color: k.color, fontFace: "Consolas", margin: 0 });
    s.addText(k.desc, { x: 0.96, y: y + 0.51, w: 6.8, h: 0.5,  fontSize: 9.5, color: C.muted, margin: 0 });
    // columns
    s.addShape(pres.shapes.RECTANGLE, { x: 7.9, y: y + 0.1, w: 5.0, h: 0.86, fill: { color: C.bg }, line: { color: k.color, width: 1 } });
    s.addText("Columns:", { x: 8.0, y: y + 0.12, w: 4.8, h: 0.28, fontSize: 8.5, bold: true, color: k.color, margin: 0 });
    s.addText(k.cols, { x: 8.0, y: y + 0.42, w: 4.8, h: 0.5, fontSize: 8, color: C.accent, fontFace: "Consolas", margin: 0 });
  });
}

// ============================================================
// SLIDE 7: DASHBOARD SUMMARY
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.panel };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 13.33, h: 0.1, fill: { color: C.gold }, line: { color: C.gold } });

  s.addText("Dashboard Pages & Data Connections", { x: 0.5, y: 0.28, w: 12, h: 0.58, fontSize: 26, bold: true, color: C.white });
  s.addText("How each React page maps to a datamart or KPI view", { x: 0.5, y: 0.9, w: 12, h: 0.3, fontSize: 13, color: C.muted });

  // Connection table
  const pages = [
    { page: "Overview.jsx",   icon: "🏠", dm: "kpi_executive_summary",        charts: "KPI cards, sparklines, monthly trend",         color: C.gold },
    { page: "SalesDM.jsx",    icon: "📊", dm: "dm_sales_performance\n+ kpi_monthly_trend", charts: "Line chart, stacked bar, revenue by drug", color: C.accent },
    { page: "ProductDM.jsx",  icon: "💊", dm: "dm_product_analysis\n+ kpi_top_products",   charts: "Pie chart (market share), YoY bar, ranking table", color: C.teal },
    { page: "RegionalDM.jsx", icon: "🗺", dm: "dm_regional_intelligence\n+ kpi_regional_scorecard\n+ kpi_seasonal_patterns", charts: "Bar, radar, scorecard, seasonal heatmap", color: C.purple },
  ];

  pages.forEach((p, i) => {
    const y = 1.45 + i * 1.42;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.3, y, w: 12.73, h: 1.32, fill: { color: C.card }, line: { color: p.color, width: 1 } });
    s.addText(p.icon + "  " + p.page, { x: 0.45, y: y + 0.06, w: 3.2, h: 0.4, fontSize: 13, bold: true, color: p.color, fontFace: "Consolas", margin: 0 });
    s.addText("Datamart / View:", { x: 0.45, y: y + 0.52, w: 1.5, h: 0.28, fontSize: 9, color: C.muted, margin: 0 });
    s.addText(p.dm, { x: 2.0, y: y + 0.5, w: 4.5, h: 0.72, fontSize: 9.5, color: C.green, fontFace: "Consolas", margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: 6.7, y: y + 0.12, w: 6.2, h: 1.06, fill: { color: C.bg }, line: { color: p.color, width: 1 } });
    s.addText("Charts & Widgets:", { x: 6.85, y: y + 0.18, w: 5.9, h: 0.28, fontSize: 9, bold: true, color: p.color, margin: 0 });
    s.addText(p.charts, { x: 6.85, y: y + 0.48, w: 5.9, h: 0.6, fontSize: 10, color: C.accent, margin: 0 });
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 7.4, w: 13.33, h: 0.1, fill: { color: C.accent2 }, line: { color: C.accent2 } });
}

// ── WRITE ─────────────────────────────────────────────────
pres.writeFile({ fileName: "/mnt/user-data/outputs/03_datamarts_kpis.pptx" })
  .then(() => console.log("✅ Presentation 3 saved: 03_datamarts_kpis.pptx"))
  .catch(console.error);
