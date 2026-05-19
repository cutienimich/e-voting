import fetch from "node-fetch";
import FormData from "form-data";

const FACEPP_API = "https://api-us.faceplusplus.com/facepp/v3";

// ── AUTO SETUP FACESET ON SERVER START ──────────────────────
async function ensureFaceSet() {
  try {
    // Try to get existing faceset first
    const form = new FormData();
    form.append("api_key", process.env.FACEPP_API_KEY);
    form.append("api_secret", process.env.FACEPP_API_SECRET);
    form.append("outer_id", "iboto-students");

    const res = await fetch(`${FACEPP_API}/faceset/getdetail`, { method: "POST", body: form });
    const data = await res.json();

    if (data.faceset_token) {
      console.log("[face] FaceSet already exists ✓");
      return;
    }

    // Faceset not found, create it
    const createForm = new FormData();
    createForm.append("api_key", process.env.FACEPP_API_KEY);
    createForm.append("api_secret", process.env.FACEPP_API_SECRET);
    createForm.append("display_name", "iboto-students");
    createForm.append("outer_id", "iboto-students");

    const createRes = await fetch(`${FACEPP_API}/faceset/create`, { method: "POST", body: createForm });
    const createData = await createRes.json();

    if (createData.error_message) throw new Error(createData.error_message);
    console.log("[face] FaceSet created successfully ✓");

  } catch (err) {
    console.error("[face] FaceSet setup error:", err.message);
  }
}

// Call this when server starts!
ensureFaceSet();

// ── DETECT ───────────────────────────────────────────────────
async function detectFace(imageBuffer) {
  const form = new FormData();
  form.append("api_key", process.env.FACEPP_API_KEY);
  form.append("api_secret", process.env.FACEPP_API_SECRET);
  form.append("image_file", imageBuffer, { filename: "face.jpg", contentType: "image/jpeg" });

  const res = await fetch(`${FACEPP_API}/detect`, { method: "POST", body: form });
  const data = await res.json();
  if (data.error_message) throw new Error(`Face++ error: ${data.error_message}`);
  if (!data.faces || data.faces.length === 0) throw new Error("No face detected. Use a clear, well-lit photo.");
  return data.faces[0].face_token;
}

// ── ENROLL ───────────────────────────────────────────────────
export async function enrollFace(studentId, imageBuffer) {
  const imgBuffer = typeof imageBuffer === "string" ? Buffer.from(imageBuffer, "base64") : imageBuffer;
  const faceToken = await detectFace(imgBuffer);

  const form = new FormData();
  form.append("api_key", process.env.FACEPP_API_KEY);
  form.append("api_secret", process.env.FACEPP_API_SECRET);
  form.append("outer_id", "iboto-students");
  form.append("face_tokens", faceToken);

  const res = await fetch(`${FACEPP_API}/faceset/addface`, { method: "POST", body: form });
  const data = await res.json();
  if (data.error_message) throw new Error(`Face++ error: ${data.error_message}`);

  console.log(`[face] Enrolled student ${studentId}: ${faceToken}`);
  return { faceId: faceToken };
}

// ── VERIFY ───────────────────────────────────────────────────
export async function verifyFace(imageBuffer) {
  const imgBuffer = typeof imageBuffer === "string" ? Buffer.from(imageBuffer, "base64") : imageBuffer;
  let faceToken;
  try { faceToken = await detectFace(imgBuffer); }
  catch (err) { return { match: false, reason: err.message }; }

  const form = new FormData();
  form.append("api_key", process.env.FACEPP_API_KEY);
  form.append("api_secret", process.env.FACEPP_API_SECRET);
  form.append("outer_id", "iboto-students");
  form.append("face_token", faceToken);

  const res = await fetch(`${FACEPP_API}/search`, { method: "POST", body: form });
  const data = await res.json();
  if (data.error_message) throw new Error(`Face++ error: ${data.error_message}`);
  if (!data.results || data.results.length === 0) return { match: false, reason: "Face not recognized" };

  const best = data.results[0];
  if (best.confidence < 73) return { match: false, reason: "Face confidence too low", confidence: best.confidence };
  return { match: true, faceToken: best.face_token, confidence: best.confidence };
}

// ── DELETE ───────────────────────────────────────────────────
export async function deleteFace(faceToken) {
  const form = new FormData();
  form.append("api_key", process.env.FACEPP_API_KEY);
  form.append("api_secret", process.env.FACEPP_API_SECRET);
  form.append("outer_id", "iboto-students");
  form.append("face_tokens", faceToken);

  const res = await fetch(`${FACEPP_API}/faceset/removeface`, { method: "POST", body: form });
  const data = await res.json();
  if (data.error_message) throw new Error(`Face++ error: ${data.error_message}`);
  return { deleted: true };
}