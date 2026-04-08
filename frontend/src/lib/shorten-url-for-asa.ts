/**
 * Algorand ASA `url` field is max 96 bytes (UTF-8). ARC-3 uses metadata JSON URL + "#arc3".
 */

export const ARC3_SUFFIX = "#arc3";
export const ASA_URL_MAX_BYTES = 96;

/** Max length of the base URL before appending "#arc3" so total ≤ 96 bytes. */
export function arc3BaseMaxBytes(): number {
  return ASA_URL_MAX_BYTES - new TextEncoder().encode(ARC3_SUFFIX).length;
}

export function utf8ByteLength(s: string): number {
  return new TextEncoder().encode(s).length;
}

/**
 * Shorten a URL so it fits in the ASA field together with "#arc3" (base ≤ arc3BaseMaxBytes()).
 */
export async function shortenUrlForAsaBase(rawUrl: string): Promise<string> {
  const maxBase = arc3BaseMaxBytes();
  if (utf8ByteLength(rawUrl) <= maxBase) return rawUrl;

  const tryGd = async (host: "is.gd" | "v.gd") => {
    const res = await fetch(
      `https://${host}/create.php?format=json&url=${encodeURIComponent(rawUrl)}`,
    );
    if (!res.ok) return null;
    const text = await res.text();
    let data: { shorturl?: string; errorcode?: number; errormessage?: string };
    try {
      data = JSON.parse(text) as typeof data;
    } catch {
      return null;
    }
    if (data.errorcode || !data.shorturl) return null;
    if (utf8ByteLength(data.shorturl) <= maxBase) return data.shorturl;
    return null;
  };

  const a = await tryGd("is.gd");
  if (a) return a;
  const b = await tryGd("v.gd");
  if (b) return b;

  // Plain-text API; often works when is.gd/v.gd block datacenter IPs
  try {
    const res = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(rawUrl)}`,
      { headers: { Accept: "text/plain,*/*" } },
    );
    if (res.ok) {
      const text = (await res.text()).trim();
      if (
        text.startsWith("http") &&
        !text.toLowerCase().includes("error") &&
        utf8ByteLength(text) <= maxBase
      ) {
        return text;
      }
    }
  } catch {
    /* next */
  }

  throw new Error(
    "Could not shorten the policy link for the blockchain (96 character limit). Try again on another network, disable VPN, or wait a minute and retry.",
  );
}

export function toArc3MetadataUrl(baseWithoutSuffix: string): string {
  const base = baseWithoutSuffix.replace(/#arc3$/, "");
  const full = base + ARC3_SUFFIX;
  if (utf8ByteLength(full) > ASA_URL_MAX_BYTES) {
    throw new Error(
      `ARC-3 metadata URL is ${utf8ByteLength(full)} bytes; max is ${ASA_URL_MAX_BYTES}`,
    );
  }
  return full;
}
