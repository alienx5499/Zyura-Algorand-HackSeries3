#!/usr/bin/env bash
# Reset a *local* metadata repo clone so it has exactly one commit: "Initial commit".
# Use this when the remote has many commits (e.g. 102) and you want a clean history
# with only the empty folder layout. You must push yourself (force) — see the end message.
#
# Layout matches frontend/src/lib/github-metadata-paths.ts defaults:
#   Flight/Metadata/flights/.gitkeep
#   NFT/metadata/.gitkeep
#
# Usage:
#   ./scripts/reset-metadata-repo-to-initial.sh /path/to/Zyura-Algorand-HackSeries3-MetaData
#
# Optional env (same names as the app):
#   GITHUB_FLIGHT_PATH   default Flight/Metadata/flights
#   GITHUB_NFT_PATH      default NFT/metadata
#
set -euo pipefail

TARGET="${1:-}"
if [[ -z "${TARGET}" ]]; then
  echo "Usage: $0 <path-to-metadata-repo-directory>" >&2
  echo "Example: $0 \"\$HOME/Developer/Zyura-Algorand-HackSeries3-MetaData\"" >&2
  exit 1
fi

FLIGHT_PATH="${GITHUB_FLIGHT_PATH:-Flight/Metadata/flights}"
NFT_PATH="${GITHUB_NFT_PATH:-NFT/metadata}"

mkdir -p "${TARGET}"
cd "${TARGET}"

rm -rf .git
# Remove everything else in the directory (fresh tree)
find . -mindepth 1 -maxdepth 1 -exec rm -rf {} +

mkdir -p "${FLIGHT_PATH}" "${NFT_PATH}"
: >"${FLIGHT_PATH}/.gitkeep"
: >"${NFT_PATH}/.gitkeep"

git init -b main
git add -A
git commit -m "Initial commit"

echo ""
echo "OK: ${TARGET} now has a single commit (Initial commit)."
echo "If this folder was cloned from GitHub, set the remote and force-push (you run this locally):"
echo "  cd \"${TARGET}\""
echo "  git remote add origin <your-https-or-ssh-url>   # skip if already set"
echo "  git push --force origin main"
echo ""
