const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting", function () {
  let voting, owner, voter;

  beforeEach(async () => {
    [owner, voter] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
  });

  it("should create an election", async () => {
    await voting.createElection("Student Council 2026");
    expect(await voting.electionCount()).to.equal(1);
  });

  it("should add candidates", async () => {
    await voting.createElection("Student Council 2026");
    await voting.addCandidate(1, "Juan dela Cruz", "President");
    await voting.addCandidate(1, "Maria Santos", "Vice President");

    const candidates = await voting.getCandidates(1);
    expect(candidates.length).to.equal(2);
    expect(candidates[0].name).to.equal("Juan dela Cruz");
  });

  it("should open and close election", async () => {
    await voting.createElection("Student Council 2026");
    await voting.addCandidate(1, "Juan dela Cruz", "President");

    await voting.openElection(1);
    let election = await voting.getElection(1);
    expect(election.isOpen).to.be.true;

    await voting.closeElection(1);
    election = await voting.getElection(1);
    expect(election.isOpen).to.be.false;
  });

  it("should cast a vote", async () => {
    await voting.createElection("Student Council 2026");
    await voting.addCandidate(1, "Juan dela Cruz", "President");
    await voting.openElection(1);

    const hashedId = ethers.keccak256(ethers.toUtf8Bytes("24-00235"));
    await voting.connect(voter).castVote(1, 1, hashedId);

    const candidates = await voting.getCandidates(1);
    expect(candidates[0].voteCount).to.equal(1);
  });

  it("should prevent double voting", async () => {
    await voting.createElection("Student Council 2026");
    await voting.addCandidate(1, "Juan dela Cruz", "President");
    await voting.openElection(1);

    const hashedId = ethers.keccak256(ethers.toUtf8Bytes("24-00235"));
    await voting.connect(voter).castVote(1, 1, hashedId);

    await expect(
      voting.connect(voter).castVote(1, 1, hashedId)
    ).to.be.revertedWith("Already voted");
  });
});