import algosdk from "algosdk";

export function makePurchasePolicyMethod(): algosdk.ABIMethod {
  return new algosdk.ABIMethod({
    name: "purchasePolicy",
    args: [
      { type: "axfer", name: "premiumPayment" },
      { type: "uint64", name: "policyId" },
      { type: "uint64", name: "productId" },
      { type: "string", name: "flightNumber" },
      { type: "uint64", name: "departureTime" },
      { type: "uint64", name: "premiumAmount" },
      { type: "bool", name: "createMetadata" },
      { type: "string", name: "metadataUri" },
      { type: "uint64", name: "nftAssetId" },
    ],
    returns: { type: "void" },
  });
}

export function makeLinkPolicyNftMethod(): algosdk.ABIMethod {
  return new algosdk.ABIMethod({
    name: "linkPolicyNft",
    args: [
      { type: "uint64", name: "policyId" },
      { type: "uint64", name: "nftAssetId" },
    ],
    returns: { type: "void" },
  });
}
