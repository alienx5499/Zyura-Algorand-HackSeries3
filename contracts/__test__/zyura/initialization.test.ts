/*
 * Global state after setupTestContext(): admin, pause, USDC, oracle, vault.
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { setupTestContext, ORACLE_APP_ID } from '../fixtures/setup';

describe('initialization', () => {
  let ctx: Awaited<ReturnType<typeof setupTestContext>>;

  beforeAll(async () => {
    ctx = await setupTestContext();
  }, 15_000);

  test('globals match fixture', async () => {
    const getAdminResult = await ctx.appClient.send.call({ method: 'getAdmin', args: [] });
    expect(getAdminResult.return).toBe(ctx.admin.addr);

    const isPausedResult = await ctx.appClient.send.call({ method: 'isPaused', args: [] });
    expect(isPausedResult.return).toBe(false);

    const usdcMintResult = await ctx.appClient.send.call({ method: 'getUsdcMint', args: [] });
    expect(usdcMintResult.return).toBe(ctx.usdcMint);

    const oracleResult = await ctx.appClient.send.call({ method: 'getOracleAppId', args: [] });
    expect(oracleResult.return).toBe(ORACLE_APP_ID);

    const vaultResult = await ctx.appClient.send.call({ method: 'getRiskPoolVault', args: [] });
    expect(vaultResult.return).toBe(ctx.vault.addr);
  });
});
