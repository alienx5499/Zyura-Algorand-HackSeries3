"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Plane,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Navbar1 } from "@/components/ui/navbar-1";
import { useAlgorandWallet } from "@/contexts/WalletConnectionProvider";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Import new components
import { BuyInsuranceHeader } from "@/components/dashboard/BuyInsuranceHeader";
import { FormField } from "@/components/dashboard/FormField";
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
import { Card, CardContent } from "@/components/ui/card";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected, peraWallet } = useAlgorandWallet();

  const connected = isConnected;
  const publicKey = address ? { toString: () => address } : (null as any);

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
  const [isFetchingPnr, setIsFetchingPnr] = useState(false);
  const [pnrStatus, setPnrStatus] = useState<
    "fetching" | "found" | "not-found" | null
  >(null);
  const { activeSection } = useDashboardSectionNavigation();
  const {
    isOptingInUsdc,
    isUsdcOptedIn,
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
    setShowBuyForm,
    fetchMyPolicies,
    setLastPurchaseTx,
  });

  // Time options for departure time selector
  const timeOptions = React.useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        const value = `${hh}:${mm}`;
        const date = new Date();
        date.setHours(h, m, 0, 0);
        const label = date.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        });
        options.push({ value, label });
      }
    }
    return options;
  }, []);

  // Detect if user already has a policy for the entered PNR (block duplicate purchase)
  const getPolicyPnr = (p: any) =>
    (
      p.pnr ??
      p.metadata?.pnr ??
      p.metadata?.attributes?.find((a: any) => a.trait_type === "PNR")?.value ??
      ""
    )
      .toString()
      .trim();
  const existingPolicyForPnr = React.useMemo(() => {
    const pnrTrim = pnr.trim();
    if (!pnrTrim) return null;
    return (
      myPolicies.find((p) => {
        const existingPnr = getPolicyPnr(p);
        return (
          existingPnr && existingPnr.toLowerCase() === pnrTrim.toLowerCase()
        );
      }) ?? null
    );
  }, [myPolicies, pnr]);

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
      fetchMyPolicies();
      fetchUsdcOptInStatus();
    } else {
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
    setIsFetchingPnr,
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
              <motion.section
                id="buy"
                data-section="buy"
                initial={{ opacity: 0, y: 30 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  borderColor:
                    activeSection === "buy"
                      ? "rgba(99, 102, 241, 0.5)"
                      : undefined,
                }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
                className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-3xl md:p-3 scroll-mt-32"
              >
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <Card className="relative overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black">
                  <CardContent className="p-6 md:p-8">
                    <BuyInsuranceHeader
                      showBuyForm={showBuyForm}
                      onToggleBuyForm={() => setShowBuyForm((s) => !s)}
                    />

                    <AnimatePresence>
                      {!connected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3"
                        >
                          <motion.div
                            animate={{
                              rotate: [0, -10, 10, -10, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                            }}
                          >
                            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          </motion.div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              Wallet Not Connected
                            </p>
                            <p className="text-xs text-gray-300 mt-1">
                              Connect your wallet to purchase insurance
                              policies.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {showBuyForm && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, scale: 0.98 }}
                          animate={{ height: "auto", opacity: 1, scale: 1 }}
                          exit={{ height: 0, opacity: 0, scale: 0.98 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                            mass: 0.8,
                          }}
                          className="overflow-hidden"
                        >
                          <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.15,
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                            }}
                          >
                            {/* Opt-in to USDC (required only if wallet is not opted in) */}
                            {isUsdcOptedIn === false && (
                              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm text-amber-200/90">
                                  First time? Your wallet must opt in to USDC
                                  (Testnet) before you can pay the premium.
                                  One-time step.
                                </p>
                                <button
                                  type="button"
                                  onClick={handleOptInUsdc}
                                  disabled={
                                    !connected ||
                                    !peraWallet ||
                                    isOptingInUsdc ||
                                    isSubmitting
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
                                >
                                  {isOptingInUsdc
                                    ? "Sign in wallet…"
                                    : !peraWallet
                                      ? "Loading…"
                                      : "Opt in to USDC"}
                                </button>
                              </div>
                            )}
                            {/* Form Fields */}
                            <motion.div
                              className="space-y-4"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 }}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Product Selection */}
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium text-white">
                                    Product *
                                  </label>
                                  <select
                                    value={productId}
                                    onChange={async (e) => {
                                      const v = e.target.value;
                                      setProductId(v);
                                      if (v) await showProductById(v);
                                    }}
                                    disabled={
                                      !connected ||
                                      isSubmitting ||
                                      isLoadingProducts
                                    }
                                    className="w-full px-4 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                                  >
                                    <option value="" disabled>
                                      {products.length
                                        ? "Select a product"
                                        : "Loading..."}
                                    </option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        Product {p.id}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* PNR Field */}
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2 }}
                                >
                                  <FormField
                                    label="PNR"
                                    required
                                    value={pnr}
                                    onChange={(e) => {
                                      setPnr(e.target.value.toUpperCase());
                                      if (e.target.value.length !== 6) {
                                        setPnrStatus(null);
                                        setFetchedPassenger(null);
                                      }
                                    }}
                                    placeholder="6-character code"
                                    disabled={!connected || isSubmitting}
                                    className={
                                      pnrStatus === "fetching" ? "relative" : ""
                                    }
                                    helperText={
                                      pnrStatus === "fetching" ? (
                                        <motion.span
                                          className="flex items-center gap-2 text-indigo-400"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                        >
                                          <motion.div
                                            className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{
                                              duration: 1,
                                              repeat: Infinity,
                                              ease: "linear",
                                            }}
                                          />
                                          Fetching PNR details...
                                        </motion.span>
                                      ) : pnrStatus === "found" ? (
                                        <motion.span
                                          className="flex items-center gap-2 text-emerald-400"
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 300,
                                          }}
                                        >
                                          <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                              delay: 0.2,
                                              type: "spring",
                                              stiffness: 400,
                                            }}
                                          >
                                            ✓
                                          </motion.div>
                                          PNR found, details auto-filled
                                        </motion.span>
                                      ) : pnrStatus === "not-found" ? (
                                        <span className="text-amber-400">
                                          PNR not found, enter manually
                                        </span>
                                      ) : (
                                        ("Enter your 6-character PNR for auto-fill" as React.ReactNode)
                                      )
                                    }
                                  />
                                </motion.div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <motion.div
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{
                                    opacity: 1,
                                    x: 0,
                                    scale:
                                      pnrStatus === "found" ? [1, 1.02, 1] : 1,
                                  }}
                                  transition={{
                                    delay: 0.25,
                                    scale:
                                      pnrStatus === "found"
                                        ? {
                                            duration: 0.6,
                                            times: [0, 0.5, 1],
                                          }
                                        : {},
                                  }}
                                >
                                  <FormField
                                    label="Flight Number"
                                    required
                                    value={flightNumber}
                                    onChange={(e) =>
                                      setFlightNumber(
                                        e.target.value.toUpperCase(),
                                      )
                                    }
                                    placeholder="e.g., AI202, AP986"
                                    disabled={
                                      !connected ||
                                      isSubmitting ||
                                      pnrStatus === "found"
                                    }
                                    showLockIcon={pnrStatus === "found"}
                                    className={
                                      pnrStatus === "found"
                                        ? "border-2 border-amber-500/50 shadow-[0_0_0_2px_rgba(251,191,36,0.2)]"
                                        : ""
                                    }
                                  />
                                </motion.div>

                                <motion.div
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{
                                    opacity: 1,
                                    x: 0,
                                    scale:
                                      pnrStatus === "found" ? [1, 1.02, 1] : 1,
                                  }}
                                  transition={{
                                    delay: 0.3,
                                    scale:
                                      pnrStatus === "found"
                                        ? {
                                            duration: 0.6,
                                            times: [0, 0.5, 1],
                                          }
                                        : {},
                                  }}
                                >
                                  <FormField
                                    label="Departure Date"
                                    required
                                    type="date"
                                    value={departureDate}
                                    onChange={(e) =>
                                      setDepartureDate(e.target.value)
                                    }
                                    disabled={
                                      !connected ||
                                      isSubmitting ||
                                      pnrStatus === "found"
                                    }
                                    showLockIcon={pnrStatus === "found"}
                                    className={
                                      pnrStatus === "found"
                                        ? "border-2 border-amber-500/50 shadow-[0_0_0_2px_rgba(251,191,36,0.2)]"
                                        : ""
                                    }
                                  />
                                </motion.div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <motion.div
                                  className="space-y-2"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale:
                                      pnrStatus === "found" ? [1, 1.02, 1] : 1,
                                  }}
                                  transition={{
                                    delay: 0.35,
                                    scale:
                                      pnrStatus === "found"
                                        ? {
                                            duration: 0.6,
                                            times: [0, 0.5, 1],
                                          }
                                        : {},
                                  }}
                                >
                                  <label className="block text-sm font-medium text-white">
                                    Departure Time *
                                  </label>
                                  <div className="relative">
                                    <select
                                      value={departureTime}
                                      onChange={(e) =>
                                        setDepartureTime(e.target.value)
                                      }
                                      disabled={
                                        !connected ||
                                        isSubmitting ||
                                        pnrStatus === "found"
                                      }
                                      className={`w-full px-4 py-2.5 bg-black border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${
                                        pnrStatus === "found"
                                          ? "border-2 border-amber-500/50 shadow-[0_0_0_2px_rgba(251,191,36,0.2)] pr-10 appearance-none"
                                          : "border border-gray-700 disabled:opacity-50"
                                      }`}
                                    >
                                      <option value="" disabled>
                                        Select time
                                      </option>
                                      {timeOptions.map((opt) => (
                                        <option
                                          key={opt.value}
                                          value={opt.value}
                                        >
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                    {pnrStatus === "found" && (
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              </div>
                            </motion.div>

                            {/* Passenger Info (if PNR found) */}
                            <AnimatePresence>
                              {fetchedPassenger && pnrStatus === "found" && (
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    height: 0,
                                    scale: 0.9,
                                    y: -20,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    height: "auto",
                                    scale: 1,
                                    y: 0,
                                  }}
                                  exit={{
                                    opacity: 0,
                                    height: 0,
                                    scale: 0.9,
                                    y: -20,
                                  }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                    mass: 0.8,
                                  }}
                                  className="rounded-lg border border-accent-success/20 bg-accent-success/5 p-4 relative overflow-hidden"
                                >
                                  {/* Animated background glow */}
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10"
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "100%" }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      repeatDelay: 1,
                                      ease: "easeInOut",
                                    }}
                                  />
                                  <motion.h4
                                    className="text-sm font-semibold text-white mb-3 flex items-center gap-2 relative z-10"
                                    initial={{ opacity: 0, x: -20, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{
                                      delay: 0.2,
                                      type: "spring",
                                      stiffness: 300,
                                      damping: 20,
                                    }}
                                  >
                                    <motion.div
                                      animate={{
                                        rotate: [0, 10, -10, 0],
                                        scale: [1, 1.1, 1],
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                      }}
                                      className="w-4 h-4 relative z-10"
                                    >
                                      <img
                                        src="/logo.svg"
                                        alt="ZYURA"
                                        className="w-full h-full object-contain"
                                      />
                                    </motion.div>
                                    <motion.span
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.3 }}
                                      className="relative z-10"
                                    >
                                      Passenger Details (Auto-filled)
                                    </motion.span>
                                  </motion.h4>
                                  <motion.div
                                    className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm relative z-10"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                  >
                                    <motion.div
                                      initial={{
                                        opacity: 0,
                                        x: -20,
                                        scale: 0.95,
                                      }}
                                      animate={{ opacity: 1, x: 0, scale: 1 }}
                                      transition={{
                                        delay: 0.4,
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20,
                                      }}
                                      className="relative"
                                    >
                                      <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-gray-400"
                                      >
                                        Name:
                                      </motion.span>{" "}
                                      <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                          delay: 0.6,
                                          type: "spring",
                                          stiffness: 400,
                                        }}
                                        className="text-white font-medium"
                                      >
                                        {fetchedPassenger.fullName ||
                                          fetchedPassenger.full_name ||
                                          "N/A"}
                                      </motion.span>
                                    </motion.div>
                                    {fetchedPassenger.email && (
                                      <motion.div
                                        initial={{
                                          opacity: 0,
                                          x: 20,
                                          scale: 0.95,
                                        }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        transition={{
                                          delay: 0.45,
                                          type: "spring",
                                          stiffness: 300,
                                          damping: 20,
                                        }}
                                        className="relative"
                                      >
                                        <motion.span
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ delay: 0.55 }}
                                          className="text-gray-400"
                                        >
                                          Email:
                                        </motion.span>{" "}
                                        <motion.span
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{
                                            delay: 0.65,
                                            type: "spring",
                                            stiffness: 400,
                                          }}
                                          className="text-white font-medium"
                                        >
                                          {fetchedPassenger.email}
                                        </motion.span>
                                      </motion.div>
                                    )}
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Already bought for this PNR - show policy and block purchase */}
                            <AnimatePresence>
                              {existingPolicyForPnr && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3"
                                >
                                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white">
                                      You already have a policy for this PNR
                                    </p>
                                    <p className="text-xs text-gray-300 mt-1">
                                      PNR:{" "}
                                      <span className="font-mono text-amber-200">
                                        {getPolicyPnr(existingPolicyForPnr) ||
                                          pnr.trim()}
                                      </span>
                                      {" · "}
                                      Policy #{existingPolicyForPnr.id}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openPolicyModal(existingPolicyForPnr)
                                      }
                                      className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                                    >
                                      View policy details →
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Submit Button */}
                            <motion.div
                              className="flex justify-end pt-4 border-t border-dark-border"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <motion.button
                                onClick={handleBuy}
                                disabled={
                                  !productId ||
                                  !flightNumber ||
                                  !departureDate ||
                                  !departureTime ||
                                  isSubmitting ||
                                  !connected ||
                                  !!existingPolicyForPnr
                                }
                                className={`px-8 py-3 rounded-lg font-medium transition-all shadow-lg flex items-center ${
                                  existingPolicyForPnr
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed shadow-none"
                                    : "bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-indigo-500/20"
                                }`}
                                whileHover={
                                  !isSubmitting &&
                                  !existingPolicyForPnr &&
                                  !(
                                    !productId ||
                                    !flightNumber ||
                                    !departureDate ||
                                    !departureTime ||
                                    !connected
                                  )
                                    ? {
                                        scale: 1.05,
                                        boxShadow:
                                          "0 10px 25px rgba(99, 102, 241, 0.4)",
                                      }
                                    : {}
                                }
                                whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                              >
                                {isSubmitting ? (
                                  <>
                                    <motion.div
                                      className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                                      animate={{ rotate: 360 }}
                                      transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        ease: "linear",
                                      }}
                                    />
                                    Processing...
                                  </>
                                ) : existingPolicyForPnr ? (
                                  "Already purchased"
                                ) : (
                                  <>
                                    <motion.span
                                      initial={{ opacity: 0, x: -5 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.1 }}
                                    >
                                      Purchase Insurance
                                    </motion.span>
                                  </>
                                )}
                              </motion.button>
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {!showBuyForm && (
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="text-gray-400 text-sm"
                        >
                          Protect your flight with instant, automated delay
                          insurance. Click "Buy Policy" to get started.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.section>

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
          },
        }}
      />
    </>
  );
}
