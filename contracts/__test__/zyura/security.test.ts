/*
 * End-to-end security: grouped axfer verification, admin-only ops, pause, invariants.
 * Every "rejects" case must fail on-chain (no silent success / no fallback path).
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import {
  setupTestContext,
  PRODUCT_ID,
  PREMIUM_AMOUNT,
  FLIGHT_NUMBER,
  DEPARTURE_TIME,
  COVERAGE_AMOUNT,
  DELAY_THRESHOLD_MINUTES,
  PREMIUM_RATE_BPS,
  CLAIM_WINDOW_HOURS,
  ORACLE_APP_ID,
  getPurchasePolicyBoxReferences,
  getProcessPayoutBoxReferences,
  getWithdrawLiquidityBoxReferences,
} from '../fixtures/setup';
import { MOCK_USDC_TOTAL_BASE_UNITS } from '../../scripts/mock-usdc-total';

function requiredPremiumMicro(): bigint {
  return (COVERAGE_AMOUNT * PREMIUM_RATE_BPS) / BigInt(10000);
}

describe('security / premium axfer must match declared payment', () => {
  let ctx: Awaited<ReturnType<typeof setupTestContext>>;

  beforeAll(async () => {
    ctx = await setupTestContext();
    const adminClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.admin.addr,
    });
    await adminClient.send.call({
      method: 'createProduct',
      args: [PRODUCT_ID, DELAY_THRESHOLD_MINUTES, COVERAGE_AMOUNT, PREMIUM_RATE_BPS, CLAIM_WINDOW_HOURS],
    });
    await ctx.algorand.send.assetTransfer({
      sender: ctx.admin.addr,
      receiver: ctx.user.addr,
      assetId: ctx.usdcMint,
      amount: BigInt(2000 * 1e6),
    });
  }, 30_000);

  test('rejects premium xfer to wrong receiver (not vault)', async () => {
    const policyId = BigInt(Date.now() + 3000);
    const req = requiredPremiumMicro();
    const premiumAmount = req > PREMIUM_AMOUNT ? req : PREMIUM_AMOUNT;

    const premiumPayment = await ctx.algorand.createTransaction.assetTransfer({
      sender: ctx.user.addr,
      receiver: ctx.user.addr,
      assetId: ctx.usdcMint,
      amount: premiumAmount,
    });

    const userClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.user.addr,
    });

    await expect(
      userClient.send.call({
        method: 'purchasePolicy',
        args: [
          premiumPayment,
          policyId,
          PRODUCT_ID,
          FLIGHT_NUMBER,
          DEPARTURE_TIME,
          premiumAmount,
          false,
          '',
          BigInt(0),
        ],
        populateAppCallResources: false,
        boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
      })
    ).rejects.toThrow();
  });

  test('rejects premium xfer of wrong ASA (not protocol USDC)', async () => {
    const policyId = BigInt(Date.now() + 3001);
    const req = requiredPremiumMicro();
    const premiumAmount = req > PREMIUM_AMOUNT ? req : PREMIUM_AMOUNT;

    const otherAsa = await ctx.algorand.send.assetCreate({
      sender: ctx.admin.addr,
      total: MOCK_USDC_TOTAL_BASE_UNITS,
      decimals: 6,
      assetName: 'Other',
      unitName: 'OTH',
    });
    const otherId = BigInt(otherAsa.confirmation!.assetIndex!);
    await ctx.algorand.send.assetOptIn({ sender: ctx.user.addr, assetId: otherId });
    await ctx.algorand.send.assetTransfer({
      sender: ctx.admin.addr,
      receiver: ctx.user.addr,
      assetId: otherId,
      amount: premiumAmount,
    });

    const badXfer = await ctx.algorand.createTransaction.assetTransfer({
      sender: ctx.user.addr,
      receiver: ctx.vault.addr,
      assetId: otherId,
      amount: premiumAmount,
    });

    const userClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.user.addr,
    });

    await expect(
      userClient.send.call({
        method: 'purchasePolicy',
        args: [badXfer, policyId, PRODUCT_ID, FLIGHT_NUMBER, DEPARTURE_TIME, premiumAmount, false, '', BigInt(0)],
        populateAppCallResources: false,
        boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
      })
    ).rejects.toThrow();
  });

  test('rejects when xfer amount is less than declared premiumAmount (cannot fake premium)', async () => {
    const policyId = BigInt(Date.now() + 3002);
    const req = requiredPremiumMicro();
    const declared = req > PREMIUM_AMOUNT ? req : PREMIUM_AMOUNT;
    const xferAmount = declared - BigInt(1);

    const premiumPayment = await ctx.algorand.createTransaction.assetTransfer({
      sender: ctx.user.addr,
      receiver: ctx.vault.addr,
      assetId: ctx.usdcMint,
      amount: xferAmount,
    });

    const userClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.user.addr,
    });

    await expect(
      userClient.send.call({
        method: 'purchasePolicy',
        args: [premiumPayment, policyId, PRODUCT_ID, FLIGHT_NUMBER, DEPARTURE_TIME, declared, false, '', BigInt(0)],
        populateAppCallResources: false,
        boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
      })
    ).rejects.toThrow();
  });

  test('rejects purchase while protocol is paused', async () => {
    const adminClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.admin.addr,
    });
    await adminClient.send.call({
      method: 'setPauseStatus',
      args: [BigInt(1)],
    });

    const policyId = BigInt(Date.now() + 3003);
    const req = requiredPremiumMicro();
    const premiumAmount = req > PREMIUM_AMOUNT ? req : PREMIUM_AMOUNT;
    const premiumPayment = await ctx.algorand.createTransaction.assetTransfer({
      sender: ctx.user.addr,
      receiver: ctx.vault.addr,
      assetId: ctx.usdcMint,
      amount: premiumAmount,
    });

    const userClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.user.addr,
    });

    await expect(
      userClient.send.call({
        method: 'purchasePolicy',
        args: [
          premiumPayment,
          policyId,
          PRODUCT_ID,
          FLIGHT_NUMBER,
          DEPARTURE_TIME,
          premiumAmount,
          false,
          '',
          BigInt(0),
        ],
        populateAppCallResources: false,
        boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
      })
    ).rejects.toThrow();

    await adminClient.send.call({
      method: 'setPauseStatus',
      args: [BigInt(0)],
    });
  });
});

describe('security / liquidity axfer verification', () => {
  let ctx: Awaited<ReturnType<typeof setupTestContext>>;

  beforeAll(async () => {
    ctx = await setupTestContext();
    await ctx.algorand.send.assetTransfer({
      sender: ctx.admin.addr,
      receiver: ctx.liquidityProvider.addr,
      assetId: ctx.usdcMint,
      amount: BigInt(50_000 * 1e6),
    });
  }, 30_000);

  test('rejects deposit xfer to wrong receiver', async () => {
    const amount = BigInt(100 * 1e6);
    const badXfer = await ctx.algorand.createTransaction.assetTransfer({
      sender: ctx.liquidityProvider.addr,
      receiver: ctx.liquidityProvider.addr,
      assetId: ctx.usdcMint,
      amount,
    });

    const lpClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.liquidityProvider.addr,
    });

    await expect(
      lpClient.send.call({
        method: 'depositLiquidity',
        args: [badXfer, amount],
      })
    ).rejects.toThrow();
  });

  test('rejects when deposit xfer amount is less than declared amount', async () => {
    const declared = BigInt(500 * 1e6);
    const xferAmount = declared - BigInt(1);
    const badXfer = await ctx.algorand.createTransaction.assetTransfer({
      sender: ctx.liquidityProvider.addr,
      receiver: ctx.vault.addr,
      assetId: ctx.usdcMint,
      amount: xferAmount,
    });

    const lpClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.liquidityProvider.addr,
    });

    await expect(
      lpClient.send.call({
        method: 'depositLiquidity',
        args: [badXfer, declared],
      })
    ).rejects.toThrow();
  });
});

describe('security / initialization and admin boundaries', () => {
  test('initialize cannot be called twice', async () => {
    const ctx = await setupTestContext();
    await expect(
      ctx.appClient.send.call({
        method: 'initialize',
        args: [ctx.admin.addr, ctx.usdcMint, ORACLE_APP_ID, ctx.vault.addr],
      })
    ).rejects.toThrow();
  });

  test('non-admin cannot processPayout', async () => {
    const ctx = await setupTestContext();
    const adminClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.admin.addr,
    });
    await adminClient.send.call({
      method: 'createProduct',
      args: [PRODUCT_ID, DELAY_THRESHOLD_MINUTES, COVERAGE_AMOUNT, PREMIUM_RATE_BPS, CLAIM_WINDOW_HOURS],
    });
    await ctx.algorand.send.assetTransfer({
      sender: ctx.admin.addr,
      receiver: ctx.user.addr,
      assetId: ctx.usdcMint,
      amount: BigInt(1000 * 1e6),
    });

    const policyId = BigInt(Date.now() + 4000);
    const req = requiredPremiumMicro();
    const premiumAmount = req > PREMIUM_AMOUNT ? req : PREMIUM_AMOUNT;
    const premiumPayment = await ctx.algorand.createTransaction.assetTransfer({
      sender: ctx.user.addr,
      receiver: ctx.vault.addr,
      assetId: ctx.usdcMint,
      amount: premiumAmount,
    });

    const userClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.user.addr,
    });
    await userClient.send.call({
      method: 'purchasePolicy',
      args: [premiumPayment, policyId, PRODUCT_ID, FLIGHT_NUMBER, DEPARTURE_TIME, premiumAmount, false, '', BigInt(0)],
      populateAppCallResources: false,
      boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
    });

    await expect(
      userClient.send.call({
        method: 'processPayout',
        args: [policyId, DELAY_THRESHOLD_MINUTES + BigInt(1)],
        populateAppCallResources: false,
        boxReferences: getProcessPayoutBoxReferences(policyId),
        assetReferences: [ctx.usdcMint],
        accountReferences: [ctx.vault.addr, ctx.user.addr],
      })
    ).rejects.toThrow();
  });

  test('non-admin cannot withdrawLiquidity', async () => {
    const ctx = await setupTestContext();
    await ctx.algorand.send.assetTransfer({
      sender: ctx.admin.addr,
      receiver: ctx.liquidityProvider.addr,
      assetId: ctx.usdcMint,
      amount: BigInt(5000 * 1e6),
    });

    const deposit = BigInt(200 * 1e6);
    const xfer = await ctx.algorand.createTransaction.assetTransfer({
      sender: ctx.liquidityProvider.addr,
      receiver: ctx.vault.addr,
      assetId: ctx.usdcMint,
      amount: deposit,
    });

    const lpClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.liquidityProvider.addr,
    });
    await lpClient.send.call({
      method: 'depositLiquidity',
      args: [xfer, deposit],
    });

    const userClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.user.addr,
    });

    let unauthorizedRejected = false;
    try {
      await userClient.send.call({
        method: 'withdrawLiquidity',
        args: [ctx.liquidityProvider.addr, BigInt(1 * 1e6)],
        populateAppCallResources: false,
        boxReferences: getWithdrawLiquidityBoxReferences(ctx.liquidityProvider.addr),
        assetReferences: [ctx.usdcMint],
        accountReferences: [ctx.vault.addr, ctx.liquidityProvider.addr],
      });
    } catch {
      unauthorizedRejected = true;
    }
    expect(unauthorizedRejected).toBe(true);
  });

  test('processPayout cannot be invoked twice for the same policy', async () => {
    const ctx = await setupTestContext();
    const adminClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.admin.addr,
    });
    await adminClient.send.call({
      method: 'createProduct',
      args: [PRODUCT_ID, DELAY_THRESHOLD_MINUTES, COVERAGE_AMOUNT, PREMIUM_RATE_BPS, CLAIM_WINDOW_HOURS],
    });
    await ctx.algorand.send.assetTransfer({
      sender: ctx.admin.addr,
      receiver: ctx.user.addr,
      assetId: ctx.usdcMint,
      amount: BigInt(1000 * 1e6),
    });

    const policyId = BigInt(Date.now() + 5000);
    const req = requiredPremiumMicro();
    const premiumAmount = req > PREMIUM_AMOUNT ? req : PREMIUM_AMOUNT;
    const premiumPayment = await ctx.algorand.createTransaction.assetTransfer({
      sender: ctx.user.addr,
      receiver: ctx.vault.addr,
      assetId: ctx.usdcMint,
      amount: premiumAmount,
    });

    const userClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.user.addr,
    });
    const status = await ctx.algorand.client.algod.status().do();
    const lastRound = Number(status['last-round'] ?? 0);
    const block = await ctx.algorand.client.algod.block(lastRound).do();
    const chainNow = BigInt(Number(block?.block?.ts ?? 0));
    const departureTime = chainNow > BigInt(3600) ? chainNow - BigInt(3600) : BigInt(0);

    await userClient.send.call({
      method: 'purchasePolicy',
      args: [premiumPayment, policyId, PRODUCT_ID, FLIGHT_NUMBER, departureTime, premiumAmount, false, '', BigInt(0)],
      populateAppCallResources: false,
      boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
    });

    const delayOk = DELAY_THRESHOLD_MINUTES + BigInt(5);
    await adminClient.send.call({
      method: 'processPayout',
      args: [policyId, delayOk],
      populateAppCallResources: false,
      boxReferences: getProcessPayoutBoxReferences(policyId),
      assetReferences: [ctx.usdcMint],
      accountReferences: [ctx.vault.addr, ctx.user.addr],
    });

    let secondPayoutRejected = false;
    try {
      await adminClient.send.call({
        method: 'processPayout',
        args: [policyId, delayOk],
        populateAppCallResources: false,
        boxReferences: getProcessPayoutBoxReferences(policyId),
        assetReferences: [ctx.usdcMint],
        accountReferences: [ctx.vault.addr, ctx.user.addr],
      });
    } catch {
      secondPayoutRejected = true;
    }
    expect(secondPayoutRejected).toBe(true);
  });
});
