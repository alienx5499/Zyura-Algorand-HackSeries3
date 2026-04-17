"use client";

import dynamic from "next/dynamic";
import type { GlobeProps } from "@/components/ui/cobe-globe";

const GlobeDynamic = dynamic(
  () => import("@/components/ui/cobe-globe").then((m) => m.Globe),
  {
    ssr: false,
    loading: () => (
      <div
        className="aspect-square w-full rounded-full bg-violet-500/[0.12]"
        aria-hidden
      />
    ),
  },
);

export function GlobeLazy(props: GlobeProps) {
  return <GlobeDynamic {...props} />;
}
