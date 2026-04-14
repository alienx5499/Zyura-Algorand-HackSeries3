import { NextRequest, NextResponse } from "next/server";
import * as algokit from "@algorandfoundation/algokit-utils";
import algosdk from "algosdk";

export const dynamic = "force-dynamic";

function getAlgorand(): algokit.AlgorandClient {
  const algodUrl = process.env.NEXT_PUBLIC_ALGOD_URL || "http://127.0.0.1:4001";
  const algodToken =
    process.env.NEXT_PUBLIC_ALGOD_TOKEN ||
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const algodNetwork = process.env.NEXT_PUBLIC_ALGOD_NETWORK || "localnet";

  if (
    algodNetwork === "localnet" ||
    algodUrl.includes("localhost") ||
    algodUrl.includes("127.0.0.1")
  ) {
    return algokit.AlgorandClient.defaultLocalNet();
  }
  if (algodNetwork === "testnet" && (!algodToken || algodToken.length < 10)) {
    return algokit.AlgorandClient.testNet();
  }
  const algodClient = new algosdk.Algodv2(algodToken || "", algodUrl, "");
  return algokit.AlgorandClient.fromClients({ algod: algodClient });
}

/** Asset IDs this account has opted into (excluding 0 = ALGO). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await params;
    if (!address || address.length < 50) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }
    const algorand = getAlgorand();
    const info = await algorand.client.algod.accountInformation(address).do();
    const assets = (info.assets ?? []) as Array<{
      "asset-id"?: number | bigint | string;
      assetId?: number | bigint | string;
    }>;

    const toAssetId = (value: unknown): number | null => {
      if (typeof value === "number")
        return Number.isFinite(value) ? value : null;
      if (typeof value === "bigint") {
        const asNum = Number(value);
        return Number.isFinite(asNum) ? asNum : null;
      }
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const assetIds = assets
      .map((a) => toAssetId(a["asset-id"] ?? a.assetId))
      .filter((id): id is number => typeof id === "number" && id > 0);
    return NextResponse.json({
      address,
      assetIds,
      microAlgos: String(info.amount ?? info.balance ?? 0),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
