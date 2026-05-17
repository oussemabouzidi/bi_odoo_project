// ============================================================
// MedTrack BI — RegionalDM.jsx
// Dashboard page: Regional Intelligence Datamart
// ============================================================
// Visualises dm_regional_intelligence (Datamart 3):
//   - Revenue by region (bar chart)
//   - Region vs national benchmark (grouped bar)
//   - Salesperson performance scorecard table
//   - Seasonal demand heatmap-style grid
// ============================================================

import {
  BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

// ---- Mock data (from dm_regional_intelligence + kpi_regional_scorecard) ----
const REGION_REVENUE = [
  { region: "South East",  revenue: 198400, target: 190000 },
  { region: "Midwest",     revenue: 187200, target: 180000 },
  { region: "West Coast",  revenue: 176900, target: 170000 },
  { region: "North East",  revenue: 162300, target: 165000 },
  { region: "Central",     revenue: 143800, target: 145000 },
  { region: "South West",  revenue: 118500, target: 120000 },
  { region: "North West",  revenue:  97200, target: 100000 },
  { region: "Mountain",    revenue:  74100, target:  75000 },
];

const RADAR_DATA = [
  { subject: "Revenue",  "South East": 120, "Midwest": 110, "West Coast": 105 },
  { subject: "Growth",   "South East":  95, "Midwest": 108, "West Coast": 112 },
  { subject: "Margin",   "South East": 100, "Midwest": 100, "West Coast": 100 },
  { subject: "Coverage", "South East": 115, "Midwest":  98, "West Coast":  95 },
  { subject: "Retention","South East": 108, "Midwest": 105, "West Coast":  98 },
];

const SALESPEOPLE = [
  { id: "SP-01", name: "Alex Rivera",  region: "South East", revenue: 68400, deals: 234, quota: 65000, attainment: 105.2, rank: 1 },
  { id: "SP-02", name: "Maya Chen",    region: "Midwest",    revenue: 62800, deals: 201, quota: 60000, attainment: 104.7, rank: 2 },
  { id: "SP-03", name: "James Okafor", region: "West Coast", revenue: 59300, deals: 198, quota: 58000, attainment: 102.2, rank: 3 },
  { id: "SP-04", name: "Priya Mehta",  region: "North East", revenue: 54200, deals: 186, quota: 55000, attainment:  98.5, rank: 4 },
  { id: "SP-05", name: "Tom Walsh",    region: "Central",    revenue: 48900, deals: 167, quota: 50000, attainment:  97.8, rank: 5 },
  { id: "SP-06", name: "Sara Lopez",   region: "South West", revenue: 39600, deals: 143, quota: 40000, attainment:  99.0, rank: 6 },
];

// ---- Seasonal demand grid ------------------------------------------
// Shows which drugs peak in which months (index vs baseline=100)
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SEASONAL = [
  { drug: "Salbutamol", idx: [118,115,112,105,98,95,92,94,100,108,115,122] },
  { drug: "Cetirizine", idx: [85,88,105,120,128,132,130,118,110,95,85,82]  },
  { drug: "Lorazepam",  idx: [102,101,100,99,98,100,102,103,100,101,103,105]},
  { drug: "Ibuprofen",  idx: [108,106,104,100,98,97,98,100,102,105,108,112] },
  { drug: "Zolpidem",   idx: [112,110,108,105,102,100,101,103,105,108,112,116]},
];

// Colour scale: blue (low) → white → red (high)
function seasonColor(v) {
  if (v >= 125) return "#dc2626";
  if (v >= 115) return "#f97316";
  if (v >= 105) return "#fbbf24";
  if (v >= 95)  return "#d1d5db";
  if (v >= 85)  return "#93c5fd";
  return "#3b82f6";
}

export default function RegionalDM() {
  return (
    <div style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Regional Intelligence</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
          Datamart 3 — dm_regional_intelligence · Territory performance & salesperson KPIs
        </p>
      </div>

      {/* Revenue by region + target */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Revenue by Region vs Target</h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>Annual revenue vs sales target per territory</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={REGION_REVENUE} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="region" tick={{ fill: "#334155", fontSize: 11 }} />
            <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip formatter={v => `$${v.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="revenue" name="Actual Revenue" fill="#0891b2" radius={[4,4,0,0]} />
            <Bar dataKey="target"  name="Target"         fill="#e2e8f0" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar + Salesperson table */}
      <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>

        {/* Radar chart — top 3 regions multi-metric */}
        <div style={{ flex: "1 1 340px", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Multi-Metric Regional Comparison</h2>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>Index (100 = national avg), top 3 regions</p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#334155", fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[80, 135]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Radar name="South East" dataKey="South East" stroke="#0891b2" fill="#0891b2" fillOpacity={0.15} />
              <Radar name="Midwest"    dataKey="Midwest"    stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
              <Radar name="West Coast" dataKey="West Coast" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Salesperson scorecard */}
        <div style={{ flex: "2 1 400px", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Salesperson Scorecard</h2>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>Source: kpi_regional_scorecard view</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Rank","Salesperson","Region","Revenue","Deals","Quota Attainment"].map(h => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: "left", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SALESPEOPLE.map(sp => (
                <tr key={sp.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "9px 12px", fontWeight: 700, color: sp.rank <= 3 ? "#f59e0b" : "#64748b" }}>#{sp.rank}</td>
                  <td style={{ padding: "9px 12px", fontWeight: 600, color: "#0f172a" }}>{sp.name}</td>
                  <td style={{ padding: "9px 12px", color: "#64748b" }}>{sp.region}</td>
                  <td style={{ padding: "9px 12px" }}>${sp.revenue.toLocaleString()}</td>
                  <td style={{ padding: "9px 12px" }}>{sp.deals}</td>
                  <td style={{ padding: "9px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${Math.min(sp.attainment, 110)}%`, background: sp.attainment >= 100 ? "#10b981" : "#f59e0b", height: "100%", borderRadius: 4 }} />
                      </div>
                      <span style={{ fontWeight: 600, color: sp.attainment >= 100 ? "#10b981" : "#f59e0b", minWidth: 44 }}>
                        {sp.attainment}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seasonal demand heatmap */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Seasonal Demand Index</h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>Source: kpi_seasonal_patterns — index 100 = annual average demand</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
            <thead>
              <tr>
                <th style={{ padding: "8px 14px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Drug</th>
                {MONTHS.map(m => <th key={m} style={{ padding: "8px 10px", color: "#64748b", fontWeight: 600 }}>{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {SEASONAL.map(row => (
                <tr key={row.drug}>
                  <td style={{ padding: "8px 14px", fontWeight: 600, color: "#334155", whiteSpace: "nowrap" }}>{row.drug}</td>
                  {row.idx.map((v, i) => (
                    <td key={i} style={{
                      padding: "6px 4px",
                      textAlign: "center",
                      background: seasonColor(v),
                      color: v >= 105 || v < 90 ? "#fff" : "#334155",
                      fontWeight: v >= 115 ? 700 : 400,
                      borderRadius: 4,
                    }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          {[["#3b82f6","< 85 (Low)"],["#93c5fd","85–94"],["#d1d5db","95–104 (Avg)"],["#fbbf24","105–114"],["#f97316","115–124"],["#dc2626","≥ 125 (Peak)"]].map(([c,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: c }} />
              <span style={{ color: "#64748b" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
