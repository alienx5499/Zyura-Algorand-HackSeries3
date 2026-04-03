/*
 * purchasePolicy: premium to vault; processPayout: inner xfer from vault.
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
  getPurchasePolicyBoxReferences,
  getProcessPayoutBoxReferences,
  getLinkPolicyNftBoxReferences,
} from '../fixtures/setup';

describe('policy / purchase', () => {
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
      amount: BigInt(1000 * 1e6),
    });
  }, 15_000);

  test('user can purchase a policy', async () => {
    const policyId = BigInt(Date.now());
    const requiredPremium = (COVERAGE_AMOUNT * PREMIUM_RATE_BPS) / BigInt(10000);
    const premiumAmount = requiredPremium > PREMIUM_AMOUNT ? requiredPremium : PREMIUM_AMOUNT;

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

    const appClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.admin.addr,
    });
    const statusResult = await appClient.send.call({
      method: 'getPolicyStatus',
      args: [policyId],
    });
    expect(statusResult.return).toBe(BigInt(0));

    const holderResult = await appClient.send.call({
      method: 'getPolicyPolicyholder',
      args: [policyId],
    });
    expect(holderResult.return).toBe(ctx.user.addr);
  });

  test('rejects insufficient premium', async () => {
    const policyId = BigInt(Date.now() + 1);
    const insufficientPremium = BigInt(1 * 1e6);

    const premiumPayment = await ctx.algorand.createTransaction.assetTransfer({
      sender: ctx.user.addr,
      receiver: ctx.vault.addr,
      assetId: ctx.usdcMint,
      amount: insufficientPremium,
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
          'BB456',
          DEPARTURE_TIME,
          insufficientPremium,
          false,
          '',
          BigInt(0),
        ],
        populateAppCallResources: false,
        boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
      })
    ).rejects.toThrow();
  });
});

describe('policy / link NFT', () => {
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
      amount: BigInt(1000 * 1e6),
    });
  }, 15_000);

  test('policyholder can link policy NFT after mint', async () => {
    const policyId = BigInt(Date.now() + 5000);
    const requiredPremium = (COVERAGE_AMOUNT * PREMIUM_RATE_BPS) / BigInt(10000);
    const premiumAmount = requiredPremium > PREMIUM_AMOUNT ? requiredPremium : PREMIUM_AMOUNT;

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
      args: [premiumPayment, policyId, PRODUCT_ID, 'LNFT1', DEPARTURE_TIME, premiumAmount, false, '', BigInt(0)],
      populateAppCallResources: false,
      boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
    });

    const nftCreate = await ctx.algorand.send.assetCreate({
      sender: ctx.user.addr,
      total: BigInt(1),
      decimals: 0,
      assetName: 'Policy NFT',
      unitName: 'ZLNFT',
      url: 'https://example.com/m.json#arc3',
    });
    const nftId = BigInt(nftCreate.confirmation!.assetIndex!);

    await userClient.send.call({
      method: 'linkPolicyNft',
      args: [policyId, nftId],
      populateAppCallResources: false,
      boxReferences: getLinkPolicyNftBoxReferences(policyId),
      assetReferences: [nftId],
      accountReferences: [ctx.user.addr],
    });

    const readClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.admin.addr,
    });
    const linked = await readClient.send.call({
      method: 'getPolicyNftAssetId',
      args: [policyId],
    });
    expect(linked.return).toBe(nftId);
  });

  test('rejects duplicate linkPolicyNft', async () => {
    const policyId = BigInt(Date.now() + 5001);
    const requiredPremium = (COVERAGE_AMOUNT * PREMIUM_RATE_BPS) / BigInt(10000);
    const premiumAmount = requiredPremium > PREMIUM_AMOUNT ? requiredPremium : PREMIUM_AMOUNT;

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
      args: [premiumPayment, policyId, PRODUCT_ID, 'LNFT2', DEPARTURE_TIME, premiumAmount, false, '', BigInt(0)],
      populateAppCallResources: false,
      boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
    });

    const a = await ctx.algorand.send.assetCreate({
      sender: ctx.user.addr,
      total: BigInt(1),
      decimals: 0,
      assetName: 'NFT A',
      unitName: 'ZA',
      url: 'https://example.com/a.json#arc3',
    });
    const b = await ctx.algorand.send.assetCreate({
      sender: ctx.user.addr,
      total: BigInt(1),
      decimals: 0,
      assetName: 'NFT B',
      unitName: 'ZB',
      url: 'https://example.com/b.json#arc3',
    });
    const nftA = BigInt(a.confirmation!.assetIndex!);
    const nftB = BigInt(b.confirmation!.assetIndex!);

    await userClient.send.call({
      method: 'linkPolicyNft',
      args: [policyId, nftA],
      populateAppCallResources: false,
      boxReferences: getLinkPolicyNftBoxReferences(policyId),
      assetReferences: [nftA],
      accountReferences: [ctx.user.addr],
    });

    await expect(
      userClient.send.call({
        method: 'linkPolicyNft',
        args: [policyId, nftB],
        populateAppCallResources: false,
        boxReferences: getLinkPolicyNftBoxReferences(policyId),
        assetReferences: [nftB],
        accountReferences: [ctx.user.addr],
      })
    ).rejects.toThrow();
  });

  test('rejects link when NFT creator is not policyholder', async () => {
    const policyId = BigInt(Date.now() + 5002);
    const requiredPremium = (COVERAGE_AMOUNT * PREMIUM_RATE_BPS) / BigInt(10000);
    const premiumAmount = requiredPremium > PREMIUM_AMOUNT ? requiredPremium : PREMIUM_AMOUNT;

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
      args: [premiumPayment, policyId, PRODUCT_ID, 'LNFT3', DEPARTURE_TIME, premiumAmount, false, '', BigInt(0)],
      populateAppCallResources: false,
      boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
    });

    const adminNft = await ctx.algorand.send.assetCreate({
      sender: ctx.admin.addr,
      total: BigInt(1),
      decimals: 0,
      assetName: 'Admin NFT',
      unitName: 'ADM',
      url: 'https://example.com/x.json#arc3',
    });
    const adminNftId = BigInt(adminNft.confirmation!.assetIndex!);

    await ctx.algorand.send.assetOptIn({
      sender: ctx.user.addr,
      assetId: adminNftId,
    });
    await ctx.algorand.send.assetTransfer({
      sender: ctx.admin.addr,
      receiver: ctx.user.addr,
      assetId: adminNftId,
      amount: BigInt(1),
    });

    await expect(
      userClient.send.call({
        method: 'linkPolicyNft',
        args: [policyId, adminNftId],
        populateAppCallResources: false,
        boxReferences: getLinkPolicyNftBoxReferences(policyId),
        assetReferences: [adminNftId],
        accountReferences: [ctx.user.addr],
      })
    ).rejects.toThrow();
  });
});

describe('policy / link NFT (protocol issuer)', () => {
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
    await adminClient.send.call({
      method: 'setPolicyNftIssuer',
      args: [ctx.admin.addr],
    });

    await ctx.algorand.send.assetTransfer({
      sender: ctx.admin.addr,
      receiver: ctx.user.addr,
      assetId: ctx.usdcMint,
      amount: BigInt(1000 * 1e6),
    });
  }, 15_000);

  test('policyholder can link house-minted NFT when issuer matches global', async () => {
    const policyId = BigInt(Date.now() + 6000);
    const requiredPremium = (COVERAGE_AMOUNT * PREMIUM_RATE_BPS) / BigInt(10000);
    const premiumAmount = requiredPremium > PREMIUM_AMOUNT ? requiredPremium : PREMIUM_AMOUNT;

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
      args: [premiumPayment, policyId, PRODUCT_ID, 'HOUSE1', DEPARTURE_TIME, premiumAmount, false, '', BigInt(0)],
      populateAppCallResources: false,
      boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
    });

    const houseNft = await ctx.algorand.send.assetCreate({
      sender: ctx.admin.addr,
      total: BigInt(1),
      decimals: 0,
      assetName: 'Zyura Policy',
      unitName: 'ZHOUSE',
      url: 'https://example.com/h.json#arc3',
    });
    const nftId = BigInt(houseNft.confirmation!.assetIndex!);

    await ctx.algorand.send.assetOptIn({
      sender: ctx.user.addr,
      assetId: nftId,
    });
    await ctx.algorand.send.assetTransfer({
      sender: ctx.admin.addr,
      receiver: ctx.user.addr,
      assetId: nftId,
      amount: BigInt(1),
    });

    await userClient.send.call({
      method: 'linkPolicyNft',
      args: [policyId, nftId],
      populateAppCallResources: false,
      boxReferences: getLinkPolicyNftBoxReferences(policyId),
      assetReferences: [nftId],
      accountReferences: [ctx.user.addr],
    });

    const readClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.admin.addr,
    });
    const linked = await readClient.send.call({
      method: 'getPolicyNftAssetId',
      args: [policyId],
    });
    expect(linked.return).toBe(nftId);
  });
});

describe('policy / payout', () => {
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
      amount: BigInt(1000 * 1e6),
    });
  }, 15_000);

  test('admin can pay out when delay exceeds threshold', async () => {
    const policyId = BigInt(Date.now() + 100);
    const requiredPremium = (COVERAGE_AMOUNT * PREMIUM_RATE_BPS) / BigInt(10000);
    const premiumAmount = requiredPremium > PREMIUM_AMOUNT ? requiredPremium : PREMIUM_AMOUNT;

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
      args: [premiumPayment, policyId, PRODUCT_ID, 'DD999', DEPARTURE_TIME, premiumAmount, false, '', BigInt(0)],
      populateAppCallResources: false,
      boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
    });

    const delayMinutes = DELAY_THRESHOLD_MINUTES + BigInt(10);
    const payoutAdminClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.admin.addr,
    });

    await payoutAdminClient.send.call({
      method: 'processPayout',
      args: [policyId, delayMinutes],
      populateAppCallResources: false,
      boxReferences: getProcessPayoutBoxReferences(policyId),
      assetReferences: [ctx.usdcMint],
      accountReferences: [ctx.vault.addr, ctx.user.addr],
    });

    const adminClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.admin.addr,
    });
    const statusResult = await adminClient.send.call({
      method: 'getPolicyStatus',
      args: [policyId],
    });
    expect(statusResult.return).toBe(BigInt(1));
  });

  test('rejects payout when delay below threshold', async () => {
    const policyId = BigInt(Date.now() + 200);
    const requiredPremium = (COVERAGE_AMOUNT * PREMIUM_RATE_BPS) / BigInt(10000);
    const premiumAmount = requiredPremium > PREMIUM_AMOUNT ? requiredPremium : PREMIUM_AMOUNT;

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
      args: [premiumPayment, policyId, PRODUCT_ID, 'EE888', DEPARTURE_TIME, premiumAmount, false, '', BigInt(0)],
      populateAppCallResources: false,
      boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
    });

    const delayMinutes = DELAY_THRESHOLD_MINUTES - BigInt(5);
    const failPayoutClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.admin.addr,
    });
    await expect(
      failPayoutClient.send.call({
        method: 'processPayout',
        args: [policyId, delayMinutes],
        populateAppCallResources: false,
        boxReferences: getProcessPayoutBoxReferences(policyId),
        assetReferences: [ctx.usdcMint],
        accountReferences: [ctx.vault.addr, ctx.user.addr],
      })
    ).rejects.toThrow();
  });

  test('rejects payout after claim window', async () => {
    const policyId = BigInt(Date.now() + 300);
    const requiredPremium = (COVERAGE_AMOUNT * PREMIUM_RATE_BPS) / BigInt(10000);
    const premiumAmount = requiredPremium > PREMIUM_AMOUNT ? requiredPremium : PREMIUM_AMOUNT;
    const staleDeparture = BigInt(Math.floor(Date.now() / 1000) - 500_000);

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
      args: [premiumPayment, policyId, PRODUCT_ID, 'LATE1', staleDeparture, premiumAmount, false, '', BigInt(0)],
      populateAppCallResources: false,
      boxReferences: getPurchasePolicyBoxReferences(PRODUCT_ID, policyId),
    });

    const adminClient = ctx.algorand.client.getAppClientById({
      appSpec: ctx.appSpec as any,
      appId: ctx.appId,
      defaultSender: ctx.admin.addr,
    });

    await expect(
      adminClient.send.call({
        method: 'processPayout',
        args: [policyId, DELAY_THRESHOLD_MINUTES + BigInt(10)],
        populateAppCallResources: false,
        boxReferences: getProcessPayoutBoxReferences(policyId),
        assetReferences: [ctx.usdcMint],
        accountReferences: [ctx.vault.addr, ctx.user.addr],
      })
    ).rejects.toThrow();
  });
});
