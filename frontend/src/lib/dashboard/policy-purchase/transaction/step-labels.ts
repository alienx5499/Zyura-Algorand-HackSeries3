export function getPurchaseStepLabels(needsUsdcOptIn: boolean): string[] {
  return needsUsdcOptIn
    ? [
        "Opt in to USDC",
        "Pay premium (USDC)",
        "Register your policy on Zyura",
        "Opt in to policy NFT",
        "Deliver policy NFT",
        "Link policy NFT to your policy",
        "Freeze policy NFT (soulbound)",
      ]
    : [
        "Pay premium (USDC)",
        "Register your policy on Zyura",
        "Opt in to policy NFT",
        "Deliver policy NFT",
        "Link policy NFT to your policy",
        "Freeze policy NFT (soulbound)",
      ];
}
