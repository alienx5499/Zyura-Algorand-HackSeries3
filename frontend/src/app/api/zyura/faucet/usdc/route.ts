import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import algosdk from "algosdk";
import {
  clearIdempotency,
  getCooldownRemainingSec,
  getDailyGlobalTotal,
  getDailyIpTotal,
  incrementDailyGlobal,
  incrementDailyIp,
  reserveIdempotency,
  acquireWalletLock,
  releaseWalletLock,
  setCooldown,
} from "@/lib/faucet/rate-limit-store";
import { faucetError, type FaucetErrorPayload } from "@/lib/faucet/errors";
import { logFaucetEvent } from "@/lib/faucet/observability";
import {
  fromUsdcMicro,
  getFaucetConfig,
  isAllowedFaucetAmount,
  toUsdcMicro,
} from "@/lib/faucet/validation";
import {
  getUsdcBalance,
  sendUsdcFromMnemonic,
} from "@/lib/faucet/usdc-balance";

export const dynamic = "force-dynamic";

type FaucetRequestBody = {
  address?: unknown;
  amount?: unknown;
  nonce?: unknown;
};

function errorResponse(payload: FaucetErrorPayload, status: number) {
  return NextResponse.json(payload, { status });
}

function getRequesterIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

function getRequestHash(address: string, amount: number, nonce?: string) {
  const timeBucket = Math.floor(Date.now() / 30_000);
  const source = `${address}:${amount}:${nonce ?? ""}:${timeBucket}`;
  return createHash("sha256").update(source).digest("hex").slice(0, 24);
}

export async function POST(req: NextRequest) {
  const ip = getRequesterIp(req);
  let address = "";
  let amount = 0;
  const lockToken = randomUUID();
  let lockHeld = false;
  let reqHash = "";
  try {
    const body = (await req.json()) as FaucetRequestBody;
    address = String(body.address ?? "").trim();
    amount = Number(body.amount ?? 0);
    const nonce =
      typeof body.nonce === "string" && body.nonce.length <= 128
        ? body.nonce
        : undefined;

    if (!address) {
      return errorResponse(
        faucetError("BAD_REQUEST", "Address is required"),
        400,
      );
    }
    if (!algosdk.isValidAddress(address)) {
      return errorResponse(
        faucetError("INVALID_ADDRESS", "Invalid Algorand address"),
        400,
      );
    }
    if (!Number.isFinite(amount) || !isAllowedFaucetAmount(amount)) {
      return errorResponse(
        faucetError("INVALID_AMOUNT", "Amount must be 10, 50, 100, or 200"),
        400,
      );
    }

    const cfg = getFaucetConfig();
    if (!cfg.usdcAsaId) {
      return errorResponse(
        faucetError("FAUCET_NOT_CONFIGURED", "USDC ASA ID is not configured"),
        500,
      );
    }
    const mnemonic = process.env.FAUCET_MNEMONIC?.trim();
    if (!mnemonic) {
      return errorResponse(
        faucetError(
          "FAUCET_NOT_CONFIGURED",
          "FAUCET_MNEMONIC is not configured",
        ),
        500,
      );
    }

    reqHash = getRequestHash(address, amount, nonce);
    const reserved = await reserveIdempotency(
      address,
      reqHash,
      cfg.idempotencyTtlSec,
    );
    if (!reserved) {
      return errorResponse(
        faucetError(
          "DUPLICATE_REQUEST",
          "Duplicate request detected. Please wait and try again.",
        ),
        409,
      );
    }

    const cooldownRemaining = await getCooldownRemainingSec(address);
    if (cooldownRemaining > 0) {
      return errorResponse(
        faucetError(
          "COOLDOWN_ACTIVE",
          "Please wait before requesting faucet funds again.",
          cooldownRemaining,
        ),
        429,
      );
    }

    const gotLock = await acquireWalletLock(address, lockToken, cfg.lockTtlSec);
    if (!gotLock) {
      return errorResponse(
        faucetError(
          "WALLET_LOCKED",
          "A faucet request is already in progress for this wallet.",
        ),
        429,
      );
    }
    lockHeld = true;

    const { optedIn, amountMicro } = await getUsdcBalance(
      address,
      cfg.usdcAsaId,
    );
    const balanceUsdc = fromUsdcMicro(amountMicro);
    if (!optedIn) {
      return errorResponse(
        faucetError(
          "NOT_OPTED_IN",
          `Wallet is not opted in to this app's USDC ASA (${cfg.usdcAsaId}). Opt in from the dashboard.`,
        ),
        409,
      );
    }
    if (balanceUsdc >= cfg.balanceThresholdUsdc) {
      return errorResponse(
        faucetError(
          "BALANCE_TOO_HIGH",
          "Wallet already has enough Testnet USDC for testing.",
        ),
        409,
      );
    }
    if (balanceUsdc + amount > cfg.accountMaxUsdc) {
      return errorResponse(
        faucetError(
          "ACCOUNT_CAP_EXCEEDED",
          `This request would exceed wallet cap of ${cfg.accountMaxUsdc} USDC.`,
        ),
        409,
      );
    }

    const ipTotal = await getDailyIpTotal(ip);
    if (ipTotal + amount > cfg.maxIpDailyUsdc) {
      return errorResponse(
        faucetError("IP_DAILY_LIMIT", "IP daily faucet limit reached."),
        429,
      );
    }

    const globalTotal = await getDailyGlobalTotal();
    if (globalTotal + amount > cfg.maxGlobalDailyUsdc) {
      return errorResponse(
        faucetError(
          "GLOBAL_DAILY_LIMIT",
          "Faucet daily treasury limit reached.",
        ),
        429,
      );
    }

    const txId = await sendUsdcFromMnemonic({
      mnemonic,
      receiver: address,
      amountMicro: toUsdcMicro(amount),
      usdcAsaId: cfg.usdcAsaId,
    });

    await Promise.all([
      setCooldown(address, cfg.cooldownSec),
      incrementDailyIp(ip, amount),
      incrementDailyGlobal(amount),
    ]);

    logFaucetEvent({
      event: "faucet_request",
      address,
      ip,
      amount,
      status: "success",
      code: "OK",
      txId,
    });

    return NextResponse.json({ ok: true, txId, amount });
  } catch (error: unknown) {
    if (address && reqHash) {
      await clearIdempotency(address, reqHash);
    }
    const message = error instanceof Error ? error.message : String(error);
    logFaucetEvent({
      event: "faucet_request",
      address: address || "unknown",
      ip,
      amount,
      status: "fail",
      code: "FAUCET_TX_FAILED",
    });
    return errorResponse(
      faucetError(
        "FAUCET_TX_FAILED",
        message || "Failed to send faucet transfer",
      ),
      500,
    );
  } finally {
    if (lockHeld && address) {
      await releaseWalletLock(address, lockToken);
    }
  }
}
