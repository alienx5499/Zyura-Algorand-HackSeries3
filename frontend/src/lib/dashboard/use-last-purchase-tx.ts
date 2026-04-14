import { useEffect, useMemo, useState } from "react";
import type { LastPurchaseTx } from "@/lib/dashboard/types";
import {
  getGroupExplorerUrl,
  getPeraExplorerBase,
  getTxExplorerUrl,
} from "@/lib/dashboard/explorer-utils";

type UseLastPurchaseTxArgs = {
  address?: string | null;
};

export function useLastPurchaseTx({ address }: UseLastPurchaseTxArgs) {
  const [lastPurchaseTx, setLastPurchaseTx] = useState<LastPurchaseTx | null>(
    null,
  );

  const isMainnet = process.env.NEXT_PUBLIC_ALGOD_NETWORK === "mainnet";
  const peraExplorerBase = useMemo(
    () => getPeraExplorerBase(isMainnet),
    [isMainnet],
  );
  const txExplorerUrl = useMemo(
    () => getTxExplorerUrl(peraExplorerBase, lastPurchaseTx?.txId),
    [peraExplorerBase, lastPurchaseTx?.txId],
  );
  const groupExplorerUrl = useMemo(
    () => getGroupExplorerUrl(peraExplorerBase, lastPurchaseTx?.groupId),
    [peraExplorerBase, lastPurchaseTx?.groupId],
  );

  useEffect(() => {
    // Confirmation card is session-scoped: reset when wallet/account changes.
    setLastPurchaseTx(null);
  }, [address]);

  useEffect(() => {
    const backfillGroupId = async () => {
      if (!lastPurchaseTx?.txId || lastPurchaseTx.groupId) return;
      try {
        const txInfoRes = await fetch(
          `/api/algorand/tx/${lastPurchaseTx.txId}`,
        );
        if (!txInfoRes.ok) return;
        const txInfo = (await txInfoRes.json()) as any;
        const rawGroup =
          txInfo?.txn?.txn?.grp ||
          txInfo?.txn?.grp ||
          txInfo?.group ||
          txInfo?.groupId;

        let derivedGroupId: string | undefined;
        if (typeof rawGroup === "string") {
          derivedGroupId = rawGroup;
        } else if (Array.isArray(rawGroup)) {
          derivedGroupId = Buffer.from(new Uint8Array(rawGroup)).toString(
            "base64",
          );
        } else if (
          rawGroup &&
          typeof rawGroup === "object" &&
          Object.keys(rawGroup).length > 0
        ) {
          const values = Object.values(rawGroup).map((v) => Number(v));
          if (values.every((v) => Number.isFinite(v))) {
            derivedGroupId = Buffer.from(new Uint8Array(values)).toString(
              "base64",
            );
          }
        }
        if (!derivedGroupId) return;

        const updatedSnapshot: LastPurchaseTx = {
          ...lastPurchaseTx,
          groupId: derivedGroupId,
        };
        setLastPurchaseTx(updatedSnapshot);
      } catch {
        // best-effort only
      }
    };
    backfillGroupId();
  }, [lastPurchaseTx]);

  return {
    lastPurchaseTx,
    setLastPurchaseTx,
    peraExplorerBase,
    txExplorerUrl,
    groupExplorerUrl,
  };
}
