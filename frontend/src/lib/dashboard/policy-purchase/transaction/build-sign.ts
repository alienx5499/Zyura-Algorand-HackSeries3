import algosdk from "algosdk";
import { toast } from "sonner";
import { fetchAlgorandSuggestedParams } from "@/lib/dashboard/algorand-utils";
import type { PurchaseExecutionInput } from "@/lib/dashboard/policy-purchase/types";
import { policyPurchaseBoxReferences } from "./boxes";
import {
  createPolicyNftBeforePurchase,
  fetchAccountAssetIds,
  fetchVaultAddress,
  prepareUnsignedNftDelivery,
  sendSignedGroup,
  signGroupedNftDelivery,
} from "./build-sign-core/api";
import { getPurchaseChainConfig } from "./build-sign-core/config";
import { buildPurchaseAtomicGroup } from "./build-sign-core/group-builder";
import {
  concatSignedBlobs,
  mergeAtomicGroupSignaturesWithIssuerBlobs,
} from "./build-sign-core/issuer-merge";
import {
  makeNoopIssuerSigner,
  makePeraSigner,
  normalizePeraSignedResponse,
} from "./build-sign-core/signers";

export type PurchaseBuildSendResult = {
  built: ReturnType<algosdk.AtomicTransactionComposer["buildGroup"]>;
  groupTxIds: string[];
  vaultAddr: string;
  labels: string[];
  nftAssetId: number;
  policyId: number;
  premiumAmountMicro: bigint;
  appId: bigint;
  currentAddress: string;
};

export async function buildAndSendPurchaseGroup(
  args: PurchaseExecutionInput,
): Promise<PurchaseBuildSendResult> {
  const {
    currentAddress,
    productId,
    policyId,
    premiumAmountMicro,
    metadataUri,
    assetURL,
    nftName,
    nftUnitName,
    departureUnix,
    flightNumber,
  } = args;

  const { appId, usdcAsaId } = getPurchaseChainConfig();

  toast.info("Loading where to send your premium...");
  const vaultAddr = await fetchVaultAddress();

  const boxReferences = policyPurchaseBoxReferences(
    Number(productId),
    policyId,
  );

  toast.info("Creating your policy NFT ASA (issuer)...");
  const nftAssetId = await createPolicyNftBeforePurchase({
    policyId,
    recipient: currentAddress,
    assetURL,
    assetName: nftName,
    unitName: nftUnitName,
  });

  const fp = await fetchAlgorandSuggestedParams();
  const suggestedParams = fp.params;
  const optParamsRaw = fp.raw;

  const noopIssuerSigner = makeNoopIssuerSigner();
  const peraSigner = makePeraSigner(args.peraWallet);
  const assetIds = await fetchAccountAssetIds(currentAddress);
  const needsUsdcOptIn = !assetIds.includes(Number(usdcAsaId));
  const xferPrep = await prepareUnsignedNftDelivery({
    policyId,
    recipient: currentAddress,
    assetId: nftAssetId,
    suggestedParams: optParamsRaw,
  });

  const xferTxn = algosdk.decodeUnsignedTransaction(
    new Uint8Array(Buffer.from(xferPrep.unsignedTransferB64!, "base64")),
  );
  const freezeNftTxn = algosdk.decodeUnsignedTransaction(
    new Uint8Array(Buffer.from(xferPrep.unsignedFreezeB64!, "base64")),
  );
  const { built, idxXfer, idxFreeze, nTx, labels } = buildPurchaseAtomicGroup({
    appId,
    usdcAsaId,
    currentAddress,
    policyId,
    productId,
    premiumAmountMicro,
    metadataUri,
    nftAssetId,
    flightNumber,
    departureUnix,
    suggestedParams,
    vaultAddr,
    boxReferences,
    peraSigner,
    noopIssuerSigner,
    xferTxn,
    freezeNftTxn,
    needsUsdcOptIn,
  });

  const groupedXferB64 = Buffer.from(
    algosdk.encodeUnsignedTransaction(built[idxXfer]!.txn),
  ).toString("base64");
  const groupedFreezeB64 = Buffer.from(
    algosdk.encodeUnsignedTransaction(built[idxFreeze]!.txn),
  ).toString("base64");

  const signXferJson = await signGroupedNftDelivery({
    policyId,
    recipient: currentAddress,
    assetId: nftAssetId,
    unsignedGroupedTransferB64: groupedXferB64,
    unsignedGroupedFreezeB64: groupedFreezeB64,
  });

  const signedXferBlob = new Uint8Array(
    Buffer.from(signXferJson.signedXferB64!, "base64"),
  );
  const signedFreezeBlob = new Uint8Array(
    Buffer.from(signXferJson.signedFreezeB64!, "base64"),
  );

  toast.info(
    "Approve once in Pera: premium, policy, receive NFT, link, and freeze (single approval).",
  );
  const signedRaw = await args.peraWallet.signTransaction([
    built.map((tw, i) => ({
      txn: tw.txn,
      signers: i === idxXfer || i === idxFreeze ? [] : undefined,
      message: labels[i] ?? `Transaction ${i + 1}`,
    })),
  ]);
  const walletSigs = normalizePeraSignedResponse(signedRaw);
  const merged = mergeAtomicGroupSignaturesWithIssuerBlobs({
    nTx,
    idxXfer,
    idxFreeze,
    signedXferBlob,
    signedFreezeBlob,
    walletSigs,
  });

  const combined = concatSignedBlobs(merged);

  const signedBase64 = Buffer.from(combined).toString("base64");
  await sendSignedGroup(signedBase64);
  const groupTxIds = built.map((tw) => tw.txn.txID().toString());

  return {
    built,
    groupTxIds,
    vaultAddr,
    labels,
    nftAssetId,
    policyId,
    premiumAmountMicro,
    appId,
    currentAddress,
  };
}
