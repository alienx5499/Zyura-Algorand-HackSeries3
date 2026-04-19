import { PolicyFetchLottie } from "@/components/dashboard/policy-fetch-lottie";
import { ScannerCardStream } from "@/components/ui/scanner-card-stream";

type LandingPoliciesSectionProps = {
  policyImages: string[];
  isLoadingPolicies: boolean;
};

export function LandingPoliciesSection({
  policyImages,
  isLoadingPolicies,
}: LandingPoliciesSectionProps) {
  return (
    <section
      id="policies"
      data-section="policies"
      className="w-full bg-black py-20 px-4 relative overflow-hidden"
    >
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-100 to-neutral-400 relative z-30">
            Active
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-purple-400 via-pink-400 to-cyan-400">
              Policies
            </span>
          </h2>
          <p className="text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto">
            Real-time visualization of active flight delay insurance policies on
            the Algorand blockchain
          </p>
        </div>
        <div className="relative h-[400px] w-full rounded-2xl overflow-hidden border border-gray-800 bg-black flex items-center justify-center">
          {isLoadingPolicies ? (
            <div className="flex h-full w-full items-center justify-center px-4">
              <PolicyFetchLottie lottieClassName="h-24 w-24 md:h-28 md:w-28" />
            </div>
          ) : (
            <ScannerCardStream
              cardImages={policyImages.length > 0 ? policyImages : undefined}
              className="w-full h-full"
            />
          )}
        </div>
      </div>
    </section>
  );
}
