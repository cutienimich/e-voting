import { Router } from "express";

import {
  registerStudent, loginStudent, loginAdmin,
  refreshAccessToken, logoutStudent, enrollStudentFace
} from "../controllers/authController.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

router.post("/enroll-face", enrollStudentFace);
router.post("/register", authLimiter, registerStudent);
router.post("/login", authLimiter, loginStudent);
router.post("/admin/login", authLimiter, loginAdmin);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutStudent);

export default router;