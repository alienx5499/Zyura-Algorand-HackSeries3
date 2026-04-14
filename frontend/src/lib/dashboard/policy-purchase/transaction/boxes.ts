import algosdk from "algosdk";

export function createBoxName(
  prefix: string,
  key: bigint | number | string,
): Uint8Array {
  const keyBytes = algosdk.encodeUint64(BigInt(key));
  const prefixBytes = new TextEncoder().encode(prefix);
  const result = new Uint8Array(prefixBytes.length + keyBytes.length);
  result.set(prefixBytes, 0);
  result.set(keyBytes, prefixBytes.length);
  return result;
}

export function policyPurchaseBoxReferences(
  productId: number,
  policyId: number,
): Uint8Array[] {
  return [
    createBoxName("p_active", productId),
    createBoxName("p_pri", productId),
    createBoxName("p_sch", productId),
    createBoxName("pol_status", policyId),
    createBoxName("pol_holder", policyId),
    createBoxName("pol_coverage", policyId),
    createBoxName("pol_tim", policyId),
  ];
}
