import { NextResponse } from "next/server";

export async function GET() {
  try {
    const appId = process.env.NEXT_PUBLIC_ZYURA_APP_ID;
    const vaultAddr = process.env.RISK_POOL_VAULT_ADDR;

    if (vaultAddr && vaultAddr !== "REPLACE_WITH_VAULT_ADDRESS") {
      return NextResponse.json({ vault: vaultAddr });
    }

    if (!appId) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_ZYURA_APP_ID not set" },
        { status: 500 },
      );
    }

    // Try to read from contract state (Algod client reserved for future on-chain read)

    // Call getRiskPoolVault method
    // Note: This requires a transaction, so for now we'll use env var
    // In production, you'd want to cache this or read from app state

    return NextResponse.json(
      {
        error: "RISK_POOL_VAULT_ADDR not set in environment variables",
      },
      { status: 500 },
    );
  } catch (error: any) {
    console.error("Error fetching vault address:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
