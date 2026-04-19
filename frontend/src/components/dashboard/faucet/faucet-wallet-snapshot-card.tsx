"use client";

import { Copy, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { FAUCET_WALLET_CAP_USDC } from "@/components/dashboard/faucet/constants";
import { FaucetSectionShell } from "@/components/dashboard/faucet/section-shell";

type FaucetWalletSnapshotCardProps = {
  address: string | null | undefined;
  shortAddress: string;
  networkLabel: string;
  headroomUsdc: number;
  capFillPercent: number;
  maxNextPreset: number;
};

export function FaucetWalletSnapshotCard({
  address,
  shortAddress,
  networkLabel,
  headroomUsdc,
  capFillPercent,
  maxNextPreset,
}: FaucetWalletSnapshotCardProps) {
  return (
    <FaucetSectionShell>
      <Card className="relative overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black">
        <CardContent className="p-6 md:p-8">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="h-5 w-1 shrink-0 rounded-full bg-indigo-500" />
            Wallet snapshot
          </h3>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Address
                </span>
                {address ? (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(address);
                        toast.success("Address copied");
                      } catch {
                        toast.error("Copy failed");
                      }
                    }}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md p-1 text-gray-400 transition-colors hover:text-white"
                    aria-label="Copy address"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <p className="flex items-center gap-2 truncate font-mono text-sm text-gray-200">
                <Wallet className="h-4 w-4 shrink-0 text-cyan-500/70" />
                {shortAddress || "—"}
              </p>
            </div>
            <div className="h-px bg-gray-800/90" />
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-gray-500">Network</span>
              <span className="font-medium text-white">{networkLabel}</span>
            </div>
            <div className="flex justify-between gap-3 text-sm tabular-nums">
              <span className="text-gray-500">Headroom</span>
              <span className="font-medium text-white">
                {headroomUsdc.toFixed(2)} / {FAUCET_WALLET_CAP_USDC} USDC
              </span>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-gray-500">
                <span>Cap progress</span>
                <span className="tabular-nums">
                  {capFillPercent.toFixed(0)}%
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-gray-800"
                role="progressbar"
                aria-valuenow={Math.round(capFillPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-600/90 to-indigo-600/80 transition-all duration-300"
                  style={{ width: `${capFillPercent}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-gray-500">Largest preset</span>
              <span className="font-medium tabular-nums text-white">
                {maxNextPreset > 0 ? `${maxNextPreset} USDC` : "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </FaucetSectionShell>
  );
}
