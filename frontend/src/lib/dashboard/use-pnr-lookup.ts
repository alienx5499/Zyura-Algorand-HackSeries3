import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { PnrFlightRoute, PnrStatus } from "@/lib/dashboard/types";

/** From /api/zyura/pnr/search — used to block repurchase when myPolicies is stale. */
export type PnrLookupLinkage = {
  linkedWallet: string;
  linkedPolicyId: number;
  purchaseComplete: boolean;
};

type UsePnrLookupArgs = {
  pnr: string;
  setFlightNumber: (value: string) => void;
  setDepartureDate: (value: string) => void;
  setDepartureTime: (value: string) => void;
  setFetchedPassenger: (value: any | null) => void;
  setPnrStatus: (value: PnrStatus) => void;
  setPnrRoute: (value: PnrFlightRoute | null) => void;
  setPnrLinkage?: (value: PnrLookupLinkage | null) => void;
};

const DEBOUNCE_MS = 220;
const CLIENT_CACHE_TTL_MS = 90_000;

type CacheEntry = { at: number; ok: boolean; data: any };
const pnrResponseCache = new Map<string, CacheEntry>();
/** Bust client cache when PNR API shape changes (e.g. pnr_purchase_complete). */
const PNR_CLIENT_CACHE_KEY_PREFIX = "v2:";

function linkageFromSearchBody(data: any): PnrLookupLinkage | null {
  const w = typeof data?.wallet === "string" ? data.wallet.trim() : "";
  const pid = data?.policyId;
  const idNum = typeof pid === "number" ? pid : Number(pid);
  const purchaseComplete = data?.pnr_purchase_complete === true;
  if (
    !w ||
    w === "NA" ||
    !Number.isFinite(idNum) ||
    idNum <= 0 ||
    !purchaseComplete
  ) {
    return null;
  }
  return {
    linkedWallet: w,
    linkedPolicyId: idNum,
    purchaseComplete: true,
  };
}

export function usePnrLookup({
  pnr,
  setFlightNumber,
  setDepartureDate,
  setDepartureTime,
  setFetchedPassenger,
  setPnrStatus,
  setPnrRoute,
  setPnrLinkage,
}: UsePnrLookupArgs) {
  const pnrRef = useRef(pnr);

  useEffect(() => {
    pnrRef.current = pnr;
  }, [pnr]);

  useEffect(() => {
    const normalized = pnr.trim().toUpperCase();
    if (!normalized || normalized.length !== 6) {
      setFetchedPassenger(null);
      setPnrStatus(null);
      setPnrRoute(null);
      setPnrLinkage?.(null);
      return;
    }

    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      if (pnrRef.current.trim().toUpperCase() !== normalized) return;

      const cached = pnrResponseCache.get(
        `${PNR_CLIENT_CACHE_KEY_PREFIX}${normalized}`,
      );
      if (cached && Date.now() - cached.at < CLIENT_CACHE_TTL_MS) {
        if (!cached.ok) {
          setPnrStatus("not-found");
          setPnrRoute(null);
          setPnrLinkage?.(null);
          return;
        }
        const data = cached.data;
        if (data.flight_number) setFlightNumber(data.flight_number);
        if (data.date) setDepartureDate(data.date);
        if (data.scheduled_departure_unix) {
          const depDate = new Date(data.scheduled_departure_unix * 1000);
          const hours = String(depDate.getUTCHours()).padStart(2, "0");
          const minutes = String(depDate.getUTCMinutes()).padStart(2, "0");
          setDepartureTime(`${hours}:${minutes}`);
        }
        if (data.passenger) setFetchedPassenger(data.passenger);
        if (data.origin && data.destination) {
          setPnrRoute({
            origin: String(data.origin),
            destination: String(data.destination),
          });
        } else setPnrRoute(null);
        setPnrStatus("found");
        setPnrLinkage?.(linkageFromSearchBody(data));
        return;
      }

      setPnrStatus("fetching");
      setPnrRoute(null);
      try {
        const response = await fetch(
          `/api/zyura/pnr/search?pnr=${encodeURIComponent(normalized)}`,
          { signal: ac.signal },
        );
        if (pnrRef.current.trim().toUpperCase() !== normalized) return;

        if (response.ok) {
          const data = await response.json();
          pnrResponseCache.set(`${PNR_CLIENT_CACHE_KEY_PREFIX}${normalized}`, {
            at: Date.now(),
            ok: true,
            data,
          });
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
          if (data.origin && data.destination) {
            setPnrRoute({
              origin: String(data.origin),
              destination: String(data.destination),
            });
          } else setPnrRoute(null);
          setPnrStatus("found");
          setPnrLinkage?.(linkageFromSearchBody(data));
          toast.success("PNR found! Details auto-filled.", {
            id: "pnr-lookup-success",
          });
        } else {
          pnrResponseCache.set(`${PNR_CLIENT_CACHE_KEY_PREFIX}${normalized}`, {
            at: Date.now(),
            ok: false,
            data: null,
          });
          setPnrStatus("not-found");
          setPnrRoute(null);
          setPnrLinkage?.(null);
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        console.error("Error fetching PNR:", error);
        if (pnrRef.current.trim().toUpperCase() !== normalized) return;
        setPnrStatus("not-found");
        setPnrRoute(null);
        setPnrLinkage?.(null);
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [
    pnr,
    setDepartureDate,
    setDepartureTime,
    setFetchedPassenger,
    setFlightNumber,
    setPnrLinkage,
    setPnrRoute,
    setPnrStatus,
  ]);
}
