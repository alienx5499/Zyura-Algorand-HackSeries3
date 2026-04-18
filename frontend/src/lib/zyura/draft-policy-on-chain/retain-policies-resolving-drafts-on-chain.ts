import type { PolicyBoxCache } from "@/lib/zyura/algod-policy-box-cache";
import { confirmDraftPolicyOnChain } from "@/lib/zyura/draft-policy-on-chain/confirm-draft-policy-on-chain";
import {
  parseWalletDirFromMetadataUrl,
  tryFinalizeGithubMetadataFromDraft,
} from "@/lib/zyura/draft-policy-on-chain/github-finalize-draft-metadata";
import {
  DRAFT_CHAIN_CONCURRENCY,
  mapPool,
} from "@/lib/zyura/draft-policy-on-chain/map-pool";
import { isUnconfirmedPolicyDraftMetadata } from "@/lib/zyura/policy-metadata-draft";

type PolicyRow = {
  id: string;
  metadata: unknown;
  assetId?: number;
  /** Present on rows from GitHub-backed policy lists. */
  metadataUrl?: unknown;
};

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

    if (c.stage === "linked" && c.nftAssetId != null && c.nftAssetId > 0) {
      const metadataUrl =
        typeof row.metadataUrl === "string" ? row.metadataUrl : "";
      const walletDir = metadataUrl
        ? parseWalletDirFromMetadataUrl({ metadataUrl, policyId: row.id })
        : null;
      if (walletDir) {
        await tryFinalizeGithubMetadataFromDraft({
          walletDir,
          policyId: row.id,
          nftAssetId: c.nftAssetId,
          metadata: row.metadata,
        });
      }
    }
    rescued.push(row as T);
  }

  return [...solid, ...rescued];
}
