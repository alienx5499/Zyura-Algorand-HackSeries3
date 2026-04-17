"use client";

import { GlobeLazy } from "@/components/ui/cobe-globe-lazy";
import { contactGlobeStyle } from "@/lib/dashboard/cobe-globe-preset";

type ContactMarketingGlobeProps = {
  className?: string;
};

export function ContactMarketingGlobe({
  className,
}: ContactMarketingGlobeProps) {
  return (
    <div className={className}>
      <GlobeLazy
        markers={[]}
        arcs={[]}
        {...contactGlobeStyle}
        className="mx-auto max-w-[300px] md:max-w-[420px]"
      />
    </div>
  );
}
