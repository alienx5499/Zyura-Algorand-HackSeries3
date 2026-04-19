"use client";

import { useEffect, useRef } from "react";

type UseDashboardDataBootstrapArgs = {
  walletInitComplete: boolean;
  isConnected: boolean;
  address: string | null | undefined;
  fetchProducts: () => void | Promise<void>;
  fetchMyPolicies: () => void | Promise<void>;
  fetchUsdcOptInStatus: () => void | Promise<unknown>;
  resetPoliciesState: () => void;
  setIsUsdcOptedIn: (value: boolean | null) => void;
};

export function useDashboardDataBootstrap({
  walletInitComplete,
  isConnected,
  address,
  fetchProducts,
  fetchMyPolicies,
  fetchUsdcOptInStatus,
  resetPoliciesState,
  setIsUsdcOptedIn,
}: UseDashboardDataBootstrapArgs) {
  const lastPoliciesFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!walletInitComplete) return;
    const hasAddress =
      address && typeof address === "string" && address.trim().length > 0;
    if (isConnected && hasAddress) {
      const wallet = address.trim();
      const fetchKey = `${wallet}:${isConnected ? "1" : "0"}`;
      if (lastPoliciesFetchKeyRef.current === fetchKey) {
        return;
      }
      lastPoliciesFetchKeyRef.current = fetchKey;
      fetchMyPolicies();
      fetchUsdcOptInStatus();
    } else {
      lastPoliciesFetchKeyRef.current = null;
      resetPoliciesState();
      setIsUsdcOptedIn(null);
    }
  }, [
    walletInitComplete,
    isConnected,
    address,
    fetchMyPolicies,
    fetchUsdcOptInStatus,
    resetPoliciesState,
    setIsUsdcOptedIn,
  ]);
}
