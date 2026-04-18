import type { PolicyBoxCache } from "@/lib/zyura/algod-policy-box-cache";
import { retainPoliciesResolvingDraftsOnChain } from "@/lib/zyura/draft-policy-on-chain";
import { policyMetadataMatchesCurrentProgram } from "../config";
import type { IndexerPolicyRow } from "../types";
import { buildIndexerPolicyRowFromAsset } from "./policy-from-asset";
import { fetchPolicyNftAssetRecords } from "./nfts";

export type { IndexerPolicyRow } from "../types";

/** Fetch policies from Indexer: policy NFTs the wallet **holds** (issuer mint) or **created**. */
export async function fetchPoliciesFromIndexer(
  wallet: string,
  boxCache?: PolicyBoxCache,
): Promise<IndexerPolicyRow[]> {
  try {
    const policyAssets = await fetchPolicyNftAssetRecords(wallet);
    if (policyAssets.length === 0) return [];

    const policyResults = await Promise.all(
      policyAssets.map((asset) =>
        buildIndexerPolicyRowFromAsset(wallet, asset),
      ),
    );
    const matched = policyResults
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .filter((p) => policyMetadataMatchesCurrentProgram(p.metadata));
    return await retainPoliciesResolvingDraftsOnChain(
      matched,
      wallet,
      boxCache,
    );
  } catch (err) {
    console.warn("Indexer fetch failed, falling back to GitHub:", err);
    return [];
  }
}
