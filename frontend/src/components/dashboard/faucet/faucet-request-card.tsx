"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import {
  FAUCET_PRESET_AMOUNTS,
  FAUCET_WALLET_CAP_USDC,
} from "@/components/dashboard/faucet/constants";
import { FaucetSectionShell } from "@/components/dashboard/faucet/section-shell";

type FaucetRequestCardProps = {
  safeBalance: number;
  isRequesting: boolean;
  allowedPresets: readonly number[];
  onRequest: (amount: number) => void;
};

export function FaucetRequestCard({
  safeBalance,
  isRequesting,
  allowedPresets,
  onRequest,
}: FaucetRequestCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.08,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
    >
      <FaucetSectionShell>
        <Card className="relative overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black">
          <div className="border-b border-gray-800/80 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/5 px-6 py-5 md:px-8 md:py-6">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
              <span className="h-5 w-1 shrink-0 rounded-full bg-cyan-500" />
              Request test USDC
            </h2>
            <p className="text-sm tabular-nums text-gray-400">
              Balance{" "}
              <span className="font-medium text-gray-200">
                {safeBalance.toFixed(2)}
              </span>{" "}
              USDC
            </p>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-gray-500">
              Presets credit your wallet on testnet. Disabled buttons would
              exceed the {FAUCET_WALLET_CAP_USDC} USDC testing cap. Cooldowns
              and daily limits apply on the server.
            </p>
          </div>
          <CardContent className="space-y-4 p-6 md:p-8">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FAUCET_PRESET_AMOUNTS.map((amount) => {
                const disabled =
                  isRequesting || !allowedPresets.includes(amount);
                return (
                  <button
                    key={amount}
                    type="button"
                    disabled={disabled}
                    onClick={() => onRequest(amount)}
                    className="cursor-pointer rounded-lg border border-gray-700/90 bg-gray-950/80 px-3 py-3 text-sm font-medium text-white transition-colors duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {amount} USDC
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </FaucetSectionShell>
    </motion.section>
  );
}
