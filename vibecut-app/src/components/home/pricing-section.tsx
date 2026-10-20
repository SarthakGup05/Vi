"use client";

import React from "react";
import { Check, CheckCircle2, X } from "lucide-react";

interface PricingSectionProps {
  onSelectPlan: (plan: string) => void;
}

export function PricingSection({ onSelectPlan }: PricingSectionProps) {
  return (
    <section className="px-6 pt-[140px] max-w-6xl mx-auto" id="pricing">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
          INSTANT UPI &amp; DAY PASSES
        </span>
        <h2 className="font-black text-3xl sm:text-5xl tracking-tight text-white mt-4 mb-4">
          Start free. <span className="text-amber-400">₹99</span> on us.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg">
          No long-term commitments required. Batch edit your weekend reels with a 24-hour pass, or subscribe monthly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Plan 1: Free Starter */}
        <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Free Starter</div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="font-black text-4xl text-white">₹0</span>
              <span className="text-zinc-500 text-sm">/ forever</span>
            </div>
            <p className="text-zinc-400 text-sm mb-6">
              Perfect for testing the AI auto-captions and silence trimmer on raw clips.
            </p>
            <ul className="space-y-3 text-sm text-zinc-300 mb-8">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-400" /> 3 exports per month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-400" /> 720p HD resolution
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-400" /> Standard kinetic captions
              </li>
              <li className="flex items-center gap-2 text-zinc-500">
                <X className="h-4 w-4" /> Small VibeCut watermark
              </li>
            </ul>
          </div>
          <button
            onClick={() => onSelectPlan("Free Starter")}
            className="w-full py-3.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-all cursor-pointer"
          >
            Get Started Free
          </button>
        </div>

        {/* Plan 2: Creator Day Pass (Featured / Glow Border) */}
        <div className="p-8 rounded-3xl bg-zinc-950 border-2 border-amber-400 shadow-2xl relative flex flex-col justify-between glow-yellow scale-[1.02]">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider shadow">
            MOST POPULAR FOR CREATORS 🔥
          </div>
          <div>
            <div className="flex items-center justify-between mb-2 mt-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Creator Day Pass</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">
                24 HOURS
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="font-black text-5xl text-amber-400">₹99</span>
              <span className="text-zinc-500 text-sm">/ 24 Hours Pass</span>
            </div>
            <p className="text-zinc-300 text-sm mb-6">
              Batch edit an entire week of Reels in a single power session with zero limits.
            </p>
            <ul className="space-y-3 text-sm text-white mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400" /> Unlimited exports for 24 hours
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400" /> 1080p 60fps Full HD • No watermark
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400" /> Hormozi kinetic captions + emoji engine
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400" /> Silence surgery audio trimmer
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-400" /> Instant UPI &amp; QR scan checkout
              </li>
            </ul>
          </div>
          <button
            onClick={() => onSelectPlan("₹99 Creator Day Pass")}
            className="w-full py-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-sm shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            Grab 24h Pass for ₹99
          </button>
        </div>

        {/* Plan 3: Pro Monthly */}
        <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Pro Monthly</div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="font-black text-4xl text-white">₹799</span>
              <span className="text-zinc-500 text-sm">/ month</span>
            </div>
            <p className="text-zinc-400 text-sm mb-6">
              For active daily creators, agency editors, and brands publishing 20+ videos/mo.
            </p>
            <ul className="space-y-3 text-sm text-zinc-300 mb-8">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-400" /> Unlimited 4K HDR exports
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-400" /> Upload custom brand fonts
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-400" /> Prompt Copilot assistant
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-400" /> Priority fast-lane GPU render queue
              </li>
            </ul>
          </div>
          <button
            onClick={() => onSelectPlan("₹799 Pro Monthly")}
            className="w-full py-3.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-all cursor-pointer"
          >
            Go Pro Monthly
          </button>
        </div>
      </div>
    </section>
  );
}
