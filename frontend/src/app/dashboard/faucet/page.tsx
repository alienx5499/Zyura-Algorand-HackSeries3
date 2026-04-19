"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/ui/navbar";
import { FaucetPageHeader } from "@/components/dashboard/faucet/faucet-page-header";
import { useAlgorandWallet } from "@/contexts/WalletConnectionProvider";
import { FaucetMainColumn } from "@/app/dashboard/faucet/_components/FaucetMainColumn";
import { FaucetSidebar } from "@/app/dashboard/faucet/_components/FaucetSidebar";
import { useFaucetPageState } from "@/app/dashboard/faucet/_hooks/useFaucetPageState";

export default function FaucetPage() {
  const router = useRouter();
  const { address, isConnected, peraWallet } = useAlgorandWallet();
  const connected = isConnected;

  const {
    allowedPresets,
    assetExplorerUrl,
    capFillPercent,
    displayBalance,
    handleRecycleSuccess,
    handleRequest,
    headroomUsdc,
    isRequesting,
    isUsdcOptedIn,
    lastSend,
    lastTxExplorerUrl,
    maxNextPreset,
    networkLabel,
    peraExplorerBase,
    shortAddress,
    usdcAsaId,
  } = useFaucetPageState({ connected, address, peraWallet });
  const [walletInitComplete, setWalletInitComplete] = useState(false);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setWalletInitComplete(true);
    }, 1500);
    return () => clearTimeout(initTimer);
  }, []);

  useEffect(() => {
    if (walletInitComplete && (!connected || !address)) {
      router.push("/");
    }
  }, [walletInitComplete, connected, address, router]);

  if (!connected || !address) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24 pb-16">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <FaucetPageHeader />

          <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
            <FaucetMainColumn
              address={address}
              displayBalance={displayBalance}
              isRequesting={isRequesting}
              allowedPresets={allowedPresets}
              lastSend={lastSend}
              lastTxExplorerUrl={lastTxExplorerUrl}
              peraExplorerBase={peraExplorerBase}
              peraWallet={peraWallet}
              isUsdcOptedIn={isUsdcOptedIn}
              onRequest={handleRequest}
              onRecycleSuccess={handleRecycleSuccess}
            />
            <FaucetSidebar
              address={address}
              shortAddress={shortAddress}
              networkLabel={networkLabel}
              headroomUsdc={headroomUsdc}
              capFillPercent={capFillPercent}
              maxNextPreset={maxNextPreset}
              usdcAsaId={usdcAsaId}
              assetExplorerUrl={assetExplorerUrl}
            />
          </div>
        </div>
      </main>
    </>
  );
}
