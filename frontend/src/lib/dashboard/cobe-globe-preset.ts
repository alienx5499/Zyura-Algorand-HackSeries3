import type { GlobeProps } from "@/components/ui/cobe-globe";

/**
 * Canonical COBE look from the home contact card (purple / ZYURA marketing).
 * Dashboard flight-route globe uses this same preset — not the other way around.
 */
export const contactGlobeStyle: Pick<
  GlobeProps,
  | "markerColor"
  | "baseColor"
  | "arcColor"
  | "glowColor"
  | "dark"
  | "mapBrightness"
  | "markerSize"
  | "markerElevation"
  | "arcWidth"
  | "arcHeight"
  | "speed"
  | "theta"
  | "diffuse"
  | "mapSamples"
> = {
  baseColor: [0.5, 0.3, 1],
  glowColor: [0.5, 0.3, 1],
  markerColor: [0.92, 0.88, 1],
  arcColor: [0.62, 0.42, 1],
  dark: 1,
  mapBrightness: 6,
  markerSize: 0.028,
  markerElevation: 0.012,
  arcWidth: 0.45,
  arcHeight: 0.22,
  speed: 0.003,
  theta: 0.25,
  diffuse: 1.2,
  mapSamples: 18000,
};
