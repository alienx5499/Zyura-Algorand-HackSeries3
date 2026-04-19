"use client";

import { useEffect, useMemo, useState } from "react";
import { useUsdcOptIn } from "@/lib/dashboard/use-usdc-opt-in";
import {
  getAssetOrAddressExplorerUrl,
  getPeraExplorerBase,
  getTxExplorerUrl,
} from "@/lib/dashboard/explorer-utils";
import { type FaucetLastSend } from "./faucetPageShared";
import { useFaucetDerivedMetrics } from "./useFaucetDerivedMetrics";
import { useFaucetRequestActions } from "./useFaucetRequestActions";

type UseFaucetPageStateArgs = {
  connected: boolean;
  address: string | null | undefined;
  peraWallet: unknown;
};

export function useFaucetPageState({
  connected,
  address,
  peraWallet,
}: UseFaucetPageStateArgs) {
  const { usdcBalance, fetchUsdcOptInStatus, isUsdcOptedIn } = useUsdcOptIn({
    connected,
    address,
    peraWallet,
  });
  const [lastSend, setLastSend] = useState<FaucetLastSend | null>(null);
  const [balanceOptimistic, setBalanceOptimistic] = useState<number | null>(
    null,
  );

  const isMainnet = process.env.NEXT_PUBLIC_ALGOD_NETWORK === "mainnet";
  const networkLabel = isMainnet ? "Mainnet" : "Testnet";
  const usdcAsaId = process.env.NEXT_PUBLIC_USDC_ASA_ID ?? "";
  const peraExplorerBase = useMemo(
    () => getPeraExplorerBase(isMainnet),
    [isMainnet],
  );
  const lastTxExplorerUrl = useMemo(
    () => getTxExplorerUrl(peraExplorerBase, lastSend?.txId),
    [peraExplorerBase, lastSend?.txId],
  );
  const assetExplorerUrl = useMemo(
    () =>
      usdcAsaId
        ? getAssetOrAddressExplorerUrl(peraExplorerBase, usdcAsaId, null)
        : "",
    [peraExplorerBase, usdcAsaId],
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

  const {
    allowedPresets,
    capFillPercent,
    headroomUsdc,
    maxNextPreset,
    shortAddress,
  } = useFaucetDerivedMetrics({
    address,
    displayBalance,
  });
  const { handleRecycleSuccess, handleRequest, isRequesting } =
    useFaucetRequestActions({
      address,
      displayBalance,
      fetchUsdcOptInStatus,
      setLastSend,
      setBalanceOptimistic,
    });

  return {
    address,
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
  };
}
