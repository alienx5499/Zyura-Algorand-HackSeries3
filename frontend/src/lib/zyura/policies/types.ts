/** Row shape returned by GET /api/zyura/policies/[wallet] (indexer or GitHub path). */
export type PolicyApiRow = {
  id: string;
  product_id: string;
  flight_number: string;
  pnr?: string;
  departure_time: string;
  premium_paid: string;
  coverage_amount: string;
  status: number;
  created_at: string;
  metadata: any;
  imageUrl: string;
  metadataUrl: string;
  assetId?: number;
  payoutTxId?: string;
  source?: "indexer";
  githubMetadataStale?: boolean;
  onChainPurchaseInProgress?: boolean;
};

export type IndexerPolicyRow = PolicyApiRow & { source: "indexer" };

export type PoliciesCachePayload = {
  policies: PolicyApiRow[];
  source?: string;
};
