import express from "express";
import { authenticateStudent } from "../middlewares/auth.js"; // ← hindi verifyToken!
import prisma from "../services/prisma.js"; // ← hindi utils!

const router = express.Router();

router.get("/", authenticateStudent, async (req, res) => {
  try {
    const { electionId } = req.query;
    if (!electionId) return res.status(400).json({ success: false, message: "electionId required" });
    const candidates = await prisma.candidate.findMany({
      where: { electionId: electionId }
    });
    res.json({ success: true, data: candidates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;