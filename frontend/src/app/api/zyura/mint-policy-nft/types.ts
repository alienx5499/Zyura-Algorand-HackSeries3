import type algosdk from "algosdk";

export const ACTIONS = [
  "createBeforePurchase",
  "unsignedTransfer",
  "unsignedNftDelivery",
  "signGroupedTransfer",
  "signNftDelivery",
  "create",
  "transfer",
] as const;

export type MintAction = (typeof ACTIONS)[number];

export type MintPolicyRequestBody = {
  action?: string;
  policyId?: string;
  recipient?: string;
  assetURL?: string;
  assetName?: string;
  unitName?: string;
  assetId?: number;
  suggestedParams?: Record<string, unknown>;
  unsignedGroupedTransferB64?: string;
  unsignedGroupedFreezeB64?: string;
};

export type MintContext = {
  requestId: string;
  action: MintAction;
  policyId: bigint;
  policyIdStr: string;
  recipient: string;
  appId: number;
  client: algosdk.Algodv2;
  issuer: { addr: string; sk: Uint8Array };
};

export type ActionHandler = (
  ctx: MintContext,
  body: MintPolicyRequestBody,
) => Promise<ResponsePayload>;

export type ResponsePayload = {
  payload: Record<string, unknown>;
  status?: number;
};
