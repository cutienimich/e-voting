import { Router } from "express";
import { castVote, checkVoteStatus, getMyVotes } from "../controllers/voteController.js";
import { authenticateStudent } from "../middlewares/auth.js";
import { voteLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

router.post("/", authenticateStudent, voteLimiter, castVote);
router.get("/status/:electionId", authenticateStudent, checkVoteStatus);
router.get("/my-votes", authenticateStudent, getMyVotes);

export default router;