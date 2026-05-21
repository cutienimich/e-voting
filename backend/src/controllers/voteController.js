import { ethers } from "ethers";
import prisma from "../services/prisma.js";
import { contract } from "../utils/blockchain.js";
import { sanitizeString } from "../utils/sanitize.js";

export const castVote = async (req, res) => {
  try {
    const { electionId, candidateIds } = req.body;
    const studentId = req.user.studentId;

    if (!electionId || !Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const election = await prisma.election.findUnique({ where: { id: sanitizeString(electionId) } });
    if (!election || !election.isOpen) {
      return res.status(400).json({ success: false, message: "Election not open" });
    }

    const existingVote = await prisma.vote.findFirst({ where: { studentId: req.user.id, electionId } });
    if (existingVote) return res.status(409).json({ success: false, message: "Already voted" });

    const hashedStudentId = ethers.keccak256(ethers.toUtf8Bytes(studentId));

    const alreadyVotedOnChain = await contract.checkVoted(election.blockchainId, hashedStudentId);
    if (alreadyVotedOnChain) return res.status(409).json({ success: false, message: "Already voted on blockchain" });

    // Resolve all candidates
    const resolvedCandidates = await Promise.all(
      candidateIds.map(id => prisma.candidate.findFirst({
        where: { id: sanitizeString(String(id)), electionId }
      }))
    );
    const valid = resolvedCandidates.filter(Boolean);
    if (valid.length === 0) return res.status(404).json({ success: false, message: "No valid candidates" });

    const blockchainCandidateIds = valid.map(c => c.blockchainId);

    // One blockchain tx
    const tx = await contract.castBulkVote(election.blockchainId, blockchainCandidateIds, hashedStudentId);
    const receipt = await tx.wait();

    // Save all votes to DB
    await prisma.vote.createMany({
      data: valid.map((c, index) => ({
        studentId: req.user.id,
        electionId,
        candidateId: c.id,
        txHash: `${receipt.hash}-${index}`,
        hashedStudentId
      }))
    });
    console.log("Creating votes for candidates:", valid.length);

    return res.json({ success: true, message: "Votes cast", data: { txHash: receipt.hash } });
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

export const getMyVotes = async (req, res) => {
  try {
    const votes = await prisma.vote.findMany({
      where: { studentId: req.user.id },
      include: {
        election: true,
        candidate: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const grouped = {};
    for (const v of votes) {
      const id = v.electionId;
      if (!grouped[id]) {
        grouped[id] = {
          electionId: id,
          electionName: v.election?.name || `Election #${id}`,
          votedAt: v.createdAt,
          txHash: v.txHash?.split("-")[0] || null,
          ballots: [],
        };
      }
      grouped[id].ballots.push({
        position: v.candidate?.position || "—",
        candidateName: v.candidate?.name || "—",
        partyList: null,
      });
    }

    return res.json({ success: true, data: Object.values(grouped) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};