// services/smsService.js
// SMS OTP via Semaphore (Philippines)
// Sign up: https://semaphore.co  |  Free tier: 50 SMS/day
// .env: SEMAPHORE_API_KEY=re_CSBj1Bsk_143kF7JQpX77fvby7PWzEDyq  SEMAPHORE_SENDER=IBOTO

const crypto = require('crypto');

// In-memory OTP store — replace with Redis or DB table in production
const smsOtpStore = new Map(); // { phone: { otp, expiresAt } }

// ─── SEND SMS ─────────────────────────────────────────────────────────────

/**
 * Send a raw SMS message via Semaphore.
 * @param {string} phoneNumber - Format: 09XXXXXXXXX or +639XXXXXXXXX
 * @param {string} message
 */
async function sendSMS(phoneNumber, message) {
  const fetch = (await import('node-fetch')).default;

  const params = new URLSearchParams({
    apikey: process.env.SEMAPHORE_API_KEY,
    number: phoneNumber,
    message,
    sendername: process.env.SEMAPHORE_SENDER || 'IBOTO',
  });

  const res = await fetch('https://api.semaphore.co/api/v4/messages', {
    method: 'POST',
    body: params,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Semaphore error: ${JSON.stringify(data)}`);
  return data;
}

// ─── OTP HELPERS ──────────────────────────────────────────────────────────

/**
 * Generate a 6-digit OTP and send it via SMS.
 * @param {string} phoneNumber
 */
async function sendPasswordResetSMSOTP(phoneNumber) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  smsOtpStore.set(phoneNumber, { otp, expiresAt });

  const message = `Your iboto password reset OTP is: ${otp}\nValid for 10 minutes. Do not share this code.`;
  await sendSMS(phoneNumber, message);

  return { success: true, message: 'OTP sent via SMS' };
}

/**
 * Verify the SMS OTP submitted by the student.
 * @param {string} phoneNumber
 * @param {string} submittedOtp
 * @returns {{ valid: boolean, reason?: string }}
 */
function verifySMSOTP(phoneNumber, submittedOtp) {
  const record = smsOtpStore.get(phoneNumber);

  if (!record) return { valid: false, reason: 'No OTP requested for this number' };
  if (Date.now() > record.expiresAt) {
    smsOtpStore.delete(phoneNumber);
    return { valid: false, reason: 'OTP has expired' };
  }
  if (record.otp !== submittedOtp.toString()) {
    return { valid: false, reason: 'Incorrect OTP' };
  }

  smsOtpStore.delete(phoneNumber); // one-time use
  return { valid: true };
}

module.exports = { sendSMS, sendPasswordResetSMSOTP, verifySMSOTP };
