"use client";
import { LandingHeroSection } from "@/components/landing/LandingHeroSection";
import { LandingAboutSection } from "@/components/landing/LandingAboutSection";
import { LandingPoliciesSection } from "@/components/landing/LandingPoliciesSection";
import { LandingFeaturesSection } from "@/components/landing/LandingFeaturesSection";
import { LandingContactSection } from "@/components/landing/LandingContactSection";
import { useLandingPolicyImages } from "@/components/landing/useLandingPolicyImages";

const LandingPage = () => {
  const { policyImages, isLoadingPolicies } = useLandingPolicyImages();

  return (
    <div className="min-h-screen w-full bg-black">
      <LandingHeroSection />
      <LandingAboutSection />
      <LandingPoliciesSection
        policyImages={policyImages}
        isLoadingPolicies={isLoadingPolicies}
      />
      <LandingFeaturesSection />
      <LandingContactSection />
    </div>
  );
};

export default LandingPage;
