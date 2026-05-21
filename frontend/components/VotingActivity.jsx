"use client";
import { useState, useEffect } from "react";

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
      ["iboto-access-token", "iboto-refresh-token", "iboto-student", "iboto-device-token"]
        .forEach((k) => localStorage.removeItem(k));
      return { __redirect: "/login" };
    }
    res = await fetch(url, { ...options, headers: makeHeaders(newToken) });
  }
  return res;
};

export default function VotingActivity({ dark, student, profile, onRedirect }) {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVote, setSelectedVote] = useState(null);

  const t = dark
    ? { bg: "#111110", card: "#1a1a18", text: "#ebebea", subtext: "#8a8a85", border: "#2a2a27" }
    : { bg: "#fafaf9", card: "#f4f4f0", text: "#1a1a18", subtext: "#706f69", border: "#e5e4de" };

  useEffect(() => {
    if (student || profile) fetchVotingActivity();
  }, [student, profile]);

  const fetchVotingActivity = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`${API}/api/vote/my-votes`);
      if (res?.__redirect) { onRedirect?.(res.__redirect); return; }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load votes");
      const raw = data.data || [];
      setVotes(raw.map((v) => ({
        electionId: v.electionId,
        electionName: v.electionName || `Election #${v.electionId}`,
        votedAt: v.votedAt || v.createdAt,
        txHash: v.txHash || null,
        ballots: (v.ballots || []).map((b) => ({
          position: b.position || "—",
          candidateName: b.candidateName || "—",
          partyList: b.partyList || null,
        })),
      })));
    } catch (err) {
      console.error("VotingActivity error:", err);
      setError("Could not load voting history.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return { date: "—", time: "—" };
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" }),
      time: d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  return (
    <>
      <style>{`
        .va-section-card { background: ${t.card}; border: 1px solid ${t.border}; border-radius: 16px; overflow: hidden; margin-bottom: 16px; }
        .va-section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${t.subtext}; padding: 16px 20px 10px; }
        .va-row-item { display: flex; align-items: flex-start; justify-content: space-between; padding: 13px 20px; gap: 12px; }
        .va-vote-item { padding: 14px 20px; border-top: 1px solid ${t.border}; cursor: pointer; transition: background 0.15s; }
        .va-vote-item:hover { background: rgba(45,140,78,0.05); }
        .va-skeleton { background: linear-gradient(90deg, ${t.card} 25%, ${t.border} 50%, ${t.card} 75%); background-size: 200% 100%; animation: va-shimmer 1.5s infinite; border-radius: 12px; }
        @keyframes va-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .va-pill { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 100px; }
        .va-pill-green { background: rgba(45,140,78,0.1); color: #2D8C4E; border: 1px solid rgba(45,140,78,0.2); }
        .va-retry-btn { background: none; border: 1.5px solid ${t.border}; color: ${t.subtext}; border-radius: 10px; padding: 8px 16px; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; }
        .va-retry-btn:hover { border-color: #2D8C4E; color: #2D8C4E; }

        .va-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 999; display: flex; align-items: flex-end; justify-content: center; animation: va-fadeIn 0.2s ease; }
        @keyframes va-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes va-slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        .va-sheet { background: ${t.bg}; border-radius: 24px 24px 0 0; width: 100%; max-width: 480px; display: flex; flex-direction: column; max-height: 85vh; animation: va-slideUp 0.3s ease; }
        .va-sheet-handle { width: 36px; height: 4px; border-radius: 2px; background: ${t.border}; margin: 12px auto 0; flex-shrink: 0; }
        .va-sheet-header { padding: 14px 20px 12px; display: flex; align-items: flex-start; justify-content: space-between; flex-shrink: 0; border-bottom: 1px solid ${t.border}; }
        .va-sheet-body { overflow-y: auto; padding: 16px 20px 40px; display: flex; flex-direction: column; gap: 16px; flex: 1; }
      `}</style>

      {/* ── VOTING ACTIVITY CARD ── */}
      <div className="va-section-card">
        <div className="va-section-title">Voting Activity</div>

        <div className="va-row-item">
          <span style={{ fontSize: 13, color: t.subtext }}>Elections participated</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#2D8C4E" }}>
            {loading ? "—" : votes.length}
          </span>
        </div>

        {loading && (
          <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2].map((i) => <div key={i} className="va-skeleton" style={{ height: 72 }} />)}
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            <p style={{ fontSize: 13, color: t.subtext, textAlign: "center" }}>{error}</p>
            <button className="va-retry-btn" onClick={fetchVotingActivity}>Try again</button>
          </div>
        )}

        {!loading && !error && votes.length === 0 && (
          <div style={{ padding: "24px 20px", textAlign: "center", borderTop: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🗳️</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 4 }}>No votes yet</p>
            <p style={{ fontSize: 13, color: t.subtext }}>Your ballot receipts will appear here after you vote.</p>
          </div>
        )}

        {!loading && !error && votes.map((vote, i) => {
          const dt = formatDateTime(vote.votedAt);
          return (
            <div key={i} className="va-vote-item" onClick={() => setSelectedVote(vote)}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 3 }}>{vote.electionName}</div>
                  <div style={{ fontSize: 12, color: t.subtext, marginBottom: 6 }}>
                    {dt.date}{vote.ballots?.length ? ` · ${vote.ballots.length} position${vote.ballots.length !== 1 ? "s" : ""}` : ""}
                  </div>
                  <span className="va-pill va-pill-green">✓ Voted</span>
                </div>
                <svg width="16" height="16" fill="none" stroke={t.subtext} strokeWidth="2" viewBox="0 0 24 24" style={{ marginTop: 2, flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── BALLOT RECEIPT BOTTOM SHEET ── */}
      {selectedVote && (
        <div className="va-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedVote(null); }}>
          <div className="va-sheet">

            {/* Drag handle */}
            <div className="va-sheet-handle" />

            {/* Sticky header */}
            <div className="va-sheet-header">
              <div>
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 800, color: t.text }}>Ballot Receipt</h2>
                <p style={{ fontSize: 13, color: t.subtext, marginTop: 2 }}>Your official voting record</p>
              </div>
              <button onClick={() => setSelectedVote(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, marginTop: 2, flexShrink: 0 }}>
                <svg width="22" height="22" fill="none" stroke={t.subtext} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="va-sheet-body">
              <div style={{ background: dark ? "#1a1a18" : "#faf9f7", borderRadius: 16, padding: "20px 18px 18px", border: `1px solid ${dark ? "#2a2a27" : "#e5e4de"}`, position: "relative" }}>

                {/* Stamp */}
                <div style={{ position: "absolute", top: 16, right: 16, width: 52, height: 52, borderRadius: "50%", border: "3px solid rgba(45,140,78,0.35)", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-18deg)" }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(45,140,78,0.6)", textAlign: "center", lineHeight: 1.3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Vote<br/>Cast</span>
                </div>

                {/* Receipt header */}
                <div style={{ textAlign: "center", borderBottom: `1px dashed ${dark ? "#333" : "#ccc"}`, paddingBottom: 14, marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "white", fontWeight: 800, fontSize: 11, fontFamily: "Playfair Display, serif" }}>i</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: "Playfair Display, serif" }}>iboto</span>
                  </div>
                  <div style={{ fontSize: 10, color: t.subtext, marginBottom: 6 }}>Official Digital Ballot Receipt</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{selectedVote.electionName}</div>
                  <div style={{ fontSize: 11, color: t.subtext, marginTop: 4 }}>
                    {(() => { const dt = formatDateTime(selectedVote.votedAt); return `${dt.date} · ${dt.time}`; })()}
                  </div>
                </div>

                {/* Ballot rows */}
                {selectedVote.ballots?.length > 0 ? (
                  <>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: t.subtext, marginBottom: 10 }}>Votes cast</div>
                    {selectedVote.ballots.map((b, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "8px 0", borderBottom: i < selectedVote.ballots.length - 1 ? `1px solid ${dark ? "#2a2a27" : "#e5e4de"}` : "none", gap: 10 }}>
                        <span style={{ fontSize: 11, color: t.subtext, flexShrink: 0, width: 110, paddingTop: 2, lineHeight: 1.4 }}>{b.position}</span>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{b.candidateName}</div>
                          {b.partyList && <div style={{ fontSize: 10, color: t.subtext, marginTop: 1 }}>{b.partyList}</div>}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "12px 0", color: t.subtext, fontSize: 13 }}>Ballot details not available</div>
                )}

                {/* Footer */}
                <div style={{ borderTop: `1px dashed ${dark ? "#333" : "#ccc"}`, marginTop: 14, paddingTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(45,140,78,0.08)", borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2D8C4E", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#2D8C4E" }}>Your vote has been recorded on the blockchain</span>
                  </div>
                  <p style={{ fontSize: 11, color: t.subtext, lineHeight: 1.6, marginTop: 10 }}>
                    This receipt confirms your participation. Your choices are encrypted and cannot be altered or traced back to you.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}