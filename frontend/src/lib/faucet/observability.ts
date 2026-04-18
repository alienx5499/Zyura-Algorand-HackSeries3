type FaucetLog = {
  event: "faucet_request";
  address: string;
  ip: string;
  amount: number;
  status: "success" | "fail";
  code: string;
  txId?: string;
  retryAfterSec?: number;
};

export function logFaucetEvent(payload: FaucetLog) {
  console.info(JSON.stringify(payload));
}
