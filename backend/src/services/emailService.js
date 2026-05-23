import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ← Gawa ng transporter pag kailangan lang, hindi sa startup!
const getTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// In-memory OTP store
const otpStore = new Map();

async function sendEmailVerification(toEmail, studentName) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(toEmail, { otp, expiresAt });

  await getTransporter().sendMail({
    from: `"iboto" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'iboto — Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #166534;">iboto Email Verification</h2>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>Your OTP to verify your email is:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #166534; text-align: center; margin: 24px 0;">
          ${otp}
        </div>
        <p>Valid for <strong>10 minutes</strong>. Do not share it.</p>
        <hr style="border-color: #e5e7eb;" />
        <p style="color: #6b7280; font-size: 12px;">iboto — Colegio de Montalban e-Voting System</p>
      </div>
    `,
  });

  return { success: true, message: 'OTP sent to email' };
}

function verifyEmailToken(email, submittedOtp) {
  const record = otpStore.get(email);
  if (!record) return { valid: false, reason: 'No OTP requested for this email' };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return { valid: false, reason: 'OTP has expired' };
  }
  if (record.otp !== submittedOtp.toString()) {
    return { valid: false, reason: 'Incorrect OTP' };
  }
  otpStore.delete(email);
  return { valid: true };
}

async function sendPasswordResetOTP(toEmail, studentName) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000;
  otpStore.set(toEmail, { otp, expiresAt });

  await getTransporter().sendMail({
    from: `"iboto" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'iboto — Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #166534;">iboto Password Reset</h2>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>Your OTP for resetting your password is:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #166534; text-align: center; margin: 24px 0;">
          ${otp}
        </div>
        <p>Valid for <strong>10 minutes</strong>. Do not share it.</p>
        <hr style="border-color: #e5e7eb;" />
        <p style="color: #6b7280; font-size: 12px;">iboto — Colegio de Montalban e-Voting System</p>
      </div>
    `,
  });

  return { success: true, message: 'OTP sent to email' };
}

function verifyOTP(email, submittedOtp) {
  return verifyEmailToken(email, submittedOtp);
}

export { sendEmailVerification, verifyEmailToken, sendPasswordResetOTP, verifyOTP };