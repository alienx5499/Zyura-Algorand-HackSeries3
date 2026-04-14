import type algosdk from "algosdk";
import type { LastPurchaseTx } from "@/lib/dashboard/types";

type BuiltGroup = ReturnType<algosdk.AtomicTransactionComposer["buildGroup"]>;

export function buildPurchaseSnapshot(params: {
  built: BuiltGroup;
  labels: string[];
  vaultAddr: string;
  premiumAmountMicro: bigint;
  policyId: number;
  nftAssetId: number;
  currentAddress: string;
  appId: bigint;
}): LastPurchaseTx {
  const {
    built,
    labels,
    vaultAddr,
    premiumAmountMicro,
    policyId,
    nftAssetId,
    currentAddress,
    appId,
  } = params;

  const stepTxs = built.map((tw, i) => {
    const t = tw.txn as {
      type?: string;
    };
    const txType =
      t.type === "axfer"
        ? "Asset Transfer"
        : t.type === "appl"
          ? "Application Call"
          : t.type === "afrz"
            ? "Asset Freeze"
            : t.type;
    const label = labels[i] || `Step ${i + 1}`;
    const appLabel = `App ${appId.toString()}`;
    const issuerAddr = process.env.ADMIN_ADDRESS || "Issuer";
    let from = "Wallet";
    let to = "Wallet";
    let summary = "On-chain step";
    switch (label) {
      case "Opt in to USDC":
        from = currentAddress;
        to = currentAddress;
        summary = "Enable USDC for payments (amount 0).";
        break;
      case "Pay premium (USDC)":
        from = currentAddress;
        to = vaultAddr;
        summary = `Transfer premium $${(Number(premiumAmountMicro) / 1_000_000).toFixed(2)} tUSDC to vault.`;
        break;
      case "Register your policy on Zyura":
        from = currentAddress;
        to = appLabel;
        summary = `Call purchasePolicy for policy ${policyId}.`;
        break;
      case "Opt in to policy NFT":
        from = currentAddress;
        to = currentAddress;
        summary = "Enable receiving policy NFT (amount 0).";
        break;
      case "Deliver policy NFT":
        from = issuerAddr;
        to = currentAddress;
        summary = "Send 1 policy NFT ASA to wallet.";
        break;
      case "Link policy NFT to your policy":
        from = currentAddress;
        to = appLabel;
        summary = "Link NFT ASA id to policy storage.";
        break;
      case "Freeze policy NFT (soulbound)":
        from = issuerAddr;
        to = currentAddress;
        summary = "Freeze NFT holding to enforce non-transferability.";
        break;
    }
    return {
      txId: tw.txn.txID().toString(),
      label,
      type: txType || "Transaction",
      from,
      to,
      summary,
    };
  });

  const premiumTransferStep = stepTxs.find(
    (s) => s.label === "Pay premium (USDC)",
  );
  const groupId = built[0]?.txn.group
    ? Buffer.from(built[0].txn.group).toString("base64")
    : undefined;

  return {
    txId: built[0]!.txn.txID().toString(),
    groupId,
    policyId: String(policyId),
    nftAssetId: String(nftAssetId),
    purchasedAtIso: new Date().toISOString(),
    steps: stepTxs,
    premiumTransfer: premiumTransferStep
      ? {
          txId: premiumTransferStep.txId,
          amountMicro: Number(premiumAmountMicro),
          amountUsd: (Number(premiumAmountMicro) / 1_000_000).toFixed(2),
          receiver: vaultAddr,
        }
      : undefined,
  };
}
