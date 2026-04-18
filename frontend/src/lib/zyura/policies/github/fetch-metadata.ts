import {
  GITHUB_BRANCH,
  GITHUB_NFT_REPO,
  GITHUB_PATH,
  githubContentsHeaders,
} from "../config";
import type { PolicyApiRow } from "../types";

/** Raw policy rows from GitHub metadata (before program-version filter / on-chain enrichment). */
export async function fetchGithubPolicyRowsForWallet(
  wallet: string,
): Promise<PolicyApiRow[]> {
  const metadataListUrl = `https://api.github.com/repos/${GITHUB_NFT_REPO}/contents/${GITHUB_PATH}?ref=${GITHUB_BRANCH}`;
  const metadataListResponse = await fetch(metadataListUrl, {
    cache: "no-store",
    headers: githubContentsHeaders(),
  });

  let walletAddressInGitHub: string | null = null;

  if (metadataListResponse.ok) {
    const walletDirs = await metadataListResponse.json();
    if (Array.isArray(walletDirs)) {
      const matchingWallet = walletDirs.find(
        (item: any) =>
          item.type === "dir" &&
          item.name.toLowerCase() === wallet.toLowerCase(),
      );

      if (matchingWallet) {
        walletAddressInGitHub = matchingWallet.name;
      }
    }
  }

  if (!walletAddressInGitHub) {
    return [];
  }

  const listUrl = `https://api.github.com/repos/${GITHUB_NFT_REPO}/contents/${GITHUB_PATH}/${walletAddressInGitHub}?ref=${GITHUB_BRANCH}`;
  const listResponse = await fetch(listUrl, {
    cache: "no-store",
    headers: githubContentsHeaders(),
  });

  if (!listResponse.ok) {
    return [];
  }

  const policyDirs = await listResponse.json();
  if (!Array.isArray(policyDirs)) {
    return [];
  }

  const metadataUrl = `https://raw.githubusercontent.com/${GITHUB_NFT_REPO}/${GITHUB_BRANCH}/${GITHUB_PATH}/${walletAddressInGitHub}`;
  const policies = await Promise.all(
    policyDirs
      .filter((item: any) => item.type === "dir")
      .map(async (policyDir: any) => {
        const policyIdStr = policyDir.name;
        const policyJsonUrl = `${metadataUrl}/${policyIdStr}/policy.json?t=${Date.now()}`;

        try {
          const policyResponse = await fetch(policyJsonUrl, {
            cache: "no-store",
          });
          if (policyResponse.ok) {
            const policyMetadata = await policyResponse.json();

            const legacyPendingMint = policyMetadata.attributes?.find(
              (attr: any) => attr.trait_type === "On-chain Status",
            )?.value;
            if (legacyPendingMint === "Pending mint") {
              return null;
            }

            const productIdAttr = policyMetadata.attributes?.find(
              (attr: any) => attr.trait_type === "Product ID",
            );
            const flightAttr = policyMetadata.attributes?.find(
              (attr: any) => attr.trait_type === "Flight",
            );
            const departureAttr = policyMetadata.attributes?.find(
              (attr: any) => attr.trait_type === "Departure",
            );
            const premiumAttr = policyMetadata.attributes?.find(
              (attr: any) => attr.trait_type === "Premium (USD)",
            );
            const coverageAttr = policyMetadata.attributes?.find(
              (attr: any) => attr.trait_type === "Coverage (USD)",
            );
            const pnrAttr = policyMetadata.attributes?.find(
              (attr: any) => attr.trait_type === "PNR",
            );
            const pnrRaw = (policyMetadata.pnr ?? pnrAttr?.value ?? "")
              .toString()
              .trim();
            const pnr = pnrRaw && pnrRaw !== "N/A" ? pnrRaw : "";

            const departureStr =
              (typeof policyMetadata.departure === "string"
                ? policyMetadata.departure
                : null) ??
              (departureAttr?.value ? String(departureAttr.value) : "");
            const departureUnix = departureStr
              ? Math.floor(new Date(departureStr).getTime() / 1000)
              : 0;

            const premUsd =
              typeof policyMetadata.premium_usd === "number"
                ? policyMetadata.premium_usd
                : premiumAttr?.value
                  ? parseFloat(
                      String(premiumAttr.value).replace(/[^0-9.]/g, ""),
                    )
                  : 0;
            const covUsd =
              typeof policyMetadata.coverage_usd === "number"
                ? policyMetadata.coverage_usd
                : coverageAttr?.value
                  ? parseFloat(
                      String(coverageAttr.value).replace(/[^0-9.]/g, ""),
                    )
                  : 0;

            const row: PolicyApiRow = {
              id: policyIdStr,
              product_id:
                String(
                  policyMetadata.product_id ?? productIdAttr?.value ?? "",
                ) || "",
              flight_number:
                String(policyMetadata.flight ?? flightAttr?.value ?? "") || "",
              pnr,
              departure_time: departureUnix.toString(),
              premium_paid: premUsd
                ? Math.round(premUsd * 1_000_000).toString()
                : "0",
              coverage_amount: covUsd
                ? Math.round(covUsd * 1_000_000).toString()
                : "0",
              status: 0,
              created_at: departureUnix.toString(),
              metadata: policyMetadata,
              imageUrl: String(policyMetadata.image ?? ""),
              metadataUrl: policyJsonUrl,
            };
            return row;
          }
        } catch (error) {
          console.warn(
            `Error fetching policy ${policyIdStr} from GitHub:`,
            error,
          );
        }
        return null;
      }),
  );

  return policies.filter((p): p is PolicyApiRow => p !== null);
}
