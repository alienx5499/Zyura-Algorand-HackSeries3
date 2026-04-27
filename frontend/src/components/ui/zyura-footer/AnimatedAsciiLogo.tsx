"use client";

import { useEffect, useState } from "react";
import { asciiColors, baseAscii, charSet } from "./constants";

export function AnimatedAsciiLogo() {
  const [asciiArt, setAsciiArt] = useState(baseAscii);
  const [colorIndex, setColorIndex] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0.5);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const randomizeChars = () => {
      const randomized = baseAscii
        .split("\n")
        .map((line) =>
          line
            .split("")
            .map((char) => {
              if (char !== " " && Math.random() < 0.3) {
                return charSet[Math.floor(Math.random() * charSet.length)];
              }
              return char;
            })
            .join(""),
        )
        .join("\n");
      setAsciiArt(randomized);
    };
    randomizeChars();
    const interval = setInterval(
      () => randomizeChars(),
      300 + Math.random() * 500,
    );
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const colorInterval = setInterval(
      () => setColorIndex((prev) => (prev + 1) % asciiColors.length),
      2000 + Math.random() * 2000,
    );
    return () => clearInterval(colorInterval);
  }, []);

  useEffect(() => {
    const glowInterval = setInterval(() => {
      setGlowIntensity((prev) => (prev >= 0.7 ? 0.3 : prev + 0.05));
    }, 100);
    return () => clearInterval(glowInterval);
  }, []);

  useEffect(() => {
    const scaleInterval = setInterval(() => {
      setScale((prev) => (prev >= 1.02 ? 0.98 : prev + 0.002));
    }, 50);
    return () => clearInterval(scaleInterval);
  }, []);

  const currentColor = asciiColors[colorIndex];
  const [r, g, b] = currentColor.match(/\d+/g)?.slice(0, 3).map(Number) || [
    255, 255, 255,
  ];

  return (
    <pre
      className="text-[10px] xl:text-[13px] font-mono whitespace-pre select-none"
      style={{
        fontFamily: "monospace",
        letterSpacing: "0.15px",
        lineHeight: "1.2",
        color: currentColor,
        transition:
          "color 2.5s ease-in-out, transform 0.1s ease-out, filter 0.1s ease-out",
        transform: `scale(${scale})`,
        filter: `drop-shadow(0 0 ${glowIntensity * 8}px rgba(${r}, ${g}, ${b}, ${glowIntensity})) drop-shadow(0 0 ${glowIntensity * 4}px rgba(${r}, ${g}, ${b}, ${glowIntensity * 0.6}))`,
        textShadow: `0 0 ${glowIntensity * 6}px rgba(${r}, ${g}, ${b}, ${glowIntensity * 0.8})`,
      }}
    >
      {asciiArt}
    </pre>
  );
}
