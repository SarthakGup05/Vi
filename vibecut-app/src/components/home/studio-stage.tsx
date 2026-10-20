"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Monitor,
  AudioWaveform,
  Play,
  Scissors,
} from "lucide-react";

export function StudioStage() {
  const [activeFormat, setActiveFormat] = useState<"vertical" | "horizontal">("vertical");
  const [activeLayout, setActiveLayout] = useState<string>("SOLO");

  return (
    <section id="stage" className="px-6 pb-20 max-w-6xl mx-auto scroll-mt-20">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* macOS Window Title Bar */}
        <div className="px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-3 text-xs font-mono text-zinc-400 hidden sm:inline">
              VibeCut Studio — synth-reels-cutdown.mp4
            </span>
          </div>

          {/* Live Status Indicators */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[11px] border border-rose-500/30">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              REC 00:42:18
            </span>
            <span className="text-zinc-500 hidden sm:inline">|</span>
            <span className="text-zinc-400 font-mono text-xs hidden sm:inline">1,305 VIEWS</span>
            <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 text-[10px] font-black">
              94% RETENTION
            </span>
          </div>
        </div>

        {/* Stage Controls: Format Switcher (Horizontal vs Vertical) */}
        <div className="px-6 py-3 border-b border-zinc-800/60 bg-zinc-900/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveFormat("vertical")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeFormat === "vertical"
                  ? "bg-violet-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Vertical 9:16 (Shorts/Reels)</span>
            </button>
            <button
              onClick={() => setActiveFormat("horizontal")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeFormat === "horizontal"
                  ? "bg-violet-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Horizontal 16:9 (YouTube)</span>
            </button>
          </div>

          {/* Layout Presets (Vidyst-Style) */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 text-[11px] uppercase tracking-wider font-semibold">Layout:</span>
            {["SOLO", "SCREEN + CAM", "PUNCH ZOOM"].map((layout) => (
              <button
                key={layout}
                onClick={() => setActiveLayout(layout)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  activeLayout === layout
                    ? "bg-zinc-800 text-amber-400 border border-amber-400/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {layout}
              </button>
            ))}
          </div>
        </div>

        {/* Studio Canvas Stage */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center min-h-[460px]">
          {/* Left Panel: Audio Mixer Tracks (Vidyst-Style) */}
          <div className="lg:col-span-3 flex flex-col gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <AudioWaveform className="h-3.5 w-3.5 text-violet-400" /> Audio Tracks
              </span>
              <span className="text-[10px] text-amber-400 font-mono">AUTO-DUCK ON</span>
            </div>

            {/* Track 1: Dialogue */}
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-zinc-200">Voice (Dialogue)</span>
                <span className="font-mono text-[10px] text-violet-400">-1.8 dB</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden flex">
                <div className="w-[72%] bg-violet-500 h-full" />
                <div className="w-[10%] bg-amber-400 h-full" />
              </div>
            </div>

            {/* Track 2: BGM Lo-Fi Beat (Ducked) */}
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-zinc-200">BGM (Lo-fi Trap)</span>
                <span className="font-mono text-[10px] text-amber-400">-18 dB (Ducked)</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden flex">
                <div className="w-[28%] bg-amber-400 h-full" />
              </div>
            </div>

            {/* Track 3: Sound Effects (Whoosh) */}
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-zinc-200">SFX Cue (Whoosh)</span>
                <span className="font-mono text-[10px] text-rose-400">Triggered</span>
              </div>
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden flex">
                <div className="w-[85%] bg-rose-500 h-full" />
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 italic mt-1">
              ✓ Speech detected: Music dips by 18dB automatically.
            </div>
          </div>

          {/* Center Canvas: Dynamic Dual Format View */}
          <div className="lg:col-span-6 flex justify-center items-center py-4">
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className={`relative rounded-3xl overflow-hidden bg-black border-2 border-zinc-800 shadow-2xl flex flex-col justify-between ${
                activeFormat === "vertical"
                  ? "w-[280px] sm:w-[300px] aspect-[9/16]"
                  : "w-full aspect-[16/9]"
              }`}
            >
              {/* Video Mockup Frame */}
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/70 via-zinc-900 to-black flex items-center justify-center">
                <div className="w-40 h-40 rounded-full bg-violet-600/30 blur-3xl absolute" />
                <div className="text-center opacity-30">
                  <Smartphone className="h-12 w-12 mx-auto text-zinc-500 mb-1" />
                  <span className="text-[10px] font-mono text-zinc-400">LIVE CANVAS PREVIEW</span>
                </div>
              </div>

              {/* Top Bar inside Canvas */}
              <div className="relative z-10 pt-3 px-4 flex items-center justify-between text-[10px] text-white/70 font-mono">
                <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">REC • 00:42.18</span>
                <span className="bg-violet-600/60 px-2 py-0.5 rounded text-white font-bold">1080p 60fps</span>
              </div>

              {/* Kinetic Pop Captions */}
              <div className="relative z-10 pb-6 px-4 text-center">
                <div className="text-[9px] font-black text-zinc-400 tracking-wider uppercase mb-1">
                  HORMOZI KINETIC CAPTIONS
                </div>
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm sm:text-base font-black uppercase">
                  <span className="bg-black/80 px-2 py-0.5 rounded text-white">THIS ONE</span>
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="bg-amber-400 text-zinc-950 px-2 py-0.5 rounded rotate-[-2deg] font-black"
                  >
                    SIMPLE TRICK 🚀
                  </motion.span>
                </div>
                <span className="text-[10px] font-black text-white bg-black/60 px-2 py-0.5 rounded mt-1 inline-block">
                  DOUBLED MY ENGAGEMENT
                </span>
              </div>

              {/* Bottom Silence Cut Visual Bar */}
              <div className="relative z-10 p-2.5 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 flex items-center gap-2">
                <Play className="h-3 w-3 text-violet-400 fill-violet-400" />
                <div className="flex-1 flex items-center gap-0.5 h-3">
                  <div className="w-1 bg-violet-500 h-2.5 rounded-full" />
                  <div className="w-1 bg-violet-500 h-3 rounded-full" />
                  <div className="w-1 bg-amber-400 h-2 rounded-full" />
                  <div className="w-1 bg-rose-500 h-1 rounded-full opacity-40" />
                  <div className="w-1 bg-violet-500 h-3 rounded-full" />
                </div>
                <span className="text-[8px] font-mono text-zinc-400">0:14 / 0:58</span>
              </div>
            </motion.div>
          </div>

          {/* Right Panel: Sliced Pauses & Live Transcript */}
          <div className="lg:col-span-3 flex flex-col gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Scissors className="h-3.5 w-3.5 text-rose-400" /> Silence Surgery
              </span>
              <span className="text-[10px] text-rose-400 font-mono">-3.2s SAVED</span>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>00:04.12 - 00:05.40</span>
                <span className="text-rose-400 font-mono font-bold">1.28s cut</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                <span>00:18.25 - 00:20.17</span>
                <span className="text-rose-400 font-mono font-bold">1.92s cut</span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Pacing Score</span>
              <span className="text-sm font-black text-amber-400 font-mono">94 / 100</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
