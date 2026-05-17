// Sidebar.jsx — Left navigation sidebar
import { useAuth } from "../App";

const NAV_ITEMS = [
  { id: "overview",  label: "Executive Overview",    icon: "📊", desc: "KPI Summary" },
  { id: "sales",     label: "Sales Performance",     icon: "💹", desc: "DM Sales" },
  { id: "products",  label: "Product Analysis",      icon: "💊", desc: "DM Products" },
  { id: "regional",  label: "Regional Intelligence", icon: "🗺️",  desc: "DM Regional" },
];

export default function Sidebar({ currentPage, onNavigate, onLogout }) {
  const { user } = useAuth();

  return (
    <aside style={{
      width: "260px",
      minHeight: "100vh",
      background: "#0f172a",
      borderRight: "1px solid #1e293b",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', system-ui, sans-serif",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: "24px 20px",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <div style={{
          width: "38px", height: "38px",
          background: "linear-gradient(135deg, #00b4d8, #0077b6)",
          borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px",
        }}>
          💊
        </div>
        <div>
          <div style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "15px" }}>MedTrack BI</div>
          <div style={{ color: "#475569", fontSize: "11px" }}>Analytics Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "16px 12px", flex: 1 }}>
        <p style={{
          color: "#475569", fontSize: "10px", fontWeight: "700",
          letterSpacing: "0.1em", textTransform: "uppercase",
          padding: "0 8px", marginBottom: "8px",
        }}>
          DATAMARTS
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: "10px",
                background: isActive ? "rgba(0,180,216,0.12)" : "transparent",
                border: isActive ? "1px solid rgba(0,180,216,0.2)" : "1px solid transparent",
                cursor: "pointer",
                textAlign: "left",
                marginBottom: "4px",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "18px" }}>{item.icon}</span>
              <div>
                <div style={{
                  color: isActive ? "#00b4d8" : "#94a3b8",
                  fontSize: "13px",
                  fontWeight: isActive ? "600" : "400",
                }}>
                  {item.label}
                </div>
                <div style={{ color: "#475569", fontSize: "11px" }}>{item.desc}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: "16px", borderTop: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{
            width: "34px", height: "34px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "13px", fontWeight: "700",
          }}>
            {user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <div style={{ color: "#f1f5f9", fontSize: "13px", fontWeight: "600" }}>{user?.name}</div>
            <div style={{ color: "#475569", fontSize: "11px" }}>{user?.role}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "9px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "8px",
            color: "#f87171",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
