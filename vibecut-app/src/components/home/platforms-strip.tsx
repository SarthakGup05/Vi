"use client";

import React from "react";

const platforms = [
  { name: "Instagram Reels", icon: "📸" },
  { name: "YouTube Shorts", icon: "▶️" },
  { name: "TikTok", icon: "🎵" },
  { name: "YouTube Landscape (16:9)", icon: "🖥️" },
  { name: "LinkedIn Video", icon: "💼" },
  { name: "WhatsApp Status", icon: "💬" },
];

export function PlatformsStrip() {
  return (
    <section className="py-12 border-y border-zinc-800/80 bg-zinc-900/30">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">
          ONE EXPORT DEPLOYS NATIVELY TO ALL VIRAL DESTINATIONS
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
          {platforms.map((p) => (
            <div
              key={p.name}
              className="px-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs sm:text-sm font-semibold text-zinc-300 flex items-center gap-2 hover:border-violet-500/40 transition-colors"
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
