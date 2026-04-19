import { InstantPayoutCard } from "@/components/landing/features/InstantPayoutCard";
import { OracleVerifiedCard } from "@/components/landing/features/OracleVerifiedCard";
import { TransparentOnChainCard } from "@/components/landing/features/TransparentOnChainCard";
import { CommunityOwnershipCard } from "@/components/landing/features/CommunityOwnershipCard";
import { GlobalCoverageCard } from "@/components/landing/features/GlobalCoverageCard";

export function LandingFeaturesSection() {
  return (
    <section
      id="features"
      data-section="features"
      className="bg-black py-16 md:py-32 relative"
    >
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-100 to-neutral-400 relative z-30">
            Why Choose
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-purple-400 via-pink-400 to-cyan-400">
              ZYURA?
            </span>
          </h2>
          <p className="text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto">
            Discover the advantages of instant, automated flight delay
            protection powered by Algorand.
          </p>
        </div>
        <div className="mx-auto max-w-3xl lg:max-w-5xl px-6">
          <div className="relative">
            <ul className="relative z-10 grid grid-cols-6 gap-3">
              <InstantPayoutCard />
              <OracleVerifiedCard />
              <TransparentOnChainCard />
              <CommunityOwnershipCard />
              <GlobalCoverageCard />
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
