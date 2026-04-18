"use client";

import { memo } from "react";
import { GlobeLazy } from "@/components/ui/cobe-globe-lazy";
import { contactGlobeStyle } from "@/lib/dashboard/cobe-globe-preset";
import type { GlobeProps } from "@/components/ui/cobe-globe";

/** Stable refs so parent re-renders (e.g. form typing) do not reset the COBE globe effect. */
const EMPTY_MARKERS: NonNullable<GlobeProps["markers"]> = [];
const EMPTY_ARCS: NonNullable<GlobeProps["arcs"]> = [];

type ContactMarketingGlobeProps = {
  className?: string;
};

function ContactMarketingGlobeInner({ className }: ContactMarketingGlobeProps) {
  return (
    <div className={className}>
      <GlobeLazy
        markers={EMPTY_MARKERS}
        arcs={EMPTY_ARCS}
        {...contactGlobeStyle}
        className="mx-auto max-w-[300px] md:max-w-[420px]"
      />
    </div>
  );
}

export const ContactMarketingGlobe = memo(ContactMarketingGlobeInner);
