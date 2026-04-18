import { useMemo } from "react";
import { getPolicyPnr } from "@/components/dashboard/buy-insurance/get-policy-pnr";
import type { PnrLookupLinkage } from "@/lib/dashboard/use-pnr-lookup";

export function useDepartureTimeOptions() {
  return useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        const value = `${hh}:${mm}`;
        const date = new Date();
        date.setHours(h, m, 0, 0);
        const label = date.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        });
        options.push({ value, label });
      }
    }
    return options;
  }, []);
}

export function useExistingPolicyForPnr(
  myPolicies: any[],
  pnr: string,
  pnrLinkage: PnrLookupLinkage | null | undefined,
  connectedAddress: string | null | undefined,
) {
  return useMemo(() => {
    const pnrTrim = pnr.trim();
    if (!pnrTrim) return null;
    const fromList =
      myPolicies.find((p) => {
        const existingPnr = getPolicyPnr(p);
        return (
          existingPnr && existingPnr.toLowerCase() === pnrTrim.toLowerCase()
        );
      }) ?? null;
    if (fromList) return fromList;

    const link = pnrLinkage;
    const addr = connectedAddress?.trim();
    const pnrUpper = pnrTrim.toUpperCase();

    if (
      link?.purchaseComplete &&
      link.linkedPolicyId > 0 &&
      link.linkedWallet &&
      link.linkedWallet !== "NA"
    ) {
      if (addr && link.linkedWallet !== addr) {
        return {
          id: String(link.linkedPolicyId),
          pnr: pnrUpper,
          metadata: { pnr: pnrUpper },
          __blockedOtherWallet: true as const,
          linkedWallet: link.linkedWallet,
        };
      }
      if (addr && link.linkedWallet === addr) {
        return {
          id: String(link.linkedPolicyId),
          pnr: pnrUpper,
          metadata: { pnr: pnrUpper },
          __syntheticFromPnrLookup: true as const,
          linkedWallet: link.linkedWallet,
        };
      }
    }
    return null;
  }, [myPolicies, pnr, pnrLinkage, connectedAddress]);
}
