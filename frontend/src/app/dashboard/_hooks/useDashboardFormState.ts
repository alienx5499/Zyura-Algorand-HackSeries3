"use client";

import { useState } from "react";
import type { PnrFlightRoute, PnrStatus } from "@/lib/dashboard/types";
import type { PnrLookupLinkage } from "@/lib/dashboard/use-pnr-lookup";

export function useDashboardFormState() {
  const [flightNumber, setFlightNumber] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [productId, setProductId] = useState("");
  const [pnr, setPnr] = useState("");
  const [fetchedPassenger, setFetchedPassenger] = useState<any | null>(null);
  const [pnrStatus, setPnrStatus] = useState<PnrStatus>(null);
  const [pnrRoute, setPnrRoute] = useState<PnrFlightRoute | null>(null);
  const [pnrLinkage, setPnrLinkage] = useState<PnrLookupLinkage | null>(null);
  const [showBuyForm, setShowBuyForm] = useState(false);

  const clearForm = () => {
    setPnr("");
    setFlightNumber("");
    setDepartureDate("");
    setDepartureTime("");
    setFetchedPassenger(null);
    setPnrStatus(null);
    setPnrRoute(null);
  };

  return {
    clearForm,
    departureDate,
    departureTime,
    fetchedPassenger,
    flightNumber,
    pnr,
    pnrLinkage,
    pnrRoute,
    pnrStatus,
    productId,
    setDepartureDate,
    setDepartureTime,
    setFetchedPassenger,
    setFlightNumber,
    setPnr,
    setPnrLinkage,
    setPnrRoute,
    setPnrStatus,
    setProductId,
    setShowBuyForm,
    showBuyForm,
  };
}
