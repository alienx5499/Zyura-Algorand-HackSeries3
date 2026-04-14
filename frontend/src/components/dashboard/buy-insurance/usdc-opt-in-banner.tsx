"use client";

type UsdcOptInBannerProps = {
  connected: boolean;
  peraWallet: unknown;
  isOptingInUsdc: boolean;
  isSubmitting: boolean;
  handleOptInUsdc: () => void | Promise<void>;
};

export function UsdcOptInBanner({
  connected,
  peraWallet,
  isOptingInUsdc,
  isSubmitting,
  handleOptInUsdc,
}: UsdcOptInBannerProps) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-amber-200/90">
        First time? Your wallet must opt in to USDC (Testnet) before you can pay
        the premium. One-time step.
      </p>
      <button
        type="button"
        onClick={handleOptInUsdc}
        disabled={!connected || !peraWallet || isOptingInUsdc || isSubmitting}
        className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
      >
        {isOptingInUsdc
          ? "Sign in wallet…"
          : !peraWallet
            ? "Loading…"
            : "Opt in to USDC"}
      </button>
    </div>
  );
}
