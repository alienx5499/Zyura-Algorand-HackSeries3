"use client";

export type FaucetLastSend = {
  txId: string;
  amount: number;
  sentAtIso: string;
};

const BALANCE_REFRESH_RETRIES = 8;
const BALANCE_REFRESH_INTERVAL_MS = 700;

export async function refreshBalanceSoon(
  fetchUsdcOptInStatus: () => Promise<unknown>,
) {
  for (let i = 0; i < BALANCE_REFRESH_RETRIES; i += 1) {
    await new Promise<void>((resolve) =>
      setTimeout(resolve, BALANCE_REFRESH_INTERVAL_MS),
    );
    await fetchUsdcOptInStatus();
  }
}
