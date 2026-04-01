# CI/CD Guide

This repository uses GitHub Actions for CI only. Deployments are manual for both `frontend` and `contracts`.

## Workflows

- `.github/workflows/ci.yml`
  - Runs on `pull_request` and `push` to `main`/`master`
  - Frontend gates:
    - `pnpm format:check`
    - `pnpm lint`
    - `pnpm exec tsc --noEmit`
    - `pnpm build`
  - Contracts gates:
    - `pnpm format:check`
    - `pnpm lint`
    - `pnpm build` (compile + client generation)
  - Optional integration tests for contracts can be run manually with workflow dispatch input `run_contract_tests=true`.

- `.github/workflows/security-scan.yml`
  - Runs on `pull_request`, `push`, `merge_group`, and weekly schedule
  - Scans frontend and contracts dependencies with `pnpm audit` (`high`/`critical` threshold)
  - Runs TruffleHog secret scan
  - Runs GitHub dependency review on PRs

- `.github/workflows/typos.yml`
  - Runs typo/spell checks for `frontend`, `contracts`, and workflow/typos config changes

## Required GitHub Secrets

### Optional contracts test execution

- `ALGOD_SERVER`
- `ALGOD_TOKEN`
- `ALGOD_PORT` (optional)
- `INDEXER_SERVER` (optional)
- `INDEXER_TOKEN` (optional)
- `INDEXER_PORT` (optional)

## Manual Deployment

Use your local environment to deploy when needed:

- Frontend: deploy manually from `frontend` (for example, Vercel CLI/dashboard).
- Contracts: run your existing local deploy scripts from `contracts` (for example, `pnpm deploy:zyura`).

## Recommended Branch Protection

For robust quality gates, enable branch protection on `main`:

- Require PR before merge
- Require status checks to pass:
  - `Frontend - format, lint, typecheck, build`
  - `Contracts - format, lint, compile`
  - `Frontend dependency audit`
  - `Contracts dependency audit`
  - `Secret scan (TruffleHog)`
  - `Dependency review`
  - `Typos`
- Require up-to-date branch before merge
- Restrict direct pushes
