/**
 * Generate synthetic flight.json in the GitHub metadata repo (same shape as /api/zyura/flight/register).
 * All flights are pushed in ONE git commit (Git Data API).
 *
 *   cd frontend && npx tsx scripts/generate-flight-metadata.ts
 *
 * Env:
 *   NEW_FLIGHT_COUNT=10        — how many flights to create (default 1)
 *   PNR_MIN=1 PNR_MAX=10       — random PNR count per flight inclusive (defaults 1–10)
 *   PNR_COUNT=5                — optional fixed PNRs per flight (overrides random range)
 *   CLEAN_FLIGHT_TREE=1        — delete all existing .../flight.json under the flight path, then add new
 *   COMMIT_MESSAGE="..."       — override default "update: N flights generated (... PNRs)"
 *   FLIGHT_NUMBER=GV697        — optional fixed flight number for the first flight only
 *   FUTURE_DAYS_MIN / FUTURE_DAYS_MAX — departure window (default 1–365 days ahead); time-of-day is random
 *   SCHEDULED_DEPARTURE_UNIX=  FLIGHT_DATE=  NEW_FLIGHT_ORIGIN=  NEW_FLIGHT_DESTINATION=
 */

import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { githubFlightPath } from "../src/lib/github-metadata-paths";

dotenv.config({ path: path.join(__dirname, "../.env") });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO =
  process.env.GITHUB_FLIGHT_REPO ||
  process.env.GITHUB_METADATA_REPO ||
  "alienx5499/Zyura-Algorand-HackSeries3-MetaData";
const GITHUB_BRANCH =
  process.env.GITHUB_FLIGHT_BRANCH || process.env.GITHUB_BRANCH || "main";
const GITHUB_FLIGHT_PATH = githubFlightPath();

const NEW_FLIGHT_COUNT = Math.max(1, Number(process.env.NEW_FLIGHT_COUNT ?? 1));
const PNR_MIN = Math.max(1, Number(process.env.PNR_MIN ?? 1));
const PNR_MAX = Math.max(PNR_MIN, Number(process.env.PNR_MAX ?? 10));
const FIXED_PNR_PER_FLIGHT =
  process.env.PNR_COUNT !== undefined && process.env.PNR_COUNT !== ""
    ? Math.max(1, Number(process.env.PNR_COUNT))
    : null;
const CLEAN_FLIGHT_TREE =
  process.env.CLEAN_FLIGHT_TREE === "1" ||
  process.env.CLEAN_FLIGHT_TREE === "true";
const FIXED_FLIGHT_NUMBER = process.env.FLIGHT_NUMBER?.trim();

/** Random future departure: independent date (day offset) and time-of-day per flight. */
const FUTURE_DAYS_MIN = Math.max(1, Number(process.env.FUTURE_DAYS_MIN ?? 1));
const FUTURE_DAYS_MAX = Math.max(
  FUTURE_DAYS_MIN,
  Number(process.env.FUTURE_DAYS_MAX ?? 365),
);

const FLIGHT_LETTER_SET = "ABCDEFGHJKLMNPQRSTUVWXYZ";

const AIRPORT_CODES = [
  "JFK",
  "LAX",
  "SFO",
  "SEA",
  "ORD",
  "ATL",
  "DFW",
  "DEN",
  "BOS",
  "MIA",
  "PHX",
  "LAS",
  "IAD",
  "CLT",
  "DTW",
  "MSP",
  "FLL",
  "SLC",
  "SAN",
  "BWI",
];

const FIRST_NAMES = [
  "Avery",
  "Jordan",
  "Taylor",
  "Morgan",
  "Riley",
  "Harper",
  "Logan",
  "Emerson",
  "Quinn",
  "Parker",
  "Noah",
  "Maya",
  "Ethan",
  "Zoe",
  "Mila",
  "Caleb",
  "Luca",
  "Iris",
];

const LAST_NAMES = [
  "Anderson",
  "Bennett",
  "Campbell",
  "Diaz",
  "Ellis",
  "Foster",
  "Garcia",
  "Nguyen",
  "Patel",
  "Reed",
  "Silva",
  "Turner",
  "Walker",
  "Ramirez",
  "Thompson",
];

const EMAIL_DOMAINS = [
  "gmail.com",
  "outlook.com",
  "icloud.com",
  "yahoo.com",
  "example.com",
];

type Passenger = {
  fullName: string;
  dateOfBirth?: string;
  documentId?: string;
  seat?: string;
  email?: string;
  phone?: string;
};

type PnrRecord = {
  pnr: string;
  policyId: number | "NA";
  policyholder: string | "NA";
  wallet: string | "NA";
  passenger: Passenger;
  nft_metadata_url: string | "NA";
  created_at: number;
  updated_at: number;
};

type FlightRecord = {
  flight_number: string;
  date: string;
  scheduled_departure_unix?: number;
  actual_departure_unix?: number;
  origin?: string;
  destination?: string;
  status?: "scheduled" | "departed" | "landed" | "cancelled" | "unknown";
  delay_minutes?: number;
  pnrs: PnrRecord[];
  created_at: number;
  updated_at: number;
};

function githubHeaders(): Record<string, string> {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not set in .env");
  return {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function targetPath(flightNumber: string): string {
  return `${GITHUB_FLIGHT_PATH}/${flightNumber}/flight.json`;
}

function contentsUrl(relPath: string): string {
  const [owner, repo] = GITHUB_REPO.split("/", 2);
  return `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(relPath)}`;
}

async function listFlightDirs(): Promise<string[]> {
  const url = `${contentsUrl(GITHUB_FLIGHT_PATH)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (res.status === 404) return [];
  if (!res.ok)
    throw new Error(
      `List ${GITHUB_FLIGHT_PATH}: ${res.status} ${await res.text()}`,
    );
  const entries = (await res.json()) as Array<{ name: string; type: string }>;
  return entries.filter((e) => e.type === "dir").map((e) => e.name);
}

async function collectExistingPnrs(): Promise<Set<string>> {
  const set = new Set<string>();
  const dirs = await listFlightDirs();
  for (const flightNum of dirs) {
    try {
      const rec = await fetchFlightJson(flightNum);
      for (const p of rec.pnrs || []) {
        if (p?.pnr) set.add(String(p.pnr).toUpperCase());
      }
    } catch {
      /* skip */
    }
  }
  return set;
}

async function fetchFlightJson(flightNumber: string): Promise<FlightRecord> {
  const url = `${contentsUrl(targetPath(flightNumber))}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) throw new Error(`No flight.json for ${flightNumber}`);
  const json = (await res.json()) as { content: string; encoding?: string };
  const decoded = Buffer.from(json.content, "base64").toString("utf8");
  return JSON.parse(decoded) as FlightRecord;
}

type GitTreeEntry = {
  path: string;
  mode: "100644";
  type: "blob";
  content?: string;
  sha?: string | null;
};

async function getBranchTipSha(
  owner: string,
  repo: string,
): Promise<{ commitSha: string; treeSha: string }> {
  const refRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(GITHUB_BRANCH)}`,
    { headers: githubHeaders() },
  );
  if (!refRes.ok)
    throw new Error(
      `get ref heads/${GITHUB_BRANCH}: ${refRes.status} ${await refRes.text()}`,
    );
  const ref = (await refRes.json()) as { object: { sha: string } };
  const commitSha = ref.object.sha;
  const commitRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`,
    {
      headers: githubHeaders(),
    },
  );
  if (!commitRes.ok)
    throw new Error(
      `get commit: ${commitRes.status} ${await commitRes.text()}`,
    );
  const commit = (await commitRes.json()) as { tree: { sha: string } };
  return { commitSha, treeSha: commit.tree.sha };
}

async function listExistingFlightJsonPathsFromTree(
  owner: string,
  repo: string,
  treeSha: string,
): Promise<string[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`;
  const res = await fetch(url, { headers: githubHeaders() });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    tree?: Array<{ path?: string; type?: string }>;
  };
  const prefix = `${GITHUB_FLIGHT_PATH}/`;
  return (data.tree || [])
    .filter(
      (t) =>
        t.type === "blob" &&
        t.path?.endsWith("/flight.json") &&
        t.path.startsWith(prefix),
    )
    .map((t) => t.path!);
}

async function pushFlightsSingleCommit(
  records: FlightRecord[],
  commitMessage: string,
): Promise<void> {
  const [owner, repo] = GITHUB_REPO.split("/", 2);
  const { commitSha, treeSha } = await getBranchTipSha(owner, repo);

  const newPaths = new Set(records.map((r) => targetPath(r.flight_number)));
  const tree: GitTreeEntry[] = [];

  if (CLEAN_FLIGHT_TREE) {
    const existing = await listExistingFlightJsonPathsFromTree(
      owner,
      repo,
      treeSha,
    );
    for (const p of existing) {
      if (!newPaths.has(p)) {
        tree.push({ path: p, mode: "100644", type: "blob", sha: null });
      }
    }
  }

  for (const record of records) {
    const p = targetPath(record.flight_number);
    tree.push({
      path: p,
      mode: "100644",
      type: "blob",
      content: `${JSON.stringify(record, null, 2)}\n`,
    });
  }

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees`,
    {
      method: "POST",
      headers: { ...githubHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ base_tree: treeSha, tree }),
    },
  );
  if (!treeRes.ok)
    throw new Error(`create tree: ${treeRes.status} ${await treeRes.text()}`);
  const newTree = (await treeRes.json()) as { sha: string };

  const commitRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/commits`,
    {
      method: "POST",
      headers: { ...githubHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: commitMessage,
        tree: newTree.sha,
        parents: [commitSha],
      }),
    },
  );
  if (!commitRes.ok)
    throw new Error(
      `create commit: ${commitRes.status} ${await commitRes.text()}`,
    );
  const newCommit = (await commitRes.json()) as { sha: string };

  const refPatch = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(GITHUB_BRANCH)}`,
    {
      method: "PATCH",
      headers: { ...githubHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ sha: newCommit.sha }),
    },
  );
  if (!refPatch.ok)
    throw new Error(`update ref: ${refPatch.status} ${await refPatch.text()}`);

  console.log(
    `Pushed 1 commit to ${GITHUB_REPO}@${GITHUB_BRANCH} (${records.length} flight(s))`,
  );
}

function randomLetter(): string {
  return FLIGHT_LETTER_SET.charAt(
    crypto.randomInt(0, FLIGHT_LETTER_SET.length),
  );
}

function randomFlightCode(): string {
  return `${randomLetter()}${randomLetter()}${crypto.randomInt(0, 10)}${crypto.randomInt(0, 10)}${crypto.randomInt(0, 10)}`;
}

function randomAirport(exclude?: string): string {
  const pool = exclude
    ? AIRPORT_CODES.filter((c) => c !== exclude)
    : AIRPORT_CODES;
  return pool[crypto.randomInt(0, pool.length)];
}

function randomFutureUnix(): number {
  const now = Math.floor(Date.now() / 1000);
  const daySec = 24 * 60 * 60;
  const daysAhead = crypto.randomInt(FUTURE_DAYS_MIN, FUTURE_DAYS_MAX + 1);
  const secondsIntoDay = crypto.randomInt(0, daySec);
  return now + daysAhead * daySec + secondsIntoDay;
}

function pnrCountForFlight(): number {
  if (FIXED_PNR_PER_FLIGHT !== null) return FIXED_PNR_PER_FLIGHT;
  return crypto.randomInt(PNR_MIN, PNR_MAX + 1);
}

function generateUniquePnrs(existing: Set<string>, count: number): string[] {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const out: string[] = [];
  while (out.length < count) {
    let candidate = "";
    for (let i = 0; i < 6; i++) {
      candidate += charset.charAt(crypto.randomInt(0, charset.length));
    }
    const up = candidate.toUpperCase();
    if (!existing.has(up) && !out.includes(up)) {
      out.push(up);
      existing.add(up);
    }
  }
  return out;
}

function randomPassenger(pnr: string, index: number, ts: number): PnrRecord {
  const first = FIRST_NAMES[crypto.randomInt(0, FIRST_NAMES.length)];
  const last = LAST_NAMES[crypto.randomInt(0, LAST_NAMES.length)];
  const dobStart = new Date("1955-01-01").getTime();
  const dobEnd = new Date("2005-12-31").getTime();
  const dob = new Date(dobStart + crypto.randomInt(0, dobEnd - dobStart))
    .toISOString()
    .slice(0, 10);
  const seat = `${crypto.randomInt(1, 31)}${["A", "B", "C", "D", "E", "F"][crypto.randomInt(0, 6)]}`;
  const domain = EMAIL_DOMAINS[crypto.randomInt(0, EMAIL_DOMAINS.length)];
  const email = `${first.toLowerCase()}.${last.toLowerCase()}${index}@${domain}`;
  const area = 200 + crypto.randomInt(0, 700);
  const phone = `+1-${area}-${200 + crypto.randomInt(0, 700)}-${crypto.randomInt(0, 10000).toString().padStart(4, "0")}`;

  return {
    pnr,
    policyId: "NA",
    policyholder: "NA",
    wallet: "NA",
    passenger: {
      fullName: `${first} ${last}`,
      dateOfBirth: dob,
      documentId: `P${pnr}${index}`.slice(0, 12),
      seat,
      email,
      phone,
    },
    nft_metadata_url: "NA",
    created_at: ts,
    updated_at: ts,
  };
}

function buildFlightRecord(
  flightNumber: string,
  pnrCodes: string[],
  origin: string,
  destination: string,
  scheduledUnix: number,
  flightDate: string,
  recordTimestamp: number,
): FlightRecord {
  const ts = recordTimestamp;
  return {
    flight_number: flightNumber,
    date: flightDate,
    scheduled_departure_unix: scheduledUnix,
    origin,
    destination,
    status: "scheduled",
    delay_minutes: 0,
    pnrs: pnrCodes.map((code, i) => randomPassenger(code, i, ts)),
    created_at: ts,
    updated_at: ts,
  };
}

async function main(): Promise<void> {
  if (!GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN is required in frontend/.env");
    process.exit(1);
  }

  const existingPnrs = CLEAN_FLIGHT_TREE
    ? new Set<string>()
    : await collectExistingPnrs();
  const usedFlightNumbers = CLEAN_FLIGHT_TREE
    ? new Set<string>()
    : new Set(await listFlightDirs());

  if (CLEAN_FLIGHT_TREE) {
    console.log(
      "CLEAN_FLIGHT_TREE: existing flight JSON under the path will be removed unless reused.",
    );
  } else {
    console.log(`Existing PNRs in repo (all flights): ${existingPnrs.size}`);
  }

  const records: FlightRecord[] = [];
  const created: string[] = [];
  let totalPnrs = 0;

  for (let n = 0; n < NEW_FLIGHT_COUNT; n++) {
    let flightNumber: string;
    if (n === 0 && FIXED_FLIGHT_NUMBER) {
      flightNumber = FIXED_FLIGHT_NUMBER.toUpperCase();
    } else {
      let attempts = 0;
      do {
        flightNumber = randomFlightCode();
        if (++attempts > 2000)
          throw new Error("Could not allocate unique flight number");
      } while (usedFlightNumbers.has(flightNumber));
    }
    usedFlightNumbers.add(flightNumber);

    const origin = process.env.NEW_FLIGHT_ORIGIN || randomAirport();
    let destination =
      process.env.NEW_FLIGHT_DESTINATION || randomAirport(origin);
    if (destination === origin) destination = randomAirport(origin);

    const scheduledUnix =
      process.env.SCHEDULED_DEPARTURE_UNIX != null &&
      process.env.SCHEDULED_DEPARTURE_UNIX !== ""
        ? Number(process.env.SCHEDULED_DEPARTURE_UNIX)
        : randomFutureUnix();
    const flightDate =
      process.env.FLIGHT_DATE ||
      new Date(scheduledUnix * 1000).toISOString().slice(0, 10);

    const count = pnrCountForFlight();
    const codes = generateUniquePnrs(existingPnrs, count);
    totalPnrs += codes.length;

    const recordTimestamp = Math.floor(Date.now() / 1000) + n;

    const record = buildFlightRecord(
      flightNumber,
      codes,
      origin,
      destination,
      scheduledUnix,
      flightDate,
      recordTimestamp,
    );
    records.push(record);
    created.push(flightNumber);
    console.log(
      `Flight ${flightNumber}: ${codes.length} PNRs (${origin} → ${destination}, ${flightDate})`,
    );
  }

  const defaultMsg = `update: ${records.length} flights generated (${totalPnrs} PNRs)`;
  const commitMessage = (process.env.COMMIT_MESSAGE || "").trim() || defaultMsg;

  await pushFlightsSingleCommit(records, commitMessage);
  console.log(`Done. ${commitMessage}`);
  console.log(`Flights: ${created.join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
