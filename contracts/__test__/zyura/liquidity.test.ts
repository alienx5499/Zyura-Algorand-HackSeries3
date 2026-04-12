/*
 * depositLiquidity / withdrawLiquidity with vault transfers.
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { setupTestContext, getWithdrawLiquidityBoxReferences } from '../fixtures/setup';

describe('liquidity', () => {
  let ctx: Awaited<ReturnType<typeof setupTestContext>>;

  beforeAll(async () => {
    ctx = await setupTestContext();
    await ctx.algorand.send.assetTransfer({
      sender: ctx.admin.addr,
      receiver: ctx.liquidityProvider.addr,
      assetId: ctx.usdcMint,
      amount: BigInt(10_000 * 1e6),
    });
  }, 15_000);

  test('deposit updates LP totals', async () => {
    const depositAmount = BigInt(1000 * 1e6);

    const depositPayment = await ctx.algorand.createTransaction.assetTransfer({
      sender: ctx.liquidityProvider.addr,
      receiver: ctx.vault.addr,
      assetId: ctx.usdcMint,
      amount: depositAmount,
    });

    await ctx.algorand.client
      .getAppClientById({
        appSpec: ctx.appSpec as any,
        appId: ctx.appId,
        defaultSender: ctx.liquidityProvider.addr,
      })
      .send.call({
        method: 'depositLiquidity',
        args: [depositPayment, depositAmount],
      });

    const totalDeposited = await ctx.algorand.client
      .getAppClientById({
        appSpec: ctx.appSpec as any,
        appId: ctx.appId,
        defaultSender: ctx.admin.addr,
      })
      .send.call({
        method: 'getLpTotalDeposited',
        args: [ctx.liquidityProvider.addr],
      });
    expect(totalDeposited.return).toBe(depositAmount);

    const activeDeposit = await ctx.algorand.client
      .getAppClientById({
        appSpec: ctx.appSpec as any,
        appId: ctx.appId,
        defaultSender: ctx.admin.addr,
      })
      .send.call({
        method: 'getLpActiveDeposit',
        args: [ctx.liquidityProvider.addr],
      });
    expect(activeDeposit.return).toBe(depositAmount);
  });

  test('admin can withdraw for provider', async () => {
    const withdrawAmount = BigInt(500 * 1e6);

    const adminAppClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.admin.addr,
    });

    await adminAppClient.send.call({
      method: 'withdrawLiquidity',
      args: [ctx.liquidityProvider.addr, withdrawAmount],
      populateAppCallResources: false,
      boxReferences: getWithdrawLiquidityBoxReferences(ctx.liquidityProvider.addr),
      assetReferences: [ctx.usdcMint],
      accountReferences: [ctx.vault.addr, ctx.liquidityProvider.addr],
    });

    const activeDeposit = await adminAppClient.send.call({
      method: 'getLpActiveDeposit',
      args: [ctx.liquidityProvider.addr],
    });
    expect(activeDeposit.return).toBe(BigInt(500) * BigInt(1e6));
  });

  test('cannot withdraw more than active', async () => {
    const excessiveWithdraw = BigInt(10000 * 1e6);

    const adminAppClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.admin.addr,
    });

    await expect(
      adminAppClient.send.call({
        method: 'withdrawLiquidity',
        args: [ctx.liquidityProvider.addr, excessiveWithdraw],
        populateAppCallResources: false,
        boxReferences: getWithdrawLiquidityBoxReferences(ctx.liquidityProvider.addr),
        assetReferences: [ctx.usdcMint],
        accountReferences: [ctx.vault.addr, ctx.liquidityProvider.addr],
      })
    ).rejects.toThrow();
  });
});
