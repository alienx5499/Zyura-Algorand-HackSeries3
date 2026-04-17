"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { GlobeLazy } from "@/components/ui/cobe-globe-lazy";
import { getAirportLatLng } from "@/lib/dashboard/airport-coordinates";
import { contactGlobeStyle } from "@/lib/dashboard/cobe-globe-preset";

type PnrRouteGlobeProps = {
  origin: string;
  destination: string;
  variant?: "panel" | "inline";
};

export function PnrRouteGlobe({
  origin,
  destination,
  variant = "panel",
}: PnrRouteGlobeProps) {
  const o = origin.trim().toUpperCase();
  const d = destination.trim().toUpperCase();
  const from = getAirportLatLng(origin);
  const to = getAirportLatLng(destination);

  const { markers, arcs } = useMemo(() => {
    if (!from || !to) return { markers: [], arcs: [] };
    return {
      markers: [
        { id: "origin", location: from, label: o },
        { id: "dest", location: to, label: d },
      ],
      arcs: [
        {
          id: `${o}-${d}`,
          from,
          to,
          label: `${o} → ${d}`,
        },
      ],
    };
  }, [from, to, o, d]);

  if (!from || !to) {
    const fallback = (
      <p className="text-sm text-gray-500">
        Route {o} → {d}. The 3D globe needs latitude/longitude for both airports
        (demo dataset covers common US hubs).
      </p>
    );
    if (variant === "inline") {
      return (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {fallback}
        </motion.div>
      );
    }
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-amber-500/20 bg-black/40 p-4"
      >
        {fallback}
      </motion.div>
    );
  }

  const globe = (
    <div className="mx-auto w-full max-w-[280px]">
      <GlobeLazy
        markers={markers}
        arcs={arcs}
        {...contactGlobeStyle}
        className="mx-auto max-w-[280px]"
      />
    </div>
  );

  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="space-y-3"
      >
        <p className="text-sm text-gray-400">
          From {o} to {d}. Drag the globe to explore.
        </p>
        {globe}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="rounded-xl border border-indigo-500/25 bg-black/40 p-4 md:p-5"
    >
      <p className="text-xs font-medium text-indigo-200/90 tracking-wide uppercase mb-1">
        Flight route
      </p>
      <p className="text-sm text-gray-400 mb-3">
        From {o} to {d}. Drag the globe to explore.
      </p>
      {globe}
    </motion.div>
  );
}
