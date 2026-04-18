"use client";

import { Copy } from "lucide-react";

type AddressRowProps = {
  returnAddress: string;
  shortReturnAddress: string;
  onCopy: () => void | Promise<void>;
};

export function AddressRow({
  returnAddress,
  shortReturnAddress,
  onCopy,
}: AddressRowProps) {
  return (
    <div className="rounded-xl border border-gray-800/90 bg-gray-950/70 p-3.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        Return address
      </p>
      <div className="flex min-w-0 items-center gap-2">
        <p
          className="min-w-0 flex-1 truncate font-mono text-sm text-gray-200"
          title={returnAddress}
        >
          {shortReturnAddress}
        </p>
        <button
          type="button"
          onClick={() => void onCopy()}
          aria-label="Copy full address"
          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-700/90 bg-gray-950/80 p-2 text-gray-400 transition-colors duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white"
        >
          <Copy className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
