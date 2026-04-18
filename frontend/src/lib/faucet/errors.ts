export type FaucetErrorCode =
  | "BAD_REQUEST"
  | "INVALID_ADDRESS"
  | "INVALID_AMOUNT"
  | "NOT_OPTED_IN"
  | "BALANCE_TOO_HIGH"
  | "ACCOUNT_CAP_EXCEEDED"
  | "IP_DAILY_LIMIT"
  | "GLOBAL_DAILY_LIMIT"
  | "WALLET_LOCKED"
  | "COOLDOWN_ACTIVE"
  | "DUPLICATE_REQUEST"
  | "FAUCET_NOT_CONFIGURED"
  | "FAUCET_TX_FAILED"
  | "INTERNAL_ERROR";

export type FaucetErrorPayload = {
  code: FaucetErrorCode;
  message: string;
  retryAfterSec?: number;
};

export function faucetError(
  code: FaucetErrorCode,
  message: string,
  retryAfterSec?: number,
): FaucetErrorPayload {
  return { code, message, retryAfterSec };
}
