import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { githubFlightPath, githubNftPath } from "@/lib/github-metadata-paths";

const FLIGHT_REPO =
  process.env.GITHUB_FLIGHT_REPO ||
  process.env.GITHUB_METADATA_REPO ||
  "alienx5499/Zyura-Algorand-HackSeries3-MetaData";
const GITHUB_NFT_REPO =
  process.env.GITHUB_NFT_REPO ||
  process.env.GITHUB_METADATA_REPO ||
  FLIGHT_REPO;
const GITHUB_BRANCH =
  process.env.GITHUB_FLIGHT_BRANCH || process.env.GITHUB_BRANCH || "main";
const FLIGHT_PATH = githubFlightPath();
const NFT_METADATA_PATH = githubNftPath();

/** True when GitHub policy.json shows a completed purchase (mirrors finalizePurchasedMetadata). */
async function isPolicyPurchasedOnGithub(
  wallet: string,
  policyId: number,
): Promise<boolean> {
  const w = wallet.trim();
  if (!w || w === "NA" || !Number.isFinite(policyId) || policyId <= 0) {
    return false;
  }
  const url = `https://raw.githubusercontent.com/${GITHUB_NFT_REPO}/${GITHUB_BRANCH}/${NFT_METADATA_PATH}/${w}/${policyId}/policy.json`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return false;
    const j = (await res.json()) as {
      status?: string;
      nft_asset_id?: unknown;
    };
    const st = String(j?.status ?? "").toUpperCase();
    const nft = j?.nft_asset_id;
    const hasNft =
      nft != null && String(nft).trim() !== "" && String(nft).trim() !== "0";
    return st === "ACTIVE" && hasNft;
  } catch {
    return false;
  }
}

const getFlightFolderNamesCached = unstable_cache(
  async (): Promise<string[]> => {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
    const flightsDirUrl = `https://api.github.com/repos/${FLIGHT_REPO}/contents/${FLIGHT_PATH}?ref=${GITHUB_BRANCH}`;
    const baseHeaders: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    };

    let dirResponse = await fetch(flightsDirUrl, {
      headers: baseHeaders,
      next: { revalidate: 120 },
    });

    if (
      !dirResponse.ok &&
      (dirResponse.status === 401 || dirResponse.status === 403) &&
      GITHUB_TOKEN
    ) {
      dirResponse = await fetch(flightsDirUrl, {
        headers: {
          ...baseHeaders,
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
        next: { revalidate: 120 },
      });
      if (!dirResponse.ok && dirResponse.status === 401 && GITHUB_TOKEN) {
        dirResponse = await fetch(flightsDirUrl, {
          headers: {
            ...baseHeaders,
            Authorization: `token ${GITHUB_TOKEN}`,
          },
          next: { revalidate: 120 },
        });
      }
    }

    if (!dirResponse.ok) {
      throw new Error(
        `GitHub directory ${dirResponse.status}: ${dirResponse.statusText}`,
      );
    }

    const flightFolders: unknown = await dirResponse.json();
    if (!Array.isArray(flightFolders)) return [];
    return flightFolders
      .filter((f: any) => f?.type === "dir" && typeof f?.name === "string")
      .map((f: any) => f.name as string);
  },
  ["zyura-pnr-flight-folders", FLIGHT_REPO, GITHUB_BRANCH, FLIGHT_PATH],
  { revalidate: 120 },
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pnr = searchParams.get("pnr");
    if (!pnr || pnr.length !== 6) {
      return NextResponse.json(
        { error: "PNR must be exactly 6 characters" },
        { status: 400 },
      );
    }

    const pnrUpper = pnr.toUpperCase();

    let folderNames: string[];
    try {
      folderNames = await getFlightFolderNamesCached();
    } catch (e: any) {
      console.error("GitHub flight folder list failed:", e?.message || e);
      return NextResponse.json(
        {
          error: "Unable to access flight metadata repository",
          details: e?.message || "Unknown error",
        },
        { status: 503 },
      );
    }

    if (folderNames.length === 0) {
      return NextResponse.json({ error: "PNR not found" }, { status: 404 });
    }

    const flightResults = await Promise.all(
      folderNames.map(async (name) => {
        try {
          const flightFileUrl = `https://raw.githubusercontent.com/${FLIGHT_REPO}/${GITHUB_BRANCH}/${FLIGHT_PATH}/${name}/flight.json`;
          const flightResponse = await fetch(flightFileUrl, {
            next: { revalidate: 120 },
          });
          if (!flightResponse.ok) return null;
          const flightData = await flightResponse.json();
          const matchingPnr = flightData.pnrs?.find(
            (p: any) => p.pnr === pnrUpper,
          );
          if (!matchingPnr) return null;
          return { flightData, matchingPnr };
        } catch {
          return null;
        }
      }),
    );

    const found = flightResults.find(
      (r): r is { flightData: any; matchingPnr: any } => r !== null,
    );
    if (found) {
      const { flightData, matchingPnr } = found;
      const linkedPidRaw = matchingPnr.policyId;
      const linkedPolicyId =
        typeof linkedPidRaw === "number" && linkedPidRaw > 0
          ? linkedPidRaw
          : undefined;
      const linkedWalletRaw = matchingPnr.wallet;
      const linkedWallet =
        typeof linkedWalletRaw === "string" &&
        linkedWalletRaw.trim() &&
        linkedWalletRaw !== "NA"
          ? linkedWalletRaw.trim()
          : undefined;

      let pnrPurchaseComplete = false;
      if (linkedPolicyId != null && linkedWallet) {
        pnrPurchaseComplete = await isPolicyPurchasedOnGithub(
          linkedWallet,
          linkedPolicyId,
        );
      }

      const passenger = matchingPnr.passenger || null;
      const normalizedPassenger = passenger
        ? {
            name: passenger.name || passenger.fullName || null,
            fullName: passenger.fullName || passenger.name || null,
            email: passenger.email || null,
            phone: passenger.phone || passenger.phone_number || null,
            phone_number: passenger.phone_number || passenger.phone || null,
            date_of_birth:
              passenger.date_of_birth || passenger.dateOfBirth || null,
            dateOfBirth:
              passenger.dateOfBirth || passenger.date_of_birth || null,
            passport_number:
              passenger.passport_number ||
              passenger.passportNumber ||
              passenger.documentId ||
              null,
            documentId:
              passenger.documentId ||
              passenger.passport_number ||
              passenger.passportNumber ||
              null,
            address: passenger.address || null,
            seat: passenger.seat || null,
            class: passenger.class || passenger.classType || null,
            classType: passenger.classType || passenger.class || null,
          }
        : null;

      const res = NextResponse.json({
        pnr: pnrUpper,
        flight_number: flightData.flight_number,
        date: flightData.date || "",
        scheduled_departure_unix: flightData.scheduled_departure_unix,
        actual_departure_unix: flightData.actual_departure_unix,
        origin: flightData.origin,
        destination: flightData.destination,
        status: flightData.status,
        delay_minutes: flightData.delay_minutes,
        passenger: normalizedPassenger,
        wallet: matchingPnr.wallet,
        policyId: matchingPnr.policyId,
        policyholder: matchingPnr.policyholder,
        nft_metadata_url: matchingPnr.nft_metadata_url,
        /** When true, GitHub policy.json is ACTIVE with nft_asset_id — safe to block another purchase for this wallet. */
        pnr_purchase_complete: pnrPurchaseComplete,
        as_of: Math.floor(Date.now() / 1000),
      });
      res.headers.set(
        "Cache-Control",
        "private, s-maxage=60, stale-while-revalidate=120",
      );
      return res;
    }

    return NextResponse.json({ error: "PNR not found" }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
  }
}
