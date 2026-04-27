"use client";

import { GlowingEffect } from "@/components/ui/glowing-effect";
import { FooterBottom } from "./zyura-footer/FooterBottom";
import { FooterCTA } from "./zyura-footer/FooterCTA";
import { FooterMainSections } from "./zyura-footer/FooterMainSections";

// Main Footer Component
export function ZyuraFooter() {
  return (
    <div className="relative w-full rounded-3xl border-[0.75px] border-gray-800 p-2">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={3}
      />
      <footer className="relative overflow-hidden rounded-3xl border-[0.75px] border-gray-800 bg-black w-full">
        <div className="p-4">
          <FooterCTA />
        </div>
        <div className="pt-12 pb-2 md:pb-12 px-4">
          <div className="max-w-6xl mx-auto">
            <FooterMainSections />
            <FooterBottom />
          </div>
        </div>
      </footer>
    </div>
  );
}
