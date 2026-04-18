import type { PoliciesCachePayload } from "./types";

const POLICIES_CACHE_TTL_MS = 25_000; // 25s
const policiesCache = new Map<
  string,
  { data: PoliciesCachePayload; expires: number }
>();

export function getCachedPolicies(wallet: string): PoliciesCachePayload | null {
  const key = wallet.toLowerCase().trim();
  const entry = policiesCache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

export function setCachedPolicies(
  wallet: string,
  data: PoliciesCachePayload,
): void {
  policiesCache.set(wallet.toLowerCase().trim(), {
    data,
    expires: Date.now() + POLICIES_CACHE_TTL_MS,
  });
}
