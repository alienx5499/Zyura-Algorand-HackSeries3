import type {
  PreMintCreateResponse,
  SignedDeliveryResponse,
  UnsignedDeliveryResponse,
} from "./types";

export async function fetchVaultAddress(): Promise<string> {
  const vaultApiRes = await fetch("/api/zyura/vault");
  if (!vaultApiRes.ok) {
    const error = await vaultApiRes.json();
    throw new Error(error.error || "Failed to get vault address");
  }
  const vaultData = await vaultApiRes.json();
  const vaultAddr = vaultData.vault;
  if (!vaultAddr) {
    throw new Error(
      "Vault address not found - please set RISK_POOL_VAULT_ADDR in .env",
    );
  }
  return vaultAddr;
}

export async function createPolicyNftBeforePurchase(args: {
  policyId: number;
  recipient: string;
  assetURL: string;
  assetName: string;
  unitName: string;
}): Promise<number> {
  const preMintRes = await fetch("/api/zyura/mint-policy-nft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "createBeforePurchase",
      policyId: String(args.policyId),
      recipient: args.recipient,
      assetURL: args.assetURL,
      assetName: args.assetName,
      unitName: args.unitName,
    }),
  });
  if (!preMintRes.ok) {
    const err = await preMintRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ||
        "Failed to create policy NFT ASA before purchase",
    );
  }
  const preMint = (await preMintRes.json()) as PreMintCreateResponse;
  if (preMint.assetId == null) {
    throw new Error("Mint API did not return assetId");
  }
  return preMint.assetId;
}

export async function fetchAccountAssetIds(address: string): Promise<number[]> {
  const acctRes = await fetch(
    `/api/algorand/account/${encodeURIComponent(address)}`,
  );
  if (!acctRes.ok) {
    const err = await acctRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error || "Failed to load account assets",
    );
  }
  const acctData = (await acctRes.json()) as { assetIds?: number[] };
  return acctData.assetIds ?? [];
}

export async function prepareUnsignedNftDelivery(args: {
  policyId: number;
  recipient: string;
  assetId: number;
  suggestedParams: unknown;
}): Promise<UnsignedDeliveryResponse> {
  const xferPrepRes = await fetch("/api/zyura/mint-policy-nft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "unsignedNftDelivery",
      policyId: String(args.policyId),
      recipient: args.recipient,
      assetId: args.assetId,
      suggestedParams: args.suggestedParams,
    }),
  });
  if (!xferPrepRes.ok) {
    const err = await xferPrepRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ||
        "Failed to prepare NFT transfer + freeze",
    );
  }
  const payload = (await xferPrepRes.json()) as UnsignedDeliveryResponse;
  if (!payload.unsignedTransferB64 || !payload.unsignedFreezeB64) {
    throw new Error("Mint API did not return transfer + freeze transactions");
  }
  return payload;
}

export async function signGroupedNftDelivery(args: {
  policyId: number;
  recipient: string;
  assetId: number;
  unsignedGroupedTransferB64: string;
  unsignedGroupedFreezeB64: string;
}): Promise<SignedDeliveryResponse> {
  const signXferRes = await fetch("/api/zyura/mint-policy-nft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "signNftDelivery",
      policyId: String(args.policyId),
      recipient: args.recipient,
      assetId: args.assetId,
      unsignedGroupedTransferB64: args.unsignedGroupedTransferB64,
      unsignedGroupedFreezeB64: args.unsignedGroupedFreezeB64,
    }),
  });
  if (!signXferRes.ok) {
    const err = await signXferRes.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ||
        "Failed to sign issuer NFT transfer + freeze",
    );
  }
  const payload = (await signXferRes.json()) as SignedDeliveryResponse;
  if (!payload.signedXferB64 || !payload.signedFreezeB64) {
    throw new Error("Server did not return signed transfer + freeze");
  }
  return payload;
}

export async function sendSignedGroup(signedBase64: string): Promise<void> {
  const sendRes = await fetch("/api/algorand/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTx: signedBase64 }),
  });
  if (!sendRes.ok) {
    const error = await sendRes.json();
    throw new Error(error.error || "Failed to send grouped transaction");
  }
  await sendRes.json();
}
