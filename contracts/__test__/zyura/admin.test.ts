/*
 * setPauseStatus (admin-only) and isPaused.
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { setupTestContext } from '../fixtures/setup';

describe('admin / pause', () => {
  let ctx: Awaited<ReturnType<typeof setupTestContext>>;

  beforeAll(async () => {
    ctx = await setupTestContext();
  }, 15_000);

  test('admin can pause', async () => {
    await ctx.appClient.send.call({
      method: 'setPauseStatus',
      args: [BigInt(1)],
      sender: ctx.admin.addr,
    });

    const result = await ctx.appClient.send.call({ method: 'isPaused', args: [] });
    expect(result.return).toBe(true);
  });

  test('admin can unpause', async () => {
    await ctx.appClient.send.call({
      method: 'setPauseStatus',
      args: [BigInt(0)],
      sender: ctx.admin.addr,
    });

    const result = await ctx.appClient.send.call({ method: 'isPaused', args: [] });
    expect(result.return).toBe(false);
  });

  test('non-admin cannot pause', async () => {
    await expect(
      ctx.appClient.send.call({
        method: 'setPauseStatus',
        args: [BigInt(1)],
        sender: ctx.user.addr,
      })
    ).rejects.toThrow();
  });

  test('rejects invalid pause value', async () => {
    await expect(
      ctx.appClient.send.call({
        method: 'setPauseStatus',
        args: [BigInt(2)],
        sender: ctx.admin.addr,
      })
    ).rejects.toThrow();
  });
});
