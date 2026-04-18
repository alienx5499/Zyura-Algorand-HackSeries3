import algosdk from "algosdk";
import {
  getCachedPolicyBoxBytes,
  type PolicyBoxCache,
} from "@/lib/zyura/algod-policy-box-cache";

export type DraftChainConfirmation =
  | { ok: false; reason: "no_holder" | "wrong_holder" | "algod_error" }
  | {
      ok: true;
      nftAssetId: number | null;
      stage: "linked" | "holder_only";
    };

/**
 * If GitHub metadata still looks like a pre-signing draft, confirm purchase using Zyura boxes:
 * pol_holder must match wallet; pol_nft if set refines asset id and stage.
 */
export async function confirmDraftPolicyOnChain(
  policyId: string,
  wallet: string,
  appId: number,
  algodUrl: string,
  token: string,
  boxCache?: PolicyBoxCache,
): Promise<DraftChainConfirmation> {
  const [holderBytes, nftBytes] = await Promise.all([
    getCachedPolicyBoxBytes(
      boxCache,
      appId,
      "pol_holder",
      policyId,
      algodUrl,
      token,
    ),
    getCachedPolicyBoxBytes(
      boxCache,
      appId,
      "pol_nft",
      policyId,
      algodUrl,
      token,
    ),
  ]);
  if (holderBytes === "err") return { ok: false, reason: "algod_error" };
  if (holderBytes == null || holderBytes.length < 32) {
    return { ok: false, reason: "no_holder" };
  }
  const holderPk = holderBytes.subarray(0, 32);
  let holderAddr: string;
  try {
    holderAddr = algosdk.encodeAddress(holderPk);
  } catch {
    return { ok: false, reason: "algod_error" };
  }
  let walletNorm: string;
  try {
    walletNorm = algosdk.encodeAddress(algosdk.decodeAddress(wallet).publicKey);
  } catch {
    return { ok: false, reason: "wrong_holder" };
  }
  if (holderAddr !== walletNorm) return { ok: false, reason: "wrong_holder" };

  if (nftBytes === "err") return { ok: false, reason: "algod_error" };
  if (nftBytes == null || nftBytes.length < 8) {
    return { ok: true, nftAssetId: null, stage: "holder_only" };
  }
  const nftId = Number(algosdk.decodeUint64(nftBytes.subarray(0, 8), "safe"));
  if (!Number.isFinite(nftId) || nftId <= 0) {
    return { ok: true, nftAssetId: null, stage: "holder_only" };
  }
  return { ok: true, nftAssetId: nftId, stage: "linked" };
}
