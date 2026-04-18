/**
 * GitHub metadata uploaded before the atomic purchase finalizes uses PENDING_* status.
 * Used by policies API and related routes to hide abandoned pre-signing rows unless chain says otherwise.
 */
export function isUnconfirmedPolicyDraftMetadata(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object") return false;
  const m = metadata as Record<string, unknown>;
  if (m.purchased_at != null || m.purchased_at_unix != null) return false;
  const nftId = m.nft_asset_id;
  if (nftId != null && String(nftId).trim() !== "") return false;

  const norm = (s: string) =>
    s.trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");

  const top = m.status;
  if (typeof top === "string") {
    const n = norm(top);
    if (n === "PENDING_CONFIRMATION" || n === "PENDING") return true;
  }

  const attrs = Array.isArray(m.attributes) ? m.attributes : [];
  for (const a of attrs as Array<{ trait_type?: string; value?: unknown }>) {
    if (a?.trait_type !== "Status" || typeof a.value !== "string") continue;
    const v = norm(a.value);
    if (v.includes("PENDING") && !v.includes("ACTIVE")) return true;
  }

  return false;
}
