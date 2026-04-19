"use client";

import { motion } from "framer-motion";
import { FaucetUsdcAssetCard } from "@/components/dashboard/faucet/faucet-usdc-asset-card";
import { FaucetWalletSnapshotCard } from "@/components/dashboard/faucet/faucet-wallet-snapshot-card";

type FaucetSidebarProps = {
  address: string;
  shortAddress: string;
  networkLabel: string;
  headroomUsdc: number;
  capFillPercent: number;
  maxNextPreset: number;
  usdcAsaId: string;
  assetExplorerUrl: string;
};

export function FaucetSidebar({
  address,
  shortAddress,
  networkLabel,
  headroomUsdc,
  capFillPercent,
  maxNextPreset,
  usdcAsaId,
  assetExplorerUrl,
}: FaucetSidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: 0.12,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      className="space-y-6 lg:col-span-1"
    >
      <FaucetWalletSnapshotCard
        address={address}
        shortAddress={shortAddress}
        networkLabel={networkLabel}
        headroomUsdc={headroomUsdc}
        capFillPercent={capFillPercent}
        maxNextPreset={maxNextPreset}
      />
      <FaucetUsdcAssetCard
        usdcAsaId={usdcAsaId}
        assetExplorerUrl={assetExplorerUrl}
      />
    </motion.aside>
  );
}
