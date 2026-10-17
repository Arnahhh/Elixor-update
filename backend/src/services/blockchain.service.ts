
import { Contract, JsonRpcProvider, Wallet, id } from "ethers";
import { createHash } from "crypto";
import { supabaseAdmin } from "../config/supabase.js";

const ABI = [
  "function anchorRecord(bytes32 recordId, bytes32 dataHash, string recordType) external",
  "function verifyRecord(bytes32 recordId, bytes32 dataHash) external view returns (bool)",
  "event RecordAnchored(bytes32 indexed recordId, bytes32 dataHash, string recordType, uint256 timestamp)",
];

function getContract() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.AUDIT_SIGNER_PRIVATE_KEY;
  const contractAddress = process.env.AUDIT_CONTRACT_ADDRESS;

  if (!rpcUrl) {
    throw new Error("Missing SEPOLIA_RPC_URL environment variable");
  }

  if (!privateKey) {
    throw new Error("Missing AUDIT_SIGNER_PRIVATE_KEY environment variable");
  }

  if (!contractAddress) {
    throw new Error("Missing AUDIT_CONTRACT_ADDRESS environment variable");
  }

  const provider = new JsonRpcProvider(rpcUrl);
  const signer = new Wallet(privateKey, provider);

  return new Contract(contractAddress, ABI, signer);
}

/**
 * Calculate the SHA-256 hash of a file buffer.
 * The hash can be stored with the off-chain medical report.
 */
export function sha256Hex(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Anchor a medical report or prescription hash on Sepolia.
 *
 * The document itself is not stored on-chain.
 * Existing blockchain_transactions database operations are preserved.
 */
export async function anchorHashOnChain(params: {
  recordId: string;
  fileHashHex: string;
  recordType: "report" | "prescription";
}) {
  const { recordId, fileHashHex, recordType } = params;

  // Validate the hash before interacting with the database or blockchain.
  if (!/^[0-9a-fA-F]{64}$/.test(fileHashHex)) {
    throw new Error("Invalid file hash: expected a 64-character SHA-256 hex digest");
  }

  const targetColumn =
    recordType === "report" ? "report_id" : "prescription_id";

  const { data: txRow, error: insertErr } = await supabaseAdmin
    .from("blockchain_transactions")
    .insert({
      [targetColumn]: recordId,
      chain: "sepolia",
      tx_hash: `pending-${recordId}-${Date.now()}`,
      data_hash: fileHashHex,
      status: "pending",
    })
    .select()
    .single();

  if (insertErr) {
    throw insertErr;
  }

  try {
    const contract = getContract();

    // Convert the UUID string to a deterministic bytes32 identifier.
    const recordIdBytes32 = id(recordId);
    const dataHashBytes32 = `0x${fileHashHex}`;

    const tx = await contract.anchorRecord(
      recordIdBytes32,
      dataHashBytes32,
      recordType
    );

    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error("Blockchain transaction was not confirmed successfully");
    }

    const { error: updateErr } = await supabaseAdmin
      .from("blockchain_transactions")
      .update({
        tx_hash: receipt.hash,
        block_number: receipt.blockNumber,
        status: "confirmed",
        gas_used: receipt.gasUsed?.toString(),
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", txRow.id);

    if (updateErr) {
      throw updateErr;
    }

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (err) {
    // Preserve the existing failed-transaction status update.
    await supabaseAdmin
      .from("blockchain_transactions")
      .update({ status: "failed" })
      .eq("id", txRow.id);

    throw err;
  }
}

/**
 * Verify that a file's SHA-256 hash matches its on-chain record.
 */
export async function verifyOnChain(
  recordId: string,
  fileHashHex: string
): Promise<boolean> {
  if (!/^[0-9a-fA-F]{64}$/.test(fileHashHex)) {
    throw new Error("Invalid file hash: expected a 64-character SHA-256 hex digest");
  }

  const contract = getContract();
  const recordIdBytes32 = id(recordId);
  const dataHashBytes32 = `0x${fileHashHex}`;

  return contract.verifyRecord(recordIdBytes32, dataHashBytes32);
}
