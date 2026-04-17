import type {
  LastPurchaseTx,
  PnrFlightRoute,
  PnrStatus,
} from "@/lib/dashboard/types";

export type { PnrStatus };

export type PurchaseFormState = {
  pnr: string;
  flightNumber: string;
  departureDate: string;
  departureTime: string;
  productId: string;
  fetchedPassenger: any | null;
};

export type PurchaseCallbacks = {
  setFlightNumber: (value: string) => void;
  setDepartureDate: (value: string) => void;
  setDepartureTime: (value: string) => void;
  setPnr: (value: string) => void;
  setProductId: (value: string) => void;
  setFetchedPassenger: (value: any | null) => void;
  setPnrStatus: (value: PnrStatus) => void;
  setPnrRoute: (value: PnrFlightRoute | null) => void;
  setShowBuyForm: (value: boolean) => void;
  fetchMyPolicies: (bypassCache?: boolean) => void | Promise<void>;
  setLastPurchaseTx: (value: LastPurchaseTx) => void;
};

export type PurchaseInit = {
  connected: boolean;
  address?: string | null;
  peraWallet: any;
};

export type MetadataPreparation = {
  policyId: number;
  departureUnix: number;
  departureIso: string;
  premiumAmountMicro: bigint;
  premiumUsd: string;
  coverageUsd: string;
  metadataUri: string;
  assetURL: string;
  metadataFilename: string;
  metadata: Record<string, unknown>;
  nftName: string;
  nftUnitName: string;
  zyuraAppIdStr: string;
};

export type PurchaseExecutionInput = MetadataPreparation & {
  peraWallet: any;
  currentAddress: string;
  productId: string;
  flightNumber: string;
  pnr: string;
  departureDate: string;
  fetchedPassenger: any | null;
  address?: string | null;
};
