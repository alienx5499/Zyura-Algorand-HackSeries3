"use client";

import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { PurchaseConfirmationCard } from "@/components/dashboard/PurchaseConfirmationCard";
import type { LastPurchaseTx } from "@/lib/dashboard/types";

type DashboardPurchaseBannerProps = {
  lastPurchaseTx: LastPurchaseTx | null;
  txExplorerUrl: string;
  groupExplorerUrl: string;
};

export function DashboardPurchaseBanner({
  lastPurchaseTx,
  txExplorerUrl,
  groupExplorerUrl,
}: DashboardPurchaseBannerProps) {
  return (
    <AnimatePresence>
      {lastPurchaseTx && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="relative mb-6 rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-3xl md:p-3"
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
                await navigator.clipboard.writeText(lastPurchaseTx.groupId);
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
  );
}
