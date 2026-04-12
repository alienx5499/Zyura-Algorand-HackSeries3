/**
 * Verifies GITHUB_TOKEN by calling GET /user and optionally checks repo owner vs token user.
 * Run: pnpm run verify-github-token   (or: npx tsx scripts/verify-github-token.ts)
 *
 * Optional in .env: GITHUB_EXPECTED_OWNER=yourusername — exits with code 2 if mismatch.
 */

import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const token = process.env.GITHUB_TOKEN?.trim();
if (!token) {
  console.error("GITHUB_TOKEN is not set in .env");
  process.exit(1);
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
} as const;

function printTokenAccessInfo(res: Response, label: string) {
  const oauthScopes = res.headers.get("x-oauth-scopes");
  const acceptedScopes = res.headers.get("x-accepted-oauth-scopes");
  const exp = res.headers.get("github-authentication-token-expiration");
  const rl = res.headers.get("x-ratelimit-limit");
  const rr = res.headers.get("x-ratelimit-remaining");

  console.log(`\n--- ${label} ---`);
  if (oauthScopes && oauthScopes.trim() !== "") {
    const list = oauthScopes.split(/,\s*/).map((s) => s.trim());
    console.log("OAuth scopes (classic PAT / OAuth app):");
    for (const s of list) console.log(`  • ${s}`);
    const needsRepo = list.some((s) => s === "repo" || s.startsWith("repo:"));
    if (!needsRepo) {
      console.warn(
        "  Warning: no full `repo` scope — metadata scripts need Contents read/write on the repo.",
      );
    }
  } else {
    console.log(
      "OAuth scopes: (none in header — typical for fine‑grained PATs; check token settings on GitHub → Developer settings)",
    );
  }
  if (acceptedScopes) console.log(`This endpoint accepts: ${acceptedScopes}`);
  if (exp) console.log(`Token expiration: ${exp}`);
  if (rl && rr) console.log(`REST rate limit: ${rr}/${rl} remaining this hour`);
}

async function main() {
  const res = await fetch("https://api.github.com/user", { headers });
  const bodyText = await res.text();

  if (!res.ok) {
    console.error(`GitHub /user failed: HTTP ${res.status}`);
    console.error(bodyText.slice(0, 500));
    process.exit(1);
  }

  printTokenAccessInfo(res, "Token scopes & limits (from GET /user)");

  const user = JSON.parse(bodyText) as {
    login: string;
    id: number;
    name: string | null;
    type: string;
  };

  console.log(
    `\nAuthenticated user: ${user.login} (${user.type})` +
      (user.name ? ` — ${user.name}` : "") +
      ` [id=${user.id}]`,
  );

  const expected = process.env.GITHUB_EXPECTED_OWNER?.trim();
  if (expected && expected.toLowerCase() !== user.login.toLowerCase()) {
    console.error(
      `Mismatch: GITHUB_EXPECTED_OWNER is "${expected}" but this token is for "${user.login}".`,
    );
    process.exit(2);
  }

  const repoVars = [
    process.env.GITHUB_NFT_REPO,
    process.env.GITHUB_FLIGHT_REPO,
  ].filter(Boolean) as string[];

  const seen = new Set<string>();
  for (const full of repoVars) {
    if (seen.has(full)) continue;
    seen.add(full);

    const parts = full.split("/");
    const owner = parts[0];
    const repo = parts[1];
    if (!owner || !repo) {
      console.warn(`Skipping invalid repo string: ${full}`);
      continue;
    }

    const sameOwner = owner.toLowerCase() === user.login.toLowerCase();
    if (!sameOwner) {
      console.warn(
        `Note: ${full} is under "${owner}"; token user is "${user.login}" (org/collab access may still work).`,
      );
    } else {
      console.log(`Repo owner matches token user: ${full}`);
    }

    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
    });
    if (!r.ok) {
      const errBody = await r.text();
      console.warn(`  Repo API: HTTP ${r.status}`);
      console.warn(`  ${errBody.slice(0, 200)}`);
      console.warn(
        `  Fix: grant this token access to ${owner}/${repo} (fine‑grained) or add classic \`repo\` scope.`,
      );
      continue;
    }
    const repoJson = (await r.json()) as {
      permissions?: {
        admin?: boolean;
        push?: boolean;
        maintain?: boolean;
        triage?: boolean;
        pull?: boolean;
      };
      visibility?: string;
      private?: boolean;
    };
    const p = repoJson.permissions;
    const vis =
      repoJson.visibility ?? (repoJson.private ? "private" : "public");
    console.log(`  Repository: ${owner}/${repo} (${vis})`);
    console.log(
      `  Your access: admin=${Boolean(p?.admin)} maintain=${Boolean(p?.maintain)} push=${Boolean(p?.push)} triage=${Boolean(p?.triage)} pull=${Boolean(p?.pull)}`,
    );
    if (!p?.push && !p?.admin) {
      console.warn(
        `  Warning: token cannot push — Zyura metadata scripts that commit files will fail.`,
      );
    }

    const branch =
      full === process.env.GITHUB_NFT_REPO
        ? process.env.GITHUB_NFT_BRANCH || "main"
        : full === process.env.GITHUB_FLIGHT_REPO
          ? process.env.GITHUB_FLIGHT_BRANCH || "main"
          : "main";
    const contentsUrl = `https://api.github.com/repos/${owner}/${repo}/contents/?ref=${encodeURIComponent(branch)}`;
    const c = await fetch(contentsUrl, { headers });
    const canReadContents = c.ok;
    console.log(
      `  Contents API (list root): ${canReadContents ? "read OK" : `HTTP ${c.status} (need repo Contents: read)`}`,
    );
  }

  console.log(
    "\nSummary: Zyura needs a token that can read/write repo Contents on the metadata repos (classic: `repo`; fine‑grained: Contents R/W for those repos).",
  );
  console.log("Done.");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
