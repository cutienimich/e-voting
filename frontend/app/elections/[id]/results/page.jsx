"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ethers } from "ethers";
import { apiFetch } from "@/utils/api";

const CONTRACT_ADDRESS = "0x8199911911F511ed7dC37E571d2dDb9902101c0b";
const AMOY_RPC_URL = "https://polygon-amoy.g.alchemy.com/v2/3SQHJ8aIh0vDZKtmJZ5wl";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const CONTRACT_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "_electionId", "type": "uint256" }],
    "name": "getElection",
    "outputs": [{
      "components": [
        { "internalType": "uint256", "name": "id", "type": "uint256" },
        { "internalType": "string", "name": "name", "type": "string" },
        { "internalType": "bool", "name": "isOpen", "type": "bool" },
        { "internalType": "uint256", "name": "startTime", "type": "uint256" },
        { "internalType": "uint256", "name": "endTime", "type": "uint256" }
      ],
      "internalType": "struct Voting.Election",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_electionId", "type": "uint256" }],
    "name": "getCandidates",
    "outputs": [{
      "components": [
        { "internalType": "uint256", "name": "id", "type": "uint256" },
        { "internalType": "string", "name": "name", "type": "string" },
        { "internalType": "string", "name": "position", "type": "string" },
        { "internalType": "uint256", "name": "voteCount", "type": "uint256" }
      ],
      "internalType": "struct Voting.Candidate[]",
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  }
];

const theme = {
  light: { bg: "#FAFAF7", card: "#F2F0EA", text: "#111211", subtext: "#6B7070", border: "#E2DFD6", pill: "rgba(0,0,0,0.04)" },
  dark:  { bg: "#0D1110", card: "#141A17", text: "#E8EDE9", subtext: "#7A8C80", border: "#222E27", pill: "rgba(255,255,255,0.05)" },
};

export default function ResultsPage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [electionName, setElectionName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [grouped, setGrouped] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [blockchainId, setBlockchainId] = useState(null);

  const router = useRouter();
  const params = useParams();
  const electionId = params?.id;

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("iboto-theme");
    if (saved) setDark(saved === "dark");
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  useEffect(() => {
    if (!electionId) return;
    fetchResults(false);

    const interval = setInterval(() => {
      fetchResults(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [electionId]);

  const fetchResults = async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const elecRes = await apiFetch(`/api/elections/${electionId}`);
      if (!elecRes) return;
      const elecData = await elecRes.json();
      if (!elecData.success) throw new Error("Election not found");
      const election = elecData.data;
      setElectionName(election.name);
      setIsOpen(election.isOpen);
      const tally = election.tally || [];
      const groups = {};
      for (const c of tally) {
        const pos = c.position;
        if (!groups[pos]) groups[pos] = [];
        groups[pos].push({ name: c.name, voteCount: c.voteCount });
      }
      for (const pos of Object.keys(groups)) {
        const maxVotes = Math.max(...groups[pos].map(c => c.voteCount));
        groups[pos] = groups[pos]
          .map(c => ({ ...c, isWinner: c.voteCount === maxVotes && maxVotes > 0 && !election.isOpen }))
          .sort((a, b) => b.voteCount - a.voteCount);
      }
      const firstPos = Object.keys(groups)[0];
      const correctTotal = groups[firstPos]?.reduce((s, c) => s + c.voteCount, 0) ?? 0;
      setGrouped(groups);
      setTotalVotes(correctTotal);
    } catch (err) {
      console.error("Results error:", err);
      if (!silent) setError("Could not load results. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("iboto-theme", next ? "dark" : "light");
  };

  if (!mounted) return null;
  const t = dark ? theme.dark : theme.light;

  const positions = Object.keys(grouped);

  return (
    <div style={{ background: dark ? "#080B0A" : "#F7F5F0", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", display: "flex", justifyContent: "center" }}>
      <div style={{ background: t.bg, color: t.text, width: "100%", maxWidth: 430, minHeight: "100vh" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Lora:wght@600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
          .fade-up { animation: fadeUp 0.35s ease forwards; }
          @keyframes growBar { from { width: 0%; } to { width: var(--bar-width); } }
          .result-bar-fill { animation: growBar 0.8s ease forwards; }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 10px; }
        `}</style>

        {/* NAV */}
        <nav style={{ padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, background: t.bg, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => router.back()} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 10, padding: "7px 10px", cursor: "pointer", color: t.subtext, display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span style={{ fontFamily: "Lora, serif", fontWeight: 700, fontSize: 18, color: t.text }}>Results</span>
          </div>
          <button onClick={toggleTheme} style={{ background: t.pill, border: `1px solid ${t.border}`, cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {dark
              ? <svg width="17" height="17" fill="none" stroke="#5cc97f" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              : <svg width="17" height="17" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </button>
        </nav>

        <div style={{ padding: "24px 22px 80px" }}>

          {/* Election header */}
          {!loading && !error && (
            <div className="fade-up" style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                  background: isOpen ? "rgba(45,140,78,0.12)" : "rgba(107,112,112,0.1)",
                  color: isOpen ? "#2D8C4E" : t.subtext,
                  border: `1px solid ${isOpen ? "rgba(45,140,78,0.25)" : t.border}`,
                  textTransform: "uppercase", letterSpacing: "0.06em"
                }}>
                  {isOpen ? "● Live" : "Closed"}
                </span>
              </div>
              <h1 style={{ fontFamily: "Lora, serif", fontSize: 22, fontWeight: 700, color: t.text, marginBottom: 6 }}>
                {electionName}
              </h1>
              <div style={{ display: "flex", gap: 16, fontSize: 13, color: t.subtext }}>
                <span>👥 {totalVotes} total votes cast</span>
                <span>📋 {positions.length} positions</span>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ height: 12, borderRadius: 6, background: t.border, width: "40%", marginBottom: 16 }} />
                  {[1,2].map(j => (
                    <div key={j} style={{ height: 52, borderRadius: 10, background: t.border, marginBottom: 8, opacity: j === 2 ? 0.5 : 1 }} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <p style={{ fontSize: 14, color: t.subtext, marginBottom: 20 }}>{error}</p>
              <button onClick={fetchResults} style={{ padding: "10px 24px", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", color: t.subtext, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                Try again
              </button>
            </div>
          )}

          {/* Results by position */}
          {!loading && !error && positions.map((pos, pi) => {
            const candidates = grouped[pos];
            const maxVotes = Math.max(...candidates.map(c => c.voteCount));
            const winner = candidates.find(c => c.isWinner);
            const isLeading = (c) => c.voteCount === maxVotes && maxVotes > 0;

            return (
              <div key={pos} className="fade-up" style={{
                background: t.card,
                border: `1px solid ${t.border}`,
                borderRadius: 18,
                overflow: "hidden",
                marginBottom: 14,
                animationDelay: `${pi * 0.05}s`,
                opacity: 0,
              }}>
                {/* Position header */}
                <div style={{ padding: "14px 18px 10px", borderBottom: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: dark ? "#5cc97f" : "#1B6B3A", marginBottom: 4 }}>
                    {pos}
                  </div>
                  {winner && !isOpen && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{winner.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: "rgba(45,140,78,0.12)", color: "#2D8C4E", border: "1px solid rgba(45,140,78,0.2)" }}>Winner</span>
                    </div>
                  )}
                </div>

                {/* Candidates */}
                <div style={{ padding: "12px 18px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {candidates.map((c, ci) => {
                    const pct = maxVotes > 0 ? Math.round((c.voteCount / maxVotes) * 100) : 0;
                    const totalPct = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : "0.0";
                    const leading = isLeading(c);

                    return (
                      <div key={ci}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%",
                              background: leading ? "linear-gradient(135deg, #1B4D2E, #2D8C4E)" : t.border,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: 700,
                              color: leading ? "white" : t.subtext,
                              flexShrink: 0,
                            }}>
                              {c.name?.charAt(0)}
                            </div>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: leading ? 700 : 500, color: t.text }}>{c.name}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: leading ? (dark ? "#5cc97f" : "#1B6B3A") : t.text }}>{totalPct}%</span>
                            <div style={{ fontSize: 11, color: t.subtext }}>{c.voteCount} votes</div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: 5, borderRadius: 3, background: dark ? "#1e2a22" : "#e8ede9", overflow: "hidden" }}>
                          <div
                            className="result-bar-fill"
                            style={{
                              "--bar-width": `${pct}%`,
                              height: "100%",
                              borderRadius: 3,
                              background: leading
                                ? "linear-gradient(90deg, #1B4D2E, #2D8C4E)"
                                : (dark ? "#2a3830" : "#c8d5cc"),
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Footer */}
          {!loading && !error && (
            <div className="fade-up" style={{ marginTop: 8, padding: "14px 18px", background: "rgba(45,140,78,0.06)", border: "1px solid rgba(45,140,78,0.15)", borderRadius: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2D8C4E", flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: dark ? "#5cc97f" : "#1B6B3A", lineHeight: 1.5, fontWeight: 500 }}>
                Results are pulled directly from the blockchain and cannot be altered.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}