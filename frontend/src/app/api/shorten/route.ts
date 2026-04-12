import { NextRequest, NextResponse } from "next/server";
import { shortenUrlForAsaBase } from "@/lib/shorten-url-for-asa";

/** Server-side URL shortening for client flows (e.g. dashboard) — avoids browser CORS to is.gd. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url?.trim()) {
    return NextResponse.json(
      { error: "Missing url query parameter" },
      { status: 400 },
    );
  }
  try {
    const short = await shortenUrlForAsaBase(url);
    return NextResponse.json({ url: short });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Shorten failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
