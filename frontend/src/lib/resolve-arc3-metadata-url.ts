/**
 * ARC-3 NFTs store a short metadata URL on-chain (e.g. is.gd → GitHub raw).
 * To show the real file and stable links, follow redirects: the final `response.url`
 * is the canonical `raw.githubusercontent.com/...` URL — no dependency on our app origin.
 */

/** Remove ARC-3 fragment before HTTP fetch (explorers do the same). */
export function stripArc3Fragment(url: string): string {
  return url.replace(/#arc3$/i, "").trim();
}

export type Arc3MetadataFetchResult = {
  metadata: unknown;
  /** URL after redirects — typically the full GitHub raw JSON URL */
  canonicalUrl: string;
};

/**
 * Load policy.json following redirects (shortener → GitHub).
 * Use `canonicalUrl` in UI instead of the on-chain short URL.
 */
export async function fetchArc3MetadataJson(
  assetUrlFromChain: string,
): Promise<Arc3MetadataFetchResult> {
  const u = stripArc3Fragment(assetUrlFromChain);
  if (!u.startsWith("http")) {
    throw new Error("Invalid metadata URL");
  }
  const res = await fetch(u, { redirect: "follow", cache: "no-store" });
  const canonicalUrl = res.url || u;
  if (!res.ok) {
    throw new Error(`Metadata fetch failed: ${res.status}`);
  }
  const text = await res.text();
  let metadata: unknown;
  try {
    metadata = JSON.parse(text);
  } catch {
    throw new Error("Metadata response is not valid JSON");
  }
  return { metadata, canonicalUrl };
}
