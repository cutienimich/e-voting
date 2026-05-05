"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ username: "", password: "" });
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("iboto-theme");
    if (saved) setDark(saved === "dark");
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Redirect if already logged in
    const adminToken = localStorage.getItem("iboto-admin-token");
    if (adminToken) router.push("/admin/dashboard");
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("iboto-theme", next ? "dark" : "light");
  };

  const t = dark ? theme.dark : theme.light;

  const update = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setError("");
  };

  const handleLogin = async () => {
    if (!form.username.trim()) { setError("Username is required"); return; }
    if (!form.password) { setError("Password is required"); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username.trim(), password: form.password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Invalid credentials");
        return;
      }

      localStorage.setItem("iboto-admin-token", data.data.accessToken);
      localStorage.setItem("iboto-admin-refresh-token", data.data.refreshToken);
      localStorage.setItem("iboto-admin", JSON.stringify({
        name: data.data.name,
        username: data.data.username,
        role: data.data.role,
      }));

      router.push("/admin/dashboard");
    } catch {
      setError("Cannot connect to server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s ease", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .input-field {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1.5px solid ${t.border};
          background: ${t.card};
          color: ${t.text};
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }
        .input-field:focus { border-color: #2D8C4E; box-shadow: 0 0 0 3px rgba(45,140,78,0.12); }
        .input-field::placeholder { color: ${t.subtext}; opacity: 0.7; }
        .btn-primary {
          background: linear-gradient(135deg, #1B4D2E, #2D8C4E);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 15px 32px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(45,140,78,0.3);
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(45,140,78,0.4); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .toggle-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .toggle-btn:hover { background: rgba(45,140,78,0.1); }
        .error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #EF4444; padding: 12px 16px; border-radius: 10px; font-size: 14px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      {/* NAV */}
      <nav style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 13, fontFamily: "Playfair Display, serif" }}>i</span>
          </div>
          <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 17, color: t.text }}>iboto</span>
          <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(45,140,78,0.12)", color: "#2D8C4E", padding: "2px 8px", borderRadius: 100, border: "1px solid rgba(45,140,78,0.3)", marginLeft: 4 }}>Admin</span>
        </div>
        <button className="toggle-btn" onClick={toggleTheme}>
          {dark
            ? <svg width="19" height="19" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            : <svg width="19" height="19" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          }
        </button>
      </nav>

      {/* CENTER CONTENT */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <div className="fade-up" style={{ width: "100%", maxWidth: 400 }}>
          {/* Icon */}
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, boxShadow: "0 8px 24px rgba(45,140,78,0.3)" }}>
            <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>

          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 30, fontWeight: 800, color: t.text, marginBottom: 8, letterSpacing: "-0.5px" }}>
            Admin Portal
          </h1>
          <p style={{ fontSize: 14, color: t.subtext, marginBottom: 32, lineHeight: 1.6 }}>
            Sign in with your administrator credentials to manage elections.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.subtext, marginBottom: 8 }}>Username</div>
              <input
                className="input-field"
                placeholder="Enter admin username"
                value={form.username}
                onChange={e => update("username", e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                autoComplete="username"
              />
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.subtext, marginBottom: 8 }}>Password</div>
              <input
                className="input-field"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => update("password", e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button className="btn-primary" onClick={handleLogin} disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          <p style={{ fontSize: 13, color: t.subtext, textAlign: "center", marginTop: 24 }}>
            Student portal?{" "}
            <span style={{ color: "#2D8C4E", fontWeight: 600, cursor: "pointer" }} onClick={() => router.push("/login")}>
              Login here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const theme = {
  light: { bg: "#F8FAFC", card: "#FFFFFF", text: "#0D0D0D", subtext: "#6B7280", border: "#E5E7EB" },
  dark:  { bg: "#0D1117", card: "#161B22", text: "#E6EDF3", subtext: "#8B949E", border: "#30363D" },
};