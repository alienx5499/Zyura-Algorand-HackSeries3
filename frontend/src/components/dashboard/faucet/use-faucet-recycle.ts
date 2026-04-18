"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PeraWalletConnect } from "@perawallet/connect";
import algosdk from "algosdk";
import { toast } from "sonner";
import { fetchAlgorandSuggestedParams } from "@/lib/dashboard/algorand-utils";
import { getTxExplorerUrl } from "@/lib/dashboard/explorer-utils";

const USDC_DECIMALS = 6;

function parseAmountToMicro(
  raw: string,
  maxUsdc: number,
): { ok: true; micro: number } | { ok: false; message: string } {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) {
    return { ok: false, message: "Enter an amount" };
  }
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, message: "Enter a valid amount greater than zero" };
  }
  if (n > maxUsdc + 1e-9) {
    return {
      ok: false,
      message: `Amount cannot exceed ${maxUsdc.toFixed(2)} USDC`,
    };
  }
  const micro = Math.round(n * 10 ** USDC_DECIMALS);
  const maxMicro = Math.floor(maxUsdc * 10 ** USDC_DECIMALS + 1e-9);
  if (micro < 1) {
    return { ok: false, message: "Amount is too small" };
  }
  if (micro > maxMicro) {
    return {
      ok: false,
      message: `Amount cannot exceed ${maxUsdc.toFixed(2)} USDC`,
    };
  }
  return { ok: true, micro };
}

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
    const usdcAsaId = process.env.NEXT_PUBLIC_USDC_ASA_ID;
    if (!usdcAsaId || usdcAsaId === "0") {
      toast.error("USDC asset ID not configured");
      return;
    }
    const parsed = parseAmountToMicro(amountInput, availableUsdc);
    if (!parsed.ok) {
      toast.error(parsed.message);
      return;
    }
    setIsSending(true);
    try {
      const { params: suggestedParams } = await fetchAlgorandSuggestedParams();
      const xferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(
        {
          sender: from,
          receiver: returnAddress,
          amount: BigInt(parsed.micro),
          assetIndex: BigInt(usdcAsaId),
          suggestedParams,
        },
      );
      toast.info("Approve the transfer in Pera Wallet");
      const signed = await peraWallet.signTransaction([[{ txn: xferTxn }]]);
      const raw = Array.isArray(signed[0])
        ? (signed[0] as Uint8Array[])
        : signed;
      if (!raw?.length) {
        toast.info("No signature received", {
          description: "Approve in Pera to send, or dismiss if you cancelled.",
        });
        return;
      }
      const first = raw[0];
      const blob = first instanceof Uint8Array ? first : new Uint8Array(0);
      if (blob.length === 0) {
        toast.error("Invalid signature from wallet");
        return;
      }
      const signedBase64 = Buffer.from(blob).toString("base64");
      const sendRes = await fetch("/api/algorand/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTx: signedBase64 }),
      });
      const sendPayload = (await sendRes.json().catch(() => ({}))) as {
        txId?: string;
        error?: string;
      };
      if (!sendRes.ok) {
        throw new Error(sendPayload.error || "Failed to submit transaction");
      }
      const txId = sendPayload.txId ?? "";
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
      if (availableUsdc <= 0) return;
      const v =
        Math.floor(availableUsdc * fraction * 10 ** USDC_DECIMALS) /
        10 ** USDC_DECIMALS;
      setAmountInput(v > 0 ? String(v) : "");
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
