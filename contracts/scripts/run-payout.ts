/**
 * Run processPayout for one or more policies (admin only).
 *
 * Prerequisites:
 * - contracts: npm run build (so artifacts/Zyura.arc32.json exists)
 * - frontend .env: ADMIN_MNEMONIC, NEXT_PUBLIC_ZYURA_APP_ID, NEXT_PUBLIC_ALGOD_URL,
 *   NEXT_PUBLIC_USDC_ASA_ID, RISK_POOL_VAULT_ADDR (optional; read from app if not set)
 *
 * Usage:
 *   cd contracts
 *   POLICY_ID=549523 DELAY_MINUTES=75 npx ts-node scripts/run-payout.ts
 *   POLICY_IDS=549523,548034 DELAY_MINUTES=75 npx ts-node scripts/run-payout.ts
 */

import * as fs from 'fs/promises';
import path from 'path';
import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import dotenv from 'dotenv';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';

async function loadEnv() {
  const frontendDir = path.resolve(__dirname, '../../frontend');
  for (const p of [path.join(frontendDir, '.env.local'), path.join(frontendDir, '.env')]) {
    try {
      await fs.access(p);
      dotenv.config({ path: p, override: true });
      return;
    } catch {
      /* ignore */
    }
  }
}

function createBoxName(prefix: string, policyId: bigint | number): Uint8Array {
  const keyBytes = algosdk.encodeUint64(BigInt(policyId));
  const prefixBytes = new TextEncoder().encode(prefix);
  const result = new Uint8Array(prefixBytes.length + keyBytes.length);
  result.set(prefixBytes, 0);
  result.set(keyBytes, prefixBytes.length);
  return result;
}

function getProcessPayoutBoxReferences(policyId: bigint | number): Uint8Array[] {
  return [
    createBoxName('pol_status', policyId),
    createBoxName('pol_holder', policyId),
    createBoxName('pol_coverage', policyId),
    createBoxName('pol_paid', policyId),
    createBoxName('pol_tim', policyId),
  ];
}

type Network = 'localnet' | 'testnet' | 'betanet' | 'mainnet';

async function main() {
  await loadEnv();

  const policyIdsEnv = process.env.POLICY_ID || process.env.POLICY_IDS;
  const delayMinutesEnv = process.env.DELAY_MINUTES;

  if (!policyIdsEnv || !delayMinutesEnv) {
    console.error('Usage: POLICY_ID=549523 DELAY_MINUTES=75 npx ts-node scripts/run-payout.ts');
    console.error('   or: POLICY_IDS=549523,548034 DELAY_MINUTES=75 npx ts-node scripts/run-payout.ts');
    process.exit(1);
  }

  const policyIds = policyIdsEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((id) => BigInt(id));
  const delayMinutes = BigInt(delayMinutesEnv);

  const algodUrl = process.env.NEXT_PUBLIC_ALGOD_URL;
  const algodToken = process.env.NEXT_PUBLIC_ALGOD_TOKEN || '';
  const algodNetwork = (process.env.NEXT_PUBLIC_ALGOD_NETWORK || 'testnet') as Network;
  const appIdStr = process.env.NEXT_PUBLIC_ZYURA_APP_ID;
  const usdcAsaIdStr = process.env.NEXT_PUBLIC_USDC_ASA_ID;

  if (!algodUrl || !appIdStr || !usdcAsaIdStr) {
    console.error('Set NEXT_PUBLIC_ALGOD_URL, NEXT_PUBLIC_ZYURA_APP_ID, NEXT_PUBLIC_USDC_ASA_ID in frontend .env');
    process.exit(1);
  }

  let adminMnemonic: string | undefined = process.env.ADMIN_MNEMONIC;
  if (!adminMnemonic || adminMnemonic.split(/\s+/).length <= 1) {
    const frontendDir = path.resolve(__dirname, '../../frontend');
    let envContent = '';
    try {
      envContent = await fs.readFile(path.join(frontendDir, '.env'), 'utf-8').catch(() => '');
      if (!envContent) envContent = await fs.readFile(path.join(frontendDir, '.env.local'), 'utf-8').catch(() => '');
    } catch {}
    const m =
      envContent.match(/^ADMIN_MNEMONIC\s*=\s*"([^"]+)"\s*$/m) ||
      envContent.match(/^ADMIN_MNEMONIC\s*=\s*'([^']+)'\s*$/m) ||
      envContent.match(/^ADMIN_MNEMONIC\s*=\s*([^\n]+)\s*$/m);
    if (m && m[1]) adminMnemonic = m[1].trim();
  } else {
    adminMnemonic = adminMnemonic.replace(/^["'](.+)["']$/, '$1').trim();
  }

  if (!adminMnemonic) {
    console.error('ADMIN_MNEMONIC must be set in frontend .env');
    process.exit(1);
  }

  let algorand: algokit.AlgorandClient;
  if (algodNetwork === 'testnet' && (!algodUrl || algodUrl.includes('algonode'))) {
    algorand = algokit.AlgorandClient.testNet();
  } else {
    const token = algodUrl.includes('purestake.io') ? { 'X-API-Key': algodToken } : algodToken;
    const algod = new algosdk.Algodv2(token as any, algodUrl, '');
    algorand = algokit.AlgorandClient.fromClients({ algod });
  }

  const mnemonicWords = adminMnemonic.trim().split(/\s+/);
  let admin: algosdk.Account;
  if (mnemonicWords.length === 25) {
    admin = algosdk.mnemonicToSecretKey(adminMnemonic);
  } else if (mnemonicWords.length === 24) {
    const seedBuffer = await bip39.mnemonicToSeed(adminMnemonic);
    const seedHex = seedBuffer.toString('hex');
    const derived = derivePath("m/44'/283'/0'/0'/0'", seedHex);
    const privateKey = derived.key.slice(0, 32);
    const algoMnemonic = algosdk.secretKeyToMnemonic(privateKey);
    admin = algosdk.mnemonicToSecretKey(algoMnemonic);
  } else {
    console.error('ADMIN_MNEMONIC must be 24 or 25 words');
    process.exit(1);
  }

  algorand.setSignerFromAccount(admin);

  const arc32Path = path.resolve(__dirname, '..', 'artifacts', 'Zyura.arc32.json');
  const appSpec = JSON.parse((await fs.readFile(arc32Path)).toString('utf-8'));
  const appId = BigInt(appIdStr);
  const usdcAsaId = BigInt(usdcAsaIdStr);

  const appFactory = algorand.client.getAppFactory({
    appSpec,
    defaultSender: admin.addr,
  });
  const client = appFactory.getAppClientById({ appId });

  const vaultResult = await client.send.call({ method: 'getRiskPoolVault', args: [] });
  const vaultAddr = vaultResult.return as string;
  if (!vaultAddr) {
    console.error('Could not read risk pool vault from app');
    process.exit(1);
  }

  for (const policyId of policyIds) {
    const policyholderResult = await client.send.call({ method: 'getPolicyPolicyholder', args: [policyId] });
    const policyholderAddr = policyholderResult.return as string;
    if (!policyholderAddr) {
      console.error(`Policy ${policyId}: policy not found or no policyholder`);
      continue;
    }

    const boxRefs = getProcessPayoutBoxReferences(policyId);
    await client.send.call({
      method: 'processPayout',
      args: [policyId, delayMinutes],
      sender: admin.addr,
      populateAppCallResources: false,
      boxReferences: boxRefs,
      assetReferences: [usdcAsaId],
      accountReferences: [vaultAddr, policyholderAddr],
    });
    console.log(`Payout processed for policy ${policyId} (delay ${delayMinutes} min).`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
