"use client";

import { motion } from "framer-motion";
import { Coins } from "lucide-react";

type UsdcOptInBannerProps = {
  connected: boolean;
  peraWallet: unknown;
  isOptingInUsdc: boolean;
  isSubmitting: boolean;
  handleOptInUsdc: () => void | Promise<void>;
};

export function UsdcOptInBanner({
  connected,
  peraWallet,
  isOptingInUsdc,
  isSubmitting,
  handleOptInUsdc,
}: UsdcOptInBannerProps) {
  return (
    <div className="rounded-xl border border-amber-500/35 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-black p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg border border-amber-400/35 bg-amber-500/15 p-2">
          <Coins className="h-4 w-4 text-amber-200" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-100">
            First time? Your wallet must opt in to USDC (Testnet) before you can
            pay the premium. One-time step.
          </p>
          <p className="text-xs text-amber-200/80">
            After opt-in, you can purchase policies normally from this
            dashboard.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <motion.button
          type="button"
          onClick={handleOptInUsdc}
          disabled={!connected || !peraWallet || isOptingInUsdc || isSubmitting}
          className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-100 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center cursor-pointer"
          whileTap={!isOptingInUsdc && !isSubmitting ? { scale: 0.98 } : {}}
        >
          {isOptingInUsdc ? (
            <>
              <motion.span
                className="inline-block w-3.5 h-3.5 mr-2 border-2 border-amber-100 border-t-transparent rounded-full shrink-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Processing...
            </>
          ) : !peraWallet ? (
            "Loading..."
          ) : (
            "Opt in to USDC"
          )}
        </motion.button>
      </div>
    </div>
  );
}
