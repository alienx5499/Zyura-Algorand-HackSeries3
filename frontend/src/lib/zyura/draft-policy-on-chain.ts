import algosdk from "algosdk";
import {
  getCachedPolicyBoxBytes,
  type PolicyBoxCache,
} from "@/lib/zyura/algod-policy-box-cache";
import { isUnconfirmedPolicyDraftMetadata } from "@/lib/zyura/policy-metadata-draft";

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

type PolicyRow = { id: string; metadata: unknown; assetId?: number };

const DRAFT_CHAIN_CONCURRENCY = Math.max(
  1,
  Math.min(
    12,
    parseInt(process.env.ZYURA_DRAFT_CHAIN_CONCURRENCY || "8", 10) || 8,
  ),
);

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  };
  const n = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

/**
 * Drop GitHub-shaped drafts with no on-chain policy; keep drafts when pol_holder matches wallet
 * (and optionally enrich assetId / flags for UI).
 */
export async function retainPoliciesResolvingDraftsOnChain<T extends PolicyRow>(
  policies: T[],
  wallet: string,
  boxCache?: PolicyBoxCache,
): Promise<T[]> {
  const appId = parseInt(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "0", 10);
  const algodUrl = process.env.NEXT_PUBLIC_ALGOD_URL?.trim();
  const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
  if (!appId || !algodUrl) {
    return policies.filter(
      (p) => !isUnconfirmedPolicyDraftMetadata(p.metadata),
    );
  }

  const solid: T[] = [];
  const drafts: T[] = [];
  for (const p of policies) {
    if (isUnconfirmedPolicyDraftMetadata(p.metadata)) drafts.push(p);
    else solid.push(p);
  }

  const confirmations = await mapPool(drafts, DRAFT_CHAIN_CONCURRENCY, (p) =>
    confirmDraftPolicyOnChain(p.id, wallet, appId, algodUrl, token, boxCache),
  );

  const rescued: T[] = [];
  for (let i = 0; i < drafts.length; i++) {
    const c = confirmations[i];
    if (!c.ok) continue;
    const p = drafts[i];
    const row = { ...p } as T & {
      githubMetadataStale?: boolean;
      onChainPurchaseInProgress?: boolean;
    };
    if (c.nftAssetId != null && c.nftAssetId > 0) {
      row.assetId = c.nftAssetId;
    }
    row.githubMetadataStale = true;
    if (c.stage === "holder_only") row.onChainPurchaseInProgress = true;
    rescued.push(row as T);
  }

  return [...solid, ...rescued];
}
