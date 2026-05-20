import prisma from "../services/prisma.js";
import { readContract } from "../utils/blockchain.js";

export const getElections = async (req, res) => {
  try {
    const elections = await prisma.election.findMany({
      where: {
        OR: [
          { isOpen: true },
          { isOpen: false, endTime: { not: null } }
        ]
      },
      include: { candidates: true }
    });
    return res.json({ success: true, data: elections });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAdminElections = async (req, res) => {
  try {
    const elections = await prisma.election.findMany({
      include: { candidates: true }
    });
    return res.json({ success: true, data: elections });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
export const getElectionById = async (req, res) => {
  try {
    const election = await prisma.election.findUnique({
      where: { id: req.params.id },
      include: { candidates: true }
    });
    if (!election) return res.status(404).json({ success: false, message: "Not found" });

    let tally = [];
    try {
      const candidates = await readContract.getCandidates(election.blockchainId);
      tally = candidates.map(c => ({
        id: Number(c.id),
        name: c.name,
        position: c.position,
        voteCount: Number(c.voteCount)
      }));
    } catch (blockchainErr) {
      console.warn("Blockchain read failed, skipping tally:", blockchainErr.message);
    }

    return res.json({ success: true, data: { ...election, tally } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};