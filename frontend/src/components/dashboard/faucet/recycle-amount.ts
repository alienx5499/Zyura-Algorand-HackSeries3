"use client";

const USDC_DECIMALS = 6;

export function parseAmountToMicro(
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

export function fractionToUsdcString(availableUsdc: number, fraction: number) {
  if (availableUsdc <= 0) return "";
  const v =
    Math.floor(availableUsdc * fraction * 10 ** USDC_DECIMALS) /
    10 ** USDC_DECIMALS;
  return v > 0 ? String(v) : "";
}
