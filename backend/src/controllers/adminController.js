import bcrypt from "bcryptjs";
import prisma from "../services/prisma.js";
import { contract } from "../utils/blockchain.js";
import { sanitizeString } from "../utils/sanitize.js";
import fetch from "node-fetch";

export const createAdmin = async (req, res) => {
  try {
    const username = sanitizeString(req.body.username);
    const password = req.body.password;
    const hashed = await bcrypt.hash(password, 12);
    const admin = await prisma.admin.create({ data: { username, password: hashed } });
    return res.status(201).json({ success: true, message: "Admin created", data: { username: admin.username } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const enrollStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const student = await prisma.student.update({
      where: { studentId: sanitizeString(studentId) },
      data: { isEnrolled: true }
    });
    return res.json({ success: true, message: "Student enrolled", data: { studentId: student.studentId } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export const createElection = async (req, res) => {
  try {
    const name = sanitizeString(req.body.name);

    // MOCK — skip blockchain for testing
    const blockchainId = Math.floor(Math.random() * 10000);
    const mockTxHash = "0xmock_" + Date.now();

    const election = await prisma.election.create({
      data: { blockchainId, name }
    });

    return res.status(201).json({ success: true, message: "Election created", data: election });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addCandidate = async (req, res) => {
  try {
    const { electionId, name, position } = req.body;
    const election = await prisma.election.findUnique({ where: { id: sanitizeString(electionId) } });
    if (!election) return res.status(404).json({ success: false, message: "Election not found" });

    // MOCK — skip blockchain for testing
    const blockchainId = election.candidates ? election.candidates.length : 0;

    const candidate = await prisma.candidate.create({
      data: {
        blockchainId,
        electionId,
        name: sanitizeString(name),
        position: sanitizeString(position)
      }
    });

    return res.status(201).json({ success: true, message: "Candidate added", data: candidate });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const openElection = async (req, res) => {
  try {
    const election = await prisma.election.findUnique({ where: { id: req.params.id } });
    if (!election) return res.status(404).json({ success: false, message: "Not found" });

    // MOCK — skip blockchain for testing
    const updated = await prisma.election.update({
      where: { id: election.id },
      data: { isOpen: true, startTime: new Date() }
    });

    return res.json({ success: true, message: "Election opened", data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const closeElection = async (req, res) => {
  try {
    const election = await prisma.election.findUnique({ where: { id: req.params.id } });
    if (!election) return res.status(404).json({ success: false, message: "Not found" });

    // MOCK — skip blockchain for testing
    const updated = await prisma.election.update({
      where: { id: election.id },
      data: { isOpen: false, endTime: new Date() }
    });

    return res.json({ success: true, message: "Election closed", data: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      select: { id: true, studentId: true, name: true, email: true, isEnrolled: true, createdAt: true }
    });
    return res.json({ success: true, data: students });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addEnrolledStudent = async (req, res) => {
  try {
    const studentId = sanitizeString(req.body.studentId);
    const name = sanitizeString(req.body.name);
    const course = sanitizeString(req.body.course);
    const year = sanitizeString(req.body.year);

    if (!studentId || !name || !course || !year) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const existing = await prisma.enrolledStudent.findUnique({ where: { studentId } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Student ID already in list" });
    }

    const student = await prisma.enrolledStudent.create({
      data: { studentId, name, course, year }
    });

    return res.status(201).json({ success: true, message: "Student added to enrolled list", data: student });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const bulkAddEnrolledStudents = async (req, res) => {
  try {
    const students = req.body.students;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: "Students array required" });
    }

    const data = students.map(s => ({
      studentId: sanitizeString(s.studentId),
      name: sanitizeString(s.name),
      course: sanitizeString(s.course),
      year: sanitizeString(s.year)
    }));

    const result = await prisma.enrolledStudent.createMany({
      data,
      skipDuplicates: true
    });

    return res.status(201).json({
      success: true,
      message: `${result.count} students added`,
      data: { count: result.count }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}; 

export const enrollFace = async (req, res) => {
  try {
    const { studentId, image } = req.body;

    if (!studentId || !image) {
      return res.status(400).json({ success: false, message: "studentId and image required" });
    }

    // Check student exist
    const student = await prisma.student.findUnique({
      where: { studentId: sanitizeString(studentId) }
    });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Send to face service
    const response = await fetch(`${process.env.FACE_SERVICE_URL}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, image })
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

export const getFaceStatus = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { studentId: sanitizeString(studentId) }
    });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const response = await fetch(`${process.env.FACE_SERVICE_URL}/status/${studentId}`);
    const data = await response.json();

    return res.json({ success: true, data: { studentId, faceEnrolled: data.enrolled } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};