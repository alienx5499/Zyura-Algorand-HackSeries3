"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CornerDownLeft } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { SparklesCore } from "@/components/ui/sparkles";
import { AnimatedAsciiLogo } from "./AnimatedAsciiLogo";

export function FooterCTA() {
  return (
    <div className="relative w-full h-[20rem] rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-[1.5rem] md:p-3">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={3}
      />
      <footer className="relative overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black w-full h-full">
        <div className="absolute inset-0 w-full h-full">
          <motion.div
            className="absolute top-0 left-0 h-[400px] w-[400px] rounded-full opacity-30 blur-[120px]"
            style={{
              background:
                "radial-gradient(circle at center, #8b5cf6, transparent 70%)",
            }}
            animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full opacity-20 blur-[100px]"
            style={{
              background:
                "radial-gradient(circle at center, #ec4899, transparent 70%)",
            }}
            animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-[200px] w-[200px] rounded-full opacity-15 blur-[80px]"
            style={{
              background:
                "radial-gradient(circle at center, #06b6d4, transparent 70%)",
            }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </div>
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          <SparklesCore
            id="footer-sparkles"
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={100}
            className="absolute inset-0 w-full h-full"
            particleColor="#8b5cf6"
          />
        </div>
        <div className="absolute right-0 xl:right-0 md:flex hidden top-4 xl:top-6 bottom-4 xl:bottom-6 left-auto items-center justify-center p-2 xl:p-3">
          <div className="flex items-center justify-center h-full">
            <AnimatedAsciiLogo />
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-start px-4 md:px-8 pt-2 pb-4 justify-between sm:justify-center h-full">
          <div className="relative flex flex-col items-start justify-start">
            <p className="max-w-lg mt-3 tracking-tight font-semibold text-xl md:text-3xl text-left bg-clip-text text-transparent bg-gradient-to-b from-white via-purple-200 to-pink-200">
              Ready to experience instant, automated flight delay protection?
            </p>
            <p className="text-sm pt-3 text-neutral-300 max-w-xl text-left">
              Get instant USDC payouts when your flight is delayed. No claims
              forms, no adjusters—just transparent, community-governed
              protection powered by Algorand smart contracts.
            </p>
          </div>
          <motion.div
            className="w-full flex flex-row md:gap-4 gap-2 flex-wrap md:justify-start justify-center items-stretch md:items-start mt-6"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          >
            <Button
              className="w-full md:w-52 h-12 text-white relative isolate inline-flex items-center justify-center overflow-hidden rounded-md px-3 text-left text-sm font-medium bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70"
              asChild
            >
              <Link className="flex group items-center gap-2" href="#contact">
                <span>Get Started</span>
                <Badge className="bg-white/20 p-1 text-white transition-all duration-200 ease-in-out group-hover:shadow-xl shadow-background/70">
                  <CornerDownLeft className="size-4" />
                </Badge>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full md:w-52 h-12 text-white border-purple-500/50 bg-black/50 hover:bg-purple-500/10 hover:border-purple-500 hover:text-white relative isolate inline-flex items-center justify-center overflow-hidden rounded-md px-3 text-left text-sm font-medium transition-all duration-300 [&>a]:text-white [&>a:hover]:text-white"
              asChild
            >
              <Link
                className="flex group items-center gap-2 text-white hover:text-white"
                href="https://github.com/alienx5499/Zyura-Algorand-HackSeries3"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="text-white group-hover:text-white z-10">
                  Github
                </span>
                <Badge className="bg-purple-500/30 text-white border-purple-500/50 transition-all duration-200 group-hover:shadow-xl group-hover:bg-purple-500/50 shadow-white/70 z-10">
                  <SiGithub className="size-4" />
                </Badge>
              </Link>
            </Button>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
