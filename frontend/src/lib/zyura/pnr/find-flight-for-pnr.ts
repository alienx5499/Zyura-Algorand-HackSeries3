import { FLIGHT_PATH, FLIGHT_REPO, GITHUB_BRANCH } from "./constants";

export type FlightPnrMatch = { flightData: any; matchingPnr: any };

export async function findFlightRecordForPnr(
  pnrUpper: string,
  folderNames: string[],
): Promise<FlightPnrMatch | null> {
  const flightResults = await Promise.all(
    folderNames.map(async (name) => {
      try {
        const flightFileUrl = `https://raw.githubusercontent.com/${FLIGHT_REPO}/${GITHUB_BRANCH}/${FLIGHT_PATH}/${name}/flight.json`;
        const flightResponse = await fetch(flightFileUrl, {
          next: { revalidate: 120 },
        });
        if (!flightResponse.ok) return null;
        const flightData = await flightResponse.json();
        const matchingPnr = flightData.pnrs?.find(
          (p: any) => p.pnr === pnrUpper,
        );
        if (!matchingPnr) return null;
        return { flightData, matchingPnr };
      } catch {
        return null;
      }
    }),
  );

  return flightResults.find((r): r is FlightPnrMatch => r !== null) ?? null;
}
