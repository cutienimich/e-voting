"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("iboto-refresh-token");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    if (data.success && data.accessToken) {
      localStorage.setItem("iboto-access-token", data.accessToken);
      return data.accessToken;
    } else if (data.success && data.data?.accessToken) {
      localStorage.setItem("iboto-access-token", data.data.accessToken);
      return data.data.accessToken;
    }
    return null;
  } catch { return null; }
};

const authFetch = async (url, options = {}) => {
  const makeHeaders = (token) => ({ ...options.headers, Authorization: `Bearer ${token}` });
  let token = localStorage.getItem("iboto-access-token");
  let res = await fetch(url, { ...options, headers: makeHeaders(token) });
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      ["iboto-access-token","iboto-refresh-token","iboto-student","iboto-device-token"].forEach((k) => localStorage.removeItem(k));
      return { __redirect: "/login" };
    }
    res = await fetch(url, { ...options, headers: makeHeaders(newToken) });
  }
  return res;
};

// ── Mock data (remove when backend ready) ──────────────────────
const MOCK_ELECTIONS = [
  {
    id: "1",
    name: "SSG General Election 2025",
    status: "closed",
    startDate: "2025-05-18",
    endDate: "2025-05-19",
    totalVoters: 580,
    totalVoted: 491,
    positions: [
      { position: "President", candidates: [{ name: "Juan dela Cruz", party: "Alyansa", votes: 261 }, { name: "Rico Mendoza", party: "Bagong Simula", votes: 230 }] },
      { position: "Vice President", candidates: [{ name: "Ana Lim", party: "Bagong Simula", votes: 249 }, { name: "Petra Gomez", party: "Alyansa", votes: 242 }] },
      { position: "Secretary", candidates: [{ name: "Carlo Bautista", party: "Alyansa", votes: 270 }, { name: "Mia Santos", party: "Bagong Simula", votes: 221 }] },
      { position: "Assistant Secretary", candidates: [{ name: "Sofia Cruz", party: "Bagong Simula", votes: 255 }, { name: "Leo Torres", party: "Alyansa", votes: 236 }] },
      { position: "Treasurer", candidates: [{ name: "Samantha Sanchez", party: "Alyansa", votes: 258 }, { name: "Nico Reyes", party: "Bagong Simula", votes: 233 }] },
      { position: "Auditor", candidates: [{ name: "Mika Solidad", party: "Bagong Simula", votes: 246 }, { name: "Ella Tan", party: "Alyansa", votes: 245 }] },
      { position: "Business Manager", candidates: [{ name: "Carlos Dela Cruz", party: "Alyansa", votes: 263 }, { name: "Nina Basco", party: "Bagong Simula", votes: 228 }] },
      { position: "P.I.O.", candidates: [{ name: "John Retada", party: "Alyansa", votes: 271 }, { name: "Carla Vega", party: "Bagong Simula", votes: 220 }] },
      { position: "4th Year Senator", candidates: [{ name: "Alexandra Santos", party: "Alyansa", votes: 267 }, { name: "Mark Flores", party: "Bagong Simula", votes: 224 }] },
      { position: "3rd Year Senator", candidates: [{ name: "Angela Aquino", party: "Bagong Simula", votes: 253 }, { name: "Dave Cruz", party: "Alyansa", votes: 238 }] },
      { position: "2nd Year Senator", candidates: [{ name: "David Lim", party: "Alyansa", votes: 259 }, { name: "Rose Garcia", party: "Bagong Simula", votes: 232 }] },
    ],
  },
  {
    id: "2",
    name: "BSIT Departmental Election 2025",
    status: "closed",
    startDate: "2025-04-10",
    endDate: "2025-04-11",
    totalVoters: 209,
    totalVoted: 188,
    positions: [
      { position: "President", candidates: [{ name: "Maria Santos", party: "Bagong Simula", votes: 102 }, { name: "Jose Ramos", party: "Alyansa", votes: 86 }] },
      { position: "Vice President", candidates: [{ name: "Pedro Reyes", party: "Alyansa", votes: 97 }, { name: "Lena Cruz", party: "Bagong Simula", votes: 91 }] },
      { position: "Secretary", candidates: [{ name: "Luz Mendoza", party: "Bagong Simula", votes: 110 }, { name: "Roy Santos", party: "Alyansa", votes: 78 }] },
      { position: "Treasurer", candidates: [{ name: "Rico Villanueva", party: "Alyansa", votes: 95 }, { name: "Gina Torres", party: "Bagong Simula", votes: 93 }] },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────
const getInitials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const getWinner = (candidates) => [...candidates].sort((a, b) => b.votes - a.votes)[0];

const getTotalVotes = (candidates) => candidates.reduce((s, c) => s + c.votes, 0);

const getPercent = (votes, total) => total === 0 ? 0 : Math.round((votes / total) * 100);

const formatDate = (iso) => new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const PARTY_COLORS = {
  "Alyansa": { bg: "rgba(45,140,78,0.15)", border: "rgba(45,140,78,0.4)", text: "#2D8C4E", bar: "#2D8C4E" },
  "Bagong Simula": { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)", text: "#3B82F6", bar: "#3B82F6" },
  "Independyente": { bg: "rgba(161,161,170,0.12)", border: "rgba(161,161,170,0.35)", text: "#a1a1aa", bar: "#a1a1aa" },
};

const getPartyColor = (party) => PARTY_COLORS[party] || { bg: "rgba(161,161,170,0.12)", border: "rgba(161,161,170,0.3)", text: "#a1a1aa", bar: "#a1a1aa" };

// ── Animated count-up hook ─────────────────────────────────────
const useCountUp = (target, duration = 1200, start = false) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
};

// ── Animated bar ───────────────────────────────────────────────
const AnimatedBar = ({ percent, color, delay = 0 }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 100 + delay);
    return () => clearTimeout(t);
  }, [percent, delay]);
  return (
    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginTop: 6 }}>
      <div style={{ height: "100%", width: `${width}%`, background: color, borderRadius: 2, transition: "width 1s cubic-bezier(0.16,1,0.3,1)", boxShadow: `0 0 6px ${color}60` }} />
    </div>
  );
};

// ── Position result card ───────────────────────────────────────
const PositionCard = ({ position, candidates, index, expanded }) => {
  const [show, setShow] = useState(false);
  const sorted = [...candidates].sort((a, b) => b.votes - a.votes);
  const winner = sorted[0];
  const total = getTotalVotes(candidates);
  const winnerPercent = getPercent(winner.votes, total);
  const winnerColor = getPartyColor(winner.party);

  useEffect(() => {
    if (!expanded) return;
    const t = setTimeout(() => setShow(true), index * 60);
    return () => clearTimeout(t);
  }, [expanded, index]);

  const displayVotes = useCountUp(winner.votes, 1000, show);

  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? "translateY(0)" : "translateY(10px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "14px 16px",
      marginBottom: 8,
    }}>
      {/* Position label */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4a4a46", marginBottom: 8 }}>{position}</div>

      {/* Winner row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: winnerColor.bg,
          border: `1px solid ${winnerColor.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: winnerColor.text,
          fontFamily: "Playfair Display, serif",
        }}>
          {getInitials(winner.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ebebea", lineHeight: 1.2 }}>{winner.name}</div>
              <div style={{ fontSize: 10, color: winnerColor.text, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: winnerColor.text, display: "inline-block" }} />
                {winner.party}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: winnerColor.text, fontFamily: "Playfair Display, serif", lineHeight: 1 }}>{winnerPercent}%</div>
              <div style={{ fontSize: 10, color: "#4a4a46", marginTop: 2 }}>{displayVotes.toLocaleString()} votes</div>
            </div>
          </div>
          <AnimatedBar percent={winnerPercent} color={winnerColor.bar} delay={index * 60} />
        </div>
      </div>

      {/* Other candidates */}
      {sorted.slice(1).map((c, i) => {
        const cp = getPercent(c.votes, total);
        const cc = getPartyColor(c.party);
        return (
          <div key={i} style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#4a4a46" }}>
              {getInitials(c.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#6b6b66" }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: "#3a3a37", marginTop: 1 }}>{c.party}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#4a4a46" }}>{cp}%</div>
                  <div style={{ fontSize: 10, color: "#3a3a37" }}>{c.votes.toLocaleString()}</div>
                </div>
              </div>
              <AnimatedBar percent={cp} color="rgba(255,255,255,0.12)" delay={index * 60 + 200} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Election result block ──────────────────────────────────────
const ElectionBlock = ({ election, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const turnout = getPercent(election.totalVoted, election.totalVoters);

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Election header card */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "16px 18px",
        marginBottom: expanded ? 10 : 0,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            {/* Status badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
                background: election.status === "closed" ? "rgba(239,68,68,0.12)" : "rgba(45,140,78,0.12)",
                color: election.status === "closed" ? "#ef4444" : "#2D8C4E",
                border: `1px solid ${election.status === "closed" ? "rgba(239,68,68,0.3)" : "rgba(45,140,78,0.3)"}`,
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                {election.status === "closed" ? "Closed" : "Active"}
              </span>
            </div>

            <div style={{ fontSize: 16, fontWeight: 800, color: "#ebebea", fontFamily: "Playfair Display, serif", marginBottom: 4, letterSpacing: "-0.2px" }}>
              {election.name}
            </div>
            <div style={{ fontSize: 11, color: "#4a4a46", marginBottom: 10 }}>
              {formatDate(election.startDate)} – {formatDate(election.endDate)}
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="12" height="12" fill="none" stroke="#4a4a46" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span style={{ fontSize: 11, color: "#4a4a46" }}>{election.totalVoted.toLocaleString()} voted</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="12" height="12" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                <span style={{ fontSize: 11, color: "#2D8C4E", fontWeight: 600 }}>{turnout}% turnout</span>
              </div>
            </div>

            {/* Turnout bar */}
            <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginTop: 10, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${turnout}%`, background: "linear-gradient(90deg, #1B4D2E, #2D8C4E)", borderRadius: 2, boxShadow: "0 0 8px rgba(45,140,78,0.5)" }} />
            </div>
          </div>

          {/* Hide/show toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}
          >
            <span style={{ fontSize: 11, color: "#6b6b66", fontFamily: "DM Sans, sans-serif" }}>{expanded ? "Hide" : "Show"}</span>
            <svg width="12" height="12" fill="none" stroke="#6b6b66" strokeWidth="2" viewBox="0 0 24 24">
              <path d={expanded ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Position results */}
      {expanded && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3a3a37", padding: "4px 4px 10px" }}>
            Winners by Position
          </div>
          {election.positions.map((pos, i) => (
            <PositionCard key={i} position={pos.position} candidates={pos.candidates} index={i} expanded={expanded} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Results Page ──────────────────────────────────────────
export default function ResultsPage() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("iboto-theme");
    if (saved) setDark(saved === "dark");
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    fetchResults();
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("iboto-theme", next ? "dark" : "light");
  };

  const fetchResults = async () => {
    try {
      // ── REPLACE THIS WITH REAL API CALL ──────────────────────
      // const res = await authFetch(`${API}/api/elections/results`);
      // if (res?.__redirect) { router.push(res.__redirect); return; }
      // const data = await res.json();
      // if (data.success) setElections(data.data);
      // ─────────────────────────────────────────────────────────

      // mock data for now, remove when backend ready:
      await new Promise((r) => setTimeout(r, 600));
      setElections(MOCK_ELECTIONS);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;
  const t = dark
    ? { bg: "#111110", card: "#1a1a18", text: "#ebebea", subtext: "#8a8a85", border: "#2a2a27" }
    : { bg: "#fafaf9", card: "#f4f4f0", text: "#1a1a18", subtext: "#706f69", border: "#e5e4de" };

  const closedElections = elections.filter((e) => e.status === "closed");
  const activeElections = elections.filter((e) => e.status !== "closed");

  return (
    <div style={{ background: dark ? "#111110" : "#fafaf9", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: t.bg, color: t.text, maxWidth: 480, margin: "0 auto", minHeight: "100vh", transition: "all 0.3s ease" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          .toggle-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
          .toggle-btn:hover { background: rgba(45,140,78,0.1); }
          .skeleton { background: linear-gradient(90deg, ${t.card} 25%, ${t.border} 50%, ${t.card} 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          .fade-up { animation: fadeUp 0.5s ease forwards; }
          .nav-item-btn { background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; font-family: 'DM Sans', sans-serif; padding: 4px 16px; border-radius: 10px; transition: all 0.2s; }
          .section-divider { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: ${t.subtext}; opacity: 0.5; padding: 4px 2px 12px; }
        `}</style>

        {/* NAV */}
        <nav style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, background: t.bg, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 13, fontFamily: "Playfair Display, serif" }}>i</span>
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 17, color: t.text }}>iboto</span>
          </div>
          <button className="toggle-btn" onClick={toggleTheme}>
            {dark
              ? <svg width="19" height="19" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              : <svg width="19" height="19" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </button>
        </nav>

        <div style={{ padding: "24px 20px", paddingBottom: 100 }}>

          {/* Page title */}
          <div className="fade-up" style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: "-0.4px" }}>Election Results</h1>
            <p style={{ fontSize: 13, color: t.subtext, marginTop: 4 }}>Official results · Verified on blockchain</p>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[180, 240, 160].map((h, i) => <div key={i} className="skeleton" style={{ height: h }} />)}
            </div>
          )}

          {!loading && elections.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: t.text }}>No results yet</p>
              <p style={{ fontSize: 13, color: t.subtext, marginTop: 4 }}>Results will appear here once an election closes.</p>
            </div>
          )}

          {!loading && activeElections.length > 0 && (
            <div className="fade-up">
              <div className="section-divider">Ongoing</div>
              {activeElections.map((e) => <ElectionBlock key={e.id} election={e} defaultExpanded={true} />)}
            </div>
          )}

          {!loading && closedElections.length > 0 && (
            <div className="fade-up">
              {activeElections.length > 0 && <div className="section-divider" style={{ paddingTop: 16 }}>Past Elections</div>}
              {closedElections.map((e) => <ElectionBlock key={e.id} election={e} defaultExpanded={true} />)}
            </div>
          )}
        </div>

        {/* BOTTOM NAV */}
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: t.bg, borderTop: `1px solid ${t.border}`, padding: "12px 20px", display: "flex", justifyContent: "space-around", zIndex: 100 }}>
          {[
            {
              icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
              label: "Elections", active: false, path: "/elections"
            },
            {
              icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
              label: "Results", active: true, path: "/results"
            },
            {
              icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
              label: "Alerts", active: false, path: "/alerts"
            },
            {
              icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
              label: "Profile", active: false, path: "/profile"
            },
          ].map((item, i) => (
            <button
              key={i}
              className="nav-item-btn"
              onClick={() => router.push(item.path)}
              style={{ color: item.active ? "#2D8C4E" : t.subtext, fontSize: 11, fontWeight: item.active ? 600 : 400 }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}