// routes/passwordReset.js
// Password reset flow: request OTP → verify OTP → set new password
// Works with both email (Gmail) and SMS (Semaphore/Twilio)

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const { sendPasswordResetOTP, verifyOTP } = require('../services/emailService');
const { sendPasswordResetSMSOTP, verifySMSOTP } = require('../services/smsService');

const prisma = new PrismaClient();

// ── Step 1: Request OTP ────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// Body: { method: "email" | "sms", contact: "email@..." | "09XXXXXXXXX" }
router.post('/forgot-password', async (req, res) => {
  const { method, contact } = req.body;

  if (!method || !contact) {
    return res.status(400).json({ success: false, message: 'method and contact are required' });
  }

  try {
    let student;

    if (method === 'email') {
      student = await prisma.student.findFirst({ where: { email: contact } });
    } else if (method === 'sms') {
      student = await prisma.student.findFirst({ where: { phone: contact } });
    } else {
      return res.status(400).json({ success: false, message: 'method must be "email" or "sms"' });
    }

    // Always return success to avoid user enumeration attacks
    if (!student) {
      return res.json({ success: true, message: 'If an account exists, an OTP has been sent.' });
    }

    if (method === 'email') {
      await sendPasswordResetOTP(contact, student.name);
    } else {
      await sendPasswordResetSMSOTP(contact);
    }

    res.json({ success: true, message: 'OTP sent. Valid for 10 minutes.' });

  } catch (err) {
    console.error('[password-reset] Error sending OTP:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Try again later.' });
  }
});

// ── Step 2: Verify OTP + Set New Password ─────────────────────────────────
// POST /api/auth/reset-password
// Body: { method: "email"|"sms", contact, otp, newPassword }
router.post('/reset-password', async (req, res) => {
  const { method, contact, otp, newPassword } = req.body;

  if (!method || !contact || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  try {
    // Verify OTP
    let result;
    if (method === 'email') {
      result = verifyOTP(contact, otp);
    } else if (method === 'sms') {
      result = verifySMSOTP(contact, otp);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid method' });
    }

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason });
    }

    // Find student
    const student = await prisma.student.findFirst({
      where: method === 'email' ? { email: contact } : { phone: contact },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // Update password
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.student.update({
      where: { id: student.id },
      data: { password: hashed },
    });

    res.json({ success: true, message: 'Password reset successful. You can now log in.' });

  } catch (err) {
    console.error('[password-reset] Error resetting password:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

module.exports = router;
