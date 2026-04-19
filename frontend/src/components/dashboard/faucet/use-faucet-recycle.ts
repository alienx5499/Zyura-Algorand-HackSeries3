"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PeraWalletConnect } from "@perawallet/connect";
import { toast } from "sonner";
import { getTxExplorerUrl } from "@/lib/dashboard/explorer-utils";
import {
  fractionToUsdcString,
  parseAmountToMicro,
} from "@/components/dashboard/faucet/recycle-amount";
import { submitRecycleTransfer } from "@/components/dashboard/faucet/recycle-transfer";

type UseFaucetRecycleArgs = {
  explorerBaseUrl: string;
  address: string | null | undefined;
  peraWallet: PeraWalletConnect | null;
  availableUsdc: number;
  isUsdcOptedIn: boolean | null;
  onRecycleSuccess?: () => void | Promise<void>;
};

export function useFaucetRecycle({
  explorerBaseUrl,
  address,
  peraWallet,
  availableUsdc,
  isUsdcOptedIn,
  onRecycleSuccess,
}: UseFaucetRecycleArgs) {
  const [returnAddress, setReturnAddress] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recycleAnimation, setRecycleAnimation] = useState<object | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/zyura/faucet/info", {
          cache: "no-store",
        });
        const data = (await res.json()) as {
          returnAddress?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || !data.returnAddress) {
          setLoadError(data.error ?? "Could not load faucet address");
          return;
        }
        setReturnAddress(data.returnAddress);
      } catch {
        if (!cancelled) setLoadError("Could not load faucet address");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/recycling-loop-cycle.json", {
          cache: "force-cache",
        });
        if (!res.ok) return;
        const data = (await res.json()) as object;
        if (!cancelled) setRecycleAnimation(data);
      } catch {
        // Decorative-only animation; ignore failures.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const shortReturnAddress = useMemo(() => {
    if (!returnAddress) return "";
    if (returnAddress.length <= 12) return returnAddress;
    return `${returnAddress.slice(0, 4)}…${returnAddress.slice(-4)}`;
  }, [returnAddress]);

  const copyAddress = useCallback(async () => {
    if (!returnAddress) return;
    try {
      await navigator.clipboard.writeText(returnAddress);
      toast.success("Faucet address copied");
    } catch {
      toast.error("Could not copy address");
    }
  }, [returnAddress]);

  const parsedPreview = useMemo(() => {
    const p = parseAmountToMicro(amountInput, availableUsdc);
    return p.ok ? p.micro : null;
  }, [amountInput, availableUsdc]);

  const canSend =
    Boolean(returnAddress && address && peraWallet) &&
    isUsdcOptedIn === true &&
    availableUsdc > 0 &&
    !isSending &&
    parsedPreview !== null;

  const handleSend = useCallback(async () => {
    const from = address?.trim();
    if (!from || !peraWallet || !returnAddress) {
      toast.error("Wallet not ready");
      return;
    }
    const parsed = parseAmountToMicro(amountInput, availableUsdc);
    if (!parsed.ok) {
      toast.error(parsed.message);
      return;
    }
    setIsSending(true);
    try {
      toast.info("Approve the transfer in Pera Wallet");
      const txId = await submitRecycleTransfer({
        from,
        returnAddress,
        microAmount: parsed.micro,
        peraWallet,
      });
      const txUrl = getTxExplorerUrl(explorerBaseUrl, txId);
      toast.success("Sent USDC back to the faucet", {
        description: txUrl
          ? `Open explorer: ${txUrl}`
          : txId
            ? `Tx: ${txId.slice(0, 12)}…`
            : undefined,
      });
      setAmountInput("");
      await onRecycleSuccess?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const userCancelled =
        /cancel|reject|denied|closed|user/i.test(message) ||
        message.includes("No signed transaction");
      if (userCancelled) {
        toast.info("Transfer cancelled");
        return;
      }
      toast.error("Transfer failed", { description: message });
    } finally {
      setIsSending(false);
    }
  }, [
    address,
    amountInput,
    availableUsdc,
    explorerBaseUrl,
    onRecycleSuccess,
    peraWallet,
    returnAddress,
  ]);

  const setFraction = useCallback(
    (fraction: number) => {
      setAmountInput(fractionToUsdcString(availableUsdc, fraction));
    },
    [availableUsdc],
  );

  return {
    amountInput,
    canSend,
    copyAddress,
    handleSend,
    isSending,
    loadError,
    recycleAnimation,
    returnAddress,
    setAmountInput,
    setFraction,
    shortReturnAddress,
  };
}
