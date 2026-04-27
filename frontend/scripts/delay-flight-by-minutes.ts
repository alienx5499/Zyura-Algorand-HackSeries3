/*
  Delay a flight by N minutes by updating actual_departure_unix in the flight data repo.
  This makes the recorded delay = N minutes so payouts can be triggered (delay >= product threshold).

  Loads GITHUB_TOKEN from frontend .env / .env.local (script location), so you can run from any directory.

  Usage (from repo root or frontend folder):
    FLIGHT_NUMBER=GV697 DELAY_MINUTES=75 npx tsx frontend/scripts/delay-flight-by-minutes.ts
  Or from frontend folder:
    FLIGHT_NUMBER=GV697 DELAY_MINUTES=75 npx tsx scripts/delay-flight-by-minutes.ts
*/

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { githubFlightPath } from "../src/lib/github-metadata-paths";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(frontendRoot, ".env") });
dotenv.config({ path: path.join(frontendRoot, ".env.local"), override: true });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_FLIGHT_REPO =
  process.env.GITHUB_FLIGHT_REPO ||
  process.env.GITHUB_METADATA_REPO ||
  "alienx5499/Zyura-Algorand-HackSeries3-MetaData";
const GITHUB_BRANCH = process.env.GITHUB_FLIGHT_BRANCH || "main";
const FLIGHT_NUMBER = process.env.FLIGHT_NUMBER;
const DELAY_MINUTES = process.env.DELAY_MINUTES
  ? parseInt(process.env.DELAY_MINUTES, 10)
  : undefined;

if (!GITHUB_TOKEN) {
  console.error(
    "GITHUB_TOKEN is required. Set it in frontend .env or .env.local (or pass in the shell).",
  );
  process.exit(1);
}

if (!FLIGHT_NUMBER) {
  console.error("FLIGHT_NUMBER is required (e.g. GV697)");
  process.exit(1);
}

if (
  DELAY_MINUTES === undefined ||
  !Number.isFinite(DELAY_MINUTES) ||
  DELAY_MINUTES < 0
) {
  console.error("DELAY_MINUTES is required (e.g. 75)");
  process.exit(1);
}
const delayMinutes = DELAY_MINUTES;

async function main() {
  const flightRoot = githubFlightPath();
  const filePath = `${flightRoot}/${FLIGHT_NUMBER}/flight.json`;
  const url = `https://api.github.com/repos/${GITHUB_FLIGHT_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(
      `Flight file not found or error: ${res.status} ${await res.text()}`,
    );
    process.exit(1);
  }

  const file = await res.json();
  const content = Buffer.from(file.content, file.encoding || "base64").toString(
    "utf8",
  );
  const flightJson = JSON.parse(content);
  const scheduled = flightJson.scheduled_departure_unix;
  if (scheduled == null || typeof scheduled !== "number") {
    console.error("Flight JSON missing scheduled_departure_unix");
    process.exit(1);
  }

  const actualDepartureUnix = scheduled + delayMinutes * 60;
  console.log(
    `Flight ${FLIGHT_NUMBER}: scheduled=${scheduled} (${new Date(scheduled * 1000).toISOString()})`,
  );
  console.log(
    `Setting actual departure ${delayMinutes} min later: ${actualDepartureUnix} (${new Date(actualDepartureUnix * 1000).toISOString()})`,
  );

  const apiUrl = process.env.API_URL || "http://localhost:3000";
  const endpoint = `${apiUrl}/api/zyura/flight/update-departure`;
  const apiKey = process.env.FLIGHT_UPDATE_API_KEY || "zyura@admin";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  };

  const updateRes = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      flight_number: FLIGHT_NUMBER,
      actual_departure_unix: actualDepartureUnix,
    }),
  });

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    console.error(
      "Update failed:",
      (err as any).error || updateRes.status,
      err,
    );
    process.exit(1);
  }

  const result = await updateRes.json();
  console.log(
    "Flight delay updated. Recorded delay:",
    result.delay_minutes,
    "minutes",
  );
  console.log(
    "\nNext: run payout for policies on this flight from contracts folder:",
  );
  console.log(
    "  cd ../contracts && POLICY_IDS=<id1>,<id2> DELAY_MINUTES=" +
      delayMinutes +
      " npx ts-node scripts/run-payout.ts",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
