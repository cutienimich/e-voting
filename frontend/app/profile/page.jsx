"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import VotingActivity from "@/components/VotingActivity";


const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("iboto-refresh-token");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    if (data.success && data.accessToken) {
      localStorage.setItem("iboto-access-token", data.accessToken);
      return data.accessToken;
    } else if (data.success && data.data?.accessToken) {
      localStorage.setItem("iboto-access-token", data.data.accessToken);
      return data.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
};

const authFetch = async (url, options = {}) => {
  const makeHeaders = (token) => ({
    ...options.headers,
    Authorization: `Bearer ${token}`,
  });

  let token = localStorage.getItem("iboto-access-token");
  let res = await fetch(url, { ...options, headers: makeHeaders(token) });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      ["iboto-access-token", "iboto-refresh-token", "iboto-student", "iboto-device-token"]
        .forEach((k) => localStorage.removeItem(k));
      return { __redirect: "/login" };
    }
    res = await fetch(url, { ...options, headers: makeHeaders(newToken) });
  }

  return res;
};

export default function ProfilePage() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [student, setStudent] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit profile
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ email: "", birthday: "", yearSection: "", course: "", address: "" });
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Email change
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailStep, setEmailStep] = useState("idle");
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Change password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  // Password visibility toggles
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNextPw, setShowNextPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Face enrollment
  const [showFaceEnroll, setShowFaceEnroll] = useState(false);
  const [faceStep, setFaceStep] = useState("idle");
  const [faceError, setFaceError] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const router = useRouter();

  const checkRedirect = (res) => {
    if (res?.__redirect) { router.push(res.__redirect); return true; }
    return false;
  };

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("iboto-theme");
    if (saved) setDark(saved === "dark");
    else setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    const studentData = localStorage.getItem("iboto-student");
    if (!studentData) { router.push("/login"); return; }
    setStudent(JSON.parse(studentData));
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!showFaceEnroll) stopCamera();
  }, [showFaceEnroll]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("iboto-theme", next ? "dark" : "light");
  };

  const fetchProfile = async () => {
    try {
      const res = await authFetch(`${API}/api/auth/me`);
      if (checkRedirect(res)) return;
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const profileData = await res.json();
      if (profileData.success) {
        const d = profileData.data;
        setProfile(d);
        const yearSection = d.yearLevel
          ? `${d.yearLevel}${d.section ? ` - ${d.section}` : ""}`
          : (d.section || "");
        setEditForm({
          email: d.email || "",
          birthday: d.birthday ? d.birthday.slice(0, 10) : "",
          yearSection,
          course: d.course || "",
          address: d.address || "",
        });
        setNewEmail(d.email || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseYearSection = (val) => {
    const parts = val.split(/[-–]/).map((s) => s.trim());
    return { yearLevel: parts[0] || "", section: parts[1] || "" };
  };

  const startCamera = async () => {
    setFaceError("");
    setFaceStep("camera");
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setFaceError("Cannot access camera. Please allow camera permission and try again.");
      setFaceStep("error");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.9).split(",")[1];
    setCapturedImage(base64);
    stopCamera();
    setFaceStep("captured");
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const submitFaceEnroll = async () => {
    setFaceError("");
    setFaceStep("uploading");
    try {
      const studentId = profile?.studentId || student?.studentId;
      const res = await authFetch(`${API}/api/face/enroll/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: capturedImage }),
      });
      if (checkRedirect(res)) return;
      const data = await res.json();
      if (!data.success) {
        setFaceError(data.message || "Enrollment failed. Try again.");
        setFaceStep("error");
        return;
      }
      setFaceStep("success");
      setProfile((prev) => ({ ...prev, faceEnrolled: true }));
      const currentStudent = JSON.parse(localStorage.getItem("iboto-student") || "{}");
      localStorage.setItem("iboto-student", JSON.stringify({
        ...currentStudent,
        faceEnrolled: true
      }));
      setTimeout(() => {
        setShowFaceEnroll(false);
        setFaceStep("idle");
        setCapturedImage(null);
      }, 2500);
    } catch {
      setFaceError("Cannot connect to server. Try again.");
      setFaceStep("error");
    }
  };

  const handleOpenFaceEnroll = () => {
    setShowFaceEnroll(true);
    setFaceStep("idle");
    setFaceError("");
    setCapturedImage(null);
  };

  const handleCloseFaceEnroll = () => {
    stopCamera();
    setShowFaceEnroll(false);
    setFaceStep("idle");
    setFaceError("");
    setCapturedImage(null);
  };

  const handleSendOtp = async () => {
    setOtpError("");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) { setOtpError("Enter a valid email address."); return; }
    if (newEmail === profile?.email) { setOtpError("This is already your current email."); return; }
    setOtpLoading(true);
    try {
      const res = await authFetch(`${API}/api/auth/request-email-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      });
      if (checkRedirect(res)) return;
      const data = await res.json();
      if (!data.success) { setOtpError(data.message || "Failed to send OTP."); return; }
      setEmailStep("otp-sent");
      setOtpCountdown(60);
    } catch { setOtpError("Cannot connect to server."); }
    finally { setOtpLoading(false); }
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    if (otpValue.length < 4) { setOtpError("Enter the OTP sent to your email."); return; }
    setOtpLoading(true);
    try {
      const res = await authFetch(`${API}/api/auth/verify-email-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpValue, newEmail }),
      });
      if (checkRedirect(res)) return;
      const data = await res.json();
      if (!data.success) { setOtpError(data.message || "Invalid or expired OTP."); return; }
      setEmailStep("verified");
      setEditForm((p) => ({ ...p, email: newEmail }));
      setOtpValue("");
    } catch { setOtpError("Cannot connect to server."); }
    finally { setOtpLoading(false); }
  };

  const handleCancelEmailChange = () => {
    setIsChangingEmail(false);
    setEmailStep("idle");
    setOtpValue("");
    setOtpError("");
    setNewEmail(profile?.email || "");
  };

  const handleUpdateProfile = async () => {
    setEditError("");
    if (!editForm.course.trim()) { setEditError("Course / Program is required."); return; }
    if (!editForm.yearSection.trim()) { setEditError("Year & Section is required."); return; }
    if (!editForm.address.trim()) { setEditError("Address is required."); return; }
    if (isChangingEmail && emailStep !== "verified") {
      setEditError("Please verify your new email address before saving.");
      return;
    }
    setEditLoading(true);
    const { yearLevel, section } = parseYearSection(editForm.yearSection);
    try {
      const res = await authFetch(`${API}/api/auth/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editForm.email.trim() || null,
          birthday: editForm.birthday || null,
          yearLevel: yearLevel || null,
          section: section || null,
          course: editForm.course.trim() || null,
          address: editForm.address.trim() || null,
        }),
      });
      if (checkRedirect(res)) return;
      const data = await res.json();
      if (!data.success) { setEditError(data.message || "Failed to update profile."); return; }
      setProfile((prev) => ({ ...prev, email: editForm.email, birthday: editForm.birthday, yearLevel, section, course: editForm.course, address: editForm.address }));
      setEditSuccess(true);
      setEmailStep("idle");
      setIsChangingEmail(false);
      setTimeout(() => { setEditSuccess(false); setIsEditing(false); }, 1800);
    } catch { setEditError("Cannot connect to server. Try again."); }
    finally { setEditLoading(false); }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError("");
    setEditSuccess(false);
    setEmailStep("idle");
    setOtpValue("");
    setOtpError("");
    setIsChangingEmail(false);
    const yearSection = profile?.yearLevel
      ? `${profile.yearLevel}${profile?.section ? ` - ${profile.section}` : ""}`
      : (profile?.section || "");
    setEditForm({ email: profile?.email || "", birthday: profile?.birthday ? profile.birthday.slice(0, 10) : "", yearSection, course: profile?.course || "", address: profile?.address || "" });
    setNewEmail(profile?.email || "");
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    if (!passwordForm.current) { setPasswordError("Current password is required"); return; }
    if (passwordForm.next.length < 8) { setPasswordError("New password must be at least 8 characters"); return; }
    if (passwordForm.next !== passwordForm.confirm) { setPasswordError("Passwords do not match"); return; }
    setPasswordLoading(true);
    try {
      const res = await authFetch(`${API}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.next }),
      });
      if (checkRedirect(res)) return;
      const data = await res.json();
      if (!data.success) { setPasswordError(data.message); return; }
      setPasswordSuccess(true);
      setPasswordForm({ current: "", next: "", confirm: "" });
      setTimeout(() => { setPasswordSuccess(false); setShowChangePassword(false); }, 2000);
    } catch { setPasswordError("Cannot connect to server. Try again."); }
    finally { setPasswordLoading(false); }
  };

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("iboto-refresh-token");
    if (refreshToken) {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    }
    ["iboto-access-token","iboto-refresh-token","iboto-student","iboto-device-token"].forEach((k) => localStorage.removeItem(k));
    router.push("/");
  };

  // Eye icon helper
  const EyeIcon = ({ show }) => show
    ? <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  if (!mounted) return null;
  const t = dark ? theme.dark : theme.light;

  const initials = (profile?.name || student?.name || "S")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div style={{ background: dark ? "#111110" : "#ffffff", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: t.bg, color: t.text, maxWidth: 480, margin: "0 auto", minHeight: "100vh", transition: "all 0.3s ease" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700;800&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          .section-card { background: ${t.card}; border: 1px solid ${t.border}; border-radius: 16px; overflow: hidden; margin-bottom: 16px; }
          .section-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 10px; }
          .section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${t.subtext}; padding: 16px 20px 10px; }
          .row-item { display: flex; align-items: flex-start; justify-content: space-between; padding: 13px 20px; border-top: 1px solid ${t.border}; gap: 12px; }
          .row-item:first-of-type { border-top: none; }
          .row-label { font-size: 13px; color: ${t.subtext}; flex-shrink: 0; padding-top: 1px; }
          .row-value { font-size: 14px; font-weight: 600; color: ${t.text}; text-align: right; word-break: break-word; max-width: 220px; }
          .row-value-muted { font-size: 14px; font-weight: 400; color: ${t.subtext}; text-align: right; font-style: italic; }
          .toggle-btn { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
          .toggle-btn:hover { background: rgba(45,140,78,0.1); }
          .edit-toggle-btn { background: none; border: 1.5px solid ${t.border}; color: ${t.subtext}; border-radius: 8px; padding: 5px 12px; font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 5px; }
          .edit-toggle-btn:hover { border-color: #2D8C4E; color: #2D8C4E; }
          .logout-btn { background: none; border: 1px solid ${t.border}; color: ${t.subtext}; border-radius: 10px; padding: 8px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
          .logout-btn:hover { border-color: #EF4444; color: #EF4444; }
          .btn-primary { background: linear-gradient(135deg, #1B4D2E, #2D8C4E); color: white; border: none; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; width: 100%; transition: all 0.2s ease; box-shadow: 0 4px 15px rgba(45,140,78,0.3); }
          .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(45,140,78,0.4); }
          .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
          .btn-sm { padding: 9px 16px !important; font-size: 13px !important; border-radius: 10px !important; width: auto !important; white-space: nowrap; }
          .btn-outline { background: none; color: ${t.subtext}; border: 1px solid ${t.border}; border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; width: 100%; transition: all 0.2s; }
          .btn-outline:hover { border-color: ${t.text}; color: ${t.text}; }
          .btn-link { background: none; border: none; color: #2D8C4E; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; font-weight: 600; padding: 0; text-decoration: underline; text-underline-offset: 2px; }
          .btn-link-muted { background: none; border: none; color: ${t.subtext}; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; font-weight: 500; padding: 0; }
          .input-field { width: 100%; padding: 13px 16px; border-radius: 12px; border: 1.5px solid ${t.border}; background: ${t.bg}; color: ${t.text}; font-size: 15px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s ease; }
          .input-field:focus { border-color: #2D8C4E; box-shadow: 0 0 0 3px rgba(45,140,78,0.12); }
          .input-field::placeholder { color: ${t.subtext}; opacity: 0.6; }
          .input-field:disabled { opacity: 0.45; cursor: not-allowed; }
          .input-label { font-size: 12px; font-weight: 600; color: ${t.subtext}; margin-bottom: 6px; display: block; letter-spacing: 0.02em; }
          .input-group { display: flex; flex-direction: column; gap: 4px; }
          .pw-wrapper { position: relative; }
          .pw-wrapper .input-field { padding-right: 46px; }
          .eye-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: ${t.subtext}; display: flex; align-items: center; padding: 0; transition: color 0.2s; }
          .eye-btn:hover { color: #2D8C4E; }
          .error-box { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #EF4444; padding: 12px 16px; border-radius: 10px; font-size: 14px; }
          .success-box { background: rgba(45,140,78,0.1); border: 1px solid rgba(45,140,78,0.3); color: #2D8C4E; padding: 12px 16px; border-radius: 10px; font-size: 14px; }
          .info-box { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.25); color: #3B82F6; padding: 12px 16px; border-radius: 10px; font-size: 13px; line-height: 1.5; }
          .otp-verified { background: rgba(45,140,78,0.08); border: 1px solid rgba(45,140,78,0.25); color: #2D8C4E; padding: 10px 16px; border-radius: 10px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
          .otp-input { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1.5px solid ${t.border}; background: ${t.bg}; color: ${t.text}; font-size: 26px; font-family: 'DM Sans', sans-serif; outline: none; transition: all 0.2s ease; letter-spacing: 0.5em; text-align: center; font-weight: 700; }
          .otp-input:focus { border-color: #2D8C4E; box-shadow: 0 0 0 3px rgba(45,140,78,0.12); }
          .resend-btn { background: none; border: none; color: #2D8C4E; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; font-weight: 600; padding: 0; }
          .resend-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .email-display-row { display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; border-radius: 12px; border: 1.5px solid ${t.border}; background: ${t.bg}; }
          .skeleton { background: linear-gradient(90deg, ${t.card} 25%, ${t.border} 50%, ${t.card} 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
          .fade-up { animation: fadeUp 0.4s ease forwards; }
          .action-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-top: 1px solid ${t.border}; cursor: pointer; transition: background 0.15s; }
          .action-row:first-of-type { border-top: none; }
          .action-row:hover { background: rgba(45,140,78,0.05); }
          .action-row-danger:hover { background: rgba(239,68,68,0.05); }
          .required-star { color: #EF4444; margin-left: 2px; }
          .face-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 999; display: flex; align-items: flex-end; justify-content: center; animation: fadeIn 0.2s ease; }
          .face-sheet { background: ${t.bg}; border-radius: 24px 24px 0 0; width: 100%; max-width: 480px; padding: 24px 20px 40px; display: flex; flex-direction: column; gap: 16px; animation: slideUp 0.3s ease; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          .face-video { width: 100%; aspect-ratio: 4/3; border-radius: 16px; object-fit: cover; transform: scaleX(-1); background: #000; }
          .face-preview { width: 100%; aspect-ratio: 4/3; border-radius: 16px; object-fit: cover; }
          .face-oval-wrap { position: relative; width: 100%; aspect-ratio: 4/3; border-radius: 16px; overflow: hidden; background: #000; }
          .face-oval-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
          .capture-btn { width: 68px; height: 68px; border-radius: 50%; background: white; border: 5px solid rgba(255,255,255,0.4); cursor: pointer; margin: 0 auto; display: block; transition: transform 0.15s; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
          .capture-btn:hover { transform: scale(1.05); }
          .capture-btn:active { transform: scale(0.95); }
        `}</style>

        {/* NAV */}
        <nav style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, background: t.bg, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 13, fontFamily: "Playfair Display, serif" }}>i</span>
            </div>
            <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 17, color: t.text }}>iboto</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="toggle-btn" onClick={toggleTheme}>
              {dark
                ? <svg width="19" height="19" fill="none" stroke="#2D8C4E" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                : <svg width="19" height="19" fill="none" stroke="#1B4D2E" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
              }
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Logout
            </button>
          </div>
        </nav>

        <div style={{ padding: "24px 20px", paddingBottom: 100 }}>

          {/* AVATAR + NAME */}
          <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #1B4D2E, #2D8C4E)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "white", fontSize: 22, fontWeight: 800, fontFamily: "Playfair Display, serif" }}>{initials}</span>
            </div>
            <div>
              <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: "-0.3px" }}>
                {profile?.name || student?.name || "Student"}
              </h1>
              <p style={{ fontSize: 13, color: t.subtext, marginTop: 2 }}>{profile?.studentId || student?.studentId}</p>
              {(profile?.course || profile?.yearLevel) && (
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {profile?.course && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: "rgba(45,140,78,0.1)", color: "#2D8C4E", border: "1px solid rgba(45,140,78,0.2)" }}>
                      {profile.course}
                    </span>
                  )}
                  {profile?.yearLevel && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 100, background: t.border, color: t.subtext }}>
                      {profile.yearLevel}{profile?.section ? ` · ${profile.section}` : ""}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[120, 200, 160, 100].map((h, i) => <div key={i} className="skeleton" style={{ height: h }} />)}
            </div>
          )}

          {!loading && (
            <>
              {/* STUDENT INFORMATION */}
              <div className="section-card fade-up">
                <div className="section-header">
                  <span className="section-title" style={{ padding: 0 }}>Student Information</span>
                  {!isEditing ? (
                    <button className="edit-toggle-btn" onClick={() => { setIsEditing(true); setEditError(""); }}>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                  ) : (
                    <button className="edit-toggle-btn" onClick={handleCancelEdit} style={{ borderColor: "rgba(239,68,68,0.4)", color: "#EF4444" }}>Cancel</button>
                  )}
                </div>

                {!isEditing && (
                  <>
                    <div className="row-item"><span className="row-label">Email</span><span className={profile?.email ? "row-value" : "row-value-muted"}>{profile?.email || "Not set"}</span></div>
                    <div className="row-item"><span className="row-label">Birthday</span><span className={profile?.birthday ? "row-value" : "row-value-muted"}>{profile?.birthday ? formatDate(profile.birthday) : "Not set"}</span></div>
                    <div className="row-item"><span className="row-label">Course</span><span className={profile?.course ? "row-value" : "row-value-muted"}>{profile?.course || "Not set"}</span></div>
                    <div className="row-item">
                      <span className="row-label">Year & Section</span>
                      <span className={profile?.yearLevel ? "row-value" : "row-value-muted"}>
                        {profile?.yearLevel ? `${profile.yearLevel}${profile?.section ? ` – ${profile.section}` : ""}` : "Not set"}
                      </span>
                    </div>
                    <div className="row-item"><span className="row-label">Address</span><span className={profile?.address ? "row-value" : "row-value-muted"} style={{ maxWidth: 220 }}>{profile?.address || "Not set"}</span></div>
                    <div className="row-item"><span className="row-label">Member since</span><span className="row-value">{profile?.createdAt ? formatDate(profile.createdAt) : "—"}</span></div>
                  </>
                )}

                {isEditing && (
                  <div style={{ padding: "12px 20px 20px", borderTop: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="input-group">
                      <label className="input-label">Email Address</label>
                      {!isChangingEmail && emailStep !== "verified" && (
                        <div className="email-display-row">
                          <span style={{ fontSize: 14, color: t.text, fontWeight: 500 }}>{profile?.email || "—"}</span>
                          <button className="btn-link" onClick={() => { setIsChangingEmail(true); setNewEmail(""); setOtpError(""); }}>Change</button>
                        </div>
                      )}
                      {isChangingEmail && emailStep === "idle" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "flex", gap: 8 }}>
                            <input className="input-field" type="email" placeholder="New email address" value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setOtpError(""); }} style={{ flex: 1 }} />
                            <button className="btn-primary btn-sm" onClick={handleSendOtp} disabled={otpLoading}>{otpLoading ? "Sending…" : "Send OTP"}</button>
                          </div>
                          <button className="btn-link-muted" onClick={handleCancelEmailChange}>← Keep current email</button>
                          {otpError && <div className="error-box">{otpError}</div>}
                        </div>
                      )}
                      {isChangingEmail && emailStep === "otp-sent" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div className="info-box">OTP sent to <strong>{newEmail}</strong>. Check your inbox.</div>
                          <input className="otp-input" type="text" inputMode="numeric" maxLength={6} placeholder="······" value={otpValue} onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))} />
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <button className="resend-btn" disabled={otpCountdown > 0} onClick={() => { setOtpCountdown(0); handleSendOtp(); }}>{otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend OTP"}</button>
                            <button className="btn-primary btn-sm" onClick={handleVerifyOtp} disabled={otpLoading}>{otpLoading ? "Verifying…" : "Confirm"}</button>
                          </div>
                          <button className="btn-link-muted" onClick={handleCancelEmailChange}>← Cancel email change</button>
                          {otpError && <div className="error-box">{otpError}</div>}
                        </div>
                      )}
                      {emailStep === "verified" && (
                        <div className="otp-verified">
                          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                          <span><strong>{newEmail}</strong> verified ✓</span>
                        </div>
                      )}
                    </div>
                    <div className="input-group">
                      <label className="input-label">Birthday</label>
                      <input className="input-field" type="date" value={editForm.birthday} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setEditForm((p) => ({ ...p, birthday: e.target.value }))} style={{ colorScheme: dark ? "dark" : "light" }} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Course / Program <span className="required-star">*</span></label>
                      <input className="input-field" type="text" placeholder="e.g. BSCS, BSIT, BSNursing…" value={editForm.course} onChange={(e) => setEditForm((p) => ({ ...p, course: e.target.value }))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Year & Section <span className="required-star">*</span></label>
                      <input className="input-field" type="text" placeholder="e.g. 2nd Year - Section A, 3-B…" value={editForm.yearSection} onChange={(e) => setEditForm((p) => ({ ...p, yearSection: e.target.value }))} />
                      <span style={{ fontSize: 11, color: t.subtext, marginTop: 3, paddingLeft: 2 }}>Enter your year and section together (e.g. "3rd Year - A")</span>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Address <span className="required-star">*</span></label>
                      <textarea className="input-field" placeholder="City, Province" rows={2} value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} style={{ resize: "none", lineHeight: 1.5 }} />
                    </div>
                    {editError && <div className="error-box">{editError}</div>}
                    {editSuccess && <div className="success-box">✓ Profile updated successfully!</div>}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="btn-outline" onClick={handleCancelEdit}>Cancel</button>
                      <button className="btn-primary" onClick={handleUpdateProfile} disabled={editLoading}>{editLoading ? "Saving…" : "Save Changes"}</button>
                    </div>
                  </div>
                )}
              </div>

              {/* VOTING ACTIVITY */}
              <div className="fade-up">
                <VotingActivity
                  dark={dark}
                  student={student}
                  profile={profile}
                  onRedirect={(path) => router.push(path)}
                />
              </div>

              {/* ACCOUNT & SECURITY */}
              <div className="section-card fade-up">
                <div className="section-title">Account & Security</div>

                {/* FACE VERIFICATION ROW */}
                <div className="action-row" onClick={!profile?.faceEnrolled ? handleOpenFaceEnroll : undefined} style={{ cursor: profile?.faceEnrolled ? "default" : "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: profile?.faceEnrolled ? "rgba(45,140,78,0.1)" : "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" fill="none" stroke={profile?.faceEnrolled ? "#2D8C4E" : "#EF4444"} strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 3H5a2 2 0 00-2 2v4m0 6v4a2 2 0 002 2h4m6 0h4a2 2 0 002-2v-4m0-6V5a2 2 0 00-2-2h-4"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </div>
                    <div>
                      <span style={{ fontSize: 14, color: t.text, fontWeight: 500 }}>Face verification</span>
                      {!profile?.faceEnrolled && (
                        <p style={{ fontSize: 11, color: "#EF4444", marginTop: 1 }}>Tap to enroll your face</p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 100, background: profile?.faceEnrolled ? "rgba(45,140,78,0.12)" : "rgba(239,68,68,0.1)", color: profile?.faceEnrolled ? "#2D8C4E" : "#EF4444", border: `1px solid ${profile?.faceEnrolled ? "rgba(45,140,78,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                      {profile?.faceEnrolled ? "✓ Enrolled" : "Not enrolled"}
                    </span>
                    {!profile?.faceEnrolled && (
                      <svg width="16" height="16" fill="none" stroke={t.subtext} strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                    )}
                  </div>
                </div>

                {/* CHANGE PASSWORD */}
                <div className="action-row" onClick={() => { setShowChangePassword(!showChangePassword); setPasswordError(""); setPasswordSuccess(false); setShowCurrentPw(false); setShowNextPw(false); setShowConfirmPw(false); }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: t.border, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="15" height="15" fill="none" stroke={t.subtext} strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    </div>
                    <span style={{ fontSize: 14, color: t.text, fontWeight: 500 }}>Change password</span>
                  </div>
                  <svg width="16" height="16" fill="none" stroke={t.subtext} strokeWidth="2" viewBox="0 0 24 24"><path d={showChangePassword ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}/></svg>
                </div>
                {showChangePassword && (
                  <div style={{ padding: "16px 20px", borderTop: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="pw-wrapper">
                      <input className="input-field" type={showCurrentPw ? "text" : "password"} placeholder="Current password" value={passwordForm.current} onChange={e => setPasswordForm(p => ({ ...p, current: e.target.value }))} />
                      <button className="eye-btn" onClick={() => setShowCurrentPw(p => !p)} tabIndex={-1}><EyeIcon show={showCurrentPw} /></button>
                    </div>
                    <div className="pw-wrapper">
                      <input className="input-field" type={showNextPw ? "text" : "password"} placeholder="New password (min. 8 characters)" value={passwordForm.next} onChange={e => setPasswordForm(p => ({ ...p, next: e.target.value }))} />
                      <button className="eye-btn" onClick={() => setShowNextPw(p => !p)} tabIndex={-1}><EyeIcon show={showNextPw} /></button>
                    </div>
                    <div className="pw-wrapper">
                      <input className="input-field" type={showConfirmPw ? "text" : "password"} placeholder="Confirm new password" value={passwordForm.confirm} onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))} />
                      <button className="eye-btn" onClick={() => setShowConfirmPw(p => !p)} tabIndex={-1}><EyeIcon show={showConfirmPw} /></button>
                    </div>
                    {passwordError && <div className="error-box">{passwordError}</div>}
                    {passwordSuccess && <div className="success-box">✓ Password changed successfully!</div>}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="btn-outline" onClick={() => setShowChangePassword(false)}>Cancel</button>
                      <button className="btn-primary" onClick={handleChangePassword} disabled={passwordLoading}>{passwordLoading ? "Saving…" : "Save"}</button>
                    </div>
                  </div>
                )}
              </div>

              {/* DEVICE */}
              <div className="section-card fade-up">
                <div className="section-title">Device</div>
                <div className="row-item">
                  <span className="row-label">Trusted device</span>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 100, background: localStorage.getItem("iboto-device-token") ? "rgba(45,140,78,0.12)" : "rgba(107,114,128,0.1)", color: localStorage.getItem("iboto-device-token") ? "#2D8C4E" : t.subtext, border: `1px solid ${localStorage.getItem("iboto-device-token") ? "rgba(45,140,78,0.3)" : t.border}` }}>
                    {localStorage.getItem("iboto-device-token") ? "✓ This device is trusted" : "Not trusted"}
                  </span>
                </div>
                <div className="row-item">
                  <span className="row-label">Browser</span>
                  <span className="row-value" style={{ fontSize: 12 }}>
                    {navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Firefox") ? "Firefox" : navigator.userAgent.includes("Safari") ? "Safari" : "Unknown"}
                  </span>
                </div>
                {localStorage.getItem("iboto-device-token") && (
                  <div className="action-row action-row-danger" onClick={() => { localStorage.removeItem("iboto-device-token"); window.location.reload(); }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="15" height="15" fill="none" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </div>
                      <span style={{ fontSize: 14, color: "#EF4444", fontWeight: 500 }}>Remove trusted device</span>
                    </div>
                    <svg width="16" height="16" fill="none" stroke="#EF4444" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                )}
              </div>

              {/* SIGN OUT */}
              <button onClick={handleLogout} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)", color: "#EF4444", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                Sign out
              </button>
            </>
          )}
        </div>

        {/* BOTTOM NAV */}
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: t.bg, borderTop: `1px solid ${t.border}`, padding: "12px 20px", display: "flex", justifyContent: "space-around" }}>
          {[
            { icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: "Elections", active: false, path: "/elections" },
            { icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label: "Profile", active: true, path: "/profile" },
          ].map((item, i) => (
            <button key={i} onClick={() => router.push(item.path)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: item.active ? "#2D8C4E" : t.subtext, fontFamily: "DM Sans, sans-serif", fontSize: 11, fontWeight: item.active ? 600 : 400, padding: "4px 16px", borderRadius: 10, transition: "all 0.2s" }}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* FACE ENROLLMENT BOTTOM SHEET */}
      {showFaceEnroll && (
        <div className="face-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleCloseFaceEnroll(); }}>
          <div className="face-sheet">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, fontWeight: 800, color: t.text }}>Face Enrollment</h2>
                <p style={{ fontSize: 13, color: t.subtext, marginTop: 2 }}>
                  {faceStep === "idle" && "Position your face in the frame and take a photo."}
                  {faceStep === "camera" && "Look straight at the camera, then tap capture."}
                  {faceStep === "captured" && "Looks good? Submit or retake."}
                  {faceStep === "uploading" && "Enrolling your face…"}
                  {faceStep === "success" && "Face enrolled successfully!"}
                  {faceStep === "error" && "Something went wrong. Please try again."}
                </p>
              </div>
              <button onClick={handleCloseFaceEnroll} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <svg width="22" height="22" fill="none" stroke={t.subtext} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {faceStep === "idle" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {["Make sure your face is well-lit and clearly visible.", "Remove glasses, hats, or anything covering your face.", "Look straight at the camera with a neutral expression."].map((tip, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(45,140,78,0.12)", color: "#2D8C4E", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                      <span style={{ fontSize: 13, color: t.subtext, lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
                <button className="btn-primary" onClick={startCamera}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Open Camera
                  </span>
                </button>
              </div>
            )}

            {faceStep === "camera" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="face-oval-wrap">
                  <video ref={videoRef} className="face-video" autoPlay playsInline muted />
                  <div className="face-oval-overlay">
                    <svg width="180" height="220" viewBox="0 0 180 220">
                      <ellipse cx="90" cy="110" rx="75" ry="95" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeDasharray="8 4"/>
                    </svg>
                  </div>
                </div>
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <button className="capture-btn" onClick={capturePhoto} title="Capture photo" />
                <button className="btn-outline" onClick={handleCloseFaceEnroll}>Cancel</button>
              </div>
            )}

            {faceStep === "captured" && capturedImage && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <img src={`data:image/jpeg;base64,${capturedImage}`} className="face-preview" alt="Captured face" />
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn-outline" onClick={retakePhoto}>Retake</button>
                  <button className="btn-primary" onClick={submitFaceEnroll}>Submit & Enroll</button>
                </div>
              </div>
            )}

            {faceStep === "uploading" && (
              <div style={{ textAlign: "center", padding: "24px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", border: `3px solid ${t.border}`, borderTopColor: "#2D8C4E", animation: "spin 0.8s linear infinite" }} />
                <p style={{ color: t.subtext, fontSize: 14 }}>Sending to Face++ for enrollment…</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {faceStep === "success" && (
              <div style={{ textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(45,140,78,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="32" height="32" fill="none" stroke="#2D8C4E" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Face enrolled!</p>
                  <p style={{ fontSize: 13, color: t.subtext, marginTop: 4 }}>Your face is now registered. This window will close shortly.</p>
                </div>
              </div>
            )}

            {faceStep === "error" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="error-box">{faceError}</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn-outline" onClick={handleCloseFaceEnroll}>Cancel</button>
                  <button className="btn-primary" onClick={startCamera}>Try Again</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const theme = {
  light: { bg: "#fafaf9", card: "#f4f4f0", text: "#1a1a18", subtext: "#706f69", border: "#e5e4de" },
  dark:  { bg: "#111110", card: "#1a1a18",  text: "#ebebea", subtext: "#8a8a85", border: "#2a2a27" },
};