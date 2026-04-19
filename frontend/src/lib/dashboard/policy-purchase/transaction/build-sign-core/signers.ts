import algosdk from "algosdk";

type PeraLikeWallet = {
  signTransaction: (
    groups: Array<Array<{ txn: algosdk.Transaction }>>,
  ) => Promise<unknown>;
};

/**
 * Pera mobile drops unsigned slots (issuer-signed txns use `signers: []`) via
 * `response.filter(Boolean)`, so the returned array length is often `nTx - 2`
 * instead of `nTx`. Web may return the full `nTx` list. Merge both shapes.
 */
export function normalizePeraSignedResponse(raw: unknown): Uint8Array[] {
  if (raw == null) return [];
  let arr: unknown = raw;
  if (Array.isArray(arr) && arr.length === 1 && Array.isArray(arr[0])) {
    arr = arr[0];
  }
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    if (item instanceof Uint8Array) return item;
    if (typeof Buffer !== "undefined" && Buffer.isBuffer(item)) {
      return new Uint8Array(item);
    }
    return new Uint8Array(0);
  });
}

export function makeNoopIssuerSigner(): algosdk.TransactionSigner {
  return async (_txns, idxs) => idxs.map(() => new Uint8Array(0));
}

export function makePeraSigner(
  peraWallet: PeraLikeWallet,
): algosdk.TransactionSigner {
  return async (txnGroup, indexes) => {
    const groupTxnArray = txnGroup.map((txn) => ({ txn }));
    const rawSigned = await peraWallet.signTransaction([groupTxnArray]);
    const rawSignedArray = Array.isArray(rawSigned) ? rawSigned : [];
    const maybeNested = rawSignedArray[0];
    const signedGroup: unknown[] =
      rawSignedArray.length === 1 &&
      Array.isArray(maybeNested) &&
      maybeNested.length === txnGroup.length
        ? maybeNested
        : rawSignedArray;
    if (!signedGroup?.length || signedGroup.length !== txnGroup.length) {
      throw new Error(
        `Expected ${txnGroup.length} signed transactions. If you cancelled signing or only approved part of the group, try again and approve all transactions.`,
      );
    }
    return indexes.map((i) =>
      signedGroup[i] instanceof Uint8Array ? signedGroup[i] : new Uint8Array(0),
    );
  };
}
