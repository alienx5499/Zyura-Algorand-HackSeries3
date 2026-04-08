/**
 * Zyura-Algorand-HackSeries3-MetaData layout (single repo):
 *   Flight/Metadata/flights/{FLIGHT}/flight.json
 *   NFT/metadata/{wallet}/{policyId}/...
 *
 * Override with GITHUB_FLIGHT_PATH / GITHUB_NFT_PATH (and NEXT_PUBLIC_GITHUB_NFT_PATH for the browser).
 */

export function githubFlightPath(): string {
  return process.env.GITHUB_FLIGHT_PATH || "Flight/Metadata/flights";
}

export function githubNftPath(): string {
  return (
    process.env.GITHUB_NFT_PATH || process.env.GITHUB_PATH || "NFT/metadata"
  );
}

/** Browser must use NEXT_PUBLIC_* so raw.githubusercontent.com URLs match the server. */
export function githubNftPathPublic(): string {
  return (
    process.env.NEXT_PUBLIC_GITHUB_NFT_PATH ||
    process.env.GITHUB_NFT_PATH ||
    "NFT/metadata"
  );
}
