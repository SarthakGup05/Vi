"use client";

import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 py-12 w-full">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-1.5">
          <Link href="/" className="text-lg font-black text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span>VibeCut AI</span>
          </Link>
          <p className="text-zinc-500 text-xs">
            © 2026 VibeCut AI. The smartest way to edit viral shorts in India.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-zinc-400">
          <a href="#dual-format" className="hover:text-white transition-colors">
            Dual Format
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Silence Surgery
          </a>
          <a href="#categories" className="hover:text-white transition-colors">
            Categories
          </a>
          <a href="#pricing" className="hover:text-white transition-colors">
            Pricing (₹99 Pass)
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            Questions
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}
