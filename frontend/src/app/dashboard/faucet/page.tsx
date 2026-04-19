"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Navbar } from "@/components/ui/navbar";
import {
  FAUCET_PRESET_AMOUNTS,
  FAUCET_WALLET_CAP_USDC,
} from "@/components/dashboard/faucet/constants";
import { FaucetLastTransferBanner } from "@/components/dashboard/faucet/faucet-last-transfer-banner";
import { FaucetPageHeader } from "@/components/dashboard/faucet/faucet-page-header";
import { FaucetRequestCard } from "@/components/dashboard/faucet/faucet-request-card";
import { FaucetRecycleCard } from "@/components/dashboard/faucet/faucet-recycle-card";
import { FaucetUsdcAssetCard } from "@/components/dashboard/faucet/faucet-usdc-asset-card";
import { FaucetWalletSnapshotCard } from "@/components/dashboard/faucet/faucet-wallet-snapshot-card";
import { readJsonResponse } from "@/components/dashboard/faucet/read-json-response";
import type { FaucetApiResponse } from "@/components/dashboard/faucet/types";
import { useAlgorandWallet } from "@/contexts/WalletConnectionProvider";
import { useUsdcOptIn } from "@/lib/dashboard/use-usdc-opt-in";
import {
  getAssetOrAddressExplorerUrl,
  getPeraExplorerBase,
  getTxExplorerUrl,
} from "@/lib/dashboard/explorer-utils";

export default function FaucetPage() {
  const router = useRouter();
  const { address, isConnected, peraWallet } = useAlgorandWallet();
  const connected = isConnected;
  const { usdcBalance, fetchUsdcOptInStatus, isUsdcOptedIn } = useUsdcOptIn({
    connected,
    address,
    peraWallet,
  });
  const [isRequesting, setIsRequesting] = useState(false);
  const [lastSend, setLastSend] = useState<{
    txId: string;
    amount: number;
    sentAtIso: string;
  } | null>(null);
  /** Until algod/indexer reflects the transfer, show expected balance so headroom/presets stay accurate. */
  const [balanceOptimistic, setBalanceOptimistic] = useState<number | null>(
    null,
  );

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

  const isMainnet = process.env.NEXT_PUBLIC_ALGOD_NETWORK === "mainnet";
  const peraExplorerBase = useMemo(
    () => getPeraExplorerBase(isMainnet),
    [isMainnet],
  );
  const lastTxExplorerUrl = useMemo(
    () => getTxExplorerUrl(peraExplorerBase, lastSend?.txId),
    [peraExplorerBase, lastSend?.txId],
  );

  useEffect(() => {
    if (!connected || !address) return;
    fetchUsdcOptInStatus();
  }, [address, connected, fetchUsdcOptInStatus]);

  useEffect(() => {
    setLastSend(null);
    setBalanceOptimistic(null);
  }, [address]);

  const safeBalance = typeof usdcBalance === "number" ? usdcBalance : 0;
  const displayBalance =
    balanceOptimistic != null
      ? Math.max(safeBalance, balanceOptimistic)
      : safeBalance;

  useEffect(() => {
    if (balanceOptimistic == null) return;
    if (safeBalance >= balanceOptimistic - 1e-6) {
      setBalanceOptimistic(null);
    }
  }, [safeBalance, balanceOptimistic]);

  const allowedPresets = useMemo(
    () =>
      FAUCET_PRESET_AMOUNTS.filter(
        (amount) => displayBalance + amount <= FAUCET_WALLET_CAP_USDC,
      ),
    [displayBalance],
  );

  const networkLabel =
    process.env.NEXT_PUBLIC_ALGOD_NETWORK === "mainnet" ? "Mainnet" : "Testnet";

  const usdcAsaId = process.env.NEXT_PUBLIC_USDC_ASA_ID ?? "";

  const headroomUsdc = Math.max(0, FAUCET_WALLET_CAP_USDC - displayBalance);

  const maxNextPreset = useMemo(() => {
    if (allowedPresets.length === 0) return 0;
    return Math.max(...allowedPresets);
  }, [allowedPresets]);

  const assetExplorerUrl = useMemo(
    () =>
      usdcAsaId
        ? getAssetOrAddressExplorerUrl(peraExplorerBase, usdcAsaId, null)
        : "",
    [peraExplorerBase, usdcAsaId],
  );

  const shortAddress = address
    ? `${address.slice(0, 4)}…${address.slice(-4)}`
    : "";

  const capFillPercent = Math.min(
    100,
    Math.max(0, (displayBalance / FAUCET_WALLET_CAP_USDC) * 100),
  );

  if (!connected || !address) {
    return null;
  }

  const handleRequest = async (amount: number) => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    const balanceBefore = displayBalance;
    setIsRequesting(true);
    try {
      const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const res = await fetch("/api/zyura/faucet/usdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, amount, nonce }),
      });
      const payload = (await readJsonResponse<FaucetApiResponse>(res)) ?? {};
      if (!res.ok) {
        if (payload.code === "COOLDOWN_ACTIVE" && payload.retryAfterSec) {
          toast.error(`Please wait ${payload.retryAfterSec}s before retrying.`);
          return;
        }
        toast.error(
          payload.message ||
            `Faucet request failed (${res.status} ${res.statusText})`,
        );
        return;
      }
      if (payload.txId) {
        setLastSend({
          txId: payload.txId,
          amount,
          sentAtIso: new Date().toISOString(),
        });
      }
      setBalanceOptimistic(balanceBefore + amount);
      toast.success(`Sent ${amount} test USDC`);
      await fetchUsdcOptInStatus();
      void (async () => {
        for (let i = 0; i < 8; i += 1) {
          await new Promise<void>((r) => setTimeout(r, 700));
          await fetchUsdcOptInStatus();
        }
      })();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || "Faucet request failed");
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24 pb-16">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <FaucetPageHeader />

          <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <FaucetLastTransferBanner
                lastSend={lastSend}
                txExplorerUrl={lastTxExplorerUrl}
              />
              <FaucetRequestCard
                safeBalance={displayBalance}
                isRequesting={isRequesting}
                allowedPresets={allowedPresets}
                onRequest={handleRequest}
              />
              <FaucetRecycleCard
                explorerBaseUrl={peraExplorerBase}
                address={address}
                peraWallet={peraWallet}
                availableUsdc={displayBalance}
                isUsdcOptedIn={isUsdcOptedIn}
                onRecycleSuccess={async () => {
                  setBalanceOptimistic(null);
                  await fetchUsdcOptInStatus();
                  await (async () => {
                    for (let i = 0; i < 8; i += 1) {
                      await new Promise<void>((r) => setTimeout(r, 700));
                      await fetchUsdcOptInStatus();
                    }
                  })();
                }}
              />
            </div>

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
                allowedPresetCount={allowedPresets.length}
              />
              <FaucetUsdcAssetCard
                usdcAsaId={usdcAsaId}
                assetExplorerUrl={assetExplorerUrl}
              />
            </motion.aside>
          </div>
        </div>
      </main>
    </>
  );
}
