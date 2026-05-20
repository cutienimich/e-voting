import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const ABI = [
  "function createElection(string calldata _name) external",
  "function addCandidate(uint256 _electionId, string calldata _name, string calldata _position) external",
  "function openElection(uint256 _electionId) external",
  "function closeElection(uint256 _electionId) external",
  "function castVote(uint256 _electionId, uint256 _candidateId, bytes32 _hashedStudentId) external",
  "function getCandidates(uint256 _electionId) external view returns (tuple(uint256 id, string name, string position, uint256 voteCount)[])",
  "function getElection(uint256 _electionId) external view returns (tuple(uint256 id, string name, bool isOpen, uint256 startTime, uint256 endTime))",
  "function checkVoted(uint256 _electionId, bytes32 _hashedStudentId) external view returns (bool)",
  "function electionCount() external view returns (uint256)",
  "event ElectionCreated(uint256 indexed electionId, string name)",
  "event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, bytes32 hashedStudentId)",
  "function castBulkVote(uint256 _electionId, uint256[] calldata _candidateIds, bytes32 _hashedStudentId) external"
];

const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_WALLET_PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, wallet);
const readContract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, provider);

export { contract, readContract, provider, ethers };