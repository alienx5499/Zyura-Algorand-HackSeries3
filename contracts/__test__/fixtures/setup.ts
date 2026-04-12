/*
 * Jest fixture: localnet Zyura app, mock USDC (see scripts/mock-usdc-total.ts), funded rekeyed vault.
 * Requires `npm run build`, `algokit localnet start`, then `npm run test`.
 */

import * as algokit from '@algorandfoundation/algokit-utils';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount';
import algosdk from 'algosdk';
import fs from 'fs/promises';
import path from 'path';
import { MOCK_USDC_TOTAL_BASE_UNITS } from '../../scripts/mock-usdc-total';

const fixture = algorandFixture();
algokit.Config.configure({ populateAppCallResources: true });

export const PRODUCT_ID = BigInt(1);
export const DELAY_THRESHOLD_MINUTES = BigInt(30);
export const COVERAGE_AMOUNT = BigInt(1000 * 1e6);
export const PREMIUM_RATE_BPS = BigInt(100);
export const CLAIM_WINDOW_HOURS = BigInt(24);
export const PREMIUM_AMOUNT = BigInt(10 * 1e6);
export const FLIGHT_NUMBER = 'AA123';
export const DEPARTURE_TIME = BigInt(Math.floor(Date.now() / 1000) - 7200);
export const ORACLE_APP_ID = BigInt(0);

function createBoxName(prefix: string, key: bigint | number): Uint8Array {
  const keyBytes = algosdk.encodeUint64(BigInt(key));
  const prefixBytes = new TextEncoder().encode(prefix);
  const result = new Uint8Array(prefixBytes.length + keyBytes.length);
  result.set(prefixBytes, 0);
  result.set(keyBytes, prefixBytes.length);
  return result;
}

/** Box refs for purchasePolicy (7): packed product boxes + policy rows (≤8 protocol limit). */
export function getPurchasePolicyBoxReferences(productId: bigint | number, policyId: bigint | number): Uint8Array[] {
  return [
    createBoxName('p_active', productId),
    createBoxName('p_pri', productId),
    createBoxName('p_sch', productId),
    createBoxName('pol_status', policyId),
    createBoxName('pol_holder', policyId),
    createBoxName('pol_coverage', policyId),
    createBoxName('pol_tim', policyId),
  ];
}

/** Box refs for linkPolicyNft (2): policyholder row + new pol_nft row. */
export function getLinkPolicyNftBoxReferences(policyId: bigint | number): Uint8Array[] {
  return [createBoxName('pol_holder', policyId), createBoxName('pol_nft', policyId)];
}

export function getProcessPayoutBoxReferences(policyId: bigint | number): Uint8Array[] {
  return [
    createBoxName('pol_status', policyId),
    createBoxName('pol_holder', policyId),
    createBoxName('pol_coverage', policyId),
    createBoxName('pol_paid', policyId),
    createBoxName('pol_tim', policyId),
  ];
}

export function getWithdrawLiquidityBoxReferences(providerAddr: string): Uint8Array[] {
  const addrBytes = algosdk.decodeAddress(providerAddr).publicKey;
  const active = new Uint8Array(new TextEncoder().encode('lp_active').length + addrBytes.length);
  active.set(new TextEncoder().encode('lp_active'), 0);
  active.set(addrBytes, new TextEncoder().encode('lp_active').length);
  const withdrawn = new Uint8Array(new TextEncoder().encode('lp_withdrawn').length + addrBytes.length);
  withdrawn.set(new TextEncoder().encode('lp_withdrawn'), 0);
  withdrawn.set(addrBytes, new TextEncoder().encode('lp_withdrawn').length);
  return [active, withdrawn];
}

export async function setupTestContext() {
  await fixture.beforeEach();
  const { testAccount, generateAccount, algorand } = fixture.context;

  const admin = await generateAccount({
    initialFunds: AlgoAmount.Algos(10),
    suppressLog: true,
  });
  const user = await generateAccount({
    initialFunds: AlgoAmount.Algos(10),
    suppressLog: true,
  });
  const liquidityProvider = await generateAccount({
    initialFunds: AlgoAmount.Algos(10),
    suppressLog: true,
  });
  const vault = await generateAccount({
    initialFunds: AlgoAmount.Algos(1),
    suppressLog: true,
  });

  const arc32Path = path.join(__dirname, '..', '..', 'artifacts', 'Zyura.arc32.json');
  let appSpec: string | Record<string, unknown>;
  try {
    const specBuffer = await fs.readFile(arc32Path);
    appSpec = JSON.parse(specBuffer.toString('utf-8'));
  } catch {
    throw new Error(`Could not load Zyura.arc32.json. Run 'algokit localnet start' then 'npm run build' first.`);
  }

  const appFactory = algorand.client.getAppFactory({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appSpec: appSpec as any,
    defaultSender: admin.addr,
  });
  const createOut = await appFactory.send.create({
    method: 'createApplication',
    args: [],
  });
  const { appId } = createOut.result;
  if (!appId) throw new Error('App creation failed');
  const appAddress = algosdk.getApplicationAddress(appId);

  const usdcCreate = await algorand.send.assetCreate({
    sender: admin.addr,
    total: MOCK_USDC_TOTAL_BASE_UNITS,
    decimals: 6,
    assetName: 'Test USDC',
    unitName: 'USDC',
    clawback: appAddress,
  });
  const usdcMint = BigInt(usdcCreate.confirmation!.assetIndex!);

  await algorand.send.assetOptIn({
    sender: liquidityProvider.addr,
    assetId: usdcMint,
  });
  await algorand.send.assetOptIn({
    sender: user.addr,
    assetId: usdcMint,
  });
  await algorand.send.assetOptIn({
    sender: vault.addr,
    assetId: usdcMint,
  });

  const deployedClient = appFactory.getAppClientById({
    appId,
  });

  await deployedClient.send.call({
    method: 'initialize',
    args: [admin.addr, usdcMint, ORACLE_APP_ID, vault.addr],
  });

  await algorand.send.payment({
    sender: admin.addr,
    receiver: appAddress,
    amount: AlgoAmount.Algos(1),
  });

  await algorand.account.rekeyAccount(vault, appAddress);

  await algorand.send.assetTransfer({
    sender: admin.addr,
    receiver: vault.addr,
    assetId: usdcMint,
    amount: BigInt(100_000 * 1e6),
  });

  return {
    fixture,
    algorand,
    admin,
    user,
    liquidityProvider,
    vault,
    testAccount,
    appSpec,
    appId,
    usdcMint,
    appClient: deployedClient,
  };
}

export type TestContext = Awaited<ReturnType<typeof setupTestContext>>;
