import Image from "next/image";
import { AlgorandIcon, AlgoKitIcon } from "@/components/ui/custom-icons";
import { SparklesCore } from "@/components/ui/sparkles";

export default function ScreenshotPage() {
  return (
    <div className="relative min-h-screen w-full bg-black text-white">
      {/* Animated sparkle background borrowed from home hero */}
      <div className="absolute inset-0">
        <SparklesCore
          background="transparent"
          minSize={0.8}
          maxSize={1.6}
          particleDensity={280}
          particleColor="#FFFFFF"
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <div className="flex flex-col items-center gap-7 text-center">
          <div className="relative flex items-center justify-center gap-5">
            <div className="relative h-24 w-24">
              <Image
                src="/logo.svg"
                alt="ZYURA logo"
                fill
                priority
                className="object-contain"
              />
            </div>
            <h1 className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-6xl md:text-7xl font-semibold tracking-tight text-transparent leading-none">
              ZYURA
            </h1>
          </div>
          <p className="max-w-2xl text-lg text-neutral-200">
            Instant flight-delay cover. On-chain. Automatic.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300 shadow-[0_0_30px_-18px_rgba(59,130,246,0.8)]">
            <AlgorandIcon className="h-6 w-auto" />
            <span className="leading-none">Built on Algorand</span>
            <AlgoKitIcon className="h-5 w-auto text-cyan-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
