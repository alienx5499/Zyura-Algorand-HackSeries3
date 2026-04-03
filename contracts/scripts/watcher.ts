/**
 * Watcher: runs in the background, checks every 10s for flights with delay recorded
 * in the flight repo. For each delayed flight, checks which policies were bought
 * (exist on-chain and are Active); then runs processPayout only for those policies,
 * according to the recorded delay.
 *
 * Prerequisites: same as run-payout (frontend .env with ADMIN_MNEMONIC, app ID, etc.)
 * Optional: GITHUB_TOKEN (for private repo or to avoid rate limits), GITHUB_FLIGHT_REPO.
 *
 * Run from terminal:
 *   cd contracts
 *   npm run watcher
 *
 * Env:
 *   WATCHER_INTERVAL_SEC=10   (default 10)
 *   MIN_DELAY_MINUTES=60      (default 60; only flights with delay >= this trigger payout)
 *   GITHUB_FLIGHT_REPO=owner/repo
 *   GITHUB_BRANCH=main
 */

import * as fs from 'fs/promises';
import path from 'path';
import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import dotenv from 'dotenv';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';

function getGithubFlightPath(): string {
  return process.env.GITHUB_FLIGHT_PATH || 'Flight/Metadata/flights';
}
const DEFAULT_INTERVAL_SEC = 10;
const DEFAULT_MIN_DELAY_MINUTES = 60;

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

async function fetchFlightsWithDelay(
  repo: string,
  branch: string,
  minDelayMinutes: number,
  token?: string
): Promise<Array<{ flight_number: string; delay_minutes: number; policyIds: number[] }>> {
  const flightPath = getGithubFlightPath();
  const listUrl = `https://api.github.com/repos/${repo}/contents/${flightPath}?ref=${branch}`;
  const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const listRes = await fetch(listUrl, { headers, cache: 'no-store' });
  if (!listRes.ok) return [];

  const folders = (await listRes.json()) as Array<{ name: string; type: string }>;
  const dirs = Array.isArray(folders) ? folders.filter((f) => f.type === 'dir') : [];
  const out: Array<{ flight_number: string; delay_minutes: number; policyIds: number[] }> = [];

  for (const dir of dirs) {
    let data: { delay_minutes?: number; pnrs?: Array<{ policyId?: number | string }> } | null = null;
    const filePath = `${flightPath}/${dir.name}/flight.json`;

    if (token) {
      const fileUrl = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;
      const fileRes = await fetch(fileUrl, {
        headers: { ...headers, Accept: 'application/vnd.github.v3+json' },
        cache: 'no-store',
      });
      if (fileRes.ok) {
        const file = (await fileRes.json()) as { content?: string; encoding?: string };
        if (file.content) {
          const content = Buffer.from(file.content, (file.encoding as BufferEncoding) || 'base64').toString('utf8');
          try {
            data = JSON.parse(content);
          } catch {
            data = null;
          }
        }
      }
    }
    if (!data) {
      const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}?t=${Date.now()}`;
      const fileRes = await fetch(rawUrl, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      if (!fileRes.ok) continue;
      try {
        data = (await fileRes.json()) as { delay_minutes?: number; pnrs?: Array<{ policyId?: number | string }> };
      } catch {
        continue;
      }
    }

    const delay = typeof data.delay_minutes === 'number' ? data.delay_minutes : 0;
    if (delay < minDelayMinutes) continue;

    const policyIds: number[] = [];
    for (const p of data.pnrs || []) {
      const id = p.policyId;
      if (typeof id === 'number' && id > 0) policyIds.push(id);
      else if (typeof id === 'string' && /^\d+$/.test(id)) policyIds.push(parseInt(id, 10));
    }
    if (policyIds.length > 0) {
      out.push({ flight_number: dir.name, delay_minutes: delay, policyIds });
    }
    // If delayed but no policyIds, the flight repo may not have policyId set in pnrs (register after purchase)
  }
  return out;
}

async function main() {
  await loadEnv();

  const intervalSec =
    parseInt(process.env.WATCHER_INTERVAL_SEC || String(DEFAULT_INTERVAL_SEC), 10) || DEFAULT_INTERVAL_SEC;
  const minDelayMinutes =
    parseInt(process.env.MIN_DELAY_MINUTES || String(DEFAULT_MIN_DELAY_MINUTES), 10) || DEFAULT_MIN_DELAY_MINUTES;
  const flightRepo =
    process.env.GITHUB_FLIGHT_REPO ||
    process.env.GITHUB_METADATA_REPO ||
    'alienx5499/Zyura-Algorand-HackSeries3-MetaData';
  const branch = process.env.GITHUB_FLIGHT_BRANCH || process.env.GITHUB_BRANCH || 'main';
  const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;

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
    const algod = new algosdk.Algodv2(token as Record<string, string>, algodUrl, '');
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

  console.log(
    `Watcher started. Checking every ${intervalSec}s for delayed flights (min delay ${minDelayMinutes} min). Repo: ${flightRepo}`
  );
  console.log('Press Ctrl+C to stop.\n');

  const run = async () => {
    const delayed = await fetchFlightsWithDelay(flightRepo, branch, minDelayMinutes, githubToken);
    if (delayed.length === 0) {
      console.log(`[${new Date().toISOString()}] No delayed flights (delay >= ${minDelayMinutes} min).`);
      return;
    }
    for (const { flight_number, delay_minutes, policyIds } of delayed) {
      if (policyIds.length === 0) continue;
      console.log(
        `[${new Date().toISOString()}] Flight ${flight_number} delayed ${delay_minutes} min; checking ${policyIds.length} linked policy(ies) for bought status...`
      );
      for (const policyId of policyIds) {
        try {
          // Check which policy was actually bought: must exist on-chain and be Active (0)
          const statusBox = createBoxName('pol_status', policyId);
          const statusResult = await client.send.call({
            method: 'getPolicyStatus',
            args: [BigInt(policyId)],
            populateAppCallResources: false,
            boxReferences: [statusBox],
          });
          const status = Number(statusResult.return);
          if (status !== 0) {
            // 0=Active, 1=PaidOut, 2=Expired; only pay Active (bought) policies
            console.log(`[${new Date().toISOString()}] Policy ${policyId}: not Active (status=${status}), skip.`);
            continue;
          }
          const holderBox = createBoxName('pol_holder', policyId);
          const policyholderResult = await client.send.call({
            method: 'getPolicyPolicyholder',
            args: [BigInt(policyId)],
            populateAppCallResources: false,
            boxReferences: [holderBox],
          });
          const policyholderAddr = policyholderResult.return as string;
          if (!policyholderAddr) {
            console.log(`[${new Date().toISOString()}] Policy ${policyId}: no policyholder, skip.`);
            continue;
          }
          // Policy bought and Active; payout according to this policy
          const boxRefs = getProcessPayoutBoxReferences(policyId);
          await client.send.call({
            method: 'processPayout',
            args: [BigInt(policyId), BigInt(delay_minutes)],
            sender: admin.addr,
            populateAppCallResources: false,
            boxReferences: boxRefs,
            assetReferences: [usdcAsaId],
            accountReferences: [vaultAddr, policyholderAddr],
          });
          console.log(
            `[${new Date().toISOString()}] Payout processed: flight ${flight_number}, policy ${policyId} (bought, Active), delay ${delay_minutes} min.`
          );
        } catch (err) {
          console.error(`[${new Date().toISOString()}] Policy ${policyId}:`, (err as Error).message);
        }
      }
    }
  };

  await run();
  setInterval(run, intervalSec * 1000);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
