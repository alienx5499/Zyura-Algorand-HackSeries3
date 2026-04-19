import { NextRequest, NextResponse } from "next/server";
import { getMintPolicyEnv } from "@/app/api/zyura/mint-policy-nft/config/env";
import {
  createMintContext,
  parseAction,
} from "@/app/api/zyura/mint-policy-nft/context";
import { handlerMap } from "@/app/api/zyura/mint-policy-nft/dispatchers/handler-map";
import { logError, logInfo } from "@/app/api/zyura/mint-policy-nft/logger";
import type { MintPolicyRequestBody } from "@/app/api/zyura/mint-policy-nft/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const env = getMintPolicyEnv();
    if (!env.appId) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_ZYURA_APP_ID not set" },
        { status: 500 },
      );
    }

    const body = (await request.json()) as MintPolicyRequestBody;
    const action = parseAction(body.action);
    const policyIdStr = body.policyId;
    const recipient = body.recipient;

    if (!action || !policyIdStr || !recipient) {
      return NextResponse.json(
        { error: "Missing action, policyId, or recipient" },
        { status: 400 },
      );
    }

    let policyId: bigint;
    try {
      policyId = BigInt(policyIdStr);
    } catch {
      return NextResponse.json({ error: "Invalid policyId" }, { status: 400 });
    }
    void policyId;
    const ctx = createMintContext(action, body);
    logInfo("request_start", {
      requestId: ctx.requestId,
      action: ctx.action,
      policyId: ctx.policyIdStr,
    });
    const handler = handlerMap[action];
    const result = await handler(ctx, body);
    logInfo("request_success", {
      requestId: ctx.requestId,
      action: ctx.action,
      policyId: ctx.policyIdStr,
      status: result.status ?? 200,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(result.payload, { status: result.status ?? 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    logError("request_failure", {
      error: msg,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
