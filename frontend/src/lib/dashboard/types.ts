export type PnrStatus = "fetching" | "found" | "not-found" | null;

/** Origin / destination from PNR search (IATA codes). */
export type PnrFlightRoute = {
  origin: string;
  destination: string;
};

export type LastPurchaseTx = {
  txId: string;
  groupId?: string;
  policyId: string;
  nftAssetId?: string;
  purchasedAtIso: string;
  steps: Array<{
    txId: string;
    label: string;
    type: string;
    from: string;
    to: string;
    summary: string;
  }>;
  premiumTransfer?: {
    txId: string;
    amountMicro: number;
    amountUsd: string;
    receiver: string;
  };
};
