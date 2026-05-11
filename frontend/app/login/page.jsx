"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1); // 1=credentials, 2=face scan
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const router = useRouter();

  const [form, setForm] = useState({ studentId: "", password: "" });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("iboto-theme");
    if (saved) setDark(saved === "dark");
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  // Start camera when step 2
  useEffect(() => {
    if (step === 2) startCamera();
    return () => stopCamera();
  }, [step]);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      }
    } catch (err) {
      setError("Camera access denied. Please allow camera to continue.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setCameraReady(false);
    }
  };

  const captureFrame = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL("image/jpeg").split(",")[1];
  };

  // Step 1 — verify credentials
  const handleCredentials = async () => {
  if (!form.studentId.trim()) { setError("Student ID is required"); return; }
  if (!form.password) { setError("Password is required"); return; }

  setLoading(true);
  setError("");

  try {
    // Get saved device token if exists
    const deviceToken = localStorage.getItem("iboto-device-token") || null;
    const deviceInfo = navigator.userAgent;

    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: form.studentId.trim(),
        password: form.password,
        deviceToken,
        deviceInfo
      }),
    });

    const data = await res.json();
    if (!data.success) { setError(data.message); return; }

    setStudentData(data.data);

    // Face not enrolled — go enroll
    if (!data.faceEnrolled) {
      router.push(`/enroll-face?studentId=${data.data.studentId}`);
      return;
    }

    // Trusted device — login complete
    if (data.deviceTrusted) {
      localStorage.setItem("iboto-access-token", data.data.accessToken);
      localStorage.setItem("iboto-refresh-token", data.data.refreshToken);
      localStorage.setItem("iboto-student", JSON.stringify({
        name: data.data.name,
        studentId: data.data.studentId
      }));
      router.push("/elections");
      return;
    }

    // New device — need face scan
<<<<<<< HEAD
          // Face enrolled — proceed to face scan
      // TODO: re-enable when face service ready
      // setStep(2);

      // TEMPORARY — skip face scan, go straight to elections
      localStorage.setItem("iboto-access-token", data.data?.accessToken || "temp");
      localStorage.setItem("iboto-refresh-token", data.data?.refreshToken || "temp");
      localStorage.setItem("iboto-student", JSON.stringify({
        name: data.data.name,
        studentId: data.data.studentId
      }));
=======
    // Face enrolled — proceed to face scan
// TODO: re-enable when face service ready
// setStep(2);

// TEMPORARY — skip face scan, go straight to elections
localStorage.setItem("iboto-access-token", data.data?.accessToken || "temp");
localStorage.setItem("iboto-refresh-token", data.data?.refreshToken || "temp");
localStorage.setItem("iboto-student", JSON.stringify({
  name: data.data.name,
  studentId: data.data.studentId
}));
>>>>>>> master
router.push("/elections");
  } catch {
    setError("Cannot connect to server. Try again.");
  } finally {
    setLoading(false);
  }
};

  // Step 2 — face scan
  const handleFaceScan = async () => {
  if (!cameraReady) { setError("Camera not ready"); return; }

  setScanning(true);
  setError("");

  for (let i = 3; i >= 1; i--) {
    setCountdown(i);
    await new Promise(r => setTimeout(r, 800));
  }
  setCountdown(null);

  try {
    const imageBase64 = captureFrame();
    const deviceInfo = navigator.userAgent;

    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: form.studentId.trim(),
        password: form.password,
        image: imageBase64,
        deviceInfo
      }),
    });

    const data = await res.json();

    if (!data.success) {
      setError(data.message);
      setScanning(false);
      return;
    }

    // Save device token for future logins
    if (data.data.deviceToken) {
      localStorage.setItem("iboto-device-token", data.data.deviceToken);
    }

    // Save auth tokens
    localStorage.setItem("iboto-access-token", data.data.accessToken);
    localStorage.setItem("iboto-refresh-token", data.data.refreshToken);
    localStorage.setItem("iboto-student", JSON.stringify({
      name: data.data.name,
      studentId: data.data.studentId
    }));

    stopCamera();
    router.push("/elections");
  } catch {
    setError("Cannot connect to server. Try again.");
    setScanning(false);
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
        .input-field::placeholder { color: ${t.subtext}; opacity: 0.7; }
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
          padding: 8px 0;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
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
        .error-box {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #EF4444;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          line-height: 1.5;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        .pulse-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 3px solid #2D8C4E;
          animation: pulse-ring 1.2s ease-out infinite;
        }
        @keyframes scanLine {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        .scan-line {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #2D8C4E, transparent);
          animation: scanLine 2s ease-in-out infinite;
          box-shadow: 0 0 8px #2D8C4E;
        }
        .face-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .face-guide {
          width: 180px;
          height: 220px;
          border-radius: 50%;
          border: 3px solid rgba(45,140,78,0.7);
          box-shadow: 0 0 0 9999px rgba(0,0,0,0.4);
          position: relative;
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

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px" }}>

        {/* STEP 1 — CREDENTIALS */}
        {step === 1 && (
          <div className="fade-up">
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 30, fontWeight: 800, color: t.text, marginBottom: 8, letterSpacing: "-0.5px" }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: t.subtext, marginBottom: 32, lineHeight: 1.6 }}>
              Login with your student credentials to access the ballot.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.subtext, marginBottom: 8 }}>Student ID</div>
                <input
                  className="input-field"
                  placeholder="e.g. 2021-12345"
                  value={form.studentId}
                  onChange={e => update("studentId", e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCredentials()}
                />
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.subtext, marginBottom: 8 }}>Password</div>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => update("password", e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCredentials()}
                />
              </div>

              {error && <div className="error-box">{error}</div>}

              <button className="btn-primary" onClick={handleCredentials} disabled={loading}>
                {loading ? "Verifying..." : "Continue"}
              </button>

              <p style={{ fontSize: 13, color: t.subtext, textAlign: "center" }}>
                No account yet?{" "}
                <span style={{ color: "#2D8C4E", fontWeight: 600, cursor: "pointer" }} onClick={() => router.push("/register")}>
                  Register here
                </span>
              </p>
            </div>
          </div>
        )}

        {/* STEP 2 — FACE SCAN */}
        {step === 2 && (
          <div className="fade-up">
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 800, color: t.text, marginBottom: 8, letterSpacing: "-0.5px" }}>
              Face verification
            </h1>
            <p style={{ fontSize: 14, color: t.subtext, marginBottom: 24, lineHeight: 1.6 }}>
              Position your face inside the circle and press scan.
            </p>

            {/* CAMERA */}
            <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", background: "#000", aspectRatio: "4/3", marginBottom: 20 }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                onLoadedMetadata={() => setCameraReady(true)}
              />

              {/* Face guide overlay */}
              <div className="face-overlay">
                <div className="face-guide">
                  {scanning && <div className="scan-line" />}
                </div>
              </div>

              {/* Countdown */}
              {countdown && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
                  <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="pulse-ring" />
                    <span style={{ fontFamily: "Playfair Display, serif", fontSize: 48, fontWeight: 800, color: "white" }}>{countdown}</span>
                  </div>
                </div>
              )}

              {/* Not ready */}
              {!cameraReady && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: t.card, gap: 12 }}>
                  <svg width="40" height="40" fill="none" stroke={t.subtext} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  <span style={{ fontSize: 14, color: t.subtext }}>Starting camera...</span>
                </div>
              )}
            </div>

            {/* Tips */}
            <div style={{ background: t.card, borderRadius: 12, padding: "14px 16px", marginBottom: 20, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 12, color: t.subtext, lineHeight: 1.8 }}>
                💡 <strong>Tips:</strong> Good lighting · Face the camera directly · Remove glasses if needed · Stay still during scan
              </div>
            </div>

            {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

            <button className="btn-primary" onClick={handleFaceScan} disabled={!cameraReady || scanning}>
              {scanning ? "Scanning..." : "Scan Face"}
            </button>

            {studentData && (
              <p style={{ fontSize: 13, color: t.subtext, textAlign: "center", marginTop: 16 }}>
                Verifying as <strong style={{ color: t.text }}>{studentData.name}</strong>
              </p>
            )}
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