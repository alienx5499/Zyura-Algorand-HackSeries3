import { NextRequest, NextResponse } from "next/server";
import * as algokit from "@algorandfoundation/algokit-utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { signedTx } = await request.json();

    if (!signedTx || typeof signedTx !== "string") {
      return NextResponse.json(
        { error: "Invalid signed transaction - expected base64 string" },
        { status: 400 },
      );
    }

    const algodUrl =
      process.env.NEXT_PUBLIC_ALGOD_URL || "http://127.0.0.1:4001";
    const algodToken =
      process.env.NEXT_PUBLIC_ALGOD_TOKEN ||
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const algodNetwork = process.env.NEXT_PUBLIC_ALGOD_NETWORK || "localnet";

    // Use AlgoKit's client manager
    let algorand: algokit.AlgorandClient;
    if (
      algodNetwork === "localnet" ||
      algodUrl.includes("localhost") ||
      algodUrl.includes("127.0.0.1")
    ) {
      algorand = algokit.AlgorandClient.defaultLocalNet();
    } else if (
      algodNetwork === "testnet" &&
      (!algodToken || algodToken.length < 10)
    ) {
      algorand = algokit.AlgorandClient.testNet();
    } else {
      const algosdk = require("algosdk");
      const algodClient = new algosdk.Algodv2(algodToken || "", algodUrl, "");
      algorand = algokit.AlgorandClient.fromClients({ algod: algodClient });
    }

    // Convert base64 string to Uint8Array
    const signedBlob = Uint8Array.from(Buffer.from(signedTx, "base64"));

    const result = await algorand.client.algod
      .sendRawTransaction(signedBlob)
      .do();

    return NextResponse.json({ txId: result.txid || result.toString() });
  } catch (error: any) {
    console.error("Error sending transaction:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
