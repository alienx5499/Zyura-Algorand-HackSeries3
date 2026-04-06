import { NextRequest, NextResponse } from "next/server";
import * as algokit from "@algorandfoundation/algokit-utils";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ txId: string }> },
) {
  try {
    const { txId } = await params;

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

    const txInfo = await algorand.client.algod
      .pendingTransactionInformation(txId)
      .do();

    // Convert BigInt values to strings for JSON serialization
    const convertBigIntToString = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === "bigint") return obj.toString();
      if (Array.isArray(obj)) return obj.map(convertBigIntToString);
      if (typeof obj === "object") {
        const converted: any = {};
        for (const [key, value] of Object.entries(obj)) {
          converted[key] = convertBigIntToString(value);
        }
        return converted;
      }
      return obj;
    };

    return NextResponse.json(convertBigIntToString(txInfo));
  } catch (error: any) {
    console.error("Error fetching transaction info:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
