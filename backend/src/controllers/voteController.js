import { ethers } from "ethers";
import prisma from "../services/prisma.js";
import { contract } from "../utils/blockchain.js";
import { sanitizeString } from "../utils/sanitize.js";

export const castVote = async (req, res) => {
  try {
    const { electionId, candidateId } = req.body;
    const studentId = req.user.studentId;

    if (!electionId || candidateId === undefined) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const election = await prisma.election.findUnique({
      where: { id: sanitizeString(electionId) }
    });
    if (!election || !election.isOpen) {
      return res.status(400).json({ success: false, message: "Election not open" });
    }

    // Check already voted in DB
    const existingVote = await prisma.vote.findFirst({
      where: { studentId: req.user.id, electionId }
    });
    if (existingVote) {
      return res.status(409).json({ success: false, message: "Already voted" });
    }

    // Check candidate exists
    const candidate = await prisma.candidate.findFirst({
      where: { id: sanitizeString(String(candidateId)), electionId }
    });
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    // MOCK — generate fake tx hash for testing
    const { ethers } = await import("ethers");
    const hashedStudentId = ethers.keccak256(ethers.toUtf8Bytes(studentId));
    const mockTxHash = "0xmock_" + Date.now() + "_" + Math.random().toString(36).slice(2);

    await prisma.vote.create({
      data: {
        studentId: req.user.id,
        electionId,
        candidateId: candidate.id,
        txHash: mockTxHash,
        hashedStudentId
      }
    });

    return res.json({
      success: true,
      message: "Vote cast successfully",
      data: { txHash: mockTxHash }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const checkVoteStatus = async (req, res) => {
  try {
    const { electionId } = req.params;
    const vote = await prisma.vote.findFirst({
      where: { studentId: req.user.id, electionId }
    });
    return res.json({ success: true, data: { hasVoted: !!vote, txHash: vote?.txHash || null } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};