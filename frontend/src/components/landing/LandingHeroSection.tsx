import Image from "next/image";
import { SparklesCore } from "@/components/ui/sparkles";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { AlgorandIcon, AlgoKitIcon } from "@/components/ui/custom-icons";

export function LandingHeroSection() {
  return (
    <>
      <section
        data-section="hero"
        className="h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden relative pt-20"
      >
        <div className="relative z-20 mb-8">
          <GooeyText
            texts={[
              "ZYURA",
              "Instant Payouts",
              "Algorand Powered",
              "Smart Contracts",
              "Oracle Verified",
              "On Chain",
              "Transparent",
              "Automated",
              "Zero Hassle",
              "USDC Payouts",
              "NFT Policies",
              "Trustless",
              "Fair Coverage",
              "Global Protection",
            ]}
            morphTime={1.5}
            cooldownTime={1}
            className="h-32 flex items-center justify-center"
            textClassName="text-white font-bold"
          />
        </div>
        <p className="text-neutral-300 cursor-default text-center text-xl md:text-2xl mt-4 relative z-20 flex items-center justify-center gap-2">
          Instant, fair, community-owned flight delay insurance on
          <span className="inline-flex items-center gap-[0.25rem] align-middle">
            <AlgorandIcon className="h-7 w-auto" />
            <span className="text-white text-base md:text-lg leading-none">
              with
            </span>
            <AlgoKitIcon className="h-6 w-auto" />
          </span>
        </p>
        <div className="w-[40rem] h-40 relative mt-8">
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />
          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={300}
            className="w-full h-full"
            particleColor="#FFFFFF"
          />
          <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
        </div>
      </section>

      <section className="w-full bg-black relative overflow-hidden">
        <ContainerScroll
          titleComponent={
            <>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-100 to-neutral-400 relative z-30">
                Experience the Future of
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-purple-400 via-pink-400 to-cyan-400">
                  Flight Insurance
                </span>
              </h2>
              <p className="text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto relative z-30">
                Manage your policies, track payouts, and purchase coverage-all
                in one seamless dashboard powered by{" "}
                <span className="inline-flex items-center gap-[0.25rem] align-middle">
                  <AlgorandIcon className="h-6 w-auto" />
                  <span className="text-white text-sm md:text-base leading-none">
                    with
                  </span>
                  <AlgoKitIcon className="h-6 w-auto" />
                </span>
              </p>
            </>
          }
        >
          <div className="w-full h-full rounded-2xl overflow-hidden relative flex items-center justify-center border border-white/5 bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 pointer-events-none" />
            <div className="relative h-full w-full flex items-center justify-center">
              <Image
                src="/dashboard-preview.png"
                alt="ZYURA Dashboard preview"
                width={1232}
                height={592}
                priority
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
          </div>
        </ContainerScroll>
      </section>
    </>
  );
}
