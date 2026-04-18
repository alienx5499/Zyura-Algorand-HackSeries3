import { fetchArc3MetadataJson } from "@/lib/resolve-arc3-metadata-url";
import { GITHUB_BRANCH, GITHUB_NFT_REPO, GITHUB_PATH } from "../config";
import type { IndexerPolicyRow } from "../types";

export async function buildIndexerPolicyRowFromAsset(
  wallet: string,
  asset: { index: number; params: Record<string, unknown> },
): Promise<IndexerPolicyRow | null> {
  const assetUrl = asset.params?.url;
  const unitName = String(asset.params?.["unit-name"] ?? "");
  const policyId = unitName.slice(1);
  const knownMetadataUrl = `https://raw.githubusercontent.com/${GITHUB_NFT_REPO}/${GITHUB_BRANCH}/${GITHUB_PATH}/${wallet}/${policyId}/policy.json`;

  try {
    let policyMetadata: any;
    let metadataUrlUsed: string = knownMetadataUrl;
    const knownRes = await fetch(knownMetadataUrl, { cache: "no-store" });
    if (knownRes.ok) {
      try {
        const text = await knownRes.text();
        const parsed: unknown = JSON.parse(text);
        if (parsed && typeof parsed === "object") {
          policyMetadata = parsed as any;
        }
      } catch {
        /* fall through to ARC-3 URL */
      }
    }
    if (!policyMetadata && assetUrl && String(assetUrl).startsWith("http")) {
      try {
        const { metadata, canonicalUrl } = await fetchArc3MetadataJson(
          String(assetUrl),
        );
        policyMetadata = metadata;
        metadataUrlUsed = canonicalUrl;
      } catch {
        return null;
      }
    } else if (!policyMetadata) {
      return null;
    }
    if (!policyMetadata) return null;
    const productIdAttr = policyMetadata.attributes?.find(
      (a: any) => a.trait_type === "Product ID",
    );
    const flightAttr = policyMetadata.attributes?.find(
      (a: any) => a.trait_type === "Flight",
    );
    const departureAttr = policyMetadata.attributes?.find(
      (a: any) => a.trait_type === "Departure",
    );
    const premiumAttr = policyMetadata.attributes?.find(
      (a: any) => a.trait_type === "Premium (USD)",
    );
    const coverageAttr = policyMetadata.attributes?.find(
      (a: any) => a.trait_type === "Coverage (USD)",
    );
    const departureStr =
      (typeof policyMetadata.departure === "string"
        ? policyMetadata.departure
        : null) ?? (departureAttr?.value ? String(departureAttr.value) : "");
    const departureUnix = departureStr
      ? Math.floor(new Date(departureStr).getTime() / 1000)
      : 0;
    const pnrAttr = policyMetadata.attributes?.find(
      (a: any) => a.trait_type === "PNR",
    );
    const pnrRaw = policyMetadata.pnr ?? pnrAttr?.value ?? "";
    const pnrValue = String(pnrRaw).trim();
    const premUsd =
      typeof policyMetadata.premium_usd === "number"
        ? policyMetadata.premium_usd
        : premiumAttr?.value
          ? parseFloat(String(premiumAttr.value).replace(/[^0-9.]/g, ""))
          : 0;
    const covUsd =
      typeof policyMetadata.coverage_usd === "number"
        ? policyMetadata.coverage_usd
        : coverageAttr?.value
          ? parseFloat(String(coverageAttr.value).replace(/[^0-9.]/g, ""))
          : 0;
    return {
      id: policyId,
      product_id:
        String(policyMetadata.product_id ?? productIdAttr?.value ?? "") || "",
      flight_number:
        String(policyMetadata.flight ?? flightAttr?.value ?? "") || "",
      pnr: pnrValue && pnrValue !== "N/A" ? pnrValue : "",
      departure_time: departureUnix.toString(),
      premium_paid: premUsd ? Math.round(premUsd * 1_000_000).toString() : "0",
      coverage_amount: covUsd ? Math.round(covUsd * 1_000_000).toString() : "0",
      status: 0,
      created_at: departureUnix.toString(),
      metadata: policyMetadata,
      imageUrl: policyMetadata.image || "",
      metadataUrl: metadataUrlUsed,
      source: "indexer" as const,
      assetId: asset.index,
    };
  } catch {
    return null;
  }
}
