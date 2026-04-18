import { githubNftPath } from "@/lib/github-metadata-paths";

export const GITHUB_NFT_REPO =
  process.env.GITHUB_NFT_REPO ||
  process.env.GITHUB_METADATA_REPO ||
  "alienx5499/Zyura-Algorand-HackSeries3-MetaData";

export const GITHUB_BRANCH =
  process.env.GITHUB_NFT_BRANCH || process.env.GITHUB_BRANCH || "main";

export const GITHUB_PATH = githubNftPath();

export const INDEXER_URL = process.env.NEXT_PUBLIC_ALGOD_URL?.includes(
  "algonode",
)
  ? "https://testnet-idx.algonode.cloud"
  : process.env.NEXT_PUBLIC_INDEXER_URL || "https://testnet-idx.algonode.cloud";

export function githubContentsHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function expectedZyuraAppId(): string {
  return String(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "").trim();
}

export function policyMetadataMatchesCurrentProgram(
  metadata: unknown,
): boolean {
  const expected = expectedZyuraAppId();
  if (!expected) return true;
  const m = metadata as Record<string, unknown> | null | undefined;
  if (!m) return true;
  const raw = m.zyura_app_id ?? m.zyuraAppId;
  if (raw === undefined || raw === null || raw === "") return true;
  return String(raw).trim() === expected;
}
