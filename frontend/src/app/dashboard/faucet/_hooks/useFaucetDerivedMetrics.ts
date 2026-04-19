"use client";

import { useMemo } from "react";
import {
  FAUCET_PRESET_AMOUNTS,
  FAUCET_WALLET_CAP_USDC,
} from "@/components/dashboard/faucet/constants";

type UseFaucetDerivedMetricsArgs = {
  address: string | null | undefined;
  displayBalance: number;
};

export function useFaucetDerivedMetrics({
  address,
  displayBalance,
}: UseFaucetDerivedMetricsArgs) {
  const allowedPresets = useMemo(
    () =>
      FAUCET_PRESET_AMOUNTS.filter(
        (amount) => displayBalance + amount <= FAUCET_WALLET_CAP_USDC,
      ),
    [displayBalance],
  );

  const headroomUsdc = Math.max(0, FAUCET_WALLET_CAP_USDC - displayBalance);
  const maxNextPreset = useMemo(
    () => (allowedPresets.length === 0 ? 0 : Math.max(...allowedPresets)),
    [allowedPresets],
  );

  const shortAddress = address
    ? `${address.slice(0, 4)}…${address.slice(-4)}`
    : "";
  const capFillPercent = Math.min(
    100,
    Math.max(0, (displayBalance / FAUCET_WALLET_CAP_USDC) * 100),
  );

  return {
    allowedPresets,
    capFillPercent,
    headroomUsdc,
    maxNextPreset,
    shortAddress,
  };
}
