"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    q: "Do I need a VPN or modified APK to use VibeCut in India?",
    a: "No! VibeCut AI is 100% browser-based. It runs natively in Chrome, Safari, or Brave on both mobile and desktop without any VPNs, third-party APK downloads, or security risks.",
  },
  {
    q: "Can I edit and export directly from a budget Android smartphone?",
    a: "Yes. Our hybrid cloud architecture uploads your video in resilient 5MB chunks to AWS S3 and renders the final video on high-speed cloud workers. Your phone never overheats or runs out of RAM.",
  },
  {
    q: "How does the ₹99 Creator Day Pass work via UPI?",
    a: "When you have a batch of videos to edit (e.g. over the weekend), pay ₹99 using any UPI app (GPay, PhonePe, Paytm). You get instant, unlimited 1080p exports with zero watermarks for a full 24 hours.",
  },
  {
    q: "Does it support code-mixed Hinglish and regional Indian languages?",
    a: "Yes. Powered by Groq's whisper-large-v3, VibeCut handles English, Hindi, Hinglish, Tamil, and Telugu with native accuracy, correctly spelling local idioms and colloquial phrases.",
  },
  {
    q: "How does the Silence Surgery work?",
    a: "The AI scans your audio waveform to detect awkward pauses (>0.4s) and filler words. It slices them out using 5ms audio zero-crossing microfades so speech transitions sound completely natural and smooth.",
  },
  {
    q: "What happens if my internet connection drops during video upload?",
    a: "We use S3 Multipart Chunking. Your video is sliced into 5MB chunks. If your connection flickers, only the failed 5MB chunk auto-retries—you never have to restart a 150MB upload from zero.",
  },
];

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section className="px-6 pt-[140px] max-w-4xl mx-auto" id="faq">
      <div className="mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-violet-400 font-mono">FAQ</span>
        <h2 className="font-black text-3xl sm:text-5xl tracking-tight text-white mt-2 mb-2">
          Questions.
        </h2>
        <p className="text-zinc-400 text-sm sm:text-base">
          Everything you need to know before exporting your first viral short. Still have questions? Write to us at support@vibecut.ai.
        </p>
      </div>

      <div className="divide-y divide-zinc-800 border-y border-zinc-800">
        {faqs.map((faq, idx) => {
          const isOpen = openFaq === idx;
          const numStr = `0${idx + 1}`;
          return (
            <div key={idx} className="py-6">
              <button
                onClick={() => setOpenFaq(isOpen ? null : idx)}
                className="w-full flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm font-bold text-violet-400">{numStr}</span>
                  <span className="font-bold text-base sm:text-lg text-white group-hover:text-amber-400 transition-colors">
                    {faq.q}
                  </span>
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-zinc-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-amber-400" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="pt-4 pl-9 text-zinc-400 text-sm sm:text-base leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
