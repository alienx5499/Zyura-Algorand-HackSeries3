import { EvervaultCard, Icon } from "@/components/ui/evervault-card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  MissionRocketIcon,
  InnovationBulbIcon,
  TransparencyEyeIcon,
  SpeedLightningIcon,
} from "@/components/ui/custom-icons";

export function LandingAboutSection() {
  return (
    <section
      id="about"
      data-section="about"
      className="w-full bg-black pt-10 pb-16 md:pt-16 md:pb-20 px-4 relative"
    >
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-100 to-neutral-400 relative z-30">
            About
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-purple-400 via-pink-400 to-cyan-400">
              ZYURA
            </span>
          </h2>
          <p className="text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto">
            Instant, fair, community-owned flight delay insurance on
            Algorand-transforming travel protection with automated smart
            contracts.
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {[
            {
              icon: MissionRocketIcon,
              text: "Eliminate frustration and financial uncertainty caused by flight delays by providing instant, automated USDC payouts through oracle-verified smart contracts.",
            },
            {
              icon: InnovationBulbIcon,
              text: "We leverage Algorand blockchain and oracle technology to revolutionize flight delay insurance with instant, automated payouts.",
            },
            {
              icon: TransparencyEyeIcon,
              text: "All policy terms, oracle checks, and payouts are auditable on-chain. Complete transparency, zero opacity-you can verify everything.",
            },
            {
              icon: SpeedLightningIcon,
              text: "Algorand's high throughput enables sub-second USDC payouts when delays occur. No waiting, no bureaucracy-just instant protection.",
            },
          ].map((card) => (
            <li className="list-none" key={card.text}>
              <div className="relative h-[500px] rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-[1.5rem] md:p-3">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative h-full rounded-xl border-[0.75px] border-gray-800 bg-black overflow-hidden p-4 flex flex-col items-start">
                  <Icon className="absolute h-6 w-6 -top-3 -left-3 text-white z-30" />
                  <Icon className="absolute h-6 w-6 -bottom-3 -left-3 text-white z-30" />
                  <Icon className="absolute h-6 w-6 -top-3 -right-3 text-white z-30" />
                  <Icon className="absolute h-6 w-6 -bottom-3 -right-3 text-white z-30" />
                  <div className="flex-1 w-full">
                    <EvervaultCard
                      icon={card.icon}
                      iconSize="h-32 w-32"
                      className="h-full w-full"
                    />
                  </div>
                  <div className="w-full min-h-[120px] flex flex-col justify-start">
                    <h2 className="text-white mt-4 text-sm font-light z-20 relative">
                      {card.text}
                    </h2>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
