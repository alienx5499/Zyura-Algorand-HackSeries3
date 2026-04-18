"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { getPolicyPnr } from "@/components/dashboard/buy-insurance/get-policy-pnr";

type ExistingPolicyPnrBannerProps = {
  existingPolicyForPnr: any | null;
  pnr: string;
  openPolicyModal: (policy: any) => void;
};

export function ExistingPolicyPnrBanner({
  existingPolicyForPnr,
  pnr,
  openPolicyModal,
}: ExistingPolicyPnrBannerProps) {
  return (
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
              {existingPolicyForPnr.__blockedOtherWallet
                ? "This PNR is already insured under another wallet"
                : "This PNR is already purchased"}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              <>
                PNR:{" "}
                <span className="font-mono text-amber-200">
                  {getPolicyPnr(existingPolicyForPnr) || pnr.trim()}
                </span>
                {existingPolicyForPnr.id &&
                  String(existingPolicyForPnr.id) !== "0" && (
                    <>
                      {" · "}
                      Policy #{existingPolicyForPnr.id}
                    </>
                  )}
              </>
            </p>
            {existingPolicyForPnr.__blockedOtherWallet &&
              existingPolicyForPnr.linkedWallet && (
                <p className="text-xs text-gray-300 mt-1">
                  Insured wallet:{" "}
                  <span className="font-mono text-amber-200">
                    {existingPolicyForPnr.linkedWallet}
                  </span>
                </p>
              )}
            {!existingPolicyForPnr.__blockedOtherWallet && (
              <p className="text-xs text-gray-300 mt-1">
                <>
                  Purchase found for this PNR
                  {existingPolicyForPnr.id &&
                  String(existingPolicyForPnr.id) !== "0"
                    ? ` (Policy #${existingPolicyForPnr.id})`
                    : ""}
                  .
                </>
              </p>
            )}
            {!existingPolicyForPnr.__blockedOtherWallet && (
              <button
                type="button"
                onClick={() => openPolicyModal(existingPolicyForPnr)}
                className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                View policy details →
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
