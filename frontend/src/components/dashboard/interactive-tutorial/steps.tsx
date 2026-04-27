import {
  FileText,
  HelpCircle,
  Info,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { TutorialStep } from "./types";

export const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to ZYURA Dashboard!",
    description:
      "This interactive tutorial will guide you through the key features of the dashboard. Let's get started!",
    targetSelector: "#dashboard",
    position: "bottom",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: "buy-insurance-intro",
    title: "Buy Insurance",
    description:
      'Let\'s learn how to purchase flight delay insurance. First, click "Buy Policy" to open the form.',
    targetSelector: "#buy button",
    position: "bottom",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    id: "buy-insurance-product",
    title: "Select Product",
    description:
      "Choose an insurance product from the dropdown. Each product has different coverage and premium rates.",
    targetSelector: "#buy select:first-of-type",
    position: "bottom",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    id: "buy-insurance-pnr",
    title: "Enter PNR (Optional)",
    description:
      "Watch as we type a PNR code. When you enter a 6-character PNR, the system automatically fetches and fills your flight details!",
    targetSelector:
      '#buy input[placeholder*="6-character"], #buy input[placeholder*="PNR"]',
    position: "bottom",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    id: "buy-insurance-pnr-fetching",
    title: "Fetching PNR Data...",
    description:
      "The system is now fetching your flight details from the PNR. This happens automatically when you enter a valid 6-character code.",
    targetSelector:
      '#buy input[placeholder*="6-character"], #buy input[placeholder*="PNR"]',
    position: "bottom",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    id: "buy-insurance-pnr-result",
    title: "PNR Data Fetched!",
    description:
      "Great! The PNR was found and your flight details have been auto-filled. You can see the flight number, date, time, and passenger information below.",
    targetSelector: "#buy",
    position: "right",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    id: "buy-insurance-flight",
    title: "Enter Flight Number",
    description:
      "Enter your flight number (e.g., AI202, AP986). This identifies which flight you want to insure.",
    targetSelector:
      '#buy input[placeholder*="AI202"], #buy input[placeholder*="AP986"]',
    position: "bottom",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    id: "buy-insurance-date",
    title: "Select Departure Date",
    description: "Choose the date when your flight is scheduled to depart.",
    targetSelector: '#buy input[type="date"]',
    position: "bottom",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    id: "buy-insurance-time",
    title: "Select Departure Time",
    description:
      "Select the scheduled departure time for your flight from the dropdown.",
    targetSelector: "#buy select:nth-of-type(2)",
    position: "bottom",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    id: "product-details",
    title: "Product Details",
    description:
      "View insurance product information including coverage amount, premium rate, and delay threshold. Select different products to compare.",
    targetSelector: '[data-tutorial="product-details"]',
    position: "left",
    icon: <Info className="w-5 h-5" />,
  },
  {
    id: "my-policies",
    title: "My Policies",
    description:
      "View all your purchased insurance policies here. Click on any policy card to see detailed information including status, coverage, and payout details.",
    targetSelector: "#policies",
    position: "right",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: "how-it-works",
    title: "How It Works",
    description:
      "This section explains the insurance process: select product → pay premium → receive NFT → get automatic payouts for delays.",
    targetSelector: '[data-tutorial="how-it-works"]',
    position: "left",
    icon: <HelpCircle className="w-5 h-5" />,
  },
];
