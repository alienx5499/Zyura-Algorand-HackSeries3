import algosdk from "algosdk";
import {
  createPolicyBoxName,
  fetchApplicationBox,
} from "@/app/api/zyura/mint-policy-nft/infra/algod-state";
import { waitForConfirmation } from "@/app/api/zyura/mint-policy-nft/infra/algod-tx";
import type { ActionHandler } from "@/app/api/zyura/mint-policy-nft/types";

export const handleCreate: ActionHandler = async (ctx, body) => {
  const polNftBytes = await fetchApplicationBox(
    ctx.appId,
    createPolicyBoxName("pol_nft", ctx.policyId),
  );
  if (polNftBytes && polNftBytes.length >= 8) {
    const linked = algosdk.decodeUint64(polNftBytes.subarray(0, 8), "safe");
    if (linked > BigInt(0)) {
      return {
        payload: { error: "Policy already has a linked NFT" },
        status: 409,
      };
    }
  }

  const suggestedParams = await ctx.client.getTransactionParams().do();
  const assetURL = body.assetURL?.trim();
  if (!assetURL) {
    return { payload: { error: "assetURL is required" }, status: 400 };
  }
  const assetName = body.assetName?.trim() || `ZYURA Policy ${ctx.policyIdStr}`;
  const unitName = body.unitName?.trim() || `Z${ctx.policyIdStr.slice(-7)}`;

  const createTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    sender: ctx.issuer.addr,
    total: BigInt(1),
    decimals: 0,
    assetName: assetName.slice(0, 32),
    unitName: unitName.slice(0, 8),
    assetURL: assetURL.slice(0, 96),
    defaultFrozen: false,
    manager: ctx.issuer.addr,
    reserve: ctx.issuer.addr,
    freeze: ctx.issuer.addr,
    clawback: ctx.issuer.addr,
    suggestedParams,
  });

  const signed = createTxn.signTxn(ctx.issuer.sk);
  const { txid } = await ctx.client.sendRawTransaction(signed).do();
  await waitForConfirmation(ctx.client, txid);
  const info = await ctx.client.pendingTransactionInformation(txid).do();
  const assetIndex = info.assetIndex;
  if (assetIndex == null) {
    return {
      payload: { error: "Could not read created asset index" },
      status: 500,
    };
  }
  return { payload: { assetId: Number(assetIndex), txId: txid } };
};
