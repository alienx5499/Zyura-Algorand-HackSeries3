import type React from "react";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  icon: React.ReactNode;
}

export type TutorialFormHandlers = {
  setShowBuyForm: (show: boolean) => void;
  setPnr: (value: string) => void;
  setFlightNumber: (value: string) => void;
  setDepartureDate: (value: string) => void;
  setDepartureTime: (value: string) => void;
  setProductId: (value: string) => void;
  clearForm: () => void;
};

export interface InteractiveTutorialProps {
  onComplete?: () => void;
  formHandlers?: TutorialFormHandlers;
}
