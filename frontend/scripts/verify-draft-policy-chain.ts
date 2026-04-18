/**
 * Live smoke test: resolve GitHub-draft policy against Zyura boxes on algod.
 *
 * From frontend/ (loads .env):
 *   npx tsx scripts/verify-draft-policy-chain.ts <wallet> <policyId>
 *
 * Example:
 *   npx tsx scripts/verify-draft-policy-chain.ts TXYIZ7... 538450
 */
import "dotenv/config";
import { confirmDraftPolicyOnChain } from "../src/lib/zyura/draft-policy-on-chain";

const walletArg = process.argv[2];
const policyIdArg = process.argv[3];
if (!walletArg || !policyIdArg) {
  console.error(
    "Usage: npx tsx scripts/verify-draft-policy-chain.ts <wallet> <policyId>",
  );
  process.exit(1);
}
const wallet = walletArg;
const policyId = policyIdArg;

const appId = parseInt(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "0", 10);
const algodUrlRaw = process.env.NEXT_PUBLIC_ALGOD_URL?.trim();
const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
if (!appId || !algodUrlRaw) {
  console.error(
    "Set NEXT_PUBLIC_ZYURA_APP_ID and NEXT_PUBLIC_ALGOD_URL in frontend/.env",
  );
  process.exit(1);
}
const algodUrl = algodUrlRaw;

async function main() {
  const r = await confirmDraftPolicyOnChain(
    policyId,
    wallet,
    appId,
    algodUrl,
    token,
  );
  console.log(JSON.stringify(r, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
