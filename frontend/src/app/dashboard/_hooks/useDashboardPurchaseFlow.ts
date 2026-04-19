"use client";

import { usePolicyModal } from "@/lib/dashboard/use-policy-modal";
import { usePolicyPurchase } from "@/lib/dashboard/use-policy-purchase";
import { useExistingPolicyForPnr } from "@/components/dashboard/buy-insurance/use-buy-insurance-memos";
import type {
  LastPurchaseTx,
  PnrFlightRoute,
  PnrStatus,
} from "@/lib/dashboard/types";
import type { PnrLookupLinkage } from "@/lib/dashboard/use-pnr-lookup";

type UseDashboardPurchaseFlowArgs = {
  connected: boolean;
  address: string | null | undefined;
  peraWallet: unknown;
  pnr: string;
  flightNumber: string;
  departureDate: string;
  departureTime: string;
  productId: string;
  fetchedPassenger: unknown;
  setFlightNumber: (value: string) => void;
  setDepartureDate: (value: string) => void;
  setDepartureTime: (value: string) => void;
  setPnr: (value: string) => void;
  setProductId: (value: string) => void;
  setFetchedPassenger: (value: unknown) => void;
  setPnrStatus: (value: PnrStatus) => void;
  setPnrRoute: (value: PnrFlightRoute | null) => void;
  setShowBuyForm: (value: boolean) => void;
  fetchMyPolicies: () => void | Promise<void>;
  setLastPurchaseTx: (value: LastPurchaseTx | null) => void;
  fetchUsdcOptInStatus: () => Promise<unknown>;
  myPolicies: unknown[];
  pnrLinkage: PnrLookupLinkage | null;
  peraExplorerBase: string;
};

export function useDashboardPurchaseFlow({
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
  myPolicies,
  pnrLinkage,
  peraExplorerBase,
}: UseDashboardPurchaseFlowArgs) {
  const existingPolicyForPnr = useExistingPolicyForPnr(
    myPolicies,
    pnr,
    pnrLinkage,
    address,
  );
  const {
    showPolicyModal,
    policyModalData,
    openPolicyModal,
    closePolicyModal,
  } = usePolicyModal({
    address,
    peraExplorerBase,
  });
  const { isSubmitting, handleBuy } = usePolicyPurchase({
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
  });

  return {
    closePolicyModal,
    existingPolicyForPnr,
    handleBuy,
    isSubmitting,
    openPolicyModal,
    policyModalData,
    showPolicyModal,
  };
}
