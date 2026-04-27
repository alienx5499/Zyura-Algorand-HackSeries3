import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import type { TutorialStep } from "./types";

type Props = {
  currentStep: number;
  totalSteps: number;
  step: TutorialStep;
  tooltipRef: RefObject<HTMLDivElement | null>;
  getTooltipStyle: () => { top: string; left: string };
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
};

export function TutorialTooltip({
  currentStep,
  totalSteps,
  step,
  tooltipRef,
  getTooltipStyle,
  onPrev,
  onNext,
  onSkip,
}: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        ref={tooltipRef}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed z-[10000] pointer-events-auto"
        style={getTooltipStyle()}
      >
        <div className="relative rounded-[1.25rem] border-[0.75px] border-gray-800 p-2 md:rounded-3xl md:p-3">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={3}
          />
          <Card className="relative overflow-hidden rounded-xl border-[0.75px] border-gray-800 bg-black w-[360px]">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {step.icon}
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Step {currentStep + 1} of {totalSteps}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onSkip}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                {step.description}
              </p>
              <div className="mb-4">
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((currentStep + 1) / totalSteps) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Button
                  onClick={onPrev}
                  disabled={currentStep === 0}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-gray-700 bg-transparent text-white hover:bg-gray-800 hover:text-white hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <Button
                  onClick={onNext}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
                  size="sm"
                >
                  {currentStep === totalSteps - 1 ? "Finish" : "Next"}
                  {currentStep < totalSteps - 1 && (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
