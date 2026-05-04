// routes/faceRoutes.js
// Replaces calls to the old Python Flask face service
// Admin enrolls faces; backend verifies during login

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');

const { enrollFace, verifyFace, deleteFace } = require('../services/faceService');
const { authenticateAdmin, authenticateStudent } = require('../middleware/auth'); // your existing middleware

const prisma = new PrismaClient();

// Accept image uploads in memory (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// ── Admin: Enroll a student's face ────────────────────────────────────────
// POST /api/face/enroll/:studentId
// Form-data: image (file)  OR  body: { imageBase64: "..." }
// Protected: admin only
router.post('/enroll/:studentId', authenticateAdmin, upload.single('image'), async (req, res) => {
  const { studentId } = req.params;

  try {
    const student = await prisma.student.findFirst({ where: { studentId } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    let imageBuffer;
    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.imageBase64) {
      imageBuffer = Buffer.from(req.body.imageBase64, 'base64');
    } else {
      return res.status(400).json({ success: false, message: 'Provide image file or imageBase64' });
    }

    const { faceId } = await enrollFace(studentId, imageBuffer);

    // Mark student as face-enrolled in DB
    await prisma.student.update({
      where: { id: student.id },
      data: { faceEnrolled: true, faceId },
    });

    res.json({ success: true, message: 'Face enrolled successfully', faceId });

  } catch (err) {
    console.error('[face/enroll] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Student: Verify face during login ─────────────────────────────────────
// POST /api/face/verify
// Body: { imageBase64: "..." }  OR  Form-data: image (file)
// This is called by your login flow BEFORE issuing the JWT
router.post('/verify', upload.single('image'), async (req, res) => {
  try {
    let imageBuffer;
    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.imageBase64) {
      imageBuffer = Buffer.from(req.body.imageBase64, 'base64');
    } else {
      return res.status(400).json({ success: false, message: 'Provide image file or imageBase64' });
    }

    const result = await verifyFace(imageBuffer);

    if (!result.match) {
      return res.status(401).json({
        success: false,
        message: result.reason || 'Face verification failed',
      });
    }

    res.json({
      success: true,
      message: 'Face verified',
      studentId: result.studentId,
      confidence: result.confidence,
    });

  } catch (err) {
    console.error('[face/verify] Error:', err.message);
    res.status(500).json({ success: false, message: 'Face verification error' });
  }
});

// ── Admin: Check face enrollment status ──────────────────────────────────
// GET /api/face/status/:studentId
router.get('/status/:studentId', authenticateAdmin, async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: { studentId: req.params.studentId },
      select: { studentId: true, name: true, faceEnrolled: true },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: Remove a student's face ────────────────────────────────────────
// DELETE /api/face/:studentId
router.delete('/:studentId', authenticateAdmin, async (req, res) => {
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

module.exports = router;
