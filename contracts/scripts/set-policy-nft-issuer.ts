/**
 * One-off: set global pol_nft_issuer to the admin address (house mint + linkPolicyNft).
 * Requires TEAL that includes setPolicyNftIssuer (rebuild + deploy that app first).
 *
 * From contracts/: npx ts-node scripts/set-policy-nft-issuer.ts [APP_ID]
 * Needs: npm run build, ADMIN_MNEMONIC in frontend .env, and the target app id via
 * NEXT_PUBLIC_ZYURA_APP_ID / ZYURA_APP_ID in env, or APP_ID as the first CLI argument.
 */

import { createHash } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import dotenv from 'dotenv';

/* eslint-disable no-console -- CLI script */

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function loadAdminMnemonic(): Promise<string> {
  const fromEnv = process.env.ADMIN_MNEMONIC?.trim();
  if (fromEnv && fromEnv.split(/\s+/).length >= 24) {
    return fromEnv.replace(/^["'](.+)["']$/, '$1').trim();
  }

  const frontendDir = path.resolve(__dirname, '../../frontend');
  const envFile = (await fileExists(path.join(frontendDir, '.env.local')))
    ? path.join(frontendDir, '.env.local')
    : path.join(frontendDir, '.env');
  const envContent = await fs.readFile(envFile, 'utf-8');
  let match = envContent.match(/^ADMIN_MNEMONIC\s*=\s*"([^"]+)"\s*$/m);
  if (!match) match = envContent.match(/^ADMIN_MNEMONIC\s*=\s*'([^']+)'\s*$/m);
  if (!match) match = envContent.match(/^ADMIN_MNEMONIC\s*=\s*([^\n]+)\s*$/m);
  if (!match?.[1]) {
    throw new Error('ADMIN_MNEMONIC not found in frontend/.env');
  }
  return match[1].trim();
}

function approvalProgramFromAppParams(params: Record<string, unknown>): Buffer {
  const v = params.approvalProgram ?? params['approval-program'];
  if (v instanceof Uint8Array) return Buffer.from(v);
  if (typeof v === 'string') return Buffer.from(v, 'base64');
  throw new Error('Could not read approval-program from algod application response');
}

/** Fails fast with a clear message if the live app is not built from current artifacts. */
async function assertOnChainApprovalMatchesLocalTeal(algod: algosdk.Algodv2, appId: number): Promise<void> {
  const tealPath = path.resolve(__dirname, '..', 'artifacts', 'Zyura.approval.teal');
  if (!(await fileExists(tealPath))) {
    console.warn('Zyura.approval.teal not found; skipping bytecode check. Run npm run build in contracts/ first.');
    return;
  }
  const tealSource = await fs.readFile(tealPath, 'utf-8');
  const { result: compiledB64 } = await algod.compile(tealSource).do();
  const localBytecode = Buffer.from(compiledB64, 'base64');
  const appRes = (await algod.getApplicationByID(appId).do()) as {
    params?: Record<string, unknown>;
  };
  if (!appRes.params) {
    throw new Error(`No params in algod response for application ${appId}`);
  }
  const chainBytecode = approvalProgramFromAppParams(appRes.params);
  if (localBytecode.equals(chainBytecode)) return;

  const prefix = (b: Buffer) => createHash('sha256').update(b).digest('hex').slice(0, 16);
  throw new Error(
    `Application ${appId} was NOT deployed from your current contracts/artifacts/Zyura.approval.teal.\n` +
      `  On-chain approval bytecode: ${chainBytecode.length} bytes (SHA256 prefix ${prefix(chainBytecode)})\n` +
      `  Local compile of Zyura.approval.teal: ${localBytecode.length} bytes (SHA256 prefix ${prefix(localBytecode)})\n` +
      `That is why setPolicyNftIssuer hits "err" after ABI match — the old program has no such route.\n\n` +
      `Fix: npm run build in contracts/, deploy a NEW Zyura app (clear NEXT_PUBLIC_ZYURA_APP_ID for create path in deploy-and-create-products.ts),\n` +
      `put the new app ID in frontend .env, run initialize/products bootstrap, then run this script again.`
  );
}

async function main() {
  const frontendDir = path.resolve(__dirname, '../../frontend');
  const envPath = path.join(frontendDir, '.env');
  const localEnvPath = path.join(frontendDir, '.env.local');
  if (await fileExists(envPath)) {
    dotenv.config({ path: envPath });
  }
  if (await fileExists(localEnvPath)) {
    dotenv.config({ path: localEnvPath, override: true });
  }

  const cliAppId = process.argv[2]?.trim();
  const appIdStr =
    cliAppId && cliAppId !== '0'
      ? cliAppId
      : (process.env.NEXT_PUBLIC_ZYURA_APP_ID ?? process.env.ZYURA_APP_ID)?.trim();
  if (!appIdStr || appIdStr === '0') {
    throw new Error(
      'Need a Zyura application id (not 0).\n' +
        'You often clear NEXT_PUBLIC_ZYURA_APP_ID to create a new app — that is only for deploy.\n' +
        'After deploy, set NEXT_PUBLIC_ZYURA_APP_ID (or ZYURA_APP_ID) to the NEW app id in frontend/.env,\n' +
        'or run: npx ts-node scripts/set-policy-nft-issuer.ts <APP_ID>'
    );
  }
  const appId = BigInt(appIdStr);

  const mnemonic = await loadAdminMnemonic();
  const admin = algosdk.mnemonicToSecretKey(mnemonic);

  const algodUrl = process.env.NEXT_PUBLIC_ALGOD_URL;
  const algodNetwork = process.env.NEXT_PUBLIC_ALGOD_NETWORK || 'localnet';
  let algorand: algokit.AlgorandClient;
  if (algodNetwork === 'testnet' && (!algodUrl || algodUrl.includes('algonode'))) {
    algorand = algokit.AlgorandClient.testNet();
  } else if (
    algodNetwork === 'localnet' ||
    (algodUrl && (algodUrl.includes('localhost') || algodUrl.includes('127.0.0.1')))
  ) {
    algorand = algokit.AlgorandClient.defaultLocalNet();
  } else {
    const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || '';
    const algodClient = new algosdk.Algodv2(token, algodUrl || '', '');
    algorand = algokit.AlgorandClient.fromClients({ algod: algodClient });
  }

  // Required for client.send.call — same as deploy-and-create-products.ts
  algorand.setSignerFromAccount(admin);

  const { algod } = algorand.client;
  await assertOnChainApprovalMatchesLocalTeal(algod, Number(appId));

  const arc32Path = path.resolve(__dirname, '..', 'artifacts', 'Zyura.arc32.json');
  const buf = await fs.readFile(arc32Path);
  const appSpec = JSON.parse(buf.toString('utf-8'));

  const factory = algorand.client.getAppFactory({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appSpec: appSpec as any,
    defaultSender: admin.addr,
  });
  const client = factory.getAppClientById({ appId });

  console.log(`Setting pol_nft_issuer to admin ${admin.addr} on app ${appId.toString()}…`);
  await client.send.call({
    method: 'setPolicyNftIssuer',
    args: [admin.addr],
    sender: admin.addr,
  });
  console.log('✓ setPolicyNftIssuer succeeded. House mint API should work if mnemonic matches.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
