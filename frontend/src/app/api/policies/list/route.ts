import { NextRequest, NextResponse } from "next/server";
import { githubNftPath } from "@/lib/github-metadata-paths";

// NOTE: This route currently only uses GitHub metadata (no on-chain Algorand reads yet).
// Once the dashboard is fully migrated, we can replace any legacy logic below
// with Algorand indexer / Zyura app reads.
const GITHUB_REPO =
  process.env.GITHUB_NFT_REPO ||
  process.env.GITHUB_METADATA_REPO ||
  "alienx5499/Zyura-Algorand-HackSeries3-MetaData";
const GITHUB_BRANCH = process.env.GITHUB_NFT_BRANCH || "main";
const GITHUB_NFT_PATH = githubNftPath();

interface GitHubFile {
  name: string;
  path: string;
  type: "file" | "dir";
  sha?: string;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

async function listGitHubDirectory(
  path: string,
): Promise<{ files: GitHubFile[]; rateLimit: RateLimitInfo | null }> {
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`;

  // Get GitHub PAT from environment variables
  const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;

  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "ZYURA-App",
    };

    // Add Authorization header if token is available
    if (githubToken) {
      headers.Authorization = `token ${githubToken}`;
    }

    const response = await fetch(apiUrl, {
      headers,
      // Cache for 1 minute to reduce API calls
      next: { revalidate: 60 },
    });

    // Extract rate limit info from headers
    const rateLimit: RateLimitInfo | null = {
      limit: parseInt(response.headers.get("x-ratelimit-limit") || "0", 10),
      remaining: parseInt(
        response.headers.get("x-ratelimit-remaining") || "0",
        10,
      ),
      reset: parseInt(response.headers.get("x-ratelimit-reset") || "0", 10),
    };

    // Log rate limit info with auth status
    const authStatus = githubToken ? "authenticated" : "unauthenticated";
    if (rateLimit.remaining > 0) {
      console.log(
        `[GitHub API] Rate limit (${authStatus}): ${rateLimit.remaining}/${rateLimit.limit} remaining. Resets at: ${new Date(rateLimit.reset * 1000).toISOString()}`,
      );
    } else {
      console.warn(
        `[GitHub API] Rate limit exhausted (${authStatus})! Resets at: ${new Date(rateLimit.reset * 1000).toISOString()}`,
      );
    }

    if (!response.ok) {
      return { files: [], rateLimit };
    }

    const data = await response.json();
    return {
      files: Array.isArray(data) ? data : [],
      rateLimit,
    };
  } catch (error) {
    return { files: [], rateLimit: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    let latestRateLimit: RateLimitInfo | null = null;

    // Step 1: Get all policyholder addresses available on GitHub
    console.log("[Step 1] Fetching policyholder accounts from GitHub...");
    const metadataResult = await listGitHubDirectory(GITHUB_NFT_PATH);
    latestRateLimit = metadataResult.rateLimit || latestRateLimit;

    if (metadataResult.files.length === 0) {
      return NextResponse.json({
        images: [],
        rateLimit: latestRateLimit,
      });
    }

    // Extract policyholder addresses from GitHub
    const githubPolicyholders = metadataResult.files
      .filter((item) => item.type === "dir")
      .map((item) => item.name);

    console.log(
      `[Step 1] Found ${githubPolicyholders.length} policyholder accounts on GitHub:`,
      githubPolicyholders.slice(0, 5),
      "...",
    );

    // Step 2: Build policy image list from GitHub metadata only (no on-chain reads)
    console.log("[Step 2] Building policy images from GitHub metadata only...");
    const policyImages: Array<{
      imageUrl: string;
      policyId: string;
      policyholder: string;
      flightNumber?: string;
    }> = [];

    console.log(
      `[Step 2] Discovering policy folders for ${githubPolicyholders.length} policyholders...`,
    );
    for (const policyholder of githubPolicyholders) {
      const policyholderPath = `${GITHUB_NFT_PATH}/${policyholder}`;
      const policyFoldersResult = await listGitHubDirectory(policyholderPath);
      latestRateLimit = policyFoldersResult.rateLimit || latestRateLimit;

      const policyIds = policyFoldersResult.files
        .filter((item) => item.type === "dir")
        .map((item) => item.name);

      for (const policyId of policyIds) {
        if (policyImages.length >= limit) break;

        const policyPath = `${GITHUB_NFT_PATH}/${policyholder}/${policyId}`;
        const policyFilesResult = await listGitHubDirectory(policyPath);
        latestRateLimit = policyFilesResult.rateLimit || latestRateLimit;

        const svgFile = policyFilesResult.files.find(
          (file: GitHubFile) =>
            file.name === "policy.svg" && file.type === "file",
        );

        if (!svgFile) continue;

        const imageUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${policyPath}/policy.svg`;

        // Try to get flight number from GitHub JSON if available
        let flightNumber: string | undefined;
        const jsonFile = policyFilesResult.files.find(
          (file: GitHubFile) =>
            file.name === "policy.json" && file.type === "file",
        );
        if (jsonFile) {
          try {
            const jsonUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${policyPath}/policy.json`;
            const jsonResponse = await fetch(jsonUrl, {
              next: { revalidate: 60 },
            });
            if (jsonResponse.ok) {
              const metadata = await jsonResponse.json();
              flightNumber =
                metadata.flight ||
                metadata.attributes?.find(
                  (attr: any) =>
                    attr.trait_type === "Flight" ||
                    attr.trait_type === "Flight Number" ||
                    attr.trait_type === "flight_number",
                )?.value ||
                metadata.flightNumber ||
                metadata.flight_number;
            }
          } catch {
            // Ignore JSON parsing errors
          }
        }

        policyImages.push({
          imageUrl,
          policyId,
          policyholder,
          flightNumber,
        });
      }
    }

    // Log final rate limit status
    const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
    const authStatus = githubToken ? "authenticated" : "unauthenticated";
    if (latestRateLimit) {
      console.log(
        `[GitHub API] Final rate limit (${authStatus}): ${latestRateLimit.remaining}/${latestRateLimit.limit} remaining`,
      );
    }

    console.log(
      `[Step 3] Matched ${policyImages.length} policies with GitHub metadata`,
    );

    const response = NextResponse.json({
      images: policyImages.slice(0, limit),
      rateLimit: latestRateLimit,
    });

    // Add caching headers - cache for 5 minutes, allow stale-while-revalidate
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600",
    );

    return response;
  } catch (error) {
    console.error("[API] Error fetching policies:", error);
    return NextResponse.json(
      {
        images: [],
        rateLimit: null,
      },
      { status: 500 },
    );
  }
}
