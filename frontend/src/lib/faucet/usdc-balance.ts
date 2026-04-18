import * as algokit from "@algorandfoundation/algokit-utils";
import algosdk from "algosdk";

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

function toAssetId(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "bigint") {
    const asNum = Number(value);
    return Number.isFinite(asNum) ? asNum : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function getUsdcBalance(address: string, usdcAsaId: number) {
  const info = await getAlgorand()
    .client.algod.accountInformation(address)
    .do();
  const assets = (info.assets ?? []) as Array<{
    "asset-id"?: number | bigint | string;
    assetId?: number | bigint | string;
    amount?: number | bigint | string;
  }>;
  const holding = assets.find((a) => {
    const id = toAssetId(a["asset-id"] ?? a.assetId);
    return id === usdcAsaId;
  });
  const amountMicro =
    holding?.amount === undefined
      ? 0
      : typeof holding.amount === "bigint"
        ? Number(holding.amount)
        : typeof holding.amount === "string"
          ? Number(holding.amount)
          : Number(holding.amount ?? 0);
  return {
    optedIn: Boolean(holding),
    amountMicro,
  };
}

export async function sendUsdcFromMnemonic(args: {
  mnemonic: string;
  receiver: string;
  amountMicro: number;
  usdcAsaId: number;
}) {
  const { mnemonic, receiver, amountMicro, usdcAsaId } = args;
  const sender = algosdk.mnemonicToSecretKey(mnemonic.trim());
  const algod = getAlgorand().client.algod;
  const sp = await algod.getTransactionParams().do();
  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: sender.addr,
    receiver,
    amount: BigInt(amountMicro),
    assetIndex: BigInt(usdcAsaId),
    suggestedParams: sp,
  });
  const signed = txn.signTxn(sender.sk);
  const { txid } = await algod.sendRawTransaction(signed).do();
  return txid;
}
