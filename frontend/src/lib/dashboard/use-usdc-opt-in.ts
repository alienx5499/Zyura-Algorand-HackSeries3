import { useCallback, useState } from "react";
import algosdk from "algosdk";
import { toast } from "sonner";
import { fetchAlgorandSuggestedParams } from "@/lib/dashboard/algorand-utils";

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

  const fetchUsdcOptInStatus = useCallback(async () => {
    if (!address) {
      setIsUsdcOptedIn(null);
      return;
    }
    const usdcAsaId = Number(process.env.NEXT_PUBLIC_USDC_ASA_ID || "0");
    if (!usdcAsaId) {
      setIsUsdcOptedIn(null);
      return;
    }
    try {
      const acctRes = await fetch(
        `/api/algorand/account/${encodeURIComponent(address)}`,
      );
      if (!acctRes.ok) {
        setIsUsdcOptedIn(null);
        return;
      }
      const acctData = (await acctRes.json()) as { assetIds?: number[] };
      setIsUsdcOptedIn((acctData.assetIds ?? []).includes(usdcAsaId));
    } catch {
      setIsUsdcOptedIn(null);
    }
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
    setIsOptingInUsdc(true);
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
      if (!raw?.length) throw new Error("No signed transaction returned");
      const first = raw[0];
      const blob = first instanceof Uint8Array ? first : new Uint8Array(0);
      if (blob.length === 0) throw new Error("Invalid signed transaction");
      const signedBase64 = Buffer.from(blob).toString("base64");
      const sendRes = await fetch("/api/algorand/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTx: signedBase64 }),
      });
      if (!sendRes.ok) {
        const err = await sendRes.json();
        throw new Error(err.error || "Failed to send opt-in transaction");
      }
      const { txId } = await sendRes.json();
      toast.success("Opt-in successful! You can now purchase with USDC.", {
        description: `Tx: ${String(txId).slice(0, 12)}...`,
      });
      setIsUsdcOptedIn(true);
    } catch (error: any) {
      console.error("Opt-in error:", error);
      toast.error("Opt-in failed", {
        description:
          error?.message ||
          "Please try again. Make sure you're on Testnet and have a small amount of ALGO for fees.",
      });
    } finally {
      setIsOptingInUsdc(false);
    }
  }, [address, connected, peraWallet]);

  return {
    isOptingInUsdc,
    isUsdcOptedIn,
    setIsUsdcOptedIn,
    fetchUsdcOptInStatus,
    handleOptInUsdc,
  };
}
