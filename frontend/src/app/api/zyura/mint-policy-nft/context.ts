import { randomUUID } from "crypto";
import { getMintPolicyEnv } from "@/app/api/zyura/mint-policy-nft/config/env";
import {
  getAlgodv2,
  getIssuerFromMnemonic,
} from "@/app/api/zyura/mint-policy-nft/infra/algod-client";
import type {
  MintAction,
  MintContext,
  MintPolicyRequestBody,
} from "@/app/api/zyura/mint-policy-nft/types";

export function parseAction(action?: string): MintAction | null {
  switch (action) {
    case "createBeforePurchase":
    case "unsignedTransfer":
    case "unsignedNftDelivery":
    case "signGroupedTransfer":
    case "signNftDelivery":
    case "create":
    case "transfer":
      return action;
    default:
      return null;
  }
}

export function createMintContext(
  action: MintAction,
  body: MintPolicyRequestBody,
): MintContext {
  const env = getMintPolicyEnv();
  const policyId = BigInt(body.policyId as string);
  const client = getAlgodv2({
    algodUrl: env.algodUrl,
    algodToken: env.algodToken,
    algodNetwork: env.algodNetwork,
  });
  const issuer = getIssuerFromMnemonic(env.adminMnemonic);

  return {
    requestId: randomUUID(),
    action,
    policyId,
    policyIdStr: body.policyId as string,
    recipient: body.recipient as string,
    appId: env.appId,
    client,
    issuer,
  };
}
