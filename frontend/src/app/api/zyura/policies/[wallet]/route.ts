import { NextRequest, NextResponse } from "next/server";
import { createPolicyBoxCache } from "@/lib/zyura/algod-policy-box-cache";
import {
  enrichCoverageFromProduct,
  enrichPayoutTxIds,
  enrichPolicyStatusFromChain,
  fetchPoliciesFromGitHubMetadata,
  fetchPoliciesFromIndexer,
  getCachedPolicies,
  setCachedPolicies,
} from "@/lib/zyura/policies";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const noCache = req.nextUrl.searchParams.get("noCache") === "true";
    if (!noCache) {
      const cached = getCachedPolicies(wallet);
      if (cached) return NextResponse.json(cached);
    }

    const baseUrl =
      req.nextUrl?.origin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const boxCache = createPolicyBoxCache();
    const indexerPolicies = await fetchPoliciesFromIndexer(wallet, boxCache);
    if (indexerPolicies.length > 0) {
      const appId = parseInt(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "0", 10);
      if (appId) {
        await enrichPolicyStatusFromChain(indexerPolicies, appId, boxCache);
        await enrichPayoutTxIds(indexerPolicies, appId);
      }
      await enrichCoverageFromProduct(indexerPolicies, baseUrl);
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

    const validPolicies = await fetchPoliciesFromGitHubMetadata(
      wallet,
      baseUrl,
      boxCache,
    );
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
