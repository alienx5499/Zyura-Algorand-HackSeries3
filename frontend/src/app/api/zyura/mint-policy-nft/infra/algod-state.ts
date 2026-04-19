import algosdk from "algosdk";

export function createPolicyBoxName(
  prefix: string,
  policyId: bigint,
): Uint8Array {
  const prefixBytes = new TextEncoder().encode(prefix);
  const idBytes = algosdk.encodeUint64(policyId);
  const name = new Uint8Array(prefixBytes.length + idBytes.length);
  name.set(prefixBytes, 0);
  name.set(idBytes, prefixBytes.length);
  return name;
}

export async function fetchApplicationBox(
  appId: number,
  boxName: Uint8Array,
): Promise<Uint8Array | null> {
  const algodUrl = (process.env.NEXT_PUBLIC_ALGOD_URL || "").replace(/\/$/, "");
  const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
  if (!algodUrl) return null;
  const b64 = Buffer.from(boxName).toString("base64");
  const u = new URL(`${algodUrl}/v2/applications/${appId}/box`);
  u.searchParams.set("name", `b64:${b64}`);
  const res = await fetch(u.toString(), {
    cache: "no-store",
    headers: token ? { "X-Algo-API-Token": token } : {},
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const json = (await res.json()) as { value?: string };
  if (!json.value) return null;
  return new Uint8Array(Buffer.from(json.value, "base64"));
}

export async function getGlobalAddress(
  appId: number,
  keyUtf8: string,
): Promise<string | null> {
  const algodUrl = (process.env.NEXT_PUBLIC_ALGOD_URL || "").replace(/\/$/, "");
  const token = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";
  if (!algodUrl) return null;
  const res = await fetch(`${algodUrl}/v2/applications/${appId}`, {
    cache: "no-store",
    headers: token ? { "X-Algo-API-Token": token } : {},
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    params?: {
      ["global-state"]?: Array<{
        key: string;
        value: { type: number; bytes?: string };
      }>;
    };
  };
  for (const e of data.params?.["global-state"] ?? []) {
    let k: string;
    try {
      k = Buffer.from(e.key, "base64").toString("utf8");
    } catch {
      continue;
    }
    if (k !== keyUtf8) continue;
    if (e.value?.type === 1 && e.value.bytes) {
      const raw = Buffer.from(e.value.bytes, "base64");
      if (raw.length === 32) {
        return algosdk.encodeAddress(new Uint8Array(raw));
      }
    }
  }
  return null;
}
