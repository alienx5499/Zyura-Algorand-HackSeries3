import { Plane } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { CardContent } from "@/components/ui/card";

export function GlobalCoverageCard() {
  return (
    <li className="col-span-full list-none lg:col-span-3">
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black p-6 shadow-sm">
          <CardContent className="grid h-full pt-6 sm:grid-cols-2">
            <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
              <div className="relative flex aspect-square size-12 rounded-full border border-gray-800 before:absolute before:-inset-2 before:rounded-full before:border before:border-gray-800/50">
                <Plane
                  className="m-auto size-6 text-cyan-400"
                  strokeWidth={1}
                />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-medium transition text-white">
                  Global Flight Coverage
                </h2>
                <p className="text-neutral-300">
                  Protect flights worldwide with instant, automated coverage.
                </p>
              </div>
            </div>
            <div className="relative mt-6 before:absolute before:inset-0 before:mx-auto before:w-px before:bg-gray-800 sm:-my-6 sm:-mr-6">
              <div className="relative flex h-full flex-col justify-center space-y-6 py-6">
                <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                  <span className="block h-fit rounded border px-2 py-1 text-xs shadow-sm text-white border-gray-800">
                    24/7
                  </span>
                  <div className="size-7 ring-4 ring-black">
                    <div className="size-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500"></div>
                  </div>
                </div>
                <div className="relative ml-[calc(50%-1rem)] flex items-center gap-2">
                  <div className="size-8 ring-4 ring-black">
                    <div className="size-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  </div>
                  <span className="block h-fit rounded border px-2 py-1 text-xs shadow-sm text-white border-gray-800">
                    Worldwide
                  </span>
                </div>
                <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                  <span className="block h-fit rounded border px-2 py-1 text-xs shadow-sm text-white border-gray-800">
                    Instant
                  </span>
                  <div className="size-7 ring-4 ring-black">
                    <div className="size-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </li>
  );
}
