/**
 * Cleanup script to remove localnet test data from GitHub repos
 * Run: npx tsx scripts/cleanup-github.ts
 */

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const NFT_REPO =
  process.env.GITHUB_NFT_REPO ||
  process.env.GITHUB_METADATA_REPO ||
  "alienx5499/Zyura-Algorand-HackSeries3-MetaData";
const FLIGHT_REPO =
  process.env.GITHUB_FLIGHT_REPO ||
  process.env.GITHUB_METADATA_REPO ||
  "alienx5499/Zyura-Algorand-HackSeries3-MetaData";
const NFT_BRANCH = process.env.GITHUB_NFT_BRANCH || "main";
const FLIGHT_BRANCH = process.env.GITHUB_FLIGHT_BRANCH || "main";

const NFT_PATH_PREFIX = `${process.env.GITHUB_NFT_PATH || process.env.GITHUB_PATH || "NFT/metadata"}/`;
const FLIGHT_PATH_PREFIX = `${process.env.GITHUB_FLIGHT_PATH || "Flight/Metadata/flights"}/`;

if (!GITHUB_TOKEN) {
  console.error("GITHUB_TOKEN not set in .env");
  process.exit(1);
}

interface GitHubFile {
  path: string;
  sha: string;
  type: string;
}

async function listAllFiles(
  repo: string,
  branch: string,
  pathPrefix: string = "",
): Promise<GitHubFile[]> {
  const files: GitHubFile[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const url = `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1&per_page=${perPage}&page=${page}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to list files: ${res.status} ${error}`);
    }

    const data = await res.json();
    const tree = data.tree || [];

    for (const item of tree) {
      if (
        item.type === "blob" &&
        (!pathPrefix || item.path.startsWith(pathPrefix))
      ) {
        files.push({ path: item.path, sha: item.sha, type: item.type });
      }
    }

    if (tree.length < perPage) break;
    page++;
  }

  return files;
}

async function deleteFile(
  repo: string,
  branch: string,
  filePath: string,
  sha: string,
): Promise<boolean> {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Cleanup: Remove localnet test file ${filePath}`,
      sha,
      branch,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error(`  Failed to delete ${filePath}: ${res.status} ${error}`);
    return false;
  }

  return true;
}

async function cleanupRepo(
  repo: string,
  branch: string,
  pathPrefix: string,
  repoName: string,
) {
  console.log(`\nCleaning ${repoName} (${repo})...`);
  console.log(`   Path prefix: ${pathPrefix || "(all files)"}`);

  try {
    const files = await listAllFiles(repo, branch, pathPrefix);
    console.log(`   Found ${files.length} files`);

    if (files.length === 0) {
      console.log(`   No files to clean`);
      return;
    }

    const testFiles = files.filter((f) => f.path.startsWith(pathPrefix));

    console.log(`   Deleting ${testFiles.length} test files...`);

    let deleted = 0;
    let failed = 0;

    for (const file of testFiles) {
      const success = await deleteFile(repo, branch, file.path, file.sha);
      if (success) {
        deleted++;
        console.log(`   Deleted: ${file.path}`);
      } else {
        failed++;
      }
      // Rate limit: wait 100ms between deletions
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`\n   Deleted: ${deleted}, Failed: ${failed}`);
  } catch (error: any) {
    console.error(`   Error cleaning ${repoName}:`, error.message);
  }
}

async function main() {
  console.log("GitHub Cleanup Script");
  console.log("========================\n");
  console.log("This will DELETE all test files from GitHub repos!");
  console.log("   NFT Repo:", NFT_REPO);
  console.log("   Flight Repo:", FLIGHT_REPO);
  console.log(
    "\n   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n",
  );

  await new Promise((resolve) => setTimeout(resolve, 5000));

  await cleanupRepo(NFT_REPO, NFT_BRANCH, NFT_PATH_PREFIX, "NFT tree");
  await cleanupRepo(
    FLIGHT_REPO,
    FLIGHT_BRANCH,
    FLIGHT_PATH_PREFIX,
    "Flight tree",
  );

  console.log("\nCleanup complete!");
  console.log("\nNext steps:");
  console.log("   1. Update .env for testnet deployment");
  console.log("   2. Run: cd contracts && npm run build");
  console.log("   3. Run: npx tsx scripts/deploy-and-create-products.ts");
  console.log("   4. Update frontend .env with new APP_ID and USDC_ASA_ID");
}

main().catch(console.error);
