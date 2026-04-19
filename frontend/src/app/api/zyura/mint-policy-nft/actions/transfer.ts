import algosdk from "algosdk";
import { waitForConfirmation } from "@/app/api/zyura/mint-policy-nft/infra/algod-tx";
import type { ActionHandler } from "@/app/api/zyura/mint-policy-nft/types";

export const handleTransfer: ActionHandler = async (ctx, body) => {
  const assetId = body.assetId;
  if (assetId == null || Number(assetId) <= 0) {
    return { payload: { error: "assetId is required" }, status: 400 };
  }

  const ai = await ctx.client.getAssetByID(Number(assetId)).do();
  const creator = ai.params.creator;
  if (creator !== ctx.issuer.addr) {
    return {
      payload: { error: "Asset was not created by the configured issuer" },
      status: 400,
    };
  }

  const acc = await ctx.client.accountInformation(ctx.recipient).do();
  const aid = Number(assetId);
  const optedIn = (acc.assets ?? []).some((h) => {
    const row = h as unknown as Record<string, number | undefined>;
    return row["asset-id"] === aid || row.assetId === aid;
  });
  if (!optedIn) {
    return {
      payload: { error: "Recipient must opt in to the asset before transfer" },
      status: 400,
    };
  }

  const xfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: ctx.issuer.addr,
    receiver: ctx.recipient,
    amount: BigInt(1),
    assetIndex: Number(assetId),
    suggestedParams: await ctx.client.getTransactionParams().do(),
  });
  const signedXfer = xfer.signTxn(ctx.issuer.sk);
  const { txid } = await ctx.client.sendRawTransaction(signedXfer).do();
  await waitForConfirmation(ctx.client, txid);
  return { payload: { txId: txid, assetId: Number(assetId) } };
};
