import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { PolicyCard } from "@/components/dashboard/PolicyCard";
import {
  getDisplayFlightAndPnr,
  microToUsd,
  normalizePolicyStatus,
  toSafeNumber,
} from "@/lib/dashboard/policy-utils";
import { getAssetOrAddressExplorerUrl } from "@/lib/dashboard/explorer-utils";

type PoliciesGridProps = {
  policies: any[];
  showAllPolicies: boolean;
  setShowAllPolicies: (value: boolean) => void;
  peraExplorerBase: string;
  address?: string | null;
  openPolicyModal: (policy: any) => void;
};

export function PoliciesGrid({
  policies,
  showAllPolicies,
  setShowAllPolicies,
  peraExplorerBase,
  address,
  openPolicyModal,
}: PoliciesGridProps) {
  const visiblePolicies = showAllPolicies ? policies : policies.slice(0, 2);

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      {visiblePolicies.map((p, index) => {
        const policyIdRaw = toSafeNumber(p.id);
        const policyId = policyIdRaw > 0 ? policyIdRaw : index + 1;
        const productIdAttr = toSafeNumber(p.product_id);
        const dep = toSafeNumber(p.departure_time);
        const premium6 = toSafeNumber(p.premium_paid);
        const coverage6 = toSafeNumber(p.coverage_amount);
        const status = normalizePolicyStatus(p.status);
        const departureDateObj = dep > 0 ? new Date(dep * 1000) : null;
        const departureIso =
          departureDateObj && Number.isFinite(departureDateObj.getTime())
            ? departureDateObj.toISOString()
            : new Date().toISOString();
        const premiumUsd = microToUsd(premium6);
        const coverageUsd = microToUsd(coverage6);
        const explorerUrl = getAssetOrAddressExplorerUrl(
          peraExplorerBase,
          p.assetId,
          address,
        );
        const { flight: cardFlight, pnr: cardPnr } = getDisplayFlightAndPnr(p);

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
      })}

      {policies.length > 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="col-span-full mt-4 flex justify-center"
        >
          <motion.button
            onClick={() => setShowAllPolicies(!showAllPolicies)}
            whileHover={{ scale: 1.02, borderColor: "rgba(99, 102, 241, 0.6)" }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:border-indigo-500/50 hover:text-white"
          >
            {showAllPolicies ? (
              <>
                <ChevronDown className="h-4 w-4 rotate-180" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show All Policies ({policies.length})
              </>
            )}
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
