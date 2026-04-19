type MergeParams = {
  nTx: number;
  idxXfer: number;
  idxFreeze: number;
  signedXferBlob: Uint8Array;
  signedFreezeBlob: Uint8Array;
  walletSigs: Uint8Array[];
};

export function mergeAtomicGroupSignaturesWithIssuerBlobs(
  params: MergeParams,
): Uint8Array[] {
  const {
    nTx,
    idxXfer,
    idxFreeze,
    signedXferBlob,
    signedFreezeBlob,
    walletSigs,
  } = params;
  const merged = new Array<Uint8Array>(nTx);
  const expectedUserSigned = nTx - 2;

  const assertNonEmpty = (sig: Uint8Array, index: number) => {
    if (!(sig instanceof Uint8Array) || sig.length === 0) {
      throw new Error(
        `Wallet missing signature for transaction index ${index}. Approve the full group in Pera, or try again.`,
      );
    }
  };

  if (walletSigs.length === nTx) {
    for (let i = 0; i < nTx; i++) {
      if (i === idxXfer) merged[i] = signedXferBlob;
      else if (i === idxFreeze) merged[i] = signedFreezeBlob;
      else {
        assertNonEmpty(walletSigs[i]!, i);
        merged[i] = walletSigs[i]!;
      }
    }
    return merged;
  }

  if (walletSigs.length === expectedUserSigned) {
    let w = 0;
    for (let i = 0; i < nTx; i++) {
      if (i === idxXfer) merged[i] = signedXferBlob;
      else if (i === idxFreeze) merged[i] = signedFreezeBlob;
      else {
        const s = walletSigs[w++];
        assertNonEmpty(s!, i);
        merged[i] = s!;
      }
    }
    return merged;
  }

  throw new Error(
    `Wallet returned ${walletSigs.length} signatures; expected ${nTx} (full group) or ${expectedUserSigned} (mobile, issuer txns omitted). Try again or update Pera Wallet.`,
  );
}

export function concatSignedBlobs(blobs: Uint8Array[]): Uint8Array {
  const combined = new Uint8Array(blobs.reduce((sum, p) => sum + p.length, 0));
  let offset = 0;
  for (const blob of blobs) {
    combined.set(blob, offset);
    offset += blob.length;
  }
  return combined;
}
