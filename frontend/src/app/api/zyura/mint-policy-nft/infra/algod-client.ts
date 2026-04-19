import * as algokit from "@algorandfoundation/algokit-utils";
import algosdk from "algosdk";

export function getAlgodv2(args: {
  algodUrl: string;
  algodToken: string;
  algodNetwork: string;
}): algosdk.Algodv2 {
  let algorand: algokit.AlgorandClient;
  if (
    args.algodNetwork === "localnet" ||
    args.algodUrl.includes("localhost") ||
    args.algodUrl.includes("127.0.0.1")
  ) {
    algorand = algokit.AlgorandClient.defaultLocalNet();
  } else if (
    args.algodNetwork === "testnet" &&
    (!args.algodToken || args.algodToken.length < 10)
  ) {
    algorand = algokit.AlgorandClient.testNet();
  } else {
    const algodClient = new algosdk.Algodv2(
      args.algodToken || "",
      args.algodUrl,
      "",
    );
    algorand = algokit.AlgorandClient.fromClients({ algod: algodClient });
  }
  return algorand.client.algod;
}

export function getIssuerFromMnemonic(adminMnemonic: string): {
  addr: string;
  sk: Uint8Array;
} {
  if (!adminMnemonic) {
    throw new Error(
      "Set ADMIN_MNEMONIC in server env (same as deploy / set-policy-nft-issuer); it signs policy NFT create/transfer.",
    );
  }
  const acct = algosdk.mnemonicToSecretKey(adminMnemonic);
  return { addr: String(acct.addr), sk: acct.sk };
}
