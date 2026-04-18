import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import algosdk from "algosdk";
import { toast } from "sonner";
import { fetchAlgorandSuggestedParams } from "@/lib/dashboard/algorand-utils";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const OPTIN_PENDING_KEY = "zyura_usdc_optin_pending";
const OPTIN_PENDING_MAX_MS = 5 * 60 * 1000;

function setPendingOptInSession(address: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    OPTIN_PENDING_KEY,
    JSON.stringify({ addr: address, t: Date.now() }),
  );
}

function clearPendingOptInSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(OPTIN_PENDING_KEY);
}

function readPendingOptInSession(): { addr: string; t: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(OPTIN_PENDING_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { addr?: string; t?: number };
    if (!data?.addr || typeof data.t !== "number") return null;
    return { addr: data.addr, t: data.t };
  } catch {
    return null;
  }
}

async function readJsonSafe<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

type UseUsdcOptInArgs = {
  connected: boolean;
  address?: string | null;
  peraWallet: any;
};

export function useUsdcOptIn({
  connected,
  address,
  peraWallet,
}: UseUsdcOptInArgs) {
  const [isOptingInUsdc, setIsOptingInUsdc] = useState(false);
  const [isUsdcOptedIn, setIsUsdcOptedIn] = useState<boolean | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

  const fetchUsdcOptInStatus = useCallback(
    async (preserveTrue = false) => {
      if (!address) {
        setIsUsdcOptedIn(null);
        setUsdcBalance(null);
        return null;
      }
      const usdcAsaId = Number(process.env.NEXT_PUBLIC_USDC_ASA_ID || "0");
      if (!usdcAsaId) {
        setIsUsdcOptedIn(null);
        setUsdcBalance(null);
        return null;
      }
      try {
        const acctRes = await fetch(
          `/api/algorand/account/${encodeURIComponent(address)}?t=${Date.now()}`,
          { cache: "no-store" },
        );
        if (!acctRes.ok) {
          setIsUsdcOptedIn(null);
          setUsdcBalance(null);
          return null;
        }
        const acctData = ((await readJsonSafe<{
          assetIds?: number[];
          assetHoldings?: Array<{ assetId: number; amount: number }>;
        }>(acctRes)) ?? {}) as {
          assetIds?: number[];
          assetHoldings?: Array<{ assetId: number; amount: number }>;
        };
        const optedIn = (acctData.assetIds ?? []).includes(usdcAsaId);
        if (!optedIn && preserveTrue && isUsdcOptedIn === true) {
          return true;
        }
        setIsUsdcOptedIn(optedIn);
        if (optedIn) {
          const usdcHolding = (acctData.assetHoldings ?? []).find(
            (a) => a.assetId === usdcAsaId,
          );
          setUsdcBalance(Number(usdcHolding?.amount ?? 0) / 1_000_000);
        } else {
          setUsdcBalance(0);
        }
        return optedIn;
      } catch {
        setIsUsdcOptedIn(null);
        setUsdcBalance(null);
        return null;
      }
    },
    [address, isUsdcOptedIn],
  );

  const fetchUsdcOptInStatusRef = useRef(fetchUsdcOptInStatus);
  fetchUsdcOptInStatusRef.current = fetchUsdcOptInStatus;

  /** If the page remounts after opening Pera (common on mobile), restore spinner and poll until opted in. */
  useEffect(() => {
    if (!address) return;
    const pending = readPendingOptInSession();
    if (!pending || pending.addr !== address) return;
    if (Date.now() - pending.t > OPTIN_PENDING_MAX_MS) {
      clearPendingOptInSession();
      return;
    }
    flushSync(() => {
      setIsOptingInUsdc(true);
    });
    let cancelled = false;
    const run = async () => {
      for (let i = 0; i < 40 && !cancelled; i += 1) {
        const ok = await fetchUsdcOptInStatusRef.current();
        if (ok === true) {
          clearPendingOptInSession();
          if (!cancelled) setIsOptingInUsdc(false);
          return;
        }
        await sleep(1500);
      }
      clearPendingOptInSession();
      if (!cancelled) setIsOptingInUsdc(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const handleOptInUsdc = useCallback(async () => {
    const currentAddress = address;
    if (!connected || !currentAddress || !peraWallet) {
      toast.error("Please connect your wallet first");
      return;
    }
    const usdcAsaId = process.env.NEXT_PUBLIC_USDC_ASA_ID || "755796399";
    if (!usdcAsaId || usdcAsaId === "0") {
      toast.error("USDC asset ID not configured");
      return;
    }
    setPendingOptInSession(currentAddress);
    flushSync(() => {
      setIsOptingInUsdc(true);
    });
    try {
      const { params: suggestedParams } = await fetchAlgorandSuggestedParams();
      const optInTxn =
        algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: currentAddress,
          receiver: currentAddress,
          amount: 0,
          assetIndex: Number(usdcAsaId),
          suggestedParams,
        });
      toast.info("Approve the transaction in Pera Wallet to opt in to USDC");
      const signed = await peraWallet.signTransaction([[{ txn: optInTxn }]]);
      const raw = Array.isArray(signed?.[0]) ? signed[0] : signed;
      if (!raw?.length) {
        toast.info("No signature received", {
          description:
            "The wallet did not return a signed transaction. Try again and approve in Pera, or dismiss this if you cancelled.",
        });
        return;
      }
      const first = raw[0];
      const blob = first instanceof Uint8Array ? first : new Uint8Array(0);
      if (blob.length === 0) {
        toast.info("Invalid signature from wallet", {
          description: "Please try opting in again.",
        });
        return;
      }
      const signedBase64 = Buffer.from(blob).toString("base64");
      const sendRes = await fetch("/api/algorand/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTx: signedBase64 }),
      });
      if (!sendRes.ok) {
        const err = await readJsonSafe<{ error?: string }>(sendRes);
        throw new Error(err?.error || "Failed to send opt-in transaction");
      }
      const sendPayload =
        (await readJsonSafe<{ txId?: string }>(sendRes)) ?? {};
      const txId = sendPayload.txId ?? "unknown";
      toast.success("Opt-in successful! You can now purchase with USDC.", {
        description: `Tx: ${String(txId).slice(0, 12)}...`,
      });
      setIsUsdcOptedIn(true);
      for (let i = 0; i < 6; i += 1) {
        const confirmed = await fetchUsdcOptInStatus(true);
        if (confirmed) break;
        await sleep(1200);
      }
    } catch (error: any) {
      const message = error?.message ?? String(error);
      const userCancelled =
        /cancel|reject|denied|closed|user/i.test(message) ||
        message.includes("No signed transaction");
      if (userCancelled) {
        toast.info("Opt-in cancelled", {
          description: "You can try again when ready.",
        });
        return;
      }
      console.error("Opt-in error:", error);
      toast.error("Opt-in failed", {
        description:
          message ||
          "Please try again. Make sure you're on Testnet and have enough ALGO for fees and minimum balance.",
      });
    } finally {
      clearPendingOptInSession();
      setIsOptingInUsdc(false);
    }
  }, [address, connected, peraWallet, fetchUsdcOptInStatus]);

  const canShowFaucet = Boolean(
    isUsdcOptedIn && typeof usdcBalance === "number" && usdcBalance < 190,
  );

  return {
    isOptingInUsdc,
    isUsdcOptedIn,
    usdcBalance,
    canShowFaucet,
    setIsUsdcOptedIn,
    fetchUsdcOptInStatus,
    handleOptInUsdc,
  };
}
