import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { enrollFace } from "../services/faceService.js";
import { authenticateStudent } from "../middlewares/auth.js";

const router = Router();
const prisma = new PrismaClient();

router.post("/enroll/:studentId", authenticateStudent, async (req, res) => {
  const { studentId } = req.params;
  try {
    const student = await prisma.student.findFirst({ where: { studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }
    const imageBuffer = Buffer.from(imageBase64, "base64");
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

export default router;