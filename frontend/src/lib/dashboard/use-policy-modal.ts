import { useCallback, useState } from "react";
import { githubNftPathPublic } from "@/lib/github-metadata-paths";
import {
  getDisplayFlightAndPnr,
  microToUsd,
  normalizePolicyStatusLoose,
  toSafeNumber,
} from "@/lib/dashboard/policy-utils";
import { getAssetOrAddressExplorerUrl } from "@/lib/dashboard/explorer-utils";

type UsePolicyModalArgs = {
  address?: string | null;
  peraExplorerBase: string;
};

export function usePolicyModal({
  address,
  peraExplorerBase,
}: UsePolicyModalArgs) {
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyModalData, setPolicyModalData] = useState<any>(null);

  const openPolicyModal = useCallback(
    async (policy: any) => {
      const policyId = toSafeNumber(policy.id);
      const productIdAttr = toSafeNumber(policy.product_id);
      const dep = toSafeNumber(policy.departure_time);
      const premium6 = toSafeNumber(policy.premium_paid);
      const coverage6 = toSafeNumber(policy.coverage_amount);

      let status = normalizePolicyStatusLoose(policy.status);
      const statusFromMeta =
        policy.metadata?.status ??
        policy.metadata?.attributes?.find((a: any) => a.trait_type === "Status")
          ?.value;
      if (statusFromMeta && typeof statusFromMeta === "string") {
        status = normalizePolicyStatusLoose(statusFromMeta);
      }

      const departureIso = new Date(dep * 1000).toISOString();
      const premiumUsd = microToUsd(premium6);
      const coverageUsd = microToUsd(coverage6);

      const explorerUrl = getAssetOrAddressExplorerUrl(
        peraExplorerBase,
        policy.assetId,
        address,
      );

      const { flight: flightValue, pnr: pnrValue } =
        getDisplayFlightAndPnr(policy);

      // Try to fetch NFT metadata and image
      let imageUrl: string | undefined;
      let metadataUrl: string | undefined;
      const walletAddress = address || policy.wallet || "";
      const metaRepo =
        process.env.NEXT_PUBLIC_GITHUB_METADATA_REPO ||
        process.env.NEXT_PUBLIC_GITHUB_NFT_REPO ||
        "alienx5499/Zyura-Algorand-HackSeries3-MetaData";
      const metaBranch =
        process.env.NEXT_PUBLIC_GITHUB_NFT_BRANCH ||
        process.env.NEXT_PUBLIC_GITHUB_BRANCH ||
        "main";
      const metaPath = githubNftPathPublic();
      const expectedSvgUrl = `https://raw.githubusercontent.com/${metaRepo}/${metaBranch}/${metaPath}/${walletAddress}/${policyId}/policy.svg`;
      const expectedJsonUrl = `https://raw.githubusercontent.com/${metaRepo}/${metaBranch}/${metaPath}/${walletAddress}/${policyId}/policy.json`;

      // Use imageUrl from policy if available (from GitHub API)
      // Check both policy.imageUrl and policy.metadata.image
      if (policy.imageUrl) {
        imageUrl = policy.imageUrl;
        metadataUrl = policy.metadataUrl;
      } else if (policy.metadata?.image) {
        imageUrl = policy.metadata.image;
        metadataUrl = policy.metadataUrl;
      } else {
        try {
          // Try to fetch the metadata JSON
          const metadataResponse = await fetch(expectedJsonUrl);
          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            imageUrl = metadata.image || expectedSvgUrl;
            metadataUrl = expectedJsonUrl;
          } else {
            // Fallback to expected SVG URL
            imageUrl = expectedSvgUrl;
          }
        } catch (error) {
          console.warn("Could not fetch NFT metadata, using fallback:", error);
          imageUrl = expectedSvgUrl;
        }
      }

      setPolicyModalData({
        policyId,
        productId: productIdAttr,
        status,
        flight: flightValue,
        pnr: pnrValue,
        departureIso,
        premiumUsd,
        coverageUsd,
        explorerUrl,
        payoutTxId: policy.payoutTxId,
        imageUrl,
        metadataUrl,
        expectedJsonUrl,
        expectedSvgUrl,
      });
      setShowPolicyModal(true);
    },
    [address, peraExplorerBase],
  );

  const closePolicyModal = useCallback(() => setShowPolicyModal(false), []);

  return {
    showPolicyModal,
    policyModalData,
    openPolicyModal,
    closePolicyModal,
  };
}
