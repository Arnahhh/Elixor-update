
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MedicalAudit", () => {
  async function deployContract() {
    const [owner, signer, unauthorized] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("MedicalAudit");
    const contract = await Factory.deploy();
    await contract.waitForDeployment();

    return { contract, owner, signer, unauthorized };
  }

  it("anchors a record and verifies it", async () => {
    const { contract } = await deployContract();

    const recordId = ethers.id(
      "report-uuid-66666666-6666-6666-6666-666666666666"
    );
    const dataHash = ethers.id("file-contents-placeholder");

    await expect(
      contract.anchorRecord(recordId, dataHash, "report")
    ).to.emit(contract, "RecordAnchored");

    expect(await contract.verifyRecord(recordId, dataHash)).to.equal(true);
    expect(
      await contract.verifyRecord(recordId, ethers.id("tampered"))
    ).to.equal(false);
  });

  it("rejects re-anchoring the same recordId", async () => {
    const { contract } = await deployContract();

    const recordId = ethers.id("dup-record");
    const dataHash = ethers.id("hash-1");

    await contract.anchorRecord(recordId, dataHash, "report");

    await expect(
      contract.anchorRecord(recordId, dataHash, "report")
    ).to.be.revertedWith("Record already anchored");
  });

  it("rejects an unauthorized account trying to anchor a record", async () => {
    const { contract, unauthorized } = await deployContract();

    const recordId = ethers.id("unauthorized-record");
    const dataHash = ethers.id("test-hash");

    await expect(
      contract
        .connect(unauthorized)
        .anchorRecord(recordId, dataHash, "report")
    ).to.be.revertedWith("Not authorized");
  });

  it("allows the owner to authorize another signer", async () => {
    const { contract, signer } = await deployContract();

    await contract.authorizeSigner(signer.address);

    expect(await contract.authorizedSigners(signer.address)).to.equal(true);
  });

  it("rejects a non-owner trying to authorize a signer", async () => {
    const { contract, signer, unauthorized } = await deployContract();

    await expect(
      contract.connect(unauthorized).authorizeSigner(signer.address)
    ).to.be.revertedWith("Only owner");
  });

  it("allows an authorized signer to anchor a record", async () => {
    const { contract, signer } = await deployContract();

    await contract.authorizeSigner(signer.address);

    const recordId = ethers.id("authorized-record");
    const dataHash = ethers.id("authorized-hash");

    await expect(
      contract.connect(signer).anchorRecord(recordId, dataHash, "report")
    ).to.emit(contract, "RecordAnchored");

    expect(await contract.verifyRecord(recordId, dataHash)).to.equal(true);
  });
});
