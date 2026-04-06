import { NextRequest, NextResponse } from "next/server";
import * as algokit from "@algorandfoundation/algokit-utils";
import algosdk from "algosdk";

export const dynamic = "force-dynamic";

function getAlgodv2(): algosdk.Algodv2 {
  const algodUrl = process.env.NEXT_PUBLIC_ALGOD_URL || "http://127.0.0.1:4001";
  const algodToken =
    process.env.NEXT_PUBLIC_ALGOD_TOKEN ||
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const algodNetwork = process.env.NEXT_PUBLIC_ALGOD_NETWORK || "localnet";

  let algorand: algokit.AlgorandClient;
  if (
    algodNetwork === "localnet" ||
    algodUrl.includes("localhost") ||
    algodUrl.includes("127.0.0.1")
  ) {
    algorand = algokit.AlgorandClient.defaultLocalNet();
  } else if (
    algodNetwork === "testnet" &&
    (!algodToken || algodToken.length < 10)
  ) {
    algorand = algokit.AlgorandClient.testNet();
  } else {
    const algodClient = new algosdk.Algodv2(algodToken || "", algodUrl, "");
    algorand = algokit.AlgorandClient.fromClients({ algod: algodClient });
  }
  return algorand.client.algod;
}

function getIssuerFromEnv(): { addr: string; sk: Uint8Array } {
  const m = process.env.ADMIN_MNEMONIC?.trim();
  if (!m) {
    throw new Error(
      "Set ADMIN_MNEMONIC in server env (same as deploy / set-policy-nft-issuer); it signs policy NFT create/transfer.",
    );
  }
  const acct = algosdk.mnemonicToSecretKey(m);
  return { addr: String(acct.addr), sk: acct.sk };
}

function createPolicyBoxName(prefix: string, policyId: bigint): Uint8Array {
  const prefixBytes = new TextEncoder().encode(prefix);
  const idBytes = algosdk.encodeUint64(policyId);
  const name = new Uint8Array(prefixBytes.length + idBytes.length);
  name.set(prefixBytes, 0);
  name.set(idBytes, prefixBytes.length);
  return name;
}

async function fetchApplicationBox(
  appId: number,
  boxName: Uint8Array,
): Promise<Uint8Array | null> {
  const algodUrl = (process.env.NEXT_PUBLIC_ALGOD_URL || "").replace(/\/$/, "");
  const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
  if (!algodUrl) return null;
  const b64 = Buffer.from(boxName).toString("base64");
  // Must encode query value: raw b64 can contain +, /, = which break URLs if not encoded.
  const u = new URL(`${algodUrl}/v2/applications/${appId}/box`);
  u.searchParams.set("name", `b64:${b64}`);
  const res = await fetch(u.toString(), {
    cache: "no-store",
    headers: token ? { "X-Algo-API-Token": token } : {},
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const json = (await res.json()) as { value?: string };
  if (!json.value) return null;
  return new Uint8Array(Buffer.from(json.value, "base64"));
}

async function getGlobalAddress(
  appId: number,
  keyUtf8: string,
): Promise<string | null> {
  const algodUrl = (process.env.NEXT_PUBLIC_ALGOD_URL || "").replace(/\/$/, "");
  const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
  if (!algodUrl) return null;
  const res = await fetch(`${algodUrl}/v2/applications/${appId}`, {
    cache: "no-store",
    headers: token ? { "X-Algo-API-Token": token } : {},
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    params?: {
      ["global-state"]?: Array<{
        key: string;
        value: { type: number; bytes?: string };
      }>;
    };
  };
  for (const e of data.params?.["global-state"] ?? []) {
    let k: string;
    try {
      k = Buffer.from(e.key, "base64").toString("utf8");
    } catch {
      continue;
    }
    if (k !== keyUtf8) continue;
    if (e.value?.type === 1 && e.value.bytes) {
      const raw = Buffer.from(e.value.bytes, "base64");
      if (raw.length === 32) {
        return algosdk.encodeAddress(new Uint8Array(raw));
      }
    }
  }
  return null;
}

async function waitForConfirmation(
  client: algosdk.Algodv2,
  txid: string,
): Promise<void> {
  for (let i = 0; i < 30; i++) {
    const pending = await client.pendingTransactionInformation(txid).do();
    if (pending.confirmedRound) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Transaction confirmation timeout");
}

export async function POST(request: NextRequest) {
  try {
    const appId = Number(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "0");
    if (!appId) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_ZYURA_APP_ID not set" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as {
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

    const action = body.action;
    const policyIdStr = body.policyId;
    const recipient = body.recipient;

    if (!action || !policyIdStr || !recipient) {
      return NextResponse.json(
        { error: "Missing action, policyId, or recipient" },
        { status: 400 },
      );
    }

    let policyId: bigint;
    try {
      policyId = BigInt(policyIdStr);
    } catch {
      return NextResponse.json({ error: "Invalid policyId" }, { status: 400 });
    }

    /** Mint ASA before purchase so purchase + NFT delivery can be one atomic group (known asset id). */
    if (action === "createBeforePurchase") {
      const assetURL = body.assetURL?.trim();
      if (!assetURL) {
        return NextResponse.json(
          { error: "assetURL is required" },
          { status: 400 },
        );
      }
      const issuer = getIssuerFromEnv();
      const globalIssuer = await getGlobalAddress(appId, "pol_nft_issuer");
      const zero = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";
      if (!globalIssuer || globalIssuer === zero) {
        return NextResponse.json(
          {
            error:
              "App pol_nft_issuer is not set. From contracts/: npx ts-node scripts/set-policy-nft-issuer.ts (uses ADMIN_MNEMONIC; sets issuer = admin).",
          },
          { status: 503 },
        );
      }
      if (globalIssuer !== issuer.addr) {
        return NextResponse.json(
          {
            error:
              "ADMIN_MNEMONIC address does not match on-chain pol_nft_issuer; run set-policy-nft-issuer with the same ADMIN_MNEMONIC as this server, or fix env.",
          },
          { status: 503 },
        );
      }
      const client = getAlgodv2();
      const suggestedParams = await client.getTransactionParams().do();
      const assetName = body.assetName?.trim() || `ZYURA Policy ${policyIdStr}`;
      const unitName = body.unitName?.trim() || `Z${policyIdStr.slice(-7)}`;
      const createTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(
        {
          sender: issuer.addr,
          total: BigInt(1),
          decimals: 0,
          assetName: assetName.slice(0, 32),
          unitName: unitName.slice(0, 8),
          assetURL: assetURL.slice(0, 96),
          defaultFrozen: false,
          manager: issuer.addr,
          reserve: issuer.addr,
          freeze: issuer.addr,
          clawback: issuer.addr,
          suggestedParams,
        },
      );
      const signed = createTxn.signTxn(issuer.sk);
      const { txid } = await client.sendRawTransaction(signed).do();
      await waitForConfirmation(client, txid);
      const info = await client.pendingTransactionInformation(txid).do();
      const assetIndex = info.assetIndex;
      if (assetIndex == null) {
        return NextResponse.json(
          { error: "Could not read created asset index" },
          { status: 500 },
        );
      }
      return NextResponse.json({
        assetId: Number(assetIndex),
        txId: txid,
      });
    }

    /** Atomic purchase+NFT group signs before pol_holder exists; legacy paths require policy on-chain. */
    const isNftDeliveryAtomic =
      action === "unsignedNftDelivery" || action === "signNftDelivery";

    if (
      !isNftDeliveryAtomic &&
      (action === "unsignedTransfer" || action === "signGroupedTransfer")
    ) {
      const holderBytes = await fetchApplicationBox(
        appId,
        createPolicyBoxName("pol_holder", policyId),
      );
      if (!holderBytes || holderBytes.length !== 32) {
        return NextResponse.json(
          { error: "Policy not found on-chain" },
          { status: 404 },
        );
      }
      const holderOnChain = algosdk.encodeAddress(holderBytes);
      if (holderOnChain !== recipient) {
        return NextResponse.json(
          { error: "Recipient is not the policyholder for this policy" },
          { status: 403 },
        );
      }

      const polNftBytes = await fetchApplicationBox(
        appId,
        createPolicyBoxName("pol_nft", policyId),
      );
      if (polNftBytes && polNftBytes.length >= 8) {
        const linked = algosdk.decodeUint64(polNftBytes.subarray(0, 8), "safe");
        if (linked > BigInt(0)) {
          return NextResponse.json(
            { error: "Policy already has a linked NFT" },
            { status: 409 },
          );
        }
      }
    }

    const issuer = getIssuerFromEnv();
    const globalIssuer = await getGlobalAddress(appId, "pol_nft_issuer");
    const zero = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ";
    if (!globalIssuer || globalIssuer === zero) {
      return NextResponse.json(
        {
          error:
            "App pol_nft_issuer is not set. From contracts/: npx ts-node scripts/set-policy-nft-issuer.ts (uses ADMIN_MNEMONIC; sets issuer = admin). Requires app TEAL with setPolicyNftIssuer.",
        },
        { status: 503 },
      );
    }
    if (globalIssuer !== issuer.addr) {
      return NextResponse.json(
        {
          error:
            "ADMIN_MNEMONIC address does not match on-chain pol_nft_issuer; run set-policy-nft-issuer with the same ADMIN_MNEMONIC as this server, or fix env.",
        },
        { status: 503 },
      );
    }

    const client = getAlgodv2();

    function suggestedParamsFromClient(
      raw: Record<string, unknown> | undefined,
    ): algosdk.SuggestedParams {
      if (!raw || typeof raw !== "object") {
        throw new Error("suggestedParams is required for this action");
      }
      const gh = raw.genesisHash;
      let genesisHash: Uint8Array | undefined;
      if (typeof gh === "string") {
        genesisHash = new Uint8Array(Buffer.from(gh, "base64"));
      }
      const toNum = (v: unknown) =>
        typeof v === "number"
          ? v
          : typeof v === "string"
            ? parseInt(v, 10)
            : typeof v === "bigint"
              ? Number(v)
              : 0;
      return {
        fee: toNum(raw.fee ?? raw.minFee ?? 1000),
        minFee: toNum(raw.minFee ?? 1000),
        firstValid: toNum(raw.firstValid ?? raw.firstRound ?? 0),
        lastValid: toNum(raw.lastValid ?? raw.lastRound ?? 0),
        genesisID: (raw.genesisID as string) ?? "",
        genesisHash,
        flatFee: (raw.flatFee as boolean) ?? false,
      };
    }

    if (action === "unsignedTransfer" || action === "unsignedNftDelivery") {
      const assetId = body.assetId;
      if (assetId == null || Number(assetId) <= 0) {
        return NextResponse.json(
          { error: "assetId is required" },
          { status: 400 },
        );
      }
      let sp: algosdk.SuggestedParams;
      try {
        sp = suggestedParamsFromClient(body.suggestedParams);
      } catch (e: unknown) {
        const m = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ error: m }, { status: 400 });
      }
      const ai = await client.getAssetByID(Number(assetId)).do();
      const creator = ai.params.creator;
      if (creator !== issuer.addr) {
        return NextResponse.json(
          { error: "Asset was not created by the configured issuer" },
          { status: 400 },
        );
      }
      const freezeAddr = ai.params.freeze;
      if (!freezeAddr || String(freezeAddr) !== issuer.addr) {
        return NextResponse.json(
          {
            error:
              "Policy NFT ASA must have freeze address set to the issuer (non-transferable / soulbound). Use an updated mint that sets freeze on create.",
          },
          { status: 400 },
        );
      }
      const clawAddr = ai.params.clawback;
      if (!clawAddr || String(clawAddr) !== issuer.addr) {
        return NextResponse.json(
          {
            error:
              "Policy NFT ASA must have clawback address set to the issuer (protocol-controlled transfers). Remint with updated server.",
          },
          { status: 400 },
        );
      }

      const xfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: issuer.addr,
        receiver: recipient,
        amount: BigInt(1),
        assetIndex: Number(assetId),
        suggestedParams: sp,
      });
      const freezeTxn = algosdk.makeAssetFreezeTxnWithSuggestedParamsFromObject(
        {
          sender: issuer.addr,
          freezeTarget: recipient,
          assetIndex: Number(assetId),
          frozen: true,
          suggestedParams: sp,
        },
      );
      const unsignedTransferB64 = Buffer.from(
        algosdk.encodeUnsignedTransaction(xfer),
      ).toString("base64");
      const unsignedFreezeB64 = Buffer.from(
        algosdk.encodeUnsignedTransaction(freezeTxn),
      ).toString("base64");
      return NextResponse.json({ unsignedTransferB64, unsignedFreezeB64 });
    }

    if (action === "signGroupedTransfer" || action === "signNftDelivery") {
      const assetId = body.assetId;
      const b64 = body.unsignedGroupedTransferB64?.trim();
      const freezeB64 = body.unsignedGroupedFreezeB64?.trim();
      if (assetId == null || Number(assetId) <= 0) {
        return NextResponse.json(
          { error: "assetId is required" },
          { status: 400 },
        );
      }
      if (!b64) {
        return NextResponse.json(
          { error: "unsignedGroupedTransferB64 is required" },
          { status: 400 },
        );
      }
      if (!freezeB64) {
        return NextResponse.json(
          { error: "unsignedGroupedFreezeB64 is required" },
          { status: 400 },
        );
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
        return NextResponse.json(
          { error: "Invalid grouped issuer transaction encoding" },
          { status: 400 },
        );
      }
      if (txn.type !== algosdk.TransactionType.axfer || !txn.assetTransfer) {
        return NextResponse.json(
          { error: "Transaction is not an asset transfer" },
          { status: 400 },
        );
      }
      if (
        freezeTxn.type !== algosdk.TransactionType.afrz ||
        !freezeTxn.assetFreeze
      ) {
        return NextResponse.json(
          { error: "Second issuer transaction must be an asset freeze" },
          { status: 400 },
        );
      }
      const at = txn.assetTransfer;
      const af = freezeTxn.assetFreeze;
      if (!af) {
        return NextResponse.json(
          { error: "Missing asset freeze fields" },
          { status: 400 },
        );
      }
      if (String(txn.sender) !== issuer.addr) {
        return NextResponse.json(
          { error: "Transfer sender must be policy NFT issuer" },
          { status: 400 },
        );
      }
      if (String(freezeTxn.sender) !== issuer.addr) {
        return NextResponse.json(
          { error: "Freeze sender must be policy NFT issuer" },
          { status: 400 },
        );
      }
      if (String(at.receiver) !== recipient) {
        return NextResponse.json(
          { error: "Transfer receiver mismatch" },
          { status: 400 },
        );
      }
      const freezeTargetStr = String(af.freezeAccount);
      if (freezeTargetStr !== String(recipient)) {
        return NextResponse.json(
          { error: "Freeze target must be the policyholder" },
          { status: 400 },
        );
      }
      if (Number(at.assetIndex) !== Number(assetId)) {
        return NextResponse.json(
          { error: "Transfer asset mismatch" },
          { status: 400 },
        );
      }
      if (Number(af.assetIndex) !== Number(assetId)) {
        return NextResponse.json(
          { error: "Freeze asset mismatch" },
          { status: 400 },
        );
      }
      if (at.amount !== BigInt(1)) {
        return NextResponse.json(
          { error: "Transfer amount must be 1" },
          { status: 400 },
        );
      }
      if (!af.frozen) {
        return NextResponse.json(
          { error: "Freeze transaction must freeze the account (soulbound)" },
          { status: 400 },
        );
      }
      const g = txn.group;
      const gf = freezeTxn.group;
      if (!g || !g.some((b) => b !== 0)) {
        return NextResponse.json(
          {
            error: "Transfer must be grouped (assignGroupID with opt-in first)",
          },
          { status: 400 },
        );
      }
      if (!gf || !gf.some((b) => b !== 0)) {
        return NextResponse.json(
          {
            error:
              "Freeze transaction must be grouped with the same atomic group",
          },
          { status: 400 },
        );
      }
      if (
        Buffer.from(g).toString("base64") !== Buffer.from(gf).toString("base64")
      ) {
        return NextResponse.json(
          { error: "Transfer and freeze must share the same group ID" },
          { status: 400 },
        );
      }
      const signedXferBlob = txn.signTxn(issuer.sk);
      const signedFreezeBlob = freezeTxn.signTxn(issuer.sk);
      return NextResponse.json({
        signedXferB64: Buffer.from(signedXferBlob).toString("base64"),
        signedFreezeB64: Buffer.from(signedFreezeBlob).toString("base64"),
      });
    }

    if (action === "create") {
      const suggestedParams = await client.getTransactionParams().do();
      const assetURL = body.assetURL?.trim();
      if (!assetURL) {
        return NextResponse.json(
          { error: "assetURL is required" },
          { status: 400 },
        );
      }
      const assetName = body.assetName?.trim() || `ZYURA Policy ${policyIdStr}`;
      const unitName = body.unitName?.trim() || `Z${policyIdStr.slice(-7)}`;

      const createTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(
        {
          sender: issuer.addr,
          total: BigInt(1),
          decimals: 0,
          assetName: assetName.slice(0, 32),
          unitName: unitName.slice(0, 8),
          assetURL: assetURL.slice(0, 96),
          defaultFrozen: false,
          manager: issuer.addr,
          reserve: issuer.addr,
          freeze: issuer.addr,
          clawback: issuer.addr,
          suggestedParams,
        },
      );

      const signed = createTxn.signTxn(issuer.sk);
      const { txid } = await client.sendRawTransaction(signed).do();
      await waitForConfirmation(client, txid);
      const info = await client.pendingTransactionInformation(txid).do();
      const assetIndex = info.assetIndex;
      if (assetIndex == null) {
        return NextResponse.json(
          { error: "Could not read created asset index" },
          { status: 500 },
        );
      }
      return NextResponse.json({
        assetId: Number(assetIndex),
        txId: txid,
      });
    }

    if (action === "transfer") {
      const assetId = body.assetId;
      if (assetId == null || Number(assetId) <= 0) {
        return NextResponse.json(
          { error: "assetId is required" },
          { status: 400 },
        );
      }

      const ai = await client.getAssetByID(Number(assetId)).do();
      const creator = ai.params.creator;
      if (creator !== issuer.addr) {
        return NextResponse.json(
          { error: "Asset was not created by the configured issuer" },
          { status: 400 },
        );
      }

      const acc = await client.accountInformation(recipient).do();
      const aid = Number(assetId);
      const optedIn = (acc.assets ?? []).some((h) => {
        const row = h as unknown as Record<string, number | undefined>;
        return row["asset-id"] === aid || row.assetId === aid;
      });
      if (!optedIn) {
        return NextResponse.json(
          { error: "Recipient must opt in to the asset before transfer" },
          { status: 400 },
        );
      }

      const xfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: issuer.addr,
        receiver: recipient,
        amount: BigInt(1),
        assetIndex: Number(assetId),
        suggestedParams: await client.getTransactionParams().do(),
      });
      const signedXfer = xfer.signTxn(issuer.sk);
      const { txid } = await client.sendRawTransaction(signedXfer).do();
      await waitForConfirmation(client, txid);
      return NextResponse.json({ txId: txid, assetId: Number(assetId) });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[mint-policy-nft]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
