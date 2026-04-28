import prisma from "../services/prisma.js";
import { readContract } from "../utils/blockchain.js";

export const getElections = async (req, res) => {
  try {
    const elections = await prisma.election.findMany({
      include: { candidates: true }
    });
    return res.json({ success: true, data: elections });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getElectionById = async (req, res) => {
  try {
    const election = await prisma.election.findUnique({
      where: { id: req.params.id },
      include: { candidates: true }
    });
    if (!election) return res.status(404).json({ success: false, message: "Not found" });

    // Get live tally from blockchain
    const candidates = await readContract.getCandidates(election.blockchainId);
    const tally = candidates.map(c => ({
      id: Number(c.id),
      name: c.name,
      position: c.position,
      voteCount: Number(c.voteCount)
    }));

    return res.json({ success: true, data: { ...election, tally } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};