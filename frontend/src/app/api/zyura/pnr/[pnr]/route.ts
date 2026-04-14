import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pnr: string }> },
) {
  try {
    const { pnr } = await params;
    return NextResponse.json(
      {
        message:
          "PNR lookup by flight+date. Use /api/zyura/flight/[flight]/[date] to get flight data with PNRs.",
        pnr,
      },
      { status: 200 },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
