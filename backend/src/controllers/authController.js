import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import fetch from "node-fetch";
import prisma from "../services/prisma.js";
import { sanitizeString } from "../utils/sanitize.js";
import { sendEmailVerification, verifyEmailToken } from "../services/emailService.js";

// ── Helpers ────────────────────────────────────────

const generateAccessToken = (student) => {
  return jwt.sign(
    { id: student.id, studentId: student.studentId, role: "student" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

const verifyFaceWithService = async (studentId, imageBase64) => {
  try {
    const response = await fetch(`${process.env.FACE_SERVICE_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, image: imageBase64 })
    });
    const data = await response.json();
    return data.success && data.match;
  } catch (err) {
    console.error("Face service error:", err);
    return false;
  }
};

// ── Student Auth ───────────────────────────────────

export const registerStudent = async (req, res) => {
  try {
    const studentId = sanitizeString(req.body.studentId);
    const email = sanitizeString(req.body.email);
    const password = req.body.password;
    const otp = req.body.otp;

    if (!studentId || !email || !password || !otp) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    // Verify OTP
    const otpResult = verifyEmailToken(email, otp);
    if (!otpResult.valid) {
      return res.status(400).json({ success: false, message: otpResult.reason });
    }

    // Check registrar list
    const enrolled = await prisma.enrolledStudent.findUnique({ where: { studentId } });
    if (!enrolled) {
      return res.status(404).json({ success: false, message: "Student ID not found." });
    }

    // Check already registered
    const existing = await prisma.student.findFirst({
      where: { OR: [{ studentId }, { email }] }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "Student already registered" });
    }

    const hashed = await bcrypt.hash(password, 12);
    const student = await prisma.student.create({
      data: {
        studentId,
        name: enrolled.name,
        email,
        password: hashed,
        isEnrolled: true
      }
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: { id: student.id, studentId: student.studentId, name: student.name }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const loginStudent = async (req, res) => {
  try {
    const studentId = sanitizeString(req.body.studentId);
    const password = req.body.password;
    const imageBase64 = req.body.image;
    const deviceToken = req.body.deviceToken;
    const deviceInfo = sanitizeString(req.body.deviceInfo || "Unknown device");

    if (!studentId || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    // Find student
    const student = await prisma.student.findUnique({ where: { studentId } });
    if (!student) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!student.isEnrolled) {
      return res.status(403).json({ success: false, message: "Student not enrolled" });
    }

    // Check password
    const match = await bcrypt.compare(password, student.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check face enrolled
    const faceEnrolled = true; // TODO: replace with real check

    // Face not enrolled yet — redirect to enrollment
    if (!faceEnrolled) {
// TEMPORARY — skip face scan, issue tokens directly
const accessToken = generateAccessToken(student);
const refreshToken = generateRefreshToken();

await prisma.refreshToken.create({
  data: {
    token: refreshToken,
    studentId: student.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
});

return res.json({
  success: true,
  faceEnrolled: true,
  deviceTrusted: true, // treat as trusted temporarily
  message: "Login successful",
  data: {
    accessToken,
    refreshToken,
    name: student.name,
    studentId: student.studentId
  }
});
    }

    // Check if device is trusted
    let deviceTrusted = false;
    if (deviceToken) {
      const existingDevice = await prisma.deviceToken.findFirst({
        where: { token: deviceToken, studentId: student.id }
      });
      deviceTrusted = !!existingDevice;
    }

    // Trusted device — skip face scan
    if (deviceTrusted) {
      const accessToken = generateAccessToken(student);
      const refreshToken = generateRefreshToken();

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          studentId: student.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      return res.json({
        success: true,
        faceEnrolled: true,
        deviceTrusted: true,
        message: "Login successful",
        data: {
          accessToken,
          refreshToken,
          name: student.name,
          studentId: student.studentId
        }
      });
    }

    // New device — need face scan
    if (!imageBase64) {
      // TEMPORARY — skip face scan, issue tokens directly
      const accessToken = generateAccessToken(student);
      const refreshToken = generateRefreshToken();

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          studentId: student.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      return res.json({
        success: true,
        faceEnrolled: true,
        deviceTrusted: true, // treat as trusted temporarily
        message: "Login successful",
        data: {
          accessToken,
          refreshToken,
          name: student.name,
          studentId: student.studentId
        }
      });
    }

    // Verify face
    const faceMatch = await verifyFaceWithService(studentId, imageBase64);
    if (!faceMatch) {
      return res.status(401).json({ success: false, message: "Face verification failed. Try again." });
    }

    // Face passed — save device as trusted
    const newDeviceToken = crypto.randomBytes(32).toString("hex");
    await prisma.deviceToken.create({
      data: {
        token: newDeviceToken,
        studentId: student.id,
        deviceInfo
      }
    });

    // Issue tokens
    const accessToken = generateAccessToken(student);
    const refreshToken = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        studentId: student.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return res.json({
      success: true,
      faceEnrolled: true,
      deviceTrusted: false,
      message: "Login successful. Device trusted.",
      data: {
        accessToken,
        refreshToken,
        deviceToken: newDeviceToken,
        name: student.name,
        studentId: student.studentId
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token required" });
    }

    // Find token in DB
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { student: true }
    });

    if (!tokenRecord) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    // Check expiry
    if (tokenRecord.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
      return res.status(401).json({ success: false, message: "Refresh token expired. Login again." });
    }

    // Issue new access token
    const accessToken = generateAccessToken(tokenRecord.student);

    return res.json({
      success: true,
      message: "Token refreshed",
      data: { accessToken }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const logoutStudent = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token required" });
    }

    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });

    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Admin Auth ─────────────────────────────────────

export const loginAdmin = async (req, res) => {
  try {
    const username = sanitizeString(req.body.username);
    const password = req.body.password;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "4h" }
    );

    return res.json({
      success: true,
      message: "Admin login successful",
      data: { token, username: admin.username }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Face Helpers ───────────────────────────────────

const checkFaceEnrolled = async (studentId) => {
  try {
    const response = await fetch(`${process.env.FACE_SERVICE_URL}/status/${studentId}`);
    const data = await response.json();
    return data.enrolled;
  } catch {
    return false;
  }
};

export const enrollStudentFace = async (req, res) => {
  try {
    const studentId = sanitizeString(req.body.studentId);
    const imageBase64 = req.body.image;

    if (!studentId || !imageBase64) {
      return res.status(400).json({ success: false, message: "studentId and image required" });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({ where: { studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Check not already enrolled
    const alreadyEnrolled = await checkFaceEnrolled(studentId);
    if (alreadyEnrolled) {
      return res.status(409).json({ success: false, message: "Face already enrolled. Contact admin to re-enroll." });
    }

    // Send to face service
    const response = await fetch(`${process.env.FACE_SERVICE_URL}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, image: imageBase64 })
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(400).json({ success: false, message: data.message });
    }

    return res.json({ success: true, message: "Face enrolled successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const validateStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: "Student ID required" });

    const enrolled = await prisma.enrolledStudent.findUnique({
      where: { studentId: studentId.trim() }
    });

    if (!enrolled) {
      return res.status(404).json({
        success: false,
        message: "Student ID not found. Contact your registrar."
      });
    }

    const existing = await prisma.student.findUnique({
      where: { studentId: studentId.trim() }
    });

    if (existing) {
      return res.json({
        success: true,
        alreadyRegistered: true,
        message: "Already registered"
      });
    }

    return res.json({
      success: true,
      alreadyRegistered: false,
      student: {
        name: enrolled.name,
        course: enrolled.course,
        year: enrolled.year,
        studentId: enrolled.studentId
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { studentId, email } = req.body;
    if (!studentId || !email) {
      return res.status(400).json({ success: false, message: "Student ID and email required" });
    }

    // Check enrolled
    const enrolled = await prisma.enrolledStudent.findUnique({
      where: { studentId: studentId.trim() }
    });
    if (!enrolled) {
      return res.status(404).json({ success: false, message: "Student ID not found" });
    }

    // Check email not taken
    const emailTaken = await prisma.student.findUnique({ where: { email: email.trim() } });
    if (emailTaken) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }

    await sendEmailVerification(email.trim(), enrolled.name);

    return res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyPasswordForVote = async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const password = req.body.password;

    if (!password) return res.status(400).json({ success: false, message: "Password required" });

    const student = await prisma.student.findUnique({ where: { studentId } });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const match = await bcrypt.compare(password, student.password);
    if (!match) return res.status(401).json({ success: false, message: "Incorrect password" });

    return res.json({ success: true, message: "Password verified" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const student = await prisma.student.findUnique({ where: { email } });
    if (!student) return res.status(404).json({ success: false, message: "Email not found" });

    await sendEmailVerification(email, student.name);
    return res.json({ success: true, message: "Verification code resent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
      select: {
        studentId: true, name: true, email: true,
        birthday: true, course: true, yearLevel: true,
        section: true, address: true, faceEnrolled: true,
        createdAt: true,
      }
    });
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    return res.json({ success: true, data: student });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Email Change ───────────────────────────────────

export const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const studentId = req.user.id;

    if (!newEmail) {
      return res.status(400).json({ success: false, message: "New email required" });
    }

    // Check email not already taken
    const emailTaken = await prisma.student.findUnique({ where: { email: newEmail.trim() } });
    if (emailTaken) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    await sendEmailVerification(newEmail.trim(), student.name);

    return res.json({ success: true, message: "OTP sent to new email" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyEmailChange = async (req, res) => {
  try {
    const { otp, newEmail } = req.body;
    const studentId = req.user.id;

    if (!otp || !newEmail) {
      return res.status(400).json({ success: false, message: "OTP and new email required" });
    }

    const result = verifyEmailToken(newEmail.trim(), otp.toString());
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason });
    }

    await prisma.student.update({
      where: { id: studentId },
      data: { email: newEmail.trim() }
    });

    return res.json({ success: true, message: "Email updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { birthday, yearLevel, section, course, address } = req.body;
    const updated = await prisma.student.update({
      where: { id: req.user.id },
      data: { birthday: birthday ? new Date(birthday) : null, 
              yearLevel, section, course, address },
    });
    return res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};