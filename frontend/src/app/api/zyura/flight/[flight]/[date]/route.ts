import { NextRequest, NextResponse } from "next/server";
import { githubFlightPath } from "@/lib/github-metadata-paths";

const FLIGHT_REPO =
  process.env.GITHUB_FLIGHT_REPO ||
  process.env.GITHUB_METADATA_REPO ||
  "alienx5499/Zyura-Algorand-HackSeries3-MetaData";

const GITHUB_BRANCH =
  process.env.GITHUB_FLIGHT_BRANCH || process.env.GITHUB_BRANCH || "main";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ flight: string; date: string }> },
) {
  try {
    const { flight, date } = await params;
    const flightRoot = githubFlightPath();
    const flightFileUrl = `https://raw.githubusercontent.com/${FLIGHT_REPO}/${GITHUB_BRANCH}/${flightRoot}/${flight}/flight.json`;
    const flightRes = await fetch(flightFileUrl, { cache: "no-store" });

    if (!flightRes.ok) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    const flightData = await flightRes.json();

    // Filter by date if provided
    if (date && flightData.date !== date) {
      return NextResponse.json(
        { error: "Flight not found for this date" },
        { status: 404 },
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const enriched = {
      ...flightData,
      pnrs: (flightData.pnrs || []).map((p: any) => ({
        ...p,
        status_hint:
          typeof flightData.scheduled_departure_unix === "number" &&
          now > flightData.scheduled_departure_unix
            ? flightData.actual_departure_unix
              ? "departure passed; check delay for payout"
              : "departure passed; waiting for actual departure time"
            : "upcoming or unknown",
      })),
      as_of: now,
    };

    return NextResponse.json(enriched, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
  }
}
