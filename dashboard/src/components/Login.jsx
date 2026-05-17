// Login.jsx — Professional authentication page
// =====================================================================
// WHAT THIS DOES:
//   Renders the login form. On submit, validates credentials against
//   the backend API (/api/auth/login). On success, calls handleLogin()
//   from AuthContext to set the user in global state.
//
// IN PRODUCTION:
//   Replace the mock auth with a real JWT (JSON Web Token) flow:
//   1. POST /api/auth/login with {email, password}
//   2. Server returns {access_token, refresh_token, user}
//   3. Store access_token in memory (NOT localStorage for security)
//   4. Send access_token in Authorization header for all API requests
// =====================================================================

import { useState } from "react";
import { useAuth } from "../App";

// Mock credentials for demo (replace with real API call)
const DEMO_USERS = [
  { email: "admin@medtrack.local", password: "admin123", name: "Dr. Admin", role: "Administrator" },
  { email: "analyst@medtrack.local", password: "analyst123", name: "Sara Analytics", role: "BI Analyst" },
  { email: "manager@medtrack.local", password: "manager123", name: "John Manager", role: "Sales Manager" },
];

export default function Login() {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { handleLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default HTML form submit (page reload)
    setError("");
    setIsLoading(true);

    // Simulate API call delay (remove in production, use real fetch)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Find matching user in demo credentials
    const user = DEMO_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      handleLogin({
        name: user.name,
        email: user.email,
        role: user.role,
        loginTime: new Date().toISOString(),
      });
    } else {
      setError("Invalid email or password. Try: admin@medtrack.local / admin123");
    }

    setIsLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      padding: "20px",
    }}>
      {/* Login card */}
      <div style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "20px",
        padding: "48px",
        width: "100%",
        maxWidth: "440px",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      }}>
        {/* Logo / Brand */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            width: "64px", height: "64px",
            background: "linear-gradient(135deg, #00b4d8, #0077b6)",
            borderRadius: "16px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            marginBottom: "16px",
            boxShadow: "0 8px 24px rgba(0,180,216,0.3)",
          }}>
            💊
          </div>
          <h1 style={{
            color: "#ffffff",
            fontSize: "26px",
            fontWeight: "700",
            margin: "0 0 6px",
            letterSpacing: "-0.5px",
          }}>
            MedTrack BI
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
            Pharmaceutical Sales Intelligence Platform
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email field */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              color: "#cbd5e1",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "8px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@medtrack.local"
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
            />
          </div>

          {/* Password field */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              color: "#cbd5e1",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "8px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: "100%",
                  padding: "14px 48px 14px 16px",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "15px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {/* Show/hide password toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#fca5a5",
              fontSize: "13px",
              marginBottom: "20px",
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "15px",
              background: isLoading
                ? "rgba(0,180,216,0.4)"
                : "linear-gradient(135deg, #00b4d8, #0077b6)",
              border: "none",
              borderRadius: "10px",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "700",
              cursor: isLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: isLoading ? "none" : "0 4px 16px rgba(0,119,182,0.4)",
            }}
          >
            {isLoading ? "Authenticating..." : "Sign In →"}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div style={{
          marginTop: "24px",
          padding: "14px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 6px", fontWeight: "600" }}>
            DEMO CREDENTIALS
          </p>
          <p style={{ color: "#94a3b8", fontSize: "12px", margin: "2px 0" }}>
            📧 admin@medtrack.local &nbsp; 🔑 admin123
          </p>
          <p style={{ color: "#94a3b8", fontSize: "12px", margin: "2px 0" }}>
            📧 analyst@medtrack.local &nbsp; 🔑 analyst123
          </p>
        </div>
      </div>
    </div>
  );
}
