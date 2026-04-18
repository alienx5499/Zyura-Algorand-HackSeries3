"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PeraWalletConnect } from "@perawallet/connect";
import { Copy } from "lucide-react";
import { motion } from "framer-motion";
import algosdk from "algosdk";
import Lottie from "lottie-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FaucetSectionShell } from "@/components/dashboard/faucet/section-shell";
import { fetchAlgorandSuggestedParams } from "@/lib/dashboard/algorand-utils";
import { getTxExplorerUrl } from "@/lib/dashboard/explorer-utils";

type FaucetRecycleCardProps = {
  explorerBaseUrl: string;
  address: string | null | undefined;
  peraWallet: PeraWalletConnect | null;
  availableUsdc: number;
  isUsdcOptedIn: boolean | null;
  onRecycleSuccess?: () => void | Promise<void>;
};

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

export function FaucetRecycleCard({
  explorerBaseUrl,
  address,
  peraWallet,
  availableUsdc,
  isUsdcOptedIn,
  onRecycleSuccess,
}: FaucetRecycleCardProps) {
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

  if (loadError && !returnAddress) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.18,
        type: "spring",
        stiffness: 100,
        damping: 16,
      }}
      className="w-full"
    >
      <FaucetSectionShell>
        <Card className="relative overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black">
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-12">
            <div className="border-b border-gray-800/80 bg-gradient-to-br from-emerald-500/[0.12] via-transparent to-cyan-500/[0.06] p-6 md:p-7 lg:col-span-5 lg:border-b-0 lg:border-r lg:border-gray-800/80">
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                <span className="h-5 w-1 shrink-0 rounded-full bg-emerald-500" />
                Recycle test USDC
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">
                Send unused test USDC back to the faucet so others can use it.
                You can transfer from this page (Pera will ask you to sign) or
                copy the address and send manually.
              </p>
              {recycleAnimation ? (
                <div className="mt-4 h-28 w-full rounded-lg border border-gray-800/80 bg-gray-950/60 p-1">
                  <Lottie
                    animationData={recycleAnimation}
                    loop={true}
                    autoplay={true}
                    className="h-full w-full"
                  />
                </div>
              ) : null}
            </div>

            <div className="flex flex-col justify-center gap-4 p-6 md:p-7 lg:col-span-7">
              {returnAddress ? (
                <>
                  <div className="rounded-xl border border-gray-800/90 bg-gray-950/70 p-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Return address
                    </p>
                    <div className="flex min-w-0 items-center gap-2">
                      <p
                        className="min-w-0 flex-1 truncate font-mono text-sm text-gray-200"
                        title={returnAddress}
                      >
                        {shortReturnAddress}
                      </p>
                      <button
                        type="button"
                        onClick={() => void copyAddress()}
                        aria-label="Copy full address"
                        className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-700/90 bg-gray-950/80 p-2 text-gray-400 transition-colors duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white"
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-gray-800/80" />

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Send from this app
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          Available:{" "}
                          <span className="font-medium tabular-nums text-gray-200">
                            {availableUsdc.toFixed(2)} USDC
                          </span>
                          {isUsdcOptedIn === false ? (
                            <span className="ml-2 text-amber-400/90">
                              Opt in to USDC first.
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:max-w-xs sm:shrink-0">
                        <button
                          type="button"
                          disabled={
                            availableUsdc <= 0 ||
                            isUsdcOptedIn !== true ||
                            isSending
                          }
                          onClick={() => setFraction(0.25)}
                          className="cursor-pointer rounded-lg border border-gray-700/90 bg-gray-950/80 px-3 py-3 text-sm font-medium text-white transition-colors duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          25%
                        </button>
                        <button
                          type="button"
                          disabled={
                            availableUsdc <= 0 ||
                            isUsdcOptedIn !== true ||
                            isSending
                          }
                          onClick={() => setFraction(0.5)}
                          className="cursor-pointer rounded-lg border border-gray-700/90 bg-gray-950/80 px-3 py-3 text-sm font-medium text-white transition-colors duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          disabled={
                            availableUsdc <= 0 ||
                            isUsdcOptedIn !== true ||
                            isSending
                          }
                          onClick={() => setFraction(1)}
                          className="cursor-pointer rounded-lg border border-gray-700/90 bg-gray-950/80 px-3 py-3 text-sm font-medium text-white transition-colors duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          Max
                        </button>
                      </div>
                    </div>

                    <label className="sr-only" htmlFor="recycle-amount">
                      Amount in USDC to send to faucet
                    </label>
                    <Input
                      id="recycle-amount"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.00"
                      value={amountInput}
                      disabled={
                        isSending ||
                        isUsdcOptedIn !== true ||
                        availableUsdc <= 0
                      }
                      onChange={(e) => setAmountInput(e.target.value)}
                      className="h-11 border-gray-700/90 bg-gray-950/80 text-white placeholder:text-gray-600"
                    />

                    <button
                      type="button"
                      disabled={!canSend}
                      onClick={() => void handleSend()}
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-indigo-500/45 bg-indigo-500/15 px-3 py-2.5 text-sm font-medium text-indigo-100 transition-colors duration-200 hover:border-indigo-400/55 hover:bg-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {isSending
                        ? "Waiting for Pera…"
                        : "Sign & send to faucet"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex min-h-[7rem] items-center justify-center rounded-xl border border-dashed border-gray-800/80 bg-gray-950/40 px-4 py-6">
                  <p className="text-sm text-gray-500">
                    Loading faucet address…
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </FaucetSectionShell>
    </motion.section>
  );
}
