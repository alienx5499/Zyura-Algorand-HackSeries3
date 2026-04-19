import algosdk from "algosdk";

export type PurchaseChainConfig = {
  appId: bigint;
  usdcAsaId: bigint;
};

export type PreMintCreateResponse = {
  assetId?: number;
};

export type UnsignedDeliveryResponse = {
  unsignedTransferB64?: string;
  unsignedFreezeB64?: string;
};

export type SignedDeliveryResponse = {
  signedXferB64?: string;
  signedFreezeB64?: string;
};

export type GroupBuildContext = {
  appId: bigint;
  usdcAsaId: bigint;
  currentAddress: string;
  policyId: number;
  productId: string;
  premiumAmountMicro: bigint;
  metadataUri: string;
  nftAssetId: number;
  flightNumber: string;
  departureUnix: number;
  suggestedParams: algosdk.SuggestedParams;
  vaultAddr: string;
  boxReferences: Uint8Array[];
  peraSigner: algosdk.TransactionSigner;
  noopIssuerSigner: algosdk.TransactionSigner;
  xferTxn: algosdk.Transaction;
  freezeNftTxn: algosdk.Transaction;
  needsUsdcOptIn: boolean;
};

export type GroupBuildResult = {
  built: ReturnType<algosdk.AtomicTransactionComposer["buildGroup"]>;
  labels: string[];
  idxXfer: number;
  idxFreeze: number;
  nTx: number;
};
