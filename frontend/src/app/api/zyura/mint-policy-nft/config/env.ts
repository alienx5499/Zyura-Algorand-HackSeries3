type MintPolicyEnv = {
  appId: number;
  algodUrl: string;
  algodToken: string;
  algodNetwork: string;
  adminMnemonic: string;
};

export function getMintPolicyEnv(): MintPolicyEnv {
  const appId = Number(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "0");
  const algodUrl = process.env.NEXT_PUBLIC_ALGOD_URL || "http://127.0.0.1:4001";
  const algodToken =
    process.env.NEXT_PUBLIC_ALGOD_TOKEN ||
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const algodNetwork = process.env.NEXT_PUBLIC_ALGOD_NETWORK || "localnet";
  const adminMnemonic = process.env.ADMIN_MNEMONIC?.trim() || "";

  return {
    appId,
    algodUrl,
    algodToken,
    algodNetwork,
    adminMnemonic,
  };
}
