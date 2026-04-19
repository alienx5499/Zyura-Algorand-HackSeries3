export type MyPoliciesSectionProps = {
  activeSection: string;
  connected: boolean;
  policiesFetchError: string | null;
  fetchMyPolicies: () => void | Promise<void>;
  isLoadingPolicies: boolean;
  myPolicies: any[];
  showAllPolicies: boolean;
  setShowAllPolicies: (value: boolean) => void;
  setShowBuyForm: (value: boolean) => void;
  peraExplorerBase: string;
  address?: string | null;
  openPolicyModal: (policy: any) => void;
};
