"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── API HELPER ───────────────────────────────────────────────────────────────
const API = "http://localhost:5000/api";

function useApi() {
  const router = useRouter();
  const call = async (method, path, body) => {
    const token = localStorage.getItem("iboto-admin-token");
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (res.status === 401) { router.push("/admin"); return null; }
    return res.json();
  };
  return {
    get:    (path)        => call("GET",    path),
    post:   (path, body)  => call("POST",   path, body),
    put:    (path, body)  => call("PUT",    path, body),
    patch:  (path, body)  => call("PATCH",  path, body),
    del:    (path)        => call("DELETE", path),
  };
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", flexDirection: "column", gap: 8, zIndex: 9999 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "error" ? "#EF4444" : "#2D8C4E",
          color: "white", padding: "12px 18px", borderRadius: 12,
          fontSize: 14, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          animation: "slideIn 0.3s ease", display: "flex", alignItems: "center", gap: 8,
        }}>
          {t.type === "error"
            ? <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            : <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
          }
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, t }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: t.card, borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, border: `1px solid ${t.border}`, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 800, color: t.text }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: t.subtext, padding: 4 }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
function Confirm({ open, message, onConfirm, onCancel, t }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: t.card, borderRadius: 20, padding: 28, width: "100%", maxWidth: 380, border: `1px solid ${t.border}` }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <svg width="22" height="22" fill="none" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <p style={{ fontSize: 15, color: t.text, marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", color: t.subtext, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: 14 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#EF4444", color: "white", cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: 14 }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, t }) {
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: "20px 22px", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color, fontSize: 22 }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: t.text, fontFamily: "Playfair Display, serif", lineHeight: 1 }}>{value ?? "—"}</div>
        <div style={{ fontSize: 13, color: t.subtext, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── INPUT HELPER ─────────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#6B7280" }}>{label}</label>
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirm, setConfirm] = useState(null);

  // Data
  const [stats, setStats]         = useState(null);
  const [elections, setElections] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [students, setStudents]   = useState([]);
  const [results, setResults]     = useState(null);
  const [selectedElection, setSelectedElection] = useState(null);

  // Loading
  const [loadingMain, setLoadingMain] = useState(false);

  // Modals
  const [electionModal, setElectionModal] = useState(false);
  const [candidateModal, setCandidateModal] = useState(false);
  const [editElection, setEditElection] = useState(null);

  // Forms
  const [elecForm, setElecForm] = useState({ name: "", description: "", startTime: "", endTime: "", positions: "" });
  const [candForm, setCandForm] = useState({ name: "", position: "", partylist: "", platform: "", electionId: "" });

  const router = useRouter();
  const api = useApi();

  // ── TOAST ──────────────────────────────────────────────────────────────────
  const toast = (message, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };

  // ── AUTH ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("iboto-theme");
    if (saved) setDark(saved === "dark");
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);

    const adminData = localStorage.getItem("iboto-admin");
    if (!adminData) { router.push("/admin"); return; }
    setAdmin(JSON.parse(adminData));
  }, []);

  // ── LOAD DATA ON VIEW CHANGE ───────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || !admin) return;
    if (view === "dashboard") fetchStats();
    if (view === "elections") fetchElections();
    if (view === "candidates") fetchElections(); // need elections for dropdown
    if (view === "students") fetchStudents();
  }, [view, mounted, admin]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("iboto-theme", next ? "dark" : "light");
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("iboto-admin-refresh-token");
    if (refreshToken) {
      await api.post("/auth/admin/logout", { refreshToken }).catch(() => {});
    }
    localStorage.removeItem("iboto-admin-token");
    localStorage.removeItem("iboto-admin-refresh-token");
    localStorage.removeItem("iboto-admin");
    router.push("/admin");
  };

  // ── FETCH FUNCTIONS ────────────────────────────────────────────────────────
  const fetchStats = async () => {
    setLoadingMain(true);
    const data = await api.get("/dashboard/stats");
    if (data?.success) setStats(data.data);
    setLoadingMain(false);
  };

  const fetchElections = async () => {
    setLoadingMain(true);
    const data = await api.get("/elections");
    if (data?.success) setElections(data.data);
    setLoadingMain(false);
  };

  const fetchCandidates = async (electionId) => {
    setLoadingMain(true);
    const data = await api.get(`/elections/${electionId}/candidates`);
    if (data?.success) setCandidates(data.data);
    setLoadingMain(false);
  };

  const fetchStudents = async () => {
    setLoadingMain(true);
    const data = await api.get("/students");
    if (data?.success) setStudents(data.data);
    setLoadingMain(false);
  };

  const fetchResults = async (electionId) => {
    setLoadingMain(true);
    const data = await api.get(`/elections/${electionId}/results`);
    if (data?.success) setResults(data.data);
    setLoadingMain(false);
  };

  // ── ELECTION ACTIONS ───────────────────────────────────────────────────────
  const handleSaveElection = async () => {
    if (!elecForm.name.trim()) { toast("Election name is required", "error"); return; }

    const payload = {
      name:        elecForm.name.trim(),
      description: elecForm.description.trim(),
      startTime:   elecForm.startTime || undefined,
      endTime:     elecForm.endTime   || undefined,
      positions:   elecForm.positions ? elecForm.positions.split(",").map(s => s.trim()).filter(Boolean) : undefined,
    };

    const data = editElection
      ? await api.put(`/elections/${editElection.id}`, payload)
      : await api.post("/elections", payload);

    if (data?.success) {
      toast(editElection ? "Election updated!" : "Election created!");
      setElectionModal(false);
      setEditElection(null);
      setElecForm({ name: "", description: "", startTime: "", endTime: "", positions: "" });
      fetchElections();
    } else {
      toast(data?.message || "Something went wrong", "error");
    }
  };

  const handleToggleElection = async (election) => {
    const data = await api.patch(`/elections/${election.id}/toggle`);
    if (data?.success) {
      toast(`Election ${election.isOpen ? "closed" : "opened"}!`);
      fetchElections();
      if (view === "dashboard") fetchStats();
    } else {
      toast(data?.message || "Failed to toggle", "error");
    }
  };

  const handleDeleteElection = async (id) => {
    const data = await api.del(`/elections/${id}`);
    if (data?.success) {
      toast("Election deleted!");
      fetchElections();
      if (view === "dashboard") fetchStats();
    } else {
      toast(data?.message || "Failed to delete", "error");
    }
    setConfirm(null);
  };

  // ── CANDIDATE ACTIONS ──────────────────────────────────────────────────────
  const handleSaveCandidate = async () => {
    if (!candForm.name.trim())     { toast("Name is required", "error"); return; }
    if (!candForm.position.trim()) { toast("Position is required", "error"); return; }
    if (!candForm.electionId)      { toast("Select an election", "error"); return; }

    const data = await api.post(`/elections/${candForm.electionId}/candidates`, {
      name:      candForm.name.trim(),
      position:  candForm.position.trim(),
      partylist: candForm.partylist.trim() || undefined,
      platform:  candForm.platform.trim()  || undefined,
    });

    if (data?.success) {
      toast("Candidate added!");
      setCandidateModal(false);
      setCandForm({ name: "", position: "", partylist: "", platform: "", electionId: "" });
      if (selectedElection) fetchCandidates(selectedElection);
    } else {
      toast(data?.message || "Failed to add candidate", "error");
    }
  };

  const handleDeleteCandidate = async (id) => {
    const data = await api.del(`/candidates/${id}`);
    if (data?.success) {
      toast("Candidate removed!");
      if (selectedElection) fetchCandidates(selectedElection);
    } else {
      toast(data?.message || "Failed to delete", "error");
    }
    setConfirm(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (!mounted || !admin) return null;
  const t = dark ? theme.dark : theme.light;

  const navItems = [
    { id: "dashboard",  label: "Dashboard",  icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { id: "elections",  label: "Elections",  icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
    { id: "candidates", label: "Candidates", icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
    { id: "students",   label: "Students",   icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
    { id: "results",    label: "Results",    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  ];

  // ── SIDEBAR ────────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "white", fontWeight: 800, fontSize: 15, fontFamily: "Playfair Display, serif" }}>i</span>
        </div>
        <div>
          <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 17, color: t.text }}>iboto</div>
          <div style={{ fontSize: 11, color: "#2D8C4E", fontWeight: 600 }}>Admin Panel</div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setView(item.id); setSidebarOpen(false); }} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
            borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "DM Sans, sans-serif",
            fontSize: 14, fontWeight: view === item.id ? 700 : 500, textAlign: "left", width: "100%",
            background: view === item.id ? "rgba(45,140,78,0.12)" : "transparent",
            color: view === item.id ? "#2D8C4E" : t.subtext,
            transition: "all 0.2s",
          }}>
            {item.icon}
            {item.label}
            {item.id === "elections" && elections.filter(e => e.isOpen).length > 0 && (
              <span style={{ marginLeft: "auto", fontSize: 11, background: "#2D8C4E", color: "white", padding: "2px 7px", borderRadius: 100, fontWeight: 700 }}>
                {elections.filter(e => e.isOpen).length} live
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Admin profile */}
      <div style={{ padding: "16px 12px", borderTop: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: t.bg }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{admin?.name?.[0] || "A"}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{admin?.name || "Admin"}</div>
            <div style={{ fontSize: 11, color: t.subtext }}>{admin?.role || "Administrator"}</div>
          </div>
          <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: t.subtext, padding: 4, flexShrink: 0 }} title="Logout">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </div>
    </div>
  );

  // ── VIEWS ──────────────────────────────────────────────────────────────────
  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${t.border}`,
    background: t.bg, color: t.text, fontSize: 14, fontFamily: "DM Sans, sans-serif",
    outline: "none", transition: "border-color 0.2s",
  };

  const btnPrimary = {
    background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", color: "white", border: "none",
    borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600,
    cursor: "pointer", fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: 8,
  };

  const btnDanger = {
    background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 8, padding: "7px 12px", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: 5,
  };

  const btnGhost = {
    background: t.bg, color: t.subtext, border: `1px solid ${t.border}`,
    borderRadius: 8, padding: "7px 12px", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: 5,
  };

  // ── DASHBOARD VIEW ─────────────────────────────────────────────────────────
  const DashboardView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 800, color: t.text, marginBottom: 4 }}>Overview</h2>
        <p style={{ fontSize: 14, color: t.subtext }}>Welcome back, {admin?.name}!</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        <StatCard label="Total Elections" value={stats?.totalElections}    icon="🗳️" color="#2D8C4E" t={t} />
        <StatCard label="Active Now"      value={stats?.activeElections}   icon="🔴" color="#EF4444" t={t} />
        <StatCard label="Total Students"  value={stats?.totalStudents}     icon="🎓" color="#3B82F6" t={t} />
        <StatCard label="Votes Cast"      value={stats?.totalVotes}        icon="✅" color="#8B5CF6" t={t} />
        <StatCard label="Candidates"      value={stats?.totalCandidates}   icon="👤" color="#F59E0B" t={t} />
        <StatCard label="Voter Turnout"   value={stats?.voterTurnout ? `${stats.voterTurnout}%` : null} icon="📊" color="#EC4899" t={t} />
      </div>

      {/* Recent elections */}
      <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Recent Elections</h3>
          <button style={btnGhost} onClick={() => setView("elections")}>View all</button>
        </div>
        {elections.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: t.subtext, fontSize: 14 }}>No elections yet</div>
        ) : elections.slice(0, 5).map(e => (
          <div key={e.id} style={{ padding: "14px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{e.name}</div>
              <div style={{ fontSize: 12, color: t.subtext, marginTop: 2 }}>{e.candidates?.length || 0} candidates</div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100,
              background: e.isOpen ? "rgba(45,140,78,0.12)" : `${t.border}`,
              color: e.isOpen ? "#2D8C4E" : t.subtext,
              border: `1px solid ${e.isOpen ? "rgba(45,140,78,0.3)" : t.border}`,
            }}>
              {e.isOpen ? "● Live" : "Closed"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── ELECTIONS VIEW ─────────────────────────────────────────────────────────
  const ElectionsView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 800, color: t.text }}>Elections</h2>
          <p style={{ fontSize: 13, color: t.subtext, marginTop: 2 }}>{elections.length} total · {elections.filter(e => e.isOpen).length} active</p>
        </div>
        <button style={btnPrimary} onClick={() => { setEditElection(null); setElecForm({ name: "", description: "", startTime: "", endTime: "", positions: "" }); setElectionModal(true); }}>
          <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          New Election
        </button>
      </div>

      {elections.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: t.card, borderRadius: 16, border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗳️</div>
          <p style={{ color: t.subtext, fontSize: 14 }}>No elections yet. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {elections.map(e => (
            <div key={e.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{e.name}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100,
                      background: e.isOpen ? "rgba(45,140,78,0.12)" : `${t.border}`,
                      color: e.isOpen ? "#2D8C4E" : t.subtext,
                      border: `1px solid ${e.isOpen ? "rgba(45,140,78,0.3)" : t.border}`,
                    }}>
                      {e.isOpen ? "● Live" : "Closed"}
                    </span>
                  </div>
                  {e.description && <p style={{ fontSize: 13, color: t.subtext, marginTop: 6, lineHeight: 1.5 }}>{e.description}</p>}
                  <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: t.subtext, display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      {e.candidates?.length || 0} candidates
                    </span>
                    {e.startTime && (
                      <span style={{ fontSize: 12, color: t.subtext, display: "flex", alignItems: "center", gap: 4 }}>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        {new Date(e.startTime).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: t.subtext, display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/></svg>
                      {e.totalVotes || 0} votes
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button style={{ ...btnGhost, color: e.isOpen ? "#F59E0B" : "#2D8C4E", borderColor: e.isOpen ? "rgba(245,158,11,0.3)" : "rgba(45,140,78,0.3)", background: e.isOpen ? "rgba(245,158,11,0.08)" : "rgba(45,140,78,0.08)" }}
                    onClick={() => handleToggleElection(e)}>
                    {e.isOpen ? "Close" : "Open"}
                  </button>
                  <button style={btnGhost} onClick={() => {
                    setEditElection(e);
                    setElecForm({
                      name: e.name, description: e.description || "",
                      startTime: e.startTime ? e.startTime.slice(0, 16) : "",
                      endTime: e.endTime ? e.endTime.slice(0, 16) : "",
                      positions: e.positions?.join(", ") || "",
                    });
                    setElectionModal(true);
                  }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
                  <button style={{ ...btnGhost, color: "#EF4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}
                    onClick={() => setConfirm({ message: `Delete "${e.name}"? This cannot be undone.`, onConfirm: () => handleDeleteElection(e.id) })}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── CANDIDATES VIEW ────────────────────────────────────────────────────────
  const CandidatesView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 800, color: t.text }}>Candidates</h2>
          <p style={{ fontSize: 13, color: t.subtext, marginTop: 2 }}>Select an election to manage its candidates</p>
        </div>
        <button style={btnPrimary} onClick={() => { setCandForm({ name: "", position: "", partylist: "", platform: "", electionId: selectedElection || "" }); setCandidateModal(true); }}>
          <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Add Candidate
        </button>
      </div>

      {/* Election picker */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {elections.map(e => (
          <button key={e.id} onClick={() => { setSelectedElection(e.id); fetchCandidates(e.id); }} style={{
            padding: "8px 16px", borderRadius: 100, border: `1.5px solid ${selectedElection === e.id ? "#2D8C4E" : t.border}`,
            background: selectedElection === e.id ? "rgba(45,140,78,0.12)" : "transparent",
            color: selectedElection === e.id ? "#2D8C4E" : t.subtext,
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
          }}>
            {e.name}
          </button>
        ))}
      </div>

      {!selectedElection ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: t.card, borderRadius: 16, border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👆</div>
          <p style={{ color: t.subtext, fontSize: 14 }}>Select an election above to view candidates</p>
        </div>
      ) : candidates.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: t.card, borderRadius: 16, border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
          <p style={{ color: t.subtext, fontSize: 14 }}>No candidates in this election yet</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {candidates.map(c => (
            <div key={c.id} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: "18px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>{c.name?.[0]}</span>
                </div>
                <button style={btnDanger} onClick={() => setConfirm({ message: `Remove "${c.name}" from the election?`, onConfirm: () => handleDeleteCandidate(c.id) })}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  Remove
                </button>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>{c.name}</div>
              <div style={{ fontSize: 13, color: "#2D8C4E", fontWeight: 600, marginBottom: 4 }}>{c.position}</div>
              {c.partylist && <div style={{ fontSize: 12, color: t.subtext }}>{c.partylist}</div>}
              {c.platform && <div style={{ fontSize: 12, color: t.subtext, marginTop: 8, lineHeight: 1.5 }}>{c.platform}</div>}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.border}`, fontSize: 12, color: t.subtext }}>
                {c.votes || 0} votes received
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── STUDENTS VIEW ──────────────────────────────────────────────────────────
  const StudentsView = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 800, color: t.text }}>Students</h2>
        <p style={{ fontSize: 13, color: t.subtext, marginTop: 2 }}>{students.length} registered students</p>
      </div>

      <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.border}`, display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr 0.8fr", gap: 12 }}>
          {["Student ID", "Name", "Email", "Status", "Voted"].map(h => (
            <div key={h} style={{ fontSize: 12, fontWeight: 700, color: t.subtext, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
          ))}
        </div>

        {students.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: t.subtext, fontSize: 14 }}>No students registered</div>
        ) : students.map((s, i) => (
          <div key={s.id || i} style={{ padding: "14px 20px", borderBottom: `1px solid ${t.border}`, display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr 0.8fr", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: t.text, fontFamily: "monospace" }}>{s.studentId}</span>
            <span style={{ fontSize: 13, color: t.text }}>{s.name || "—"}</span>
            <span style={{ fontSize: 13, color: t.subtext, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.email}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, width: "fit-content",
              background: s.isActive !== false ? "rgba(45,140,78,0.12)" : "rgba(239,68,68,0.1)",
              color: s.isActive !== false ? "#2D8C4E" : "#EF4444",
              border: `1px solid ${s.isActive !== false ? "rgba(45,140,78,0.3)" : "rgba(239,68,68,0.3)"}`,
            }}>
              {s.isActive !== false ? "Active" : "Inactive"}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, width: "fit-content",
              background: s.hasVoted ? "rgba(59,130,246,0.1)" : t.bg,
              color: s.hasVoted ? "#3B82F6" : t.subtext,
              border: `1px solid ${s.hasVoted ? "rgba(59,130,246,0.3)" : t.border}`,
            }}>
              {s.hasVoted ? "Yes" : "No"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── RESULTS VIEW ───────────────────────────────────────────────────────────
  const ResultsView = () => {
    const maxVotes = results?.candidates ? Math.max(...results.candidates.map(c => c.votes || 0), 1) : 1;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 800, color: t.text }}>Results</h2>
          <p style={{ fontSize: 13, color: t.subtext, marginTop: 2 }}>View vote counts per election</p>
        </div>

        {/* Election picker */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {elections.length === 0 && <p style={{ fontSize: 14, color: t.subtext }}>No elections available</p>}
          {elections.map(e => (
            <button key={e.id} onClick={() => { setSelectedElection(e.id); fetchResults(e.id); }} style={{
              padding: "8px 16px", borderRadius: 100, border: `1.5px solid ${selectedElection === e.id ? "#2D8C4E" : t.border}`,
              background: selectedElection === e.id ? "rgba(45,140,78,0.12)" : "transparent",
              color: selectedElection === e.id ? "#2D8C4E" : t.subtext,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
            }}>
              {e.name}
            </button>
          ))}
        </div>

        {!selectedElection ? (
          <div style={{ textAlign: "center", padding: "60px 24px", background: t.card, borderRadius: 16, border: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
            <p style={{ color: t.subtext, fontSize: 14 }}>Select an election to view its results</p>
          </div>
        ) : !results ? (
          <div style={{ textAlign: "center", padding: "60px 24px", background: t.card, borderRadius: 16, border: `1px solid ${t.border}` }}>
            <p style={{ color: t.subtext, fontSize: 14 }}>Loading results...</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
              <StatCard label="Total Votes"    value={results.totalVotes}    icon="✅" color="#2D8C4E"  t={t} />
              <StatCard label="Voter Turnout"  value={results.voterTurnout ? `${results.voterTurnout}%` : "—"} icon="📊" color="#3B82F6"  t={t} />
              <StatCard label="Candidates"     value={results.candidates?.length} icon="👤" color="#F59E0B" t={t} />
            </div>

            {/* Group by position */}
            {Object.entries(
              (results.candidates || []).reduce((acc, c) => {
                const pos = c.position || "General";
                if (!acc[pos]) acc[pos] = [];
                acc[pos].push(c);
                return acc;
              }, {})
            ).sort().map(([position, cands]) => (
              <div key={position} style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{position}</span>
                  <span style={{ fontSize: 12, color: t.subtext }}>{cands.length} candidate{cands.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                  {[...cands].sort((a, b) => (b.votes || 0) - (a.votes || 0)).map((c, i) => (
                    <div key={c.id}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {i === 0 && <span style={{ fontSize: 16 }}>🥇</span>}
                          {i === 1 && <span style={{ fontSize: 16 }}>🥈</span>}
                          {i === 2 && <span style={{ fontSize: 16 }}>🥉</span>}
                          {i >= 3  && <span style={{ width: 24, textAlign: "center", fontSize: 13, color: t.subtext, fontWeight: 600 }}>#{i+1}</span>}
                          <span style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{c.name}</span>
                          {c.partylist && <span style={{ fontSize: 12, color: t.subtext }}>· {c.partylist}</span>}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#2D8C4E" }}>{c.votes || 0} votes</span>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 8, borderRadius: 100, background: t.border, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 100,
                          background: i === 0 ? "linear-gradient(90deg, #1B4D2E, #2D8C4E)" : `${t.subtext}60`,
                          width: `${((c.votes || 0) / maxVotes) * 100}%`,
                          transition: "width 0.5s ease",
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: t.subtext, marginTop: 3 }}>
                        {results.totalVotes > 0 ? `${(((c.votes || 0) / results.totalVotes) * 100).toFixed(1)}%` : "0%"} of total votes
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const viewMap = {
    dashboard:  <DashboardView  />,
    elections:  <ElectionsView  />,
    candidates: <CandidatesView />,
    students:   <StudentsView   />,
    results:    <ResultsView    />,
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        button { transition: all 0.2s ease; }
        button:hover { opacity: 0.85; }
        input, textarea, select {
          width: 100%; padding: 12px 14px; border-radius: 10px;
          border: 1.5px solid ${t.border}; background: ${t.bg};
          color: ${t.text}; font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color 0.2s;
        }
        input:focus, textarea:focus, select:focus { border-color: #2D8C4E; box-shadow: 0 0 0 3px rgba(45,140,78,0.1); }
        textarea { resize: vertical; min-height: 80px; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 3px; }
      `}</style>

      {/* DESKTOP SIDEBAR */}
      <aside style={{ width: 230, flexShrink: 0, background: t.card, borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <SidebarContent />
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex" }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} onClick={() => setSidebarOpen(false)} />
          <div style={{ width: 240, background: t.card, borderLeft: `1px solid ${t.border}`, display: "flex", flexDirection: "column" }}>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ padding: "14px 24px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: t.bg, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setSidebarOpen(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", color: t.subtext, padding: 4, display: "flex" }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: t.text, textTransform: "capitalize" }}>{view}</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={toggleTheme} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", color: t.subtext }}>
              {dark
                ? <svg width="18" height="18" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                : <svg width="18" height="18" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              }
            </button>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{admin?.name?.[0] || "A"}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "28px 28px 48px", overflowY: "auto", maxWidth: 1100 }} className="fade-up">
          {loadingMain ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 80, borderRadius: 14, background: t.card, border: `1px solid ${t.border}`, animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : viewMap[view]}
        </div>
      </div>

      {/* ── ELECTION MODAL ──────────────────────────────────────────────────── */}
      <Modal open={electionModal} onClose={() => { setElectionModal(false); setEditElection(null); }} title={editElection ? "Edit Election" : "New Election"} t={t}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Field label="Election Name *">
            <input placeholder="e.g. SSG General Election 2025" value={elecForm.name} onChange={e => setElecForm(p => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="Description">
            <textarea placeholder="Brief description (optional)" value={elecForm.description} onChange={e => setElecForm(p => ({ ...p, description: e.target.value }))} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Start Date & Time">
              <input type="datetime-local" value={elecForm.startTime} onChange={e => setElecForm(p => ({ ...p, startTime: e.target.value }))} />
            </Field>
            <Field label="End Date & Time">
              <input type="datetime-local" value={elecForm.endTime} onChange={e => setElecForm(p => ({ ...p, endTime: e.target.value }))} />
            </Field>
          </div>
          <Field label="Positions (comma-separated)">
            <input placeholder="e.g. President, VP, Secretary" value={elecForm.positions} onChange={e => setElecForm(p => ({ ...p, positions: e.target.value }))} />
          </Field>
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button onClick={() => { setElectionModal(false); setEditElection(null); }} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", color: t.subtext, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: 14 }}>Cancel</button>
            <button onClick={handleSaveElection} style={{ ...btnPrimary, flex: 1, justifyContent: "center" }}>
              {editElection ? "Save Changes" : "Create Election"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── CANDIDATE MODAL ─────────────────────────────────────────────────── */}
      <Modal open={candidateModal} onClose={() => setCandidateModal(false)} title="Add Candidate" t={t}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Field label="Election *">
            <select value={candForm.electionId} onChange={e => setCandForm(p => ({ ...p, electionId: e.target.value }))}>
              <option value="">Select an election</option>
              {elections.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </Field>
          <Field label="Candidate Name *">
            <input placeholder="Full name" value={candForm.name} onChange={e => setCandForm(p => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="Position *">
            <input placeholder="e.g. President" value={candForm.position} onChange={e => setCandForm(p => ({ ...p, position: e.target.value }))} />
          </Field>
          <Field label="Partylist">
            <input placeholder="e.g. Alyansang Pagbabago (optional)" value={candForm.partylist} onChange={e => setCandForm(p => ({ ...p, partylist: e.target.value }))} />
          </Field>
          <Field label="Platform / Advocacy">
            <textarea placeholder="Brief platform statement (optional)" value={candForm.platform} onChange={e => setCandForm(p => ({ ...p, platform: e.target.value }))} />
          </Field>
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button onClick={() => setCandidateModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${t.border}`, background: "none", color: t.subtext, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontWeight: 600, fontSize: 14 }}>Cancel</button>
            <button onClick={handleSaveCandidate} style={{ ...btnPrimary, flex: 1, justifyContent: "center" }}>Add Candidate</button>
          </div>
        </div>
      </Modal>

      {/* ── CONFIRM ─────────────────────────────────────────────────────────── */}
      <Confirm open={!!confirm} message={confirm?.message} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} t={t} />

      {/* ── TOASTS ──────────────────────────────────────────────────────────── */}
      <Toast toasts={toasts} />
    </div>
  );
}

const theme = {
  light: { bg: "#F8FAFC", card: "#FFFFFF", text: "#0D0D0D", subtext: "#6B7280", border: "#E5E7EB" },
  dark:  { bg: "#0D1117", card: "#161B22", text: "#E6EDF3", subtext: "#8B949E", border: "#30363D" },
};