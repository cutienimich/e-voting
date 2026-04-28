"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("iboto-theme");
    if (saved) {
      setDark(saved === "dark");
    } else {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("iboto-theme", next ? "dark" : "light");
  };

  if (!mounted) return null;

  const t = dark ? theme.dark : theme.light;

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s ease" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .btn-primary {
          background: linear-gradient(135deg, #1B4D2E, #2D8C4E);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(45, 140, 78, 0.3);
          letter-spacing: 0.3px;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(45, 140, 78, 0.4); }
        .btn-outline {
          background: transparent;
          border: 2px solid #2D8C4E;
          color: #2D8C4E;
          border-radius: 12px;
          padding: 13px 32px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
          transition: all 0.2s ease;
          letter-spacing: 0.3px;
        }
        .btn-outline:hover { background: #2D8C4E; color: white; transform: translateY(-2px); }
        .feature-card {
          border-radius: 16px;
          padding: 28px 24px;
          transition: all 0.3s ease;
        }
        .feature-card:hover { transform: translateY(-4px); }
        .toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .toggle-btn:hover { background: rgba(45,140,78,0.1); }
        .step-num {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1B4D2E, #2D8C4E);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(45,140,78,0.12);
          border: 1px solid rgba(45,140,78,0.3);
          color: #2D8C4E;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 20px;
        }
        .divider {
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #1B4D2E, #2D8C4E);
          border-radius: 2px;
          margin: 0 auto 16px;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.6s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.6s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.6s 0.45s ease both; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .dot-live { width: 8px; height: 8px; border-radius: 50%; background: #2D8C4E; animation: pulse 2s infinite; }
      `}</style>

      {/* NAV */}
      <nav style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, background: t.bg, zIndex: 100, backdropFilter: "blur(10px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 16, fontFamily: "Playfair Display, serif" }}>i</span>
          </div>
          <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 20, color: t.text, letterSpacing: "-0.5px" }}>iboto</span>
        </div>
        <button className="toggle-btn" onClick={toggleTheme} title="Toggle theme">
          {dark
            ? <svg width="22" height="22" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            : <svg width="22" height="22" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          }
        </button>
      </nav>

      {/* HERO */}
      <section style={{ padding: "60px 24px 48px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
        <div className="fade-up">
          
        </div>
        <h1 className="fade-up-2" style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(42px, 12vw, 64px)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-2px", color: t.text, marginBottom: 20 }}>
          Your Voice.<br />
          <span style={{ color: "#2D8C4E" }}>Your Vote.</span>
        </h1>
        <p className="fade-up-3" style={{ fontSize: 16, lineHeight: 1.7, color: t.subtext, marginBottom: 36, fontWeight: 400 }}>
          Decentralized blockchain-based e-voting for Colegio de Montalban's school organization electoral process.
        </p>
        <div className="fade-up-4" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button className="btn-primary" onClick={() => router.push("/login")}>Login to Vote</button>
          <button className="btn-outline" onClick={() => router.push("/register")}>Create Account</button>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: "0 24px 48px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {[
            { val: "100%", label: "Transparent" },
            { val: "0%", label: "Tampering" },
            { val: "24/7", label: "Verifiable" },
          ].map((s, i) => (
            <div key={i} style={{ background: t.card, borderRadius: 14, padding: "18px 12px", textAlign: "center", border: `1px solid ${t.border}` }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: 24, fontWeight: 800, color: "#2D8C4E" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: t.subtext, fontWeight: 500, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "0 24px 56px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="divider" />
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>Why iboto?</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              icon: <svg width="28" height="28" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 00-8 0v2"/><circle cx="12" cy="14" r="1" fill="#2D8C4E"/></svg>,
              title: "Blockchain Immutable",
              desc: "Every vote recorded as a transaction on Polygon blockchain. Permanent, tamper-proof, and publicly verifiable."
            },
            {
              icon: <svg width="28" height="28" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
              title: "Face Verification",
              desc: "AI-powered face detection with liveness check ensures only the real student can cast their vote."
            },
            {
              icon: <svg width="28" height="28" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
              title: "Secure & Private",
              desc: "Student identity hashed before going on-chain. Your vote is anonymous yet fully verifiable."
            },
          ].map((f, i) => (
            <div key={i} className="feature-card" style={{ background: t.card, border: `1px solid ${t.border}`, display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: dark ? "rgba(45,140,78,0.12)" : "rgba(45,140,78,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: t.text, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: t.subtext, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "0 24px 56px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div className="divider" />
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>How it works</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            { step: 1, title: "Register your account", desc: "Enter your student ID and create your credentials. System verifies against registrar records." },
            { step: 2, title: "Login with face scan", desc: "Authenticate with your student ID, password, and real-time face verification." },
            { step: 3, title: "Cast your vote", desc: "Select your candidates and submit. Your vote is recorded permanently on blockchain." },
            { step: 4, title: "Verify anytime", desc: "Use your transaction hash to verify your vote on the public blockchain explorer." },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div className="step-num">{s.step}</div>
              <div style={{ paddingTop: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: t.text, marginBottom: 4 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: t.subtext, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 24px 60px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", borderRadius: 20, padding: "36px 24px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 800, color: "white", marginBottom: 12, letterSpacing: "-0.5px" }}>Ready to vote?</h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 24, lineHeight: 1.6 }}>
            Make your voice count in the Colegio de Montalban school organization election.
          </p>
          <button className="btn-primary" style={{ background: "white", color: "#1B4D2E", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }} onClick={() => router.push("/register")}>
            Get Started
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${t.border}`, padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 11, fontFamily: "Playfair Display, serif" }}>i</span>
          </div>
          <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 14, color: t.text }}>iboto</span>
        </div>
        <p style={{ fontSize: 12, color: t.subtext }}>Colegio de Montalban · School Organization E-Voting System</p>
        <p style={{ fontSize: 11, color: t.subtext, marginTop: 4 }}>© 2025 iboto. All rights reserved.</p>
      </footer>
    </div>
  );
}

const theme = {
  light: {
    bg: "#FFFFFF",
    card: "#F4F6FA",
    text: "#0D0D0D",
    subtext: "#6B7280",
    border: "#E5E7EB",
  },
  dark: {
    bg: "#0D1117",
    card: "#161B22",
    text: "#E6EDF3",
    subtext: "#8B949E",
    border: "#30363D",
  }
};