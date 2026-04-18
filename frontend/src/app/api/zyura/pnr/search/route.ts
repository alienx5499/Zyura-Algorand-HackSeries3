import { NextRequest, NextResponse } from "next/server";
import {
  findFlightRecordForPnr,
  getFlightFolderNamesCached,
  normalizePnrPassenger,
  resolvePnrPurchaseComplete,
} from "@/lib/zyura/pnr";

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

    const found = await findFlightRecordForPnr(pnrUpper, folderNames);
    if (!found) {
      return NextResponse.json({ error: "PNR not found" }, { status: 404 });
    }

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
      pnrPurchaseComplete = await resolvePnrPurchaseComplete(
        linkedWallet,
        linkedPolicyId,
      );
    }

    const normalizedPassenger = normalizePnrPassenger(
      matchingPnr.passenger || null,
    );

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
      /** When true, purchase is finalized on GitHub or confirmed on-chain (pol_holder / pol_nft rules). */
      pnr_purchase_complete: pnrPurchaseComplete,
      as_of: Math.floor(Date.now() / 1000),
    });
    res.headers.set(
      "Cache-Control",
      "private, s-maxage=60, stale-while-revalidate=120",
    );
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
  }
}
