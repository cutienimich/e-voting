import { Router } from "express";
import { getElections, getElectionById } from "../controllers/electionController.js";
import { authenticateStudent } from "../middlewares/auth.js";

const router = Router();

router.get("/", authenticateStudent, getElections);
router.get("/:id", authenticateStudent, getElectionById);

export default router;