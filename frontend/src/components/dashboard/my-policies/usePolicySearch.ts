import { useMemo } from "react";
import {
  getDisplayFlightAndPnr,
  normalizePolicyStatus,
  toSafeNumber,
} from "@/lib/dashboard/policy-utils";

export function usePolicySearch(myPolicies: any[], query: string) {
  const normalizedSearch = query.trim().toLowerCase();

  return useMemo(() => {
    if (!normalizedSearch) return myPolicies;

    return myPolicies.filter((policy, index) => {
      const policyIdRaw = toSafeNumber(policy.id);
      const policyId = policyIdRaw > 0 ? policyIdRaw : index + 1;
      const productIdAttr = toSafeNumber(policy.product_id);
      const status = normalizePolicyStatus(policy.status).toLowerCase();
      const { flight, pnr } = getDisplayFlightAndPnr(policy);
      const searchable = [
        String(policyId),
        String(productIdAttr),
        status,
        (flight || "").toLowerCase(),
        (pnr || "").toLowerCase(),
      ];
      return searchable.some((token) => token.includes(normalizedSearch));
    });
  }, [myPolicies, normalizedSearch]);
}
