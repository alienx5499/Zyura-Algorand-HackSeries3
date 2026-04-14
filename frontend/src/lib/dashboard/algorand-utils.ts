import algosdk from "algosdk";

/** Read body once; JSON.parse or surface raw text (avoids "Unexpected token" when server returns plain text). */
export async function readApiJsonBody<T extends object>(
  res: Response,
): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Bad response (${res.status}): ${text.slice(0, 500)}`);
  }
}

export async function fetchAlgorandSuggestedParams(): Promise<{
  params: algosdk.SuggestedParams;
  raw: Record<string, unknown>;
}> {
  const paramsRes = await fetch("/api/algorand/params");
  if (!paramsRes.ok) {
    let error: { details?: string; error?: string; suggestion?: string };
    try {
      error = await readApiJsonBody(paramsRes);
    } catch {
      throw new Error(
        `Failed to get transaction params (HTTP ${paramsRes.status})`,
      );
    }
    const errorMsg =
      error.details || error.error || "Failed to get transaction params";
    const suggestion = error.suggestion || "";
    throw new Error(suggestion ? `${errorMsg}. ${suggestion}` : errorMsg);
  }
  const suggestedParamsRaw = (await paramsRes.json()) as Record<
    string,
    unknown
  >;
  const toNum = (v: unknown) =>
    typeof v === "number"
      ? v
      : typeof v === "string"
        ? parseInt(v, 10)
        : typeof v === "bigint"
          ? Number(v)
          : 0;

  let genesisHash: Uint8Array | undefined;
  if (suggestedParamsRaw.genesisHash) {
    if (typeof suggestedParamsRaw.genesisHash === "string") {
      try {
        genesisHash = new Uint8Array(
          Buffer.from(suggestedParamsRaw.genesisHash, "base64"),
        );
      } catch {
        genesisHash = undefined;
      }
    } else if (suggestedParamsRaw.genesisHash instanceof Uint8Array) {
      genesisHash = suggestedParamsRaw.genesisHash;
    } else if (Array.isArray(suggestedParamsRaw.genesisHash)) {
      genesisHash = new Uint8Array(suggestedParamsRaw.genesisHash);
    }
  }

  const params: algosdk.SuggestedParams = {
    fee: toNum(suggestedParamsRaw.fee ?? suggestedParamsRaw.minFee ?? 1000),
    minFee: toNum(suggestedParamsRaw.minFee ?? 1000),
    firstValid: toNum(
      suggestedParamsRaw.firstValid ?? suggestedParamsRaw.firstRound ?? 0,
    ),
    lastValid: toNum(
      suggestedParamsRaw.lastValid ?? suggestedParamsRaw.lastRound ?? 0,
    ),
    genesisID: (suggestedParamsRaw.genesisID as string) ?? "",
    genesisHash,
    flatFee: (suggestedParamsRaw.flatFee as boolean) ?? false,
  };
  return { params, raw: suggestedParamsRaw };
}
