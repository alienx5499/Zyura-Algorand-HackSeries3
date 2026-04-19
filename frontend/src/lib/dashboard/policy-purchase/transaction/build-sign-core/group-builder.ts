import algosdk from "algosdk";
import { createBoxName } from "../boxes";
import { getPurchaseStepLabels } from "../step-labels";
import { makeLinkPolicyNftMethod, makePurchasePolicyMethod } from "./methods";
import type { GroupBuildContext, GroupBuildResult } from "./types";

export function buildPurchaseAtomicGroup(
  context: GroupBuildContext,
): GroupBuildResult {
  const purchasePolicyMethod = makePurchasePolicyMethod();
  const linkMethod = makeLinkPolicyNftMethod();

  const purchaseAtc = new algosdk.AtomicTransactionComposer();
  if (context.needsUsdcOptIn) {
    const usdcOptInTxn =
      algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: context.currentAddress,
        receiver: context.currentAddress,
        amount: 0,
        assetIndex: Number(context.usdcAsaId),
        suggestedParams: context.suggestedParams,
      });
    purchaseAtc.addTransaction({
      txn: usdcOptInTxn,
      signer: context.peraSigner,
    });
  }
  purchaseAtc.addMethodCall({
    appID: Number(context.appId),
    method: purchasePolicyMethod,
    methodArgs: [
      {
        txn: algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: context.currentAddress,
          receiver: context.vaultAddr,
          amount: Number(context.premiumAmountMicro),
          assetIndex: Number(context.usdcAsaId),
          suggestedParams: context.suggestedParams,
        }),
        signer: context.peraSigner,
      },
      BigInt(context.policyId),
      BigInt(context.productId),
      context.flightNumber,
      BigInt(context.departureUnix),
      context.premiumAmountMicro,
      true,
      context.metadataUri,
      BigInt(context.nftAssetId),
    ],
    sender: context.currentAddress,
    suggestedParams: context.suggestedParams,
    signer: context.peraSigner,
    boxes: context.boxReferences.map((boxName) => ({
      appIndex: Number(context.appId),
      name: boxName,
    })),
  });

  const fullAtc = purchaseAtc.clone();
  fullAtc.addTransaction({
    txn: algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: context.currentAddress,
      receiver: context.currentAddress,
      amount: 0,
      assetIndex: context.nftAssetId,
      suggestedParams: context.suggestedParams,
    }),
    signer: context.peraSigner,
  });
  fullAtc.addTransaction({
    txn: context.xferTxn,
    signer: context.noopIssuerSigner,
  });
  fullAtc.addMethodCall({
    appID: Number(context.appId),
    method: linkMethod,
    methodArgs: [BigInt(context.policyId), BigInt(context.nftAssetId)],
    sender: context.currentAddress,
    suggestedParams: context.suggestedParams,
    signer: context.peraSigner,
    boxes: [
      {
        appIndex: Number(context.appId),
        name: createBoxName("pol_holder", context.policyId),
      },
      {
        appIndex: Number(context.appId),
        name: createBoxName("pol_nft", context.policyId),
      },
    ],
    appAccounts: [context.currentAddress],
    appForeignAssets: [Number(context.nftAssetId)],
  });
  fullAtc.addTransaction({
    txn: context.freezeNftTxn,
    signer: context.noopIssuerSigner,
  });

  const built = fullAtc.buildGroup();
  const nTx = built.length;
  const idxXfer = context.needsUsdcOptIn ? 4 : 3;
  const idxFreeze = context.needsUsdcOptIn ? 6 : 5;
  const labels = getPurchaseStepLabels(context.needsUsdcOptIn);

  return { built, labels, idxXfer, idxFreeze, nTx };
}
