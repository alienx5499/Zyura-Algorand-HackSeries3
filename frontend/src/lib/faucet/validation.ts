const ALLOWED_AMOUNTS = new Set([10, 50, 100, 200]);

export type FaucetConfig = {
  usdcAsaId: number;
  accountMaxUsdc: number;
  balanceThresholdUsdc: number;
  maxIpDailyUsdc: number;
  maxGlobalDailyUsdc: number;
  lockTtlSec: number;
  cooldownSec: number;
  idempotencyTtlSec: number;
};

export function getFaucetConfig(): FaucetConfig {
  const usdcAsaId = Number(process.env.NEXT_PUBLIC_USDC_ASA_ID || "0");
  return {
    usdcAsaId,
    accountMaxUsdc: Number(process.env.FAUCET_ACCOUNT_MAX || "200"),
    balanceThresholdUsdc: Number(process.env.FAUCET_BALANCE_THRESHOLD || "190"),
    maxIpDailyUsdc: Number(process.env.FAUCET_MAX_IP_DAILY || "500"),
    maxGlobalDailyUsdc: Number(process.env.FAUCET_GLOBAL_DAILY_MAX || "5000"),
    lockTtlSec: Number(process.env.FAUCET_LOCK_TTL_SEC || "30"),
    cooldownSec: Number(process.env.FAUCET_COOLDOWN_SEC || "45"),
    idempotencyTtlSec: Number(process.env.FAUCET_IDEMPOTENCY_TTL_SEC || "60"),
  };
}

export function isAllowedFaucetAmount(value: number) {
  return ALLOWED_AMOUNTS.has(value);
}

export function toUsdcMicro(amountUsdc: number) {
  return Math.round(amountUsdc * 1_000_000);
}

export function fromUsdcMicro(amountMicro: number) {
  return amountMicro / 1_000_000;
}
