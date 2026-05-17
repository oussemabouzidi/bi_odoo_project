// App.jsx — Root application component
// =====================================================================
// This is the entry point of the React dashboard application.
// React SPA (Single Page Application) = one HTML file, JS handles routing.
//
// STATE MANAGEMENT:
//   We use React's built-in useState/useContext (no Redux needed for this size).
//   isAuthenticated: tracks whether user has logged in
//   currentPage: which dashboard page is shown
//
// ROUTING:
//   We use simple state-based routing (no React Router) for simplicity.
//   In production, use React Router for URL-based navigation.
// =====================================================================

import { useState, createContext, useContext } from "react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Overview from "./pages/Overview";
import SalesDM from "./pages/SalesDM";
import ProductDM from "./pages/ProductDM";
import RegionalDM from "./pages/RegionalDM";
import "./App.css";

// ── AUTH CONTEXT ──────────────────────────────────────────────────────────────
// React Context allows sharing state across all child components without
// passing props down through every level (prop drilling).
// AuthContext stores the authenticated user object.
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// ── ROOT APP COMPONENT ────────────────────────────────────────────────────────
export default function App() {
  // useState returns [currentValue, setterFunction]
  // When setter is called, React re-renders the component.
  const [user, setUser] = useState(null);          // null = not logged in
  const [currentPage, setCurrentPage] = useState("overview");

  // Called by the Login component when credentials are verified
  const handleLogin = (userData) => {
    setUser(userData);
  };

  // Called when user clicks "Logout" in Sidebar
  const handleLogout = () => {
    setUser(null);
    setCurrentPage("overview");
  };

  // Page routing: map page ID strings to components
  const renderPage = () => {
    switch (currentPage) {
      case "overview":  return <Overview />;
      case "sales":     return <SalesDM />;
      case "products":  return <ProductDM />;
      case "regional":  return <RegionalDM />;
      default:          return <Overview />;
    }
  };

  // If not authenticated, show Login page (full screen)
  if (!user) {
    return (
      <AuthContext.Provider value={{ user, handleLogin }}>
        <Login />
      </AuthContext.Provider>
    );
  }

  // Authenticated: show the full dashboard layout
  return (
    // AuthContext.Provider wraps the entire app so any child can read the user
    <AuthContext.Provider value={{ user, handleLogout }}>
      <div className="app-layout">
        {/* Left sidebar: navigation + logo + user info */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
        />

        {/* Main content area: renders the selected page */}
        <main className="main-content">
          <div className="page-container">
            {renderPage()}
          </div>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
