import { useRef, useState } from "react";
import { toast } from "sonner";
import type { LastPurchaseTx } from "@/lib/dashboard/types";
import { mapPurchaseError } from "@/lib/dashboard/policy-purchase/errors";
import {
  finalizePurchasedMetadata,
  preparePolicyMetadata,
} from "@/lib/dashboard/policy-purchase/metadata";
import { executePolicyGroupPurchase } from "@/lib/dashboard/policy-purchase/transaction";
import type {
  PurchaseCallbacks,
  PurchaseFormState,
  PurchaseInit,
} from "@/lib/dashboard/policy-purchase/types";

type UsePolicyPurchaseArgs = {
  connected: PurchaseInit["connected"];
  address?: PurchaseInit["address"];
  peraWallet: PurchaseInit["peraWallet"];
  pnr: PurchaseFormState["pnr"];
  flightNumber: PurchaseFormState["flightNumber"];
  departureDate: PurchaseFormState["departureDate"];
  departureTime: PurchaseFormState["departureTime"];
  productId: PurchaseFormState["productId"];
  fetchedPassenger: PurchaseFormState["fetchedPassenger"];
  setFlightNumber: PurchaseCallbacks["setFlightNumber"];
  setDepartureDate: PurchaseCallbacks["setDepartureDate"];
  setDepartureTime: PurchaseCallbacks["setDepartureTime"];
  setPnr: PurchaseCallbacks["setPnr"];
  setProductId: PurchaseCallbacks["setProductId"];
  setFetchedPassenger: PurchaseCallbacks["setFetchedPassenger"];
  setPnrStatus: PurchaseCallbacks["setPnrStatus"];
  setPnrRoute: PurchaseCallbacks["setPnrRoute"];
  setShowBuyForm: PurchaseCallbacks["setShowBuyForm"];
  fetchMyPolicies: PurchaseCallbacks["fetchMyPolicies"];
  setLastPurchaseTx: (value: LastPurchaseTx) => void;
  fetchUsdcOptInStatus?: () => void | Promise<unknown>;
  /** When set, purchase is blocked (same PNR already owned — from list or PNR lookup). */
  existingPolicyForPnr?: unknown | null;
};

export function usePolicyPurchase({
  connected,
  address,
  peraWallet,
  pnr,
  flightNumber,
  departureDate,
  departureTime,
  productId,
  fetchedPassenger,
  setFlightNumber,
  setDepartureDate,
  setDepartureTime,
  setPnr,
  setProductId,
  setFetchedPassenger,
  setPnrStatus,
  setPnrRoute,
  setShowBuyForm,
  fetchMyPolicies,
  setLastPurchaseTx,
  fetchUsdcOptInStatus,
  existingPolicyForPnr,
}: UsePolicyPurchaseArgs) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const purchaseInFlightRef = useRef(false);

  const handleBuy = async () => {
    if (
      !pnr ||
      !flightNumber ||
      !departureDate ||
      !departureTime ||
      !productId
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    if (pnr.length !== 6) {
      toast.error("PNR must be exactly 6 characters");
      return;
    }
    if (existingPolicyForPnr) {
      toast.error("You already have a policy for this PNR.");
      return;
    }

    const currentAddress = address;
    if (
      !connected ||
      !currentAddress ||
      typeof currentAddress !== "string" ||
      currentAddress.trim() === ""
    ) {
      console.error("Wallet connection check failed:", {
        connected,
        address,
        currentAddress,
        type: typeof address,
      });
      toast.error("Please connect your Algorand wallet");
      return;
    }
    if (currentAddress.length !== 58) {
      console.error("Invalid address format:", {
        address: currentAddress,
        length: currentAddress.length,
      });
      toast.error(
        "Invalid wallet address format. Please reconnect your wallet.",
      );
      return;
    }
    if (!peraWallet) {
      toast.error("Wallet not ready. Please wait a moment and try again.");
      return;
    }
    if (purchaseInFlightRef.current) {
      toast.info("A purchase is already in progress.");
      return;
    }

    purchaseInFlightRef.current = true;
    setIsSubmitting(true);

    const uploadedFiles: string[] = [];
    const cleanupUploadedFiles = async () => {
      if (uploadedFiles.length === 0) return;
      for (const filePath of uploadedFiles) {
        try {
          const delRes = await fetch("/api/github/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filePath,
              message:
                "Cleanup: Remove orphaned metadata due to failed transaction",
            }),
          });
          if (!delRes.ok) {
            const err = await delRes.json().catch(() => ({}));
            console.warn(
              `Failed to delete ${filePath}:`,
              (err as { error?: string }).error || delRes.statusText,
            );
          }
        } catch (cleanupError: unknown) {
          console.warn(
            `Failed to cleanup ${filePath}:`,
            cleanupError instanceof Error ? cleanupError.message : cleanupError,
          );
        }
      }
    };

    try {
      const prepared = await preparePolicyMetadata({
        currentAddress,
        productId,
        flightNumber,
        pnr,
        departureDate,
        departureTime,
        uploadedFiles,
      });

      const { snapshot, nftAssetId } = await executePolicyGroupPurchase({
        ...prepared,
        peraWallet,
        currentAddress,
        productId,
        flightNumber,
        departureDate,
        pnr,
        fetchedPassenger,
        address,
      });

      await finalizePurchasedMetadata({
        nftAssetId,
        metadata: prepared.metadata,
        metadataFilename: prepared.metadataFilename,
        policyId: prepared.policyId,
        productId,
        flightNumber,
        departureIso: prepared.departureIso,
        premiumUsd: prepared.premiumUsd,
        coverageUsd: prepared.coverageUsd,
        zyuraAppIdStr: prepared.zyuraAppIdStr,
      });

      setLastPurchaseTx(snapshot);

      void fetchUsdcOptInStatus?.();
      setTimeout(() => void fetchUsdcOptInStatus?.(), 800);
      setTimeout(() => void fetchUsdcOptInStatus?.(), 2200);

      setFlightNumber("");
      setDepartureDate("");
      setDepartureTime("");
      setPnr("");
      setProductId("");
      setFetchedPassenger(null);
      setPnrStatus(null);
      setPnrRoute(null);
      setShowBuyForm(false);
      setTimeout(() => {
        fetchMyPolicies(true);
      }, 5000);
    } catch (error: any) {
      console.error("Purchase error:", error);
      await cleanupUploadedFiles();
      toast.error("Purchase didn't complete", {
        description: mapPurchaseError(error, currentAddress),
      });
    } finally {
      purchaseInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleBuy };
}
