import { NextRequest, NextResponse } from "next/server";
import algosdk from "algosdk";
import http from "http";
import https from "https";
import { URL } from "url";

const APP_ID = process.env.NEXT_PUBLIC_ZYURA_APP_ID;
const ALGOD_URL = process.env.NEXT_PUBLIC_ALGOD_URL;
const ALGOD_TOKEN = process.env.NEXT_PUBLIC_ALGOD_TOKEN || "";

// Short-lived in-memory cache (helps when VPN adds latency and dashboard calls product multiple times)
const CACHE_TTL_MS = 25_000; // 25s
const productCache = new Map<
  string,
  { data: Record<string, unknown>; expires: number }
>();
function getCachedProduct(id: string): Record<string, unknown> | null {
  const entry = productCache.get(id);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}
function setCachedProduct(id: string, data: Record<string, unknown>): void {
  productCache.set(id, { data, expires: Date.now() + CACHE_TTL_MS });
}

// Helper to create box name (matches contract pattern)
function createBoxName(prefix: string, productId: bigint): Uint8Array {
  const prefixBytes = new TextEncoder().encode(prefix);
  const productIdBytes = algosdk.encodeUint64(productId);
  const boxName = new Uint8Array(prefixBytes.length + productIdBytes.length);
  boxName.set(prefixBytes, 0);
  boxName.set(productIdBytes, prefixBytes.length);
  return boxName;
}

// Helper to fetch box using native http/https module (works when fetch() fails)
async function fetchBoxHttp(
  appId: number,
  boxNameBase64: string,
  algodUrl: string,
  token: string,
): Promise<Uint8Array | null> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${algodUrl}/v2/applications/${appId}/box`);
    // Algorand API requires box names in 'encoding:value' format
    url.searchParams.set("name", `b64:${boxNameBase64}`);

    const isHttps = url.protocol === "https:";
    const httpModule = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: "GET",
      headers: {
        "X-Algo-API-Token": token,
      },
      // For HTTPS, reject unauthorized certificates in production but allow in dev
      rejectUnauthorized: process.env.NODE_ENV === "production",
    };

    const req = httpModule.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 404) {
          resolve(null);
          return;
        }

        if (res.statusCode !== 200) {
          reject(
            new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`),
          );
          return;
        }

        try {
          const response = JSON.parse(data);
          if (response.value) {
            resolve(Buffer.from(response.value, "base64"));
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    // Set timeout to prevent hanging requests
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    if (!APP_ID || APP_ID === "0") {
      return NextResponse.json(
        { error: "Zyura app ID not configured" },
        { status: 500 },
      );
    }

    if (!ALGOD_URL) {
      return NextResponse.json(
        { error: "Algod URL not configured" },
        { status: 500 },
      );
    }

    const productIdNum = BigInt(productId);
    const appId = BigInt(APP_ID);

    const cached = getCachedProduct(productId);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "Cache-Control": "private, s-maxage=15, stale-while-revalidate=30",
        },
      });
    }

    const boxNames = [
      createBoxName("p_active", productIdNum),
      createBoxName("p_pri", productIdNum),
      createBoxName("p_sch", productIdNum),
    ];

    // Fetch all boxes in parallel using native http/https module (works when fetch() fails)
    const token =
      ALGOD_TOKEN ||
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    console.log(
      `[Product API] Fetching product ${productId} from app ${appId} at ${ALGOD_URL}`,
    );

    const boxValues = await Promise.all(
      boxNames.map(async (boxName, index) => {
        try {
          // Convert Uint8Array to base64 string for the REST API
          const boxNameBase64 = Buffer.from(boxName).toString("base64");
          // Use native http/https module instead of algosdk (which uses fetch())
          const result = await fetchBoxHttp(
            Number(appId),
            boxNameBase64,
            ALGOD_URL,
            token,
          );
          const prefix = ["p_active", "p_pri", "p_sch"][index];
          console.log(
            `[Product API] Fetched box ${prefix} for product ${productId}`,
          );
          return result;
        } catch (error: any) {
          const prefix = ["p_active", "p_pri", "p_sch"][index];
          console.error(
            `[Product API] Error fetching box ${index} (${prefix}):`,
            {
              message: error.message,
              code: error.code,
              url: ALGOD_URL,
              appId: appId.toString(),
              productId: productId,
            },
          );
          // Return null for errors - we'll check if all failed at the end
          return null;
        }
      }),
    );

    // Check if all boxes failed (connection error)
    const allFailed = boxValues.every((v) => v === null);
    if (allFailed) {
      console.error(
        `[Product API] All box fetches failed for product ${productId}`,
      );
      return NextResponse.json(
        {
          error: "Cannot connect to Algorand node",
          details: `Failed to connect to ${ALGOD_URL}. This could be due to:\n1. Network connectivity issues\n2. API rate limits (try using a VPN or different endpoint)\n3. Invalid ALGOD_URL configuration\n\nFor localnet, ensure it's running: 'algokit localnet start'`,
        },
        { status: 503 },
      );
    }

    const active = boxValues[0]
      ? algosdk.decodeUint64(boxValues[0], "safe")
      : null;
    const priBox = boxValues[1];
    const schBox = boxValues[2];
    const coverageAmount =
      priBox && priBox.byteLength >= 8
        ? algosdk.decodeUint64(priBox.subarray(0, 8), "safe")
        : null;
    const premiumRateBps =
      priBox && priBox.byteLength >= 16
        ? algosdk.decodeUint64(priBox.subarray(8, 16), "safe")
        : null;
    const delayThreshold =
      schBox && schBox.byteLength >= 8
        ? algosdk.decodeUint64(schBox.subarray(0, 8), "safe")
        : null;
    const claimWindowHours =
      schBox && schBox.byteLength >= 16
        ? algosdk.decodeUint64(schBox.subarray(8, 16), "safe")
        : null;

    // Check if product exists (active box must exist)
    if (active === null || active === undefined) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const payload = {
      id: productIdNum.toString(),
      product_id: productIdNum.toString(),
      delay_threshold_minutes: delayThreshold?.toString() || "0",
      coverage_amount: coverageAmount?.toString() || "0",
      premium_rate_bps: premiumRateBps?.toString() || "0",
      claim_window_hours: claimWindowHours?.toString() || "0",
      active: Number(active) === 1,
    };
    setCachedProduct(productId, payload);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (error: any) {
    console.error("Error fetching product:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.response?.status || error.status,
      data: error.response?.data || error.body,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch product",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
