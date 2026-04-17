"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PnrRouteGlobe } from "@/components/dashboard/buy-insurance/pnr-route-globe";
import { Card, CardContent } from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import type { PnrFlightRoute, PnrStatus } from "@/lib/dashboard/types";

type FlightRouteSectionProps = {
  pnr: string;
  pnrStatus: PnrStatus;
  pnrRoute: PnrFlightRoute | null;
};

export function FlightRouteSection({
  pnr,
  pnrStatus,
  pnrRoute,
}: FlightRouteSectionProps) {
  if (pnr.trim().length !== 6) {
    return null;
  }

  const showGlobe = pnrStatus === "found" && pnrRoute;
  const lookupPending =
    pnrStatus === "fetching" || (pnrStatus === null && pnr.trim().length === 6);

  return (
    <motion.div
      data-tutorial="flight-route"
      initial={{ opacity: 0, x: 30, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{
        delay: 0.45,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-3xl md:p-3"
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
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-indigo-500 rounded-full shrink-0" />
            Flight route
          </h4>

          <AnimatePresence mode="wait">
            {showGlobe ? (
              <motion.div
                key="route"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <PnrRouteGlobe
                  variant="inline"
                  origin={pnrRoute.origin}
                  destination={pnrRoute.destination}
                />
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-gray-500 leading-relaxed"
              >
                {lookupPending
                  ? "Looking up your PNR..."
                  : pnrStatus === "not-found"
                    ? "PNR not found. Check the code and try again."
                    : pnrStatus === "found"
                      ? "This booking has no origin or destination in our lookup, so the map cannot be shown."
                      : "Looking up your PNR..."}
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
