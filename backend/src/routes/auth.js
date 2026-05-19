import { Router } from "express";

import {
  registerStudent, loginStudent, loginAdmin,
  refreshAccessToken, logoutStudent, enrollStudentFace,
  verifyPasswordForVote, resendVerificationEmail,
  validateStudent, sendOtp, getMe  // ADD getMe HERE!
} from "../controllers/authController.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { authenticateStudent } from "../middlewares/auth.js"; // ADD THIS!

const router = Router();

router.post("/enroll-face", enrollStudentFace);
router.post("/register", authLimiter, registerStudent);
router.post("/login", authLimiter, loginStudent);
router.post("/admin/login", authLimiter, loginAdmin);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutStudent);
router.post("/validate-student", validateStudent);
router.post("/send-otp", sendOtp);
router.get("/me", authenticateStudent, getMe); // ADD THIS LINE!

export default router;