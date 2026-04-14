import { NextRequest, NextResponse } from "next/server";

type Passenger = {
  fullName: string;
  dateOfBirth?: string;
  documentId?: string;
  seat?: string;
  email?: string;
  phone?: string;
};

type RegisterBody = {
  pnr: string;
  policyId: number;
  policyholder?: string;
  flightNumber?: string;
  date?: string; // YYYY-MM-DD
  departureUnix?: number;
  passenger?: Passenger; // Single passenger per PNR
  wallet?: string;
  nft_metadata_url?: string;
  notes?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegisterBody;
    if (!body?.pnr || !body?.policyId)
      return NextResponse.json(
        { error: "pnr and policyId are required" },
        { status: 400 },
      );
    if (body.pnr.length !== 6)
      return NextResponse.json(
        { error: "PNR must be exactly 6 characters" },
        { status: 400 },
      );

    // On Algorand we don't look up policy on-chain here; require core fields from the request
    let { flightNumber, departureUnix, date } = body;

    if (!flightNumber || !date) {
      return NextResponse.json(
        { error: "flight_number and date are required" },
        { status: 400 },
      );
    }

    // Call flight register endpoint to upsert flight record with PNR
    const flightRegisterUrl = new URL("/api/zyura/flight/register", req.url);
    const flightRegisterRes = await fetch(flightRegisterUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flight_number: flightNumber,
        date,
        departure_unix: departureUnix,
        policyId: body.policyId,
        pnr: body.pnr,
        passenger: body.passenger,
        wallet: body.wallet,
        nft_metadata_url: body.nft_metadata_url,
        notes: body.notes,
      }),
    });

    if (!flightRegisterRes.ok) {
      const err = await flightRegisterRes.json();
      throw new Error(err.error || "Failed to register flight");
    }

    const result = await flightRegisterRes.json();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
  }
}
