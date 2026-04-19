import algosdk from "algosdk";
import {
  createPolicyBoxName,
  fetchApplicationBox,
} from "@/app/api/zyura/mint-policy-nft/infra/algod-state";
import { suggestedParamsFromClient } from "@/app/api/zyura/mint-policy-nft/infra/algod-tx";
import type { ActionHandler } from "@/app/api/zyura/mint-policy-nft/types";

export const handleUnsignedTransfer: ActionHandler = async (ctx, body) => {
  const isNftDeliveryAtomic = ctx.action === "unsignedNftDelivery";

  if (!isNftDeliveryAtomic) {
    const holderBytes = await fetchApplicationBox(
      ctx.appId,
      createPolicyBoxName("pol_holder", ctx.policyId),
    );
    if (!holderBytes || holderBytes.length !== 32) {
      return { payload: { error: "Policy not found on-chain" }, status: 404 };
    }
    const holderOnChain = algosdk.encodeAddress(holderBytes);
    if (holderOnChain !== ctx.recipient) {
      return {
        payload: { error: "Recipient is not the policyholder for this policy" },
        status: 403,
      };
    }
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
  }

  const assetId = body.assetId;
  if (assetId == null || Number(assetId) <= 0) {
    return { payload: { error: "assetId is required" }, status: 400 };
  }
  let sp: algosdk.SuggestedParams;
  try {
    sp = suggestedParamsFromClient(body.suggestedParams);
  } catch (e: unknown) {
    const m = e instanceof Error ? e.message : String(e);
    return { payload: { error: m }, status: 400 };
  }
  const ai = await ctx.client.getAssetByID(Number(assetId)).do();
  const creator = ai.params.creator;
  if (creator !== ctx.issuer.addr) {
    return {
      payload: { error: "Asset was not created by the configured issuer" },
      status: 400,
    };
  }
  const freezeAddr = ai.params.freeze;
  if (!freezeAddr || String(freezeAddr) !== ctx.issuer.addr) {
    return {
      payload: {
        error:
          "Policy NFT ASA must have freeze address set to the issuer (non-transferable / soulbound). Use an updated mint that sets freeze on create.",
      },
      status: 400,
    };
  }
  const clawAddr = ai.params.clawback;
  if (!clawAddr || String(clawAddr) !== ctx.issuer.addr) {
    return {
      payload: {
        error:
          "Policy NFT ASA must have clawback address set to the issuer (protocol-controlled transfers). Remint with updated server.",
      },
      status: 400,
    };
  }

  const xfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    sender: ctx.issuer.addr,
    receiver: ctx.recipient,
    amount: BigInt(1),
    assetIndex: Number(assetId),
    suggestedParams: sp,
  });
  const freezeTxn = algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject({
    sender: ctx.issuer.addr,
    freezeTarget: ctx.recipient,
    assetIndex: Number(assetId),
    frozen: true,
    suggestedParams: sp,
  });
  const unsignedTransferB64 = Buffer.from(
    algosdk.encodeUnsignedTransaction(xfer),
  ).toString("base64");
  const unsignedFreezeB64 = Buffer.from(
    algosdk.encodeUnsignedTransaction(freezeTxn),
  ).toString("base64");
  return { payload: { unsignedTransferB64, unsignedFreezeB64 } };
};
