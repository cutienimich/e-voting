"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminResultsPage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("iboto-theme");
    if (saved) setDark(saved === "dark");
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);

    const adminData = localStorage.getItem("iboto-admin");
    const token = localStorage.getItem("iboto-admin-token");
    if (!adminData || !token) { router.push("/admin/login"); return; }
    setAdmin(JSON.parse(adminData));
    fetchElections();
  }, []);

  // Auto refresh every 10 seconds if enabled
  useEffect(() => {
    if (!autoRefresh || !selectedElection) return;
    const interval = setInterval(() => fetchResults(selectedElection), 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedElection]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("iboto-theme", next ? "dark" : "light");
  };

  const getToken = () => localStorage.getItem("iboto-admin-token");

  const fetchElections = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/elections", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        setElections(data.data);
        if (data.data.length > 0) {
          setSelectedElection(data.data[0]);
          fetchResults(data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (election) => {
    setResultsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/elections/${election.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) setResults(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setResultsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("iboto-admin-token");
    localStorage.removeItem("iboto-admin");
    router.push("/admin/login");
  };

  const groupByPosition = (tally) => {
    if (!tally) return {};
    return tally.reduce((acc, c) => {
      if (!acc[c.position]) acc[c.position] = [];
      acc[c.position].push(c);
      return acc;
    }, {});
  };

  const getWinner = (candidates) => {
    if (!candidates || candidates.length === 0) return null;
    const max = Math.max(...candidates.map(c => c.voteCount));
    if (max === 0) return null;
    return candidates.find(c => c.voteCount === max);
  };

  const getTotalVotes = (candidates) => {
    if (!candidates) return 0;
    return candidates.reduce((acc, c) => acc + c.voteCount, 0);
  };

  if (!mounted) return null;
  const t = dark ? theme.dark : theme.light;

  const grouped = results ? groupByPosition(results.tally) : {};
  const positions = Object.keys(grouped);
  const totalVotes = getTotalVotes(results?.tally);

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", display: "flex", transition: "all 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .sidebar-link { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; background: none; color: ${t.subtext}; font-family: 'DM Sans', sans-serif; width: 100%; transition: all 0.2s; text-align: left; }
        .sidebar-link:hover { background: rgba(45,140,78,0.08); color: #2D8C4E; }
        .sidebar-link.active { background: rgba(45,140,78,0.12); color: #2D8C4E; font-weight: 600; }
        .election-tab { padding: 10px 16px; border-radius: 10px; cursor: pointer; border: 1px solid ${t.border}; background: ${t.card}; color: ${t.subtext}; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; transition: all 0.2s; text-align: left; width: 100%; }
        .election-tab:hover { border-color: #2D8C4E; color: #2D8C4E; }
        .election-tab.active { border-color: #2D8C4E; background: rgba(45,140,78,0.08); color: #2D8C4E; font-weight: 600; }
        .toggle-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .toggle-btn:hover { background: rgba(45,140,78,0.1); }
        .progress-bar { height: 10px; border-radius: 100px; background: ${t.border}; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, #1B4D2E, #2D8C4E); transition: width 0.8s ease; }
        .progress-fill-winner { height: 100%; border-radius: 100px; background: linear-gradient(90deg, #1B4D2E, #2D8C4E); transition: width 0.8s ease; box-shadow: 0 0 8px rgba(45,140,78,0.4); }
        .candidate-row { display: flex; flex-direction: column; gap: 8px; padding: 16px; border-radius: 12px; border: 1px solid ${t.border}; background: ${t.bg}; transition: all 0.2s; }
        .candidate-row.winner { border-color: #2D8C4E; background: rgba(45,140,78,0.04); }
        .badge-open { display: inline-flex; align-items: center; gap: 5px; background: rgba(45,140,78,0.12); border: 1px solid rgba(45,140,78,0.3); color: #2D8C4E; padding: 4px 10px; border-radius: 100px; font-size: 12px; font-weight: 600; }
        .badge-closed { display: inline-flex; align-items: center; background: rgba(107,114,128,0.12); border: 1px solid rgba(107,114,128,0.3); color: ${t.subtext}; padding: 4px 10px; border-radius: 100px; font-size: 12px; font-weight: 600; }
        .tx-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid ${t.border}; }
        .tx-row:last-child { border-bottom: none; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .dot-live { width: 7px; height: 7px; border-radius: 50%; background: #2D8C4E; animation: pulse 2s infinite; display: inline-block; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 20px; height: 20px; border: 2px solid rgba(45,140,78,0.2); border-top: 2px solid #2D8C4E; border-radius: 50%; animation: spin 0.8s linear infinite; }
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 240, background: t.card, borderRight: `1px solid ${t.border}`, padding: "24px 16px", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, paddingLeft: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 800 }}>i</span>
          </div>
          <div>
            <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 16, color: t.text }}>iboto</div>
            <div style={{ fontSize: 11, color: t.subtext }}>Admin Panel</div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <button className="sidebar-link" onClick={() => router.push("/admin/elections")}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Elections
          </button>
          <button className="sidebar-link" onClick={() => router.push("/admin/students")}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Students
          </button>
          <button className="sidebar-link active">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Results
          </button>
        </nav>

        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingLeft: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>{admin?.username?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{admin?.username}</div>
              <div style={{ fontSize: 11, color: t.subtext }}>Administrator</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 8 }}>
            <button className="toggle-btn" onClick={toggleTheme}>
              {dark
                ? <svg width="16" height="16" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                : <svg width="16" height="16" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              }
            </button>
            <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: t.subtext, fontSize: 13, fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: 240, flex: 1, padding: "32px 36px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>Results</h1>
            <p style={{ fontSize: 14, color: t.subtext, marginTop: 4 }}>Live tally from blockchain</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Auto refresh toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "8px 14px" }}>
              <div className={autoRefresh ? "dot-live" : ""} style={{ width: 7, height: 7, borderRadius: "50%", background: autoRefresh ? "#2D8C4E" : t.border }} />
              <span style={{ fontSize: 13, color: t.subtext }}>Auto refresh</span>
              <div
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{ width: 36, height: 20, borderRadius: 100, background: autoRefresh ? "#2D8C4E" : t.border, cursor: "pointer", position: "relative", transition: "all 0.2s" }}
              >
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", position: "absolute", top: 2, left: autoRefresh ? 18 : 2, transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
            </div>
            {selectedElection && (
              <button onClick={() => fetchResults(selectedElection)} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: t.subtext, fontSize: 13, fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                Refresh
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24 }}>

          {/* Election selector */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: t.subtext, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Select Election</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {loading ? (
                <div style={{ color: t.subtext, fontSize: 14 }}>Loading...</div>
              ) : elections.length === 0 ? (
                <div style={{ color: t.subtext, fontSize: 14 }}>No elections found.</div>
              ) : (
                elections.map(election => (
                  <button
                    key={election.id}
                    className={`election-tab ${selectedElection?.id === election.id ? "active" : ""}`}
                    onClick={() => { setSelectedElection(election); fetchResults(election); }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{election.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {election.isOpen
                        ? <span className="badge-open"><span className="dot-live" />Live</span>
                        : <span className="badge-closed">Closed</span>
                      }
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Results */}
          <div>
            {!selectedElection ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: t.subtext }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <p>Select an election to view results</p>
              </div>
            ) : resultsLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: 12 }}>
                <div className="spinner" />
                <span style={{ color: t.subtext, fontSize: 14 }}>Loading results...</span>
              </div>
            ) : (
              <div className="fade-up">

                {/* Election header */}
                <div style={{ background: t.card, borderRadius: 16, padding: "20px 24px", border: `1px solid ${t.border}`, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 800, color: t.text, marginBottom: 6 }}>{selectedElection.name}</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {selectedElection.isOpen
                        ? <span className="badge-open"><span className="dot-live" />Live</span>
                        : <span className="badge-closed">Closed</span>
                      }
                      <span style={{ fontSize: 13, color: t.subtext }}>{totalVotes} total votes</span>
                    </div>
                  </div>
                  {selectedElection.isOpen && (
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 12, color: t.subtext }}>Started</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{new Date(selectedElection.startTime).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  )}
                </div>

                {/* Tally per position */}
                {positions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: t.subtext }}>
                    <p>No votes recorded yet.</p>
                  </div>
                ) : (
                  positions.map(position => {
                    const candidates = grouped[position];
                    const posTotal = getTotalVotes(candidates);
                    const winner = getWinner(candidates);

                    return (
                      <div key={position} style={{ background: t.card, borderRadius: 16, padding: "20px 24px", border: `1px solid ${t.border}`, marginBottom: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: t.text, textTransform: "uppercase", letterSpacing: "0.5px" }}>{position}</h3>
                          <span style={{ fontSize: 13, color: t.subtext }}>{posTotal} votes</span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {candidates
                            .sort((a, b) => b.voteCount - a.voteCount)
                            .map(candidate => {
                              const pct = posTotal > 0 ? Math.round((candidate.voteCount / posTotal) * 100) : 0;
                              const isWinner = winner?.id === candidate.id && !selectedElection.isOpen;

                              return (
                                <div key={candidate.id} className={`candidate-row ${isWinner ? "winner" : ""}`}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: isWinner ? "linear-gradient(135deg, #1B4D2E, #2D8C4E)" : t.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <span style={{ color: isWinner ? "white" : t.subtext, fontSize: 14, fontWeight: 700 }}>
                                          {isWinner ? "👑" : candidate.name.charAt(0)}
                                        </span>
                                      </div>
                                      <div>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{candidate.name}</p>
                                        {isWinner && <p style={{ fontSize: 11, color: "#2D8C4E", fontWeight: 600 }}>WINNER</p>}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                      <p style={{ fontSize: 16, fontWeight: 800, color: isWinner ? "#2D8C4E" : t.text }}>{pct}%</p>
                                      <p style={{ fontSize: 12, color: t.subtext }}>{candidate.voteCount} votes</p>
                                    </div>
                                  </div>
                                  <div className="progress-bar">
                                    <div className={isWinner ? "progress-fill-winner" : "progress-fill"} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Recent transactions */}
                {results?.transactions && results.transactions.length > 0 && (
                  <div style={{ background: t.card, borderRadius: 16, padding: "20px 24px", border: `1px solid ${t.border}`, marginTop: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 16 }}>Recent Blockchain Transactions</h3>
                    <div>
                      {results.transactions.slice(-10).reverse().map((tx, i) => (
                        <div key={i} className="tx-row">
                          <div>
                            <p style={{ fontSize: 12, fontFamily: "monospace", color: t.subtext, marginBottom: 2 }}>
                              {tx.hashedStudentId.slice(0, 18)}...
                            </p>
                            <p style={{ fontSize: 11, color: t.subtext }}>Block #{tx.blockNumber}</p>
                          </div>
                          <a
                            href={`https://amoy.polygonscan.com/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 12, color: "#2D8C4E", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                          >
                            {tx.txHash.slice(0, 14)}...
                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const theme = {
  light: { bg: "#F4F6FA", card: "#FFFFFF", text: "#0D0D0D", subtext: "#6B7280", border: "#E5E7EB" },
  dark: { bg: "#0D1117", card: "#161B22", text: "#E6EDF3", subtext: "#8B949E", border: "#30363D" }
};