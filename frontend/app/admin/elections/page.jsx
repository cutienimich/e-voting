"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── SSG Positions ─────────────────────────────────────────
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
  const [editCandidate, setEditCandidate] = useState(null); // candidate being edited

  // Forms
  const [electionForm, setElectionForm] = useState({ name: "" });
  const [candidateForm, setCandidateForm] = useState({
    name: "",
    position: POSITIONS[0],
    partylist: "",
    motto: "",
    platforms: [""],
    photo: null,
    photoPreview: null,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Filter inside candidates modal
  const [filterPos, setFilterPos] = useState("All");

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

  // ── Election CRUD ──────────────────────────────────────────
  const handleCreateElection = async () => {
    if (!electionForm.name.trim()) { setFormError("Election name required"); return; }
    setFormLoading(true); setFormError("");
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

  const handleOpenElection = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/elections/${id}/open`, {
        method: "PUT", headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) fetchElections(); else alert(data.message);
    } catch { alert("Server error"); }
  };

  const handleCloseElection = async (id) => {
    if (!confirm("Close this election? This cannot be undone.")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/elections/${id}/close`, {
        method: "PUT", headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) fetchElections(); else alert(data.message);
    } catch { alert("Server error"); }
  };

  // ── Candidate CRUD ─────────────────────────────────────────
  const resetCandidateForm = () => setCandidateForm({
    name: "", position: POSITIONS[0], partylist: "", motto: "", platforms: [""], photo: null, photoPreview: null,
  });

  const openAddCandidate = () => {
    resetCandidateForm();
    setEditCandidate(null);
    setFormError(""); setFormSuccess("");
    setShowAddCandidate(true);
  };

  const openEditCandidate = (candidate) => {
    setCandidateForm({
      name: candidate.name || "",
      position: candidate.position || POSITIONS[0],
      partylist: candidate.partylist || "",
      motto: candidate.motto || "",
      platforms: candidate.platforms?.length ? candidate.platforms : [""],
      photo: null,
      photoPreview: candidate.photoUrl || null,
    });
    setEditCandidate(candidate);
    setFormError(""); setFormSuccess("");
    setShowAddCandidate(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCandidateForm(f => ({ ...f, photo: file, photoPreview: reader.result }));
    reader.readAsDataURL(file);
  };

  const handlePlatformChange = (i, val) => {
    const updated = [...candidateForm.platforms];
    updated[i] = val;
    setCandidateForm(f => ({ ...f, platforms: updated }));
  };

  const addPlatform = () => setCandidateForm(f => ({ ...f, platforms: [...f.platforms, ""] }));
  const removePlatform = (i) => setCandidateForm(f => ({ ...f, platforms: f.platforms.filter((_, idx) => idx !== i) }));

  const handleSaveCandidate = async () => {
    if (!candidateForm.name.trim()) { setFormError("Candidate name is required"); return; }
    setFormLoading(true); setFormError("");

    try {
      // Build FormData to support photo upload
      const formData = new FormData();
      formData.append("electionId", selectedElection.id);
      formData.append("name", candidateForm.name.trim());
      formData.append("position", candidateForm.position);
      formData.append("partylist", candidateForm.partylist.trim());
      formData.append("motto", candidateForm.motto.trim());
      formData.append("platforms", JSON.stringify(candidateForm.platforms.filter(Boolean)));
      if (candidateForm.photo) formData.append("photo", candidateForm.photo);

      const url = editCandidate
        ? `http://localhost:5000/api/admin/elections/candidate/${editCandidate.id}`
        : "http://localhost:5000/api/admin/elections/candidate";
      const method = editCandidate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      const data = await res.json();
      if (!data.success) { setFormError(data.message); return; }

      setFormSuccess(editCandidate ? "Candidate updated!" : "Candidate added!");
      resetCandidateForm();
      fetchElections();
      setTimeout(() => {
        setShowAddCandidate(false);
        setFormSuccess("");
        // Refresh selected election data
        setSelectedElection(prev => ({ ...prev, candidates: data.data?.candidates || prev.candidates }));
      }, 1200);
    } catch { setFormError("Server error. Try again."); }
    finally { setFormLoading(false); }
  };

  const handleDeleteCandidate = async (candidateId) => {
    if (!confirm("Remove this candidate?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/elections/candidate/${candidateId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchElections();
        setSelectedElection(prev => ({
          ...prev,
          candidates: prev.candidates.filter(c => c.id !== candidateId)
        }));
      } else alert(data.message);
    } catch { alert("Server error"); }
  };

  const handleLogout = () => {
    localStorage.removeItem("iboto-admin-token");
    localStorage.removeItem("iboto-admin");
    router.push("/admin/login");
  };

  // ── Filtered candidates by position ───────────────────────
  const filteredCandidates = (selectedElection?.candidates || []).filter(
    c => filterPos === "All" || c.position === filterPos
  );

  // Group by position for display
  const grouped = POSITIONS.reduce((acc, pos) => {
    const group = filteredCandidates.filter(c => c.position === pos);
    if (group.length > 0) acc[pos] = group;
    return acc;
  }, {});

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
        .btn-icon {
          background: transparent; border: 1px solid ${t.border}; border-radius: 7px;
          padding: 5px 9px; cursor: pointer; font-size: 13px; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-icon:hover { border-color: #2D8C4E; }
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
          max-height: 90vh; overflow-y: auto;
        }
        .modal-wide {
          background: ${t.card}; border-radius: 16px; padding: 0;
          width: 100%; max-width: 680px; border: 1px solid ${t.border};
          max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;
        }
        .toggle-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .toggle-btn:hover { background: rgba(45,140,78,0.1); }
        .error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #EF4444; padding: 10px 14px; border-radius: 8px; font-size: 13px; }
        .success-box { background: rgba(45,140,78,0.1); border: 1px solid rgba(45,140,78,0.3); color: #2D8C4E; padding: 10px 14px; border-radius: 8px; font-size: 13px; }
        .pos-chip {
          padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
          cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .dot-live { width: 7px; height: 7px; border-radius: 50%; background: #2D8C4E; animation: pulse 2s infinite; display: inline-block; }
        .stat-card { background: ${t.card}; border: 1px solid ${t.border}; border-radius: 12px; padding: 20px 24px; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 10px; }
      `}</style>

      {/* ── SIDEBAR ───────────────────────────────────────────── */}
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
          <button className={`sidebar-link ${activeTab === "elections" ? "active" : ""}`} onClick={() => setActiveTab("elections")}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            Elections
          </button>
          <button className={`sidebar-link ${activeTab === "students" ? "active" : ""}`} onClick={() => router.push("/admin/students")}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
            Students
          </button>
          <button className={`sidebar-link ${activeTab === "results" ? "active" : ""}`} onClick={() => router.push("/admin/results")}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
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
                ? <svg width="16" height="16" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
                : <svg width="16" height="16" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
              }
            </button>
            <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: t.subtext, fontSize: 13, fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────── */}
      <div style={{ marginLeft: 240, flex: 1, padding: "32px 36px", minHeight: "100vh" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>Elections</h1>
            <p style={{ fontSize: 14, color: t.subtext, marginTop: 4 }}>Manage elections, candidates, and voting periods</p>
          </div>
          <button className="btn-primary" onClick={() => { setShowCreateElection(true); setFormError(""); setFormSuccess(""); }}>
            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Election
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Elections", value: elections.length, icon: <svg width="20" height="20" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
            { label: "Active", value: elections.filter(e => e.isOpen).length, icon: <svg width="20" height="20" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> },
            { label: "Total Candidates", value: elections.reduce((acc, e) => acc + (e.candidates?.length || 0), 0), icon: <svg width="20" height="20" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg> },
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
                <span>Election Name</span><span>Status</span><span>Candidates</span><span>Created</span><span>Actions</span>
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
                        : <span className="badge-draft">Draft</span>}
                  </div>
                  <div style={{ fontSize: 14, color: t.text, fontWeight: 600 }}>{election.candidates?.length || 0}</div>
                  <div style={{ fontSize: 13, color: t.subtext }}>
                    {new Date(election.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn-ghost" onClick={() => { setSelectedElection(election); setFilterPos("All"); setShowCandidates(true); }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
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

      {/* ── CREATE ELECTION MODAL ─────────────────────────────── */}
      {showCreateElection && (
        <div className="modal-overlay" onClick={() => !formLoading && setShowCreateElection(false)}>
          <div className="modal fade-up" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 800, color: t.text, marginBottom: 6 }}>Create Election</h2>
            <p style={{ fontSize: 14, color: t.subtext, marginBottom: 24 }}>Set up a new election for Colegio de Montalban.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.subtext, marginBottom: 8 }}>Election Name</div>
                <input className="input-field" placeholder="e.g. SSG Elections 2026" value={electionForm.name} onChange={e => setElectionForm({ name: e.target.value })} />
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

      {/* ── VIEW CANDIDATES MODAL ─────────────────────────────── */}
      {showCandidates && selectedElection && (
        <div className="modal-overlay" onClick={() => setShowCandidates(false)}>
          <div className="modal-wide fade-up" onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ padding: "22px 28px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 800, color: t.text }}>{selectedElection.name}</h2>
                <p style={{ fontSize: 13, color: t.subtext, marginTop: 3 }}>{selectedElection.candidates?.length || 0} candidates enrolled</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {!selectedElection.isOpen && (
                  <button className="btn-primary" onClick={() => { setShowCandidates(false); openAddCandidate(); }}>
                    + Add Candidate
                  </button>
                )}
                <button onClick={() => setShowCandidates(false)} style={{ background: "none", border: "none", cursor: "pointer", color: t.subtext }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>

            {/* Position filter chips */}
            <div style={{ padding: "14px 28px", borderBottom: `1px solid ${t.border}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["All", ...POSITIONS].map(pos => (
                <button key={pos} className="pos-chip" onClick={() => setFilterPos(pos)} style={{
                  background: filterPos === pos ? "#166534" : "rgba(45,140,78,0.08)",
                  color: filterPos === pos ? "#fff" : "#2D8C4E",
                }}>
                  {pos === "All" ? "All" : pos.length > 22 ? pos.slice(0, 20) + "…" : pos}
                </button>
              ))}
            </div>

            {/* Candidates list grouped by position */}
            <div style={{ overflowY: "auto", flex: 1, padding: "20px 28px" }}>
              {selectedElection.isOpen && (
                <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#F59E0B", marginBottom: 16 }}>
                  ⚠️ Election is live. Candidates cannot be added or edited while voting is open.
                </div>
              )}

              {Object.keys(grouped).length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: t.subtext }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>👤</div>
                  <div style={{ fontSize: 14 }}>No candidates {filterPos !== "All" ? `for ${filterPos}` : "yet"}</div>
                </div>
              ) : (
                Object.entries(grouped).map(([pos, cands]) => (
                  <div key={pos} style={{ marginBottom: 24 }}>
                    {/* Position divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ height: 1, flex: 1, background: t.border }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#2D8C4E", textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>{pos}</span>
                      <div style={{ height: 1, flex: 1, background: t.border }} />
                    </div>

                    {cands.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 14px", background: dark ? "rgba(255,255,255,0.03)" : "#f9fafb", borderRadius: 10, border: `1px solid ${t.border}`, marginBottom: 10 }}>
                        {/* Photo */}
                        {c.photoUrl || c.photoPreview ? (
                          <img src={c.photoUrl || c.photoPreview} alt={c.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>{c.name?.charAt(0)}</span>
                          </div>
                        )}

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{c.name}</div>
                          {c.partylist && <div style={{ fontSize: 12, color: t.subtext, marginTop: 1 }}>🏛 {c.partylist}</div>}
                          {c.motto && <div style={{ fontSize: 12, color: t.subtext, fontStyle: "italic", marginTop: 2 }}>"{c.motto}"</div>}
                          {c.platforms?.filter(Boolean).length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#2D8C4E", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Platforms</div>
                              {c.platforms.filter(Boolean).map((p, pi) => (
                                <div key={pi} style={{ fontSize: 12, color: t.subtext }}>• {p}</div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {!selectedElection.isOpen && (
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button className="btn-icon" onClick={() => { setShowCandidates(false); openEditCandidate(c); }} title="Edit">✏️</button>
                            <button className="btn-icon" onClick={() => handleDeleteCandidate(c.id)} title="Delete" style={{ color: "#EF4444" }}>🗑</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT CANDIDATE MODAL ────────────────────────── */}
      {showAddCandidate && selectedElection && (
        <div className="modal-overlay" onClick={() => !formLoading && setShowAddCandidate(false)}>
          <div className="modal fade-up" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 800, color: t.text, marginBottom: 4 }}>
              {editCandidate ? "Edit Candidate" : "Add Candidate"}
            </h2>
            <p style={{ fontSize: 13, color: t.subtext, marginBottom: 22 }}>{selectedElection.name}</p>

            {/* Photo upload */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 10px", overflow: "hidden", border: "2px dashed #2D8C4E", background: "rgba(45,140,78,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                onClick={() => document.getElementById("candidatePhoto").click()}>
                {candidateForm.photoPreview
                  ? <img src={candidateForm.photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 26 }}>📷</span>}
              </div>
              <input id="candidatePhoto" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
              <button onClick={() => document.getElementById("candidatePhoto").click()}
                style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", color: t.subtext }}>
                {candidateForm.photoPreview ? "Change Photo" : "Upload Photo"}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Name */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Full Name *</div>
                <input className="input-field" placeholder="e.g. Juan dela Cruz" value={candidateForm.name} onChange={e => setCandidateForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              {/* Position dropdown */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Position *</div>
                <select className="input-field" value={candidateForm.position} onChange={e => setCandidateForm(f => ({ ...f, position: e.target.value }))}>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Partylist */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Partylist</div>
                <input className="input-field" placeholder="e.g. Alyansa" value={candidateForm.partylist} onChange={e => setCandidateForm(f => ({ ...f, partylist: e.target.value }))} />
              </div>

              {/* Motto */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Motto / Slogan</div>
                <input className="input-field" placeholder="e.g. Serbisyo, Pagbabago, Pag-asa" value={candidateForm.motto} onChange={e => setCandidateForm(f => ({ ...f, motto: e.target.value }))} />
              </div>

              {/* Platforms */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.subtext, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Platforms / Advocacies</div>
                {candidateForm.platforms.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input className="input-field" style={{ marginBottom: 0 }} placeholder={`Platform ${i + 1}`} value={p} onChange={e => handlePlatformChange(i, e.target.value)} />
                    {candidateForm.platforms.length > 1 && (
                      <button onClick={() => removePlatform(i)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#EF4444", cursor: "pointer", padding: "0 10px", fontSize: 16 }}>×</button>
                    )}
                  </div>
                ))}
                <button onClick={addPlatform} style={{ background: "none", border: "1px dashed #2D8C4E", borderRadius: 8, color: "#2D8C4E", padding: "6px 14px", fontSize: 13, cursor: "pointer", width: "100%", marginTop: 2 }}>
                  + Add Platform
                </button>
              </div>

              {formError && <div className="error-box">{formError}</div>}
              {formSuccess && <div className="success-box">{formSuccess}</div>}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button className="btn-primary" onClick={handleSaveCandidate} disabled={formLoading} style={{ flex: 1 }}>
                  {formLoading ? "Saving..." : editCandidate ? "Save Changes" : "Add Candidate"}
                </button>
                <button className="btn-ghost" onClick={() => setShowAddCandidate(false)} disabled={formLoading}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const theme = {
  light: { bg: "#F4F6FA", card: "#FFFFFF", text: "#0D0D0D", subtext: "#6B7280", border: "#E5E7EB" },
  dark: { bg: "#0D1117", card: "#161B22", text: "#E6EDF3", subtext: "#8B949E", border: "#30363D" },
};