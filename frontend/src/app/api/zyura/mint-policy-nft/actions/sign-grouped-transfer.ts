import algosdk from "algosdk";
import {
  createPolicyBoxName,
  fetchApplicationBox,
} from "@/app/api/zyura/mint-policy-nft/infra/algod-state";
import type { ActionHandler } from "@/app/api/zyura/mint-policy-nft/types";

export const handleSignGroupedTransfer: ActionHandler = async (ctx, body) => {
  const isNftDeliveryAtomic = ctx.action === "signNftDelivery";

  if (!isNftDeliveryAtomic) {
    const holderBytes = await fetchApplicationBox(
      ctx.appId,
      createPolicyBoxName("pol_holder", ctx.policyId),
    );
    if (!holderBytes || holderBytes.length !== 32) {
      return { payload: { error: "Policy not found on-chain" }, status: 404 };
    }
    const holderOnChain = algosdk.encodeAddress(holderBytes);
    if (holderOnChain !== ctx.recipient) {
      return {
        payload: { error: "Recipient is not the policyholder for this policy" },
        status: 403,
      };
    }
    const polNftBytes = await fetchApplicationBox(
      ctx.appId,
      createPolicyBoxName("pol_nft", ctx.policyId),
    );
    if (polNftBytes && polNftBytes.length >= 8) {
      const linked = algosdk.decodeUint64(polNftBytes.subarray(0, 8), "safe");
      if (linked > BigInt(0)) {
        return {
          payload: { error: "Policy already has a linked NFT" },
          status: 409,
        };
      }
    }
  }

  const assetId = body.assetId;
  const b64 = body.unsignedGroupedTransferB64?.trim();
  const freezeB64 = body.unsignedGroupedFreezeB64?.trim();
  if (assetId == null || Number(assetId) <= 0) {
    return { payload: { error: "assetId is required" }, status: 400 };
  }
  if (!b64) {
    return {
      payload: { error: "unsignedGroupedTransferB64 is required" },
      status: 400,
    };
  }
  if (!freezeB64) {
    return {
      payload: { error: "unsignedGroupedFreezeB64 is required" },
      status: 400,
    };
  }
  let txn: algosdk.Transaction;
  let freezeTxn: algosdk.Transaction;
  try {
    txn = algosdk.decodeUnsignedTransaction(
      new Uint8Array(Buffer.from(b64, "base64")),
    );
    freezeTxn = algosdk.decodeUnsignedTransaction(
      new Uint8Array(Buffer.from(freezeB64, "base64")),
    );
  } catch {
    return {
      payload: { error: "Invalid grouped issuer transaction encoding" },
      status: 400,
    };
  }
  if (txn.type !== algosdk.TransactionType.axfer || !txn.assetTransfer) {
    return {
      payload: { error: "Transaction is not an asset transfer" },
      status: 400,
    };
  }
  if (
    freezeTxn.type !== algosdk.TransactionType.afrz ||
    !freezeTxn.assetFreeze
  ) {
    return {
      payload: { error: "Second issuer transaction must be an asset freeze" },
      status: 400,
    };
  }
  const at = txn.assetTransfer;
  const af = freezeTxn.assetFreeze;
  if (!af) {
    return { payload: { error: "Missing asset freeze fields" }, status: 400 };
  }
  if (String(txn.sender) !== ctx.issuer.addr) {
    return {
      payload: { error: "Transfer sender must be policy NFT issuer" },
      status: 400,
    };
  }
  if (String(freezeTxn.sender) !== ctx.issuer.addr) {
    return {
      payload: { error: "Freeze sender must be policy NFT issuer" },
      status: 400,
    };
  }
  if (String(at.receiver) !== ctx.recipient) {
    return { payload: { error: "Transfer receiver mismatch" }, status: 400 };
  }
  const freezeTargetStr = String(af.freezeAccount);
  if (freezeTargetStr !== String(ctx.recipient)) {
    return {
      payload: { error: "Freeze target must be the policyholder" },
      status: 400,
    };
  }
  if (Number(at.assetIndex) !== Number(assetId)) {
    return { payload: { error: "Transfer asset mismatch" }, status: 400 };
  }
  if (Number(af.assetIndex) !== Number(assetId)) {
    return { payload: { error: "Freeze asset mismatch" }, status: 400 };
  }
  if (at.amount !== BigInt(1)) {
    return { payload: { error: "Transfer amount must be 1" }, status: 400 };
  }
  if (!af.frozen) {
    return {
      payload: {
        error: "Freeze transaction must freeze the account (soulbound)",
      },
      status: 400,
    };
  }
  const g = txn.group;
  const gf = freezeTxn.group;
  if (!g || !g.some((b) => b !== 0)) {
    return {
      payload: {
        error: "Transfer must be grouped (assignGroupID with opt-in first)",
      },
      status: 400,
    };
  }
  if (!gf || !gf.some((b) => b !== 0)) {
    return {
      payload: {
        error: "Freeze transaction must be grouped with the same atomic group",
      },
      status: 400,
    };
  }
  if (
    Buffer.from(g).toString("base64") !== Buffer.from(gf).toString("base64")
  ) {
    return {
      payload: { error: "Transfer and freeze must share the same group ID" },
      status: 400,
    };
  }
  const signedXferBlob = txn.signTxn(ctx.issuer.sk);
  const signedFreezeBlob = freezeTxn.signTxn(ctx.issuer.sk);
  return {
    payload: {
      signedXferB64: Buffer.from(signedXferBlob).toString("base64"),
      signedFreezeB64: Buffer.from(signedFreezeBlob).toString("base64"),
    },
  };
};
