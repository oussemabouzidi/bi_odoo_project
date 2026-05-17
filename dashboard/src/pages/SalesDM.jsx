// ============================================================
// MedTrack BI — SalesDM.jsx
// Dashboard page: Sales Performance Datamart
// ============================================================
// Visualises dm_sales_performance (Datamart 1):
//   - Monthly revenue trend (line chart)
//   - Revenue by ATC drug category (bar chart)
//   - Gross profit vs cost breakdown (stacked bar)
//   - Top-line KPI cards (total revenue, margin, growth)
// ============================================================

import { useState, useEffect } from "react";
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

// ---- Mock data (replace with real API call to Flask/Express) --------
// Simulates what dm_sales_performance + kpi_monthly_trend return.

const MONTHLY_TREND = [
  { month: "Jan-18", revenue: 42300, profit: 14805, cost: 27495 },
  { month: "Feb-18", revenue: 38900, profit: 13615, cost: 25285 },
  { month: "Mar-18", revenue: 51200, profit: 17920, cost: 33280 },
  { month: "Apr-18", revenue: 47800, profit: 16730, cost: 31070 },
  { month: "May-18", revenue: 55100, profit: 19285, cost: 35815 },
  { month: "Jun-18", revenue: 61400, profit: 21490, cost: 39910 },
  { month: "Jul-18", revenue: 58700, profit: 20545, cost: 38155 },
  { month: "Aug-18", revenue: 63200, profit: 22120, cost: 41080 },
  { month: "Sep-18", revenue: 57900, profit: 20265, cost: 37635 },
  { month: "Oct-18", revenue: 69300, profit: 24255, cost: 45045 },
  { month: "Nov-18", revenue: 72100, profit: 25235, cost: 46865 },
  { month: "Dec-18", revenue: 78400, profit: 27440, cost: 50960 },
];

const BY_DRUG = [
  { drug: "Salbutamol", revenue: 142000, margin: 35.0 },
  { drug: "Zolpidem",   revenue: 118500, margin: 35.0 },
  { drug: "Lorazepam",  revenue: 101200, margin: 35.0 },
  { drug: "Ibuprofen",  revenue:  89400, margin: 35.0 },
  { drug: "Cetirizine", revenue:  76300, margin: 35.0 },
  { drug: "Diclofenac", revenue:  68900, margin: 35.0 },
  { drug: "Paracetamol",revenue:  54200, margin: 35.0 },
  { drug: "Aspirin",    revenue:  41700, margin: 35.0 },
];

// ---- Formatters -----------------------------------------------------
const fmtUSD   = v => `$${(v / 1000).toFixed(0)}K`;
const fmtDelta = v => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`;

// ---- KPI Card -------------------------------------------------------
function KPICard({ label, value, sub, color }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      padding: "20px 24px",
      borderLeft: `5px solid ${color}`,
      boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
      flex: 1,
      minWidth: 160,
    }}>
      <p style={{ margin: 0, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{label}</p>
      <p style={{ margin: "6px 0 4px", fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{sub}</p>}
    </div>
  );
}

// ---- Section heading ------------------------------------------------
function SectionHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
      {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{subtitle}</p>}
    </div>
  );
}

// ---- Main component -------------------------------------------------
export default function SalesDM() {
  const [year, setYear] = useState("2018");

  // In production: fetch from /api/dm_sales?year=2018
  // useEffect(() => { fetch(`/api/dm_sales?year=${year}`).then(...) }, [year])

  const totalRevenue  = MONTHLY_TREND.reduce((s, r) => s + r.revenue, 0);
  const totalProfit   = MONTHLY_TREND.reduce((s, r) => s + r.profit,  0);
  const avgMargin     = ((totalProfit / totalRevenue) * 100).toFixed(1);

  return (
    <div style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "100vh" }}>

      {/* ---- Header ---- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>
            Sales Performance
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Datamart 1 — dm_sales_performance · {year}
          </p>
        </div>
        {/* Year filter */}
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, background: "#fff", cursor: "pointer" }}
        >
          {["2014","2015","2016","2017","2018","2019"].map(y =>
            <option key={y}>{y}</option>
          )}
        </select>
      </div>

      {/* ---- KPI Row ---- */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <KPICard label="Total Revenue"   value={`$${(totalRevenue/1e6).toFixed(2)}M`}  sub="Full year"         color="#0891b2" />
        <KPICard label="Gross Profit"    value={`$${(totalProfit/1e6).toFixed(2)}M`}   sub="After COGS"        color="#10b981" />
        <KPICard label="Gross Margin"    value={`${avgMargin}%`}                        sub="Industry avg 35%"  color="#f59e0b" />
        <KPICard label="YoY Growth"      value={fmtDelta(12.4)}                         sub="vs prior year"     color="#8b5cf6" />
        <KPICard label="Active Products" value="8"                                      sub="ATC categories"    color="#ec4899" />
      </div>

      {/* ---- Monthly Revenue Trend ---- */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <SectionHeading title="Monthly Revenue & Profit Trend" subtitle="Revenue vs Gross Profit — January to December" />
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={MONTHLY_TREND} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tickFormatter={fmtUSD} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip formatter={v => `$${v.toLocaleString()}`} />
            <Legend />
            <Line type="monotone" dataKey="revenue" name="Revenue"      stroke="#0891b2" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="profit"  name="Gross Profit" stroke="#10b981" strokeWidth={2}   dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ---- Revenue by Drug ---- */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <SectionHeading title="Revenue by Drug Category" subtitle="Full-year revenue per ATC drug category" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={BY_DRUG} layout="vertical" margin={{ left: 16, right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tickFormatter={fmtUSD} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis type="category" dataKey="drug" tick={{ fill: "#334155", fontSize: 12 }} width={90} />
            <Tooltip formatter={v => `$${v.toLocaleString()}`} />
            <Bar dataKey="revenue" name="Revenue" fill="#0891b2" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ---- Cost vs Profit Stacked ---- */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <SectionHeading title="Revenue Composition — COGS vs Gross Profit" subtitle="Monthly breakdown of cost vs margin" />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={MONTHLY_TREND} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
            <YAxis tickFormatter={fmtUSD} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip formatter={v => `$${v.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="cost"   name="COGS"         stackId="a" fill="#94a3b8" />
            <Bar dataKey="profit" name="Gross Profit"  stackId="a" fill="#10b981" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
