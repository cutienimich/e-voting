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
    ["iboto-access-token","iboto-refresh-token","iboto-student","iboto-device-token"].forEach(k => localStorage.removeItem(k));
    router.push("/");
  };

  if (!mounted) return null;
  const t = dark ? theme.dark : theme.light;

  const openElections = elections.filter(e => e.isOpen);
  const closedElections = elections.filter(e => !e.isOpen);
  const firstName = (student?.name || "Student").split(" ")[0];

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div style={{ background: dark ? "#080B0A" : "#F7F5F0", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div style={{ background: t.bg, color: t.text, width: "100%", maxWidth: 430, minHeight: "100vh", boxShadow: dark ? "0 0 100px rgba(0,0,0,0.7)" : "0 0 80px rgba(0,0,0,0.07)", transition: "background 0.3s ease, color 0.3s ease" }}>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Lora:ital,wght@0,600;0,700;1,500&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }

          .toggle-btn {
            background: ${t.pill};
            border: 1px solid ${t.border};
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }
          .toggle-btn:hover { background: ${t.pillHover}; }

          .logout-btn {
            background: none;
            border: 1px solid ${t.border};
            color: ${t.subtext};
            border-radius: 100px;
            padding: 7px 16px;
            font-size: 12.5px;
            font-family: 'DM Sans', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
            letter-spacing: 0.01em;
            font-weight: 500;
          }
          .logout-btn:hover { border-color: #c0392b; color: #c0392b; background: rgba(192,57,43,0.05); }

          .election-card {
            background: ${t.card};
            border: 1px solid ${t.border};
            border-radius: 18px;
            padding: 24px;
            cursor: pointer;
            transition: all 0.22s ease;
            position: relative;
            overflow: hidden;
          }
          .election-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 40px ${dark ? "rgba(0,0,0,0.4)" : "rgba(27,77,46,0.1)"};
            border-color: rgba(45,140,78,0.35);
          }
          .election-card:active { transform: translateY(0px); }

          .election-card-closed {
            background: ${t.card};
            border: 1px solid ${t.border};
            border-radius: 18px;
            padding: 20px 24px;
          }

          .badge-open {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: rgba(45,140,78,0.1);
            border: 1px solid rgba(45,140,78,0.2);
            color: ${dark ? "#5cc97f" : "#1B6B3A"};
            padding: 5px 13px;
            border-radius: 100px;
            font-size: 11.5px;
            font-weight: 600;
            letter-spacing: 0.02em;
          }

          .badge-closed {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: ${t.pill};
            border: 1px solid ${t.border};
            color: ${t.subtext};
            padding: 4px 11px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 500;
          }

          .section-label {
            font-size: 10.5px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: ${t.subtext};
            margin-bottom: 16px;
          }

          .meta-chip {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 11.5px;
            color: ${t.subtext};
            background: ${t.pill};
            padding: 4px 11px;
            border-radius: 100px;
            font-weight: 400;
          }

          .arrow-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${dark ? "rgba(45,140,78,0.12)" : "rgba(27,77,46,0.07)"};
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: background 0.2s;
          }
          .election-card:hover .arrow-icon {
            background: rgba(45,140,78,0.18);
          }

          @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
          .fade-1 { animation: fadeUp 0.45s ease both; }
          .fade-2 { animation: fadeUp 0.45s 0.07s ease both; }
          .fade-3 { animation: fadeUp 0.45s 0.14s ease both; }
          .fade-4 { animation: fadeUp 0.45s 0.21s ease both; }

          @keyframes breathe { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.8); } }
          .dot-live {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: ${dark ? "#5cc97f" : "#1B6B3A"};
            animation: breathe 2s ease-in-out infinite;
            flex-shrink: 0;
          }

          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          .skeleton {
            background: linear-gradient(90deg, ${t.card} 25%, ${t.border} 50%, ${t.card} 75%);
            background-size: 200% 100%;
            animation: shimmer 1.6s ease-in-out infinite;
            border-radius: 18px;
          }

          .empty-state {
            background: ${t.card};
            border: 1px solid ${t.border};
            border-radius: 18px;
            padding: 48px 28px;
            text-align: center;
          }

          .nav-item {
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            font-family: 'DM Sans', sans-serif;
            font-size: 10.5px;
            padding: 6px 22px;
            border-radius: 12px;
            transition: all 0.2s;
            letter-spacing: 0.01em;
          }
          .nav-item:hover { background: ${t.pill}; }

          .hero-accent {
            display: inline-block;
            width: 20px;
            height: 3px;
            background: linear-gradient(90deg, #1B4D2E, #2D8C4E);
            border-radius: 2px;
            vertical-align: middle;
            margin-right: 10px;
          }

          .card-divider {
            height: 1px;
            background: ${t.border};
            margin: 14px 0;
          }
        `}</style>

        {/* NAV */}
        <nav style={{
          padding: "14px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${t.border}`,
          position: "sticky",
          top: 0,
          background: t.bg,
          zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{
              width: 34, height: 34,
              borderRadius: 9,
              background: "linear-gradient(135deg, #1B4D2E 0%, #2D8C4E 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 17, fontFamily: "Lora, serif", fontStyle: "italic" }}>i</span>
            </div>
            <span style={{ fontFamily: "Lora, serif", fontWeight: 700, fontSize: 19, color: t.text, letterSpacing: "-0.3px" }}>iboto</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {dark
                ? <svg width="17" height="17" fill="none" stroke="#5cc97f" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                : <svg width="17" height="17" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              }
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </nav>

        <div style={{ padding: "36px 22px 110px" }}>

          {/* GREETING */}
          <div className="fade-1" style={{ marginBottom: 44 }}>
            <p style={{ fontSize: 13, color: t.subtext, marginBottom: 8, fontWeight: 400, letterSpacing: "0.01em" }}>
              Welcome back,
            </p>
            <h1 style={{
              fontFamily: "Lora, serif",
              fontSize: "clamp(34px, 9vw, 44px)",
              fontWeight: 700,
              color: t.text,
              letterSpacing: "-0.5px",
              lineHeight: 1.1,
            }}>
              {firstName}!
            </h1>
            <p style={{ marginTop: 14, fontSize: 13.5, color: t.subtext, fontWeight: 400, lineHeight: 1.6, maxWidth: 280 }}>
              Cast your vote and make your voice count.
            </p>
          </div>

          {/* LOADING SKELETONS */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[120, 120, 88].map((h, i) => (
                <div key={i} className="skeleton" style={{ height: h }} />
              ))}
            </div>
          )}

          {/* ACTIVE ELECTIONS */}
          {!loading && (
            <div className="fade-2" style={{ marginBottom: 40 }}>
              <div className="section-label">
                <span className="hero-accent" />
                Active elections
              </div>

              {openElections.length === 0 ? (
                <div className="empty-state">
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: t.pill, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                    <svg width="24" height="24" fill="none" stroke={t.subtext} strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                      <rect x="9" y="3" width="6" height="4" rx="1"/>
                      <path d="M9 12h6M9 16h4"/>
                    </svg>
                  </div>
                  <h3 style={{ fontFamily: "Lora, serif", fontSize: 18, fontWeight: 700, color: t.text, marginBottom: 8 }}>
                    Nothing here yet
                  </h3>
                  <p style={{ fontSize: 13, color: t.subtext, lineHeight: 1.7 }}>
                    There are no open elections right now.<br />Check back soon.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {openElections.map((election, i) => (
                    <div
                      key={election.id}
                      className="election-card"
                      onClick={() => router.push(`/ballot/${election.id}`)}
                    >
                      {/* Top row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div className="badge-open">
                          <span className="dot-live" />
                          Live
                        </div>
                        <div className="arrow-icon">
                          <svg width="14" height="14" fill="none" stroke={dark ? "#5cc97f" : "#1B4D2E"} strokeWidth="2.5" viewBox="0 0 24 24">
                            <path d="M9 18l6-6-6-6"/>
                          </svg>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 style={{
                        fontFamily: "Lora, serif",
                        fontSize: 19,
                        fontWeight: 700,
                        color: t.text,
                        marginBottom: 16,
                        lineHeight: 1.35,
                        letterSpacing: "-0.2px",
                      }}>
                        {election.name}
                      </h3>

                      {/* Meta */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <span className="meta-chip">
                          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                          </svg>
                          {election.candidates?.length || 0} candidates
                        </span>
                        {election.endTime && (
                          <span className="meta-chip">
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <rect x="3" y="4" width="18" height="18" rx="2"/>
                              <path d="M16 2v4M8 2v4M3 10h18"/>
                            </svg>
                            Ends {formatDate(election.endTime)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PAST ELECTIONS */}
          {!loading && closedElections.length > 0 && (
            <div className="fade-3">
              <div className="section-label" style={{ color: t.subtextFaint }}>
                Past elections
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {closedElections.map((election) => (
                  <div key={election.id} className="election-card-closed" style={{ opacity: 0.6 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div className="badge-closed">
                        <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                        Closed
                      </div>
                      {election.endTime && (
                        <span style={{ fontSize: 11, color: t.subtext }}>
                          {formatDate(election.endTime)}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontFamily: "Lora, serif", fontSize: 16, fontWeight: 600, color: t.text, lineHeight: 1.3 }}>
                      {election.name}
                    </h3>
                    {(election.candidates?.length > 0) && (
                      <div style={{ marginTop: 10 }}>
                        <span className="meta-chip" style={{ fontSize: 11 }}>
                          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                          </svg>
                          {election.candidates.length} candidates
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM NAV */}
        <div style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 430,
          background: t.bg,
          borderTop: `1px solid ${t.border}`,
          padding: "10px 24px 20px",
          display: "flex",
          justifyContent: "space-around",
          zIndex: 100,
        }}>
          {[
            {
              icon: (active) => (
                <svg width="21" height="21" fill={active ? "#2D8C4E" : "none"} stroke={active ? "#2D8C4E" : t.subtext} strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <path d="M9 12h6M9 16h4" stroke={active ? "#fff" : t.subtext} strokeWidth="1.8"/>
                </svg>
              ),
              label: "Elections",
              active: true,
              path: "/elections"
            },
            {
              icon: (active) => (
                <svg width="21" height="21" fill="none" stroke={active ? "#2D8C4E" : t.subtext} strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              ),
              label: "Profile",
              active: false,
              path: "/profile"
            },
          ].map((item, i) => (
            <button
              key={i}
              className="nav-item"
              onClick={() => router.push(item.path)}
              style={{ color: item.active ? "#2D8C4E" : t.subtext, fontWeight: item.active ? 600 : 400 }}
            >
              {item.icon(item.active)}
              {item.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

const theme = {
  light: {
    bg: "#FAFAF7",
    card: "#F2F0EA",
    text: "#111211",
    subtext: "#6B7070",
    subtextFaint: "#9BA0A0",
    border: "#E2DFD6",
    pill: "rgba(0,0,0,0.04)",
    pillHover: "rgba(45,140,78,0.07)",
  },
  dark: {
    bg: "#0D1110",
    card: "#141A17",
    text: "#E8EDE9",
    subtext: "#7A8C80",
    subtextFaint: "#4A5A50",
    border: "#222E27",
    pill: "rgba(255,255,255,0.05)",
    pillHover: "rgba(45,140,78,0.12)",
  },
};