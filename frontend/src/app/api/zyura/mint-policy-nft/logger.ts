type LogFields = Record<string, unknown>;

export function logInfo(message: string, fields: LogFields) {
  console.info("[mint-policy-nft]", message, JSON.stringify(fields));
}

export function logError(message: string, fields: LogFields) {
  console.error("[mint-policy-nft]", message, JSON.stringify(fields));
}
