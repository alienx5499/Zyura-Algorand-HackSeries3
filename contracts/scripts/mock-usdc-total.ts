/*
 * Mock test USDC ASA `total` in base units. Uses Number.MAX_SAFE_INTEGER so
 * algosdk `makeAssetCreateTxnWithSuggestedParamsFromObject({ total: Number(...) })` stays exact.
 * With 6 decimals that is ~9.01e9 whole USDC.
 */
export const MOCK_USDC_TOTAL_BASE_UNITS = BigInt(Number.MAX_SAFE_INTEGER);
