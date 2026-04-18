import algosdk from "algosdk";
import { INDEXER_URL } from "../config";

/** Fetch map policyId -> payout transaction id from indexer (processPayout app calls). */
export async function fetchPayoutTxIds(
  appId: number,
): Promise<Record<string, string>> {
  try {
    const res = await fetch(
      `${INDEXER_URL}/v2/transactions?application-id=${appId}&limit=300`,
      { cache: "no-store", headers: { Accept: "application/json" } },
    );
    if (!res.ok) {
      console.log(`[fetchPayoutTxIds] Indexer request failed: ${res.status}`);
      return {};
    }
    const data = await res.json();
    const txs = data.transactions || [];
    const payoutMap: Record<string, string> = {};
    console.log(
      `[fetchPayoutTxIds] Found ${txs.length} transactions for app ${appId}`,
    );
    for (const tx of txs) {
      const appArgs = tx["application-transaction"]?.["application-args"] || [];
      if (appArgs.length >= 3) {
        try {
          const policyIdBytes = Buffer.from(appArgs[1], "base64");
          let paddedBytes = policyIdBytes;
          if (policyIdBytes.length < 8) {
            paddedBytes = Buffer.allocUnsafe(8);
            paddedBytes.fill(0);
            policyIdBytes.copy(paddedBytes, 8 - policyIdBytes.length);
          } else if (policyIdBytes.length > 8) {
            paddedBytes = policyIdBytes.slice(-8);
          }
          const policyId = algosdk
            .decodeUint64(paddedBytes, "bigint")
            .toString();
          payoutMap[policyId] = tx.id;
          console.log(
            `[fetchPayoutTxIds] Mapped policy ${policyId} -> tx ${tx.id}`,
          );
        } catch (err) {
          console.log(
            `[fetchPayoutTxIds] Error decoding args for tx ${tx.id}:`,
            err,
          );
        }
      }
    }
    console.log(
      `[fetchPayoutTxIds] Returning payoutMap with ${Object.keys(payoutMap).length} entries`,
    );
    return payoutMap;
  } catch (err) {
    console.log(`[fetchPayoutTxIds] Error:`, err);
    return {};
  }
}
