"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { FaucetSectionShell } from "@/components/dashboard/faucet/section-shell";

type LastSend = {
  txId: string;
  amount: number;
  sentAtIso: string;
};

type FaucetLastTransferBannerProps = {
  lastSend: LastSend | null;
  txExplorerUrl: string;
};

export function FaucetLastTransferBanner({
  lastSend,
  txExplorerUrl,
}: FaucetLastTransferBannerProps) {
  return (
    <AnimatePresence>
      {lastSend && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <FaucetSectionShell>
            <Card className="relative overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black">
              <CardContent className="p-4 md:p-5">
                <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <p className="text-sm font-semibold text-emerald-300">
                        Transfer confirmed on-chain
                      </p>
                    </div>
                    <p className="text-sm text-gray-300">
                      +{lastSend.amount} test USDC ·{" "}
                      {new Date(lastSend.sentAtIso).toLocaleString()}
                    </p>
                    <p className="mt-1 truncate font-mono text-xs text-gray-400">
                      Tx: {lastSend.txId}
                    </p>
                  </div>
                  <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 md:ml-auto md:w-auto">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(lastSend.txId);
                          toast.success("Transaction ID copied");
                        } catch {
                          toast.error("Failed to copy transaction ID");
                        }
                      }}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-gray-200 transition-colors duration-200 hover:border-gray-600 hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Tx
                    </button>
                    {txExplorerUrl ? (
                      <a
                        href={txExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-indigo-500"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on Explorer
                      </a>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </FaucetSectionShell>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
