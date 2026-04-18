"use client";

import Link from "next/link";
import { Droplets } from "lucide-react";

type TestnetUsdcFaucetDialogProps = {
  usdcBalance: number;
};

/** Compact cyan callout inside Buy Insurance (popup keeps glowing card). */
export function TestnetUsdcFaucetCallout({
  usdcBalance,
}: TestnetUsdcFaucetDialogProps) {
  return (
    <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/[0.12] via-cyan-500/[0.04] to-black p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 shrink-0 rounded-lg border border-cyan-400/35 bg-cyan-500/15 p-2">
            <Droplets className="h-4 w-4 text-cyan-200" />
          </div>
          <div className="min-w-0 space-y-1">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-1 h-5 bg-cyan-500 rounded-full shrink-0" />
              Add test USDC
            </h4>
            <p className="text-xs text-gray-400 tabular-nums">
              Balance{" "}
              <span className="text-gray-200 font-medium">
                {usdcBalance.toFixed(2)}
              </span>{" "}
              USDC
            </p>
          </div>
        </div>
        <div className="shrink-0 flex sm:justify-end">
          <Link
            href="/dashboard/faucet"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-indigo-500/45 bg-indigo-500/15 text-sm font-medium text-indigo-100 hover:bg-indigo-500/25 hover:border-indigo-400/55 transition-colors cursor-pointer w-full sm:w-auto"
          >
            Open faucet
          </Link>
        </div>
      </div>
    </div>
  );
}
