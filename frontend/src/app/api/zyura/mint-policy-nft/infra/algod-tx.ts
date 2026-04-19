import algosdk from "algosdk";

export async function waitForConfirmation(
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

export function suggestedParamsFromClient(
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
