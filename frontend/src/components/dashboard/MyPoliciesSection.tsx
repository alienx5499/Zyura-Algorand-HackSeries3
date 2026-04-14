import { AlertCircle, ChevronDown, FileText, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { PolicyCard } from "@/components/dashboard/PolicyCard";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import {
  getDisplayFlightAndPnr,
  microToUsd,
  normalizePolicyStatus,
  toSafeNumber,
} from "@/lib/dashboard/policy-utils";
import { getAssetOrAddressExplorerUrl } from "@/lib/dashboard/explorer-utils";

type MyPoliciesSectionProps = {
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
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center"
              whileHover={{
                scale: 1.1,
                rotate: [0, -5, 5, -5, 0],
                transition: { duration: 0.5 },
              }}
            >
              <FileText className="w-5 h-5 text-emerald-400" />
            </motion.div>
            <h2 className="text-2xl font-semibold text-white">My Policies</h2>
            <AnimatePresence>
              {myPolicies.length > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="ml-auto px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/30"
                >
                  {myPolicies.length}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

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
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <SkeletonCard />
                </motion.div>
              ))}
            </motion.div>
          ) : myPolicies.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No Policies Yet"
              description="Purchase your first flight delay insurance policy to get started"
              action={{
                label: "Buy Policy",
                onClick: () => setShowBuyForm(true),
              }}
            />
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
            >
              {(showAllPolicies ? myPolicies : myPolicies.slice(0, 2)).map(
                (p, index) => {
                  const policyIdRaw = toSafeNumber(p.id);
                  const policyId = policyIdRaw > 0 ? policyIdRaw : index + 1;
                  const productIdAttr = toSafeNumber(p.product_id);
                  const dep = toSafeNumber(p.departure_time);
                  const premium6 = toSafeNumber(p.premium_paid);
                  const coverage6 = toSafeNumber(p.coverage_amount);
                  const status = normalizePolicyStatus(p.status);

                  const departureDateObj =
                    dep > 0 ? new Date(dep * 1000) : null;
                  const departureIso =
                    departureDateObj &&
                    Number.isFinite(departureDateObj.getTime())
                      ? departureDateObj.toISOString()
                      : new Date().toISOString();
                  const premiumUsd = microToUsd(premium6);
                  const coverageUsd = microToUsd(coverage6);

                  const explorerUrl = getAssetOrAddressExplorerUrl(
                    peraExplorerBase,
                    p.assetId,
                    address,
                  );
                  const { flight: cardFlight, pnr: cardPnr } =
                    getDisplayFlightAndPnr(p);

                  return (
                    <motion.div
                      key={`${policyId}-${index}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }}
                      whileHover={{ y: -4 }}
                    >
                      <PolicyCard
                        policyId={policyId}
                        status={status}
                        productId={productIdAttr}
                        flight={cardFlight}
                        pnr={cardPnr || undefined}
                        departureIso={departureIso}
                        premiumUsd={premiumUsd}
                        coverageUsd={coverageUsd}
                        explorerUrl={explorerUrl}
                        payoutTxId={p.payoutTxId}
                        onOpen={() => openPolicyModal(p)}
                      />
                    </motion.div>
                  );
                },
              )}

              {myPolicies.length > 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 flex justify-center col-span-full"
                >
                  <motion.button
                    onClick={() => setShowAllPolicies(!showAllPolicies)}
                    whileHover={{
                      scale: 1.02,
                      borderColor: "rgba(99, 102, 241, 0.6)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-white hover:border-indigo-500/50 text-sm font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    {showAllPolicies ? (
                      <>
                        <ChevronDown className="w-4 h-4 rotate-180" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        Show All Policies ({myPolicies.length})
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
}
