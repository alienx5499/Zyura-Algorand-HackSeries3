"use client";

import { Navbar } from "@/components/ui/navbar";
import { InteractiveTutorial } from "@/components/dashboard/InteractiveTutorial";
import { PolicyModal } from "@/components/dashboard/PolicyModal";
import { DashboardHeader } from "@/app/dashboard/_components/DashboardHeader";
import { DashboardMainGrid } from "@/app/dashboard/_components/DashboardMainGrid";
import { DashboardPurchaseBanner } from "@/app/dashboard/_components/DashboardPurchaseBanner";
import type { LastPurchaseTx } from "@/lib/dashboard/types";
import type {
  DashboardMainGridProps,
  DashboardTutorialFormHandlers,
} from "@/app/dashboard/_components/types";

type DashboardShellProps = {
  lastPurchaseTx: LastPurchaseTx | null;
  txExplorerUrl: string;
  groupExplorerUrl: string;
  mainGridProps: DashboardMainGridProps;
  showPolicyModal: boolean;
  closePolicyModal: () => void;
  policyModalData: unknown;
  tutorialFormHandlers: DashboardTutorialFormHandlers;
};

export function DashboardShell({
  lastPurchaseTx,
  txExplorerUrl,
  groupExplorerUrl,
  mainGridProps,
  showPolicyModal,
  closePolicyModal,
  policyModalData,
  tutorialFormHandlers,
}: DashboardShellProps) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black pt-24 pb-16">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <DashboardHeader />
          <DashboardPurchaseBanner
            lastPurchaseTx={lastPurchaseTx}
            txExplorerUrl={txExplorerUrl}
            groupExplorerUrl={groupExplorerUrl}
          />
          <DashboardMainGrid {...mainGridProps} />
        </div>
      </main>
      <PolicyModal
        isOpen={showPolicyModal}
        onClose={closePolicyModal}
        data={policyModalData}
      />
      <InteractiveTutorial formHandlers={tutorialFormHandlers} />
    </>
  );
}
