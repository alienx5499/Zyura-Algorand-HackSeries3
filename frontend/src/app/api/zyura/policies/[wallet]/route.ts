import { NextRequest, NextResponse } from "next/server";
import algosdk from "algosdk";
import { githubNftPath } from "@/lib/github-metadata-paths";
import { fetchArc3MetadataJson } from "@/lib/resolve-arc3-metadata-url";

// Short-lived in-memory cache (helps when VPN adds latency; reload/second request is instant)
const POLICIES_CACHE_TTL_MS = 25_000; // 25s
const policiesCache = new Map<
  string,
  { data: { policies: any[]; source?: string }; expires: number }
>();
function getCachedPolicies(
  wallet: string,
): { policies: any[]; source?: string } | null {
  const key = wallet.toLowerCase().trim();
  const entry = policiesCache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}
function setCachedPolicies(
  wallet: string,
  data: { policies: any[]; source?: string },
): void {
  policiesCache.set(wallet.toLowerCase().trim(), {
    data,
    expires: Date.now() + POLICIES_CACHE_TTL_MS,
  });
}

// Use NFT-specific env vars (same as GitHub upload route)
const GITHUB_NFT_REPO =
  process.env.GITHUB_NFT_REPO ||
  process.env.GITHUB_METADATA_REPO ||
  "alienx5499/Zyura-Algorand-HackSeries3-MetaData";
const GITHUB_BRANCH =
  process.env.GITHUB_NFT_BRANCH || process.env.GITHUB_BRANCH || "main";
const GITHUB_PATH = githubNftPath();

// Algorand indexer - derive from algod URL or use Algonode default
const INDEXER_URL = process.env.NEXT_PUBLIC_ALGOD_URL?.includes("algonode")
  ? "https://testnet-idx.algonode.cloud"
  : process.env.NEXT_PUBLIC_INDEXER_URL || "https://testnet-idx.algonode.cloud";

/**
 * Policy NFT ASAs for this wallet: unit name `Z` + 1–7 digits.
 * Must include **holdings** — house-mint NFTs are created by the issuer, not the buyer.
 */
async function fetchPolicyNftAssetRecords(
  wallet: string,
): Promise<Array<{ index: number; params: Record<string, unknown> }>> {
  const res = await fetch(`${INDEXER_URL}/v2/accounts/${wallet}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const account = data.account || data;
  const seen = new Set<number>();
  const out: Array<{ index: number; params: Record<string, unknown> }> = [];

  const isZyuraUnit = (unit: string) => /^Z\d{1,7}$/.test(unit);

  const pushIfPolicy = (
    index: number,
    params: Record<string, unknown> | undefined,
  ) => {
    if (!params) return;
    const unit = String(params["unit-name"] ?? "");
    if (!isZyuraUnit(unit)) return;
    if (seen.has(index)) return;
    seen.add(index);
    out.push({ index, params });
  };

  for (const a of account["created-assets"] || []) {
    const row = a as { index?: number; "asset-id"?: number; params?: unknown };
    const idx = row.index ?? row["asset-id"];
    if (idx == null) continue;
    pushIfPolicy(Number(idx), row.params as Record<string, unknown>);
  }

  const holdings = (account.assets || []) as Array<{
    amount?: number;
    "asset-id"?: number;
  }>;
  const holdingIds = holdings
    .filter((h) => (h.amount ?? 0) > 0)
    .map((h) => h["asset-id"])
    .filter((id): id is number => typeof id === "number" && id > 0);

  await Promise.all(
    holdingIds.map(async (assetId) => {
      if (seen.has(assetId)) return;
      try {
        const ar = await fetch(`${INDEXER_URL}/v2/assets/${assetId}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!ar.ok) return;
        const j = (await ar.json()) as {
          asset?: { index?: number; params?: Record<string, unknown> };
        };
        const asset = j.asset;
        if (!asset?.params) return;
        const idx = asset.index ?? assetId;
        pushIfPolicy(Number(idx), asset.params);
      } catch {
        /* ignore */
      }
    }),
  );

  return out;
}

/** Map unit name (e.g. Z539376) -> asset index for explorer links. */
async function fetchAssetIdsByUnitName(
  wallet: string,
): Promise<Record<string, number>> {
  try {
    const records = await fetchPolicyNftAssetRecords(wallet);
    const map: Record<string, number> = {};
    for (const { index, params } of records) {
      const unit = String(params["unit-name"] ?? "");
      if (/^Z\d{1,7}$/.test(unit)) map[unit] = index;
    }
    return map;
  } catch {
    return {};
  }
}

/** Fetch policies from Indexer: policy NFTs the wallet **holds** (issuer mint) or **created**. */
async function fetchPoliciesFromIndexer(wallet: string): Promise<
  Array<{
    id: string;
    product_id: string;
    flight_number: string;
    pnr?: string;
    departure_time: string;
    premium_paid: string;
    coverage_amount: string;
    status: number;
    created_at: string;
    metadata: any;
    imageUrl: string;
    metadataUrl: string;
    source: "indexer";
    assetId?: number;
  }>
> {
  try {
    const res = await fetch(`${INDEXER_URL}/v2/accounts/${wallet}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const policyAssets = await fetchPolicyNftAssetRecords(wallet);
    if (policyAssets.length === 0) return [];

    // Fetch all policy metadata in parallel (was sequential — major speedup)
    const policyResults = await Promise.all(
      policyAssets.map(async (asset) => {
        const assetUrl = asset.params?.url;
        const unitName = String(asset.params?.["unit-name"] ?? "");
        const policyId = unitName.slice(1); // "Z534814" -> "534814"
        const knownMetadataUrl = `https://raw.githubusercontent.com/${GITHUB_NFT_REPO}/${GITHUB_BRANCH}/${GITHUB_PATH}/${wallet}/${policyId}/policy.json`;

        try {
          let policyMetadata: any;
          let metadataUrlUsed: string;
          const knownRes = await fetch(knownMetadataUrl, { cache: "no-store" });
          if (
            knownRes.ok &&
            (knownRes.headers.get("content-type") || "").includes(
              "application/json",
            )
          ) {
            policyMetadata = await knownRes.json();
            metadataUrlUsed = knownMetadataUrl;
          } else if (assetUrl && String(assetUrl).startsWith("http")) {
            try {
              const { metadata, canonicalUrl } = await fetchArc3MetadataJson(
                String(assetUrl),
              );
              policyMetadata = metadata;
              metadataUrlUsed = canonicalUrl;
            } catch {
              return null;
            }
          } else {
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
              : null) ??
            (departureAttr?.value ? String(departureAttr.value) : "");
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
              String(policyMetadata.product_id ?? productIdAttr?.value ?? "") ||
              "",
            flight_number:
              String(policyMetadata.flight ?? flightAttr?.value ?? "") || "",
            pnr: pnrValue && pnrValue !== "N/A" ? pnrValue : "",
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
            imageUrl: policyMetadata.image || "",
            metadataUrl: metadataUrlUsed,
            source: "indexer" as const,
            assetId: asset.index,
          };
        } catch {
          return null;
        }
      }),
    );
    return policyResults.filter((p): p is NonNullable<typeof p> => p !== null);
  } catch (err) {
    console.warn("Indexer fetch failed, falling back to GitHub:", err);
    return [];
  }
}

/** Fetch policy status box via algod HTTP API (same approach as product API). */
async function fetchPolicyStatusFromChain(
  appId: number,
  policyId: string,
  algodUrl: string,
  token: string,
): Promise<number> {
  try {
    const prefix = new TextEncoder().encode("pol_status");
    const idBytes = algosdk.encodeUint64(BigInt(policyId));
    const boxName = new Uint8Array(prefix.length + idBytes.length);
    boxName.set(prefix, 0);
    boxName.set(idBytes, prefix.length);
    const boxNameB64 = Buffer.from(boxName).toString("base64");
    const base = algodUrl.replace(/\/$/, "");
    const u = new URL(`${base}/v2/applications/${appId}/box`);
    u.searchParams.set("name", `b64:${boxNameB64}`);
    const res = await fetch(u.toString(), {
      cache: "no-store",
      headers: token ? { "X-Algo-API-Token": token } : {},
    });
    if (!res.ok) return 0;
    const json = (await res.json()) as { value?: string };
    const valueB64 = json?.value;
    if (!valueB64) return 0;
    const bytes = new Uint8Array(Buffer.from(valueB64, "base64"));
    if (bytes.length >= 8) {
      return Number(algosdk.decodeUint64(bytes.slice(0, 8), "safe"));
    }
  } catch {
    // Box missing or error -> treat as 0 (Active) for display
  }
  return 0;
}

/** Enrich each policy with on-chain status so PaidOut shows correctly. */
async function enrichPolicyStatusFromChain(
  policies: Array<{ id: string; status: number }>,
  appId: number,
): Promise<void> {
  const algodUrl = process.env.NEXT_PUBLIC_ALGOD_URL;
  const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
  if (!algodUrl || !appId) return;
  await Promise.all(
    policies.map(async (p) => {
      const status = await fetchPolicyStatusFromChain(
        appId,
        p.id,
        algodUrl,
        token,
      );
      p.status = status;
    }),
  );
}

/** Enrich coverage from product so policies always show current product coverage (not stale metadata). */
async function enrichCoverageFromProduct(
  policies: Array<{
    product_id: string;
    coverage_amount: string;
    [k: string]: any;
  }>,
  baseUrl: string,
): Promise<void> {
  const productIds = [
    ...new Set(policies.map((p) => p.product_id).filter(Boolean)),
  ];
  const productCoverage: Record<string, string> = {};
  await Promise.all(
    productIds.map(async (productId) => {
      try {
        const res = await fetch(`${baseUrl}/api/zyura/product/${productId}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const cov = data.coverage_amount ?? data.coverageAmount;
          if (cov != null) productCoverage[productId] = String(cov);
        }
      } catch {
        // ignore
      }
    }),
  );
  for (const p of policies) {
    if (p.product_id && productCoverage[p.product_id]) {
      p.coverage_amount = productCoverage[p.product_id];
    }
  }
}

/** Fetch map policyId -> payout transaction id from indexer (processPayout app calls). */
async function fetchPayoutTxIds(
  appId: number,
): Promise<Record<string, string>> {
  try {
    const res = await fetch(
      `${INDEXER_URL}/v2/transactions?application-id=${appId}&limit=300`,
      { cache: "no-store", headers: { Accept: "application/json" } },
    );
    if (!res.ok) {
      console.log(`[fetchPayoutTxIds] Indexer request failed: ${res.status}`);
      return {};
    }
    const data = await res.json();
    const txs = data.transactions || [];
    const payoutMap: Record<string, string> = {};
    console.log(
      `[fetchPayoutTxIds] Found ${txs.length} transactions for app ${appId}`,
    );
    // processPayout(uint64 policyId, uint64 delayMinutes)void - selector + 2 args
    // Note: Since we query by application-id, all txs are for this app (even if applicationId field is undefined)
    for (const tx of txs) {
      const appArgs = tx["application-transaction"]?.["application-args"] || [];
      // processPayout has selector + 2 args = 3 total
      if (appArgs.length >= 3) {
        try {
          // Second arg (index 1) is policyId, third arg (index 2) is delayMinutes
          const policyIdBytes = Buffer.from(appArgs[1], "base64");
          // Handle variable-length uint64 (pad to 8 bytes if needed)
          let paddedBytes = policyIdBytes;
          if (policyIdBytes.length < 8) {
            paddedBytes = Buffer.allocUnsafe(8);
            paddedBytes.fill(0);
            policyIdBytes.copy(paddedBytes, 8 - policyIdBytes.length);
          } else if (policyIdBytes.length > 8) {
            paddedBytes = policyIdBytes.slice(-8); // Take last 8 bytes
          }
          const policyId = algosdk
            .decodeUint64(paddedBytes, "bigint")
            .toString();
          payoutMap[policyId] = tx.id;
          console.log(
            `[fetchPayoutTxIds] Mapped policy ${policyId} -> tx ${tx.id}`,
          );
        } catch (err) {
          console.log(
            `[fetchPayoutTxIds] Error decoding args for tx ${tx.id}:`,
            err,
          );
        }
      }
    }
    console.log(
      `[fetchPayoutTxIds] Returning payoutMap with ${Object.keys(payoutMap).length} entries`,
    );
    return payoutMap;
  } catch (err) {
    console.log(`[fetchPayoutTxIds] Error:`, err);
    return {};
  }
}

/** Enrich policies with status 1 (PaidOut) with payoutTxId from indexer. */
async function enrichPayoutTxIds(
  policies: Array<{ id: string; status: number; payoutTxId?: string }>,
  appId: number,
): Promise<void> {
  if (!appId || policies.length === 0) return;
  const paidOutPolicies = policies.filter((p) => p.status === 1);
  if (paidOutPolicies.length === 0) return;
  const payoutMap = await fetchPayoutTxIds(appId);
  console.log(
    `[enrichPayoutTxIds] Found ${paidOutPolicies.length} PaidOut policies, payoutMap has ${Object.keys(payoutMap).length} entries`,
  );
  for (const policy of paidOutPolicies) {
    if (payoutMap[policy.id]) {
      policy.payoutTxId = payoutMap[policy.id];
      console.log(
        `[enrichPayoutTxIds] Added payoutTxId for policy ${policy.id}: ${payoutMap[policy.id]}`,
      );
    } else {
      console.log(
        `[enrichPayoutTxIds] No payoutTxId found for policy ${policy.id} in payoutMap`,
      );
    }
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ wallet: string }> },
) {
  try {
    const { wallet } = await params;
    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    // Check for noCache query parameter to bypass cache (useful after purchases)
    const noCache = req.nextUrl.searchParams.get("noCache") === "true";
    if (!noCache) {
      const cached = getCachedPolicies(wallet);
      if (cached) return NextResponse.json(cached);
    }

    const baseUrl =
      req.nextUrl?.origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    // 1. Try indexer first (on-chain source of truth)
    const indexerPolicies = await fetchPoliciesFromIndexer(wallet);
    if (indexerPolicies.length > 0) {
      const appId = parseInt(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "0", 10);
      if (appId) {
        await enrichPolicyStatusFromChain(indexerPolicies, appId);
        await enrichPayoutTxIds(indexerPolicies, appId);
      }
      await enrichCoverageFromProduct(indexerPolicies, baseUrl);
      // Sort by buying order: newest first (assetId = creation order on chain; higher = more recent)
      const sorted = indexerPolicies.sort((a, b) => {
        const aId = a.assetId ?? 0;
        const bId = b.assetId ?? 0;
        if (bId !== aId) return bId - aId;
        return Number(b.id) - Number(a.id);
      });
      const result = { policies: sorted, source: "indexer" as const };
      setCachedPolicies(wallet, result);
      return NextResponse.json(result);
    }

    // 2. Fallback to GitHub metadata (for policies created before indexer support)
    // List all wallet directories and find the one matching our address (case-insensitive)
    const metadataListUrl = `https://api.github.com/repos/${GITHUB_NFT_REPO}/contents/${GITHUB_PATH}?ref=${GITHUB_BRANCH}`;
    const metadataListResponse = await fetch(metadataListUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    let walletAddressInGitHub: string | null = null;

    if (metadataListResponse.ok) {
      const walletDirs = await metadataListResponse.json();
      if (Array.isArray(walletDirs)) {
        // Find wallet directory that matches our address (case-insensitive)
        const matchingWallet = walletDirs.find(
          (item: any) =>
            item.type === "dir" &&
            item.name.toLowerCase() === wallet.toLowerCase(),
        );

        if (matchingWallet) {
          walletAddressInGitHub = matchingWallet.name; // Use the exact format from GitHub
        }
      }
    }

    if (!walletAddressInGitHub) {
      return NextResponse.json({ policies: [] });
    }

    // Fetch policies for this wallet
    const listUrl = `https://api.github.com/repos/${GITHUB_NFT_REPO}/contents/${GITHUB_PATH}/${walletAddressInGitHub}?ref=${GITHUB_BRANCH}`;
    const listResponse = await fetch(listUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!listResponse.ok) {
      return NextResponse.json({ policies: [] });
    }

    const policyDirs = await listResponse.json();
    if (!Array.isArray(policyDirs)) {
      return NextResponse.json({ policies: [] });
    }

    // Fetch policy.json for each policy
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

              // Legacy: skip abandoned drafts where mint never confirmed
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

              return {
                id: policyIdStr,
                product_id:
                  String(
                    policyMetadata.product_id ?? productIdAttr?.value ?? "",
                  ) || "",
                flight_number:
                  String(policyMetadata.flight ?? flightAttr?.value ?? "") ||
                  "",
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
                imageUrl: policyMetadata.image,
                metadataUrl: policyJsonUrl,
                assetId: undefined as number | undefined, // set below from indexer so explorer links to /asset/:id
              };
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

    const validPolicies = policies.filter(
      (p): p is NonNullable<typeof p> => p !== null,
    );
    // Attach assetId so "View in Explorer" links to the NFT asset page, not the wallet address
    const assetIdMap = await fetchAssetIdsByUnitName(wallet);
    for (const p of validPolicies) {
      const unitName = `Z${p.id}`;
      if (assetIdMap[unitName] != null) p.assetId = assetIdMap[unitName];
    }
    const appId = parseInt(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "0", 10);
    if (appId) {
      await enrichPolicyStatusFromChain(validPolicies, appId);
      await enrichPayoutTxIds(validPolicies, appId);
    }
    await enrichCoverageFromProduct(validPolicies, baseUrl);
    validPolicies.sort((a, b) => Number(b.id) - Number(a.id));
    const result = { policies: validPolicies };
    setCachedPolicies(wallet, result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching policies:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch policies" },
      { status: 500 },
    );
  }
}
