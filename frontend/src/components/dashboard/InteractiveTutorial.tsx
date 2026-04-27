"use client";

import { StartTutorialButton } from "./interactive-tutorial/StartTutorialButton";
import { TutorialOverlay } from "./interactive-tutorial/TutorialOverlay";
import { TutorialTooltip } from "./interactive-tutorial/TutorialTooltip";
import type { InteractiveTutorialProps } from "./interactive-tutorial/types";
import { useInteractiveTutorial } from "./interactive-tutorial/useInteractiveTutorial";

export function InteractiveTutorial({
  onComplete,
  formHandlers,
}: InteractiveTutorialProps) {
  const tutorial = useInteractiveTutorial(formHandlers, onComplete);

  if (!tutorial.isActive) {
    if (tutorial.isDevMode) {
      return <StartTutorialButton onStart={tutorial.startTutorial} />;
    }
    return null;
  }

  return (
    <>
      <TutorialOverlay targetRect={tutorial.targetRect} />
      <TutorialTooltip
        currentStep={tutorial.currentStep}
        totalSteps={tutorial.totalSteps}
        step={tutorial.currentStepData}
        tooltipRef={tutorial.tooltipRef}
        getTooltipStyle={tutorial.getTooltipStyle}
        onPrev={tutorial.prevStep}
        onNext={tutorial.nextStep}
        onSkip={tutorial.skipTutorial}
      />
    </>
  );
}
