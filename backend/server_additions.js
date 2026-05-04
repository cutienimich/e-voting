// server.js — Add these lines to your existing Express server

const express = require('express');
const app = express();

// ... your existing middleware (cors, helmet, etc.) ...

// ── New routes ─────────────────────────────────────────────
const passwordResetRoutes = require('./routes/passwordReset');
const faceRoutes = require('./routes/faceRoutes');

app.use('/api/auth', passwordResetRoutes);   // POST /api/auth/forgot-password
                                              // POST /api/auth/reset-password

app.use('/api/face', faceRoutes);             // POST /api/face/enroll/:studentId
                                              // POST /api/face/verify
                                              // GET  /api/face/status/:studentId
                                              // DELETE /api/face/:studentId

// ── Initialize AWS Rekognition collection on startup ───────
const { ensureCollection } = require('./services/faceService');
ensureCollection().catch(console.error);

// ... rest of your server (app.listen, etc.) ...
