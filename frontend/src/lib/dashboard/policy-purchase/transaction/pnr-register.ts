export async function registerPnrAfterPurchase(params: {
  pnr: string;
  policyId: number;
  address?: string | null;
  flightNumber: string;
  departureDate: string;
  departureUnix: number;
  fetchedPassenger: unknown;
  metadataUri: string;
}): Promise<void> {
  const {
    pnr,
    policyId,
    address,
    flightNumber,
    departureDate,
    departureUnix,
    fetchedPassenger,
    metadataUri,
  } = params;

  const pnrRegisterRes = await fetch("/api/zyura/pnr/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pnr,
      policyId,
      policyholder: address,
      flightNumber,
      date: departureDate,
      departureUnix,
      passenger: fetchedPassenger,
      wallet: address,
      nft_metadata_url: metadataUri,
    }),
  });
  if (!pnrRegisterRes.ok) {
    const err = await pnrRegisterRes.json();
    console.warn("Failed to register PNR:", err);
  }
}
