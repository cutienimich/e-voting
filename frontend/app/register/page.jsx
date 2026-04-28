"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1); // 1=credentials, 2=contact, 3=success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [form, setForm] = useState({
    studentId: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("iboto-theme");
    if (saved) setDark(saved === "dark");
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
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

  const validateStep1 = () => {
    if (!form.studentId.trim()) return "Student ID is required";
    if (!form.password) return "Password is required";
    if (form.password.length < 8) return "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    return null;
  };

  const validateStep2 = () => {
    if (!form.email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Invalid email format";
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    const err = validateStep2();
    if (err) { setError(err); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: form.studentId.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      setStep(3);
    } catch (err) {
      setError("Cannot connect to server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .input-field {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1.5px solid ${t.border};
          background: ${t.input};
          color: ${t.text};
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }
        .input-field:focus { border-color: #2D8C4E; box-shadow: 0 0 0 3px rgba(45,140,78,0.12); }
        .input-field::placeholder { color: ${t.subtext}; }
        .btn-primary {
          background: linear-gradient(135deg, #1B4D2E, #2D8C4E);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 15px 32px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(45,140,78,0.3);
        }
        .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(45,140,78,0.4); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-ghost {
          background: transparent;
          border: none;
          color: ${t.subtext};
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-ghost:hover { color: #2D8C4E; }
        .toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toggle-btn:hover { background: rgba(45,140,78,0.1); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        .error-box {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #EF4444;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
        }
        .step-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .step-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        .label {
          font-size: 13px;
          font-weight: 600;
          color: ${t.subtext};
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }
      `}</style>

      {/* NAV */}
      <nav style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, background: t.bg, zIndex: 100 }}>
        <button className="btn-ghost" onClick={() => step === 2 ? setStep(1) : router.push("/")}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {step === 2 ? "Back" : "Home"}
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

      {/* CONTENT */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px" }}>

        {/* STEP INDICATOR */}
        {step !== 3 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <div className="step-indicator">
              {[1, 2].map(s => (
                <div key={s} className="step-dot" style={{
                  width: s === step ? 24 : 8,
                  borderRadius: s === step ? 4 : "50%",
                  background: s <= step ? "#2D8C4E" : t.border
                }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: t.subtext, fontWeight: 500 }}>Step {step} of 2</span>
          </div>
        )}

        {/* STEP 1 — CREDENTIALS */}
        {step === 1 && (
          <div className="fade-up">
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 30, fontWeight: 800, color: t.text, marginBottom: 8, letterSpacing: "-0.5px" }}>
              Create account
            </h1>
            <p style={{ fontSize: 14, color: t.subtext, marginBottom: 32, lineHeight: 1.6 }}>
              Enter your student ID to verify your enrollment before registering.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div className="label">Student ID</div>
                <input
                  className="input-field"
                  placeholder="e.g. 2021-12345"
                  value={form.studentId}
                  onChange={e => update("studentId", e.target.value)}
                />
                <p style={{ fontSize: 12, color: t.subtext, marginTop: 6 }}>Must match your registrar records</p>
              </div>

              <div>
                <div className="label">Password</div>
                <input
                  className="input-field"
                  type="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={e => update("password", e.target.value)}
                />
              </div>

              <div>
                <div className="label">Confirm Password</div>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={e => update("confirmPassword", e.target.value)}
                />
              </div>

              {error && <div className="error-box">{error}</div>}

              <button className="btn-primary" onClick={handleNext}>
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — CONTACT */}
        {step === 2 && (
          <div className="fade-up">
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 30, fontWeight: 800, color: t.text, marginBottom: 8, letterSpacing: "-0.5px" }}>
              Contact info
            </h1>
            <p style={{ fontSize: 14, color: t.subtext, marginBottom: 32, lineHeight: 1.6 }}>
              Your email is required. Phone number is optional.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div className="label">Email Address <span style={{ color: "#EF4444" }}>*</span></div>
                <input
                  className="input-field"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => update("email", e.target.value)}
                />
              </div>

              <div>
                <div className="label">
                  Phone Number
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: t.subtext, background: t.card, padding: "2px 8px", borderRadius: 100, border: `1px solid ${t.border}` }}>
                    Optional
                  </span>
                </div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: t.subtext, fontSize: 15, fontWeight: 500 }}>+63</span>
                  <input
                    className="input-field"
                    style={{ paddingLeft: 48 }}
                    type="tel"
                    placeholder="9XX XXX XXXX"
                    value={form.phone}
                    onChange={e => update("phone", e.target.value)}
                  />
                </div>
                <p style={{ fontSize: 12, color: t.subtext, marginTop: 6 }}>For future SMS notifications</p>
              </div>

              {error && <div className="error-box">{error}</div>}

              <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </button>

              <p style={{ fontSize: 13, color: t.subtext, textAlign: "center" }}>
                Already have an account?{" "}
                <span style={{ color: "#2D8C4E", fontWeight: 600, cursor: "pointer" }} onClick={() => router.push("/login")}>
                  Login here
                </span>
              </p>
            </div>
          </div>
        )}

        {/* STEP 3 — SUCCESS */}
        {step === 3 && (
          <div className="fade-up" style={{ textAlign: "center", paddingTop: 40 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(45,140,78,0.12)", border: "2px solid #2D8C4E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="36" height="36" fill="none" stroke="#2D8C4E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 30, fontWeight: 800, color: t.text, marginBottom: 12, letterSpacing: "-0.5px" }}>
              Account created!
            </h1>
            <p style={{ fontSize: 15, color: t.subtext, marginBottom: 40, lineHeight: 1.7 }}>
              Your account has been successfully registered. You can now login and cast your vote.
            </p>

            <div style={{ background: t.card, borderRadius: 16, padding: 20, marginBottom: 32, border: `1px solid ${t.border}`, textAlign: "left" }}>
              <div style={{ fontSize: 13, color: t.subtext, marginBottom: 4 }}>Registered as</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: t.text }}>{form.studentId}</div>
            </div>

            <button className="btn-primary" onClick={() => router.push("/login")}>
              Proceed to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const theme = {
  light: {
    bg: "#FFFFFF",
    card: "#F4F6FA",
    input: "#F4F6FA",
    text: "#0D0D0D",
    subtext: "#6B7280",
    border: "#E5E7EB",
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