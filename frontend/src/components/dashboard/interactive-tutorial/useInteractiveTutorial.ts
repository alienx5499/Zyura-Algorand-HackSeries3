import { useEffect, useRef, useState } from "react";
import { tutorialSteps } from "./steps";
import type { TutorialFormHandlers } from "./types";

export function useInteractiveTutorial(
  formHandlers?: TutorialFormHandlers,
  onComplete?: () => void,
) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const exampleDataFilled = useRef(false);
  const pnrTypingInProgress = useRef(false);
  const pnrFetched = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tutorialCompleted = localStorage.getItem("zyura-tutorial-completed");
    if (!tutorialCompleted) {
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isActive || !formHandlers) return;
    const step = tutorialSteps[currentStep];
    const isBuyInsuranceStep = step?.id?.startsWith("buy-insurance");

    if (isBuyInsuranceStep) {
      if (step.id === "buy-insurance-intro") {
        setTimeout(() => {
          formHandlers.setShowBuyForm(true);
        }, 300);
      }
    }

    if (
      isBuyInsuranceStep &&
      step.id === "buy-insurance-pnr" &&
      !pnrTypingInProgress.current
    ) {
      pnrTypingInProgress.current = true;
      const typePnr = async () => {
        const pnrCode = "ABC123";
        formHandlers.setPnr("");
        await new Promise((resolve) => setTimeout(resolve, 300));
        for (let i = 0; i < pnrCode.length; i++) {
          formHandlers.setPnr(pnrCode.slice(0, i + 1));
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
        await new Promise((resolve) => setTimeout(resolve, 800));
        const fetchingStepIndex = tutorialSteps.findIndex(
          (s) => s.id === "buy-insurance-pnr-fetching",
        );
        if (fetchingStepIndex !== -1) setCurrentStep(fetchingStepIndex);

        let fetchComplete = false;
        let attempts = 0;
        const maxAttempts = 30;
        while (!fetchComplete && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          attempts++;
          const buySection = document.querySelector("#buy");
          const helperText = buySection?.textContent || "";
          const hasPassengerDetails =
            buySection?.querySelector('[class*="Passenger"]') ||
            buySection?.textContent?.includes("Passenger Details");
          if (
            helperText.includes("PNR found") ||
            helperText.includes("auto-filled") ||
            hasPassengerDetails
          ) {
            fetchComplete = true;
            pnrFetched.current = true;
            const resultStepIndex = tutorialSteps.findIndex(
              (s) => s.id === "buy-insurance-pnr-result",
            );
            if (resultStepIndex !== -1) {
              setTimeout(() => {
                setCurrentStep(resultStepIndex);
                setTimeout(() => {
                  const section = document.querySelector("#buy");
                  if (section) setTargetRect(section.getBoundingClientRect());
                }, 700);
              }, 500);
            }
            break;
          }
        }

        if (!fetchComplete) {
          formHandlers.setFlightNumber("AI202");
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          formHandlers.setDepartureDate(tomorrow.toISOString().split("T")[0]);
          formHandlers.setDepartureTime("14:30");
          const resultStepIndex = tutorialSteps.findIndex(
            (s) => s.id === "buy-insurance-pnr-result",
          );
          if (resultStepIndex !== -1) {
            setTimeout(() => setCurrentStep(resultStepIndex), 1000);
          }
        }
      };
      typePnr();
    }

    if (
      isBuyInsuranceStep &&
      !exampleDataFilled.current &&
      !step.id.startsWith("buy-insurance-pnr")
    ) {
      const fillData = async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const productSelect = document.querySelector(
          "#buy select:first-of-type",
        ) as HTMLSelectElement | null;
        if (productSelect && productSelect.options.length > 1) {
          formHandlers.setProductId(productSelect.options[1].value);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        if (!pnrFetched.current) {
          formHandlers.setFlightNumber("AI202");
          await new Promise((resolve) => setTimeout(resolve, 400));
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          formHandlers.setDepartureDate(tomorrow.toISOString().split("T")[0]);
          await new Promise((resolve) => setTimeout(resolve, 400));
          formHandlers.setDepartureTime("14:30");
        }
        exampleDataFilled.current = true;
      };
      fillData();
    }

    if (!isBuyInsuranceStep && exampleDataFilled.current) {
      formHandlers.clearForm();
      exampleDataFilled.current = false;
    }
  }, [currentStep, isActive, formHandlers]);

  useEffect(() => {
    if (!isActive) return;
    const updateRect = () => {
      const step = tutorialSteps[currentStep];
      if (!step) return setTargetRect(null);

      if (step.id === "buy-insurance-pnr-result") {
        const buySection = document.querySelector("#buy");
        if (buySection) {
          setTimeout(() => {
            const passengerSection =
              buySection
                .querySelector('[class*="Passenger"], [class*="passenger"]')
                ?.closest("div") ||
              Array.from(buySection.querySelectorAll("div")).find((div) =>
                div.textContent?.includes("Passenger Details"),
              );
            if (passengerSection) {
              setTargetRect(passengerSection.getBoundingClientRect());
              passengerSection.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
              });
            } else {
              setTargetRect(buySection.getBoundingClientRect());
              buySection.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
              });
            }
          }, 600);
          return;
        }
      }

      if (step.id === "buy-insurance-intro") {
        const buySection = document.querySelector("#buy");
        const button = buySection?.querySelector("button");
        if (button) {
          setTargetRect(button.getBoundingClientRect());
          return;
        }
      }

      if (step.id === "buy-insurance-time") {
        const buySection = document.querySelector("#buy");
        if (buySection) {
          const labels = Array.from(buySection.querySelectorAll("label"));
          const departureTimeLabel = labels.find((label) =>
            label.textContent?.includes("Departure Time"),
          );
          const select =
            departureTimeLabel?.parentElement?.querySelector("select");
          if (select) {
            setTargetRect(select.getBoundingClientRect());
            setTimeout(() => {
              select.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
              });
            }, 100);
            return;
          }
          const selects = Array.from(buySection.querySelectorAll("select"));
          if (selects.length >= 2 && selects[1]) {
            setTargetRect(selects[1].getBoundingClientRect());
            setTimeout(() => {
              selects[1]?.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "center",
              });
            }, 100);
            return;
          }
        }
      }

      const targetElement = document.querySelector(step.targetSelector);
      if (!targetElement) return setTargetRect(null);
      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);
      setTimeout(
        () =>
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          }),
        100,
      );
    };
    updateRect();
    const observer = new MutationObserver(() => {
      clearTimeout(
        (window as Window & { tutorialUpdateTimeout?: number })
          .tutorialUpdateTimeout,
      );
      (
        window as Window & { tutorialUpdateTimeout?: number }
      ).tutorialUpdateTimeout = window.setTimeout(updateRect, 100);
    });
    const buySection = document.querySelector("#buy");
    if (buySection) {
      observer.observe(buySection, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });
    }
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      observer.disconnect();
      clearTimeout(
        (window as Window & { tutorialUpdateTimeout?: number })
          .tutorialUpdateTimeout,
      );
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [isActive, currentStep]);

  const startTutorial = () => {
    exampleDataFilled.current = false;
    pnrTypingInProgress.current = false;
    pnrFetched.current = false;
    setIsActive(true);
    setCurrentStep(0);
  };

  const completeTutorial = () => {
    if (exampleDataFilled.current && formHandlers) {
      formHandlers.clearForm();
      exampleDataFilled.current = false;
    }
    pnrTypingInProgress.current = false;
    pnrFetched.current = false;
    setIsActive(false);
    setCurrentStep(0);
    onComplete?.();
    if (typeof window !== "undefined") {
      localStorage.setItem("zyura-tutorial-completed", "true");
    }
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      let nextStepIndex = currentStep + 1;
      while (nextStepIndex < tutorialSteps.length) {
        const next = tutorialSteps[nextStepIndex];
        if (
          pnrFetched.current &&
          (next.id === "buy-insurance-flight" ||
            next.id === "buy-insurance-date")
        ) {
          nextStepIndex++;
          continue;
        }
        const targetElement = document.querySelector(next.targetSelector);
        if (
          targetElement ||
          next.id === "welcome" ||
          next.id === "buy-insurance-pnr-fetching" ||
          next.id === "buy-insurance-pnr-result"
        ) {
          setCurrentStep(nextStepIndex);
          break;
        }
        nextStepIndex++;
      }
      if (nextStepIndex >= tutorialSteps.length) {
        completeTutorial();
      }
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      let prevStepIndex = currentStep - 1;
      while (prevStepIndex >= 0) {
        const prev = tutorialSteps[prevStepIndex];
        if (
          pnrFetched.current &&
          (prev.id === "buy-insurance-flight" ||
            prev.id === "buy-insurance-date")
        ) {
          prevStepIndex--;
          continue;
        }
        setCurrentStep(prevStepIndex);
        break;
      }
    }
  };

  const getTooltipStyle = () => {
    const step = tutorialSteps[currentStep];
    if (!step) return { top: "50%", left: "50%" };
    const targetElement = document.querySelector(step.targetSelector);
    if (!targetElement)
      return {
        top: `${window.innerHeight / 2 - 100}px`,
        left: `${window.innerWidth / 2 - 160}px`,
      };
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 360;
    const tooltipHeight = 240;
    const spacing = 40;
    let top = 0;
    let left = 0;
    switch (step.position) {
      case "top":
        top = rect.top - tooltipHeight - spacing;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = rect.bottom + spacing;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        left = rect.left - tooltipWidth - spacing;
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        if (left < 20) left = rect.right + spacing;
        break;
      case "right":
        left = rect.right + spacing;
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        if (left + tooltipWidth > window.innerWidth - 20) {
          left = rect.left - tooltipWidth - spacing;
        }
        break;
      case "center":
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
        break;
    }

    if (step.position === "left" && left < 20) {
      left = Math.max(20, rect.right + spacing);
    } else if (step.position === "right") {
      if (left + tooltipWidth > window.innerWidth - 20) {
        left = Math.max(20, rect.left - tooltipWidth - spacing);
      }
      if (
        left < rect.right + spacing &&
        left + tooltipWidth > rect.left - spacing
      ) {
        left = rect.right + spacing;
        if (left + tooltipWidth > window.innerWidth - 20) {
          left = rect.left - tooltipWidth - spacing;
        }
      }
    } else {
      if (left < 20) left = 20;
      if (left + tooltipWidth > window.innerWidth - 20) {
        left = window.innerWidth - tooltipWidth - 20;
      }
    }

    if (top < 20) top = 20;
    if (top + tooltipHeight > window.innerHeight - 20) {
      top = window.innerHeight - tooltipHeight - 20;
    }
    return { top: `${top}px`, left: `${left}px` };
  };

  return {
    isActive,
    currentStep,
    targetRect,
    tooltipRef,
    currentStepData: tutorialSteps[currentStep],
    isDevMode: process.env.NODE_ENV === "development",
    totalSteps: tutorialSteps.length,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial: completeTutorial,
    getTooltipStyle,
  };
}
