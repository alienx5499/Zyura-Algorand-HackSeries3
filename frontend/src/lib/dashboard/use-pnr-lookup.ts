import { useEffect } from "react";
import { toast } from "sonner";

type PnrStatus = "fetching" | "found" | "not-found" | null;

type UsePnrLookupArgs = {
  pnr: string;
  setFlightNumber: (value: string) => void;
  setDepartureDate: (value: string) => void;
  setDepartureTime: (value: string) => void;
  setFetchedPassenger: (value: any | null) => void;
  setPnrStatus: (value: PnrStatus) => void;
  setIsFetchingPnr: (value: boolean) => void;
};

export function usePnrLookup({
  pnr,
  setFlightNumber,
  setDepartureDate,
  setDepartureTime,
  setFetchedPassenger,
  setPnrStatus,
  setIsFetchingPnr,
}: UsePnrLookupArgs) {
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
  }, [
    pnr,
    setDepartureDate,
    setDepartureTime,
    setFetchedPassenger,
    setFlightNumber,
    setIsFetchingPnr,
    setPnrStatus,
  ]);
}
