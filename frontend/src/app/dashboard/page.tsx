"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Plane,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Navbar1 } from "@/components/ui/navbar-1";
import { useAlgorandWallet } from "@/contexts/WalletConnectionProvider";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import algosdk from "algosdk";

// Import new components
import { BuyInsuranceHeader } from "@/components/dashboard/BuyInsuranceHeader";
import { FormField } from "@/components/dashboard/FormField";
import { HowItWorksCard } from "@/components/dashboard/HowItWorksCard";
import { MyPoliciesSection } from "@/components/dashboard/MyPoliciesSection";
import { ProductDetailsPanel } from "@/components/dashboard/ProductDetailsPanel";
import { PolicyModal } from "@/components/dashboard/PolicyModal";
import { InteractiveTutorial } from "@/components/dashboard/InteractiveTutorial";
import { PurchaseConfirmationCard } from "@/components/dashboard/PurchaseConfirmationCard";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  fetchAlgorandSuggestedParams,
  readApiJsonBody,
} from "@/lib/dashboard/algorand-utils";
import {
  getAssetOrAddressExplorerUrl,
  getGroupExplorerUrl,
  getPeraExplorerBase,
  getTxExplorerUrl,
} from "@/lib/dashboard/explorer-utils";
import {
  getDisplayFlightAndPnr,
  microToUsd,
  normalizePolicyStatusLoose,
  toSafeNumber,
} from "@/lib/dashboard/policy-utils";
import { useDashboardSectionNavigation } from "@/lib/dashboard/use-dashboard-section-navigation";
import type { LastPurchaseTx } from "@/lib/dashboard/types";
import { githubNftPathPublic } from "@/lib/github-metadata-paths";
import {
  ARC3_SUFFIX,
  toArc3MetadataUrl,
  utf8ByteLength,
} from "@/lib/shorten-url-for-asa";
import { Card, CardContent } from "@/components/ui/card";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected, peraWallet } = useAlgorandWallet();

  const connected = isConnected;
  const publicKey = address ? { toString: () => address } : (null as any);

  // Track if we've given wallet connect time to initialize (prevents blocking wallet connect)
  const [walletInitComplete, setWalletInitComplete] = useState(false);

  // Allow wallet connect to initialize - don't block immediately
  useEffect(() => {
    // Give wallet connect (autoConnect) time to initialize before checking connection
    // This prevents blocking wallet connect when it tries to access URLs with hash fragments
    const initTimer = setTimeout(() => {
      setWalletInitComplete(true);
    }, 1500); // Wait 1.5 seconds for wallet connect to initialize

    return () => clearTimeout(initTimer);
  }, []);

  // Redirect to home if wallet is not connected (after wallet connect has had time to initialize)
  useEffect(() => {
    // Only redirect after wallet connect has had time to initialize
    if (walletInitComplete && (!connected || !publicKey)) {
      router.push("/");
    }
  }, [walletInitComplete, connected, publicKey, router]);

  // Form state
  const [flightNumber, setFlightNumber] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [productId, setProductId] = useState("");
  const [pnr, setPnr] = useState("");

  // UI state
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const purchaseInFlightRef = useRef(false);
  const [isOptingInUsdc, setIsOptingInUsdc] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);
  const [isUsdcOptedIn, setIsUsdcOptedIn] = useState<boolean | null>(null);
  const [lastPurchaseTx, setLastPurchaseTx] = useState<LastPurchaseTx | null>(
    null,
  );

  // Data state
  const [products, setProducts] = useState<Array<{ id: string }>>([]);
  const [selectedProductInfo, setSelectedProductInfo] = useState<any | null>(
    null,
  );
  const [myPolicies, setMyPolicies] = useState<any[]>([]);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyModalData, setPolicyModalData] = useState<any>(null);
  const [fetchedPassenger, setFetchedPassenger] = useState<any | null>(null);
  const [isFetchingPnr, setIsFetchingPnr] = useState(false);
  const [pnrStatus, setPnrStatus] = useState<
    "fetching" | "found" | "not-found" | null
  >(null);
  const { activeSection } = useDashboardSectionNavigation();
  const [showAllPolicies, setShowAllPolicies] = useState(false);
  const [policiesFetchError, setPoliciesFetchError] = useState<string | null>(
    null,
  );
  const isMainnet = process.env.NEXT_PUBLIC_ALGOD_NETWORK === "mainnet";
  const peraExplorerBase = getPeraExplorerBase(isMainnet);
  const txExplorerUrl = getTxExplorerUrl(
    peraExplorerBase,
    lastPurchaseTx?.txId,
  );
  const groupExplorerUrl = getGroupExplorerUrl(
    peraExplorerBase,
    lastPurchaseTx?.groupId,
  );

  // Time options for departure time selector
  const timeOptions = React.useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        const value = `${hh}:${mm}`;
        const date = new Date();
        date.setHours(h, m, 0, 0);
        const label = date.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        });
        options.push({ value, label });
      }
    }
    return options;
  }, []);

  // Detect if user already has a policy for the entered PNR (block duplicate purchase)
  const getPolicyPnr = (p: any) =>
    (
      p.pnr ??
      p.metadata?.pnr ??
      p.metadata?.attributes?.find((a: any) => a.trait_type === "PNR")?.value ??
      ""
    )
      .toString()
      .trim();
  const existingPolicyForPnr = React.useMemo(() => {
    const pnrTrim = pnr.trim();
    if (!pnrTrim) return null;
    return (
      myPolicies.find((p) => {
        const existingPnr = getPolicyPnr(p);
        return (
          existingPnr && existingPnr.toLowerCase() === pnrTrim.toLowerCase()
        );
      }) ?? null
    );
  }, [myPolicies, pnr]);

  const fetchUsdcOptInStatus = async () => {
    if (!address) {
      setIsUsdcOptedIn(null);
      return;
    }
    const usdcAsaId = Number(process.env.NEXT_PUBLIC_USDC_ASA_ID || "0");
    if (!usdcAsaId) {
      setIsUsdcOptedIn(null);
      return;
    }
    try {
      const acctRes = await fetch(
        `/api/algorand/account/${encodeURIComponent(address)}`,
      );
      if (!acctRes.ok) {
        setIsUsdcOptedIn(null);
        return;
      }
      const acctData = (await acctRes.json()) as { assetIds?: number[] };
      setIsUsdcOptedIn((acctData.assetIds ?? []).includes(usdcAsaId));
    } catch {
      setIsUsdcOptedIn(null);
    }
  };

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch policies when Algorand wallet is ready and connected (after init to avoid stale address)
  useEffect(() => {
    if (!walletInitComplete) return;
    const hasAddress =
      address && typeof address === "string" && address.trim().length > 0;
    if (isConnected && hasAddress) {
      fetchMyPolicies();
      fetchUsdcOptInStatus();
    } else {
      setMyPolicies([]);
      setPoliciesFetchError(null);
      setIsUsdcOptedIn(null);
    }
  }, [walletInitComplete, isConnected, address]);

  useEffect(() => {
    // Confirmation card is session-scoped: reset when wallet/account changes.
    setLastPurchaseTx(null);
  }, [address]);

  useEffect(() => {
    const backfillGroupId = async () => {
      if (!lastPurchaseTx?.txId || lastPurchaseTx.groupId) return;
      try {
        const txInfoRes = await fetch(
          `/api/algorand/tx/${lastPurchaseTx.txId}`,
        );
        if (!txInfoRes.ok) return;
        const txInfo = (await txInfoRes.json()) as any;
        const rawGroup =
          txInfo?.txn?.txn?.grp ||
          txInfo?.txn?.grp ||
          txInfo?.group ||
          txInfo?.groupId;

        let derivedGroupId: string | undefined;
        if (typeof rawGroup === "string") {
          derivedGroupId = rawGroup;
        } else if (Array.isArray(rawGroup)) {
          derivedGroupId = Buffer.from(new Uint8Array(rawGroup)).toString(
            "base64",
          );
        } else if (
          rawGroup &&
          typeof rawGroup === "object" &&
          Object.keys(rawGroup).length > 0
        ) {
          const values = Object.values(rawGroup).map((v) => Number(v));
          if (values.every((v) => Number.isFinite(v))) {
            derivedGroupId = Buffer.from(new Uint8Array(values)).toString(
              "base64",
            );
          }
        }
        if (!derivedGroupId) return;

        const updatedSnapshot: LastPurchaseTx = {
          ...lastPurchaseTx,
          groupId: derivedGroupId,
        };
        setLastPurchaseTx(updatedSnapshot);
      } catch {
        // best-effort only
      }
    };
    backfillGroupId();
  }, [lastPurchaseTx]);

  // Auto-fetch PNR data when user enters 6-character PNR
  useEffect(() => {
    if (!pnr || pnr.length !== 6) {
      setFetchedPassenger(null);
      setPnrStatus(null);
      return;
    }

    const fetchPnrData = async () => {
      setIsFetchingPnr(true);
      setPnrStatus("fetching");
      try {
        const response = await fetch(
          `/api/zyura/pnr/search?pnr=${encodeURIComponent(pnr)}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (data.flight_number) setFlightNumber(data.flight_number);
          if (data.date) setDepartureDate(data.date);
          if (data.scheduled_departure_unix) {
            const depDate = new Date(data.scheduled_departure_unix * 1000);
            const hours = String(depDate.getUTCHours()).padStart(2, "0");
            const minutes = String(depDate.getUTCMinutes()).padStart(2, "0");
            setDepartureTime(`${hours}:${minutes}`);
          }
          if (data.passenger) {
            setFetchedPassenger(data.passenger);
          }
          setPnrStatus("found");
          toast.success("PNR found! Details auto-filled.");
        } else {
          setPnrStatus("not-found");
        }
      } catch (error) {
        console.error("Error fetching PNR:", error);
        setPnrStatus("not-found");
      } finally {
        setIsFetchingPnr(false);
      }
    };

    fetchPnrData();
  }, [pnr]);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      // Algorand stub: expose Zyura product IDs [1..5] without on-chain reads.
      const mapped = ["1", "2", "3", "4", "5"].map((id) => ({ id }));
      setProducts(mapped);
      if (!productId && mapped.length > 0) {
        const firstId = mapped[0].id;
        setProductId(firstId);
        await showProductById(firstId);
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load products", { description: e.message });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchMyPolicies = async (bypassCache = false) => {
    const walletAddress =
      address && typeof address === "string" ? address.trim() : "";
    if (!walletAddress) {
      setMyPolicies([]);
      setPoliciesFetchError(null);
      setIsLoadingPolicies(false);
      return;
    }

    setIsLoadingPolicies(true);
    setPoliciesFetchError(null);
    try {
      const cacheParam = bypassCache ? "?noCache=true" : "";
      const response = await fetch(
        `/api/zyura/policies/${encodeURIComponent(walletAddress)}${cacheParam}`,
      );
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const errMsg =
          (errBody as { error?: string })?.error ||
          response.statusText ||
          "Failed to fetch policies";
        console.error("Failed to fetch policies:", response.status, errMsg);
        setPoliciesFetchError(errMsg);
        setMyPolicies([]);
        return;
      }

      const data = await response.json();
      setMyPolicies(data.policies || []);
    } catch (error: any) {
      console.error("Error fetching policies:", error);
      setPoliciesFetchError(
        error?.message || "Network error. Please try again.",
      );
      setMyPolicies([]);
    } finally {
      setIsLoadingPolicies(false);
    }
  };

  const showProductById = async (id: string) => {
    try {
      const idNum = parseInt(id, 10);
      if (Number.isNaN(idNum)) return;

      // Fetch product data from Algorand chain
      const response = await fetch(`/api/zyura/product/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }

      const productData = await response.json();

      setSelectedProductInfo({
        id: idNum,
        product_id: idNum,
        delay_threshold_minutes:
          parseInt(productData.delay_threshold_minutes || "0", 10) || undefined,
        coverage_amount: productData.coverage_amount || "0", // Keep as string for ProductStatsCard to parse
        premium_rate_bps:
          parseInt(productData.premium_rate_bps || "0", 10) || undefined,
        claim_window_hours:
          parseInt(productData.claim_window_hours || "0", 10) || undefined,
        active: productData.active === true,
      });
    } catch (error: any) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product details", {
        description: error.message,
      });
      // Fallback to empty state
      setSelectedProductInfo(null);
    }
  };

  const handleOptInUsdc = async () => {
    const currentAddress = address;
    if (!connected || !currentAddress || !peraWallet) {
      toast.error("Please connect your wallet first");
      return;
    }
    const usdcAsaId = process.env.NEXT_PUBLIC_USDC_ASA_ID || "755796399";
    if (!usdcAsaId || usdcAsaId === "0") {
      toast.error("USDC asset ID not configured");
      return;
    }
    setIsOptingInUsdc(true);
    try {
      const { params: suggestedParams } = await fetchAlgorandSuggestedParams();
      const optInTxn =
        algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: currentAddress,
          receiver: currentAddress,
          amount: 0,
          assetIndex: Number(usdcAsaId),
          suggestedParams,
        });
      toast.info("Approve the transaction in Pera Wallet to opt in to USDC");
      const signed = await peraWallet.signTransaction([[{ txn: optInTxn }]]);
      const raw = Array.isArray(signed?.[0]) ? signed[0] : signed;
      if (!raw?.length) throw new Error("No signed transaction returned");
      const first = raw[0];
      const blob = first instanceof Uint8Array ? first : new Uint8Array(0);
      if (blob.length === 0) throw new Error("Invalid signed transaction");
      const signedBase64 = Buffer.from(blob).toString("base64");
      const sendRes = await fetch("/api/algorand/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTx: signedBase64 }),
      });
      if (!sendRes.ok) {
        const err = await sendRes.json();
        throw new Error(err.error || "Failed to send opt-in transaction");
      }
      const { txId } = await sendRes.json();
      toast.success("Opt-in successful! You can now purchase with USDC.", {
        description: `Tx: ${String(txId).slice(0, 12)}...`,
      });
      setIsUsdcOptedIn(true);
    } catch (error: any) {
      console.error("Opt-in error:", error);
      toast.error("Opt-in failed", {
        description:
          error?.message ||
          "Please try again. Make sure you're on Testnet and have a small amount of ALGO for fees.",
      });
    } finally {
      setIsOptingInUsdc(false);
    }
  };

  const handleBuy = async () => {
    if (
      !pnr ||
      !flightNumber ||
      !departureDate ||
      !departureTime ||
      !productId
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (pnr.length !== 6) {
      toast.error("PNR must be exactly 6 characters");
      return;
    }

    // Capture address immediately at the start to prevent it from changing during async operations
    const currentAddress = address;
    if (
      !connected ||
      !currentAddress ||
      typeof currentAddress !== "string" ||
      currentAddress.trim() === ""
    ) {
      console.error("Wallet connection check failed:", {
        connected,
        address,
        currentAddress,
        type: typeof address,
      });
      toast.error("Please connect your Algorand wallet");
      return;
    }

    // Validate address format
    if (currentAddress.length !== 58) {
      console.error("Invalid address format:", {
        address: currentAddress,
        length: currentAddress.length,
      });
      toast.error(
        "Invalid wallet address format. Please reconnect your wallet.",
      );
      return;
    }

    if (!peraWallet) {
      toast.error("Wallet not ready. Please wait a moment and try again.");
      return;
    }

    if (purchaseInFlightRef.current) {
      toast.info("A purchase is already in progress.");
      return;
    }
    purchaseInFlightRef.current = true;
    setIsSubmitting(true);

    // Track uploaded files for cleanup on failure
    const uploadedFiles: string[] = [];

    const cleanupUploadedFiles = async () => {
      if (uploadedFiles.length === 0) return;

      for (const filePath of uploadedFiles) {
        try {
          const delRes = await fetch("/api/github/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filePath,
              message: `Cleanup: Remove orphaned metadata due to failed transaction`,
            }),
          });
          if (!delRes.ok) {
            const err = await delRes.json();
            console.warn(
              `Failed to delete ${filePath}:`,
              err.error || delRes.statusText,
            );
          }
        } catch (cleanupError: any) {
          console.warn(
            `Failed to cleanup ${filePath}:`,
            cleanupError?.message || cleanupError,
          );
        }
      }
    };

    try {
      const departureDateTime = new Date(
        `${departureDate}T${departureTime}:00Z`,
      );
      const departureUnix = Math.floor(departureDateTime.getTime() / 1000);
      const policyId = Math.floor(Date.now() / 1000) % 1000000;

      // Fetch selected product from API so metadata/SVG use real coverage and premium (not stub or metadata)
      toast.info("Loading coverage and premium for this product…");
      const productResForMeta = await fetch(`/api/zyura/product/${productId}`);
      if (!productResForMeta.ok) {
        throw new Error("Failed to fetch product details");
      }
      const productDataForMeta = await productResForMeta.json();
      const coverageAmountMicro = BigInt(
        productDataForMeta.coverage_amount || "0",
      );
      const premiumRateBps = BigInt(productDataForMeta.premium_rate_bps || "0");
      const coverageUsdNum = Number(coverageAmountMicro) / 1_000_000;
      const premiumMicro =
        (coverageAmountMicro * premiumRateBps) / BigInt(10000);
      const premiumUsdNum = Number(premiumMicro) / 1_000_000;

      toast.info("Saving your policy artwork and details…");

      // Load and customize SVG template
      const svgResponse = await fetch("/zyura-nft-insurance.svg");
      let svg = await svgResponse.text();
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

      svg = svg
        .replaceAll("[FLIGHT_NUMBER]", flightNumber)
        .replaceAll("[POLICY_ID]", policyId.toString())
        .replaceAll("[PRODUCT_ID]", productId)
        .replaceAll("[DEPARTURE_ISO]", departureIso)
        .replaceAll("[PREMIUM_6DP]", premiumUsd)
        .replaceAll("[COVERAGE_6DP]", coverageUsd)
        .replaceAll("[PNR]", pnr || "[PNR]");

      // Use standard path structure (wallet/policyId)
      // URL will be shortened by the upload API if it exceeds 96 bytes
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
      uploadedFiles.push(svgFilename); // Track for cleanup

      const zyuraAppIdStr = String(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "");
      const explorerAppUrl =
        process.env.NEXT_PUBLIC_ALGOD_NETWORK === "mainnet"
          ? `https://explorer.perawallet.app/application/${zyuraAppIdStr}`
          : `https://testnet.explorer.perawallet.app/application/${zyuraAppIdStr}`;

      // Minimal ARC-3 JSON: human fields at top level; dev/verification detail in description only.
      const metadata: Record<string, unknown> = {
        name: `ZYURA Policy ${policyId} · ${flightNumber}`,
        description: [
          `Flight delay cover — ${flightNumber}, departs ${departureIso}. Premium ${premiumUsd}, coverage ${coverageUsd}.`,
          `Policy id ${policyId} (product ${productId}).`,
          `Authoritative state is on-chain in the Zyura application (Algorand app ID ${zyuraAppIdStr}): holder, policy NFT ASA id, and status in contract storage — not this file.`,
          `This JSON updates after purchase; for payout, status becomes CLAIMED on-chain first, then metadata may be refreshed.`,
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

      // Upload metadata (standard path - URL will be shortened if needed)
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
      if (!metadataUri) {
        throw new Error("Upload succeeded but response had no metadata url");
      }
      uploadedFiles.push(metadataFilename); // Track for cleanup

      // ARC-3: on-chain url = GitHub policy.json shortened (is.gd) + "#arc3" — upload API already shortens.
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
        if (!shortUrl) {
          throw new Error("Shorten response missing url");
        }
        arc3Base = shortUrl.replace(/#arc3$/i, "");
      }
      const assetURL = toArc3MetadataUrl(arc3Base);

      // Premium must match on-chain required premium (contract reads coverage + rate from product boxes)
      const requiredPremium = premiumMicro;
      const premiumAmountMicro = requiredPremium;

      // Get Algorand network config
      const appId = BigInt(process.env.NEXT_PUBLIC_ZYURA_APP_ID || "0");
      const usdcAsaId = BigInt(process.env.NEXT_PUBLIC_USDC_ASA_ID || "0");

      if (!appId || appId === BigInt(0)) {
        throw new Error("NEXT_PUBLIC_ZYURA_APP_ID not set");
      }
      if (!usdcAsaId || usdcAsaId === BigInt(0)) {
        throw new Error("NEXT_PUBLIC_USDC_ASA_ID not set");
      }

      // Fetch vault address from API
      toast.info("Loading where to send your premium…");
      const vaultApiRes = await fetch("/api/zyura/vault");
      if (!vaultApiRes.ok) {
        const error = await vaultApiRes.json();
        throw new Error(error.error || "Failed to get vault address");
      }
      const vaultData = await vaultApiRes.json();
      const vaultAddr = vaultData.vault;

      if (!vaultAddr) {
        throw new Error(
          "Vault address not found - please set RISK_POOL_VAULT_ADDR in .env",
        );
      }

      const createBoxName = (
        prefix: string,
        key: bigint | number | string,
      ): Uint8Array => {
        const keyBytes = algosdk.encodeUint64(BigInt(key));
        const prefixBytes = new TextEncoder().encode(prefix);
        const result = new Uint8Array(prefixBytes.length + keyBytes.length);
        result.set(prefixBytes, 0);
        result.set(keyBytes, prefixBytes.length);
        return result;
      };

      const boxReferences = [
        createBoxName("p_active", productId),
        createBoxName("p_pri", productId),
        createBoxName("p_sch", productId),
        createBoxName("pol_status", policyId),
        createBoxName("pol_holder", policyId),
        createBoxName("pol_coverage", policyId),
        createBoxName("pol_tim", policyId),
      ];

      const nftName = `ZYURA Policy ${policyId}`;
      const policyIdStr = policyId.toString();
      const nftUnitName = `Z${policyIdStr.slice(-7)}`;

      toast.info("Creating your policy NFT ASA (issuer)…");
      const preMintRes = await fetch("/api/zyura/mint-policy-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createBeforePurchase",
          policyId: String(policyId),
          recipient: currentAddress,
          assetURL,
          assetName: nftName,
          unitName: nftUnitName,
        }),
      });
      if (!preMintRes.ok) {
        const err = await preMintRes.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ||
            "Failed to create policy NFT ASA before purchase",
        );
      }
      const preMint = (await preMintRes.json()) as { assetId?: number };
      if (preMint.assetId == null) {
        throw new Error("Mint API did not return assetId");
      }
      const nftAssetId = preMint.assetId;

      let suggestedParams: algosdk.SuggestedParams;
      let optParamsRaw: Record<string, unknown>;
      try {
        const fp = await fetchAlgorandSuggestedParams();
        suggestedParams = fp.params;
        optParamsRaw = fp.raw;
      } catch (fetchError: any) {
        console.error("Fetch error:", fetchError);
        throw new Error(
          `${fetchError?.message ?? "Failed to get transaction params"}. Make sure your Next.js dev server is running and Algorand node is running (algokit localnet status).`,
        );
      }

      const noopIssuerSigner: algosdk.TransactionSigner = async (_txns, idxs) =>
        idxs.map(() => new Uint8Array(0));

      // Atomic group: USDC [opt-in] + purchase + NFT opt-in + xfer + link + freeze (one Pera approval).
      const transferUsdcTxn =
        algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: currentAddress,
          receiver: vaultAddr,
          amount: Number(premiumAmountMicro),
          assetIndex: Number(usdcAsaId),
          suggestedParams,
        });

      const purchasePolicyMethod = new algosdk.ABIMethod({
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

      const peraSigner: algosdk.TransactionSigner = async (
        txnGroup: algosdk.Transaction[],
        indexes: number[],
      ) => {
        const groupTxnArray = txnGroup.map((txn: algosdk.Transaction) => ({
          txn,
        }));
        const rawSigned = await peraWallet.signTransaction([groupTxnArray]);
        const signedGroup =
          rawSigned?.length === 1 &&
          Array.isArray(rawSigned[0]) &&
          rawSigned[0].length === txnGroup.length
            ? rawSigned[0]
            : rawSigned;
        if (!signedGroup?.length || signedGroup.length !== txnGroup.length) {
          throw new Error(
            `Expected ${txnGroup.length} signed transactions. If you cancelled signing or only approved part of the group, try again and approve all transactions.`,
          );
        }
        return indexes.map((i: number) =>
          signedGroup[i] instanceof Uint8Array
            ? signedGroup[i]
            : new Uint8Array(0),
        );
      };

      const acctRes = await fetch(
        `/api/algorand/account/${encodeURIComponent(currentAddress)}`,
      );
      if (!acctRes.ok) {
        const err = await acctRes.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error || "Failed to load account assets",
        );
      }
      const acctData = (await acctRes.json()) as { assetIds?: number[] };
      const needsUsdcOptIn = !(acctData.assetIds ?? []).includes(
        Number(usdcAsaId),
      );

      const xferPrepRes = await fetch("/api/zyura/mint-policy-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unsignedNftDelivery",
          policyId: String(policyId),
          recipient: currentAddress,
          assetId: nftAssetId,
          suggestedParams: optParamsRaw,
        }),
      });
      if (!xferPrepRes.ok) {
        const err = await xferPrepRes.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ||
            "Failed to prepare NFT transfer + freeze",
        );
      }
      const xferPrep = (await xferPrepRes.json()) as {
        unsignedTransferB64?: string;
        unsignedFreezeB64?: string;
      };
      if (!xferPrep.unsignedTransferB64 || !xferPrep.unsignedFreezeB64) {
        throw new Error(
          "Mint API did not return transfer + freeze transactions",
        );
      }
      const xferTxn = algosdk.decodeUnsignedTransaction(
        new Uint8Array(Buffer.from(xferPrep.unsignedTransferB64, "base64")),
      );
      const freezeNftTxn = algosdk.decodeUnsignedTransaction(
        new Uint8Array(Buffer.from(xferPrep.unsignedFreezeB64, "base64")),
      );
      const optInNftTxn =
        algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: currentAddress,
          receiver: currentAddress,
          amount: 0,
          assetIndex: nftAssetId,
          suggestedParams,
        });

      const linkMethod = new algosdk.ABIMethod({
        name: "linkPolicyNft",
        args: [
          { type: "uint64", name: "policyId" },
          { type: "uint64", name: "nftAssetId" },
        ],
        returns: { type: "void" },
      });

      const purchaseAtc = new algosdk.AtomicTransactionComposer();
      if (needsUsdcOptIn) {
        const usdcOptInTxn =
          algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            sender: currentAddress,
            receiver: currentAddress,
            amount: 0,
            assetIndex: Number(usdcAsaId),
            suggestedParams,
          });
        purchaseAtc.addTransaction({ txn: usdcOptInTxn, signer: peraSigner });
      }
      purchaseAtc.addMethodCall({
        appID: Number(appId),
        method: purchasePolicyMethod,
        methodArgs: [
          { txn: transferUsdcTxn, signer: peraSigner },
          BigInt(policyId),
          BigInt(productId),
          flightNumber,
          BigInt(departureUnix),
          premiumAmountMicro,
          true,
          metadataUri,
          BigInt(nftAssetId),
        ],
        sender: currentAddress,
        suggestedParams,
        signer: peraSigner,
        boxes: boxReferences.map((boxName) => ({
          appIndex: Number(appId),
          name: boxName,
        })),
      });

      const fullAtc = purchaseAtc.clone();
      fullAtc.addTransaction({ txn: optInNftTxn, signer: peraSigner });
      fullAtc.addTransaction({ txn: xferTxn, signer: noopIssuerSigner });
      fullAtc.addMethodCall({
        appID: Number(appId),
        method: linkMethod,
        methodArgs: [BigInt(policyId), BigInt(nftAssetId)],
        sender: currentAddress,
        suggestedParams,
        signer: peraSigner,
        boxes: [
          {
            appIndex: Number(appId),
            name: createBoxName("pol_holder", policyId),
          },
          { appIndex: Number(appId), name: createBoxName("pol_nft", policyId) },
        ],
        appAccounts: [currentAddress],
        appForeignAssets: [Number(nftAssetId)],
      });
      fullAtc.addTransaction({ txn: freezeNftTxn, signer: noopIssuerSigner });

      const built = fullAtc.buildGroup();
      const nTx = built.length;
      const idxXfer = needsUsdcOptIn ? 4 : 3;
      const idxFreeze = needsUsdcOptIn ? 6 : 5;

      const groupedXferB64 = Buffer.from(
        algosdk.encodeUnsignedTransaction(built[idxXfer]!.txn),
      ).toString("base64");
      const groupedFreezeB64 = Buffer.from(
        algosdk.encodeUnsignedTransaction(built[idxFreeze]!.txn),
      ).toString("base64");

      const signXferRes = await fetch("/api/zyura/mint-policy-nft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signNftDelivery",
          policyId: String(policyId),
          recipient: currentAddress,
          assetId: nftAssetId,
          unsignedGroupedTransferB64: groupedXferB64,
          unsignedGroupedFreezeB64: groupedFreezeB64,
        }),
      });
      if (!signXferRes.ok) {
        const err = await signXferRes.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ||
            "Failed to sign issuer NFT transfer + freeze",
        );
      }
      const signXferJson = (await signXferRes.json()) as {
        signedXferB64?: string;
        signedFreezeB64?: string;
      };
      if (!signXferJson.signedXferB64 || !signXferJson.signedFreezeB64) {
        throw new Error("Server did not return signed transfer + freeze");
      }
      const signedXferBlob = new Uint8Array(
        Buffer.from(signXferJson.signedXferB64, "base64"),
      );
      const signedFreezeBlob = new Uint8Array(
        Buffer.from(signXferJson.signedFreezeB64, "base64"),
      );

      const labels = needsUsdcOptIn
        ? [
            "Opt in to USDC",
            "Pay premium (USDC)",
            "Register your policy on Zyura",
            "Opt in to policy NFT",
            "Deliver policy NFT",
            "Link policy NFT to your policy",
            "Freeze policy NFT (soulbound)",
          ]
        : [
            "Pay premium (USDC)",
            "Register your policy on Zyura",
            "Opt in to policy NFT",
            "Deliver policy NFT",
            "Link policy NFT to your policy",
            "Freeze policy NFT (soulbound)",
          ];

      toast.info(
        "Approve once in Pera: premium, policy, receive NFT, link, and freeze (single approval).",
      );
      const signedRaw = await peraWallet.signTransaction([
        built.map((tw, i) => ({
          txn: tw.txn,
          signers: i === idxXfer || i === idxFreeze ? [] : undefined,
          message: labels[i] ?? `Transaction ${i + 1}`,
        })),
      ]);
      const parts =
        signedRaw?.length === 1 && Array.isArray(signedRaw[0])
          ? signedRaw[0]
          : signedRaw;
      if (!parts || parts.length < nTx) {
        throw new Error(
          "Wallet did not return a full signature set for the atomic group — try again.",
        );
      }

      const combined = new Uint8Array(
        Array.from({ length: nTx }, (_, i) => {
          if (i === idxXfer) return signedXferBlob.length;
          if (i === idxFreeze) return signedFreezeBlob.length;
          const p = parts[i];
          return p instanceof Uint8Array ? p.length : 0;
        }).reduce((a, b) => a + b, 0),
      );
      let cOff = 0;
      for (let i = 0; i < nTx; i++) {
        if (i === idxXfer) {
          combined.set(signedXferBlob, cOff);
          cOff += signedXferBlob.length;
        } else if (i === idxFreeze) {
          combined.set(signedFreezeBlob, cOff);
          cOff += signedFreezeBlob.length;
        } else {
          const p = parts[i];
          if (!(p instanceof Uint8Array) || !p.length) {
            throw new Error(
              `Wallet missing signature for transaction index ${i} — try again.`,
            );
          }
          combined.set(p, cOff);
          cOff += p.length;
        }
      }

      const signedBase64 = Buffer.from(combined).toString("base64");

      const sendRes = await fetch("/api/algorand/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTx: signedBase64 }),
      });
      if (!sendRes.ok) {
        const error = await sendRes.json();
        const errMsg = error.error || "Failed to send grouped transaction";
        throw new Error(errMsg);
      }
      await sendRes.json();
      const groupTxIds = built.map((tw) => tw.txn.txID().toString());

      {
        toast.info("Waiting for the network to confirm…");
        let confirmed = false;
        let attempts = 0;
        while (!confirmed && attempts < 25) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const txInfoRes = await fetch(`/api/algorand/tx/${groupTxIds[0]}`);
          if (txInfoRes.ok) {
            const txInfo = await txInfoRes.json();
            if (txInfo.confirmedRound) {
              confirmed = true;
            }
          }
          attempts++;
        }
        if (!confirmed) {
          throw new Error("Transaction confirmation timeout");
        }
      }

      if (nftAssetId) {
        const purchasedIso = new Date().toISOString();
        const purchasedUnix = Math.floor(Date.now() / 1000);
        const updatedMetadata = {
          ...metadata,
          status: "ACTIVE",
          nft_asset_id: nftAssetId,
          purchased_at: purchasedIso,
          purchased_at_unix: purchasedUnix,
          description: [
            `Flight delay cover - ${flightNumber}, departs ${departureIso}. Premium ${premiumUsd}, coverage ${coverageUsd}.`,
            `Policy ${policyId} is ACTIVE; policy NFT ASA ${nftAssetId}. Purchased ${purchasedIso}.`,
            `Policy id ${policyId} (product ${productId}).`,
            `One wallet approval confirmed premium, policy registration, NFT delivery, link, and freeze in one atomic group.`,
            `Authoritative status and payout flags live on-chain (Zyura app ${zyuraAppIdStr}, policy id ${policyId}); this file mirrors that for display.`,
          ].join(" "),
        };
        await fetch("/api/github/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: JSON.stringify(updatedMetadata, null, 2),
            filePath: metadataFilename,
            message: `Update metadata with NFT Asset ID ${nftAssetId} for Policy ${policyId}`,
          }),
        }).then((r) => {
          if (!r.ok)
            console.warn("Failed to update metadata with NFT asset ID");
        });
      }

      const stepTxs = built.map((tw, i) => {
        const t = tw.txn as any;
        const txType =
          t.type === "axfer"
            ? "Asset Transfer"
            : t.type === "appl"
              ? "Application Call"
              : t.type === "afrz"
                ? "Asset Freeze"
                : t.type;
        const label = labels[i] || `Step ${i + 1}`;
        const appLabel = `App ${appId.toString()}`;
        const issuerAddr = process.env.ADMIN_ADDRESS || "Issuer";
        let from = "Wallet";
        let to = "Wallet";
        let summary = "On-chain step";

        switch (label) {
          case "Opt in to USDC":
            from = currentAddress;
            to = currentAddress;
            summary = "Enable USDC for payments (amount 0).";
            break;
          case "Pay premium (USDC)":
            from = currentAddress;
            to = vaultAddr;
            summary = `Transfer premium $${(Number(premiumAmountMicro) / 1_000_000).toFixed(2)} tUSDC to vault.`;
            break;
          case "Register your policy on Zyura":
            from = currentAddress;
            to = appLabel;
            summary = `Call purchasePolicy for policy ${policyId}.`;
            break;
          case "Opt in to policy NFT":
            from = currentAddress;
            to = currentAddress;
            summary = "Enable receiving policy NFT (amount 0).";
            break;
          case "Deliver policy NFT":
            from = issuerAddr;
            to = currentAddress;
            summary = "Send 1 policy NFT ASA to wallet.";
            break;
          case "Link policy NFT to your policy":
            from = currentAddress;
            to = appLabel;
            summary = "Link NFT ASA id to policy storage.";
            break;
          case "Freeze policy NFT (soulbound)":
            from = issuerAddr;
            to = currentAddress;
            summary = "Freeze NFT holding to enforce non-transferability.";
            break;
        }
        return {
          txId: tw.txn.txID().toString(),
          label,
          type: txType || "Transaction",
          from,
          to,
          summary,
        };
      });
      const premiumTransferStep = stepTxs.find(
        (s) => s.label === "Pay premium (USDC)",
      );
      const groupId = built[0]?.txn.group
        ? Buffer.from(built[0].txn.group).toString("base64")
        : undefined;

      const purchaseSnapshot: LastPurchaseTx = {
        txId: groupTxIds[0],
        groupId,
        policyId: String(policyId),
        nftAssetId: nftAssetId ? String(nftAssetId) : undefined,
        purchasedAtIso: new Date().toISOString(),
        steps: stepTxs,
        premiumTransfer: premiumTransferStep
          ? {
              txId: premiumTransferStep.txId,
              amountMicro: Number(premiumAmountMicro),
              amountUsd: (Number(premiumAmountMicro) / 1_000_000).toFixed(2),
              receiver: vaultAddr,
            }
          : undefined,
      };
      setLastPurchaseTx(purchaseSnapshot);

      toast.success("You’re covered — policy purchased.", {
        description: nftAssetId
          ? `One approval · policy NFT #${nftAssetId} · Tx ${groupTxIds[0].slice(0, 10)}…`
          : `Confirmed · Tx ${groupTxIds[0].slice(0, 10)}…`,
      });

      toast.info("Linking your PNR to this policy…");
      const pnrRegisterRes = await fetch("/api/zyura/pnr/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pnr,
          policyId,
          policyholder: address,
          flightNumber,
          date: departureDate,
          departureUnix,
          passenger: fetchedPassenger,
          wallet: address,
          nft_metadata_url: metadataUri,
        }),
      });

      if (!pnrRegisterRes.ok) {
        const err = await pnrRegisterRes.json();
        console.warn("Failed to register PNR:", err);
        // Don't throw - policy purchase was successful
      }

      // Reset form
      setFlightNumber("");
      setDepartureDate("");
      setDepartureTime("");
      setPnr("");
      setProductId("");
      setFetchedPassenger(null);
      setPnrStatus(null);
      setShowBuyForm(false);

      // Refresh policies with cache bypass. Indexer can lag a few seconds after NFT delivery.
      setTimeout(() => {
        fetchMyPolicies(true);
      }, 5000);
    } catch (error: any) {
      console.error("Purchase error:", error);

      // Clean up any uploaded files since the transaction failed
      await cleanupUploadedFiles();

      const msg = error?.message ?? "";
      const isUsdcOptIn =
        /asset\s+(\d+)\s+missing\s+from/i.test(msg) ||
        msg.includes("missing from");
      const isMinBalance =
        /balance\s+\d+\s+below\s+min\s+\d+/i.test(msg) ||
        /below min.*\(0 assets\)/i.test(msg);
      const shortAccountMatch = msg.match(/account\s+([A-Z2-7]{58})\s+balance/);
      const usdcAssetId = process.env.NEXT_PUBLIC_USDC_ASA_ID || "755796399";

      let description: string;
      if (isUsdcOptIn) {
        description = `Your wallet is not opted in to USDC (Testnet). In Pera Wallet, add asset ${usdcAssetId} (USDC) and try again.`;
      } else if (isMinBalance) {
        const shortAddr = shortAccountMatch ? shortAccountMatch[1] : null;
        const isYourWallet =
          currentAddress && shortAddr && shortAddr === currentAddress;
        if (isYourWallet) {
          description =
            "Your ALGO balance is below the network minimum for this transaction. Add at least 0.1 ALGO and try again.";
        } else {
          if (shortAddr) {
            console.warn(
              "[ZYURA] Account with low ALGO (fund with ≥0.2 ALGO):",
              shortAddr,
            );
          }
          description = shortAddr
            ? `The vault has insufficient ALGO. Send at least 0.2 ALGO to the vault address (see console for full address).`
            : "An account in this transaction (often the vault) has insufficient ALGO. Fund it with at least 0.2 ALGO and try again.";
        }
      } else if (
        /shorten|96 character/i.test(msg) ||
        msg.includes("policy link for the blockchain")
      ) {
        description =
          "We couldn’t prepare the short link for your policy on the blockchain. Try again in a moment, turn off VPN, or switch networks.";
      } else if (/request pending|another request.*in progress/i.test(msg)) {
        description =
          "Pera already had a signing request open. Fully close the Pera app (or disconnect on this site), wait a few seconds, reconnect, and try again — approve one prompt at a time.";
      } else {
        description = msg || "Please try again.";
      }

      toast.error("Purchase didn’t complete", { description });
    } finally {
      purchaseInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const openPolicyModal = async (policy: any) => {
    const policyId = toSafeNumber(policy.id);
    const productIdAttr = toSafeNumber(policy.product_id);
    const dep = toSafeNumber(policy.departure_time);
    const premium6 = toSafeNumber(policy.premium_paid);
    const coverage6 = toSafeNumber(policy.coverage_amount);

    let status = normalizePolicyStatusLoose(policy.status);
    const statusFromMeta =
      policy.metadata?.status ??
      policy.metadata?.attributes?.find((a: any) => a.trait_type === "Status")
        ?.value;
    if (statusFromMeta && typeof statusFromMeta === "string") {
      status = normalizePolicyStatusLoose(statusFromMeta);
    }

    const departureIso = new Date(dep * 1000).toISOString();
    const premiumUsd = microToUsd(premium6);
    const coverageUsd = microToUsd(coverage6);

    const explorerUrl = getAssetOrAddressExplorerUrl(
      peraExplorerBase,
      policy.assetId,
      address,
    );

    const { flight: flightValue, pnr: pnrValue } =
      getDisplayFlightAndPnr(policy);

    // Try to fetch NFT metadata and image
    let imageUrl: string | undefined;
    let metadataUrl: string | undefined;
    const walletAddress = address || policy.wallet || "";
    const metaRepo =
      process.env.NEXT_PUBLIC_GITHUB_METADATA_REPO ||
      process.env.NEXT_PUBLIC_GITHUB_NFT_REPO ||
      "alienx5499/Zyura-Algorand-HackSeries3-MetaData";
    const metaBranch =
      process.env.NEXT_PUBLIC_GITHUB_NFT_BRANCH ||
      process.env.NEXT_PUBLIC_GITHUB_BRANCH ||
      "main";
    const metaPath = githubNftPathPublic();
    const expectedSvgUrl = `https://raw.githubusercontent.com/${metaRepo}/${metaBranch}/${metaPath}/${walletAddress}/${policyId}/policy.svg`;
    const expectedJsonUrl = `https://raw.githubusercontent.com/${metaRepo}/${metaBranch}/${metaPath}/${walletAddress}/${policyId}/policy.json`;

    // Use imageUrl from policy if available (from GitHub API)
    // Check both policy.imageUrl and policy.metadata.image
    if (policy.imageUrl) {
      imageUrl = policy.imageUrl;
      metadataUrl = policy.metadataUrl;
    } else if (policy.metadata?.image) {
      imageUrl = policy.metadata.image;
      metadataUrl = policy.metadataUrl;
    } else {
      try {
        // Try to fetch the metadata JSON
        const metadataResponse = await fetch(expectedJsonUrl);
        if (metadataResponse.ok) {
          const metadata = await metadataResponse.json();
          imageUrl = metadata.image || expectedSvgUrl;
          metadataUrl = expectedJsonUrl;
        } else {
          // Fallback to expected SVG URL
          imageUrl = expectedSvgUrl;
        }
      } catch (error) {
        console.warn("Could not fetch NFT metadata, using fallback:", error);
        imageUrl = expectedSvgUrl;
      }
    }

    setPolicyModalData({
      policyId,
      productId: productIdAttr,
      status,
      flight: flightValue,
      pnr: pnrValue,
      departureIso,
      premiumUsd,
      coverageUsd,
      explorerUrl,
      payoutTxId: policy.payoutTxId,
      imageUrl,
      metadataUrl,
      expectedJsonUrl,
      expectedSvgUrl,
    });
    setShowPolicyModal(true);
  };

  // Don't show dashboard content to unconnected users
  // But allow page to mount so wallet connect can initialize
  // Redirect will happen via useEffect above after wallet connect has initialized
  if (!connected || !publicKey) {
    // Show blank/loading screen - don't render dashboard content
    // Page still mounts in background for wallet connect to initialize
    return null;
  }

  return (
    <>
      <Navbar1 />
      <main className="min-h-screen bg-black pt-24 pb-16">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            id="dashboard"
            data-section="dashboard"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              duration: 0.6,
            }}
            className="mb-8 md:mb-12 scroll-mt-32"
          >
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-white mb-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            >
              Dashboard
            </motion.h1>
            <motion.p
              className="text-gray-400 text-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            >
              Manage your flight delay insurance policies
            </motion.p>
          </motion.div>

          {/* Last Purchase Banner - Shows transaction details after successful purchase */}
          <AnimatePresence>
            {lastPurchaseTx && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mb-6 relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-3xl md:p-3"
              >
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <PurchaseConfirmationCard
                  policyId={lastPurchaseTx.policyId}
                  nftAssetId={lastPurchaseTx.nftAssetId}
                  purchasedAtIso={lastPurchaseTx.purchasedAtIso}
                  txId={lastPurchaseTx.txId}
                  groupId={lastPurchaseTx.groupId}
                  txExplorerUrl={txExplorerUrl}
                  groupExplorerUrl={groupExplorerUrl}
                  onCopyGroupId={async () => {
                    if (!lastPurchaseTx.groupId) return;
                    try {
                      await navigator.clipboard.writeText(
                        lastPurchaseTx.groupId,
                      );
                      toast.success("Group ID copied");
                    } catch {
                      toast.error("Failed to copy Group ID");
                    }
                  }}
                  onCopyTxId={async () => {
                    try {
                      await navigator.clipboard.writeText(lastPurchaseTx.txId);
                      toast.success("Transaction ID copied");
                    } catch {
                      toast.error("Failed to copy transaction ID");
                    }
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Primary Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Buy Insurance Section */}
              <motion.section
                id="buy"
                data-section="buy"
                initial={{ opacity: 0, y: 30 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  borderColor:
                    activeSection === "buy"
                      ? "rgba(99, 102, 241, 0.5)"
                      : undefined,
                }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
                className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-3xl md:p-3 scroll-mt-32"
              >
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <Card className="relative overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black">
                  <CardContent className="p-6 md:p-8">
                    <BuyInsuranceHeader
                      showBuyForm={showBuyForm}
                      onToggleBuyForm={() => setShowBuyForm((s) => !s)}
                    />

                    <AnimatePresence>
                      {!connected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3"
                        >
                          <motion.div
                            animate={{
                              rotate: [0, -10, 10, -10, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatDelay: 3,
                            }}
                          >
                            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          </motion.div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              Wallet Not Connected
                            </p>
                            <p className="text-xs text-gray-300 mt-1">
                              Connect your wallet to purchase insurance
                              policies.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {showBuyForm && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, scale: 0.98 }}
                          animate={{ height: "auto", opacity: 1, scale: 1 }}
                          exit={{ height: 0, opacity: 0, scale: 0.98 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                            mass: 0.8,
                          }}
                          className="overflow-hidden"
                        >
                          <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.15,
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                            }}
                          >
                            {/* Opt-in to USDC (required only if wallet is not opted in) */}
                            {isUsdcOptedIn === false && (
                              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm text-amber-200/90">
                                  First time? Your wallet must opt in to USDC
                                  (Testnet) before you can pay the premium.
                                  One-time step.
                                </p>
                                <button
                                  type="button"
                                  onClick={handleOptInUsdc}
                                  disabled={
                                    !connected ||
                                    !peraWallet ||
                                    isOptingInUsdc ||
                                    isSubmitting
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-200 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
                                >
                                  {isOptingInUsdc
                                    ? "Sign in wallet…"
                                    : !peraWallet
                                      ? "Loading…"
                                      : "Opt in to USDC"}
                                </button>
                              </div>
                            )}
                            {/* Form Fields */}
                            <motion.div
                              className="space-y-4"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 }}
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Product Selection */}
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium text-white">
                                    Product *
                                  </label>
                                  <select
                                    value={productId}
                                    onChange={async (e) => {
                                      const v = e.target.value;
                                      setProductId(v);
                                      if (v) await showProductById(v);
                                    }}
                                    disabled={
                                      !connected ||
                                      isSubmitting ||
                                      isLoadingProducts
                                    }
                                    className="w-full px-4 py-2.5 bg-black border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                                  >
                                    <option value="" disabled>
                                      {products.length
                                        ? "Select a product"
                                        : "Loading..."}
                                    </option>
                                    {products.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        Product {p.id}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* PNR Field */}
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2 }}
                                >
                                  <FormField
                                    label="PNR"
                                    required
                                    value={pnr}
                                    onChange={(e) => {
                                      setPnr(e.target.value.toUpperCase());
                                      if (e.target.value.length !== 6) {
                                        setPnrStatus(null);
                                        setFetchedPassenger(null);
                                      }
                                    }}
                                    placeholder="6-character code"
                                    disabled={!connected || isSubmitting}
                                    className={
                                      pnrStatus === "fetching" ? "relative" : ""
                                    }
                                    helperText={
                                      pnrStatus === "fetching" ? (
                                        <motion.span
                                          className="flex items-center gap-2 text-indigo-400"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                        >
                                          <motion.div
                                            className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{
                                              duration: 1,
                                              repeat: Infinity,
                                              ease: "linear",
                                            }}
                                          />
                                          Fetching PNR details...
                                        </motion.span>
                                      ) : pnrStatus === "found" ? (
                                        <motion.span
                                          className="flex items-center gap-2 text-emerald-400"
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 300,
                                          }}
                                        >
                                          <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                              delay: 0.2,
                                              type: "spring",
                                              stiffness: 400,
                                            }}
                                          >
                                            ✓
                                          </motion.div>
                                          PNR found, details auto-filled
                                        </motion.span>
                                      ) : pnrStatus === "not-found" ? (
                                        <span className="text-amber-400">
                                          PNR not found, enter manually
                                        </span>
                                      ) : (
                                        ("Enter your 6-character PNR for auto-fill" as React.ReactNode)
                                      )
                                    }
                                  />
                                </motion.div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <motion.div
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{
                                    opacity: 1,
                                    x: 0,
                                    scale:
                                      pnrStatus === "found" ? [1, 1.02, 1] : 1,
                                  }}
                                  transition={{
                                    delay: 0.25,
                                    scale:
                                      pnrStatus === "found"
                                        ? {
                                            duration: 0.6,
                                            times: [0, 0.5, 1],
                                          }
                                        : {},
                                  }}
                                >
                                  <FormField
                                    label="Flight Number"
                                    required
                                    value={flightNumber}
                                    onChange={(e) =>
                                      setFlightNumber(
                                        e.target.value.toUpperCase(),
                                      )
                                    }
                                    placeholder="e.g., AI202, AP986"
                                    disabled={
                                      !connected ||
                                      isSubmitting ||
                                      pnrStatus === "found"
                                    }
                                    showLockIcon={pnrStatus === "found"}
                                    className={
                                      pnrStatus === "found"
                                        ? "border-2 border-amber-500/50 shadow-[0_0_0_2px_rgba(251,191,36,0.2)]"
                                        : ""
                                    }
                                  />
                                </motion.div>

                                <motion.div
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{
                                    opacity: 1,
                                    x: 0,
                                    scale:
                                      pnrStatus === "found" ? [1, 1.02, 1] : 1,
                                  }}
                                  transition={{
                                    delay: 0.3,
                                    scale:
                                      pnrStatus === "found"
                                        ? {
                                            duration: 0.6,
                                            times: [0, 0.5, 1],
                                          }
                                        : {},
                                  }}
                                >
                                  <FormField
                                    label="Departure Date"
                                    required
                                    type="date"
                                    value={departureDate}
                                    onChange={(e) =>
                                      setDepartureDate(e.target.value)
                                    }
                                    disabled={
                                      !connected ||
                                      isSubmitting ||
                                      pnrStatus === "found"
                                    }
                                    showLockIcon={pnrStatus === "found"}
                                    className={
                                      pnrStatus === "found"
                                        ? "border-2 border-amber-500/50 shadow-[0_0_0_2px_rgba(251,191,36,0.2)]"
                                        : ""
                                    }
                                  />
                                </motion.div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <motion.div
                                  className="space-y-2"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale:
                                      pnrStatus === "found" ? [1, 1.02, 1] : 1,
                                  }}
                                  transition={{
                                    delay: 0.35,
                                    scale:
                                      pnrStatus === "found"
                                        ? {
                                            duration: 0.6,
                                            times: [0, 0.5, 1],
                                          }
                                        : {},
                                  }}
                                >
                                  <label className="block text-sm font-medium text-white">
                                    Departure Time *
                                  </label>
                                  <div className="relative">
                                    <select
                                      value={departureTime}
                                      onChange={(e) =>
                                        setDepartureTime(e.target.value)
                                      }
                                      disabled={
                                        !connected ||
                                        isSubmitting ||
                                        pnrStatus === "found"
                                      }
                                      className={`w-full px-4 py-2.5 bg-black border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${
                                        pnrStatus === "found"
                                          ? "border-2 border-amber-500/50 shadow-[0_0_0_2px_rgba(251,191,36,0.2)] pr-10 appearance-none"
                                          : "border border-gray-700 disabled:opacity-50"
                                      }`}
                                    >
                                      <option value="" disabled>
                                        Select time
                                      </option>
                                      {timeOptions.map((opt) => (
                                        <option
                                          key={opt.value}
                                          value={opt.value}
                                        >
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                    {pnrStatus === "found" && (
                                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              </div>
                            </motion.div>

                            {/* Passenger Info (if PNR found) */}
                            <AnimatePresence>
                              {fetchedPassenger && pnrStatus === "found" && (
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    height: 0,
                                    scale: 0.9,
                                    y: -20,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    height: "auto",
                                    scale: 1,
                                    y: 0,
                                  }}
                                  exit={{
                                    opacity: 0,
                                    height: 0,
                                    scale: 0.9,
                                    y: -20,
                                  }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 30,
                                    mass: 0.8,
                                  }}
                                  className="rounded-lg border border-accent-success/20 bg-accent-success/5 p-4 relative overflow-hidden"
                                >
                                  {/* Animated background glow */}
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10"
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "100%" }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      repeatDelay: 1,
                                      ease: "easeInOut",
                                    }}
                                  />
                                  <motion.h4
                                    className="text-sm font-semibold text-white mb-3 flex items-center gap-2 relative z-10"
                                    initial={{ opacity: 0, x: -20, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{
                                      delay: 0.2,
                                      type: "spring",
                                      stiffness: 300,
                                      damping: 20,
                                    }}
                                  >
                                    <motion.div
                                      animate={{
                                        rotate: [0, 10, -10, 0],
                                        scale: [1, 1.1, 1],
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                      }}
                                      className="w-4 h-4 relative z-10"
                                    >
                                      <img
                                        src="/logo.svg"
                                        alt="ZYURA"
                                        className="w-full h-full object-contain"
                                      />
                                    </motion.div>
                                    <motion.span
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.3 }}
                                      className="relative z-10"
                                    >
                                      Passenger Details (Auto-filled)
                                    </motion.span>
                                  </motion.h4>
                                  <motion.div
                                    className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm relative z-10"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                  >
                                    <motion.div
                                      initial={{
                                        opacity: 0,
                                        x: -20,
                                        scale: 0.95,
                                      }}
                                      animate={{ opacity: 1, x: 0, scale: 1 }}
                                      transition={{
                                        delay: 0.4,
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20,
                                      }}
                                      className="relative"
                                    >
                                      <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-gray-400"
                                      >
                                        Name:
                                      </motion.span>{" "}
                                      <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{
                                          delay: 0.6,
                                          type: "spring",
                                          stiffness: 400,
                                        }}
                                        className="text-white font-medium"
                                      >
                                        {fetchedPassenger.fullName ||
                                          fetchedPassenger.full_name ||
                                          "N/A"}
                                      </motion.span>
                                    </motion.div>
                                    {fetchedPassenger.email && (
                                      <motion.div
                                        initial={{
                                          opacity: 0,
                                          x: 20,
                                          scale: 0.95,
                                        }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        transition={{
                                          delay: 0.45,
                                          type: "spring",
                                          stiffness: 300,
                                          damping: 20,
                                        }}
                                        className="relative"
                                      >
                                        <motion.span
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ delay: 0.55 }}
                                          className="text-gray-400"
                                        >
                                          Email:
                                        </motion.span>{" "}
                                        <motion.span
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{
                                            delay: 0.65,
                                            type: "spring",
                                            stiffness: 400,
                                          }}
                                          className="text-white font-medium"
                                        >
                                          {fetchedPassenger.email}
                                        </motion.span>
                                      </motion.div>
                                    )}
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Already bought for this PNR - show policy and block purchase */}
                            <AnimatePresence>
                              {existingPolicyForPnr && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3"
                                >
                                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white">
                                      You already have a policy for this PNR
                                    </p>
                                    <p className="text-xs text-gray-300 mt-1">
                                      PNR:{" "}
                                      <span className="font-mono text-amber-200">
                                        {getPolicyPnr(existingPolicyForPnr) ||
                                          pnr.trim()}
                                      </span>
                                      {" · "}
                                      Policy #{existingPolicyForPnr.id}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openPolicyModal(existingPolicyForPnr)
                                      }
                                      className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                                    >
                                      View policy details →
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Submit Button */}
                            <motion.div
                              className="flex justify-end pt-4 border-t border-dark-border"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <motion.button
                                onClick={handleBuy}
                                disabled={
                                  !productId ||
                                  !flightNumber ||
                                  !departureDate ||
                                  !departureTime ||
                                  isSubmitting ||
                                  !connected ||
                                  !!existingPolicyForPnr
                                }
                                className={`px-8 py-3 rounded-lg font-medium transition-all shadow-lg flex items-center ${
                                  existingPolicyForPnr
                                    ? "bg-gray-700 text-gray-400 cursor-not-allowed shadow-none"
                                    : "bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-indigo-500/20"
                                }`}
                                whileHover={
                                  !isSubmitting &&
                                  !existingPolicyForPnr &&
                                  !(
                                    !productId ||
                                    !flightNumber ||
                                    !departureDate ||
                                    !departureTime ||
                                    !connected
                                  )
                                    ? {
                                        scale: 1.05,
                                        boxShadow:
                                          "0 10px 25px rgba(99, 102, 241, 0.4)",
                                      }
                                    : {}
                                }
                                whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                              >
                                {isSubmitting ? (
                                  <>
                                    <motion.div
                                      className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                                      animate={{ rotate: 360 }}
                                      transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        ease: "linear",
                                      }}
                                    />
                                    Processing...
                                  </>
                                ) : existingPolicyForPnr ? (
                                  "Already purchased"
                                ) : (
                                  <>
                                    <motion.span
                                      initial={{ opacity: 0, x: -5 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.1 }}
                                    >
                                      Purchase Insurance
                                    </motion.span>
                                  </>
                                )}
                              </motion.button>
                            </motion.div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {!showBuyForm && (
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="text-gray-400 text-sm"
                        >
                          Protect your flight with instant, automated delay
                          insurance. Click "Buy Policy" to get started.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.section>

              <MyPoliciesSection
                activeSection={activeSection}
                connected={connected}
                policiesFetchError={policiesFetchError}
                fetchMyPolicies={fetchMyPolicies}
                isLoadingPolicies={isLoadingPolicies}
                myPolicies={myPolicies}
                showAllPolicies={showAllPolicies}
                setShowAllPolicies={setShowAllPolicies}
                setShowBuyForm={setShowBuyForm}
                peraExplorerBase={peraExplorerBase}
                address={address}
                openPolicyModal={openPolicyModal}
              />
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Product Details Card */}
              <ProductDetailsPanel selectedProductInfo={selectedProductInfo} />

              {/* Info Card */}
              <HowItWorksCard />
            </div>
          </div>
        </div>
      </main>

      {/* Policy Modal */}
      <PolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        data={policyModalData}
      />

      {/* Interactive Tutorial */}
      <InteractiveTutorial
        formHandlers={{
          setShowBuyForm,
          setPnr,
          setFlightNumber,
          setDepartureDate,
          setDepartureTime,
          setProductId,
          clearForm: () => {
            setPnr("");
            setFlightNumber("");
            setDepartureDate("");
            setDepartureTime("");
            setFetchedPassenger(null);
            setPnrStatus(null);
          },
        }}
      />
    </>
  );
}
