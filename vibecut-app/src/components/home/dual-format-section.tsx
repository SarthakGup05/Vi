"use client";

import React from "react";
import { Monitor, Smartphone } from "lucide-react";

export function DualFormatSection() {
  return (
    <section className="px-6 pt-[120px] max-w-6xl mx-auto" id="dual-format">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
          DUAL CANVAS EXPORT
        </span>
        <h2 className="font-black text-3xl sm:text-5xl tracking-tight text-white mt-4 mb-4">
          Film once. Go out <span className="text-amber-400">wide</span> and <span className="text-violet-400">tall</span> at the same time.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg">
          One take, two finished videos. Your wide cut hits YouTube landscape while the tall 9:16 edit lands on Shorts and Reels with kinetic captions. Nothing to re-film or manually crop.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Wide 16:9 Card */}
        <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-zinc-800 text-zinc-300">
                HORIZONTAL 16:9
              </span>
              <span className="text-xs text-zinc-500">YouTube Long-Form</span>
            </div>
            <div className="aspect-[16/9] rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-center relative overflow-hidden mb-4">
              <div className="text-center p-4">
                <Monitor className="h-10 w-10 text-violet-400 mx-auto mb-2" />
                <span className="text-xs font-mono text-zinc-400">1920x1080 Full Screen</span>
              </div>
            </div>
            <h3 className="font-bold text-lg text-white mb-1">Full Studio Canvas</h3>
            <p className="text-xs text-zinc-400">
              Ideal for desktop viewers, in-depth breakdowns, and traditional YouTube feeds.
            </p>
          </div>
        </div>

        {/* Tall 9:16 Card */}
        <div className="p-6 rounded-3xl bg-zinc-900/50 border-2 border-violet-500/40 hover:border-violet-500 transition-all flex flex-col justify-between shadow-xl shadow-violet-500/10">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-violet-500/20 text-violet-300">
                VERTICAL 9:16
              </span>
              <span className="text-xs text-amber-400 font-semibold">Shorts, Reels &amp; TikTok</span>
            </div>
            <div className="aspect-[16/9] rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-center relative overflow-hidden mb-4">
              <div className="w-[120px] aspect-[9/16] rounded-xl bg-black border border-violet-500/40 flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <Smartphone className="h-6 w-6 text-amber-400 mx-auto mb-1" />
                  <span className="text-[9px] font-mono text-amber-300 font-bold">1080x1920</span>
                </div>
              </div>
            </div>
            <h3 className="font-bold text-lg text-white mb-1">Auto-Framed Kinetic Reel</h3>
            <p className="text-xs text-zinc-400">
              Automatically centers active speaker, removes dead air, and attaches Hormozi yellow subtitles.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
