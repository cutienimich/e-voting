import { Router } from "express";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { enrollFace, verifyFace, deleteFace } from "../services/faceService.js";
import { authenticateAdmin, authenticateStudent } from "../middlewares/auth.js";

const router = Router();
const prisma = new PrismaClient();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// POST /api/face/enroll/:studentId
router.post("/enroll/:studentId", authenticateStudent, upload.single("image"), async (req, res) => {
  const { studentId } = req.params;
  try {
    const student = await prisma.student.findFirst({ where: { studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    let imageBuffer;
    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.imageBase64) {
      imageBuffer = Buffer.from(req.body.imageBase64, "base64");
    } else {
      return res.status(400).json({ success: false, message: "No image provided" });
    }
    const { faceId } = await enrollFace(studentId, imageBuffer);
    await prisma.student.update({
      where: { id: student.id },
      data: { faceEnrolled: true, faceId },
    });
    res.json({ success: true, message: "Face enrolled successfully", faceId });
  } catch (err) {
    console.error("[face/enroll] Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/face/verify
router.post("/verify", upload.single("image"), async (req, res) => {
  try {
    let imageBuffer;
    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.imageBase64) {
      imageBuffer = Buffer.from(req.body.imageBase64, "base64");
    } else {
      return res.status(400).json({ success: false, message: "No image provided" });
    }
    const result = await verifyFace(imageBuffer);
    if (!result.match) {
      return res.status(401).json({
        success: false,
        message: result.reason || "Face verification failed",
      });
    }
    res.json({ success: true, message: "Face verified", confidence: result.confidence });
  } catch (err) {
    console.error("[face/verify] Error:", err.message);
    res.status(500).json({ success: false, message: "Face verification error" });
  }
});

// GET /api/face/status/:studentId
router.get("/status/:studentId", authenticateAdmin, async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: { studentId: req.params.studentId },
      select: { studentId: true, name: true, faceEnrolled: true },
    });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/face/:studentId
router.delete("/:studentId", authenticateAdmin, async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await deleteFace(studentId);
    await prisma.student.updateMany({
      where: { studentId },
      data: { faceEnrolled: false, faceId: null },
    });
    res.json({ success: true, message: `Removed ${result.deleted} face(s)` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;