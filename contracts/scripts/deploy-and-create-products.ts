import * as fs from 'fs/promises';
import path from 'path';
import algosdk from 'algosdk';
import * as algokit from '@algorandfoundation/algokit-utils';
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount';
import dotenv from 'dotenv';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { MOCK_USDC_TOTAL_BASE_UNITS } from './mock-usdc-total';

/*
 * Deploy Zyura app, optionally mint mock USDC (clawback=app), initialize, seed products.
 * Run manually: `npx ts-node scripts/deploy-and-create-products.ts` from `contracts/`.
 * Needs `npm run build`, frontend `.env` / `.env.local` (ADMIN_MNEMONIC, algod vars, optional vault).
 */

async function loadEnv() {
  // Try frontend .env.local first, then .env as a fallback
  const frontendDir = path.resolve(__dirname, '../../frontend');
  const localEnvPath = path.join(frontendDir, '.env.local');
  const envPath = path.join(frontendDir, '.env');

  if (await fileExists(localEnvPath)) {
    dotenv.config({ path: localEnvPath, override: true });
    console.log(`[Debug] Loaded .env.local from ${localEnvPath}`);
  } else if (await fileExists(envPath)) {
    dotenv.config({ path: envPath, override: true });
    console.log(`[Debug] Loaded .env from ${envPath}`);
  } else {
    console.warn('[Warning] No .env file found, using process.env only');
  }

  // Debug: Check if ADMIN_MNEMONIC was loaded
  const mnemonicRaw = process.env.ADMIN_MNEMONIC;
  if (mnemonicRaw) {
    const wordCount = mnemonicRaw.trim().split(/\s+/).length;
    console.log(
      `[Debug] Loaded ADMIN_MNEMONIC with ${wordCount} words (first 3: ${mnemonicRaw.trim().split(/\s+/).slice(0, 3).join(' ')})`
    );
  }

  // Debug: Check network config
  console.log(`[Debug] ALGOD_URL: ${process.env.NEXT_PUBLIC_ALGOD_URL}`);
  console.log(`[Debug] ALGOD_NETWORK: ${process.env.NEXT_PUBLIC_ALGOD_NETWORK}`);
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/** Retry a function on 429 (Too Many Requests) with exponential backoff */
async function retryOn429<T>(fn: () => Promise<T>, maxRetries = 5, baseDelayMs = 5000): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const is429 =
        err?.statusCode === 429 || err?.rawResponse?.includes('429') || err?.cause?.message?.includes('429');
      if (!is429 || attempt === maxRetries - 1) throw err;
      const delay = baseDelayMs * 2 ** attempt;
      console.log(
        `[Retry] Rate limited (429). Waiting ${delay / 1000}s before attempt ${attempt + 2}/${maxRetries}...`
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

type Network = 'localnet' | 'testnet' | 'betanet' | 'mainnet';

async function main() {
  await loadEnv();

  const algodUrl = process.env.NEXT_PUBLIC_ALGOD_URL;
  const algodToken = process.env.NEXT_PUBLIC_ALGOD_TOKEN;
  const algodNetwork = (process.env.NEXT_PUBLIC_ALGOD_NETWORK || 'localnet') as Network;

  // Additional debug after loadEnv
  console.log(`[Debug] After loadEnv - ALGOD_URL: ${algodUrl || '(undefined)'}`);
  console.log(`[Debug] After loadEnv - ALGOD_NETWORK: ${algodNetwork}`);
  const usdcAsaIdEnv = process.env.NEXT_PUBLIC_USDC_ASA_ID;
  const existingAppIdEnv = process.env.NEXT_PUBLIC_ZYURA_APP_ID;
  // Read ADMIN_MNEMONIC - dotenv often fails with quoted multi-word values
  // So we read directly from the .env file as the primary method
  let adminMnemonic: string | undefined = process.env.ADMIN_MNEMONIC;

  // If dotenv only got 1 word, read from file directly
  if (!adminMnemonic || adminMnemonic.split(/\s+/).length <= 1) {
    console.log("[Info] dotenv didn't parse ADMIN_MNEMONIC correctly, reading from file directly...");
    const frontendDir = path.resolve(__dirname, '../../frontend');
    const envPath = path.join(frontendDir, '.env');
    const localEnvPath = path.join(frontendDir, '.env.local');

    let envContent = '';
    try {
      if (await fileExists(localEnvPath)) {
        envContent = await fs.readFile(localEnvPath, 'utf-8');
      } else if (await fileExists(envPath)) {
        envContent = await fs.readFile(envPath, 'utf-8');
      }

      if (envContent) {
        // Match ADMIN_MNEMONIC="..." (double quotes) or ADMIN_MNEMONIC='...' (single quotes) or ADMIN_MNEMONIC=... (no quotes)
        // First try with quotes
        let mnemonicMatch = envContent.match(/^ADMIN_MNEMONIC\s*=\s*"([^"]+)"\s*$/m);
        if (!mnemonicMatch) {
          mnemonicMatch = envContent.match(/^ADMIN_MNEMONIC\s*=\s*'([^']+)'\s*$/m);
        }
        if (!mnemonicMatch) {
          // Try without quotes (but this might only get first word)
          mnemonicMatch = envContent.match(/^ADMIN_MNEMONIC\s*=\s*([^\n]+)\s*$/m);
        }

        if (mnemonicMatch && mnemonicMatch[1]) {
          adminMnemonic = mnemonicMatch[1].trim();
          const wordCount = adminMnemonic.split(/\s+/).length;
          console.log(`[Info] Successfully read ADMIN_MNEMONIC from file (${wordCount} words)`);
          if (wordCount < 24) {
            console.warn(`[Warning] Expected 24-25 words but got ${wordCount}. Check .env file format.`);
          }
        } else {
          console.error('[Error] Could not find ADMIN_MNEMONIC in .env file');
        }
      }
    } catch (err: any) {
      console.warn('[Warning] Could not read .env file directly:', err.message);
    }
  } else {
    // Remove quotes if dotenv included them
    adminMnemonic = adminMnemonic.replace(/^["'](.+)["']$/, '$1').trim();
  }
  const riskPoolVaultAddr = process.env.RISK_POOL_VAULT_ADDR;
  const oracleAppIdEnv = process.env.ORACLE_APP_ID || '0';
  const adminAddressTarget = process.env.ADMIN_ADDRESS; // Optional: target address to find via derivation path search

  if (!algodUrl) {
    throw new Error('NEXT_PUBLIC_ALGOD_URL must be set in frontend .env/.env.local');
  }
  // Token is optional for some endpoints (e.g., Nodely, public Algonode)
  // Empty string is valid for endpoints that don't require authentication
  if (!adminMnemonic) {
    throw new Error(
      'ADMIN_MNEMONIC must be set (25-word Algorand or 24-word BIP39 mnemonic for Zyura admin)\n' +
        'Check your frontend/.env file and ensure ADMIN_MNEMONIC is set correctly.'
    );
  }

  // Debug: log first few words (for troubleshooting, but don't log full mnemonic)
  const mnemonicPreview = `${adminMnemonic.split(/\s+/).slice(0, 3).join(' ')}...`;
  console.log(`[Debug] Admin mnemonic preview: ${mnemonicPreview}`);
  // If vault address not set or is placeholder, use admin address
  const finalVaultAddr =
    riskPoolVaultAddr && riskPoolVaultAddr !== 'REPLACE_WITH_VAULT_ADDRESS' ? riskPoolVaultAddr : undefined; // Will be set to admin address after we derive it

  let usdcAsaId: bigint | undefined;
  const oracleAppId = BigInt(oracleAppIdEnv || '0');

  // Create AlgorandClient - use AlgoKit defaults when possible, otherwise use custom config
  let algorand: algokit.AlgorandClient;
  console.log(`[Debug] Network: ${algodNetwork}, URL: ${algodUrl}`);

  if (algodNetwork === 'testnet') {
    // Testnet - use AlgoKit's default testnet client if URL is Algonode, otherwise custom
    if (!algodUrl || algodUrl.includes('algonode')) {
      console.log('Using AlgoKit default testnet client (Algonode)...');
      algorand = algokit.AlgorandClient.testNet();
    } else {
      // Use custom endpoint (PureStake, AlgoExplorer, etc.)
      console.log(`Using custom testnet endpoint: ${algodUrl}`);
      let algodClient: algosdk.Algodv2;

      // PureStake requires X-API-Key header instead of standard token
      if (algodUrl.includes('purestake.io')) {
        const token = { 'X-API-Key': algodToken || '' };
        algodClient = new algosdk.Algodv2(token, algodUrl, '');
      } else {
        algodClient = new algosdk.Algodv2(algodToken || '', algodUrl, '');
      }

      algorand = algokit.AlgorandClient.fromClients({ algod: algodClient });
    }
  } else if (algodNetwork === 'localnet' || algodUrl?.includes('localhost') || algodUrl?.includes('127.0.0.1')) {
    // Use AlgoKit's default localnet client
    console.log('Using AlgoKit default localnet client...');
    algorand = algokit.AlgorandClient.defaultLocalNet();
  } else {
    // Use custom endpoint configuration
    console.log(`Using custom endpoint: ${algodUrl}`);
    let algodClient: algosdk.Algodv2;

    // PureStake requires X-API-Key header instead of standard token
    if (algodUrl.includes('purestake.io')) {
      const token = { 'X-API-Key': algodToken || '' };
      algodClient = new algosdk.Algodv2(token, algodUrl, '');
    } else {
      algodClient = new algosdk.Algodv2(algodToken || '', algodUrl, '');
    }

    algorand = algokit.AlgorandClient.fromClients({ algod: algodClient });
  }

  // Handle both Algorand 25-word and BIP39 24-word mnemonics
  const mnemonicWords = adminMnemonic.trim().split(/\s+/);
  let admin: algosdk.Account | undefined;

  if (mnemonicWords.length === 25) {
    // Algorand native 25-word mnemonic
    try {
      admin = algosdk.mnemonicToSecretKey(adminMnemonic);
    } catch (err: any) {
      throw new Error(
        `Failed to decode Algorand mnemonic: ${err.message}\n` +
          `Make sure your ADMIN_MNEMONIC is a valid 25-word Algorand mnemonic (space-separated).`
      );
    }
  } else if (mnemonicWords.length === 24) {
    // BIP39 24-word mnemonic (Pera Wallet format)
    console.log('Detected BIP39 24-word mnemonic (Pera Wallet format), converting...');
    try {
      // Validate BIP39 mnemonic
      if (!bip39.validateMnemonic(adminMnemonic)) {
        throw new Error('Invalid BIP39 mnemonic: checksum failed');
      }

      // Derive seed from BIP39 mnemonic
      const seedBuffer = await bip39.mnemonicToSeed(adminMnemonic);
      const seedHex = seedBuffer.toString('hex');

      // Try multiple derivation paths - Pera Wallet might use different account indices
      // Check if ADMIN_ADDRESS env var is set to find the right path
      const targetAddress = adminAddressTarget;

      if (targetAddress) {
        console.log(`Searching for target address: ${targetAddress}`);
        console.log('Trying common paths first, then searching through 300 account indices...');
      }

      const pathsToTry = targetAddress
        ? [
            // Try common paths first
            "m/44'/283'/0'/0'/0'",
            "m/44'/283'/0'/0'/1'",
            "m/44'/283'/0'/0'/2'",
            // Then try account-based paths (0-300)
            ...Array.from({ length: 300 }, (_, i) => `m/44'/283'/${i}'/0'/0'`),
            ...Array.from({ length: 300 }, (_, i) => `m/44'/283'/${i}'/0'/0'/0'`),
          ]
        : [
            // Default to standard path if no target address
            "m/44'/283'/0'/0'/0'",
          ];

      let found = false;
      let checkedCount = 0;
      const totalPaths = pathsToTry.length;

      for (const path of pathsToTry) {
        try {
          const derived = derivePath(path, seedHex);
          const privateKey = derived.key.slice(0, 32);
          const algoMnemonic = algosdk.secretKeyToMnemonic(privateKey);
          const testAdmin = algosdk.mnemonicToSecretKey(algoMnemonic);

          checkedCount++;

          // Log progress every 50 paths when searching
          if (targetAddress && checkedCount % 50 === 0) {
            process.stdout.write(`\rChecked ${checkedCount}/${totalPaths} paths...`);
          }

          // If target address specified, check if it matches
          if (targetAddress && testAdmin.addr === targetAddress) {
            console.log(`\n✓ Found matching address at path: ${path}`);
            console.log(`  Address: ${testAdmin.addr}`);
            admin = testAdmin;
            found = true;
            break;
          } else if (!targetAddress) {
            // Use first valid derivation if no target specified
            admin = testAdmin;
            console.log(`✓ Using derivation path: ${path}`);
            found = true;
            break;
          }
        } catch (e) {
          // Continue to next path
          checkedCount++;
        }
      }

      if (targetAddress && checkedCount > 0) {
        console.log(`\nChecked ${checkedCount} derivation paths`);
      }

      if (!found) {
        if (targetAddress) {
          throw new Error(
            `Could not find derivation path for target address ${targetAddress}.\n` +
              `Tried 300+ derivation paths. Please verify the mnemonic matches the address in Pera Wallet.`
          );
        } else {
          throw new Error('Failed to derive account from BIP39 mnemonic');
        }
      }
    } catch (err: any) {
      throw new Error(
        `Failed to convert BIP39 mnemonic: ${err.message}\n` +
          `Make sure your ADMIN_MNEMONIC is a valid 24-word BIP39 mnemonic from Pera Wallet.`
      );
    }
  } else {
    throw new Error(
      `Invalid mnemonic length: expected 24 (BIP39) or 25 (Algorand) words, but got ${mnemonicWords.length} words.\n` +
        `If you're using Pera Wallet, it should be a 24-word BIP39 mnemonic.`
    );
  }

  if (admin === undefined) {
    throw new Error('Internal error: admin account was not derived from ADMIN_MNEMONIC');
  }

  // Use admin address as vault if not specified
  const vaultAddress = finalVaultAddr || admin.addr;

  // Register admin account with AlgoKit so it can sign transactions
  algorand.setSignerFromAccount(admin);

  // Fund admin account on localnet if needed (localnet accounts need initial funding)
  if (algodNetwork === 'localnet') {
    try {
      const accountInfo = await algorand.account.getInformation(admin.addr);
      const { balance } = accountInfo;
      if (balance.microAlgos < BigInt(100_000)) {
        // Less than 0.1 ALGO
        console.log('Funding admin account on localnet...');
        // Get the localnet dispenser account to fund from
        const dispenser = await algorand.account.kmd.getLocalNetDispenserAccount();
        // Register dispenser as signer so it can send transactions
        algorand.setSignerFromAccount(dispenser);
        await algorand.account.ensureFunded(admin.addr, dispenser, AlgoAmount.Algos(10));
        console.log('✓ Admin account funded');
      }
    } catch (err: any) {
      console.warn('Could not check/fund admin account (may not be needed):', err.message);
    }
  }

  console.log('Admin address:', admin.addr);
  console.log('Risk pool vault address:', vaultAddress);
  console.log('Oracle app ID:', oracleAppId.toString());

  // Load Zyura ARC-32 app spec and compile TEAL locally to avoid repeated server-side compilation
  const arc32Path = path.resolve(__dirname, '..', 'artifacts', 'Zyura.arc32.json');
  const approvalTealPath = path.resolve(__dirname, '..', 'artifacts', 'Zyura.approval.teal');
  const clearTealPath = path.resolve(__dirname, '..', 'artifacts', 'Zyura.clear.teal');

  let appSpec: string | Record<string, unknown>;
  try {
    const buf = await fs.readFile(arc32Path);
    appSpec = JSON.parse(buf.toString('utf-8'));
    console.log('✓ Loaded pre-compiled Zyura.arc32.json (TEALScript compiled TypeScript->TEAL locally)');
  } catch (err) {
    throw new Error(
      `Could not load Zyura.arc32.json at ${arc32Path}.\n` +
        `Run 'npm run build' in contracts/ first to compile the contract.`
    );
  }

  const sdk = algosdk;
  let appId: bigint;

  // Create appFactory for app creation and subsequent calls
  const appFactory = algorand.client.getAppFactory({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appSpec: appSpec as any,
    defaultSender: admin.addr,
  });

  if (existingAppIdEnv && existingAppIdEnv !== '0') {
    // Reuse an already-deployed Zyura app
    appId = BigInt(existingAppIdEnv);
    console.log('Using existing Zyura app ID from env:', appId.toString());
  } else {
    // Create app using AlgoKit factory method (properly handles ABI encoding)
    console.log('Creating Zyura app using AlgoKit factory (with proper ABI encoding)...');
    try {
      const createOut = await retryOn429(async () =>
        appFactory.send.create({
          method: 'createApplication',
          args: [],
        })
      );

      appId = BigInt(createOut.result.appId);
      if (!appId) throw new Error('App creation failed - no app ID returned');
      console.log('✓ Created Zyura app ID:', appId.toString());
    } catch (err: any) {
      if (
        err?.statusCode === 429 ||
        err.message?.includes('quota') ||
        err.message?.includes('429') ||
        err.message?.includes('403') ||
        err.rawResponse?.includes('quota') ||
        err.rawResponse?.includes('429')
      ) {
        throw new Error(
          `API rate limit / quota exceeded on ${algodUrl}.\n` +
            `Solutions:\n` +
            `1. Wait a few minutes and retry (retries with backoff were attempted)\n` +
            `2. Use localnet: set NEXT_PUBLIC_ALGOD_URL=http://localhost:4001 and run 'algokit localnet start'\n` +
            `3. Try Algonode later (quota may reset): https://testnet-api.algonode.cloud\n` +
            `Original error: ${err.message || err.rawResponse || 'Unknown error'}`
        );
      }
      throw err;
    }
  }

  const appAddress = sdk.getApplicationAddress(Number(appId));
  console.log('Zyura app address:', appAddress);

  const deployedClient = appFactory.getAppClientById({
    appId,
  });

  if (usdcAsaIdEnv && usdcAsaIdEnv !== '0') {
    usdcAsaId = BigInt(usdcAsaIdEnv);
    console.log('Using existing USDC ASA ID from env:', usdcAsaId.toString());
  } else {
    console.log('NEXT_PUBLIC_USDC_ASA_ID not set or zero – creating mock USDC ASA on chain...');
    const { algod } = algorand.client;
    const params = await algod.getTransactionParams().do();

    const decimals = 6;
    const unitName = 'tUSDC';
    const assetName = 'Zyura Test USDC';

    const asaTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: admin.addr,
      total: Number(MOCK_USDC_TOTAL_BASE_UNITS),
      decimals,
      unitName,
      assetName,
      assetURL: 'https://zyura.xyz/test-usdc',
      defaultFrozen: false,
      manager: admin.addr,
      reserve: undefined,
      freeze: undefined,
      clawback: appAddress,
      suggestedParams: params,
    });

    const signed = asaTxn.signTxn(admin.sk);
    const { txId } = await algod.sendRawTransaction(signed).do();
    console.log('Sent mock USDC ASA create tx:', txId);

    const confirmation = await algosdk.waitForConfirmation(algod, txId, 4);
    const createdId = (confirmation as any)['asset-index'] ?? (confirmation as any).assetIndex;
    if (!createdId) {
      throw new Error('Failed to retrieve created ASA ID for mock USDC');
    }
    usdcAsaId = BigInt(createdId);
    console.log('✓ Created mock USDC ASA ID:', usdcAsaId.toString());
    console.log('👉 Add this to your frontend .env as NEXT_PUBLIC_USDC_ASA_ID=', usdcAsaId.toString());
  }

  if (!usdcAsaId) {
    throw new Error('USDC ASA ID could not be determined');
  }

  console.log('USDC ASA ID to use for initialize():', usdcAsaId.toString());

  try {
    console.log('Attempting initialize() call...');
    await deployedClient.send.call({
      method: 'initialize',
      args: [admin.addr, usdcAsaId, oracleAppId, vaultAddress],
      sender: admin.addr,
    });
    console.log('✓ initialize() called successfully');
  } catch (err) {
    console.warn('initialize() failed (possibly already initialized):', (err as Error).message);
  }

  try {
    const info = await algorand.account.getInformation(admin.addr);
    const balMicro = info.balance.microAlgos;
    const minMicro = info.minBalance.microAlgos;
    const feeBuffer = 5000n;
    // Keep µALGO on admin for many follow-up app calls (isProductActive + createProduct per SKU);
    // otherwise funding the app can spend almost all "spendable" and the next createProduct fails with admin "below min".
    // Large enough for several app-call fees after funding; small enough that typical TestNet balances can still fund the app (~0.14+ ALGO MBR).
    const reserveForScriptCalls = 70_000n;
    const maxSendMicro = balMicro - minMicro - feeBuffer - reserveForScriptCalls;
    console.log(
      `Admin µALGO: ${balMicro} (min balance ${minMicro}) → max fund app ~${maxSendMicro} (reserved ${reserveForScriptCalls} µALGO on admin for later calls)`
    );
    const desiredMicro = 1_000_000n;
    if (maxSendMicro < 20_000n) {
      console.warn(
        `Cannot fund app: admin has insufficient spendable ALGO (often too many assets vs balance).
  Top up ${admin.addr} on TestNet, e.g. https://bank.testnet.algorand.network/
Then re-run with NEXT_PUBLIC_ZYURA_APP_ID=${appId.toString()} and NEXT_PUBLIC_USDC_ASA_ID=${usdcAsaId.toString()} (no need to recreate app).`
      );
    } else {
      const payMicro = maxSendMicro < desiredMicro ? maxSendMicro : desiredMicro;
      console.log(`Funding Zyura app with ${(Number(payMicro) / 1e6).toFixed(3)} ALGO for fees / box MBR...`);
      await algorand.send.payment({
        sender: admin.addr,
        receiver: appAddress,
        amount: AlgoAmount.MicroAlgos(payMicro),
      });
      console.log('✓ App account funded');
    }
  } catch (err) {
    console.warn('App funding skipped / failed:', (err as Error).message);
  }

  try {
    console.log('Calling setPolicyNftIssuer(admin) for house-mint + linkPolicyNft…');
    await deployedClient.send.call({
      method: 'setPolicyNftIssuer',
      args: [admin.addr],
      sender: admin.addr,
    });
    console.log('✓ setPolicyNftIssuer(admin) — mint API must use the same address (ADMIN_MNEMONIC)');
  } catch (err) {
    console.warn(
      'setPolicyNftIssuer failed (app may be old TEAL without this method, or not admin):',
      (err as Error).message
    );
  }

  const products: Array<{
    id: bigint;
    delayMin: bigint;
    coverageMicro: bigint;
    premiumBps: bigint;
    claimHours: bigint;
    label: string;
  }> = [
    {
      id: BigInt(1),
      delayMin: BigInt(60),
      coverageMicro: BigInt(100 * 1e6),
      premiumBps: BigInt(120),
      claimHours: BigInt(24),
      label: 'Domestic Basic (60m, $100)',
    },
    {
      id: BigInt(2),
      delayMin: BigInt(90),
      coverageMicro: BigInt(200 * 1e6),
      premiumBps: BigInt(150),
      claimHours: BigInt(48),
      label: 'Domestic Plus (90m, $200)',
    },
    {
      id: BigInt(3),
      delayMin: BigInt(120),
      coverageMicro: BigInt(500 * 1e6),
      premiumBps: BigInt(180),
      claimHours: BigInt(48),
      label: 'International Basic (120m, $500)',
    },
    {
      id: BigInt(4),
      delayMin: BigInt(180),
      coverageMicro: BigInt(1_000 * 1e6),
      premiumBps: BigInt(220),
      claimHours: BigInt(72),
      label: 'International Plus (180m, $1000)',
    },
    {
      id: BigInt(5),
      delayMin: BigInt(240),
      coverageMicro: BigInt(2_000 * 1e6),
      premiumBps: BigInt(250),
      claimHours: BigInt(96),
      label: 'Long-Haul Premium (240m, $2000)',
    },
  ];

  console.log('\nEnsuring Zyura products exist on Algorand...');

  function createProductBoxName(prefix: string, productId: bigint | number): Uint8Array {
    const prefixBytes = new TextEncoder().encode(prefix);
    const productIdBytes = algosdk.encodeUint64(BigInt(productId));
    const boxName = new Uint8Array(prefixBytes.length + productIdBytes.length);
    boxName.set(prefixBytes, 0);
    boxName.set(productIdBytes, prefixBytes.length);
    return boxName;
  }

  function getCreateProductBoxReferences(productId: bigint | number): Uint8Array[] {
    return [
      createProductBoxName('p_active', productId),
      createProductBoxName('p_pri', productId),
      createProductBoxName('p_sch', productId),
    ];
  }

  /** µALGO above min balance; need headroom for isProductActive + createProduct fees. */
  const minAdminSpendableForProductRound = 15_000n;

  for (const p of products) {
    try {
      const adminInfo = await algorand.account.getInformation(admin.addr);
      const spendable = adminInfo.balance.microAlgos - adminInfo.minBalance.microAlgos;
      if (spendable < minAdminSpendableForProductRound) {
        console.warn(
          `  ⚠ Skipping product ${p.id}: admin spendable µALGO (${spendable}) < ${minAdminSpendableForProductRound} (min balance ${adminInfo.minBalance.microAlgos}). Top up ${admin.addr} on TestNet, set NEXT_PUBLIC_ZYURA_APP_ID=${appId.toString()} & NEXT_PUBLIC_USDC_ASA_ID=${usdcAsaId.toString()}, re-run.`
        );
        break;
      }
    } catch {
      /* continue; preflight is best-effort */
    }

    try {
      const activeBoxName = createProductBoxName('p_active', p.id);
      const isActive = await deployedClient.send.call({
        method: 'isProductActive',
        args: [p.id],
        populateAppCallResources: false,
        boxReferences: [activeBoxName],
      });
      if (isActive.return === true) {
        console.log(`✓ Product ${p.id} already active: ${p.label}`);
        continue;
      }
    } catch {
      /* no box yet */
    }

    console.log(`Creating product ${p.id}: ${p.label}`);

    const boxRefs = getCreateProductBoxReferences(p.id);

    try {
      await deployedClient.send.call({
        method: 'createProduct',
        args: [p.id, p.delayMin, p.coverageMicro, p.premiumBps, p.claimHours],
        sender: admin.addr,
        populateAppCallResources: false,
        boxReferences: boxRefs,
      });
      console.log(`  ✓ Created product ${p.id}`);
    } catch (err) {
      const msg = (err as Error).message ?? String(err);
      console.error(`  ✗ createProduct(${p.id}) failed:`, msg);
      if (msg.includes('below min')) {
        const namesAdmin = msg.includes(admin.addr);
        const namesApp = msg.includes(appAddress);
        if (namesAdmin) {
          console.error(
            `  → Top up admin ${admin.addr} with TestNet ALGO (sender fees), then re-run with NEXT_PUBLIC_ZYURA_APP_ID=${appId.toString()} and NEXT_PUBLIC_USDC_ASA_ID=${usdcAsaId.toString()}.`
          );
        } else if (namesApp) {
          console.error(
            `  → Fund the app account ${appAddress} with ALGO, then re-run with NEXT_PUBLIC_ZYURA_APP_ID=${appId.toString()} and NEXT_PUBLIC_USDC_ASA_ID=${usdcAsaId.toString()}.`
          );
        } else {
          console.error(
            `  → Re-run with same app/USDC ids after topping up whichever account the error names; NEXT_PUBLIC_ZYURA_APP_ID=${appId.toString()} NEXT_PUBLIC_USDC_ASA_ID=${usdcAsaId.toString()}`
          );
        }
      }
      break;
    }
  }

  console.log('\nAll products ensured. Deployment/bootstrap script completed.');
  console.log('\n--- Paste into frontend/.env (then restart Next.js) ---');
  console.log(`NEXT_PUBLIC_ZYURA_APP_ID=${appId.toString()}`);
  console.log(`NEXT_PUBLIC_USDC_ASA_ID=${usdcAsaId.toString()}`);
  console.log(
    'setPolicyNftIssuer(admin) was attempted above; if it failed, run: npx ts-node scripts/set-policy-nft-issuer.ts'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
