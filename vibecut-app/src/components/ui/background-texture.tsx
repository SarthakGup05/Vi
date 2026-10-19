"use client";

import React from "react";
import { cn } from "@/lib/utils";

export const BackgroundTexture = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* 1. Deep Radial Mesh Gradients */}
      <div className="pointer-events-none absolute inset-0 -z-30 overflow-hidden">
        {/* Top-Center Electric Violet/Indigo Bloom */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[650px] bg-gradient-to-b from-violet-600/25 via-indigo-600/15 to-transparent rounded-full blur-[140px] opacity-70" />
        
        {/* Mid-Right Warm Amber Highlight */}
        <div className="absolute top-[35%] -right-[10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[150px] opacity-60" />
        
        {/* Mid-Left Deep Cyan Accent */}
        <div className="absolute top-[55%] -left-[10%] w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px] opacity-50" />

        {/* Bottom Ambient Glow */}
        <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/15 rounded-full blur-[150px] opacity-40" />
      </div>

      {/* 2. Micro Dot-Grid Pattern with Smooth Radial Mask */}
      <div 
        className="pointer-events-none absolute inset-0 -z-20 opacity-40 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* 3. Subtle Cyber Grid Line Overlay */}
      <div 
        className="pointer-events-none absolute inset-0 -z-25 opacity-25 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_15%,#000_30%,transparent_90%)]"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
        }}
      />

      {/* 4. Film Grain / Subtle Noise Texture */}
      <div 
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {children}
    </div>
  );
};
