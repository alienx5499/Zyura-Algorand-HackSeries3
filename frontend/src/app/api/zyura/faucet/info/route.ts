import { NextResponse } from "next/server";
import algosdk from "algosdk";

export const dynamic = "force-dynamic";

export async function GET() {
  const mnemonic = process.env.FAUCET_MNEMONIC?.trim();
  if (!mnemonic) {
    return NextResponse.json(
      { error: "Faucet not configured" },
      { status: 503 },
    );
  }
  try {
    const account = algosdk.mnemonicToSecretKey(mnemonic);
    const returnAddress = String(account.addr);
    return NextResponse.json({ returnAddress });
  } catch {
    return NextResponse.json(
      { error: "Invalid faucet configuration" },
      { status: 503 },
    );
  }
}
