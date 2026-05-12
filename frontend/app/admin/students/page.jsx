"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminStudentsPage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [search, setSearch] = useState("");
  const [showAddEnrolled, setShowAddEnrolled] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ studentId: "", name: "", course: "", year: "" });
  const [bulkText, setBulkText] = useState("");
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
    fetchStudents();
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("iboto-theme", next ? "dark" : "light");
  };

  const getToken = () => localStorage.getItem("iboto-admin-token");

  const fetchStudents = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/students", {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) setStudents(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEnrolled = async () => {
    const { studentId, name, course, year } = enrollForm;
    if (!studentId || !name || !course || !year) { setFormError("All fields required"); return; }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await fetch("http://localhost:5000/api/admin/enrolled-students", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(enrollForm)
      });
      const data = await res.json();
      if (!data.success) { setFormError(data.message); return; }
      setFormSuccess("Student added to enrolled list!");
      setEnrollForm({ studentId: "", name: "", course: "", year: "" });
      setTimeout(() => { setShowAddEnrolled(false); setFormSuccess(""); }, 1500);
    } catch { setFormError("Server error. Try again."); }
    finally { setFormLoading(false); }
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) { setFormError("Paste student data first"); return; }
    setFormLoading(true);
    setFormError("");
    try {
      const lines = bulkText.trim().split("\n");
      const students = lines.map(line => {
        const [studentId, name, course, year] = line.split(",").map(s => s.trim());
        return { studentId, name, course, year };
      }).filter(s => s.studentId && s.name);

      const res = await fetch("http://localhost:5000/api/admin/enrolled-students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ students })
      });
      const data = await res.json();
      if (!data.success) { setFormError(data.message); return; }
      setFormSuccess(`${data.data.count} students added!`);
      setBulkText("");
      setTimeout(() => { setShowBulkAdd(false); setFormSuccess(""); }, 1500);
    } catch { setFormError("Server error. Try again."); }
    finally { setFormLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("iboto-admin-token");
    localStorage.removeItem("iboto-admin");
    router.push("/admin/login");
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase())
  );

  if (!mounted) return null;
  const t = dark ? theme.dark : theme.light;

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", display: "flex", transition: "all 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .sidebar-link { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; background: none; color: ${t.subtext}; font-family: 'DM Sans', sans-serif; width: 100%; transition: all 0.2s; text-align: left; }
        .sidebar-link:hover { background: rgba(45,140,78,0.08); color: #2D8C4E; }
        .sidebar-link.active { background: rgba(45,140,78,0.12); color: #2D8C4E; font-weight: 600; }
        .btn-primary { background: linear-gradient(135deg, #1B4D2E, #2D8C4E); color: white; border: none; border-radius: 10px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; box-shadow: 0 4px 12px rgba(45,140,78,0.3); display: flex; align-items: center; gap: 6px; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-ghost { background: transparent; color: ${t.subtext}; border: 1px solid ${t.border}; border-radius: 8px; padding: 9px 16px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .btn-ghost:hover { border-color: #2D8C4E; color: #2D8C4E; }
        .input-field { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1.5px solid ${t.border}; background: ${t.bg}; color: ${t.text}; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s; }
        .input-field:focus { border-color: #2D8C4E; box-shadow: 0 0 0 3px rgba(45,140,78,0.12); }
        .input-field::placeholder { color: ${t.subtext}; opacity: 0.7; }
        .search-field { width: 100%; padding: 10px 14px 10px 38px; border-radius: 10px; border: 1.5px solid ${t.border}; background: ${t.card}; color: ${t.text}; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s; }
        .search-field:focus { border-color: #2D8C4E; }
        .search-field::placeholder { color: ${t.subtext}; opacity: 0.7; }
        .table-row { display: grid; grid-template-columns: 1fr 1.5fr 1fr 1fr 1fr; align-items: center; padding: 14px 20px; border-bottom: 1px solid ${t.border}; transition: background 0.2s; }
        .table-row:hover { background: rgba(45,140,78,0.03); }
        .table-header { display: grid; grid-template-columns: 1fr 1.5fr 1fr 1fr 1fr; padding: 12px 20px; border-bottom: 2px solid ${t.border}; font-size: 12px; font-weight: 700; color: ${t.subtext}; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge-enrolled { display: inline-flex; align-items: center; background: rgba(45,140,78,0.12); border: 1px solid rgba(45,140,78,0.3); color: #2D8C4E; padding: 3px 10px; border-radius: 100px; font-size: 12px; font-weight: 600; }
        .badge-pending { display: inline-flex; align-items: center; background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.3); color: #F59E0B; padding: 3px 10px; border-radius: 100px; font-size: 12px; font-weight: 600; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 24px; }
        .modal { background: ${t.card}; border-radius: 16px; padding: 28px; width: 100%; max-width: 480px; border: 1px solid ${t.border}; }
        .toggle-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .toggle-btn:hover { background: rgba(45,140,78,0.1); }
        .error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #EF4444; padding: 10px 14px; border-radius: 8px; font-size: 13px; }
        .success-box { background: rgba(45,140,78,0.1); border: 1px solid rgba(45,140,78,0.3); color: #2D8C4E; padding: 10px 14px; border-radius: 8px; font-size: 13px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
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
          <button className="sidebar-link active">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Students
          </button>
          <button className="sidebar-link" onClick={() => router.push("/admin/results")}>
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
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>Students</h1>
            <p style={{ fontSize: 14, color: t.subtext, marginTop: 4 }}>Registered student accounts</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-ghost" onClick={() => { setShowBulkAdd(true); setFormError(""); setFormSuccess(""); }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              Bulk Add to Registrar
            </button>
            <button className="btn-primary" onClick={() => { setShowAddEnrolled(true); setFormError(""); setFormSuccess(""); }}>
              <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add to Registrar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Registered", value: students.length },
            { label: "Enrolled", value: students.filter(s => s.isEnrolled).length },
            { label: "Pending", value: students.filter(s => !s.isEnrolled).length },
          ].map((s, i) => (
            <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 32, fontWeight: 800, color: t.text, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: t.subtext }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 20, maxWidth: 320 }}>
          <svg width="16" height="16" fill="none" stroke={t.subtext} strokeWidth="2" viewBox="0 0 24 24" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="search-field" placeholder="Search by name or student ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Table */}
        <div style={{ background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, overflow: "hidden" }}>
          <div className="table-header">
            <span>Student ID</span>
            <span>Name</span>
            <span>Email</span>
            <span>Status</span>
            <span>Joined</span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: t.subtext }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
              <p style={{ fontSize: 15, color: t.subtext }}>{search ? "No students found." : "No registered students yet."}</p>
            </div>
          ) : (
            filtered.map(student => (
              <div key={student.id} className="table-row">
                <div style={{ fontSize: 13, fontFamily: "monospace", color: t.text, fontWeight: 600 }}>{student.studentId}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{student.name.charAt(0)}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{student.name}</span>
                </div>
                <div style={{ fontSize: 13, color: t.subtext }}>{student.email || "—"}</div>
                <div>
                  {student.isEnrolled
                    ? <span className="badge-enrolled">Enrolled</span>
                    : <span className="badge-pending">Pending</span>
                  }
                </div>
                <div style={{ fontSize: 13, color: t.subtext }}>
                  {new Date(student.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD TO ENROLLLIST MODAL */}
      {showAddEnrolled && (
        <div className="modal-overlay" onClick={() => !formLoading && setShowAddEnrolled(false)}>
          <div className="modal fade-up" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 800, color: t.text, marginBottom: 6 }}>Add to Registrar List</h2>
            <p style={{ fontSize: 14, color: t.subtext, marginBottom: 24 }}>Add a student to the enrolled list so they can register an account.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="input-field" placeholder="Student ID (e.g. 2021-12345)" value={enrollForm.studentId} onChange={e => setEnrollForm(p => ({ ...p, studentId: e.target.value }))} />
              <input className="input-field" placeholder="Full Name" value={enrollForm.name} onChange={e => setEnrollForm(p => ({ ...p, name: e.target.value }))} />
              <input className="input-field" placeholder="Course (e.g. BSIT)" value={enrollForm.course} onChange={e => setEnrollForm(p => ({ ...p, course: e.target.value }))} />
              <input className="input-field" placeholder="Year (e.g. 3)" value={enrollForm.year} onChange={e => setEnrollForm(p => ({ ...p, year: e.target.value }))} />
              {formError && <div className="error-box">{formError}</div>}
              {formSuccess && <div className="success-box">{formSuccess}</div>}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button className="btn-primary" onClick={handleAddEnrolled} disabled={formLoading} style={{ flex: 1 }}>
                  {formLoading ? "Adding..." : "Add Student"}
                </button>
                <button className="btn-ghost" onClick={() => setShowAddEnrolled(false)} disabled={formLoading}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BULK ADD MODAL */}
      {showBulkAdd && (
        <div className="modal-overlay" onClick={() => !formLoading && setShowBulkAdd(false)}>
          <div className="modal fade-up" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 800, color: t.text, marginBottom: 6 }}>Bulk Add Students</h2>
            <p style={{ fontSize: 14, color: t.subtext, marginBottom: 8 }}>Paste student data — one per line.</p>
            <div style={{ background: "rgba(45,140,78,0.06)", border: "1px solid rgba(45,140,78,0.2)", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: t.subtext, fontFamily: "monospace" }}>
              Format: studentId, Full Name, Course, Year<br />
              Example: 2021-00001, Juan dela Cruz, BSIT, 3
            </div>
            <textarea
              className="input-field"
              style={{ height: 160, resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
              placeholder={"2021-00001, Juan dela Cruz, BSIT, 3\n2021-00002, Maria Santos, BSCS, 2"}
              value={bulkText}
              onChange={e => setBulkText(e.target.value)}
            />
            {formError && <div className="error-box" style={{ marginTop: 10 }}>{formError}</div>}
            {formSuccess && <div className="success-box" style={{ marginTop: 10 }}>{formSuccess}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="btn-primary" onClick={handleBulkAdd} disabled={formLoading} style={{ flex: 1 }}>
                {formLoading ? "Adding..." : "Bulk Add"}
              </button>
              <button className="btn-ghost" onClick={() => setShowBulkAdd(false)} disabled={formLoading}>Cancel</button>
            </div>
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