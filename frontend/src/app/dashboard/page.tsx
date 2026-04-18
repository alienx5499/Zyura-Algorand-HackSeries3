"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar1 } from "@/components/ui/navbar-1";
import { useAlgorandWallet } from "@/contexts/WalletConnectionProvider";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Import new components
import { BuyInsuranceSection } from "@/components/dashboard/BuyInsuranceSection";
import { FlightRouteSection } from "@/components/dashboard/FlightRouteSection";
import { HowItWorksCard } from "@/components/dashboard/HowItWorksCard";
import { MyPoliciesSection } from "@/components/dashboard/MyPoliciesSection";
import { ProductDetailsPanel } from "@/components/dashboard/ProductDetailsPanel";
import { PolicyModal } from "@/components/dashboard/PolicyModal";
import { InteractiveTutorial } from "@/components/dashboard/InteractiveTutorial";
import { PurchaseConfirmationCard } from "@/components/dashboard/PurchaseConfirmationCard";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { useDashboardData } from "@/lib/dashboard/use-dashboard-data";
import { useLastPurchaseTx } from "@/lib/dashboard/use-last-purchase-tx";
import { usePolicyModal } from "@/lib/dashboard/use-policy-modal";
import { usePolicyPurchase } from "@/lib/dashboard/use-policy-purchase";
import { useDashboardSectionNavigation } from "@/lib/dashboard/use-dashboard-section-navigation";
import { usePnrLookup } from "@/lib/dashboard/use-pnr-lookup";
import { useUsdcOptIn } from "@/lib/dashboard/use-usdc-opt-in";
import type { PnrFlightRoute, PnrStatus } from "@/lib/dashboard/types";

export default function DashboardPage() {
  const router = useRouter();
  const lastPoliciesFetchKeyRef = useRef<string | null>(null);
  const { address, isConnected, peraWallet } = useAlgorandWallet();

  const connected = isConnected;
  const publicKey = useMemo(
    () => (address ? { toString: () => address } : (null as any)),
    [address],
  );

  // Track if we've given wallet connect time to initialize (prevents blocking wallet connect)
  const [walletInitComplete, setWalletInitComplete] = useState(false);

  // Allow wallet connect to initialize - don't block immediately
  useEffect(() => {
    // Give wallet connect (autoConnect) time to initialize before checking connection
    // This prevents blocking wallet connect when it tries to access URLs with hash fragments
    const initTimer = setTimeout(() => {
      setWalletInitComplete(true);
    }, 1500); // Wait 1.5 seconds for wallet connect to initialize

    return () => clearTimeout(initTimer);
  }, []);

  // Redirect to home if wallet is not connected (after wallet connect has had time to initialize)
  useEffect(() => {
    // Only redirect after wallet connect has had time to initialize
    if (walletInitComplete && (!connected || !publicKey)) {
      router.push("/");
    }
  }, [walletInitComplete, connected, publicKey, router]);

  // Form state
  const [flightNumber, setFlightNumber] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [productId, setProductId] = useState("");
  const [pnr, setPnr] = useState("");

  // UI state
  const [showBuyForm, setShowBuyForm] = useState(false);
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
  const {
    showPolicyModal,
    policyModalData,
    openPolicyModal,
    closePolicyModal,
  } = usePolicyModal({
    address,
    peraExplorerBase,
  });
  const [fetchedPassenger, setFetchedPassenger] = useState<any | null>(null);
  const [pnrStatus, setPnrStatus] = useState<PnrStatus>(null);
  const [pnrRoute, setPnrRoute] = useState<PnrFlightRoute | null>(null);
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
  });

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch policies when Algorand wallet is ready and connected (after init to avoid stale address)
  useEffect(() => {
    if (!walletInitComplete) return;
    const hasAddress =
      address && typeof address === "string" && address.trim().length > 0;
    if (isConnected && hasAddress) {
      const wallet = address.trim();
      const fetchKey = `${wallet}:${isConnected ? "1" : "0"}`;
      if (lastPoliciesFetchKeyRef.current === fetchKey) {
        return;
      }
      lastPoliciesFetchKeyRef.current = fetchKey;
      fetchMyPolicies();
      fetchUsdcOptInStatus();
    } else {
      lastPoliciesFetchKeyRef.current = null;
      resetPoliciesState();
      setIsUsdcOptedIn(null);
    }
  }, [
    walletInitComplete,
    isConnected,
    address,
    fetchMyPolicies,
    fetchUsdcOptInStatus,
    resetPoliciesState,
    setIsUsdcOptedIn,
  ]);

  usePnrLookup({
    pnr,
    setFlightNumber,
    setDepartureDate,
    setDepartureTime,
    setFetchedPassenger,
    setPnrStatus,
    setPnrRoute,
  });

  // Don't show dashboard content to unconnected users
  // But allow page to mount so wallet connect can initialize
  // Redirect will happen via useEffect above after wallet connect has initialized
  if (!connected || !publicKey) {
    // Show blank/loading screen - don't render dashboard content
    // Page still mounts in background for wallet connect to initialize
    return null;
  }

  return (
    <>
      <Navbar1 />
      <main className="min-h-screen bg-black pt-24 pb-16">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            id="dashboard"
            data-section="dashboard"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              duration: 0.6,
            }}
            className="mb-8 md:mb-12 scroll-mt-32"
          >
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-white mb-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            >
              Dashboard
            </motion.h1>
            <motion.p
              className="text-gray-400 text-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            >
              Manage your flight delay insurance policies
            </motion.p>
          </motion.div>

          {/* Last Purchase Banner - Shows transaction details after successful purchase */}
          <AnimatePresence>
            {lastPurchaseTx && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mb-6 relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-3xl md:p-3"
              >
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <PurchaseConfirmationCard
                  policyId={lastPurchaseTx.policyId}
                  nftAssetId={lastPurchaseTx.nftAssetId}
                  purchasedAtIso={lastPurchaseTx.purchasedAtIso}
                  txId={lastPurchaseTx.txId}
                  groupId={lastPurchaseTx.groupId}
                  txExplorerUrl={txExplorerUrl}
                  groupExplorerUrl={groupExplorerUrl}
                  onCopyGroupId={async () => {
                    if (!lastPurchaseTx.groupId) return;
                    try {
                      await navigator.clipboard.writeText(
                        lastPurchaseTx.groupId,
                      );
                      toast.success("Group ID copied");
                    } catch {
                      toast.error("Failed to copy Group ID");
                    }
                  }}
                  onCopyTxId={async () => {
                    try {
                      await navigator.clipboard.writeText(lastPurchaseTx.txId);
                      toast.success("Transaction ID copied");
                    } catch {
                      toast.error("Failed to copy transaction ID");
                    }
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Primary Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Buy Insurance Section */}
              <BuyInsuranceSection
                activeSection={activeSection}
                showBuyForm={showBuyForm}
                setShowBuyForm={setShowBuyForm}
                connected={connected}
                isSubmitting={isSubmitting}
                handleBuy={handleBuy}
                productId={productId}
                setProductId={setProductId}
                products={products}
                isLoadingProducts={isLoadingProducts}
                showProductById={showProductById}
                pnr={pnr}
                setPnr={setPnr}
                pnrStatus={pnrStatus}
                setPnrStatus={setPnrStatus}
                flightNumber={flightNumber}
                setFlightNumber={setFlightNumber}
                departureDate={departureDate}
                setDepartureDate={setDepartureDate}
                departureTime={departureTime}
                setDepartureTime={setDepartureTime}
                fetchedPassenger={fetchedPassenger}
                setFetchedPassenger={setFetchedPassenger}
                myPolicies={myPolicies}
                openPolicyModal={openPolicyModal}
                isUsdcOptedIn={isUsdcOptedIn}
                usdcBalance={usdcBalance}
                canShowFaucet={canShowFaucet}
                handleOptInUsdc={handleOptInUsdc}
                isOptingInUsdc={isOptingInUsdc}
                peraWallet={peraWallet}
              />

              <MyPoliciesSection
                activeSection={activeSection}
                connected={connected}
                policiesFetchError={policiesFetchError}
                fetchMyPolicies={fetchMyPolicies}
                isLoadingPolicies={isLoadingPolicies}
                myPolicies={myPolicies}
                showAllPolicies={showAllPolicies}
                setShowAllPolicies={setShowAllPolicies}
                setShowBuyForm={setShowBuyForm}
                peraExplorerBase={peraExplorerBase}
                address={address}
                openPolicyModal={openPolicyModal}
              />
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Product Details Card */}
              <ProductDetailsPanel selectedProductInfo={selectedProductInfo} />

              <FlightRouteSection
                pnr={pnr}
                pnrStatus={pnrStatus}
                pnrRoute={pnrRoute}
              />

              {/* Info Card */}
              <HowItWorksCard />
            </div>
          </div>
        </div>
      </main>

      {/* Policy Modal */}
      <PolicyModal
        isOpen={showPolicyModal}
        onClose={closePolicyModal}
        data={policyModalData}
      />

      {/* Interactive Tutorial */}
      <InteractiveTutorial
        formHandlers={{
          setShowBuyForm,
          setPnr,
          setFlightNumber,
          setDepartureDate,
          setDepartureTime,
          setProductId,
          clearForm: () => {
            setPnr("");
            setFlightNumber("");
            setDepartureDate("");
            setDepartureTime("");
            setFetchedPassenger(null);
            setPnrStatus(null);
            setPnrRoute(null);
          },
        }}
      />
    </>
  );
}
