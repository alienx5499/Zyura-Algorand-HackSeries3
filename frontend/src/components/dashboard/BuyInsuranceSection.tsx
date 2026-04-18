"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BuyInsuranceHeader } from "@/components/dashboard/BuyInsuranceHeader";
import { BuyFormCollapsedHint } from "@/components/dashboard/buy-insurance/buy-form-collapsed-hint";
import { BuyFormFields } from "@/components/dashboard/buy-insurance/buy-form-fields";
import { ExistingPolicyPnrBanner } from "@/components/dashboard/buy-insurance/existing-policy-pnr-banner";
import { PassengerDetailsCard } from "@/components/dashboard/buy-insurance/passenger-details-card";
import { PurchaseSubmitButton } from "@/components/dashboard/buy-insurance/purchase-submit-button";
import type { PnrStatus } from "@/lib/dashboard/types";
import { UsdcOptInBanner } from "@/components/dashboard/buy-insurance/usdc-opt-in-banner";
import { useDepartureTimeOptions } from "@/components/dashboard/buy-insurance/use-buy-insurance-memos";
import { WalletNotConnectedBanner } from "@/components/dashboard/buy-insurance/wallet-not-connected-banner";
import { TestnetUsdcFaucetCallout } from "@/components/dashboard/buy-insurance/testnet-usdc-faucet-dialog";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Card, CardContent } from "@/components/ui/card";

export type BuyInsuranceSectionProps = {
  activeSection: string;
  showBuyForm: boolean;
  setShowBuyForm: React.Dispatch<React.SetStateAction<boolean>>;
  connected: boolean;
  isSubmitting: boolean;
  handleBuy: () => void | Promise<void>;
  productId: string;
  setProductId: (value: string) => void;
  products: { id: string }[];
  isLoadingProducts: boolean;
  showProductById: (id: string) => void | Promise<void>;
  pnr: string;
  setPnr: (value: string) => void;
  pnrStatus: PnrStatus;
  setPnrStatus: (value: PnrStatus) => void;
  flightNumber: string;
  setFlightNumber: (value: string) => void;
  departureDate: string;
  setDepartureDate: (value: string) => void;
  departureTime: string;
  setDepartureTime: (value: string) => void;
  fetchedPassenger: any | null;
  setFetchedPassenger: (value: any | null) => void;
  existingPolicyForPnr: any | null;
  openPolicyModal: (policy: any) => void;
  isUsdcOptedIn: boolean | null;
  usdcBalance: number | null;
  canShowFaucet: boolean;
  handleOptInUsdc: () => void | Promise<void>;
  isOptingInUsdc: boolean;
  peraWallet: unknown;
};

export function BuyInsuranceSection({
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
}: BuyInsuranceSectionProps) {
  const timeOptions = useDepartureTimeOptions();

  return (
    <motion.section
      id="buy"
      data-section="buy"
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: 1,
        y: 0,
        borderColor:
          activeSection === "buy" ? "rgba(99, 102, 241, 0.5)" : undefined,
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

          <WalletNotConnectedBanner connected={connected} />

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
                  {isUsdcOptedIn === false && (
                    <UsdcOptInBanner
                      connected={connected}
                      peraWallet={peraWallet}
                      isOptingInUsdc={isOptingInUsdc}
                      isSubmitting={isSubmitting}
                      handleOptInUsdc={handleOptInUsdc}
                    />
                  )}
                  {isUsdcOptedIn === true &&
                    canShowFaucet &&
                    typeof usdcBalance === "number" && (
                      <TestnetUsdcFaucetCallout usdcBalance={usdcBalance} />
                    )}

                  <BuyFormFields
                    connected={connected}
                    isSubmitting={isSubmitting}
                    productId={productId}
                    setProductId={setProductId}
                    products={products}
                    isLoadingProducts={isLoadingProducts}
                    showProductById={showProductById}
                    pnr={pnr}
                    setPnr={setPnr}
                    pnrStatus={pnrStatus}
                    setPnrStatus={setPnrStatus}
                    setFetchedPassenger={setFetchedPassenger}
                    flightNumber={flightNumber}
                    setFlightNumber={setFlightNumber}
                    departureDate={departureDate}
                    setDepartureDate={setDepartureDate}
                    departureTime={departureTime}
                    setDepartureTime={setDepartureTime}
                    timeOptions={timeOptions}
                  />

                  <PassengerDetailsCard
                    fetchedPassenger={fetchedPassenger}
                    pnrStatus={pnrStatus}
                  />

                  <ExistingPolicyPnrBanner
                    existingPolicyForPnr={existingPolicyForPnr}
                    pnr={pnr}
                    openPolicyModal={openPolicyModal}
                  />

                  <PurchaseSubmitButton
                    handleBuy={handleBuy}
                    productId={productId}
                    flightNumber={flightNumber}
                    departureDate={departureDate}
                    departureTime={departureTime}
                    isSubmitting={isSubmitting}
                    connected={connected}
                    existingPolicyForPnr={existingPolicyForPnr}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <BuyFormCollapsedHint showBuyForm={showBuyForm} />
        </CardContent>
      </Card>
    </motion.section>
  );
}
