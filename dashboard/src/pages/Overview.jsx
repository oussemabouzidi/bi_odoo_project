// Overview.jsx — Executive KPI Overview Page
// =====================================================================
// This page shows the top-level KPIs from kpi.kpi_executive_summary
// and the monthly revenue trend from kpi.kpi_monthly_trend.
//
// RECHARTS:
//   We use the Recharts library for charts. Recharts is React-native,
//   responsive, and built on SVG. Each chart is a component:
//   <LineChart>, <BarChart>, <PieChart> etc.
//
// DATA FLOW:
//   Component mounts → useEffect runs → fetch('/api/kpi/summary') →
//   response.json() → setData(result) → component re-renders with data
// =====================================================================

import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart, PieChart,
  Pie, Cell, ReferenceLine
} from "recharts";
import { useAuth } from "../App";

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
// In production, replace these with real API calls:
// const response = await fetch('/api/kpi/monthly-trend', { headers: { Authorization: `Bearer ${token}` } });
// const data = await response.json();

const MOCK_SUMMARY = {
  reporting_year: 2019,
  ytd_revenue: 4823456.78,
  ytd_units_sold: 982340,
  ytd_gross_profit: 1689209.87,
  ytd_gross_margin_pct: 35.0,
  yoy_revenue_growth_pct: 7.3,
  product_count: 8,
  total_transactions: 157820,
};

const MOCK_MONTHLY = [
  { month: "Jan", revenue: 345210, profit: 120823, units: 68420 },
  { month: "Feb", revenue: 312890, profit: 109511, units: 61230 },
  { month: "Mar", revenue: 389450, profit: 136307, units: 74120 },
  { month: "Apr", revenue: 402310, profit: 140809, units: 78920 },
  { month: "May", revenue: 421780, profit: 147623, units: 83210 },
  { month: "Jun", revenue: 398450, profit: 139457, units: 76540 },
  { month: "Jul", revenue: 378920, profit: 132622, units: 72340 },
  { month: "Aug", revenue: 392340, profit: 137319, units: 74890 },
  { month: "Sep", revenue: 415670, profit: 145484, units: 79120 },
  { month: "Oct", revenue: 445230, profit: 155830, units: 86320 },
  { month: "Nov", revenue: 469880, profit: 164458, units: 91230 },
  { month: "Dec", revenue: 451326, profit: 157964, units: 88000 },
];

const MOCK_PIE = [
  { name: "Paracetamol", value: 1152456, color: "#00b4d8" },
  { name: "Ibuprofen", value: 896234, color: "#0077b6" },
  { name: "Aspirin", value: 743120, color: "#023e8a" },
  { name: "Diclofenac", value: 623450, color: "#48cae4" },
  { name: "Other (4)", value: 1408196, color: "#90e0ef" },
];

// ── KPI CARD COMPONENT ────────────────────────────────────────────────────────
function KpiCard({ title, value, subtitle, trend, icon, color }) {
  const isPositive = trend >= 0;
  return (
    <div style={{
      background: "#1e293b",
      borderRadius: "16px",
      padding: "24px",
      border: "1px solid #334155",
      flex: "1",
      minWidth: "200px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", margin: "0 0 8px",
                      textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {title}
          </p>
          <p style={{ color: "#f1f5f9", fontSize: "28px", fontWeight: "700", margin: "0 0 6px" }}>
            {value}
          </p>
          <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
            {subtitle}
          </p>
        </div>
        <div style={{
          width: "44px", height: "44px",
          background: `${color}20`,
          borderRadius: "12px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px",
        }}>
          {icon}
        </div>
      </div>
      {/* Trend badge */}
      {trend !== undefined && (
        <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{
            background: isPositive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            color: isPositive ? "#4ade80" : "#f87171",
            fontSize: "12px", fontWeight: "700",
            padding: "3px 8px", borderRadius: "6px",
          }}>
            {isPositive ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
          <span style={{ color: "#64748b", fontSize: "12px" }}>vs last year</span>
        </div>
      )}
    </div>
  );
}

// ── CUSTOM TOOLTIP FOR RECHARTS ────────────────────────────────────────────────
// Recharts passes `active`, `payload`, `label` to custom tooltips
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "10px",
        padding: "12px 16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      }}>
        <p style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 8px" }}>{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color, fontSize: "14px", fontWeight: "600", margin: "2px 0" }}>
            {entry.name}: {entry.name.includes("evenue") || entry.name.includes("rofit")
              ? `€${entry.value.toLocaleString()}`
              : entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ── MAIN OVERVIEW PAGE ────────────────────────────────────────────────────────
export default function Overview() {
  const { user } = useAuth();
  const [summary] = useState(MOCK_SUMMARY);
  const [monthlyData] = useState(MOCK_MONTHLY);

  const fmt = (n) => `€${(n / 1000000).toFixed(2)}M`;
  const fmtK = (n) => `${(n / 1000).toFixed(0)}K`;

  return (
    <div style={{ color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Page header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: "700", margin: "0 0 6px", color: "#f1f5f9" }}>
          Executive Overview
        </h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
          FY {summary.reporting_year} · Pharma Sales Intelligence · Welcome back, {user?.name}
        </p>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "28px", flexWrap: "wrap" }}>
        <KpiCard
          title="Total Revenue"
          value={fmt(summary.ytd_revenue)}
          subtitle="Year-to-date"
          trend={summary.yoy_revenue_growth_pct}
          icon="💰"
          color="#00b4d8"
        />
        <KpiCard
          title="Gross Profit"
          value={fmt(summary.ytd_gross_profit)}
          subtitle={`${summary.ytd_gross_margin_pct}% margin`}
          trend={2.1}
          icon="📈"
          color="#4ade80"
        />
        <KpiCard
          title="Units Sold"
          value={fmtK(summary.ytd_units_sold)}
          subtitle="Thousand units"
          trend={5.2}
          icon="📦"
          color="#f59e0b"
        />
        <KpiCard
          title="Transactions"
          value={fmtK(summary.total_transactions)}
          subtitle={`${summary.product_count} drug products`}
          trend={3.8}
          icon="🔄"
          color="#a78bfa"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "28px" }}>

        {/* Revenue + Profit Area Chart */}
        <div style={{
          background: "#1e293b",
          borderRadius: "16px",
          padding: "24px",
          border: "1px solid #334155",
        }}>
          <h3 style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "600", margin: "0 0 20px" }}>
            Monthly Revenue & Profit — {summary.reporting_year}
          </h3>
          {/* ResponsiveContainer makes the chart fill its parent width */}
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
              {/* CartesianGrid draws the dotted grid lines */}
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              {/* XAxis: the horizontal axis (months) */}
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} />
              {/* YAxis: the vertical axis (values). tickFormatter converts 400000 → 400K */}
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false}
                     tickFormatter={(v) => `€${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "16px" }} />
              {/* Area fill adds gradient below the line */}
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00b4d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="revenue" name="Revenue (€)"
                    stroke="#00b4d8" fill="url(#revGrad)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="profit" name="Gross Profit (€)"
                    stroke="#4ade80" fill="url(#profGrad)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart: Revenue by product */}
        <div style={{
          background: "#1e293b",
          borderRadius: "16px",
          padding: "24px",
          border: "1px solid #334155",
        }}>
          <h3 style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "600", margin: "0 0 20px" }}>
            Revenue by Product
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={MOCK_PIE}
                cx="50%"
                cy="50%"
                innerRadius={55}     /* innerRadius > 0 makes it a donut chart */
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {MOCK_PIE.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `€${(v/1000).toFixed(0)}K`} />
            </PieChart>
          </ResponsiveContainer>
          {/* Custom legend */}
          <div style={{ marginTop: "12px" }}>
            {MOCK_PIE.map((item) => (
              <div key={item.name} style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: "6px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "10px", height: "10px",
                    borderRadius: "50%", background: item.color,
                  }} />
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>{item.name}</span>
                </div>
                <span style={{ color: "#f1f5f9", fontSize: "12px", fontWeight: "600" }}>
                  €{(item.value / 1000).toFixed(0)}K
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar chart: Monthly units */}
      <div style={{
        background: "#1e293b",
        borderRadius: "16px",
        padding: "24px",
        border: "1px solid #334155",
      }}>
        <h3 style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: "600", margin: "0 0 20px" }}>
          Monthly Units Sold — Volume Trend
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false}
                   tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={(v) => `${v.toLocaleString()} units`} />
            {/* ReferenceLine: draws a horizontal line at the average */}
            <ReferenceLine
              y={monthlyData.reduce((s, d) => s + d.units, 0) / monthlyData.length}
              stroke="#64748b"
              strokeDasharray="4 4"
              label={{ value: "Avg", fill: "#64748b", fontSize: 11 }}
            />
            <Bar dataKey="units" name="Units Sold" fill="#00b4d8" radius={[4, 4, 0, 0]}
                 maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
