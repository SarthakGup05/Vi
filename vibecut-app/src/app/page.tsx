"use client";

import React, { useState } from "react";
import { Spotlight } from "@/components/ui/spotlight";
import { BackgroundTexture } from "@/components/ui/background-texture";
import {
  Navbar,
  HeroSection,
  StudioStage,
  PlatformsStrip,
  DualFormatSection,
  ScriptTrimmerSection,
  CreatorCategoriesSection,
  FeatureMatrixSection,
  WallOfFameSection,
  PricingSection,
  FaqSection,
  CtaBannerSection,
  Footer,
  UpiCheckoutModal,
  DemoVideoModal,
} from "@/components/home";

export default function VidystStyleHomepage() {
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("₹99 Creator Day Pass");
  const [demoVideoOpen, setDemoVideoOpen] = useState<boolean>(false);

  const handleOpenCheckout = (plan: string = "₹99 Creator Day Pass") => {
    setSelectedPlan(plan);
    setShowCheckoutModal(true);
  };

  return (
    <BackgroundTexture className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col relative selection:bg-violet-600/30 selection:text-violet-200">
      {/* Aceternity Spotlight Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="#8b5cf6"
        />
        <Spotlight
          className="top-1/3 right-0 md:right-40"
          fill="#facc15"
        />
      </div>

      {/* 1. Header Navigation */}
      <Navbar onOpenCheckout={handleOpenCheckout} />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection
          onOpenCheckout={handleOpenCheckout}
          onOpenDemo={() => setDemoVideoOpen(true)}
        />

        {/* 3. Studio Master Stage (Interactive Preview) */}
        <StudioStage />

        {/* 4. Supported Platforms Strip */}
        <PlatformsStrip />

        {/* 5. Dual Format (Wide & Tall) */}
        <DualFormatSection />

        {/* 6. Script Trimmer / Silence Surgery Deep Dive */}
        <ScriptTrimmerSection />

        {/* 7. Creator Persona Categories */}
        <CreatorCategoriesSection />

        {/* 8. Studio Bento Matrix */}
        <FeatureMatrixSection />

        {/* 9. Wall of Fame Marquee */}
        <WallOfFameSection />

        {/* 10. Pricing Plans & Day Pass */}
        <PricingSection onSelectPlan={handleOpenCheckout} />

        {/* 11. Numbered FAQ Accordion */}
        <FaqSection />

        {/* 12. Final Closing Call-to-Action Banner */}
        <CtaBannerSection onOpenCheckout={handleOpenCheckout} />
      </main>

      {/* 13. Footer */}
      <Footer />

      {/* Modals */}
      <UpiCheckoutModal
        isOpen={showCheckoutModal}
        plan={selectedPlan}
        onClose={() => setShowCheckoutModal(false)}
      />

      <DemoVideoModal
        isOpen={demoVideoOpen}
        onClose={() => setDemoVideoOpen(false)}
      />
    </BackgroundTexture>
  );
}
