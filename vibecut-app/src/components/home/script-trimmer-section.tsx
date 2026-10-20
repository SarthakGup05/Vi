"use client";

import React, { useState } from "react";
import { Scissors, Globe, Type, Volume2 } from "lucide-react";

const transcriptWords = [
  { text: "So", time: 0.1 },
  { text: "today", time: 0.3 },
  { text: "I'm", time: 0.5 },
  { text: "gonna", time: 0.7 },
  { text: "share", time: 0.9 },
  { text: "um you know like", time: 1.2, isFiller: true },
  { text: "the exact strategy", time: 1.8 },
  { text: "that blew up", time: 2.3, highlight: true },
  { text: "my Instagram reach", time: 2.8 },
  { text: "basically...", time: 3.4, isFiller: true },
  { text: "in just seven days.", time: 4.1 },
];

export function ScriptTrimmerSection() {
  const [deletedWords, setDeletedWords] = useState<number[]>([5, 9]);

  const toggleWordCut = (index: number) => {
    if (deletedWords.includes(index)) {
      setDeletedWords(deletedWords.filter((i) => i !== index));
    } else {
      setDeletedWords([...deletedWords, index]);
    }
  };

  const calculatedSecondsSaved = (deletedWords.length * 0.9).toFixed(1);

  return (
    <section className="px-6 pt-[140px] max-w-6xl mx-auto" id="features">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
          TRANSCRIPT-DRIVEN SURGERY
        </span>
        <h2 className="font-black text-3xl sm:text-5xl tracking-tight text-white mt-4 mb-4">
          Bring raw footage to life with <span className="text-amber-400">one script</span>.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg">
          Click any word to strike it through. Deleting words automatically slices the underlying video segment with zero keyframe struggle.
        </p>
      </div>

      {/* Interactive Document Box */}
      <div className="p-8 rounded-3xl bg-zinc-900/70 border border-zinc-800 shadow-2xl relative overflow-hidden mb-12">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800 text-xs text-zinc-400">
          <span className="font-mono">Script Timeline • 00:00 - 00:32</span>
          <span className="text-amber-400 font-semibold">Try clicking words below to cut:</span>
        </div>

        <div className="text-zinc-200 text-base sm:text-lg flex flex-wrap gap-2 items-center leading-relaxed font-mono">
          {transcriptWords.map((item, idx) => {
            const isCut = deletedWords.includes(idx);
            return (
              <span
                key={idx}
                onClick={() => toggleWordCut(idx)}
                className={`cursor-pointer px-2 py-0.5 rounded transition-all select-none ${
                  isCut
                    ? "line-through text-rose-400 bg-rose-500/15 border border-rose-500/30 font-bold"
                    : item.highlight
                    ? "bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40"
                    : "hover:bg-zinc-800"
                }`}
                title={isCut ? "Click to restore word" : "Click to slice from video"}
              >
                {item.text}
              </span>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <Scissors className="h-4 w-4" />
            <span>
              {deletedWords.length} filler phrases trimmed ({calculatedSecondsSaved}s saved)
            </span>
          </div>
          <span className="text-violet-400 font-semibold font-mono">1-Click Auto-Synchronized</span>
        </div>
      </div>

      {/* 4-Card Subgrid (Vidyst-Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
          <Globe className="h-6 w-6 text-violet-400 mb-2" />
          <h4 className="font-bold text-sm text-white mb-1">Direct S3 Chunking</h4>
          <p className="text-xs text-zinc-400">
            Uploads in 5MB slices. Survives spotty mobile connections with zero re-upload friction.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
          <Scissors className="h-6 w-6 text-rose-400 mb-2" />
          <h4 className="font-bold text-sm text-white mb-1">Microfade Slices</h4>
          <p className="text-xs text-zinc-400">
            5ms audio zero-crossing microfades so cuts never click or sound abrupt.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
          <Type className="h-6 w-6 text-amber-400 mb-2" />
          <h4 className="font-bold text-sm text-white mb-1">Hormozi Kinetic Text</h4>
          <p className="text-xs text-zinc-400">
            Dynamic bouncing subtitles with high-contrast borders and keyword glow.
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
          <Volume2 className="h-6 w-6 text-emerald-400 mb-2" />
          <h4 className="font-bold text-sm text-white mb-1">Speech Auto-Ducking</h4>
          <p className="text-xs text-zinc-400">
            Attenuates background beats by -18dB whenever speech is detected.
          </p>
        </div>
      </div>
    </section>
  );
}
