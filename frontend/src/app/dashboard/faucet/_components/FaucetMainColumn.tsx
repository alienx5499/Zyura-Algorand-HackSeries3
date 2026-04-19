"use client";

import type { PeraWalletConnect } from "@perawallet/connect";
import { FaucetLastTransferBanner } from "@/components/dashboard/faucet/faucet-last-transfer-banner";
import { FaucetRequestCard } from "@/components/dashboard/faucet/faucet-request-card";
import { FaucetRecycleCard } from "@/components/dashboard/faucet/faucet-recycle-card";

type FaucetMainColumnProps = {
  address: string;
  displayBalance: number;
  isRequesting: boolean;
  allowedPresets: number[];
  lastSend: { txId: string; amount: number; sentAtIso: string } | null;
  lastTxExplorerUrl: string;
  peraExplorerBase: string;
  peraWallet: PeraWalletConnect | null;
  isUsdcOptedIn: boolean | null;
  onRequest: (amount: number) => Promise<void>;
  onRecycleSuccess: () => Promise<void>;
};

export function FaucetMainColumn({
  address,
  displayBalance,
  isRequesting,
  allowedPresets,
  lastSend,
  lastTxExplorerUrl,
  peraExplorerBase,
  peraWallet,
  isUsdcOptedIn,
  onRequest,
  onRecycleSuccess,
}: FaucetMainColumnProps) {
  return (
    <div className="space-y-6 lg:col-span-2">
      <FaucetLastTransferBanner
        lastSend={lastSend}
        txExplorerUrl={lastTxExplorerUrl}
      />
      <FaucetRequestCard
        safeBalance={displayBalance}
        isRequesting={isRequesting}
        allowedPresets={allowedPresets}
        onRequest={onRequest}
      />
      <FaucetRecycleCard
        explorerBaseUrl={peraExplorerBase}
        address={address}
        peraWallet={peraWallet}
        availableUsdc={displayBalance}
        isUsdcOptedIn={isUsdcOptedIn}
        onRecycleSuccess={onRecycleSuccess}
      />
    </div>
  );
}
