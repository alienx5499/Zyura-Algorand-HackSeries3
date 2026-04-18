export function mapPurchaseError(error: any, currentAddress: string): string {
  const msg = error?.message ?? "";
  const isUsdcOptIn =
    /asset\s+(\d+)\s+missing\s+from/i.test(msg) || msg.includes("missing from");
  const isMinBalance =
    /balance\s+\d+\s+below\s+min\s+\d+/i.test(msg) ||
    /below min.*\(0 assets\)/i.test(msg);
  const minBalanceMatch = msg.match(/balance\s+(\d+)\s+below\s+min\s+(\d+)/i);
  const shortAccountMatch = msg.match(/account\s+([A-Z2-7]{58})\s+balance/);
  const usdcAssetId = process.env.NEXT_PUBLIC_USDC_ASA_ID || "755796399";

  if (isUsdcOptIn) {
    return `Your wallet is not opted in to USDC (Testnet). In Pera Wallet, add asset ${usdcAssetId} (USDC) and try again.`;
  }

  if (isMinBalance) {
    const shortAddr = shortAccountMatch ? shortAccountMatch[1] : null;
    const isYourWallet = shortAddr && shortAddr === currentAddress;
    if (isYourWallet) {
      if (minBalanceMatch) {
        const balanceMicro = Number(minBalanceMatch[1]);
        const minMicro = Number(minBalanceMatch[2]);
        if (Number.isFinite(balanceMicro) && Number.isFinite(minMicro)) {
          const shortfallMicro = Math.max(minMicro - balanceMicro, 0);
          const shortfallAlgo = shortfallMicro / 1_000_000;
          return `Your wallet has ALGO, but it is locked as network minimum balance (spendable is near 0). Add at least ${shortfallAlgo.toFixed(3)} ALGO and try again.`;
        }
      }
      return "Your wallet has ALGO, but it is locked as network minimum balance (spendable is near 0). Add a little more ALGO and try again.";
    }
    if (shortAddr) {
      console.warn(
        "[ZYURA] Account with low ALGO (fund with >=0.2 ALGO):",
        shortAddr,
      );
    }
    return shortAddr
      ? "The vault has insufficient ALGO. Send at least 0.2 ALGO to the vault address (see console for full address)."
      : "An account in this transaction (often the vault) has insufficient ALGO. Fund it with at least 0.2 ALGO and try again.";
  }

  if (
    /shorten|96 character/i.test(msg) ||
    msg.includes("policy link for the blockchain")
  ) {
    return "We couldn't prepare the short link for your policy on the blockchain. Try again in a moment, turn off VPN, or switch networks.";
  }

  if (/request pending|another request.*in progress/i.test(msg)) {
    return "Pera already had a signing request open. Fully close the Pera app (or disconnect on this site), wait a few seconds, reconnect, and try again - approve one prompt at a time.";
  }

  return msg || "Please try again.";
}
