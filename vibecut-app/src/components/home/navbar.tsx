"use client";

import React from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { UserNav } from "@/components/auth/user-nav";
import { AuthModal } from "@/components/auth/auth-modal";

interface NavbarProps {
  onOpenCheckout: (plan: string) => void;
}

export function Navbar({ onOpenCheckout }: NavbarProps) {
  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-800/60 w-full">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-violet-500/40 shadow-inner group-hover:scale-105 transition-transform">
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
            </div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              VibeCut{" "}
              <span className="text-violet-400 font-extrabold text-xs uppercase px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">
                AI
              </span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/studio" className="text-zinc-200 hover:text-white font-semibold transition-colors flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span>Studio</span>
            </Link>
            <a href="#dual-format" className="text-zinc-400 hover:text-white font-medium transition-colors">
              Dual Format
            </a>
            <a href="#features" className="text-zinc-400 hover:text-white font-medium transition-colors">
              Features
            </a>
            <a href="#categories" className="text-zinc-400 hover:text-white font-medium transition-colors">
              For Creators
            </a>
            <a href="#pricing" className="text-zinc-400 hover:text-white font-medium transition-colors flex items-center gap-1.5">
              <span>Pricing</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-zinc-950 tracking-wider">
                ₹99 PASS
              </span>
            </a>
            <a href="#faq" className="text-zinc-400 hover:text-white font-medium transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action CTAs & Auth User Nav */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenCheckout("₹99 Creator Day Pass")}
              className="hidden lg:inline-flex text-xs font-semibold px-3 py-1.5 rounded-lg text-amber-300 bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 transition-all cursor-pointer"
            >
              Get Day Pass
            </button>
            <UserNav onOpenCheckout={onOpenCheckout} />
          </div>
        </div>
      </header>

      {/* Auth Modal Mounted Globally */}
      <AuthModal />
    </>
  );
}
