import { NextResponse } from "next/server";
import * as algokit from "@algorandfoundation/algokit-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const algodUrl =
      process.env.NEXT_PUBLIC_ALGOD_URL || "http://127.0.0.1:4001";
    const algodToken =
      process.env.NEXT_PUBLIC_ALGOD_TOKEN ||
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const algodNetwork = process.env.NEXT_PUBLIC_ALGOD_NETWORK || "localnet";

    if (!algodUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_ALGOD_URL not configured" },
        { status: 500 },
      );
    }

    console.log(
      `[API] Connecting to Algod at ${algodUrl}, network: ${algodNetwork}`,
    );

    // Use AlgoKit's client manager which handles connection properly
    let algorand: algokit.AlgorandClient;
    if (
      algodNetwork === "localnet" ||
      algodUrl.includes("localhost") ||
      algodUrl.includes("127.0.0.1")
    ) {
      // Use AlgoKit's default localnet client
      console.log("[API] Using AlgoKit default localnet client");
      algorand = algokit.AlgorandClient.defaultLocalNet();
    } else if (
      algodNetwork === "testnet" &&
      (!algodToken || algodToken.length < 10)
    ) {
      // Use AlgoKit's default testnet client (Algonode - no token needed)
      console.log("[API] Using AlgoKit default testnet client (Algonode)");
      algorand = algokit.AlgorandClient.testNet();
    } else {
      // Use custom endpoint
      console.log(`[API] Using custom endpoint: ${algodUrl}`);
      const algosdk = require("algosdk");
      const algodClient = new algosdk.Algodv2(algodToken || "", algodUrl, "");
      algorand = algokit.AlgorandClient.fromClients({ algod: algodClient });
    }

    // Get params using AlgoKit's client
    const params = await algorand.client.algod.getTransactionParams().do();

    // Convert BigInt values to strings and Uint8Array to base64 for JSON serialization
    const convertBigIntToString = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === "bigint") return obj.toString();
      if (obj instanceof Uint8Array) {
        // Convert Uint8Array to base64 string for JSON serialization
        return Buffer.from(obj).toString("base64");
      }
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

    const serializableParams = convertBigIntToString(params);

    console.log(`[API] Successfully fetched transaction params`);
    return NextResponse.json(serializableParams);
  } catch (error: any) {
    console.error("[API] Error fetching transaction params:", error);
    console.error("[API] Error type:", typeof error);
    console.error(
      "[API] Error stringified:",
      JSON.stringify(error, Object.getOwnPropertyNames(error)),
    );

    let errorMessage = "Unknown error";
    let errorCode = "UNKNOWN";

    if (error) {
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.toString) {
        errorMessage = error.toString();
      }

      if (error.code) {
        errorCode = error.code;
      } else if (error.name) {
        errorCode = error.name;
      }
    }

    let algodUrl = process.env.NEXT_PUBLIC_ALGOD_URL || "http://127.0.0.1:4001";
    if (algodUrl.includes("127.0.0.1")) {
      algodUrl = algodUrl.replace("127.0.0.1", "localhost");
    }

    const errorResponse = {
      error: `Cannot connect to Algorand node at ${algodUrl}`,
      details: errorMessage,
      code: errorCode,
      suggestion:
        "Ensure algokit localnet is running (algokit localnet status). Check server logs for detailed error.",
    };

    console.error("[API] Returning error response:", errorResponse);

    return NextResponse.json(errorResponse, { status: 503 });
  }
}
