import { githubFlightPath, githubNftPath } from "@/lib/github-metadata-paths";

export const FLIGHT_REPO =
  process.env.GITHUB_FLIGHT_REPO ||
  process.env.GITHUB_METADATA_REPO ||
  "alienx5499/Zyura-Algorand-HackSeries3-MetaData";

export const GITHUB_NFT_REPO =
  process.env.GITHUB_NFT_REPO ||
  process.env.GITHUB_METADATA_REPO ||
  FLIGHT_REPO;

export const GITHUB_BRANCH =
  process.env.GITHUB_FLIGHT_BRANCH || process.env.GITHUB_BRANCH || "main";

export const FLIGHT_PATH = githubFlightPath();

export const NFT_METADATA_PATH = githubNftPath();
