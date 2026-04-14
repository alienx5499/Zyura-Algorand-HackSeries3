import { toast } from "sonner";
import type { LastPurchaseTx } from "@/lib/dashboard/types";
import type { PurchaseExecutionInput } from "@/lib/dashboard/policy-purchase/types";
import { buildAndSendPurchaseGroup } from "./build-sign";
import { waitForPurchaseConfirmation } from "./confirm";
import { buildPurchaseSnapshot } from "./snapshot";
import { registerPnrAfterPurchase } from "./pnr-register";

export async function executePolicyGroupPurchase(
  args: PurchaseExecutionInput,
): Promise<{
  snapshot: LastPurchaseTx;
  nftAssetId: number;
  groupTxId: string;
  metadataUri: string;
}> {
  const sent = await buildAndSendPurchaseGroup(args);

  toast.info("Waiting for the network to confirm...");
  await waitForPurchaseConfirmation(sent.groupTxIds[0]);

  const snapshot = buildPurchaseSnapshot({
    built: sent.built,
    labels: sent.labels,
    vaultAddr: sent.vaultAddr,
    premiumAmountMicro: sent.premiumAmountMicro,
    policyId: sent.policyId,
    nftAssetId: sent.nftAssetId,
    currentAddress: sent.currentAddress,
    appId: sent.appId,
  });

  toast.success("You're covered - policy purchased.", {
    description: `One approval · policy NFT #${sent.nftAssetId} · Tx ${sent.groupTxIds[0].slice(0, 10)}...`,
  });

  toast.info("Linking your PNR to this policy...");
  await registerPnrAfterPurchase({
    pnr: args.pnr,
    policyId: sent.policyId,
    address: args.address,
    flightNumber: args.flightNumber,
    departureDate: args.departureDate,
    departureUnix: args.departureUnix,
    fetchedPassenger: args.fetchedPassenger,
    metadataUri: args.metadataUri,
  });

  return {
    snapshot,
    nftAssetId: sent.nftAssetId,
    groupTxId: sent.groupTxIds[0],
    metadataUri: args.metadataUri,
  };
}
