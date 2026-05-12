import { Router } from "express";
import { getElections, getElectionById } from "../controllers/electionController.js";

const router = Router();

router.get("/", getElections);
router.get("/:id", getElectionById);

export default router;