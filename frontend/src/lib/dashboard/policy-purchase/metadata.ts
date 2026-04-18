import { toast } from "sonner";
import { readApiJsonBody } from "@/lib/dashboard/algorand-utils";
import {
  ARC3_SUFFIX,
  toArc3MetadataUrl,
  utf8ByteLength,
} from "@/lib/shorten-url-for-asa";
import type { MetadataPreparation } from "@/lib/dashboard/policy-purchase/types";

export async function preparePolicyMetadata(args: {
  currentAddress: string;
  productId: string;
  flightNumber: string;
  pnr: string;
  departureDate: string;
  departureTime: string;
  uploadedFiles: string[];
}): Promise<MetadataPreparation> {
  const {
    currentAddress,
    productId,
    flightNumber,
    pnr,
    departureDate,
    departureTime,
    uploadedFiles,
  } = args;
  const departureDateTime = new Date(`${departureDate}T${departureTime}:00Z`);
  const departureUnix = Math.floor(departureDateTime.getTime() / 1000);
  const policyId = Math.floor(Date.now() / 1000) % 1000000;

  toast.info("Loading coverage and premium for this product...");
  const productResForMeta = await fetch(`/api/zyura/product/${productId}`);
  if (!productResForMeta.ok) throw new Error("Failed to fetch product details");
  const productDataForMeta = await productResForMeta.json();
  const coverageAmountMicro = BigInt(productDataForMeta.coverage_amount || "0");
  const premiumRateBps = BigInt(productDataForMeta.premium_rate_bps || "0");
  const coverageUsdNum = Number(coverageAmountMicro) / 1_000_000;
  const premiumMicro = (coverageAmountMicro * premiumRateBps) / BigInt(10000);
  const premiumUsdNum = Number(premiumMicro) / 1_000_000;
  const departureIso = new Date(departureDateTime.getTime()).toISOString();

  const premiumUsd = premiumUsdNum.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const coverageUsd = coverageUsdNum.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  toast.info("Saving your policy artwork and details...");
  const svgResponse = await fetch("/zyura-nft-insurance.svg");
  let svg = await svgResponse.text();
  svg = svg
    .replaceAll("[FLIGHT_NUMBER]", flightNumber)
    .replaceAll("[POLICY_ID]", policyId.toString())
    .replaceAll("[PRODUCT_ID]", productId)
    .replaceAll("[DEPARTURE_ISO]", departureIso)
    .replaceAll("[PREMIUM_6DP]", premiumUsd)
    .replaceAll("[COVERAGE_6DP]", coverageUsd)
    .replaceAll("[PNR]", pnr || "[PNR]");

  const svgFilename = `${currentAddress}/${policyId}/policy.svg`;
  const svgUploadResponse = await fetch("/api/github/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: svg,
      filePath: svgFilename,
      message: `Add SVG image for ZYURA Policy ${policyId}`,
    }),
  });

  const svgUploadData = await readApiJsonBody<{
    url?: string;
    rawUrl?: string;
    error?: string;
  }>(svgUploadResponse);
  if (!svgUploadResponse.ok) {
    throw new Error(
      `Failed to upload SVG: ${svgUploadData.error || "Unknown error"}`,
    );
  }
  const svgRawUrl = svgUploadData.rawUrl ?? svgUploadData.url;
  uploadedFiles.push(svgFilename);

  const zyuraAppIdStr = String(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "");
  const explorerAppUrl =
    process.env.NEXT_PUBLIC_ALGOD_NETWORK === "mainnet"
      ? `https://explorer.perawallet.app/application/${zyuraAppIdStr}`
      : `https://testnet.explorer.perawallet.app/application/${zyuraAppIdStr}`;
  const metadata: Record<string, unknown> = {
    name: `ZYURA Policy ${policyId} · ${flightNumber}`,
    zyura_app_id: zyuraAppIdStr,
    description: [
      `Flight delay cover - ${flightNumber}, departs ${departureIso}. Premium ${premiumUsd}, coverage ${coverageUsd}.`,
      `Policy id ${policyId} (product ${productId}).`,
      `Authoritative state is on-chain in the Zyura application (Algorand app ID ${zyuraAppIdStr}): holder, policy NFT ASA id, and status in contract storage - not this file.`,
      "This JSON updates after purchase; for payout, status becomes CLAIMED on-chain first, then metadata may be refreshed.",
    ].join(" "),
    symbol: "ZYURA",
    image: svgRawUrl,
    external_url: explorerAppUrl,
    policy_id: String(policyId),
    product_id: productId,
    status: "PENDING_CONFIRMATION",
    flight: flightNumber,
    pnr: pnr || "N/A",
    departure: departureIso,
    coverage_usd: coverageUsdNum,
    premium_usd: premiumUsdNum,
    payout_at: null,
    payout_at_unix: null,
  };

  const metadataFilename = `${currentAddress}/${policyId}/policy.json`;
  const metadataUploadResponse = await fetch("/api/github/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: JSON.stringify(metadata, null, 2),
      filePath: metadataFilename,
      message: `Add/update metadata for ZYURA Policy ${policyId}`,
    }),
  });
  const metadataPayload = await readApiJsonBody<{
    url?: string;
    error?: string;
    details?: string;
  }>(metadataUploadResponse);
  if (!metadataUploadResponse.ok) {
    throw new Error(
      `Failed to upload metadata: ${metadataPayload.error || metadataPayload.details || "Unknown error"}`,
    );
  }
  const metadataUri = metadataPayload.url;
  if (!metadataUri)
    throw new Error("Upload succeeded but response had no metadata url");
  uploadedFiles.push(metadataFilename);

  let arc3Base = metadataUri.replace(/#arc3$/i, "");
  if (utf8ByteLength(arc3Base + ARC3_SUFFIX) > 96) {
    const res = await fetch(
      `/api/shorten?${new URLSearchParams({ url: arc3Base })}`,
    );
    const shortenPayload = await readApiJsonBody<{
      url?: string;
      error?: string;
    }>(res);
    if (!res.ok) {
      throw new Error(
        shortenPayload.error ||
          "Could not shorten metadata URL for on-chain NFT (max 96 bytes)",
      );
    }
    const shortUrl = shortenPayload.url;
    if (!shortUrl) throw new Error("Shorten response missing url");
    arc3Base = shortUrl.replace(/#arc3$/i, "");
  }
  const assetURL = toArc3MetadataUrl(arc3Base);

  return {
    policyId,
    departureUnix,
    departureIso,
    premiumAmountMicro: premiumMicro,
    premiumUsd,
    coverageUsd,
    metadataUri,
    assetURL,
    metadataFilename,
    metadata,
    nftName: `ZYURA Policy ${policyId}`,
    nftUnitName: `Z${policyId.toString().slice(-7)}`,
    zyuraAppIdStr,
  };
}

export async function finalizePurchasedMetadata(args: {
  nftAssetId: number;
  metadata: Record<string, unknown>;
  metadataFilename: string;
  policyId: number;
  productId: string;
  flightNumber: string;
  departureIso: string;
  premiumUsd: string;
  coverageUsd: string;
  zyuraAppIdStr: string;
}) {
  const {
    nftAssetId,
    metadata,
    metadataFilename,
    policyId,
    productId,
    flightNumber,
    departureIso,
    premiumUsd,
    coverageUsd,
    zyuraAppIdStr,
  } = args;
  const purchasedIso = new Date().toISOString();
  const purchasedUnix = Math.floor(Date.now() / 1000);
  const updatedMetadata = {
    ...metadata,
    zyura_app_id: zyuraAppIdStr,
    status: "ACTIVE",
    nft_asset_id: nftAssetId,
    purchased_at: purchasedIso,
    purchased_at_unix: purchasedUnix,
    description: [
      `Flight delay cover - ${flightNumber}, departs ${departureIso}. Premium ${premiumUsd}, coverage ${coverageUsd}.`,
      `Policy ${policyId} is ACTIVE; policy NFT ASA ${nftAssetId}. Purchased ${purchasedIso}.`,
      `Policy id ${policyId} (product ${productId}).`,
      "One wallet approval confirmed premium, policy registration, NFT delivery, link, and freeze in one atomic group.",
      `Authoritative status and payout flags live on-chain (Zyura app ${zyuraAppIdStr}, policy id ${policyId}); this file mirrors that for display.`,
    ].join(" "),
  };
  const finalizeRes = await fetch("/api/github/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: JSON.stringify(updatedMetadata, null, 2),
      filePath: metadataFilename,
      message: `Update metadata with NFT Asset ID ${nftAssetId} for Policy ${policyId}`,
    }),
  });
  const finalizePayload = await readApiJsonBody<{
    error?: string;
    details?: string;
  }>(finalizeRes);
  if (!finalizeRes.ok) {
    throw new Error(
      finalizePayload.error ||
        finalizePayload.details ||
        `Failed to update metadata after purchase (${finalizeRes.status})`,
    );
  }
}
