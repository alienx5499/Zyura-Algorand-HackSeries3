"use client";

import React, { useState } from "react";
import { useAlgorandWallet } from "@/contexts/WalletConnectionProvider";

import { DashboardShell } from "@/app/dashboard/_components/DashboardShell";
import { useDashboardAuthGate } from "@/app/dashboard/_hooks/useDashboardAuthGate";
import { useDashboardDataBootstrap } from "@/app/dashboard/_hooks/useDashboardDataBootstrap";
import { useDashboardFormState } from "@/app/dashboard/_hooks/useDashboardFormState";
import { useDashboardPurchaseFlow } from "@/app/dashboard/_hooks/useDashboardPurchaseFlow";
import type {
  DashboardMainGridProps,
  DashboardTutorialFormHandlers,
} from "@/app/dashboard/_components/types";
import { useDashboardData } from "@/lib/dashboard/use-dashboard-data";
import { useLastPurchaseTx } from "@/lib/dashboard/use-last-purchase-tx";
import { useDashboardSectionNavigation } from "@/lib/dashboard/use-dashboard-section-navigation";
import { usePnrLookup } from "@/lib/dashboard/use-pnr-lookup";
import { useUsdcOptIn } from "@/lib/dashboard/use-usdc-opt-in";

export default function DashboardPage() {
  const { address, isConnected, peraWallet } = useAlgorandWallet();

  const connected = isConnected;
  const { publicKey, walletInitComplete } = useDashboardAuthGate({
    address,
    connected,
  });
  const {
    clearForm,
    departureDate,
    departureTime,
    fetchedPassenger,
    flightNumber,
    pnr,
    pnrLinkage,
    pnrRoute,
    pnrStatus,
    productId,
    setDepartureDate,
    setDepartureTime,
    setFetchedPassenger,
    setFlightNumber,
    setPnr,
    setPnrLinkage,
    setPnrRoute,
    setPnrStatus,
    setProductId,
    setShowBuyForm,
    showBuyForm,
  } = useDashboardFormState();

  // UI state
  const {
    lastPurchaseTx,
    setLastPurchaseTx,
    peraExplorerBase,
    txExplorerUrl,
    groupExplorerUrl,
  } = useLastPurchaseTx({ address });

  // Data state
  const {
    isLoadingProducts,
    isLoadingPolicies,
    products,
    selectedProductInfo,
    myPolicies,
    policiesFetchError,
    fetchProducts,
    fetchMyPolicies,
    showProductById,
    resetPoliciesState,
  } = useDashboardData({
    address,
    productId,
    setProductId,
  });
  const { activeSection } = useDashboardSectionNavigation();
  const {
    isOptingInUsdc,
    isUsdcOptedIn,
    usdcBalance,
    canShowFaucet,
    setIsUsdcOptedIn,
    fetchUsdcOptInStatus,
    handleOptInUsdc,
  } = useUsdcOptIn({
    connected,
    address,
    peraWallet,
  });
  const [showAllPolicies, setShowAllPolicies] = useState(false);

  usePnrLookup({
    pnr,
    setFlightNumber,
    setDepartureDate,
    setDepartureTime,
    setFetchedPassenger,
    setPnrStatus,
    setPnrRoute,
    setPnrLinkage,
  });

  const {
    closePolicyModal,
    existingPolicyForPnr,
    handleBuy,
    isSubmitting,
    openPolicyModal,
    policyModalData,
    showPolicyModal,
  } = useDashboardPurchaseFlow({
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
  });

  useDashboardDataBootstrap({
    walletInitComplete,
    isConnected: connected,
    address,
    fetchProducts,
    fetchMyPolicies,
    fetchUsdcOptInStatus,
    resetPoliciesState,
    setIsUsdcOptedIn,
  });

  // Don't show dashboard content to unconnected users
  // But allow page to mount so wallet connect can initialize
  // Redirect will happen via useEffect above after wallet connect has initialized
  if (!connected || !publicKey) {
    // Show blank/loading screen - don't render dashboard content
    // Page still mounts in background for wallet connect to initialize
    return null;
  }

  const mainGridProps: DashboardMainGridProps = {
    activeSection,
    showBuyForm,
    setShowBuyForm,
    connected,
    isSubmitting,
    handleBuy,
    productId,
    setProductId,
    products,
    isLoadingProducts,
    showProductById,
    pnr,
    setPnr,
    pnrStatus,
    setPnrStatus,
    flightNumber,
    setFlightNumber,
    departureDate,
    setDepartureDate,
    departureTime,
    setDepartureTime,
    fetchedPassenger,
    setFetchedPassenger,
    existingPolicyForPnr,
    openPolicyModal,
    isUsdcOptedIn,
    usdcBalance,
    canShowFaucet,
    handleOptInUsdc,
    isOptingInUsdc,
    peraWallet,
    policiesFetchError,
    fetchMyPolicies,
    isLoadingPolicies,
    myPolicies,
    showAllPolicies,
    setShowAllPolicies,
    peraExplorerBase,
    address,
    selectedProductInfo,
    pnrRoute,
  };
  const tutorialFormHandlers: DashboardTutorialFormHandlers = {
    setShowBuyForm,
    setPnr,
    setFlightNumber,
    setDepartureDate,
    setDepartureTime,
    setProductId,
    clearForm,
  };

  return (
    <DashboardShell
      lastPurchaseTx={lastPurchaseTx}
      txExplorerUrl={txExplorerUrl}
      groupExplorerUrl={groupExplorerUrl}
      mainGridProps={mainGridProps}
      showPolicyModal={showPolicyModal}
      closePolicyModal={closePolicyModal}
      policyModalData={policyModalData}
      tutorialFormHandlers={tutorialFormHandlers}
    />
  );
}
