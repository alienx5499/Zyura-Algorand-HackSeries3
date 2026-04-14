export function getPeraExplorerBase(isMainnet: boolean): string {
  return isMainnet
    ? "https://explorer.perawallet.app"
    : "https://testnet.explorer.perawallet.app";
}

export function getTxExplorerUrl(
  baseUrl: string,
  txId?: string | null,
): string {
  return txId ? `${baseUrl}/tx/${txId}` : "";
}

export function getGroupExplorerUrl(
  baseUrl: string,
  groupId?: string | null,
): string {
  return groupId ? `${baseUrl}/tx-group/${groupId}/` : "";
}

export function getAssetOrAddressExplorerUrl(
  baseUrl: string,
  assetId?: string | number | null,
  address?: string | null,
): string {
  if (assetId !== undefined && assetId !== null && assetId !== "") {
    return `${baseUrl}/asset/${assetId}`;
  }
  return address ? `${baseUrl}/address/${address}/` : "";
}
