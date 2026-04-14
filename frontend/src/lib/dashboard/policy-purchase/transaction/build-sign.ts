import algosdk from "algosdk";
import { toast } from "sonner";
import { fetchAlgorandSuggestedParams } from "@/lib/dashboard/algorand-utils";
import type { PurchaseExecutionInput } from "@/lib/dashboard/policy-purchase/types";
import { createBoxName, policyPurchaseBoxReferences } from "./boxes";
import { getPurchaseStepLabels } from "./step-labels";

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

  const appId = BigInt(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "0");
  const usdcAsaId = BigInt(process.env.NEXT_PUBLIC_USDC_ASA_ID || "0");
  if (!appId || appId === BigInt(0)) {
    throw new Error("NEXT_PUBLIC_ZYURA_APP_ID not set");
  }
  if (!usdcAsaId || usdcAsaId === BigInt(0)) {
    throw new Error("NEXT_PUBLIC_USDC_ASA_ID not set");
  }

  toast.info("Loading where to send your premium...");
  const vaultApiRes = await fetch("/api/zyura/vault");
  if (!vaultApiRes.ok) {
    const error = await vaultApiRes.json();
    throw new Error(error.error || "Failed to get vault address");
  }
  const vaultData = await vaultApiRes.json();
  const vaultAddr = vaultData.vault;
  if (!vaultAddr) {
    throw new Error(
      "Vault address not found - please set RISK_POOL_VAULT_ADDR in .env",
    );
  }

  const boxReferences = policyPurchaseBoxReferences(
    Number(productId),
    policyId,
  );

  toast.info("Creating your policy NFT ASA (issuer)...");
  const preMintRes = await fetch("/api/zyura/mint-policy-nft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "createBeforePurchase",
      policyId: String(policyId),
      recipient: currentAddress,
      assetURL,
      assetName: nftName,
      unitName: nftUnitName,
    }),
  });
  if (!preMintRes.ok) {
    const err = await preMintRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ||
        "Failed to create policy NFT ASA before purchase",
    );
  }
  const preMint = (await preMintRes.json()) as { assetId?: number };
  if (preMint.assetId == null)
    throw new Error("Mint API did not return assetId");
  const nftAssetId = preMint.assetId;

  const fp = await fetchAlgorandSuggestedParams();
  const suggestedParams = fp.params;
  const optParamsRaw = fp.raw;

  const noopIssuerSigner: algosdk.TransactionSigner = async (_txns, idxs) =>
    idxs.map(() => new Uint8Array(0));

  const transferUsdcTxn =
    algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: currentAddress,
      receiver: vaultAddr,
      amount: Number(premiumAmountMicro),
      assetIndex: Number(usdcAsaId),
      suggestedParams,
    });

  const purchasePolicyMethod = new algosdk.ABIMethod({
    name: "purchasePolicy",
    args: [
      { type: "axfer", name: "premiumPayment" },
      { type: "uint64", name: "policyId" },
      { type: "uint64", name: "productId" },
      { type: "string", name: "flightNumber" },
      { type: "uint64", name: "departureTime" },
      { type: "uint64", name: "premiumAmount" },
      { type: "bool", name: "createMetadata" },
      { type: "string", name: "metadataUri" },
      { type: "uint64", name: "nftAssetId" },
    ],
    returns: { type: "void" },
  });

  const acctRes = await fetch(
    `/api/algorand/account/${encodeURIComponent(currentAddress)}`,
  );
  if (!acctRes.ok) {
    const err = await acctRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || "Failed to load account assets",
    );
  }
  const acctData = (await acctRes.json()) as { assetIds?: number[] };
  const needsUsdcOptIn = !(acctData.assetIds ?? []).includes(Number(usdcAsaId));

  const xferPrepRes = await fetch("/api/zyura/mint-policy-nft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "unsignedNftDelivery",
      policyId: String(policyId),
      recipient: currentAddress,
      assetId: nftAssetId,
      suggestedParams: optParamsRaw,
    }),
  });
  if (!xferPrepRes.ok) {
    const err = await xferPrepRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ||
        "Failed to prepare NFT transfer + freeze",
    );
  }
  const xferPrep = (await xferPrepRes.json()) as {
    unsignedTransferB64?: string;
    unsignedFreezeB64?: string;
  };
  if (!xferPrep.unsignedTransferB64 || !xferPrep.unsignedFreezeB64) {
    throw new Error("Mint API did not return transfer + freeze transactions");
  }

  const xferTxn = algosdk.decodeUnsignedTransaction(
    new Uint8Array(Buffer.from(xferPrep.unsignedTransferB64, "base64")),
  );
  const freezeNftTxn = algosdk.decodeUnsignedTransaction(
    new Uint8Array(Buffer.from(xferPrep.unsignedFreezeB64, "base64")),
  );
  const optInNftTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(
    {
      sender: currentAddress,
      receiver: currentAddress,
      amount: 0,
      assetIndex: nftAssetId,
      suggestedParams,
    },
  );

  const linkMethod = new algosdk.ABIMethod({
    name: "linkPolicyNft",
    args: [
      { type: "uint64", name: "policyId" },
      { type: "uint64", name: "nftAssetId" },
    ],
    returns: { type: "void" },
  });

  const peraSigner: algosdk.TransactionSigner = async (txnGroup, indexes) => {
    const groupTxnArray = txnGroup.map((txn) => ({ txn }));
    const rawSigned = await args.peraWallet.signTransaction([groupTxnArray]);
    const signedGroup =
      rawSigned?.length === 1 &&
      Array.isArray(rawSigned[0]) &&
      rawSigned[0].length === txnGroup.length
        ? rawSigned[0]
        : rawSigned;
    if (!signedGroup?.length || signedGroup.length !== txnGroup.length) {
      throw new Error(
        `Expected ${txnGroup.length} signed transactions. If you cancelled signing or only approved part of the group, try again and approve all transactions.`,
      );
    }
    return indexes.map((i) =>
      signedGroup[i] instanceof Uint8Array ? signedGroup[i] : new Uint8Array(0),
    );
  };

  const purchaseAtc = new algosdk.AtomicTransactionComposer();
  if (needsUsdcOptIn) {
    const usdcOptInTxn =
      algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: currentAddress,
        receiver: currentAddress,
        amount: 0,
        assetIndex: Number(usdcAsaId),
        suggestedParams,
      });
    purchaseAtc.addTransaction({ txn: usdcOptInTxn, signer: peraSigner });
  }
  purchaseAtc.addMethodCall({
    appID: Number(appId),
    method: purchasePolicyMethod,
    methodArgs: [
      { txn: transferUsdcTxn, signer: peraSigner },
      BigInt(policyId),
      BigInt(productId),
      flightNumber,
      BigInt(departureUnix),
      premiumAmountMicro,
      true,
      metadataUri,
      BigInt(nftAssetId),
    ],
    sender: currentAddress,
    suggestedParams,
    signer: peraSigner,
    boxes: boxReferences.map((boxName) => ({
      appIndex: Number(appId),
      name: boxName,
    })),
  });

  const fullAtc = purchaseAtc.clone();
  fullAtc.addTransaction({ txn: optInNftTxn, signer: peraSigner });
  fullAtc.addTransaction({ txn: xferTxn, signer: noopIssuerSigner });
  fullAtc.addMethodCall({
    appID: Number(appId),
    method: linkMethod,
    methodArgs: [BigInt(policyId), BigInt(nftAssetId)],
    sender: currentAddress,
    suggestedParams,
    signer: peraSigner,
    boxes: [
      { appIndex: Number(appId), name: createBoxName("pol_holder", policyId) },
      { appIndex: Number(appId), name: createBoxName("pol_nft", policyId) },
    ],
    appAccounts: [currentAddress],
    appForeignAssets: [Number(nftAssetId)],
  });
  fullAtc.addTransaction({ txn: freezeNftTxn, signer: noopIssuerSigner });

  const built = fullAtc.buildGroup();
  const nTx = built.length;
  const idxXfer = needsUsdcOptIn ? 4 : 3;
  const idxFreeze = needsUsdcOptIn ? 6 : 5;

  const groupedXferB64 = Buffer.from(
    algosdk.encodeUnsignedTransaction(built[idxXfer]!.txn),
  ).toString("base64");
  const groupedFreezeB64 = Buffer.from(
    algosdk.encodeUnsignedTransaction(built[idxFreeze]!.txn),
  ).toString("base64");

  const signXferRes = await fetch("/api/zyura/mint-policy-nft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "signNftDelivery",
      policyId: String(policyId),
      recipient: currentAddress,
      assetId: nftAssetId,
      unsignedGroupedTransferB64: groupedXferB64,
      unsignedGroupedFreezeB64: groupedFreezeB64,
    }),
  });
  if (!signXferRes.ok) {
    const err = await signXferRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ||
        "Failed to sign issuer NFT transfer + freeze",
    );
  }

  const signXferJson = (await signXferRes.json()) as {
    signedXferB64?: string;
    signedFreezeB64?: string;
  };
  if (!signXferJson.signedXferB64 || !signXferJson.signedFreezeB64) {
    throw new Error("Server did not return signed transfer + freeze");
  }

  const signedXferBlob = new Uint8Array(
    Buffer.from(signXferJson.signedXferB64, "base64"),
  );
  const signedFreezeBlob = new Uint8Array(
    Buffer.from(signXferJson.signedFreezeB64, "base64"),
  );

  const labels = getPurchaseStepLabels(needsUsdcOptIn);

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
  const parts =
    signedRaw?.length === 1 && Array.isArray(signedRaw[0])
      ? signedRaw[0]
      : signedRaw;
  if (!parts || parts.length < nTx) {
    throw new Error(
      "Wallet did not return a full signature set for the atomic group - try again.",
    );
  }

  const combined = new Uint8Array(
    Array.from({ length: nTx }, (_, i) => {
      if (i === idxXfer) return signedXferBlob.length;
      if (i === idxFreeze) return signedFreezeBlob.length;
      const p = parts[i];
      return p instanceof Uint8Array ? p.length : 0;
    }).reduce((a, b) => a + b, 0),
  );
  let cOff = 0;
  for (let i = 0; i < nTx; i++) {
    if (i === idxXfer) {
      combined.set(signedXferBlob, cOff);
      cOff += signedXferBlob.length;
    } else if (i === idxFreeze) {
      combined.set(signedFreezeBlob, cOff);
      cOff += signedFreezeBlob.length;
    } else {
      const p = parts[i];
      if (!(p instanceof Uint8Array) || !p.length) {
        throw new Error(
          `Wallet missing signature for transaction index ${i} - try again.`,
        );
      }
      combined.set(p, cOff);
      cOff += p.length;
    }
  }

  const signedBase64 = Buffer.from(combined).toString("base64");
  const sendRes = await fetch("/api/algorand/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTx: signedBase64 }),
  });
  if (!sendRes.ok) {
    const error = await sendRes.json();
    throw new Error(error.error || "Failed to send grouped transaction");
  }
  await sendRes.json();
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
