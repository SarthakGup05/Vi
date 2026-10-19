"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Flame,
  ArrowRight,
  Play,
  CheckCircle2,
  Scissors,
  FileText,
  Type,
  Sparkles,
  Music,
  Star,
  ShieldCheck,
  Check,
  X,
  Volume2,
  Smartphone,
  Heart,
  MessageCircle,
  Share2,
  QrCode
} from "lucide-react";

import { Spotlight } from "@/components/ui/spotlight";
import { FlipWords } from "@/components/ui/flip-words";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { Button as MovingBorderButton } from "@/components/ui/moving-border";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { BackgroundTexture } from "@/components/ui/background-texture";

export default function HomePage() {
  // Interactive Transcript State for "Edit Like a Doc" Card
  const [deletedWords, setDeletedWords] = useState<number[]>([5, 9]);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("₹99 Creator Day Pass");
  const [demoVideoOpen, setDemoVideoOpen] = useState<boolean>(false);
  const [activeCaptionIdx, setActiveCaptionIdx] = useState<number>(1);

  // Rotating words for FlipWords hero
  const heroWords = ["Viral Reels", "100K Views", "Kinetic Shorts", "Trending Videos"];

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

  const testimonials = [
    {
      quote: "The Hinglish subtitle engine alone is worth 10x the price. It gets Hindi slang and English technical terms perfectly without awkward misspellings.",
      name: "Rohan Verma",
      title: "Tech Creator • @rohanbuilds",
      views: "+1.4M Views",
    },
    {
      quote: "I used to spend 2 hours cutting dead silences and adding Hormozi yellow captions in Premiere Pro. Now I do it in 90 seconds while drinking chai.",
      name: "Pooja Sharma",
      title: "Finance & Career • 450K IG",
      views: "+850K Reach",
    },
    {
      quote: "The ₹99 Day Pass is genius. When our agency has a batch of 15 client shorts to pump out on Sunday, we activate the pass and export everything.",
      name: "Kabir Nair",
      title: "Growth Studio Founder",
      views: "Agency Tier",
    },
    {
      quote: "Zero VPN hassle. Zero modified APK crashes. This is exactly what the Indian creator community needed after CapCut got banned.",
      name: "Ananya Iyer",
      title: "Lifestyle Vlogger • 220K YT",
      views: "+2.1M Views",
    },
  ];

  const toggleWordCut = (index: number) => {
    if (deletedWords.includes(index)) {
      setDeletedWords(deletedWords.filter((i) => i !== index));
    } else {
      setDeletedWords([...deletedWords, index]);
    }
  };

  const calculatedSecondsSaved = (deletedWords.length * 0.9).toFixed(1);

  return (
    <BackgroundTexture className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col relative selection:bg-violet-600/30 selection:text-violet-200">
      
      {/* Clipped Background Spotlight & Ambient Glow Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <Spotlight
          className="-top-40 left-0 md:left-60 md:-top-20"
          fill="#8b5cf6"
        />
        <Spotlight
          className="top-1/3 right-0 md:right-40"
          fill="#facc15"
        />
      </div>

      {/* 1. Sticky Glassmorphic Navbar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-800/60 w-full transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center border border-violet-500/40 shadow-inner group-hover:scale-105 transition-transform">
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
            </div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              VibeCut <span className="text-violet-400 font-extrabold text-xs uppercase px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20">AI</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#features" className="text-zinc-400 hover:text-white font-medium transition-colors">Features</a>
            <a href="#how-it-works" className="text-zinc-400 hover:text-white font-medium transition-colors">How It Works</a>
            <a href="#pricing" className="text-zinc-400 hover:text-white font-medium transition-colors flex items-center gap-1.5">
              <span>Pricing</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-zinc-950 tracking-wider">
                ₹99 PASS
              </span>
            </a>
            <a href="#wall-of-fame" className="text-zinc-400 hover:text-white font-medium transition-colors">Wall of Fame</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedPlan("₹99 Creator Day Pass");
                setShowCheckoutModal(true);
              }}
              className="hidden sm:inline-flex text-xs font-semibold px-3 py-1.5 rounded-lg text-amber-300 bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/20 transition-all"
            >
              Get Day Pass
            </button>
            <a
              href="#pricing"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all active:scale-95"
            >
              <span>Start Free</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 pt-28">

        {/* 2. Hero Section with Aceternity FlipWords */}
        <section className="max-w-7xl mx-auto px-6 pt-4 pb-20 relative">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            
            {/* Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-violet-500/30 text-xs font-medium text-zinc-300 mb-6 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              <span className="font-semibold text-white">⚡ Built for the Creator Economy</span>
              <span className="text-zinc-600">•</span>
              <span className="text-amber-400 font-bold">No VPN Required</span>
            </motion.div>

            {/* High-Impact Headline with Aceternity FlipWords */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-black text-4xl sm:text-6xl md:text-7xl tracking-tight text-white leading-[1.1] mb-6"
            >
              Turn Raw Videos into <br className="hidden sm:inline" />
              <FlipWords words={heroWords} duration={2400} />
              <br className="hidden sm:inline" />
              in 60 Seconds
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-8"
            >
              Auto-strip awkward silences, generate dynamic kinetic captions in Hinglish &amp; English, and edit like a Google Doc with zero editing skills.
            </motion.p>

            {/* Dual CTAs with Aceternity MovingBorder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-6"
            >
              <MovingBorderButton
                onClick={() => {
                  setSelectedPlan("₹99 Creator Day Pass");
                  setShowCheckoutModal(true);
                }}
                duration={3500}
                className="px-8 py-3.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-rose-600 font-bold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-violet-600/30 active:scale-95 transition-all"
              >
                <Flame className="h-5 w-5 text-amber-300 fill-amber-300" />
                <span>Start Editing Free</span>
                <ArrowRight className="h-4 w-4" />
              </MovingBorderButton>

              <button
                onClick={() => setDemoVideoOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-zinc-900/90 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-semibold text-base flex items-center justify-center gap-2 backdrop-blur-md active:scale-95 transition-all duration-200"
              >
                <Play className="h-4 w-4 text-violet-400 fill-violet-400" />
                <span>Watch 30s Interactive Demo</span>
              </button>
            </motion.div>

            {/* Micro-Copy Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-zinc-500">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" /> No credit card required
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" /> Instant UPI checkout available
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" /> Export in 4K
              </span>
            </div>
          </div>

          {/* Hero Mockup: 3D Interactive 9:16 Vertical Smartphone Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-14 relative max-w-4xl mx-auto flex justify-center items-center"
          >
            {/* Ambient Back Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/30 to-amber-500/20 rounded-3xl blur-2xl -z-10" />

            {/* Floating Left Badge: Silence Cut Metric */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="hidden lg:flex absolute left-4 top-1/4 -translate-y-1/2 p-3.5 rounded-2xl bg-zinc-900/95 border border-zinc-800 backdrop-blur-xl shadow-2xl flex-col gap-1.5 max-w-[210px]"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                <Scissors className="h-4 w-4" />
                <span>Silence Surgery</span>
              </div>
              <p className="text-[11px] text-zinc-400">Slices 3.2s awkward pause at 00:04.12 cleanly</p>
              <div className="flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded text-[10px] font-mono text-rose-300 font-bold">
                <span>-3.20s DEAD AIR TRIMMED</span>
              </div>
            </motion.div>

            {/* Floating Right Badge: Retention Score */}
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
              className="hidden lg:flex absolute right-4 top-1/3 p-3.5 rounded-2xl bg-zinc-900/95 border border-amber-500/30 backdrop-blur-xl shadow-2xl flex-col gap-1 max-w-[200px]"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Reel Retention</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400/20 text-amber-300 font-black">+42%</span>
              </div>
              <div className="text-2xl font-black text-amber-400">94%</div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-amber-400 h-full rounded-full w-[94%]" />
              </div>
              <span className="text-[10px] text-zinc-500 mt-0.5">Top 1% viral pacing tier</span>
            </motion.div>

            {/* 9:16 Smartphone Mockup Frame */}
            <div className="relative w-[300px] sm:w-[320px] aspect-[9/19] rounded-[44px] p-2.5 bg-gradient-to-b from-[#2d2d35] via-[#1a1a20] to-[#101013] shadow-2xl border-2 border-zinc-700/60 hover:scale-[1.01] transition-transform duration-300">
              <div className="relative w-full h-full rounded-[36px] overflow-hidden bg-zinc-950 flex flex-col justify-between border border-zinc-800/80">
                
                {/* Simulated Creator Video Frame */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/70 via-zinc-900 to-black flex items-center justify-center overflow-hidden">
                  <div className="w-48 h-48 rounded-full bg-violet-600/35 blur-3xl absolute -top-10" />
                  <div className="w-32 h-32 rounded-full bg-amber-400/25 blur-2xl absolute bottom-10" />
                  <div className="text-center p-4 z-0 opacity-40">
                    <Smartphone className="h-16 w-16 mx-auto text-zinc-600 mb-2 stroke-1" />
                    <span className="text-xs font-mono text-zinc-500">9:16 VIRAL REEL</span>
                  </div>
                </div>

                {/* Top Notch / Status Bar */}
                <div className="relative z-10 pt-3 px-6 flex items-center justify-between text-[11px] text-white/70 font-mono">
                  <span>9:41</span>
                  <div className="w-16 h-4 bg-black/80 rounded-full border border-white/10" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs">5G</span>
                  </div>
                </div>

                {/* Top AI Processing Chip */}
                <div className="relative z-10 px-3 pt-2">
                  <div className="mx-auto bg-zinc-900/85 backdrop-blur-md border border-violet-500/40 px-3 py-1 rounded-full text-[10px] font-semibold text-violet-300 flex items-center gap-1.5 justify-center shadow-lg">
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>AI Auto-Captions Hinglish: Active</span>
                  </div>
                </div>

                {/* Kinetic Hormozi Subtitles with Animated Pop */}
                <div className="relative z-10 pb-8 px-4 flex flex-col items-center text-center">
                  <div className="text-[10px] font-extrabold tracking-widest text-zinc-400 uppercase mb-1 drop-shadow-md">
                    VIRAL SUBTITLE PREVIEW
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 text-base sm:text-lg font-black tracking-tight leading-none uppercase">
                    <span className="bg-black/80 px-2 py-1 rounded text-white drop-shadow [text-shadow:_2px_2px_0_rgb(0_0_0)]">
                      THIS ONE
                    </span>
                    <motion.span
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="bg-amber-400 text-zinc-950 px-2.5 py-1 rounded rotate-[-2deg] shadow-lg font-black"
                    >
                      SIMPLE TRICK 🚀
                    </motion.span>
                  </div>
                  <span className="text-xs font-black text-white drop-shadow-md mt-1 tracking-wider bg-black/60 px-2 py-0.5 rounded">
                    DOUBLED MY REACH
                  </span>

                  {/* Social Engagement Right Rail */}
                  <div className="absolute right-2 bottom-12 flex flex-col items-center gap-3 text-white/90">
                    <div className="flex flex-col items-center">
                      <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                      <span className="text-[9px] font-bold">124K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-[9px] font-bold">1.8K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Share2 className="h-5 w-5" />
                      <span className="text-[9px] font-bold">28K</span>
                    </div>
                  </div>
                </div>

                {/* Video Timeline Audio Waveform Scrubber */}
                <div className="relative z-10 p-3 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 flex items-center gap-2">
                  <Play className="h-3.5 w-3.5 text-violet-400 fill-violet-400" />
                  <div className="flex-1 flex items-center gap-0.5 h-4">
                    <div className="w-1 bg-violet-500 h-3 rounded-full" />
                    <div className="w-1 bg-violet-500 h-4 rounded-full" />
                    <div className="w-1 bg-amber-400 h-2.5 rounded-full" />
                    <div className="w-1 bg-zinc-700 h-1 rounded-full opacity-30" />
                    <div className="w-1 bg-zinc-700 h-1 rounded-full opacity-30" />
                    <div className="w-1 bg-violet-500 h-4 rounded-full" />
                    <div className="w-1 bg-violet-500 h-3 rounded-full" />
                    <div className="w-1 bg-violet-500 h-2 rounded-full" />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400">0:14 / 0:58</span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. Social Proof & Metrics Strip */}
        <section className="border-y border-zinc-800/80 bg-zinc-900/40 py-12">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400 mb-8">
              TRUSTED BY 10,000+ CREATORS ACROSS YOUTUBE SHORTS &amp; INSTAGRAM REELS
            </p>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-violet-500/40 transition-colors">
                <div className="font-black text-3xl sm:text-4xl text-white mb-1">3.2M+</div>
                <div className="text-xs sm:text-sm text-zinc-400 font-medium">Reels Exported</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-violet-500/40 transition-colors">
                <div className="font-black text-3xl sm:text-4xl text-violet-400 mb-1">80%</div>
                <div className="text-xs sm:text-sm text-zinc-400 font-medium">Faster Editing Time</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-amber-400/40 transition-colors">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="font-black text-3xl sm:text-4xl text-amber-400">4.9/5</span>
                </div>
                <div className="flex items-center justify-center gap-0.5 text-amber-400 text-xs mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="text-xs text-zinc-400 font-medium">1,800+ Creator Reviews</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 hover:border-amber-400/40 transition-colors">
                <div className="font-black text-3xl sm:text-4xl text-amber-400 mb-1">100%</div>
                <div className="text-xs sm:text-sm text-zinc-400 font-medium">Hinglish &amp; Hindi Accuracy</div>
              </div>
            </div>

            {/* Creator Avatar Pill Bar */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-400">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white">AK</div>
                <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">RV</div>
                <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-amber-500 flex items-center justify-center text-[10px] font-bold text-zinc-950">PS</div>
                <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-200">+2k</div>
              </div>
              <span className="font-medium text-zinc-400">Used by creators from Bangalore, Delhi, Mumbai, and beyond.</span>
            </div>
          </div>
        </section>

        {/* 4. Bento Grid with Aceternity CardSpotlight */}
        <section className="max-w-7xl mx-auto px-6 py-24" id="features">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-400 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen Editor Suite</span>
            </div>
            <h2 className="font-extrabold text-3xl sm:text-5xl tracking-tight text-white mb-4">
              Everything You Need to Dominate the Feed
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg">
              Hover over any card to reveal interactive highlights. Edit through smart transcripts, prompt your AI editor, and export in seconds.
            </p>
          </div>

          {/* Bento Grid with Aceternity CardSpotlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 (Span 2): Edit Like a Doc Transcript Editor */}
            <CardSpotlight
              color="#8b5cf6"
              className="md:col-span-2 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                  <FileText className="h-5 w-5" />
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 text-violet-400 font-semibold">
                  TRANSCRIPT-SYNC v2.4
                </span>
              </div>
              <h3 className="font-bold text-2xl text-white mb-2">Edit Like a Doc</h3>
              <p className="text-zinc-400 text-sm mb-6 max-w-lg">
                Click any word below to strike it through. Deleting words automatically slices that exact millisecond from the final video timeline.
              </p>

              {/* Interactive Transcript Mockup Box */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 font-mono text-sm leading-relaxed">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800/60 text-xs text-zinc-400">
                  <span>Transcript • 00:00 - 00:32</span>
                  <span className="text-amber-400 font-medium">Click words to test slicing</span>
                </div>
                <div className="text-zinc-200 flex flex-wrap gap-1.5 items-center">
                  {transcriptWords.map((item, idx) => {
                    const isCut = deletedWords.includes(idx);
                    return (
                      <span
                        key={idx}
                        onClick={() => toggleWordCut(idx)}
                        className={`cursor-pointer px-1.5 py-0.5 rounded transition-all select-none ${
                          isCut
                            ? "line-through text-rose-400 bg-rose-500/10 border border-rose-500/20"
                            : item.highlight
                            ? "bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30"
                            : "hover:bg-zinc-800"
                        }`}
                        title={isCut ? "Click to restore word" : "Click to slice from video"}
                      >
                        {item.text}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                    <Scissors className="h-3.5 w-3.5" />
                    <span>{deletedWords.length} filler phrases trimmed ({calculatedSecondsSaved}s saved)</span>
                  </div>
                  <span className="text-violet-400 font-semibold">1-Click Auto-Synchronized</span>
                </div>
              </div>
            </CardSpotlight>

            {/* Card 2: Hormozi Kinetic Captions */}
            <CardSpotlight
              color="#facc15"
              className="relative flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-4">
                  <Type className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-xl text-white mb-2">Hormozi Kinetic Captions</h3>
                <p className="text-zinc-400 text-sm mb-6">
                  Captivate fast scrollers with dynamic word-by-word bounce animation, customizable neon highlights, and auto-inserted trending emojis in Hinglish &amp; English.
                </p>
              </div>

              {/* Dynamic Caption Preview */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col items-center justify-center text-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Style: Hormozi Pop Neon</span>
                <div className="flex items-center gap-1 font-black text-sm uppercase">
                  <span className="text-white">STOP</span>
                  <span className="bg-amber-400 text-zinc-950 px-2 py-0.5 rounded shadow">MAKING</span>
                  <span className="text-violet-400">BORING</span>
                  <span className="text-white">REELS 🥱</span>
                </div>
              </div>
            </CardSpotlight>

            {/* Card 3: Smart Silence Surgery */}
            <CardSpotlight
              color="#f43f5e"
              className="relative"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                <Scissors className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Silence Surgery</h3>
              <p className="text-zinc-400 text-sm mb-5">
                AI detects dead air, awkward breathing, and micro-pauses (&gt;0.4s) and removes them seamlessly with smooth audio zero-crossing microfades.
              </p>
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Threshold: 0.4s</span>
                  <span className="text-rose-400 font-bold">14 Cuts Detected</span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                  <div className="w-[20%] bg-violet-500 h-full" />
                  <div className="w-[6%] bg-rose-500 h-full" />
                  <div className="w-[30%] bg-violet-500 h-full" />
                  <div className="w-[8%] bg-rose-500 h-full" />
                  <div className="w-[36%] bg-violet-500 h-full" />
                </div>
              </div>
            </CardSpotlight>

            {/* Card 4: Prompt-to-Edit Copilot */}
            <CardSpotlight
              color="#8b5cf6"
              className="relative"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Prompt Copilot</h3>
              <p className="text-zinc-400 text-sm mb-5">
                Command your video editor like an agency assistant. Simply type instructions in plain English or Hinglish to mutate cuts and punch zooms.
              </p>
              <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center gap-2 text-xs font-mono text-zinc-300">
                <span className="text-violet-400 font-bold">&gt;</span>
                <span className="truncate text-white">"Add zoom punch-in on every hook"</span>
                <span className="ml-auto px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[10px] font-bold">ENTER</span>
              </div>
            </CardSpotlight>

            {/* Card 5: Smart Audio Ducking & SFX */}
            <CardSpotlight
              color="#facc15"
              className="relative"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 mb-4">
                <Music className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-xl text-white mb-2">Smart Ducking &amp; SFX</h3>
              <p className="text-zinc-400 text-sm mb-5">
                Automatically lowers trending background music volume whenever you speak, and layers viral whoosh and pop sound effects on keywords.
              </p>
              <div className="flex items-center justify-between text-xs p-2.5 bg-zinc-950 rounded-xl border border-zinc-800">
                <span className="flex items-center gap-1.5 text-zinc-200">
                  <Volume2 className="h-4 w-4 text-amber-400" /> Auto-Ducking
                </span>
                <span className="text-violet-400 font-bold">Enabled (-14dB)</span>
              </div>
            </CardSpotlight>

          </div>
        </section>

        {/* 5. High-Converting Pricing Table with Aceternity MovingBorder */}
        <section className="max-w-7xl mx-auto px-6 py-20 relative" id="pricing">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-xs font-bold text-amber-400 mb-3">
              <Zap className="h-3.5 w-3.5 fill-amber-400" />
              <span>India-First Pricing • Instant UPI Support</span>
            </div>
            <h2 className="font-extrabold text-3xl sm:text-5xl tracking-tight text-white mb-4">
              Simple, Creator-Friendly Pricing
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg">
              No mandatory long-term commitments. Grab a ₹99 24-hour pass when you have a batch to edit, or unlock full unlimited Pro monthly.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            
            {/* Plan 1: Free Hook */}
            <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Free Starter</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="font-black text-4xl text-white">₹0</span>
                  <span className="text-zinc-400 text-sm">/ forever</span>
                </div>
                <p className="text-zinc-400 text-sm mb-6">
                  Perfect for testing the AI auto-captions and silence trimmer on your raw footage.
                </p>
                <ul className="space-y-3 text-sm text-zinc-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-400 shrink-0" />
                    <span>3 exports per month</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-400 shrink-0" />
                    <span>720p HD resolution</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-400 shrink-0" />
                    <span>Standard kinetic captions</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-400 shrink-0" />
                    <span>Up to 5 min video uploads</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-zinc-400">
                    <X className="h-4 w-4 shrink-0" />
                    <span>Small VibeCut watermark</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setSelectedPlan("Free Starter");
                  setShowCheckoutModal(true);
                }}
                className="w-full py-3.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm text-center block transition-all"
              >
                Get Started Free
              </button>
            </div>

            {/* Plan 2: Creator Day Pass (Featured / Aceternity Glow Border) */}
            <div className="relative p-[2px] rounded-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-rose-500 to-violet-600 rounded-3xl animate-pulse" />
              
              <div className="relative p-8 rounded-3xl bg-zinc-950 flex flex-col justify-between h-full">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider shadow">
                  MOST POPULAR FOR CREATORS 🔥
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2 mt-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Creator Day Pass</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">24 HOURS</span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="font-black text-5xl text-amber-400">₹99</span>
                    <span className="text-zinc-400 text-sm">/ 24 Hours Pass</span>
                  </div>
                  <p className="text-zinc-300 text-sm mb-6">
                    Batch edit an entire week's worth of Reels in a single power session with zero limits.
                  </p>
                  <ul className="space-y-3 text-sm text-white mb-8">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="font-semibold">Unlimited exports for 24 hours</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>1080p 60fps Full HD • No watermark</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Hormozi kinetic captions + emoji engine</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Silence surgery audio trimmer</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>Instant UPI &amp; QR scan checkout</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setSelectedPlan("₹99 Creator Day Pass");
                    setShowCheckoutModal(true);
                  }}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-sm text-center block shadow-lg transition-all active:scale-95"
                >
                  Grab 24h Pass for ₹99
                </button>
              </div>
            </div>

            {/* Plan 3: Pro Monthly */}
            <div className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Pro Monthly</div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="font-black text-4xl text-white">₹799</span>
                  <span className="text-zinc-400 text-sm">/ month</span>
                </div>
                <p className="text-zinc-400 text-sm mb-6">
                  For active daily creators, agency editors, and brands publishing 20+ short videos/mo.
                </p>
                <ul className="space-y-3 text-sm text-zinc-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-400 shrink-0" />
                    <span className="text-white">Unlimited 4K HDR exports</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-400 shrink-0" />
                    <span>Upload custom brand fonts &amp; color presets</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-400 shrink-0" />
                    <span>Prompt Copilot assistant</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-400 shrink-0" />
                    <span>Priority fast-lane GPU rendering queue</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-violet-400 shrink-0" />
                    <span>Up to 60-minute long form video imports</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  setSelectedPlan("₹799 Pro Monthly");
                  setShowCheckoutModal(true);
                }}
                className="w-full py-3.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm text-center block transition-all"
              >
                Go Pro Monthly
              </button>
            </div>

          </div>

          {/* Trust Row Below Pricing */}
          <div className="mt-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2 flex-wrap">
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span>Instant UPI, Google Pay, PhonePe, Paytm, and Indian/International Cards supported • Cancel anytime</span>
          </div>
        </section>

        {/* 6. Testimonials with Aceternity InfiniteMovingCards */}
        <section className="py-20 border-t border-zinc-800/80 overflow-hidden" id="wall-of-fame">
          <div className="text-center max-w-2xl mx-auto mb-14 px-6">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-semibold mb-3">
              <Star className="h-3.5 w-3.5 fill-violet-400" />
              <span>Wall of Fame</span>
            </div>
            <h2 className="font-extrabold text-3xl sm:text-4xl tracking-tight text-white mb-3">
              Loved by High-Volume Short Creators
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              From Bangalore tech educators to Mumbai lifestyle influencers, see what happens when editing time goes to near-zero.
            </p>
          </div>

          {/* Aceternity Continuous Moving Marquee */}
          <InfiniteMovingCards items={testimonials} direction="left" speed="normal" />
        </section>

        {/* 7. Final Call to Action Section with MovingBorder */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-950 p-8 sm:p-14 border border-zinc-800 text-center relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -top-20 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <Zap className="h-10 w-10 text-amber-400 fill-amber-400 mx-auto mb-3" />
              <h2 className="font-extrabold text-3xl sm:text-5xl tracking-tight text-white mb-4">
                Ready to 10x Your Reel Output?
              </h2>
              <p className="text-zinc-400 text-base sm:text-lg mb-8">
                Upload your first raw video now and experience the speed of text-based editing, silence surgery, and viral captions.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <MovingBorderButton
                  onClick={() => {
                    setSelectedPlan("₹99 Creator Day Pass");
                    setShowCheckoutModal(true);
                  }}
                  duration={3000}
                  className="px-8 py-4 bg-violet-600 hover:bg-violet-500 font-bold text-base shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Start Editing Free in Your Browser</span>
                  <ArrowRight className="h-4 w-4" />
                </MovingBorderButton>
              </div>
              <p className="text-xs text-zinc-400 mt-4">Takes 30 seconds • Runs completely in your browser</p>
            </div>
          </div>
        </section>

      </main>

      {/* 8. Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-12 w-full">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          
          <div className="flex flex-col items-center md:items-start gap-1.5">
            <Link href="/" className="text-lg font-black text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span>VibeCut AI</span>
            </Link>
            <p className="text-zinc-400 text-sm">
              © 2026 VibeCut AI. Fueling high-retention viral content for creators.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Hormozi Captions</a>
            <a href="#features" className="hover:text-white transition-colors">Silence Surgery</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing (₹99 Pass)</a>
            <a href="#wall-of-fame" className="hover:text-white transition-colors">Creator Community</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          </div>

        </div>
      </footer>

      {/* UPI / Pilot Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 flex flex-col gap-5 shadow-2xl relative">
            <button
              onClick={() => setShowCheckoutModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-sm"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Zap className="h-5 w-5 fill-amber-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">{selectedPlan}</h3>
                <p className="text-xs text-zinc-400">Instant UPI Checkout • 1080p Export Ready</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center gap-3">
              <div className="p-3 bg-white rounded-xl shadow">
                <QrCode className="h-28 w-28 text-zinc-900" />
              </div>
              <span className="text-xs text-zinc-400 font-mono">Scan via GPay / PhonePe / Paytm</span>
              <div className="w-full flex items-center justify-between text-xs pt-2 border-t border-zinc-800">
                <span className="text-zinc-400">Total Amount:</span>
                <span className="text-lg font-black text-amber-400">₹99</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert("Thank you for testing the VibeCut AI pilot! Early access confirmed.");
                setShowCheckoutModal(false);
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Confirm UPI Payment</span>
            </button>
          </div>
        </div>
      )}

      {/* Demo Video Modal */}
      {demoVideoOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 flex flex-col gap-4 shadow-2xl relative">
            <button
              onClick={() => setDemoVideoOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-white">How VibeCut AI Works in 30 Seconds</h3>
            <div className="aspect-video bg-black rounded-2xl flex items-center justify-center border border-zinc-800 relative overflow-hidden">
              <div className="text-center p-6">
                <Play className="h-14 w-14 text-amber-400 mx-auto mb-2 opacity-80" />
                <p className="text-sm text-zinc-400">Interactive walkthrough: Drop video $\rightarrow$ Silence Cut $\rightarrow$ Kinetic Captions $\rightarrow$ Export.</p>
              </div>
            </div>
            <button
              onClick={() => setDemoVideoOpen(false)}
              className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

    </BackgroundTexture>
  );
}
