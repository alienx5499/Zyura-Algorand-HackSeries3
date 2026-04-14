import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { PnrStatus } from "@/lib/dashboard/types";

type UsePnrLookupArgs = {
  pnr: string;
  setFlightNumber: (value: string) => void;
  setDepartureDate: (value: string) => void;
  setDepartureTime: (value: string) => void;
  setFetchedPassenger: (value: any | null) => void;
  setPnrStatus: (value: PnrStatus) => void;
};

const DEBOUNCE_MS = 220;
const CLIENT_CACHE_TTL_MS = 90_000;

type CacheEntry = { at: number; ok: boolean; data: any };
const pnrResponseCache = new Map<string, CacheEntry>();

export function usePnrLookup({
  pnr,
  setFlightNumber,
  setDepartureDate,
  setDepartureTime,
  setFetchedPassenger,
  setPnrStatus,
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
      return;
    }

    const ac = new AbortController();
    const t = window.setTimeout(async () => {
      if (pnrRef.current.trim().toUpperCase() !== normalized) return;

      const cached = pnrResponseCache.get(normalized);
      if (cached && Date.now() - cached.at < CLIENT_CACHE_TTL_MS) {
        if (!cached.ok) {
          setPnrStatus("not-found");
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
        setPnrStatus("found");
        return;
      }

      setPnrStatus("fetching");
      try {
        const response = await fetch(
          `/api/zyura/pnr/search?pnr=${encodeURIComponent(normalized)}`,
          { signal: ac.signal },
        );
        if (pnrRef.current.trim().toUpperCase() !== normalized) return;

        if (response.ok) {
          const data = await response.json();
          pnrResponseCache.set(normalized, {
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
          setPnrStatus("found");
          toast.success("PNR found! Details auto-filled.", {
            id: "pnr-lookup-success",
          });
        } else {
          pnrResponseCache.set(normalized, {
            at: Date.now(),
            ok: false,
            data: null,
          });
          setPnrStatus("not-found");
        }
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        console.error("Error fetching PNR:", error);
        if (pnrRef.current.trim().toUpperCase() !== normalized) return;
        setPnrStatus("not-found");
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
    setPnrStatus,
  ]);
}
