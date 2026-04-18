import algosdk from "algosdk";
import {
  getCachedPolicyBoxBytes,
  type PolicyBoxCache,
} from "@/lib/zyura/algod-policy-box-cache";
import type { PolicyApiRow } from "../types";
import { fetchPayoutTxIds } from "./payout";

/** Fetch policy status box via algod HTTP API (same approach as product API). */
export async function fetchPolicyStatusFromChain(
  appId: number,
  policyId: string,
  algodUrl: string,
  token: string,
  boxCache?: PolicyBoxCache,
): Promise<number> {
  try {
    const bytes = await getCachedPolicyBoxBytes(
      boxCache,
      appId,
      "pol_status",
      policyId,
      algodUrl,
      token,
    );
    if (bytes === "err" || bytes == null) return 0;
    if (bytes.length >= 8) {
      return Number(algosdk.decodeUint64(bytes.slice(0, 8), "safe"));
    }
  } catch {
    // Box missing or error -> treat as 0 (Active) for display
  }
  return 0;
}

/** Enrich each policy with on-chain status so PaidOut shows correctly. */
export async function enrichPolicyStatusFromChain(
  policies: Array<{ id: string; status: number }>,
  appId: number,
  boxCache?: PolicyBoxCache,
): Promise<void> {
  const algodUrl = process.env.NEXT_PUBLIC_ALGOD_URL;
  const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
  if (!algodUrl || !appId) return;
  await Promise.all(
    policies.map(async (p) => {
      const status = await fetchPolicyStatusFromChain(
        appId,
        p.id,
        algodUrl,
        token,
        boxCache,
      );
      p.status = status;
    }),
  );
}

/** Enrich coverage from product so policies always show current product coverage (not stale metadata). */
export async function enrichCoverageFromProduct(
  policies: PolicyApiRow[],
  baseUrl: string,
): Promise<void> {
  const productIds = [
    ...new Set(policies.map((p) => p.product_id).filter(Boolean)),
  ];
  const productCoverage: Record<string, string> = {};
  await Promise.all(
    productIds.map(async (productId) => {
      try {
        const res = await fetch(`${baseUrl}/api/zyura/product/${productId}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          const cov = data.coverage_amount ?? data.coverageAmount;
          if (cov != null) productCoverage[productId] = String(cov);
        }
      } catch {
        // ignore
      }
    }),
  );
  for (const p of policies) {
    if (p.product_id && productCoverage[p.product_id]) {
      p.coverage_amount = productCoverage[p.product_id];
    }
  }
}

/** Enrich policies with status 1 (PaidOut) with payoutTxId from indexer. */
export async function enrichPayoutTxIds(
  policies: Array<{ id: string; status: number; payoutTxId?: string }>,
  appId: number,
): Promise<void> {
  if (!appId || policies.length === 0) return;
  const paidOutPolicies = policies.filter((p) => p.status === 1);
  if (paidOutPolicies.length === 0) return;
  const payoutMap = await fetchPayoutTxIds(appId);
  console.log(
    `[enrichPayoutTxIds] Found ${paidOutPolicies.length} PaidOut policies, payoutMap has ${Object.keys(payoutMap).length} entries`,
  );
  for (const policy of paidOutPolicies) {
    if (payoutMap[policy.id]) {
      policy.payoutTxId = payoutMap[policy.id];
      console.log(
        `[enrichPayoutTxIds] Added payoutTxId for policy ${policy.id}: ${payoutMap[policy.id]}`,
      );
    } else {
      console.log(
        `[enrichPayoutTxIds] No payoutTxId found for policy ${policy.id} in payoutMap`,
      );
    }
  }
}
