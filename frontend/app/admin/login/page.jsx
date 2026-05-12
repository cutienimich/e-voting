
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("iboto-theme");
    if (saved) setDark(saved === "dark");
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Check if already logged in
    const token = localStorage.getItem("iboto-admin-token");
    if (token) router.push("/admin/elections");
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("iboto-theme", next ? "dark" : "light");
  };

  const handleLogin = async () => {
    if (!form.username || !form.password) {
      setError("All fields required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      localStorage.setItem("iboto-admin-token", data.data.token);
      localStorage.setItem("iboto-admin", JSON.stringify({ username: data.data.username }));
      router.push("/admin/elections");
    } catch {
      setError("Cannot connect to server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;
  const t = dark ? theme.dark : theme.light;

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .input-field {
          width: 100%; padding: 13px 16px; border-radius: 10px;
          border: 1.5px solid ${t.border}; background: ${t.input};
          color: ${t.text}; font-size: 15px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: all 0.2s;
        }
        .input-field:focus { border-color: #2D8C4E; box-shadow: 0 0 0 3px rgba(45,140,78,0.12); }
        .input-field::placeholder { color: ${t.subtext}; opacity: 0.7; }
        .btn-primary {
          background: linear-gradient(135deg, #1B4D2E, #2D8C4E);
          color: white; border: none; border-radius: 10px;
          padding: 14px 32px; font-size: 15px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif; width: 100%;
          transition: all 0.2s; box-shadow: 0 4px 15px rgba(45,140,78,0.3);
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(45,140,78,0.4); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .toggle-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .toggle-btn:hover { background: rgba(45,140,78,0.1); }
        .error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #EF4444; padding: 12px 16px; border-radius: 10px; font-size: 14px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      {/* Theme toggle */}
      <div style={{ position: "fixed", top: 20, right: 20 }}>
        <button className="toggle-btn" onClick={toggleTheme}>
          {dark
            ? <svg width="20" height="20" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            : <svg width="20" height="20" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          }
        </button>
      </div>

      <div className="fade-up" style={{ width: "100%", maxWidth: 420, padding: "0 24px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(45,140,78,0.3)" }}>
            <span style={{ color: "white", fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 800 }}>i</span>
          </div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 800, color: t.text, letterSpacing: "-0.5px", marginBottom: 6 }}>iboto Admin</h1>
          <p style={{ fontSize: 14, color: t.subtext }}>Colegio de Montalban · Admin Panel</p>
        </div>

        {/* Form */}
        <div style={{ background: t.card, borderRadius: 16, padding: 28, border: `1px solid ${t.border}` }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.subtext, marginBottom: 8 }}>Username</div>
              <input
                className="input-field"
                placeholder="Enter username"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.subtext, marginBottom: 8 }}>Password</div>
              <input
                className="input-field"
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            </div>

            {error && <div className="error-box">{error}</div>}

            <button className="btn-primary" onClick={handleLogin} disabled={loading}>
              {loading ? "Logging in..." : "Login to Admin Panel"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: t.subtext, marginTop: 20 }}>
          Student portal?{" "}
          <span style={{ color: "#2D8C4E", fontWeight: 600, cursor: "pointer" }} onClick={() => router.push("/")}>
            Go to iboto
          </span>
        </p>
      </div>
    </div>
  );
}

const theme = {
  light: { bg: "#F4F6FA", card: "#FFFFFF", input: "#F4F6FA", text: "#0D0D0D", subtext: "#6B7280", border: "#E5E7EB" },
  dark: { bg: "#0D1117", card: "#161B22", input: "#0D1117", text: "#E6EDF3", subtext: "#8B949E", border: "#30363D" }
};