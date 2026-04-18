import {
  GITHUB_BRANCH,
  GITHUB_NFT_REPO,
  GITHUB_PATH,
  githubContentsHeaders,
} from "@/lib/zyura/policies/config";

export function parseWalletDirFromMetadataUrl(params: {
  metadataUrl: string;
  policyId: string;
}): string | null {
  const { metadataUrl, policyId } = params;
  try {
    const u = new URL(metadataUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    const idxBranch = parts.indexOf(GITHUB_BRANCH);
    if (idxBranch < 0) return null;
    const after = parts.slice(idxBranch + 1);
    const pathParts = GITHUB_PATH.split("/").filter(Boolean);
    for (let i = 0; i < pathParts.length; i++) {
      if (after[i] !== pathParts[i]) return null;
    }
    const walletDir = after[pathParts.length];
    const pid = after[pathParts.length + 1];
    if (!walletDir || pid !== String(policyId)) return null;
    return walletDir;
  } catch {
    return null;
  }
}

export async function tryFinalizeGithubMetadataFromDraft(params: {
  walletDir: string;
  policyId: string;
  nftAssetId: number;
  metadata: unknown;
}) {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
  if (!token) return;

  const { walletDir, policyId, nftAssetId, metadata } = params;
  if (!metadata || typeof metadata !== "object") return;

  const m = metadata as Record<string, any>;
  const purchasedIso = new Date().toISOString();
  const purchasedUnix = Math.floor(Date.now() / 1000);

  const attrs = Array.isArray(m.attributes) ? [...m.attributes] : [];
  const upsertAttr = (trait_type: string, value: unknown) => {
    const i = attrs.findIndex((a: any) => a?.trait_type === trait_type);
    if (i >= 0) attrs[i] = { ...attrs[i], value };
    else attrs.push({ trait_type, value });
  };
  upsertAttr("Status", "ACTIVE");
  upsertAttr("NFT Asset ID", nftAssetId);
  upsertAttr("Purchased At", purchasedIso);

  const updatedMetadata = {
    ...m,
    status: "ACTIVE",
    nft_asset_id: nftAssetId,
    purchased_at: m.purchased_at ?? purchasedIso,
    purchased_at_unix: m.purchased_at_unix ?? purchasedUnix,
    attributes: attrs,
  };

  const filePath = `${GITHUB_PATH}/${walletDir}/${policyId}/policy.json`;
  const checkUrl = `https://api.github.com/repos/${GITHUB_NFT_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;
  let sha: string | null = null;
  const checkRes = await fetch(checkUrl, {
    headers: githubContentsHeaders(),
    cache: "no-store",
  });
  if (checkRes.ok) {
    const j = (await checkRes.json()) as { sha?: string };
    sha = typeof j.sha === "string" ? j.sha : null;
  } else {
    return;
  }
  if (!sha) return;

  const putUrl = `https://api.github.com/repos/${GITHUB_NFT_REPO}/contents/${filePath}`;
  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers: {
      ...githubContentsHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Finalize policy ${policyId} after on-chain confirmation`,
      content: Buffer.from(
        JSON.stringify(updatedMetadata, null, 2),
        "utf8",
      ).toString("base64"),
      branch: GITHUB_BRANCH,
      sha,
    }),
  });
  if (!putRes.ok) return;
}
