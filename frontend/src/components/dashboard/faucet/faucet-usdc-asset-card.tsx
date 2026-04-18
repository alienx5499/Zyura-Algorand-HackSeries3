"use client";

import { Droplets, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FaucetSectionShell } from "@/components/dashboard/faucet/section-shell";

type FaucetUsdcAssetCardProps = {
  usdcAsaId: string;
  assetExplorerUrl: string;
};

export function FaucetUsdcAssetCard({
  usdcAsaId,
  assetExplorerUrl,
}: FaucetUsdcAssetCardProps) {
  if (!usdcAsaId) return null;

  return (
    <FaucetSectionShell>
      <Card className="relative overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black">
        <CardContent className="p-6 md:p-8">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="h-5 w-1 shrink-0 rounded-full bg-cyan-500" />
            USDC asset
          </h3>
          <p className="mb-2 text-xs leading-relaxed text-gray-500">
            The faucet sends this app&apos;s testnet USDC. Your wallet must be
            opted in to this asset to receive funds.
          </p>
          <p className="mb-4 break-all font-mono text-sm text-gray-200">
            {usdcAsaId}
          </p>
          {assetExplorerUrl ? (
            <a
              href={assetExplorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-indigo-500/45 bg-indigo-500/15 px-3 py-2.5 text-sm font-medium text-indigo-100 transition-colors duration-200 hover:border-indigo-400/55 hover:bg-indigo-500/25"
            >
              <Droplets className="h-4 w-4" />
              View asset on explorer
              <ExternalLink className="h-4 w-4 opacity-80" />
            </a>
          ) : null}
        </CardContent>
      </Card>
    </FaucetSectionShell>
  );
}
