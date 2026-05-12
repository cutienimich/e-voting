"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminElectionsPage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("elections");

  // Modals
  const [showCreateElection, setShowCreateElection] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [selectedElection, setSelectedElection] = useState(null);
  const [showCandidates, setShowCandidates] = useState(false);

  // Forms
  const [electionForm, setElectionForm] = useState({ name: "" });
  const [candidateForm, setCandidateForm] = useState({ name: "", position: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

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
      if (data.success) setElections(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateElection = async () => {
    if (!electionForm.name.trim()) { setFormError("Election name required"); return; }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await fetch("http://localhost:5000/api/admin/elections", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name: electionForm.name.trim() })
      });
      const data = await res.json();
      if (!data.success) { setFormError(data.message); return; }
      setFormSuccess("Election created successfully!");
      setElectionForm({ name: "" });
      fetchElections();
      setTimeout(() => { setShowCreateElection(false); setFormSuccess(""); }, 1500);
    } catch { setFormError("Server error. Try again."); }
    finally { setFormLoading(false); }
  };

  const handleAddCandidate = async () => {
    if (!candidateForm.name.trim() || !candidateForm.position.trim()) { setFormError("All fields required"); return; }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await fetch("http://localhost:5000/api/admin/elections/candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ electionId: selectedElection.id, name: candidateForm.name.trim(), position: candidateForm.position.trim() })
      });
      const data = await res.json();
      if (!data.success) { setFormError(data.message); return; }
      setFormSuccess("Candidate added!");
      setCandidateForm({ name: "", position: "" });
      fetchElections();
      setTimeout(() => setFormSuccess(""), 1500);
    } catch { setFormError("Server error. Try again."); }
    finally { setFormLoading(false); }
  };

  const handleOpenElection = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/elections/${id}/open`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) fetchElections();
      else alert(data.message);
    } catch { alert("Server error"); }
  };

  const handleCloseElection = async (id) => {
    if (!confirm("Close this election? This cannot be undone.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/elections/${id}/close`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) fetchElections();
      else alert(data.message);
    } catch { alert("Server error"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("iboto-admin-token");
    localStorage.removeItem("iboto-admin");
    router.push("/admin/login");
  };

  if (!mounted) return null;
  const t = dark ? theme.dark : theme.light;

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", display: "flex", transition: "all 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .sidebar-link {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 16px; border-radius: 10px;
          font-size: 14px; font-weight: 500; cursor: pointer;
          border: none; background: none; color: ${t.subtext};
          font-family: 'DM Sans', sans-serif; width: 100%;
          transition: all 0.2s; text-align: left;
        }
        .sidebar-link:hover { background: rgba(45,140,78,0.08); color: #2D8C4E; }
        .sidebar-link.active { background: rgba(45,140,78,0.12); color: #2D8C4E; font-weight: 600; }
        .btn-primary {
          background: linear-gradient(135deg, #1B4D2E, #2D8C4E);
          color: white; border: none; border-radius: 10px;
          padding: 10px 20px; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s; box-shadow: 0 4px 12px rgba(45,140,78,0.3);
          display: flex; align-items: center; gap: 6px;
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-success {
          background: rgba(45,140,78,0.12); color: #2D8C4E;
          border: 1px solid rgba(45,140,78,0.3); border-radius: 8px;
          padding: 7px 14px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .btn-success:hover { background: rgba(45,140,78,0.2); }
        .btn-danger {
          background: rgba(239,68,68,0.1); color: #EF4444;
          border: 1px solid rgba(239,68,68,0.3); border-radius: 8px;
          padding: 7px 14px; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .btn-danger:hover { background: rgba(239,68,68,0.2); }
        .btn-ghost {
          background: transparent; color: ${t.subtext};
          border: 1px solid ${t.border}; border-radius: 8px;
          padding: 7px 14px; font-size: 13px; font-weight: 500;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
          display: flex; align-items: center; gap: 6px;
        }
        .btn-ghost:hover { border-color: #2D8C4E; color: #2D8C4E; }
        .input-field {
          width: 100%; padding: 11px 14px; border-radius: 10px;
          border: 1.5px solid ${t.border}; background: ${t.bg};
          color: ${t.text}; font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: all 0.2s;
        }
        .input-field:focus { border-color: #2D8C4E; box-shadow: 0 0 0 3px rgba(45,140,78,0.12); }
        .input-field::placeholder { color: ${t.subtext}; opacity: 0.7; }
        .table-row {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
          align-items: center; padding: 14px 20px;
          border-bottom: 1px solid ${t.border}; transition: background 0.2s;
        }
        .table-row:hover { background: rgba(45,140,78,0.03); }
        .table-header {
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
          padding: 12px 20px; border-bottom: 2px solid ${t.border};
          font-size: 12px; font-weight: 700; color: ${t.subtext};
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .badge-open {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(45,140,78,0.12); border: 1px solid rgba(45,140,78,0.3);
          color: #2D8C4E; padding: 4px 10px; border-radius: 100px;
          font-size: 12px; font-weight: 600;
        }
        .badge-closed {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(107,114,128,0.12); border: 1px solid rgba(107,114,128,0.3);
          color: ${t.subtext}; padding: 4px 10px; border-radius: 100px;
          font-size: 12px; font-weight: 600;
        }
        .badge-draft {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.3);
          color: #F59E0B; padding: 4px 10px; border-radius: 100px;
          font-size: 12px; font-weight: 600;
        }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 200; padding: 24px;
        }
        .modal {
          background: ${t.card}; border-radius: 16px; padding: 28px;
          width: 100%; max-width: 480px; border: 1px solid ${t.border};
        }
        .toggle-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .toggle-btn:hover { background: rgba(45,140,78,0.1); }
        .error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #EF4444; padding: 10px 14px; border-radius: 8px; font-size: 13px; }
        .success-box { background: rgba(45,140,78,0.1); border: 1px solid rgba(45,140,78,0.3); color: #2D8C4E; padding: 10px 14px; border-radius: 8px; font-size: 13px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .dot-live { width: 7px; height: 7px; border-radius: 50%; background: #2D8C4E; animation: pulse 2s infinite; display: inline-block; }
        .stat-card { background: ${t.card}; border: 1px solid ${t.border}; border-radius: 12px; padding: 20px 24px; }
      `}</style>

      {/* SIDEBAR */}
      <div style={{ width: 240, background: t.card, borderRight: `1px solid ${t.border}`, padding: "24px 16px", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32, paddingLeft: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontFamily: "Playfair Display, serif", fontSize: 18, fontWeight: 800 }}>i</span>
          </div>
          <div>
            <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 16, color: t.text }}>iboto</div>
            <div style={{ fontSize: 11, color: t.subtext }}>Admin Panel</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          <button className={`sidebar-link ${activeTab === "elections" ? "active" : ""}`} onClick={() => setActiveTab("elections")}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Elections
          </button>
          <button className={`sidebar-link ${activeTab === "students" ? "active" : ""}`} onClick={() => router.push("/admin/students")}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Students
          </button>
          <button className={`sidebar-link ${activeTab === "results" ? "active" : ""}`} onClick={() => router.push("/admin/results")}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Results
          </button>
        </nav>

        {/* Admin info + logout */}
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

      {/* MAIN CONTENT */}
      <div style={{ marginLeft: 240, flex: 1, padding: "32px 36px", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>Elections</h1>
            <p style={{ fontSize: 14, color: t.subtext, marginTop: 4 }}>Manage elections, candidates, and voting periods</p>
          </div>
          <button className="btn-primary" onClick={() => { setShowCreateElection(true); setFormError(""); setFormSuccess(""); }}>
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Election
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Elections", value: elections.length, icon: <svg width="20" height="20" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
            { label: "Active", value: elections.filter(e => e.isOpen).length, icon: <svg width="20" height="20" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
            { label: "Total Candidates", value: elections.reduce((acc, e) => acc + (e.candidates?.length || 0), 0), icon: <svg width="20" height="20" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(45,140,78,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
              </div>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 32, fontWeight: 800, color: t.text, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: t.subtext }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Elections Table */}
        <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: t.text }}>All Elections</h2>
            <span style={{ fontSize: 13, color: t.subtext }}>{elections.length} total</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: t.subtext }}>Loading...</div>
          ) : elections.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🗳️</div>
              <p style={{ fontSize: 15, color: t.subtext }}>No elections yet. Create one to get started.</p>
            </div>
          ) : (
            <>
              <div className="table-header">
                <span>Election Name</span>
                <span>Status</span>
                <span>Candidates</span>
                <span>Created</span>
                <span>Actions</span>
              </div>
              {elections.map(election => (
                <div key={election.id} className="table-row">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 2 }}>{election.name}</div>
                    <div style={{ fontSize: 12, color: t.subtext, fontFamily: "monospace" }}>ID: {election.id.slice(0, 12)}...</div>
                  </div>
                  <div>
                    {election.isOpen
                      ? <span className="badge-open"><span className="dot-live" />Live</span>
                      : election.startTime
                        ? <span className="badge-closed">Closed</span>
                        : <span className="badge-draft">Draft</span>
                    }
                  </div>
                  <div style={{ fontSize: 14, color: t.text, fontWeight: 600 }}>
                    {election.candidates?.length || 0}
                  </div>
                  <div style={{ fontSize: 13, color: t.subtext }}>
                    {new Date(election.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn-ghost" onClick={() => { setSelectedElection(election); setShowCandidates(true); }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      Candidates
                    </button>
                    {!election.isOpen && !election.endTime && (
                      <button className="btn-success" onClick={() => handleOpenElection(election.id)}>Open</button>
                    )}
                    {election.isOpen && (
                      <button className="btn-danger" onClick={() => handleCloseElection(election.id)}>Close</button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* CREATE ELECTION MODAL */}
      {showCreateElection && (
        <div className="modal-overlay" onClick={() => !formLoading && setShowCreateElection(false)}>
          <div className="modal fade-up" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 800, color: t.text, marginBottom: 6 }}>Create Election</h2>
            <p style={{ fontSize: 14, color: t.subtext, marginBottom: 24 }}>Set up a new election for Colegio de Montalban.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.subtext, marginBottom: 8 }}>Election Name</div>
                <input className="input-field" placeholder="e.g. Student Council Election 2025" value={electionForm.name} onChange={e => setElectionForm({ name: e.target.value })} />
              </div>

              {formError && <div className="error-box">{formError}</div>}
              {formSuccess && <div className="success-box">{formSuccess}</div>}

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="btn-primary" onClick={handleCreateElection} disabled={formLoading} style={{ flex: 1 }}>
                  {formLoading ? "Creating..." : "Create Election"}
                </button>
                <button className="btn-ghost" onClick={() => setShowCreateElection(false)} disabled={formLoading}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATES MODAL */}
      {showCandidates && selectedElection && (
        <div className="modal-overlay" onClick={() => setShowCandidates(false)}>
          <div className="modal fade-up" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 800, color: t.text }}>Candidates</h2>
                <p style={{ fontSize: 13, color: t.subtext, marginTop: 2 }}>{selectedElection.name}</p>
              </div>
              <button onClick={() => setShowCandidates(false)} style={{ background: "none", border: "none", cursor: "pointer", color: t.subtext }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Candidate list */}
            <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 20 }}>
              {selectedElection.candidates?.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: t.subtext, fontSize: 14 }}>No candidates yet.</div>
              ) : (
                selectedElection.candidates?.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>{c.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: t.subtext }}>{c.position}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add candidate form */}
            {!selectedElection.isOpen && (
              <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 14 }}>Add Candidate</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input className="input-field" placeholder="Candidate name" value={candidateForm.name} onChange={e => setCandidateForm(p => ({ ...p, name: e.target.value }))} />
                  <input className="input-field" placeholder="Position (e.g. President)" value={candidateForm.position} onChange={e => setCandidateForm(p => ({ ...p, position: e.target.value }))} />
                  {formError && <div className="error-box">{formError}</div>}
                  {formSuccess && <div className="success-box">{formSuccess}</div>}
                  <button className="btn-primary" onClick={handleAddCandidate} disabled={formLoading}>
                    {formLoading ? "Adding..." : "Add Candidate"}
                  </button>
                </div>
              </div>
            )}

            {selectedElection.isOpen && (
              <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#F59E0B" }}>
                ⚠️ Election is live. Cannot add candidates while voting is open.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const theme = {
  light: { bg: "#F4F6FA", card: "#FFFFFF", text: "#0D0D0D", subtext: "#6B7280", border: "#E5E7EB" },
  dark: { bg: "#0D1117", card: "#161B22", text: "#E6EDF3", subtext: "#8B949E", border: "#30363D" }
};