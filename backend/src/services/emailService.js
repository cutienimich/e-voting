// services/emailService.js
// Password reset OTP via Resend
// Sign up: https://resend.com  |  Free tier: 3,000 emails/month
// .env: RESEND_API_KEY=re_CSBj1Bsk_143kF7JQpX77fvby7PWzEDyq  RESEND_FROM=iboto <noreply@yourdomain.com>

const { Resend } = require('resend');
const crypto = require('crypto');

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory OTP store — replace with Redis or DB table in production
const otpStore = new Map(); // { email: { otp, expiresAt } }

// ─── SEND OTP ─────────────────────────────────────────────────────────────

/**
 * Generate a 6-digit OTP, store it, and email it to the student.
 * @param {string} toEmail - Student's registered email
 * @param {string} studentName - For personalization
 */
async function sendPasswordResetOTP(toEmail, studentName) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(toEmail, { otp, expiresAt });

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || 'iboto <noreply@yourdomain.com>',
    to: toEmail,
    subject: 'iboto — Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #166534;">iboto Password Reset</h2>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>Your one-time password (OTP) for resetting your iboto account password is:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #166534; text-align: center; margin: 24px 0;">
          ${otp}
        </div>
        <p>This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p style="color: #6b7280; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
        <hr style="border-color: #e5e7eb;" />
        <p style="color: #6b7280; font-size: 12px;">iboto — Colegio de Montalban e-Voting System</p>
      </div>
    `,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);

  return { success: true, message: 'OTP sent to email' };
}

// ─── VERIFY OTP ───────────────────────────────────────────────────────────

/**
 * Verify the OTP submitted by the student.
 * @param {string} email
 * @param {string} submittedOtp
 * @returns {{ valid: boolean, reason?: string }}
 */
function verifyOTP(email, submittedOtp) {
  const record = otpStore.get(email);

  if (!record) return { valid: false, reason: 'No OTP requested for this email' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return { valid: false, reason: 'OTP has expired' };
  }
  if (record.otp !== submittedOtp.toString()) {
    return { valid: false, reason: 'Incorrect OTP' };
  }

  otpStore.delete(email); // one-time use
  return { valid: true };
}

module.exports = { sendPasswordResetOTP, verifyOTP };
