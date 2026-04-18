import type { PolicyBoxCache } from "@/lib/zyura/algod-policy-box-cache";
import { retainPoliciesResolvingDraftsOnChain } from "@/lib/zyura/draft-policy-on-chain";
import {
  enrichCoverageFromProduct,
  enrichPayoutTxIds,
  enrichPolicyStatusFromChain,
} from "../enrichment/chain";
import { policyMetadataMatchesCurrentProgram } from "../config";
import { fetchAssetIdsByUnitName } from "../indexer/nfts";
import type { PolicyApiRow } from "../types";
import { fetchGithubPolicyRowsForWallet } from "./fetch-metadata";

/**
 * Policies sourced only from GitHub metadata (when indexer returns no Z-policy NFTs).
 */
export async function fetchPoliciesFromGitHubMetadata(
  wallet: string,
  baseUrl: string,
  boxCache?: PolicyBoxCache,
): Promise<PolicyApiRow[]> {
  const rows = await fetchGithubPolicyRowsForWallet(wallet);
  const matchedGithub = rows.filter((p) =>
    policyMetadataMatchesCurrentProgram(p.metadata),
  );
  const validPolicies = await retainPoliciesResolvingDraftsOnChain(
    matchedGithub,
    wallet,
    boxCache,
  );

  const assetIdMap = await fetchAssetIdsByUnitName(wallet);
  for (const p of validPolicies) {
    const unitName = `Z${p.id}`;
    if (assetIdMap[unitName] != null) p.assetId = assetIdMap[unitName];
  }
  const appId = parseInt(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "0", 10);
  if (appId) {
    await enrichPolicyStatusFromChain(validPolicies, appId, boxCache);
    await enrichPayoutTxIds(validPolicies, appId);
  }
  await enrichCoverageFromProduct(validPolicies, baseUrl);
  validPolicies.sort((a, b) => Number(b.id) - Number(a.id));
  return validPolicies as PolicyApiRow[];
}
