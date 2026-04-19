"use client";

import type { PnrFlightRoute, PnrStatus } from "@/lib/dashboard/types";

export type DashboardTutorialFormHandlers = {
  setShowBuyForm: (value: boolean) => void;
  setPnr: (value: string) => void;
  setFlightNumber: (value: string) => void;
  setDepartureDate: (value: string) => void;
  setDepartureTime: (value: string) => void;
  setProductId: (value: string) => void;
  clearForm: () => void;
};

export type DashboardMainGridProps = {
  activeSection: string;
  showBuyForm: boolean;
  setShowBuyForm: (value: boolean) => void;
  connected: boolean;
  isSubmitting: boolean;
  handleBuy: () => void;
  productId: string;
  setProductId: (value: string) => void;
  products: unknown[];
  isLoadingProducts: boolean;
  showProductById: (id: string) => void;
  pnr: string;
  setPnr: (value: string) => void;
  pnrStatus: PnrStatus;
  setPnrStatus: (value: PnrStatus) => void;
  flightNumber: string;
  setFlightNumber: (value: string) => void;
  departureDate: string;
  setDepartureDate: (value: string) => void;
  departureTime: string;
  setDepartureTime: (value: string) => void;
  fetchedPassenger: unknown;
  setFetchedPassenger: (value: unknown) => void;
  existingPolicyForPnr: unknown;
  openPolicyModal: (policy: unknown) => void;
  isUsdcOptedIn: boolean | null;
  usdcBalance: number | null;
  canShowFaucet: boolean;
  handleOptInUsdc: () => void;
  isOptingInUsdc: boolean;
  peraWallet: unknown;
  policiesFetchError: string | null;
  fetchMyPolicies: () => void | Promise<void>;
  isLoadingPolicies: boolean;
  myPolicies: unknown[];
  showAllPolicies: boolean;
  setShowAllPolicies: (value: boolean) => void;
  peraExplorerBase: string;
  address?: string | null;
  selectedProductInfo: unknown;
  pnrRoute: PnrFlightRoute | null;
};
