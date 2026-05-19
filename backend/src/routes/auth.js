import { Router } from "express";

import {
  registerStudent, loginStudent, loginAdmin,
  refreshAccessToken, logoutStudent, enrollStudentFace,
 verifyPasswordForVote, resendVerificationEmail,
  validateStudent, sendOtp
} from "../controllers/authController.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

router.post("/enroll-face", enrollStudentFace);
router.post("/register", authLimiter, registerStudent);
router.post("/login", authLimiter, loginStudent);
router.post("/admin/login", authLimiter, loginAdmin);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutStudent);
router.post("/validate-student", validateStudent);
router.post("/send-otp", sendOtp);

export default router;