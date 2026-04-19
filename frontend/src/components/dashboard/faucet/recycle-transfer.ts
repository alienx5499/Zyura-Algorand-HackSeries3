"use client";

import type { PeraWalletConnect } from "@perawallet/connect";
import algosdk from "algosdk";
import { fetchAlgorandSuggestedParams } from "@/lib/dashboard/algorand-utils";

export async function submitRecycleTransfer(args: {
  from: string;
  returnAddress: string;
  microAmount: number;
  peraWallet: PeraWalletConnect;
}) {
  const usdcAsaId = process.env.NEXT_PUBLIC_USDC_ASA_ID;
  if (!usdcAsaId || usdcAsaId === "0") {
    throw new Error("USDC asset ID not configured");
  }

  const { params: suggestedParams } = await fetchAlgorandSuggestedParams();
  const xferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: args.from,
    receiver: args.returnAddress,
    amount: BigInt(args.microAmount),
    assetIndex: BigInt(usdcAsaId),
    suggestedParams,
  });

  const signed = await args.peraWallet.signTransaction([[{ txn: xferTxn }]]);
  const raw = Array.isArray(signed[0]) ? (signed[0] as Uint8Array[]) : signed;
  if (!raw?.length) {
    throw new Error("No signed transaction");
  }
  const first = raw[0];
  const blob = first instanceof Uint8Array ? first : new Uint8Array(0);
  if (blob.length === 0) {
    throw new Error("Invalid signature from wallet");
  }

  const signedBase64 = Buffer.from(blob).toString("base64");
  const sendRes = await fetch("/api/algorand/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTx: signedBase64 }),
  });
  const sendPayload = (await sendRes.json().catch(() => ({}))) as {
    txId?: string;
    error?: string;
  };
  if (!sendRes.ok) {
    throw new Error(sendPayload.error || "Failed to submit transaction");
  }
  return sendPayload.txId ?? "";
}
