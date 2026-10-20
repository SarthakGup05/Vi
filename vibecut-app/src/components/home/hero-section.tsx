"use client";

import React from "react";
import BackgroundCubesGridDemo from "@/components/background-cubes-grid-demo";

interface HeroSectionProps {
  onOpenCheckout: (plan: string) => void;
  onOpenDemo: () => void;
}

export function HeroSection({ onOpenCheckout, onOpenDemo }: HeroSectionProps) {
  return (
    <section className="px-4 sm:px-6 pt-20 md:pt-24 max-w-7xl mx-auto">
      <BackgroundCubesGridDemo
        onOpenCheckout={onOpenCheckout}
        onOpenDemo={onOpenDemo}
      />
    </section>
  );
}
