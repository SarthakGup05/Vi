"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  {
    title: "Solo Reelers",
    hook: "Talking-head videos made effortless.",
    desc: "Record once on your phone. Let AI strip pauses, center your face, and burn viral Hormozi captions in under a minute.",
    stat: "+320% Retention",
    caption: "THIS ONE HABIT CHANGED MY CAREER 🚀",
  },
  {
    title: "Tech Educators",
    hook: "Code walkthroughs & software tutorials.",
    desc: "Perfect Hinglish & technical vocabulary recognition. Accurately transcribes Python, React, and dev jargon without weird typos.",
    stat: "100% Hinglish Accuracy",
    caption: "NEVER USE USEEFFECT LIKE THIS 🛑",
  },
  {
    title: "Finance & Crypto",
    hook: "Numbers, charts, and high-stakes advice.",
    desc: "Automated cash register sound effects, bold numerical callouts, and clean minimalist card overlays to build authority.",
    stat: "4.9/5 Trust Score",
    caption: "₹10,000 SIP IN 2026 WILL BE WORTH... 📈",
  },
  {
    title: "Podcasts & Interviews",
    hook: "Multi-speaker cutdowns from long episodes.",
    desc: "Drop a 45-minute raw recording. AI extracts the highest-energy 60-second clips, auto-ducks background music, and exports vertical clips.",
    stat: "15 Viral Clips / Ep",
    caption: "THE SECRET NO BILLIONAIRE TELLS YOU 🧠",
  },
  {
    title: "Fitness & Lifestyle",
    hook: "High-bpm hype pacing with beat drops.",
    desc: "Fast cuts on movement, dynamic punch zooms on reps, and energetic neon subtitle pop-outs to stop fast scrollers.",
    stat: "2.4M Avg Views",
    caption: "3 MOVES TO FIX YOUR POSTURE TODAY 💪",
  },
];

export function CreatorCategoriesSection() {
  const [activeCategoryTab, setActiveCategoryTab] = useState<number>(0);

  return (
    <section className="px-6 pt-[140px] max-w-6xl mx-auto" id="categories">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
          PERSONA SHOWCASES
        </span>
        <h2 className="font-black text-3xl sm:text-5xl tracking-tight text-white mt-4 mb-4">
          Made for every kind of <span className="text-violet-400">creator</span>.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg">
          Switch categories to see how VibeCut adapts pacing, captions, and sound effects to your niche.
        </p>
      </div>

      {/* Vidyst-Style Horizontal Pill Tabs */}
      <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
        {categories.map((cat, idx) => (
          <button
            key={cat.title}
            onClick={() => setActiveCategoryTab(idx)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeCategoryTab === idx
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30 scale-105"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* Active Tab Showcase Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategoryTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
        >
          <div className="md:col-span-7 space-y-4">
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
              {categories[activeCategoryTab].stat}
            </span>
            <h3 className="font-black text-2xl sm:text-3xl text-white">
              {categories[activeCategoryTab].hook}
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              {categories[activeCategoryTab].desc}
            </p>
          </div>

          <div className="md:col-span-5 flex justify-center">
            <div className="w-[220px] aspect-[9/16] rounded-2xl bg-black border-2 border-zinc-800 p-3 flex flex-col justify-between shadow-2xl relative">
              <div className="text-[10px] font-mono text-zinc-500 text-center">9:16 PREVIEW</div>
              <div className="text-center font-black text-xs uppercase bg-amber-400 text-zinc-950 px-2 py-1.5 rounded shadow">
                {categories[activeCategoryTab].caption}
              </div>
              <div className="h-1 w-full bg-violet-500 rounded-full" />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
