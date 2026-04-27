"use client";

import { useState } from "react";
import { toast } from "sonner";
import { readJsonResponse } from "@/components/dashboard/faucet/read-json-response";
import type { FaucetApiResponse } from "@/components/dashboard/faucet/types";
import { refreshBalanceSoon, type FaucetLastSend } from "./faucetPageShared";

type UseFaucetRequestActionsArgs = {
  address: string | null | undefined;
  displayBalance: number;
  fetchUsdcOptInStatus: () => Promise<unknown>;
  setLastSend: (value: FaucetLastSend | null) => void;
  setBalanceOptimistic: (value: number | null) => void;
};

export function useFaucetRequestActions({
  address,
  displayBalance,
  fetchUsdcOptInStatus,
  setLastSend,
  setBalanceOptimistic,
}: UseFaucetRequestActionsArgs) {
  const [isRequesting, setIsRequesting] = useState(false);

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
      void refreshBalanceSoon(fetchUsdcOptInStatus);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(message || "Faucet request failed");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleRecycleSuccess = async () => {
    setBalanceOptimistic(null);
    await fetchUsdcOptInStatus();
    await refreshBalanceSoon(fetchUsdcOptInStatus);
  };

  return { handleRecycleSuccess, handleRequest, isRequesting };
}
