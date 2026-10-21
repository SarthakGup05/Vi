"use client";

import React, { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Flame, ArrowRight, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { BackgroundCubesGrid } from "@/components/ui/background-cubes-grid";

// Exact vector brand icons for Instagram, YouTube, and TikTok
const PLATFORM_ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-full" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-full" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-full" aria-hidden>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  ),
};

type PlatformKey = "instagram" | "youtube" | "tiktok";

interface FlipPlatform {
  key: PlatformKey;
  name: string;
  badge: string;
  iconBg: string;
  glow: string;
  accentText: string;
}

const FLIP_PLATFORMS: FlipPlatform[] = [
  {
    key: "instagram",
    name: "Instagram",
    badge: "Reels",
    iconBg: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    glow: "rgba(225, 48, 108, 0.45)",
    accentText: "#f43f5e",
  },
  {
    key: "youtube",
    name: "YouTube",
    badge: "Shorts",
    iconBg: "#FF0000",
    glow: "rgba(255, 0, 0, 0.45)",
    accentText: "#ef4444",
  },
  {
    key: "tiktok",
    name: "TikTok",
    badge: "Virals",
    iconBg: "linear-gradient(135deg, #00f2fe 0%, #000000 50%, #fe0979 100%)",
    glow: "rgba(0, 242, 254, 0.45)",
    accentText: "#06b6d4",
  },
];

const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

const TONES = {
  light: {
    heading: "text-[#111]",
    body: "text-neutral-600",
    note: "text-neutral-500",
    pill: "bg-white text-[#111] shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.06)] border border-neutral-200",
    primary: "bg-[#111] text-white shadow-lg hover:bg-neutral-800",
    secondary: "text-[#111] bg-black/[0.05] hover:bg-black/[0.09] border border-black/[0.08]",
  },
  dark: {
    heading: "text-white",
    body: "text-zinc-300",
    note: "text-zinc-400",
    pill: "bg-zinc-900/95 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.7)] border border-zinc-700/60 backdrop-blur-md",
    primary: "bg-gradient-to-r from-violet-600 via-indigo-600 to-rose-600 text-white shadow-lg shadow-violet-600/30 hover:opacity-95",
    secondary: "text-zinc-200 bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800 backdrop-blur-md",
  },
};

type HeroTone = keyof typeof TONES;

export function HeroContent({
  tone = "dark",
  onOpenCheckout,
  onOpenDemo,
}: {
  tone?: HeroTone;
  onOpenCheckout?: (plan: string) => void;
  onOpenDemo?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const t = TONES[tone];

  // State for smoothly flipping between Instagram, YouTube, and TikTok
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % FLIP_PLATFORMS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const currentPlatform = FLIP_PLATFORMS[currentIndex];

  const fadeUp = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: EASE_OUT, delay },
  });

  return (
    <div className="pointer-events-none mx-auto flex max-w-[1080px] flex-col items-center text-center antialiased relative z-10">
      
      {/* Pill Badge */}
      <motion.div
        {...fadeUp(0.1)}
        className="pointer-events-auto inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-violet-500/30 text-xs font-medium text-zinc-300 mb-6 shadow-sm backdrop-blur-md"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
        </span>
        <span className="font-semibold text-white">⚡ Built for the Creator Economy</span>
        <span className="text-zinc-600">•</span>
        <span className="text-amber-400 font-bold">No VPN Required</span>
      </motion.div>

      {/* Main Headline with Smooth Flipping Platform Word */}
      <h1
        className={cn(
          "max-w-[28ch] text-[clamp(34px,5vw,66px)] leading-[1.25] font-black tracking-[-0.03em] text-balance",
          t.heading
        )}
      >
        Edit viral Shorts
        <br />
        <span className="inline-block relative align-middle min-w-[200px] sm:min-w-[250px] text-center my-1">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentPlatform.key}
              initial={{ opacity: 0, y: 18, filter: "blur(6px)", scale: 0.94 }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
              exit={{ opacity: 0, y: -18, filter: "blur(6px)", scale: 0.94 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "inline-flex items-center gap-[0.3em] rounded-full py-[0.1em] pr-[0.45em] pl-[0.12em] align-middle leading-none select-none transition-shadow",
                t.pill
              )}
              style={{
                boxShadow: `0 0 25px -4px ${currentPlatform.glow}`,
              }}
            >
              {/* Platform Logo Circle */}
              <span
                className="inline-flex size-[0.9em] items-center justify-center rounded-full shadow-inner p-[0.2em] text-white"
                style={{
                  background: currentPlatform.iconBg,
                }}
              >
                {PLATFORM_ICONS[currentPlatform.key]}
              </span>

              {/* Platform Text */}
              <span className="font-extrabold tracking-tight text-[0.88em]">
                {currentPlatform.name}
              </span>

              {/* Format Tag Pill */}
              <span className="text-[0.55em] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/15 ml-0.5 opacity-80">
                {currentPlatform.badge}
              </span>
            </motion.span>
          </AnimatePresence>
        </span>
        <br />
        with one click.
      </h1>

      {/* App Subtitle */}
      <motion.p
        {...fadeUp(0.5)}
        className={cn(
          "mt-7 max-w-[640px] text-[clamp(16px,1.4vw,19px)] leading-[1.6] text-pretty font-normal",
          t.body
        )}
      >
        Streamline cuts, remove dead pauses with silence surgery, and burn Hormozi kinetic captions directly in your browser. Wide for YouTube, tall for Reels—in one single export.
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        {...fadeUp(0.7)}
        className="pointer-events-auto mt-8 flex flex-col items-center gap-3.5 sm:flex-row"
      >
        <Link
          href="/projects"
          className={cn(
            "inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-[15px] font-bold transition-all cursor-pointer shadow-xl active:scale-95",
            t.primary
          )}
        >
          <Flame className="h-4 w-4 text-amber-300 fill-amber-300" />
          <span>Start Editing Free</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <button
          onClick={onOpenDemo}
          className={cn(
            "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-all cursor-pointer active:scale-95",
            t.secondary
          )}
        >
          <Play className="h-4 w-4 text-violet-400 fill-violet-400" />
          <span>Watch 30s Interactive Demo</span>
        </button>
      </motion.div>

      {/* Supporting Trust Note */}
      <motion.p
        {...fadeUp(0.85)}
        className={cn(
          "mt-5 text-xs font-medium tracking-wide",
          t.note
        )}
      >
        Free forever tier included • Instant UPI checkout for Day Passes • 100% browser-based
      </motion.p>
    </div>
  );
}

export default function BackgroundCubesGridDemo({
  onOpenCheckout,
  onOpenDemo,
}: {
  onOpenCheckout?: (plan: string) => void;
  onOpenDemo?: () => void;
}) {
  return (
    <div className="relative isolate flex min-h-[46rem] w-full items-center justify-center overflow-hidden px-5 py-20 sm:px-8 bg-[#09090b] rounded-3xl my-2 border border-zinc-800/80 shadow-2xl">
      {/* 3D Background Cubes Grid (Aceternity UI) - Obsidian Dark */}
      <BackgroundCubesGrid
        variant="isometric"
        topColor="#18181b"
        leftColor="#121215"
        rightColor="#0a0a0c"
        glowColor="#8b5cf6"
        glow={0.9}
        cellSize={135}
        className="-z-10"
      />

      <HeroContent
        tone="dark"
        onOpenCheckout={onOpenCheckout}
        onOpenDemo={onOpenDemo}
      />
    </div>
  );
}
