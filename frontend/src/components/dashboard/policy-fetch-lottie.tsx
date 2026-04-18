"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

type PolicyFetchLottieProps = {
  className?: string;
  lottieClassName?: string;
  loop?: boolean;
  autoplay?: boolean;
};

/**
 * Loops the public Lottie continuously for policy loading UI.
 */
export function PolicyFetchLottie({
  className = "",
  lottieClassName = "h-20 w-20",
  loop = true,
  autoplay = true,
}: PolicyFetchLottieProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/privacy-policy-hover-swipe.json", {
          cache: "force-cache",
        });
        if (!res.ok) return;
        const data = (await res.json()) as object;
        if (!cancelled) setAnimationData(data);
      } catch {
        // Decorative-only; ignore.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!animationData) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        aria-hidden
      >
        <div
          className={`animate-pulse rounded-lg bg-gray-800/80 ${lottieClassName}`}
        />
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none flex items-center justify-center ${className}`}
      aria-hidden
    >
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        className={`object-contain ${lottieClassName}`}
      />
    </div>
  );
}
