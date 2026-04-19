import type { PurchaseChainConfig } from "./types";

export function getPurchaseChainConfig(): PurchaseChainConfig {
  const appId = BigInt(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "0");
  const usdcAsaId = BigInt(process.env.NEXT_PUBLIC_USDC_ASA_ID || "0");
  if (!appId || appId === BigInt(0)) {
    throw new Error("NEXT_PUBLIC_ZYURA_APP_ID not set");
  }
  if (!usdcAsaId || usdcAsaId === BigInt(0)) {
    throw new Error("NEXT_PUBLIC_USDC_ASA_ID not set");
  }
  return { appId, usdcAsaId };
}
