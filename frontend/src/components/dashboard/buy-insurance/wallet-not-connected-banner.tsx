"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

export function WalletNotConnectedBanner({
  connected,
}: {
  connected: boolean;
}) {
  return (
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
              Connect your wallet to purchase insurance policies.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
