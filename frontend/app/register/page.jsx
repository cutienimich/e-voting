"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const otpRefs = useRef([]);
  const cooldownRef = useRef(null);
  const router = useRouter();

  const [form, setForm] = useState({
    studentId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("iboto-theme");
    if (saved) setDark(saved === "dark");
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    return () => clearInterval(cooldownRef.current);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("iboto-theme", next ? "dark" : "light");
  };

  const t = dark ? theme.dark : theme.light;

  const update = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setError("");
  };

  const startCooldown = (secs = 60) => {
    setResendCooldown(secs);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    setError("");
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((c, i) => { next[i] = c; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleValidateStudent = async () => {
    if (!form.studentId.trim()) { setError("Student ID is required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/validate-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: form.studentId.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      if (data.alreadyRegistered) { setError("This Student ID is already registered. Please login instead."); return; }
      setStudentInfo(data.student);
      setStep(2);
    } catch {
      setError("Cannot connect to server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!form.email.trim()) { setError("Gmail address is required"); return; }
    if (!/^[^\s@]+@gmail\.com$/.test(form.email.trim())) { setError("Must be a valid Gmail address (@gmail.com)"); return; }
    if (!form.password) { setError("Password is required"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: form.studentId.trim(), email: form.email.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setOtp(["", "", "", "", "", ""]);
      startCooldown(60);
      setStep(3);
    } catch {
      setError("Cannot connect to server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Enter the complete 6-digit code"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: form.studentId.trim(),
          email: form.email.trim(),
          password: form.password,
          otp: code,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setStep(4);
    } catch {
      setError("Cannot connect to server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: form.studentId.trim(), email: form.email.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); return; }
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      startCooldown(60);
    } catch {
      setError("Cannot connect to server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError("");
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else router.push("/");
  };

  if (!mounted) return null;

  const stepLabels = ["Verify Student", "Account Setup", "Confirm Email"];

  return (
    <div style={{ background: dark ? "#0A0A0A" : "#FFFFFF", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
      <div style={{ background: t.bg, color: t.text, width: "100%", maxWidth: 430, minHeight: "100vh", boxShadow: dark ? "0 0 80px rgba(0,0,0,0.6)" : "0 0 60px rgba(0,0,0,0.08)", transition: "all 0.3s ease" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          .input-field {
            width: 100%; padding: 14px 16px; border-radius: 12px;
            border: 1.5px solid ${t.border}; background: ${t.input};
            color: ${t.text}; font-size: 15px; font-family: 'DM Sans', sans-serif;
            outline: none; transition: all 0.2s ease;
          }
          .input-field:focus { border-color: #2D8C4E; box-shadow: 0 0 0 3px rgba(45,140,78,0.12); }
          .input-field::placeholder { color: ${t.subtext}; opacity: 0.7; }
          .input-wrapper { position: relative; }
          .input-wrapper .input-field { padding-right: 46px; }
          .eye-btn {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            color: ${t.subtext};
            display: flex;
            align-items: center;
            padding: 0;
            transition: color 0.2s;
          }
          .eye-btn:hover { color: #2D8C4E; }
          .btn-primary {
            background: linear-gradient(135deg, #1B4D2E, #2D8C4E); color: white;
            border: none; border-radius: 12px; padding: 15px 32px; font-size: 16px;
            font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif;
            width: 100%; transition: all 0.2s ease; box-shadow: 0 4px 15px rgba(45,140,78,0.3);
          }
          .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(45,140,78,0.4); }
          .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
          .btn-ghost {
            background: transparent; border: none; color: ${t.subtext}; font-size: 14px;
            font-family: 'DM Sans', sans-serif; cursor: pointer; padding: 8px;
            display: flex; align-items: center; gap: 6px;
          }
          .btn-ghost:hover { color: #2D8C4E; }
          .toggle-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
          .toggle-btn:hover { background: rgba(45,140,78,0.1); }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .fade-up { animation: fadeUp 0.4s ease forwards; }
          .error-box {
            background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
            color: #EF4444; padding: 12px 16px; border-radius: 10px; font-size: 14px; line-height: 1.5;
          }
          .lbl { font-size: 13px; font-weight: 600; color: ${t.subtext}; margin-bottom: 8px; letter-spacing: 0.3px; }
          .otp-input {
            width: 46px; height: 54px; border-radius: 12px; border: 1.5px solid ${t.border};
            background: ${t.input}; color: ${t.text}; font-size: 22px; font-weight: 700;
            font-family: 'DM Sans', sans-serif; text-align: center; outline: none;
            transition: all 0.2s ease; caret-color: #2D8C4E;
          }
          .otp-input:focus { border-color: #2D8C4E; box-shadow: 0 0 0 3px rgba(45,140,78,0.12); }
          .otp-input.filled { border-color: #2D8C4E; background: rgba(45,140,78,0.06); }
          .info-card { background: ${t.card}; border: 1px solid ${t.border}; border-radius: 12px; padding: 14px 16px; }
        `}</style>

        {/* NAV */}
        <nav style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, background: t.bg, zIndex: 100 }}>
          <button className="btn-ghost" onClick={handleBack}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            {step === 1 ? "Home" : "Back"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 13, fontFamily: "Playfair Display, serif" }}>i</span>
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 17, color: t.text }}>iboto</span>
          </div>
          <button className="toggle-btn" onClick={toggleTheme}>
            {dark
              ? <svg width="20" height="20" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              : <svg width="20" height="20" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            }
          </button>
        </nav>

        <div style={{ padding: "28px 24px" }}>

          {/* STEP TRACKER */}
          {step <= 3 && (
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 32 }}>
              {stepLabels.map((label, i) => {
                const s = i + 1;
                const done = step > s;
                const active = step === s;
                return (
                  <div key={s} style={{ display: "flex", alignItems: "flex-start", flex: i < stepLabels.length - 1 ? 1 : "none" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 700, transition: "all 0.3s ease",
                        background: done || active ? "linear-gradient(135deg, #1B4D2E, #2D8C4E)" : t.card,
                        border: `2px solid ${done || active ? "#2D8C4E" : t.border}`,
                        color: done || active ? "white" : t.subtext,
                      }}>
                        {done
                          ? <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                          : s}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: active ? "#2D8C4E" : t.subtext, whiteSpace: "nowrap" }}>{label}</span>
                    </div>
                    {i < stepLabels.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: step > s ? "#2D8C4E" : t.border, marginTop: 15, marginLeft: 6, marginRight: 6, transition: "background 0.3s ease" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="fade-up">
              <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 800, color: t.text, marginBottom: 8, letterSpacing: "-0.5px" }}>
                Are you a student?
              </h1>
              <p style={{ fontSize: 14, color: t.subtext, marginBottom: 28, lineHeight: 1.6 }}>
                Enter your Student ID. We'll verify it against the registrar's records before you can register.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <div className="lbl">Student ID</div>
                  <input
                    className="input-field"
                    placeholder="e.g. 2021-12345"
                    value={form.studentId}
                    onChange={e => update("studentId", e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleValidateStudent()}
                  />
                  <p style={{ fontSize: 12, color: t.subtext, marginTop: 6 }}>Must match your registrar records exactly</p>
                </div>
                {error && <div className="error-box">{error}</div>}
                <button className="btn-primary" onClick={handleValidateStudent} disabled={loading}>
                  {loading ? "Verifying..." : "Verify Student ID"}
                </button>
                <p style={{ fontSize: 13, color: t.subtext, textAlign: "center" }}>
                  Already have an account?{" "}
                  <span style={{ color: "#2D8C4E", fontWeight: 600, cursor: "pointer" }} onClick={() => router.push("/login")}>Login here</span>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="fade-up">
              <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 800, color: t.text, marginBottom: 8, letterSpacing: "-0.5px" }}>
                Set up your account
              </h1>
              <p style={{ fontSize: 14, color: t.subtext, marginBottom: 20, lineHeight: 1.6 }}>
                Enter your Gmail and create a password. We'll send a verification code to confirm.
              </p>

              {studentInfo && (
                <div className="info-card" style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(45,140,78,0.12)", border: "1.5px solid #2D8C4E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="18" height="18" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{studentInfo.name || form.studentId}</div>
                    <div style={{ fontSize: 12, color: t.subtext }}>{studentInfo.course || "Verified Student"}{studentInfo.year ? ` · ${studentInfo.year}` : ""}</div>
                  </div>
                  <div style={{ background: "rgba(45,140,78,0.1)", color: "#2D8C4E", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100, flexShrink: 0 }}>✓ Verified</div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <div className="lbl">Gmail Address</div>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={form.email}
                    onChange={e => update("email", e.target.value)}
                  />
                  <p style={{ fontSize: 12, color: t.subtext, marginTop: 6 }}>OTP will be sent to this Gmail</p>
                </div>
                <div>
                  <div className="lbl">Password</div>
                  <div className="input-wrapper">
                    <input
                      className="input-field"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={form.password}
                      onChange={e => update("password", e.target.value)}
                    />
                    <button className="eye-btn" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                      {showPassword
                        ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>
                <div>
                  <div className="lbl">Confirm Password</div>
                  <div className="input-wrapper">
                    <input
                      className="input-field"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={form.confirmPassword}
                      onChange={e => update("confirmPassword", e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                    />
                    <button className="eye-btn" onClick={() => setShowConfirmPassword(p => !p)} tabIndex={-1}>
                      {showConfirmPassword
                        ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>
                {error && <div className="error-box">{error}</div>}
                <button className="btn-primary" onClick={handleSendOtp} disabled={loading}>
                  {loading ? "Sending code..." : "Send Verification Code"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="fade-up">
              <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 800, color: t.text, marginBottom: 8, letterSpacing: "-0.5px" }}>
                Check your Gmail
              </h1>
              <p style={{ fontSize: 14, color: t.subtext, marginBottom: 8, lineHeight: 1.6 }}>
                We sent a 6-digit code to{" "}
                <span style={{ color: t.text, fontWeight: 600 }}>{form.email}</span>.
              </p>
              <p style={{ fontSize: 13, color: t.subtext, marginBottom: 28 }}>
                Code expires in <span style={{ color: "#2D8C4E", fontWeight: 600 }}>5 minutes</span>.
              </p>

              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => otpRefs.current[i] = el}
                    className={`otp-input${digit ? " filled" : ""}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                  />
                ))}
              </div>

              {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

              <button className="btn-primary" onClick={handleVerifyOtp} disabled={loading || otp.join("").length < 6}>
                {loading ? "Verifying..." : "Verify & Create Account"}
              </button>

              <div style={{ textAlign: "center", marginTop: 20 }}>
                {resendCooldown > 0
                  ? <span style={{ fontSize: 13, color: t.subtext }}>Resend code in <span style={{ color: "#2D8C4E", fontWeight: 600 }}>{resendCooldown}s</span></span>
                  : <span style={{ fontSize: 13, color: t.subtext }}>Didn't get it?{" "}<span style={{ color: "#2D8C4E", fontWeight: 600, cursor: "pointer" }} onClick={handleResend}>Resend code</span></span>
                }
              </div>
              <div style={{ textAlign: "center", marginTop: 10 }}>
                <span style={{ fontSize: 12, color: t.subtext }}>Wrong Gmail?{" "}
                  <span style={{ color: "#2D8C4E", fontWeight: 600, cursor: "pointer" }} onClick={() => { setError(""); setStep(2); }}>Change it</span>
                </span>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="fade-up" style={{ textAlign: "center", paddingTop: 32 }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(45,140,78,0.12)", border: "2px solid #2D8C4E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <svg width="36" height="36" fill="none" stroke="#2D8C4E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 30, fontWeight: 800, color: t.text, marginBottom: 12, letterSpacing: "-0.5px" }}>
                You're all set!
              </h1>
              <p style={{ fontSize: 15, color: t.subtext, marginBottom: 36, lineHeight: 1.7 }}>
                Your account has been verified and created. You can now login and cast your vote.
              </p>
              <div className="info-card" style={{ marginBottom: 32, textAlign: "left" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: t.subtext, marginBottom: 2 }}>Student ID</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: t.text }}>{form.studentId}</div>
                  </div>
                  <div style={{ height: 1, background: t.border }} />
                  <div>
                    <div style={{ fontSize: 12, color: t.subtext, marginBottom: 2 }}>Gmail</div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: t.text }}>{form.email}</div>
                  </div>
                </div>
              </div>
              <button className="btn-primary" onClick={() => router.push("/login")}>
                Proceed to Login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const theme = {
  light: {
    bg: "#F5F3EE",
    card: "#ECEAE4",
    input: "#ECEAE4",
    text: "#0D0D0D",
    subtext: "#6B7280",
    border: "#DDD9D0",
  },
  dark: {
    bg: "#0D1117",
    card: "#161B22",
    input: "#161B22",
    text: "#E6EDF3",
    subtext: "#8B949E",
    border: "#30363D",
  }
};