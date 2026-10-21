"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  LogOut,
  Video,
  Sparkles,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface UserNavProps {
  onOpenCheckout?: (plan: string) => void;
}

export function UserNav({ onOpenCheckout }: UserNavProps) {
  const { user, loading, signOut, openAuthModal, isMockMode } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="h-8 w-20 bg-zinc-900 animate-pulse rounded-full border border-zinc-800" />
    );
  }

  // 1. Authenticated State
  if (user) {
    const userEmail = user.email || "creator@vibecut.ai";
    const initial = (
      user.user_metadata?.full_name?.[0] ||
      userEmail[0] ||
      "C"
    ).toUpperCase();
    const displayName =
      user.user_metadata?.full_name || userEmail.split("@")[0];

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all text-left cursor-pointer group"
        >
          {/* Avatar / Initial */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
            {initial}
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate max-w-[120px]">
              {displayName}
            </span>
            <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">
              {isMockMode ? "⚡ Demo Account" : userEmail}
            </span>
          </div>

          <ChevronDown
            className={`h-3.5 w-3.5 text-zinc-400 group-hover:text-white transition-transform duration-200 ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-zinc-950/95 border border-zinc-800 shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header info */}
            <div className="px-3 py-2.5 border-b border-zinc-800/80 mb-1">
              <p className="text-xs font-bold text-white truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-zinc-400 truncate">{userEmail}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                  <ShieldCheck className="h-3 w-3" />
                  Creator Tier
                </span>
                {isMockMode && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    DEMO
                  </span>
                )}
              </div>
            </div>

            {/* Menu Links */}
            <Link
              href="/projects"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors"
            >
              <Video className="h-4 w-4 text-violet-400" />
              <span>My Video Projects</span>
            </Link>

            <button
              onClick={() => {
                setDropdownOpen(false);
                if (onOpenCheckout) {
                  onOpenCheckout("₹99 Creator Day Pass");
                } else {
                  const el = document.getElementById("pricing");
                  el?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-400/10 rounded-xl transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Upgrade / Day Pass</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-zinc-950">
                ₹99
              </span>
            </button>

            <div className="my-1 border-t border-zinc-800/80" />

            <button
              onClick={async () => {
                setDropdownOpen(false);
                await signOut();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. Unauthenticated / Guest State
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Sign In Trigger */}
      <button
        onClick={() => openAuthModal("signin")}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-all cursor-pointer"
      >
        Sign In
      </button>

      {/* Open Studio / Projects CTA */}
      <Link
        href="/projects"
        className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-violet-600/25 transition-all active:scale-95"
      >
        <Zap className="h-3 w-3 text-amber-300 fill-amber-300" />
        <span>Open Projects</span>
        <ArrowRight className="h-3 w-3 hidden sm:inline" />
      </Link>
    </div>
  );
}
