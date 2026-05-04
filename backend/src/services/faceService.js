// services/faceService.js
// Face verification via Face++ (Faceplusplus)
// Sign up: https://www.faceplusplus.com  |  Free tier: 1,000 calls/month
// .env: FACEPP_API_KEY=3nTpDYLRVJskJSHqV1A3kgqLuz1vWfdR  FACEPP_API_SECRET=3nTpDYLRVJskJSHqV1A3kgqLuz1vWfdR

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const FormData = require('form-data');

const FACEPP_API = 'https://api-us.faceplusplus.com/facepp/v3';

// Face++ uses "FaceSets" to group enrolled faces — one FaceSet for all students
const FACESET_TOKEN = process.env.FACEPP_FACESET_TOKEN || null;

// ─── INIT ──────────────────────────────────────────────────────────────────

/**
 * Create a FaceSet to store all student faces.
 * Call this ONCE manually or on first run to get your FACEPP_FACESET_TOKEN.
 * Paste the returned faceset_token into your .env
 */
async function createFaceSet() {
  const form = new FormData();
  form.append('api_key', process.env.FACEPP_API_KEY);
  form.append('api_secret', process.env.FACEPP_API_SECRET);
  form.append('display_name', 'iboto-students');
  form.append('outer_id', 'iboto-students'); // unique identifier

  const res = await fetch(`${FACEPP_API}/faceset/create`, {
    method: 'POST',
    body: form,
  });

  const data = await res.json();
  if (data.error_message) throw new Error(`Face++ error: ${data.error_message}`);

  console.log('[face] FaceSet created. Save this token in your .env as FACEPP_FACESET_TOKEN:');
  console.log(data.faceset_token);
  return data.faceset_token;
}

// ─── DETECT (get face_token from image) ───────────────────────────────────

async function detectFace(imageBuffer) {
  const form = new FormData();
  form.append('api_key', process.env.FACEPP_API_KEY);
  form.append('api_secret', process.env.FACEPP_API_SECRET);
  form.append('image_file', imageBuffer, { filename: 'face.jpg', contentType: 'image/jpeg' });

  const res = await fetch(`${FACEPP_API}/detect`, {
    method: 'POST',
    body: form,
  });

  const data = await res.json();
  if (data.error_message) throw new Error(`Face++ error: ${data.error_message}`);
  if (!data.faces || data.faces.length === 0) throw new Error('No face detected in image. Please use a clear, well-lit photo.');

  return data.faces[0].face_token;
}

// ─── ENROLL ───────────────────────────────────────────────────────────────

/**
 * Enroll a student's face into the FaceSet.
 * @param {string} studentId - e.g. "24-00235"
 * @param {Buffer|string} imageBuffer - Raw image buffer OR base64 string
 * @returns {{ faceToken: string }}
 */
async function enrollFace(studentId, imageBuffer) {
  const imgBuffer =
    typeof imageBuffer === 'string'
      ? Buffer.from(imageBuffer, 'base64')
      : imageBuffer;

  // Step 1: Detect face and get face_token
  const faceToken = await detectFace(imgBuffer);

  // Step 2: Add face_token to FaceSet
  const form = new FormData();
  form.append('api_key', process.env.FACEPP_API_KEY);
  form.append('api_secret', process.env.FACEPP_API_SECRET);
  form.append('outer_id', 'iboto-students');
  form.append('face_tokens', faceToken);

  const res = await fetch(`${FACEPP_API}/faceset/addface`, {
    method: 'POST',
    body: form,
  });

  const data = await res.json();
  if (data.error_message) throw new Error(`Face++ error: ${data.error_message}`);

  console.log(`[face] Enrolled face for student ${studentId}: ${faceToken}`);
  return { faceToken, studentId };
}

// ─── VERIFY ───────────────────────────────────────────────────────────────

/**
 * Verify a live face against the enrolled FaceSet.
 * @param {Buffer|string} imageBuffer - Live capture from the student
 * @returns {{ match: boolean, studentId?: string, confidence?: number }}
 */
async function verifyFace(imageBuffer) {
  const imgBuffer =
    typeof imageBuffer === 'string'
      ? Buffer.from(imageBuffer, 'base64')
      : imageBuffer;

  // Step 1: Detect face from live image
  let faceToken;
  try {
    faceToken = await detectFace(imgBuffer);
  } catch (err) {
    return { match: false, reason: err.message };
  }

  // Step 2: Search FaceSet for a match
  const form = new FormData();
  form.append('api_key', process.env.FACEPP_API_KEY);
  form.append('api_secret', process.env.FACEPP_API_SECRET);
  form.append('outer_id', 'iboto-students');
  form.append('face_token', faceToken);

  const res = await fetch(`${FACEPP_API}/search`, {
    method: 'POST',
    body: form,
  });

  const data = await res.json();
  if (data.error_message) throw new Error(`Face++ error: ${data.error_message}`);

  if (!data.results || data.results.length === 0) {
    return { match: false, reason: 'Face not recognized' };
  }

  const best = data.results[0];
  const confidence = best.confidence; // 0–100

  // Face++ recommends 73+ as a valid match threshold
  if (confidence < 73) {
    return { match: false, reason: 'Face confidence too low', confidence };
  }

  console.log(`[face] Matched face_token ${best.face_token} with ${confidence.toFixed(1)}% confidence`);
  return { match: true, faceToken: best.face_token, confidence };
}

// ─── REMOVE ───────────────────────────────────────────────────────────────

/**
 * Remove a student's face from the FaceSet.
 * @param {string} faceToken - stored in DB during enrollment
 */
async function deleteFace(faceToken) {
  const form = new FormData();
  form.append('api_key', process.env.FACEPP_API_KEY);
  form.append('api_secret', process.env.FACEPP_API_SECRET);
  form.append('outer_id', 'iboto-students');
  form.append('face_tokens', faceToken);

  const res = await fetch(`${FACEPP_API}/faceset/removeface`, {
    method: 'POST',
    body: form,
  });

  const data = await res.json();
  if (data.error_message) throw new Error(`Face++ error: ${data.error_message}`);

  console.log(`[face] Deleted face token: ${faceToken}`);
  return { deleted: true };
}

module.exports = { createFaceSet, enrollFace, verifyFace, deleteFace };
