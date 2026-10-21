"use client";

import React from "react";
import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";

interface CtaBannerSectionProps {
  onOpenCheckout: (plan: string) => void;
}

export function CtaBannerSection({ onOpenCheckout }: CtaBannerSectionProps) {
  return (
    <section className="px-6 pt-[140px] pb-24 max-w-6xl mx-auto">
      <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-8 sm:p-14 border border-zinc-800 text-center relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <Zap className="h-10 w-10 text-amber-400 fill-amber-400 mx-auto mb-3" />
          <h2 className="font-black text-3xl sm:text-5xl tracking-tight text-white mb-4">
            Your audience is everywhere. <br />
            Now, so are you.
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg mb-8">
            Drop your raw phone footage, let AI strip the silence and burn viral captions, and export wide and tall in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/projects">
              <MovingBorderButton
                duration={3000}
                className="px-8 py-4 bg-violet-600 hover:bg-violet-500 font-bold text-base shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>Start Editing Free in Browser</span>
                <ArrowRight className="h-4 w-4" />
              </MovingBorderButton>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
