import { AlertCircle, ChevronDown, FileText, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { PolicyCard } from "@/components/dashboard/PolicyCard";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";

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
                  const toNum = (v: any) => {
                    const n = Number((v ?? 0).toString());
                    return Number.isFinite(n) ? n : 0;
                  };
                  const policyIdRaw = toNum(p.id);
                  const policyId = policyIdRaw > 0 ? policyIdRaw : index + 1;
                  const productIdAttr = toNum(p.product_id);
                  const dep = toNum(p.departure_time);
                  const premium6 = toNum(p.premium_paid);
                  const coverage6 = toNum(p.coverage_amount);

                  let status: "Active" | "PaidOut" | "Expired" = "Active";
                  const rawStatus = p.status;
                  if (typeof rawStatus === "number") {
                    if (rawStatus === 0) status = "Active";
                    else if (rawStatus === 1) status = "PaidOut";
                    else if (rawStatus === 2) status = "Expired";
                  } else if (rawStatus) {
                    if (
                      rawStatus.Active !== undefined ||
                      rawStatus.active !== undefined
                    ) {
                      status = "Active";
                    } else if (
                      rawStatus.PaidOut !== undefined ||
                      rawStatus.paidOut !== undefined ||
                      rawStatus.paid_out !== undefined
                    ) {
                      status = "PaidOut";
                    } else if (
                      rawStatus.Expired !== undefined ||
                      rawStatus.expired !== undefined
                    ) {
                      status = "Expired";
                    } else if (typeof rawStatus === "string") {
                      const statusStr = rawStatus as string;
                      if (statusStr.toLowerCase().includes("active"))
                        status = "Active";
                      else if (statusStr.toLowerCase().includes("paid"))
                        status = "PaidOut";
                      else if (statusStr.toLowerCase().includes("expired"))
                        status = "Expired";
                    } else {
                      const keys = Object.keys(rawStatus);
                      if (keys.length > 0) {
                        const key = keys[0];
                        if (key.toLowerCase().includes("active"))
                          status = "Active";
                        else if (key.toLowerCase().includes("paid"))
                          status = "PaidOut";
                        else if (key.toLowerCase().includes("expired"))
                          status = "Expired";
                      }
                    }
                  }

                  const departureDateObj =
                    dep > 0 ? new Date(dep * 1000) : null;
                  const departureIso =
                    departureDateObj &&
                    Number.isFinite(departureDateObj.getTime())
                      ? departureDateObj.toISOString()
                      : new Date().toISOString();
                  const premiumUsd = (
                    (Number.isFinite(premium6) ? premium6 : 0) / 1_000_000
                  ).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  });
                  const coverageUsd = (
                    (Number.isFinite(coverage6) ? coverage6 : 0) / 1_000_000
                  ).toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                  });

                  const explorerUrl = p.assetId
                    ? `https://testnet.explorer.perawallet.app/asset/${p.assetId}`
                    : address
                      ? `https://testnet.explorer.perawallet.app/address/${address}/`
                      : "";

                  const cardFlightFromMeta =
                    p.metadata?.flight ??
                    p.metadata?.attributes?.find(
                      (a: any) => a.trait_type === "Flight",
                    )?.value;
                  const cardPnrFromMeta =
                    p.metadata?.pnr ??
                    p.metadata?.attributes?.find(
                      (a: any) => a.trait_type === "PNR",
                    )?.value;
                  const cardFlightRaw = (
                    p.flight_number ||
                    cardFlightFromMeta ||
                    ""
                  )
                    .toString()
                    .trim();
                  const cardPnrRaw = (p.pnr ?? cardPnrFromMeta ?? "")
                    .toString()
                    .trim();
                  const cardFlight =
                    cardFlightRaw && cardFlightRaw !== "N/A"
                      ? cardFlightRaw
                      : "";
                  const cardPnr =
                    cardPnrRaw && cardPnrRaw !== "N/A" ? cardPnrRaw : "";

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
