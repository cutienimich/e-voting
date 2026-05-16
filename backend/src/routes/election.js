import { Router } from "express";
import { getElections, getElectionById } from "../controllers/electionController.js";
import { getAdminElections } from "../controllers/electionController.js";
import { authenticateAdmin } from "../middlewares/auth.js"; // your existing middleware

const router = Router();

// Student route
router.get("/", getElections);

// Admin route
router.get("/all", authenticateAdmin, getAdminElections);

router.get("/:id", getElectionById);

export default router;