"use client";

import React from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

const testimonials = [
  {
    quote:
      "The Hinglish subtitle engine alone is worth 10x the price. It gets Hindi slang and English technical terms perfectly without awkward misspellings.",
    name: "Rohan Verma",
    title: "Tech Creator • @rohanbuilds",
    views: "+1.4M Views",
  },
  {
    quote:
      "I used to spend 2 hours cutting dead silences and adding Hormozi yellow captions in Premiere Pro. Now I do it in 90 seconds while drinking chai.",
    name: "Pooja Sharma",
    title: "Finance & Career • 450K IG",
    views: "+850K Reach",
  },
  {
    quote:
      "The ₹99 Day Pass is genius. When our agency has a batch of 15 client shorts to pump out on Sunday, we activate the pass and export everything.",
    name: "Kabir Nair",
    title: "Growth Studio Founder",
    views: "Agency Tier",
  },
  {
    quote:
      "Zero VPN hassle. Zero modified APK crashes. This is exactly what the Indian creator community needed after CapCut got banned.",
    name: "Ananya Iyer",
    title: "Lifestyle Vlogger • 220K YT",
    views: "+2.1M Views",
  },
];

export function WallOfFameSection() {
  return (
    <section className="pt-[140px] overflow-hidden" id="wall-of-fame">
      <div className="text-center max-w-2xl mx-auto mb-14 px-6">
        <span className="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
          COMMUNITY PROOF
        </span>
        <h2 className="font-black text-3xl sm:text-5xl tracking-tight text-white mt-4 mb-4">
          Loved by creators who go <span className="text-amber-400">viral</span>.
        </h2>
        <p className="text-zinc-400 text-sm sm:text-base">
          See what happens when editing time goes from 2 hours to 60 seconds.
        </p>
      </div>

      <InfiniteMovingCards items={testimonials} direction="left" speed="normal" />
    </section>
  );
}
