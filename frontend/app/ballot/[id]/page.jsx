"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/utils/api";

const POSITIONS = [
  "President","Vice President","Secretary","Assistant Secretary",
  "Treasurer","Auditor","Business Manager",
  "Public Information Officer (P.I.O.)",
  "4th Year Senator","3rd Year Senator","2nd Year Senator",
];

const theme = {
  light: { bg: "#FAFAF7", card: "#F2F0EA", text: "#111211", subtext: "#6B7070", border: "#E2DFD6", pill: "rgba(0,0,0,0.04)" },
  dark:  { bg: "#0D1110", card: "#141A17", text: "#E8EDE9", subtext: "#7A8C80", border: "#222E27", pill: "rgba(255,255,255,0.05)" },
};

function AuthGate({ student, dark, t, onSuccess, onExit }) {
  const useFace = student?.faceEnrolled;
  console.log("STUDENT DATA:", student);
  console.log("USE FACE:", useFace);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [faceSuccess, setFaceSuccess] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!useFace) return;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraReady(true);
      })
      .catch(() => setError("Camera access denied. Use password instead."));
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, [useFace]);

  const captureAndVerify = async () => {
    if (!videoRef.current || scanning) return;
    setScanning(true); setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL("image/jpeg").split(",")[1];
      const token = localStorage.getItem("iboto-access-token");
      const res = await fetch("http://localhost:5000/api/face/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || "Face not recognized. Try again."); setScanning(false); return; }
      setFaceSuccess(true);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setTimeout(onSuccess, 800);
    } catch { setError("Verification failed. Try again."); setScanning(false); }
  };

  const verifyPassword = async () => {
    if (!password.trim()) { setError("Enter your password"); return; }
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("iboto-access-token");
      const res = await fetch("http://localhost:5000/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || "Incorrect password"); return; }
      onSuccess();
    } catch { setError("Server error. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Lora:wght@600;700&display=swap');`}</style>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* ← X button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button onClick={onExit} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 10, padding: "7px 10px", cursor: "pointer", color: t.subtext, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 20, fontFamily: "Lora, serif", fontStyle: "italic" }}>i</span>
          </div>
          <span style={{ fontFamily: "Lora, serif", fontWeight: 700, fontSize: 22, color: t.text }}>iboto</span>
        </div>

        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 24, padding: "32px 28px" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(45,140,78,0.1)", border: "1px solid rgba(45,140,78,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="26" height="26" fill="none" stroke={dark ? "#5cc97f" : "#1B6B3A"} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h2 style={{ fontFamily: "Lora, serif", fontSize: 22, fontWeight: 700, color: t.text, textAlign: "center", marginBottom: 8 }}>Verify your identity</h2>
          <p style={{ fontSize: 13, color: t.subtext, textAlign: "center", lineHeight: 1.6, marginBottom: 28 }}>
            {useFace ? "Look at the camera to verify your face before voting." : "Enter your password to confirm your identity before voting."}
          </p>

          {useFace && (
            <div>
              <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#000", aspectRatio: "4/3", marginBottom: 16 }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                {!faceSuccess && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{ width: 140, height: 140, borderRadius: "50%", border: `2px solid ${scanning ? "#5cc97f" : "rgba(255,255,255,0.4)"}`, boxShadow: scanning ? "0 0 0 4px rgba(92,201,127,0.2)" : "none", transition: "all 0.3s" }} />
                  </div>
                )}
                {faceSuccess && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(27,77,46,0.85)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                    <svg width="48" height="48" fill="none" stroke="#5cc97f" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                    <span style={{ color: "#5cc97f", fontWeight: 600, fontSize: 15 }}>Identity confirmed!</span>
                  </div>
                )}
              </div>
              {!faceSuccess && (
                <button onClick={captureAndVerify} disabled={!cameraReady || scanning}
                  style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: scanning ? "rgba(45,140,78,0.5)" : "linear-gradient(135deg, #1B4D2E, #2D8C4E)", color: "white", fontSize: 15, fontWeight: 600, cursor: cameraReady && !scanning ? "pointer" : "not-allowed", fontFamily: "DM Sans, sans-serif" }}>
                  {!cameraReady ? "Starting camera..." : scanning ? "Scanning..." : "📸 Scan My Face"}
                </button>
              )}
            </div>
          )}

          {!useFace && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.subtext, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Password</div>
                <input type="password" placeholder="Enter your password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && verifyPassword()}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${t.border}`, background: t.bg, color: t.text, fontSize: 14, fontFamily: "DM Sans, sans-serif", outline: "none" }} />
              </div>
              <button onClick={verifyPassword} disabled={loading}
                style={{ width: "100%", padding: "14px", borderRadius: 14, border: "none", background: loading ? "rgba(45,140,78,0.5)" : "linear-gradient(135deg, #1B4D2E, #2D8C4E)", color: "white", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "DM Sans, sans-serif" }}>
                {loading ? "Verifying..." : "Confirm Identity →"}
              </button>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 14, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#EF4444", textAlign: "center" }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BALLOT PAGE ──────────────────────────────────────────────
export default function BallotPage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [student, setStudent] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

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
    setStudent(JSON.parse(studentData));
    }, []);

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
    const statusRes = await apiFetch(`/api/vote/status/${electionId}`);
    if (!statusRes) return; // ← expired
    const statusData = await statusRes.json();
    if (statusData.data?.hasVoted) { setAlreadyVoted(true); return; }

    const res = await apiFetch(`/api/elections/${electionId}`);
    if (!res) return; // ← expired
    const data = await res.json();
    if (data.success) setElection(data.data);
  } catch (err) { console.error(err); }
  finally { setLoading(false); setChecking(false); }
};

const handleSubmit = async () => {
  setSubmitting(true); setSubmitError("");
  try {
    const candidateIds = Object.values(votes);
    const res = await apiFetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ electionId, candidateIds }),
    });
    if (!res) return; // ← expired
    const data = await res.json();
    if (!data.success) {
      if (data.message?.toLowerCase().includes("already voted")) { setAlreadyVoted(true); setShowConfirm(false); return; }
      throw new Error(data.message);
    }
    setSubmitted(true);
    setShowConfirm(false);
  } catch (err) {
    setSubmitError(err.message || "Failed to submit votes. Try again.");
  } finally { setSubmitting(false); }
};

  const handleVote = (position, candidateId) => {
    setVotes(prev => ({ ...prev, [position]: candidateId }));
  };

  // ── RENDER ORDER ──────────────────────────────────────────────
  // 1. Loading spinner (while checking vote status)
  if (!mounted || checking) return (
    <div style={{ minHeight: "100vh", background: "#0D1110", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 13, color: "#7A8C80", fontFamily: "DM Sans, sans-serif" }}>Loading...</div>
    </div>
  );

  const t = dark ? theme.dark : theme.light;

  // 2. Already voted
  if (alreadyVoted) return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "DM Sans, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lora:wght@600;700&display=swap');`}</style>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🗳️</div>
        <h2 style={{ fontFamily: "Lora, serif", fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 12 }}>Already Voted</h2>
        <p style={{ fontSize: 14, color: t.subtext, lineHeight: 1.7, marginBottom: 24 }}>You have already cast your vote in this election.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => router.push(`/elections/${electionId}/results`)}
            style={{ padding: "12px 28px", borderRadius: 12, border: `1px solid ${t.border}`, background: "none", color: dark ? "#5cc97f" : "#1B6B3A", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            📊 View Results
          </button>
          <button onClick={() => router.push("/elections")}
            style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            Back to Elections
          </button>
        </div>
      </div>
    </div>
  );

  // 3. Auth gate
  if (!authenticated) return (
    <AuthGate student={student} dark={dark} t={t} onSuccess={() => setAuthenticated(true)} onExit={() => router.back()} />
  );

  // 4. Success screen
  if (submitted) return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "DM Sans, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@600;700&display=swap');
        @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        .pop-in { animation: popIn 0.5s ease forwards; }
      `}</style>
      <div style={{ textAlign: "center", maxWidth: 320 }}>
        <div className="pop-in" style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(45,140,78,0.12)", border: "2px solid rgba(45,140,78,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <svg width="36" height="36" fill="none" stroke={dark ? "#5cc97f" : "#1B6B3A"} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <h2 style={{ fontFamily: "Lora, serif", fontSize: 26, fontWeight: 700, color: t.text, marginBottom: 12 }}>Vote Cast!</h2>
        <p style={{ fontSize: 14, color: t.subtext, lineHeight: 1.7, marginBottom: 8 }}>Your vote has been recorded on the blockchain.</p>
        <p style={{ fontSize: 12, color: t.subtext, marginBottom: 28 }}>Thank you for participating, {student?.name?.split(" ")[0]}.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => router.push(`/elections/${electionId}/results`)}
            style={{ padding: "12px 28px", borderRadius: 12, border: `1px solid ${t.border}`, background: "none", color: dark ? "#5cc97f" : "#1B6B3A", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            📊 View Results
          </button>
          <button onClick={() => router.push("/elections")}
            style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            Back to Elections
          </button>
        </div>
      </div>
    </div>
  );

  // 5. Ballot
  const candidates = election?.candidates || [];
  const grouped = POSITIONS.reduce((acc, pos) => {
    const group = candidates.filter(c => c.position === pos);
    if (group.length > 0) acc[pos] = group;
    return acc;
  }, {});
  const totalPositions = Object.keys(grouped).length;
  const votedPositions = Object.keys(votes).length;
  const progress = totalPositions > 0 ? (votedPositions / totalPositions) * 100 : 0;

  return (
    <div style={{ background: dark ? "#080B0A" : "#F7F5F0", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", display: "flex", justifyContent: "center" }}>
      <div style={{ background: t.bg, color: t.text, width: "100%", maxWidth: 430, minHeight: "100vh" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Lora:wght@600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          .candidate-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; border: 1.5px solid ${t.border}; background: ${t.card}; cursor: pointer; transition: all 0.18s ease; margin-bottom: 8px; }
          .candidate-row:hover { border-color: rgba(45,140,78,0.4); }
          .candidate-row.selected { border-color: ${dark ? "#5cc97f" : "#1B6B3A"}; background: ${dark ? "rgba(45,140,78,0.08)" : "rgba(27,77,46,0.05)"}; }
          .radio-dot { width: 20px; height: 20px; border-radius: 50%; border: 2px solid ${t.border}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.18s; }
          .candidate-row.selected .radio-dot { border-color: ${dark ? "#5cc97f" : "#1B6B3A"}; background: ${dark ? "#5cc97f" : "#1B6B3A"}; }
          .pos-section { margin-bottom: 28px; }
          .pos-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: ${dark ? "#5cc97f" : "#1B6B3A"}; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
          .pos-label::after { content: ''; flex: 1; height: 1px; background: ${t.border}; }
          .progress-bar { height: 4px; border-radius: 2px; background: ${t.border}; overflow: hidden; margin-bottom: 6px; }
          .progress-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #1B4D2E, #2D8C4E); transition: width 0.4s ease; }
          .submit-btn { width: 100%; padding: 16px; border-radius: 14px; border: none; background: linear-gradient(135deg, #1B4D2E, #2D8C4E); color: white; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; box-shadow: 0 4px 20px rgba(27,77,46,0.3); }
          .submit-btn:hover:not(:disabled) { transform: translateY(-1px); }
          .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 200; }
          .modal-sheet { background: ${t.card}; border-radius: 24px 24px 0 0; width: 100%; max-width: 430px; padding: 28px 24px 40px; border: 1px solid ${t.border}; border-bottom: none; animation: slideUp 0.3s ease; }
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
          .fade-up { animation: fadeUp 0.35s ease forwards; }
          ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 10px; }
        `}</style>

        {/* NAV */}
        <nav style={{ padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, background: t.bg, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => router.back()} style={{ background: "none", border: `1px solid ${t.border}`, borderRadius: 10, padding: "7px 10px", cursor: "pointer", color: t.subtext, display: "flex", alignItems: "center" }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span style={{ fontFamily: "Lora, serif", fontWeight: 700, fontSize: 18, color: t.text }}>Ballot</span>
          </div>
          <button onClick={toggleTheme} style={{ background: t.pill, border: `1px solid ${t.border}`, cursor: "pointer", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {dark
              ? <svg width="17" height="17" fill="none" stroke="#5cc97f" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              : <svg width="17" height="17" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </button>
        </nav>

        <div style={{ padding: "28px 22px 120px" }}>
          <div className="fade-up" style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "Lora, serif", fontSize: 22, fontWeight: 700, color: t.text, marginBottom: 6 }}>{election?.name}</h1>
            <p style={{ fontSize: 13, color: t.subtext, marginBottom: 16 }}>Select one candidate per position.</p>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: t.subtext }}>
              <span>{votedPositions} of {totalPositions} positions filled</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1,2,3].map(i => <div key={i} style={{ height: 80, borderRadius: 14, background: t.card, border: `1px solid ${t.border}` }} />)}
            </div>
          )}

          {!loading && Object.entries(grouped).map(([pos, cands]) => (
            <div key={pos} className="pos-section">
              <div className="pos-label">{pos}</div>
              {cands.map(c => {
                const isSelected = votes[pos] === c.id;
                return (
                  <div key={c.id} className={`candidate-row ${isSelected ? "selected" : ""}`} onClick={() => handleVote(pos, c.id)}>
                    <div className="radio-dot">
                      {isSelected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                    </div>
                    {c.photoUrl
                      ? <img src={c.photoUrl} alt={c.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${isSelected ? (dark ? "#5cc97f" : "#1B6B3A") : t.border}` }} />
                      : <div style={{ width: 44, height: 44, borderRadius: "50%", background: isSelected ? "linear-gradient(135deg, #1B4D2E, #2D8C4E)" : t.border, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 17, fontWeight: 700, color: isSelected ? "white" : t.subtext }}>
                          {c.name?.charAt(0)}
                        </div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: t.text, marginBottom: 2 }}>{c.name}</div>
                      {c.partylist && <div style={{ fontSize: 12, color: t.subtext }}>🏛 {c.partylist}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {!loading && (
            <div style={{ marginTop: 8 }}>
              {submitError && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#EF4444", marginBottom: 14, textAlign: "center" }}>
                  {submitError}
                </div>
              )}
              <button className="submit-btn" onClick={() => setShowConfirm(true)} disabled={votedPositions === 0}>
                {votedPositions === 0 ? "Select at least one candidate" : `Submit ${votedPositions} Vote${votedPositions > 1 ? "s" : ""} →`}
              </button>
              {votedPositions < totalPositions && (
                <p style={{ fontSize: 12, color: t.subtext, textAlign: "center", marginTop: 10 }}>
                  {totalPositions - votedPositions} position{totalPositions - votedPositions > 1 ? "s" : ""} left unfilled — you can still submit.
                </p>
              )}
            </div>
          )}
        </div>

        {showConfirm && (
          <div className="modal-overlay" onClick={() => !submitting && setShowConfirm(false)}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: t.border, margin: "0 auto 20px" }} />
              <h3 style={{ fontFamily: "Lora, serif", fontSize: 20, fontWeight: 700, color: t.text, marginBottom: 8 }}>Confirm your votes</h3>
              <p style={{ fontSize: 13, color: t.subtext, marginBottom: 20, lineHeight: 1.6 }}>
                You selected <strong style={{ color: t.text }}>{votedPositions}</strong> candidate{votedPositions > 1 ? "s" : ""}. This cannot be undone.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, maxHeight: 200, overflowY: "auto" }}>
                {Object.entries(votes).map(([pos, cid]) => {
                  const c = candidates.find(x => x.id === cid);
                  return c ? (
                    <div key={pos} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: dark ? "rgba(255,255,255,0.03)" : "#f9fafb", borderRadius: 10, border: `1px solid ${t.border}` }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0 }}>{c.name?.charAt(0)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: t.subtext }}>{pos}</div>
                      </div>
                      <svg width="14" height="14" fill="none" stroke={dark ? "#5cc97f" : "#1B6B3A"} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                    </div>
                  ) : null;
                })}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowConfirm(false)} disabled={submitting}
                  style={{ flex: 1, padding: "13px", borderRadius: 12, border: `1px solid ${t.border}`, background: "none", color: t.subtext, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
                  Review
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  style={{ flex: 2, padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", color: "white", fontSize: 14, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", fontFamily: "DM Sans, sans-serif", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Submitting..." : "Cast My Votes 🗳"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}