/*
 * createProduct, updateProduct, create while paused.
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import {
  setupTestContext,
  PRODUCT_ID,
  DELAY_THRESHOLD_MINUTES,
  COVERAGE_AMOUNT,
  PREMIUM_RATE_BPS,
  CLAIM_WINDOW_HOURS,
} from '../fixtures/setup';

describe('product', () => {
  let ctx: Awaited<ReturnType<typeof setupTestContext>>;

  beforeAll(async () => {
    ctx = await setupTestContext();
  }, 15_000);

  test('create stores fields and marks active', async () => {
    await ctx.appClient.send.call({
      method: 'createProduct',
      args: [PRODUCT_ID, DELAY_THRESHOLD_MINUTES, COVERAGE_AMOUNT, PREMIUM_RATE_BPS, CLAIM_WINDOW_HOURS],
      sender: ctx.admin.addr,
    });

    const delayResult = await ctx.appClient.send.call({
      method: 'getProductDelayThreshold',
      args: [PRODUCT_ID],
    });
    expect(delayResult.return).toBe(DELAY_THRESHOLD_MINUTES);

    const coverageResult = await ctx.appClient.send.call({
      method: 'getProductCoverageAmount',
      args: [PRODUCT_ID],
    });
    expect(coverageResult.return).toBe(COVERAGE_AMOUNT);

    const activeResult = await ctx.appClient.send.call({
      method: 'isProductActive',
      args: [PRODUCT_ID],
    });
    expect(activeResult.return).toBe(true);
  });

  test('admin can update parameters', async () => {
    const newDelayThreshold = BigInt(45);
    const newCoverageAmount = BigInt(2000 * 1e6);

    await ctx.appClient.send.call({
      method: 'updateProduct',
      args: [PRODUCT_ID, newDelayThreshold, newCoverageAmount, PREMIUM_RATE_BPS, CLAIM_WINDOW_HOURS],
      sender: ctx.admin.addr,
    });

    const delayResult = await ctx.appClient.send.call({
      method: 'getProductDelayThreshold',
      args: [PRODUCT_ID],
    });
    expect(delayResult.return).toBe(newDelayThreshold);

    const coverageResult = await ctx.appClient.send.call({
      method: 'getProductCoverageAmount',
      args: [PRODUCT_ID],
    });
    expect(coverageResult.return).toBe(newCoverageAmount);
  });

  test('cannot create product while paused', async () => {
    await ctx.appClient.send.call({
      method: 'setPauseStatus',
      args: [BigInt(1)],
      sender: ctx.admin.addr,
    });

    const pausedProductId = BigInt(999);
    await expect(
      ctx.appClient.send.call({
        method: 'createProduct',
        args: [pausedProductId, DELAY_THRESHOLD_MINUTES, COVERAGE_AMOUNT, PREMIUM_RATE_BPS, CLAIM_WINDOW_HOURS],
        sender: ctx.admin.addr,
      })
    ).rejects.toThrow();

    await ctx.appClient.send.call({
      method: 'setPauseStatus',
      args: [BigInt(0)],
      sender: ctx.admin.addr,
    });
  });
});
