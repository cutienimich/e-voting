import { Router } from "express";
import multer from "multer";
import {
  createAdmin, enrollStudent, createElection,
  addCandidate, openElection, closeElection, getStudents,
  addEnrolledStudent, bulkAddEnrolledStudents,
  enrollFace, getFaceStatus
} from "../controllers/adminController.js";
import { authenticateAdmin } from "../middlewares/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/create-admin", createAdmin);
router.post("/enroll-student", authenticateAdmin, enrollStudent);
router.post("/enrolled-students", authenticateAdmin, addEnrolledStudent);
router.post("/enrolled-students/bulk", authenticateAdmin, bulkAddEnrolledStudents);
router.post("/elections", authenticateAdmin, createElection);
router.post("/elections/candidate", authenticateAdmin, upload.single("photo"), addCandidate);  // ← changed
router.put("/elections/:id/open", authenticateAdmin, openElection);
router.put("/elections/:id/close", authenticateAdmin, closeElection);
router.get("/students", authenticateAdmin, getStudents);
router.post("/face/enroll", authenticateAdmin, enrollFace);
router.get("/face/status/:studentId", authenticateAdmin, getFaceStatus);

export default router;