import { INDEXER_URL } from "../config";

/**
 * Policy NFT ASAs for this wallet: unit name `Z` + 1–7 digits.
 * Must include **holdings** — house-mint NFTs are created by the issuer, not the buyer.
 */
export async function fetchPolicyNftAssetRecords(
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
export async function fetchAssetIdsByUnitName(
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
