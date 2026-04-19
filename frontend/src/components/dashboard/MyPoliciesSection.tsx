import { AlertCircle, Search, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { PolicyFetchLottie } from "@/components/dashboard/policy-fetch-lottie";
import { PoliciesGrid } from "@/components/dashboard/my-policies/PoliciesGrid";
import { PoliciesHeader } from "@/components/dashboard/my-policies/PoliciesHeader";
import { PolicySearchBar } from "@/components/dashboard/my-policies/PolicySearchBar";
import type { MyPoliciesSectionProps } from "@/components/dashboard/my-policies/types";
import { usePolicySearch } from "@/components/dashboard/my-policies/usePolicySearch";

export function MyPoliciesSection({
  activeSection,
  connected,
  policiesFetchError,
  fetchMyPolicies,
  isLoadingPolicies,
  myPolicies,
  showAllPolicies,
  setShowAllPolicies,
  setShowBuyForm,
  peraExplorerBase,
  address,
  openPolicyModal,
}: MyPoliciesSectionProps) {
  const [policySearch, setPolicySearch] = useState("");
  const filteredPolicies = usePolicySearch(myPolicies, policySearch);

  return (
    <motion.section
      id="policies"
      data-section="policies"
      initial={{ opacity: 0, y: 30 }}
      animate={{
        opacity: 1,
        y: 0,
        borderColor:
          activeSection === "policies" ? "rgba(16, 185, 129, 0.5)" : undefined,
      }}
      transition={{
        delay: 0.2,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-3xl md:p-3 scroll-mt-32"
    >
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={3}
      />
      <Card className="relative overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black">
        <CardContent className="p-6 md:p-8">
          <PoliciesHeader
            totalPolicies={myPolicies.length}
            filteredCount={filteredPolicies.length}
          />

          {myPolicies.length > 0 && (
            <PolicySearchBar value={policySearch} onChange={setPolicySearch} />
          )}

          {!connected ? (
            <EmptyState
              icon={ShieldCheck}
              title="Connect Your Wallet"
              description="Connect your wallet to view your insurance policies"
            />
          ) : policiesFetchError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load policies"
              description={policiesFetchError}
              action={{
                label: "Try again",
                onClick: () => fetchMyPolicies(),
              }}
            />
          ) : isLoadingPolicies ? (
            <motion.div
              className="flex justify-center py-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <PolicyFetchLottie />
            </motion.div>
          ) : myPolicies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-2 text-center">
              <PolicyFetchLottie
                lottieClassName="h-24 w-24"
                loop={false}
                autoplay={false}
              />
              <h3 className="mt-3 text-lg font-semibold text-white">
                No Policies Yet
              </h3>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                Purchase your first flight delay insurance policy to get started
              </p>
              <button
                type="button"
                onClick={() => setShowBuyForm(true)}
                className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-lg border border-indigo-500/45 bg-indigo-500/15 px-3 py-2.5 text-sm font-medium text-indigo-100 transition-colors duration-200 hover:border-indigo-400/55 hover:bg-indigo-500/25"
              >
                Buy Policy
              </button>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching policies"
              description="Try searching with flight number, PNR, policy ID, status, or product ID."
            />
          ) : (
            <PoliciesGrid
              policies={filteredPolicies}
              showAllPolicies={showAllPolicies}
              setShowAllPolicies={setShowAllPolicies}
              peraExplorerBase={peraExplorerBase}
              address={address}
              openPolicyModal={openPolicyModal}
            />
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
}
