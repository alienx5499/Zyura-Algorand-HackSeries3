"use client";

import type { PeraWalletConnect } from "@perawallet/connect";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { Card } from "@/components/ui/card";
import { FaucetSectionShell } from "@/components/dashboard/faucet/section-shell";
import { AddressRow } from "@/components/dashboard/faucet/address-row";
import { AmountInput } from "@/components/dashboard/faucet/amount-input";
import { PresetButtons } from "@/components/dashboard/faucet/preset-buttons";
import { SendActions } from "@/components/dashboard/faucet/send-actions";
import { useFaucetRecycle } from "@/components/dashboard/faucet/use-faucet-recycle";

type FaucetRecycleCardProps = {
  explorerBaseUrl: string;
  address: string | null | undefined;
  peraWallet: PeraWalletConnect | null;
  availableUsdc: number;
  isUsdcOptedIn: boolean | null;
  onRecycleSuccess?: () => void | Promise<void>;
};

export function FaucetRecycleCard({
  explorerBaseUrl,
  address,
  peraWallet,
  availableUsdc,
  isUsdcOptedIn,
  onRecycleSuccess,
}: FaucetRecycleCardProps) {
  const {
    amountInput,
    canSend,
    copyAddress,
    handleSend,
    isSending,
    loadError,
    recycleAnimation,
    returnAddress,
    setAmountInput,
    setFraction,
    shortReturnAddress,
  } = useFaucetRecycle({
    explorerBaseUrl,
    address,
    peraWallet,
    availableUsdc,
    isUsdcOptedIn,
    onRecycleSuccess,
  });

  const controlsDisabled =
    availableUsdc <= 0 || isUsdcOptedIn !== true || isSending;
  const inputDisabled =
    isSending || isUsdcOptedIn !== true || availableUsdc <= 0;

  const setQuarter = () => {
    setFraction(0.25);
  };
  const setHalf = () => {
    setFraction(0.5);
  };
  const setMax = () => {
    setFraction(1);
  };

  if (loadError && !returnAddress) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.18,
        type: "spring",
        stiffness: 100,
        damping: 16,
      }}
      className="w-full"
    >
      <FaucetSectionShell>
        <Card className="relative overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black">
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-12">
            <div className="border-b border-gray-800/80 bg-gradient-to-br from-emerald-500/[0.12] via-transparent to-cyan-500/[0.06] p-6 md:p-7 lg:col-span-5 lg:border-b-0 lg:border-r lg:border-gray-800/80">
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="h-5 w-1 shrink-0 rounded-full bg-emerald-500" />
                Recycle test USDC
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Send unused test USDC back to the faucet so others can use it.
                You can transfer from this page (Pera will ask you to sign) or
                copy the address and send manually.
              </p>
              {recycleAnimation ? (
                <div className="mt-4 h-28 w-full rounded-lg border border-gray-800/80 bg-gray-950/60 p-1">
                  <Lottie
                    animationData={recycleAnimation}
                    loop={true}
                    autoplay={true}
                    className="h-full w-full"
                  />
                </div>
              ) : null}
            </div>

            <div className="flex flex-col justify-center gap-4 p-6 md:p-7 lg:col-span-7">
              {returnAddress ? (
                <>
                  <AddressRow
                    returnAddress={returnAddress}
                    shortReturnAddress={shortReturnAddress}
                    onCopy={copyAddress}
                  />

                  <div className="h-px bg-gray-800/80" />

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Send from this app
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          Available:{" "}
                          <span className="font-medium tabular-nums text-gray-200">
                            {availableUsdc.toFixed(2)} USDC
                          </span>
                          {isUsdcOptedIn === false ? (
                            <span className="ml-2 text-amber-400/90">
                              Opt in to USDC first.
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <PresetButtons
                        disabled={controlsDisabled}
                        onQuarter={setQuarter}
                        onHalf={setHalf}
                        onMax={setMax}
                      />
                    </div>

                    <AmountInput
                      value={amountInput}
                      disabled={inputDisabled}
                      onChange={setAmountInput}
                    />

                    <SendActions
                      canSend={canSend}
                      isSending={isSending}
                      onSend={handleSend}
                    />
                  </div>
                </>
              ) : (
                <div className="flex min-h-[7rem] items-center justify-center rounded-xl border border-dashed border-gray-800/80 bg-gray-950/40 px-4 py-6">
                  <p className="text-sm text-gray-500">
                    Loading faucet address…
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </FaucetSectionShell>
    </motion.section>
  );
}
