import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type PurchaseConfirmationCardProps = {
  policyId: string;
  nftAssetId?: string;
  purchasedAtIso: string;
  txId: string;
  groupId?: string;
  txExplorerUrl: string;
  groupExplorerUrl: string;
  onCopyGroupId: () => void | Promise<void>;
  onCopyTxId: () => void | Promise<void>;
};

export function PurchaseConfirmationCard({
  policyId,
  nftAssetId,
  purchasedAtIso,
  txId,
  groupId,
  txExplorerUrl,
  groupExplorerUrl,
  onCopyGroupId,
  onCopyTxId,
}: PurchaseConfirmationCardProps) {
  return (
    <Card className="relative overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black">
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-300">
                Purchase confirmed on-chain
              </p>
            </div>
            <p className="text-sm text-gray-300">
              Policy #{policyId}
              {nftAssetId ? ` · NFT ASA ${nftAssetId}` : ""}
              {" · "}
              {new Date(purchasedAtIso).toLocaleString()}
            </p>
            {!groupId && (
              <p className="mt-1 truncate text-xs text-gray-400">Tx: {txId}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {groupId ? (
              <>
                <button
                  type="button"
                  onClick={onCopyGroupId}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-gray-200 transition-colors hover:border-gray-600 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                  Copy Group ID
                </button>
                <a
                  href={groupExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  <ExternalLink className="h-4 w-4" />
                  View full atomic group
                </a>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onCopyTxId}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-gray-200 transition-colors hover:border-gray-600 hover:text-white"
                >
                  <Copy className="h-4 w-4" />
                  Copy Tx
                </button>
                <a
                  href={txExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Explorer
                </a>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
