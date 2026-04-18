import { NextRequest, NextResponse } from "next/server";
import algosdk from "algosdk";
import { createBoxName } from "@/lib/dashboard/policy-purchase/transaction/boxes";
import { fetchArc3MetadataJson } from "@/lib/resolve-arc3-metadata-url";

const INDEXER_URL = process.env.NEXT_PUBLIC_ALGOD_URL?.includes("algonode")
  ? "https://testnet-idx.algonode.cloud"
  : process.env.NEXT_PUBLIC_INDEXER_URL || "https://testnet-idx.algonode.cloud";

async function fetchApplicationBoxBytes(
  appId: number,
  boxName: Uint8Array,
): Promise<Uint8Array | null> {
  const algodUrl = (process.env.NEXT_PUBLIC_ALGOD_URL || "").replace(/\/$/, "");
  const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
  if (!algodUrl) return null;
  const u = new URL(`${algodUrl}/v2/applications/${appId}/box`);
  u.searchParams.set("name", `b64:${Buffer.from(boxName).toString("base64")}`);
  const res = await fetch(u.toString(), {
    cache: "no-store",
    headers: token ? { "X-Algo-API-Token": token } : {},
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { value?: string };
  if (!json.value) return null;
  return new Uint8Array(Buffer.from(json.value, "base64"));
}

function decodePolTimDepartureUnix(timBytes: Uint8Array): number | null {
  if (timBytes.length < 16) return null;
  try {
    return Number(algosdk.decodeUint64(timBytes.slice(8, 16), "safe"));
  } catch {
    return null;
  }
}

function metadataTraitAttributes(
  metadata: unknown,
): Array<{ trait_type?: string; value?: unknown }> {
  if (!metadata || typeof metadata !== "object") return [];
  const attrs = (metadata as { attributes?: unknown }).attributes;
  return Array.isArray(attrs) ? attrs : [];
}

type FlightQuery = {
  number: string;
  date?: string;
};

type FlightDelayResult = {
  num: string;
  date?: string;
  delay_minutes: number;
  policy_id?: string;
};

// Reads an external flight API. You can configure via env:
// - FLIGHT_API_BASE: e.g. https://api.example.com/flight
// - FLIGHT_API_KEY: optional bearer/API key
// The endpoint is expected to return JSON with a numeric field at `delay_minutes`.
async function fetchDelayForFlight(
  flight: FlightQuery,
  signal: AbortSignal,
): Promise<FlightDelayResult> {
  const base = process.env.FLIGHT_API_BASE;
  const apiKey = process.env.FLIGHT_API_KEY;

  // If no provider configured, allow a mock fallback for testing on Vercel/Local
  if (!base) {
    const mock = Number(process.env.MOCK_DELAY_MINUTES ?? "0");
    return {
      num: flight.number,
      date: flight.date,
      delay_minutes: isFinite(mock) ? mock : 0,
    };
  }

  const url = new URL(base);
  url.searchParams.set("num", flight.number);
  if (flight.date) url.searchParams.set("date", flight.date);

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (apiKey) {
    // Prefer standard bearer; adjust if your provider needs a different header key
    headers["authorization"] = `Bearer ${apiKey}`;
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers,
    // Abort long calls to keep function snappy
    signal,
    // Force no-cache to avoid stale delay values
    cache: "no-store",
  });

  if (!res.ok) {
    // Treat non-200 as zero delay but include basic info
    return { num: flight.number, date: flight.date, delay_minutes: 0 };
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    return { num: flight.number, date: flight.date, delay_minutes: 0 };
  }

  // Default semantic: top-level `delay_minutes`. Adjust if your provider differs.
  const value = Number(json?.delay_minutes ?? 0);
  const delay = Number.isFinite(value) ? value : 0;
  return { num: flight.number, date: flight.date, delay_minutes: delay };
}

function parseFlights(qs: URLSearchParams): FlightQuery[] {
  // Accept either:
  // - flights=AA123@2025-11-04,BA456@2025-11-04
  // - flight=AA123&flight=BA456&date=2025-11-04 (shared date)
  // - flight=AA123@2025-11-04 (multiple repeated)
  const result: FlightQuery[] = [];

  const flightsCsv = qs.get("flights");
  const sharedDate = qs.get("date") || undefined;

  if (flightsCsv) {
    for (const item of flightsCsv.split(",")) {
      const trimmed = item.trim();
      if (!trimmed) continue;
      const [num, dt] = trimmed.split("@");
      result.push({ number: num, date: dt || sharedDate });
    }
  }

  const flightParams = qs.getAll("flight");
  for (const f of flightParams) {
    const [num, dt] = f.split("@");
    result.push({ number: num, date: dt || sharedDate });
  }

  // Basic de-dupe by number+date
  const seen = new Set<string>();
  const unique: FlightQuery[] = [];
  for (const f of result) {
    const key = `${f.number}@${f.date ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(f);
  }
  return unique;
}

async function fetchPoliciesFromChain(
  policyIds: string[],
): Promise<FlightQuery[]> {
  const appId = parseInt(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "0", 10);
  const flights: FlightQuery[] = [];

  for (const policyIdStr of policyIds) {
    try {
      const policyIdNum = Number(policyIdStr);
      if (!isFinite(policyIdNum) || policyIdNum <= 0) continue;

      let departureUnix: number | null = null;
      if (appId) {
        const timBytes = await fetchApplicationBoxBytes(
          appId,
          createBoxName("pol_tim", policyIdNum),
        );
        if (timBytes) departureUnix = decodePolTimDepartureUnix(timBytes);
      }

      let flightNumber = "";
      const unit = `Z${policyIdStr}`;
      const assetsRes = await fetch(
        `${INDEXER_URL}/v2/assets?unit=${encodeURIComponent(unit)}`,
        { cache: "no-store", headers: { Accept: "application/json" } },
      );
      if (assetsRes.ok) {
        const data = (await assetsRes.json()) as {
          assets?: Array<{ params?: Record<string, unknown> }>;
        };
        for (const row of data.assets ?? []) {
          const params = row.params;
          if (String(params?.["unit-name"] ?? "") !== unit) continue;
          const url = params?.url;
          if (typeof url === "string" && url.startsWith("http")) {
            try {
              const { metadata } = await fetchArc3MetadataJson(url);
              const attrs = metadataTraitAttributes(metadata);
              const flightAttr = attrs.find((a) => a.trait_type === "Flight");
              if (flightAttr?.value != null) {
                flightNumber = String(flightAttr.value).trim();
              }
              if (departureUnix == null || departureUnix <= 0) {
                const depAttr = attrs.find((a) => a.trait_type === "Departure");
                if (depAttr?.value != null) {
                  const v = String(depAttr.value).trim();
                  const asNum = Number(v);
                  if (Number.isFinite(asNum) && asNum > 1e9) {
                    departureUnix = Math.floor(asNum);
                  }
                }
              }
            } catch {
              /* metadata optional */
            }
          }
          break;
        }
      }

      const dateStr =
        departureUnix != null && departureUnix > 0
          ? new Date(departureUnix * 1000).toISOString().slice(0, 10)
          : undefined;

      if (flightNumber) {
        flights.push({ number: flightNumber, date: dateStr });
      }
    } catch (err) {
      console.error(`Failed to fetch policy ${policyIdStr}:`, err);
    }
  }

  return flights;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Support both policy= and flight= modes
  const policyIds = searchParams.getAll("policy");
  let flights: FlightQuery[] = [];

  if (policyIds.length > 0) {
    // Fetch policies from on-chain
    flights = await fetchPoliciesFromChain(policyIds);
  } else {
    // Fallback to manual flight params
    flights = parseFlights(searchParams);
  }

  if (flights.length === 0) {
    return NextResponse.json(
      {
        error:
          "No flights provided. Use policy=123&policy=456 (fetches from on-chain) or flight=AA123&flight=BB456&date=YYYY-MM-DD (manual)",
      },
      { status: 400 },
    );
  }

  // Apply a per-request timeout to cap total time (8s)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const results = await Promise.all(
      flights.map((f) =>
        fetchDelayForFlight(f, controller.signal).catch(() => ({
          num: f.number,
          date: f.date,
          delay_minutes: 0,
        })),
      ),
    );

    const delays = results.map((r) => r.delay_minutes);
    const maxDelay = delays.length ? Math.max(...delays) : 0;

    const body = {
      max_delay_minutes: maxDelay,
      flights: results,
      as_of: Math.floor(Date.now() / 1000),
    };

    return NextResponse.json(body, { status: 200 });
  } finally {
    clearTimeout(timeout);
  }
}
