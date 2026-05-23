"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/utils/api";

const POSITIONS = [
  "President",
  "Vice President",
  "Secretary",
  "Assistant Secretary",
  "Treasurer",
  "Auditor",
  "Business Manager",
  "Public Information Officer (P.I.O.)",
  "4th Year Senator",
  "3rd Year Senator",
  "2nd Year Senator",
];

export default function CandidatesPage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterPos, setFilterPos] = useState("All");
  const [selected, setSelected] = useState(null); // candidate detail modal
  const [checking, setChecking] = useState(true);   // ✅ ADD
  const [alreadyVoted, setAlreadyVoted] = useState(false); // ✅ ADD

  const router = useRouter();
  const params = useParams();
  const electionId = params?.id;

useEffect(() => {
  setMounted(true);
  const saved = localStorage.getItem("iboto-theme");
  if (saved) setDark(saved === "dark");
  else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);

  const studentData = localStorage.getItem("iboto-student");
  if (!studentData) { router.push("/login"); return; }
}, []);

// Effect 2 - fetch when electionId ready
useEffect(() => {
  if (!electionId) return;
  fetchElection();
}, [electionId]);


  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("iboto-theme", next ? "dark" : "light");
  };

 const fetchElection = async () => {
  try {
    const res = await apiFetch(`/api/elections/${electionId}`);
    if (!res) return; // ← expired, nag-redirect na sa login
    const data = await res.json();
    if (data.success) setElection(data.data);
  } catch (err) { console.error(err); }
  finally { setLoading(false); setChecking(false); }
};

  if (!mounted) return null;
  const t = dark ? theme.dark : theme.light;

  const candidates = election?.candidates || [];
  const filtered = filterPos === "All"
    ? candidates
    : candidates.filter(c => c.position === filterPos);

  const grouped = POSITIONS.reduce((acc, pos) => {
    const group = filtered.filter(c => c.position === pos);
    if (group.length > 0) acc[pos] = group;
    return acc;
  }, {});

  const positionsPresent = ["All", ...POSITIONS.filter(p =>
    candidates.some(c => c.position === p)
  )];

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .candidate-card {
          background: ${t.card};
          border: 1px solid ${t.border};
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .candidate-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          border-color: #2D8C4E;
        }

        .pos-chip {
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .avatar {
          width: 52px; height: 52px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          border: 2px solid rgba(45,140,78,0.2);
        }
        .avatar-placeholder {
          width: 52px; height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1B4D2E, #2D8C4E);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 20px; font-weight: 700; color: white;
        }

        .badge-open {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(45,140,78,0.12); border: 1px solid rgba(45,140,78,0.3);
          color: #2D8C4E; padding: 4px 10px; border-radius: 100px;
          font-size: 12px; font-weight: 600;
        }
        .toggle-btn {
          background: none; border: none; cursor: pointer; padding: 8px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .toggle-btn:hover { background: rgba(45,140,78,0.1); }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55);
          display: flex; align-items: flex-end; justify-content: center;
          z-index: 200; padding: 0;
        }
        .modal-sheet {
          background: ${t.card};
          border-radius: 24px 24px 0 0;
          width: 100%; max-width: 480px;
          max-height: 88vh; overflow-y: auto;
          padding: 28px 24px 40px;
          border: 1px solid ${t.border};
          border-bottom: none;
          animation: slideUp 0.3s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s ease forwards; }

        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .dot-live { width: 7px; height: 7px; border-radius: 50%; background: #2D8C4E; animation: pulse 2s infinite; display: inline-block; }

        .skeleton {
          background: linear-gradient(90deg, ${t.card} 25%, ${t.border} 50%, ${t.card} 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 12px;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 10px; }
      `}</style>

      {/* NAV */}
      <nav style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, background: t.bg, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => router.back()} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 10, padding: "7px 10px", cursor: "pointer", color: t.subtext, display: "flex", alignItems: "center" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 13, fontFamily: "Playfair Display, serif" }}>i</span>
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 17, color: t.text }}>iboto</span>
          </div>
        </div>
        <button className="toggle-btn" onClick={toggleTheme}>
          {dark
            ? <svg width="19" height="19" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            : <svg width="19" height="19" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          }
        </button>
      </nav>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px 100px" }}>

        {/* HEADER */}
        {loading ? (
          <div className="skeleton" style={{ height: 60, marginBottom: 24 }} />
        ) : (
          <div className="fade-up" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              {election?.isOpen && (
                <span className="badge-open"><span className="dot-live" />Live</span>
              )}
            </div>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: "-0.5px", marginBottom: 4 }}>
              {election?.name || "Candidates"}
            </h1>
            <p style={{ fontSize: 14, color: t.subtext }}>{candidates.length} candidates running</p>
          </div>
        )}

        {/* POSITION FILTER */}
        {!loading && candidates.length > 0 && (
          <div style={{ overflowX: "auto", marginBottom: 24, paddingBottom: 4 }}>
            <div style={{ display: "flex", gap: 8, width: "max-content" }}>
              {positionsPresent.map(pos => (
                <button key={pos} className="pos-chip" onClick={() => setFilterPos(pos)} style={{
                  background: filterPos === pos ? "#166534" : "rgba(45,140,78,0.08)",
                  color: filterPos === pos ? "#fff" : "#2D8C4E",
                }}>
                  {pos === "All" ? "All" : pos.length > 18 ? pos.slice(0, 16) + "…" : pos}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LOADING SKELETON */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton" style={{ height: 80 }} />
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading && candidates.length === 0 && (
          <div className="fade-up" style={{ textAlign: "center", padding: "48px 24px", background: t.card, borderRadius: 20, border: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 800, color: t.text, marginBottom: 8 }}>No candidates yet</h2>
            <p style={{ fontSize: 14, color: t.subtext }}>Candidates haven't been added to this election.</p>
          </div>
        )}

        {/* GROUPED CANDIDATES */}
        {!loading && Object.entries(grouped).map(([pos, cands]) => (
          <div key={pos} className="fade-up" style={{ marginBottom: 28 }}>

            {/* Position header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ height: 1, flex: 1, background: t.border }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2D8C4E", textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>{pos}</span>
              <div style={{ height: 1, flex: 1, background: t.border }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {cands.map((c, i) => (
                <div key={i} className="candidate-card" onClick={() => setSelected(c)}>
                  {/* Avatar */}
                  {c.photoUrl
                    ? <img src={c.photoUrl} alt={c.name} className="avatar" />
                    : <div className="avatar-placeholder">{c.name?.charAt(0)}</div>
                  }

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: t.text, marginBottom: 2 }}>{c.name}</div>
                    {c.partylist && (
                      <div style={{ fontSize: 12, color: t.subtext }}>🏛 {c.partylist}</div>
                    )}
                    {c.motto && (
                      <div style={{ fontSize: 12, color: t.subtext, fontStyle: "italic", marginTop: 2 }} >"{c.motto}"</div>
                    )}
                  </div>

                  <svg width="16" height="16" fill="none" stroke={t.subtext} strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: t.bg, borderTop: `1px solid ${t.border}`, padding: "12px 20px", display: "flex", justifyContent: "space-around", maxWidth: 480, margin: "0 auto" }}>
        {[
          {
            icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
            label: "Elections", active: false, path: "/elections"
          },
          {
            icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
            label: "Profile", active: false, path: "/profile"
          },
        ].map((item, i) => (
          <button key={i} onClick={() => router.push(item.path)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: item.active ? "#2D8C4E" : t.subtext, fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: item.active ? 600 : 400, padding: "4px 16px", borderRadius: 10, transition: "all 0.2s" }}>
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* CANDIDATE DETAIL BOTTOM SHEET */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>

            {/* Drag handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: t.border, margin: "0 auto 20px" }} />

            {/* Photo + name */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
              {selected.photoUrl
                ? <img src={selected.photoUrl} alt={selected.name} style={{ width: 88, height: 88, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(45,140,78,0.3)", marginBottom: 14 }} />
                : <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, fontSize: 32, fontWeight: 700, color: "white" }}>{selected.name?.charAt(0)}</div>
              }
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 800, color: t.text, textAlign: "center", marginBottom: 4 }}>{selected.name}</h2>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#2D8C4E", marginBottom: 4 }}>{selected.position}</div>
              {selected.partylist && (
                <div style={{ fontSize: 13, color: t.subtext }}>🏛 {selected.partylist}</div>
              )}
            </div>

            {/* Motto */}
            {selected.motto && (
              <div style={{ background: "rgba(45,140,78,0.06)", border: "1px solid rgba(45,140,78,0.15)", borderRadius: 12, padding: "14px 16px", marginBottom: 20, textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2D8C4E", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Motto</div>
                <div style={{ fontSize: 14, color: t.text, fontStyle: "italic", lineHeight: 1.6 }}>"{selected.motto}"</div>
              </div>
            )}

            {/* Platforms */}
            {selected.platforms?.filter(Boolean).length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2D8C4E", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Platforms & Advocacies</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selected.platforms.filter(Boolean).map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: dark ? "rgba(255,255,255,0.03)" : "#f9fafb", borderRadius: 10, padding: "10px 14px", border: `1px solid ${t.border}` }}>
                      <span style={{ color: "#2D8C4E", fontWeight: 700, fontSize: 14, marginTop: 1, flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 14, color: t.text, lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setSelected(null)} style={{ marginTop: 24, width: "100%", background: "rgba(45,140,78,0.08)", border: "1px solid rgba(45,140,78,0.2)", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 600, color: "#2D8C4E", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const theme = {
  light: { bg: "#FFFFFF", card: "#F4F6FA", text: "#0D0D0D", subtext: "#6B7280", border: "#E5E7EB" },
  dark: { bg: "#0D1117", card: "#161B22", text: "#E6EDF3", subtext: "#8B949E", border: "#30363D" },
};