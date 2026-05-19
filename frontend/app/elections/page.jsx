"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ElectionsPage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("iboto-theme");
    if (saved) setDark(saved === "dark");
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);

    const studentData = localStorage.getItem("iboto-student");
    if (!studentData) { router.push("/login"); return; }
    setStudent(JSON.parse(studentData));

    fetchElections();
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("iboto-theme", next ? "dark" : "light");
  };

  const fetchElections = async () => {
    try {
      const token = localStorage.getItem("iboto-access-token");
      const res = await fetch("http://localhost:5000/api/elections", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setElections(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("iboto-refresh-token");
    if (refreshToken) {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });
    }
    localStorage.removeItem("iboto-access-token");
    localStorage.removeItem("iboto-refresh-token");
    localStorage.removeItem("iboto-student");
    router.push("/");
  };

  if (!mounted) return null;
  const t = dark ? theme.dark : theme.light;

  const openElections = elections.filter(e => e.isOpen);
  const closedElections = elections.filter(e => !e.isOpen);

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .election-card {
          background: ${t.card};
          border: 1px solid ${t.border};
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .election-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); border-color: #2D8C4E; }
        .election-card-closed {
          background: ${t.card};
          border: 1px solid ${t.border};
          border-radius: 16px;
          padding: 20px;
          opacity: 0.6;
        }
        .badge-open {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(45,140,78,0.12);
          border: 1px solid rgba(45,140,78,0.3);
          color: #2D8C4E;
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge-closed {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(107,114,128,0.12);
          border: 1px solid rgba(107,114,128,0.3);
          color: ${t.subtext};
          padding: 4px 10px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
        }
        .toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toggle-btn:hover { background: rgba(45,140,78,0.1); }
        .logout-btn {
          background: none;
          border: 1px solid ${t.border};
          color: ${t.subtext};
          border-radius: 10px;
          padding: 8px 14px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .logout-btn:hover { border-color: #EF4444; color: #EF4444; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .dot-live { width: 7px; height: 7px; border-radius: 50%; background: #2D8C4E; animation: pulse 2s infinite; display: inline-block; }
        .skeleton {
          background: linear-gradient(90deg, ${t.card} 25%, ${t.border} 50%, ${t.card} 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 12px;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      {/* NAV */}
      <nav style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, background: t.bg, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 13, fontFamily: "Playfair Display, serif" }}>i</span>
          </div>
          <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 17, color: t.text }}>iboto</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="toggle-btn" onClick={toggleTheme}>
            {dark
              ? <svg width="19" height="19" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              : <svg width="19" height="19" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px" }}>

        {/* GREETING */}
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 14, color: t.subtext, marginBottom: 4 }}>Welcome back,</p>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>
            {student?.name || "Student"} 👋
          </h1>
        </div>

        {/* LOADING SKELETON */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2].map(i => (
              <div key={i} className="skeleton" style={{ height: 100 }} />
            ))}
          </div>
        )}

        {/* OPEN ELECTIONS */}
        {!loading && openElections.length > 0 && (
          <div className="fade-up" style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Active Elections</h2>
              <span style={{ fontSize: 12, background: "rgba(45,140,78,0.1)", color: "#2D8C4E", padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>{openElections.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {openElections.map(election => (
                <div key={election.id} className="election-card" style={{ cursor: "default" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <div className="badge-open">
                    <span className="dot-live" />
                    Live
                  </div>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 8, lineHeight: 1.3 }}>{election.name}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: t.subtext, display: "flex", alignItems: "center", gap: 4 }}>
                    {/* ...same candidate count and date spans... */}
                  </span>
                </div>

                {/* TWO BUTTONS */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => router.push(`/elections/${election.id}/candidates`)}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(45,140,78,0.3)", background: "rgba(45,140,78,0.06)", color: "#2D8C4E", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                    👥 View Candidates
                  </button>
                  <button
                    onClick={() => router.push(`/ballot/${election.id}`)}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                    🗳 Vote Now
                  </button>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}

        {/* NO OPEN ELECTIONS */}
        {!loading && openElections.length === 0 && (
          <div className="fade-up" style={{ textAlign: "center", padding: "48px 24px", background: t.card, borderRadius: 20, border: `1px solid ${t.border}`, marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗳️</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 800, color: t.text, marginBottom: 8 }}>No active elections</h2>
            <p style={{ fontSize: 14, color: t.subtext, lineHeight: 1.6 }}>There are no open elections at the moment. Check back later.</p>
          </div>
        )}

        {/* CLOSED ELECTIONS */}
        {!loading && closedElections.length > 0 && (
          <div className="fade-up">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: t.subtext }}>Past Elections</h2>
              <span style={{ fontSize: 12, background: t.card, color: t.subtext, padding: "2px 8px", borderRadius: 100, fontWeight: 600, border: `1px solid ${t.border}` }}>{closedElections.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {closedElections.map(election => (
                <div key={election.id} className="election-card-closed">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                    <div className="badge-closed">Closed</div>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 6 }}>{election.name}</h3>
                  <span style={{ fontSize: 13, color: t.subtext }}>
                    {election.candidates?.length || 0} candidates
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: t.bg, borderTop: `1px solid ${t.border}`, padding: "12px 20px", display: "flex", justifyContent: "space-around", maxWidth: 480, margin: "0 auto" }}>
        {[
          { icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: "Elections", active: true, path: "/elections" },
          { icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label: "Profile", active: false, path: "/profile" },
        ].map((item, i) => (
          <button key={i} onClick={() => router.push(item.path)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: item.active ? "#2D8C4E" : t.subtext, fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: item.active ? 600 : 400, padding: "4px 16px", borderRadius: 10, transition: "all 0.2s" }}>
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ height: 80 }} />
    </div>
  );
}

const theme = {
  light: {
    bg: "#FFFFFF",
    card: "#F4F6FA",
    text: "#0D0D0D",
    subtext: "#6B7280",
    border: "#E5E7EB",
  },
  dark: {
    bg: "#0D1117",
    card: "#161B22",
    text: "#E6EDF3",
    subtext: "#8B949E",
    border: "#30363D",
  }
};