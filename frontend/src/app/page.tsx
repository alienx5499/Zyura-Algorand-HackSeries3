"use client";

import LandingPage from "@/components/LandingPage";
import { Navbar } from "@/components/ui/navbar";
import { DevPanel } from "@/components/ui/DevPanel";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Note: Metadata export doesn't work with "use client" components
// Metadata is handled in layout.tsx for client components
// Structured data is handled in StructuredData component

export default function Home() {
  return (
    <>
      <Navbar />
      <main role="main">
        <LandingPage />
      </main>
      <DevPanel />
    </>
  );
}
