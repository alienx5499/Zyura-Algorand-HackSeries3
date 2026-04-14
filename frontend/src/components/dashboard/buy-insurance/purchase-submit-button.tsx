"use client";

import { motion } from "framer-motion";

type PurchaseSubmitButtonProps = {
  handleBuy: () => void | Promise<void>;
  productId: string;
  flightNumber: string;
  departureDate: string;
  departureTime: string;
  isSubmitting: boolean;
  connected: boolean;
  existingPolicyForPnr: any | null;
};

export function PurchaseSubmitButton({
  handleBuy,
  productId,
  flightNumber,
  departureDate,
  departureTime,
  isSubmitting,
  connected,
  existingPolicyForPnr,
}: PurchaseSubmitButtonProps) {
  return (
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
                boxShadow: "0 10px 25px rgba(99, 102, 241, 0.4)",
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
  );
}
