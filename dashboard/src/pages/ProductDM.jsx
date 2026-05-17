// ============================================================
// MedTrack BI — ProductDM.jsx
// Dashboard page: Product Analysis Datamart
// ============================================================
// Visualises dm_product_analysis (Datamart 2):
//   - Market share pie chart by ATC drug
//   - Rx vs OTC revenue split
//   - YoY growth per product (bar)
//   - Product ranking table
// ============================================================

import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

// ---- Colour palette matching the dashboard theme -------------------
const PALETTE = ["#0891b2","#10b981","#f59e0b","#8b5cf6","#ec4899","#ef4444","#14b8a6","#f97316"];

// ---- Mock data (replace with API fetch from dm_product_analysis) ---
const MARKET_SHARE = [
  { name: "Salbutamol", value: 19.2 },
  { name: "Zolpidem",   value: 16.0 },
  { name: "Lorazepam",  value: 13.7 },
  { name: "Ibuprofen",  value: 12.1 },
  { name: "Cetirizine", value: 10.3 },
  { name: "Diclofenac", value:  9.3 },
  { name: "Paracetamol",value:  7.3 },
  { name: "Aspirin",    value:  5.6 },
  { name: "Other",      value:  6.5 },
];

const YOY_GROWTH = [
  { drug: "Salbutamol", growth_2018: 14.2, growth_2017: 9.8  },
  { drug: "Zolpidem",   growth_2018: 11.5, growth_2017: 7.2  },
  { drug: "Cetirizine", growth_2018:  8.9, growth_2017: 12.3 },
  { drug: "Ibuprofen",  growth_2018:  7.1, growth_2017: 5.4  },
  { drug: "Lorazepam",  growth_2018:  6.3, growth_2017: 8.1  },
  { drug: "Diclofenac", growth_2018:  4.8, growth_2017: 3.9  },
  { drug: "Paracetamol",growth_2018:  3.2, growth_2017: 2.8  },
  { drug: "Aspirin",    growth_2018: -1.4, growth_2017: 0.3  },
];

const RX_OTC = [
  { type: "Prescription (Rx)", revenue: 361700, products: 3 },
  { type: "OTC",               revenue: 270600, products: 5 },
];

// ---- Ranking table data (from kpi_top_products view) ---------------
const TOP_PRODUCTS = [
  { rank: 1, name: "Salbutamol",  atc: "R03",   revenue: 142000, growth: "+14.2%", share: "19.2%", type: "Rx"  },
  { rank: 2, name: "Zolpidem",    atc: "N05C",  revenue: 118500, growth: "+11.5%", share: "16.0%", type: "Rx"  },
  { rank: 3, name: "Lorazepam",   atc: "N05B",  revenue: 101200, growth: "+6.3%",  share: "13.7%", type: "Rx"  },
  { rank: 4, name: "Ibuprofen",   atc: "M01AE", revenue:  89400, growth: "+7.1%",  share: "12.1%", type: "OTC" },
  { rank: 5, name: "Cetirizine",  atc: "R06",   revenue:  76300, growth: "+8.9%",  share: "10.3%", type: "OTC" },
  { rank: 6, name: "Diclofenac",  atc: "M01AB", revenue:  68900, growth: "+4.8%",  share: "9.3%",  type: "Rx"  },
  { rank: 7, name: "Paracetamol", atc: "N02BE", revenue:  54200, growth: "+3.2%",  share: "7.3%",  type: "OTC" },
  { rank: 8, name: "Aspirin",     atc: "N02BA", revenue:  41700, growth: "-1.4%",  share: "5.6%",  type: "OTC" },
];

// ---- Custom Pie label ----------------------------------------------
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
  const RADIAN = Math.PI / 180;
  const r   = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x   = cx + r * Math.cos(-midAngle * RADIAN);
  const y   = cy + r * Math.sin(-midAngle * RADIAN);
  return value > 5 ? (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {value}%
    </text>
  ) : null;
};

export default function ProductDM() {
  return (
    <div style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Product Analysis</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
          Datamart 2 — dm_product_analysis · Market share, Rx/OTC split, YoY growth
        </p>
      </div>

      {/* Top row: Pie + Rx/OTC bar side by side */}
      <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>

        {/* Market share pie */}
        <div style={{ flex: "1 1 360px", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Market Share by Drug</h2>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>% of total revenue 2018</p>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={MARKET_SHARE} dataKey="value" nameKey="name"
                   cx="50%" cy="50%" outerRadius={100}
                   labelLine={false} label={renderLabel}>
                {MARKET_SHARE.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip formatter={v => `${v}%`} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Rx vs OTC bar */}
        <div style={{ flex: "1 1 280px", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Rx vs OTC Split</h2>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>Revenue by prescription requirement</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={RX_OTC} margin={{ top: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="type" tick={{ fill: "#334155", fontSize: 12 }} />
              <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip formatter={v => `$${v.toLocaleString()}`} />
              <Bar dataKey="revenue" name="Revenue" radius={[6,6,0,0]}>
                <Cell fill="#8b5cf6" />
                <Cell fill="#10b981" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <div style={{ background: "#f3f0ff", borderRadius: 8, padding: "10px 14px", flex: 1 }}>
              <p style={{ margin: 0, fontSize: 11, color: "#7c3aed" }}>Rx Products</p>
              <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 700, color: "#5b21b6" }}>3</p>
            </div>
            <div style={{ background: "#ecfdf5", borderRadius: 8, padding: "10px 14px", flex: 1 }}>
              <p style={{ margin: 0, fontSize: 11, color: "#065f46" }}>OTC Products</p>
              <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 700, color: "#047857" }}>5</p>
            </div>
          </div>
        </div>
      </div>

      {/* YoY Growth comparison */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Year-over-Year Growth</h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>Revenue growth % by drug: 2017 vs 2018</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={YOY_GROWTH} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="drug" tick={{ fill: "#334155", fontSize: 11 }} />
            <YAxis tickFormatter={v => `${v}%`} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip formatter={v => `${v}%`} />
            <Legend />
            <Bar dataKey="growth_2017" name="2017 Growth" fill="#94a3b8" radius={[4,4,0,0]} />
            <Bar dataKey="growth_2018" name="2018 Growth" fill="#0891b2" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Product ranking table */}
      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Product Ranking — 2018</h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>Source: kpi_top_products view</p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Rank","Drug","ATC","Revenue","YoY","Market Share","Type"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #e2e8f0" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOP_PRODUCTS.map(p => (
              <tr key={p.rank} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0891b2" }}>#{p.rank}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>{p.name}</td>
                <td style={{ padding: "10px 14px", color: "#64748b", fontFamily: "monospace" }}>{p.atc}</td>
                <td style={{ padding: "10px 14px", color: "#0f172a" }}>${p.revenue.toLocaleString()}</td>
                <td style={{ padding: "10px 14px", color: p.growth.startsWith("-") ? "#ef4444" : "#10b981", fontWeight: 600 }}>{p.growth}</td>
                <td style={{ padding: "10px 14px", color: "#334155" }}>{p.share}</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{
                    background: p.type === "Rx" ? "#f3f0ff" : "#ecfdf5",
                    color:      p.type === "Rx" ? "#7c3aed" : "#059669",
                    padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600
                  }}>{p.type}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
