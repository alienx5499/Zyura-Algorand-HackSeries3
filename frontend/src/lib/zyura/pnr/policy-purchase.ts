import { confirmDraftPolicyOnChain } from "@/lib/zyura/draft-policy-on-chain";
import { GITHUB_BRANCH, GITHUB_NFT_REPO, NFT_METADATA_PATH } from "./constants";

/** True when GitHub policy.json shows a completed purchase (mirrors finalizePurchasedMetadata). */
export async function isPolicyPurchasedOnGithub(
  wallet: string,
  policyId: number,
): Promise<boolean> {
  const w = wallet.trim();
  if (!w || w === "NA" || !Number.isFinite(policyId) || policyId <= 0) {
    return false;
  }
  const url = `https://raw.githubusercontent.com/${GITHUB_NFT_REPO}/${GITHUB_BRANCH}/${NFT_METADATA_PATH}/${w}/${policyId}/policy.json`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return false;
    const j = (await res.json()) as {
      status?: string;
      nft_asset_id?: unknown;
    };
    const st = String(j?.status ?? "").toUpperCase();
    const nft = j?.nft_asset_id;
    const hasNft =
      nft != null && String(nft).trim() !== "" && String(nft).trim() !== "0";
    return st === "ACTIVE" && hasNft;
  } catch {
    return false;
  }
}

/**
 * True when pol_holder matches wallet (same rules as policies list / draft rescue).
 */
export async function isPolicyPurchasedOnChain(
  wallet: string,
  policyId: number,
): Promise<boolean> {
  const appId = parseInt(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "0", 10);
  const algodUrl = process.env.NEXT_PUBLIC_ALGOD_URL?.trim();
  const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
  if (!appId || !algodUrl) return false;
  const c = await confirmDraftPolicyOnChain(
    String(policyId),
    wallet,
    appId,
    algodUrl,
    token,
  );
  return c.ok;
}

/** GitHub finalize check first, then on-chain (pol_holder / pol_nft rules). */
export async function resolvePnrPurchaseComplete(
  wallet: string,
  policyId: number,
): Promise<boolean> {
  if (await isPolicyPurchasedOnGithub(wallet, policyId)) return true;
  return isPolicyPurchasedOnChain(wallet, policyId);
}
