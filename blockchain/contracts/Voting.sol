// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        string position;
        uint256 voteCount;
    }

    struct Election {
        uint256 id;
        string name;
        bool isOpen;
        uint256 startTime;
        uint256 endTime;
    }

    uint256 public electionCount;

    mapping(uint256 => Election) private elections;
    mapping(uint256 => Candidate[]) private candidates;
    mapping(uint256 => mapping(bytes32 => bool)) private hasVoted;

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier electionExists(uint256 _electionId) {
        require(_electionId > 0 && _electionId <= electionCount, "Election not found");
        _;
    }

    event ElectionCreated(uint256 indexed electionId, string name);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name);
    event ElectionOpened(uint256 indexed electionId);
    event ElectionClosed(uint256 indexed electionId);
    event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, bytes32 hashedStudentId);

    constructor() {
        owner = msg.sender;
    }

    function createElection(string calldata _name) external onlyOwner {
        electionCount++;
        elections[electionCount] = Election({
            id: electionCount,
            name: _name,
            isOpen: false,
            startTime: 0,
            endTime: 0
        });
        emit ElectionCreated(electionCount, _name);
    }

    function addCandidate(
        uint256 _electionId,
        string calldata _name,
        string calldata _position
    ) external onlyOwner electionExists(_electionId) {
        require(!elections[_electionId].isOpen, "Cannot add candidate to open election");
        uint256 candidateId = candidates[_electionId].length + 1;
        candidates[_electionId].push(Candidate({
            id: candidateId,
            name: _name,
            position: _position,
            voteCount: 0
        }));
        emit CandidateAdded(_electionId, candidateId, _name);
    }

    function openElection(uint256 _electionId) external onlyOwner electionExists(_electionId) {
        require(!elections[_electionId].isOpen, "Already open");
        require(candidates[_electionId].length > 0, "No candidates");
        elections[_electionId].isOpen = true;
        elections[_electionId].startTime = block.timestamp;
        emit ElectionOpened(_electionId);
    }

    function closeElection(uint256 _electionId) external onlyOwner electionExists(_electionId) {
        require(elections[_electionId].isOpen, "Not open");
        elections[_electionId].isOpen = false;
        elections[_electionId].endTime = block.timestamp;
        emit ElectionClosed(_electionId);
    }

    function castVote(
        uint256 _electionId,
        uint256 _candidateId,
        bytes32 _hashedStudentId
    ) external electionExists(_electionId) {
        require(elections[_electionId].isOpen, "Election not open");
        require(!hasVoted[_electionId][_hashedStudentId], "Already voted");
        require(_candidateId > 0 && _candidateId <= candidates[_electionId].length, "Invalid candidate");

        hasVoted[_electionId][_hashedStudentId] = true;
        candidates[_electionId][_candidateId - 1].voteCount++;

        emit VoteCast(_electionId, _candidateId, _hashedStudentId);
    }

    function getCandidates(uint256 _electionId)
        external
        view
        electionExists(_electionId)
        returns (Candidate[] memory)
    {
        return candidates[_electionId];
    }

    function getElection(uint256 _electionId)
        external
        view
        electionExists(_electionId)
        returns (Election memory)
    {
        return elections[_electionId];
    }

    function checkVoted(uint256 _electionId, bytes32 _hashedStudentId)
        external
        view
        electionExists(_electionId)
        returns (bool)
    {
        return hasVoted[_electionId][_hashedStudentId];
    }
}
