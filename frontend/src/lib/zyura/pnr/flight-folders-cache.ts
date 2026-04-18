import { unstable_cache } from "next/cache";
import { FLIGHT_PATH, FLIGHT_REPO, GITHUB_BRANCH } from "./constants";

export const getFlightFolderNamesCached = unstable_cache(
  async (): Promise<string[]> => {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
    const flightsDirUrl = `https://api.github.com/repos/${FLIGHT_REPO}/contents/${FLIGHT_PATH}?ref=${GITHUB_BRANCH}`;
    const baseHeaders: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    };

    let dirResponse = await fetch(flightsDirUrl, {
      headers: baseHeaders,
      next: { revalidate: 120 },
    });

    if (
      !dirResponse.ok &&
      (dirResponse.status === 401 || dirResponse.status === 403) &&
      GITHUB_TOKEN
    ) {
      dirResponse = await fetch(flightsDirUrl, {
        headers: {
          ...baseHeaders,
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
        next: { revalidate: 120 },
      });
      if (!dirResponse.ok && dirResponse.status === 401 && GITHUB_TOKEN) {
        dirResponse = await fetch(flightsDirUrl, {
          headers: {
            ...baseHeaders,
            Authorization: `token ${GITHUB_TOKEN}`,
          },
          next: { revalidate: 120 },
        });
      }
    }

    if (!dirResponse.ok) {
      throw new Error(
        `GitHub directory ${dirResponse.status}: ${dirResponse.statusText}`,
      );
    }

    const flightFolders: unknown = await dirResponse.json();
    if (!Array.isArray(flightFolders)) return [];
    return flightFolders
      .filter((f: any) => f?.type === "dir" && typeof f?.name === "string")
      .map((f: any) => f.name as string);
  },
  ["zyura-pnr-flight-folders", FLIGHT_REPO, GITHUB_BRANCH, FLIGHT_PATH],
  { revalidate: 120 },
);
