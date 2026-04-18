import algosdk from "algosdk";

/** Box payload, or null if missing (404), or "err" on transport / non-404 HTTP failure. */
export type PolicyBoxBytes = Uint8Array | null | "err";

/** Per-request dedupe: key is `${prefix}:${policyId}` (same app + algod for the request). */
export type PolicyBoxCache = Map<string, Promise<PolicyBoxBytes>>;

export function createPolicyBoxCache(): PolicyBoxCache {
  return new Map();
}

function policyBoxName(prefix: string, policyId: string): Uint8Array | null {
  const id = String(policyId).trim();
  if (!/^\d+$/.test(id)) return null;
  const prefixBytes = new TextEncoder().encode(prefix);
  const idBytes = algosdk.encodeUint64(BigInt(id));
  const name = new Uint8Array(prefixBytes.length + idBytes.length);
  name.set(prefixBytes, 0);
  name.set(idBytes, prefixBytes.length);
  return name;
}

function boxRequestUrl(
  appId: number,
  boxName: Uint8Array,
  algodUrl: string,
): string {
  const boxNameB64 = Buffer.from(boxName).toString("base64");
  const base = algodUrl.replace(/\/$/, "");
  const u = new URL(`${base}/v2/applications/${appId}/box`);
  u.searchParams.set("name", `b64:${boxNameB64}`);
  return u.toString();
}

function cacheKey(prefix: string, policyId: string): string {
  return `${prefix}:${policyId}`;
}

async function fetchPolicyBoxBytesOnce(
  appId: number,
  prefix: string,
  policyId: string,
  algodUrl: string,
  token: string,
): Promise<PolicyBoxBytes> {
  const name = policyBoxName(prefix, policyId);
  if (!name) return "err";
  try {
    const res = await fetch(boxRequestUrl(appId, name, algodUrl), {
      cache: "no-store",
      headers: token ? { "X-Algo-API-Token": token } : {},
    });
    if (res.status === 404) return null;
    if (!res.ok) return "err";
    const json = (await res.json()) as { value?: string };
    if (!json.value || typeof json.value !== "string") return null;
    return new Uint8Array(Buffer.from(json.value, "base64"));
  } catch {
    return "err";
  }
}

export async function getCachedPolicyBoxBytes(
  cache: PolicyBoxCache | undefined,
  appId: number,
  prefix: string,
  policyId: string,
  algodUrl: string,
  token: string,
): Promise<PolicyBoxBytes> {
  const k = cacheKey(prefix, policyId);
  if (cache) {
    let p = cache.get(k);
    if (!p) {
      p = fetchPolicyBoxBytesOnce(appId, prefix, policyId, algodUrl, token);
      cache.set(k, p);
    }
    return p;
  }
  return fetchPolicyBoxBytesOnce(appId, prefix, policyId, algodUrl, token);
}
