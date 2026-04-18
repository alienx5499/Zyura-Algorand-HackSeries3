export type FaucetApiResponse = {
  ok?: boolean;
  txId?: string;
  code?: string;
  message?: string;
  retryAfterSec?: number;
};
