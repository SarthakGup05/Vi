"use client";

import React from "react";
import { Sparkles, Type, Scissors, Music, Zap, ShieldCheck } from "lucide-react";
import { CardSpotlight } from "@/components/ui/card-spotlight";

export function FeatureMatrixSection() {
  return (
    <section className="px-6 pt-[140px] max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
          ALL-IN-ONE ENGINE
        </span>
        <h2 className="font-black text-3xl sm:text-5xl tracking-tight text-white mt-4 mb-4">
          A whole studio. <span className="text-violet-400">One tab</span>.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg">
          Everything required to produce professional short-form content with zero hardware constraints.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardSpotlight color="#8b5cf6">
          <Sparkles className="h-6 w-6 text-violet-400 mb-3" />
          <h4 className="font-bold text-lg text-white mb-1">AI Prompt Copilot</h4>
          <p className="text-xs text-zinc-400">
            Type instructions in plain English/Hinglish to mutate the timeline like AI coding.
          </p>
        </CardSpotlight>

        <CardSpotlight color="#facc15">
          <Type className="h-6 w-6 text-amber-400 mb-3" />
          <h4 className="font-bold text-lg text-white mb-1">Hormozi Kinetic Captions</h4>
          <p className="text-xs text-zinc-400">
            High-retention animated text with automatic emoji context insertions.
          </p>
        </CardSpotlight>

        <CardSpotlight color="#f43f5e">
          <Scissors className="h-6 w-6 text-rose-400 mb-3" />
          <h4 className="font-bold text-lg text-white mb-1">Silence Surgery</h4>
          <p className="text-xs text-zinc-400">
            Instant removal of dead pauses (&gt;0.4s) for high-energy creator pacing.
          </p>
        </CardSpotlight>

        <CardSpotlight color="#10b981">
          <Music className="h-6 w-6 text-emerald-400 mb-3" />
          <h4 className="font-bold text-lg text-white mb-1">Auto Audio Ducking</h4>
          <p className="text-xs text-zinc-400">
            Background music automatically lowers by -18dB during talking-head speech.
          </p>
        </CardSpotlight>

        <CardSpotlight color="#8b5cf6">
          <Zap className="h-6 w-6 text-violet-400 mb-3" />
          <h4 className="font-bold text-lg text-white mb-1">Dynamic Punch Zooms</h4>
          <p className="text-xs text-zinc-400">
            Subtle 1.1x punch zooms every 4-6 seconds to reset viewer attention.
          </p>
        </CardSpotlight>

        <CardSpotlight color="#facc15">
          <ShieldCheck className="h-6 w-6 text-amber-400 mb-3" />
          <h4 className="font-bold text-lg text-white mb-1">Crash Resilience</h4>
          <p className="text-xs text-zinc-400">
            Direct S3 multipart chunking ensures your video is never lost if your browser refreshes.
          </p>
        </CardSpotlight>
      </div>
    </section>
  );
}
