export type PolicyCardStatus = "Active" | "PaidOut" | "Expired";

export function toSafeNumber(value: unknown): number {
  const asNum = Number((value ?? 0).toString());
  return Number.isFinite(asNum) ? asNum : 0;
}

export function normalizePolicyStatus(rawStatus: any): PolicyCardStatus {
  if (typeof rawStatus === "number") {
    if (rawStatus === 1) return "PaidOut";
    if (rawStatus === 2) return "Expired";
    return "Active";
  }

  if (rawStatus && typeof rawStatus === "object") {
    if (rawStatus.Active !== undefined || rawStatus.active !== undefined) {
      return "Active";
    }
    if (
      rawStatus.PaidOut !== undefined ||
      rawStatus.paidOut !== undefined ||
      rawStatus.paid_out !== undefined
    ) {
      return "PaidOut";
    }
    if (rawStatus.Expired !== undefined || rawStatus.expired !== undefined) {
      return "Expired";
    }
    const keys = Object.keys(rawStatus);
    if (keys.length > 0) {
      const key = keys[0].toLowerCase();
      if (key.includes("paid")) return "PaidOut";
      if (key.includes("expired")) return "Expired";
    }
    return "Active";
  }

  if (typeof rawStatus === "string") {
    const s = rawStatus.toLowerCase();
    if (s.includes("paid")) return "PaidOut";
    if (s.includes("expired")) return "Expired";
    return "Active";
  }

  return "Active";
}

export function normalizePolicyStatusLoose(rawStatus: any): string {
  if (typeof rawStatus === "number") {
    if (rawStatus === 1) return "PaidOut";
    if (rawStatus === 2) return "Expired";
    return "Active";
  }

  if (rawStatus && typeof rawStatus === "object") {
    if (rawStatus.Active !== undefined || rawStatus.active !== undefined) {
      return "Active";
    }
    if (
      rawStatus.PaidOut !== undefined ||
      rawStatus.paidOut !== undefined ||
      rawStatus.paid_out !== undefined
    ) {
      return "PaidOut";
    }
    if (rawStatus.Expired !== undefined || rawStatus.expired !== undefined) {
      return "Expired";
    }
    const keys = Object.keys(rawStatus);
    if (keys.length > 0) return keys[0];
    return "Active";
  }

  if (typeof rawStatus === "string") {
    const s = rawStatus.toLowerCase();
    if (s.includes("active")) return "Active";
    if (s.includes("paid")) return "PaidOut";
    if (s.includes("expired")) return "Expired";
    return rawStatus;
  }

  return "Active";
}

export function microToUsd(microAmount: number): string {
  return (microAmount / 1_000_000).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function getDisplayFlightAndPnr(policy: any): {
  flight: string;
  pnr: string;
} {
  const flightFromMeta =
    policy.metadata?.flight ??
    policy.metadata?.attributes?.find((a: any) => a.trait_type === "Flight")
      ?.value;
  const pnrFromMeta =
    policy.metadata?.pnr ??
    policy.metadata?.attributes?.find((a: any) => a.trait_type === "PNR")
      ?.value;

  const flightRaw = (policy.flight_number || flightFromMeta || "")
    .toString()
    .trim();
  const pnrRaw = (policy.pnr ?? pnrFromMeta ?? "").toString().trim();

  return {
    flight: flightRaw && flightRaw !== "N/A" ? flightRaw : "",
    pnr: pnrRaw && pnrRaw !== "N/A" ? pnrRaw : "",
  };
}
