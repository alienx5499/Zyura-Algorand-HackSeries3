export function getPolicyPnr(p: any): string {
  return (
    p.pnr ??
    p.metadata?.pnr ??
    p.metadata?.attributes?.find((a: any) => a.trait_type === "PNR")?.value ??
    ""
  )
    .toString()
    .trim();
}
