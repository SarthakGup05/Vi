"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  FileText,
  Type,
  Scissors,
  Sliders,
  Sparkles,
  Search,
  Zap,
  Check,
  RotateCcw,
  Volume2,
  Flame,
  ArrowRight,
  Send,
  Loader2,
  Wand2,
  CheckCircle2,
  VolumeX,
  Music,
  Bell,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { StudioWord, CaptionStyle, StudioTab, TimelineCut, SilenceGap } from "@/types/studio";
import { formatTimecode, detectSilenceGaps } from "@/lib/studio-utils";

interface StudioInspectorProps {
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  words: StudioWord[];
  currentTime: number;
  duration?: number;
  cuts?: TimelineCut[];
  onSeekToWord: (startTime: number) => void;
  onToggleWordDeleted: (wordId: string) => void;
  onBatchToggleWords?: (wordIds: string[], deleted: boolean) => void;
  onDeleteAllFillers: () => void;
  onRestoreAllCuts?: () => void;
  onAutoCutSilences: () => void;
  onToggleSilenceCut?: (gap: SilenceGap) => void;
  onRestoreAllSilences?: () => void;
  silenceThreshold?: number;
  onSilenceThresholdChange?: (val: number) => void;
  captionStyle: CaptionStyle;
  onCaptionStyleChange: (style: CaptionStyle) => void;
  onExecuteCopilotPrompt: (prompt: string) => void;
  copilotFeedback?: string | null;
}

export function StudioInspector({
  activeTab,
  onTabChange,
  words,
  currentTime,
  duration = 0,
  cuts = [],
  onSeekToWord,
  onToggleWordDeleted,
  onBatchToggleWords,
  onDeleteAllFillers,
  onRestoreAllCuts,
  onAutoCutSilences,
  onToggleSilenceCut,
  onRestoreAllSilences,
  silenceThreshold: propSilenceThreshold,
  onSilenceThresholdChange,
  captionStyle,
  onCaptionStyleChange,
  onExecuteCopilotPrompt,
  copilotFeedback,
}: StudioInspectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [copilotInput, setCopilotInput] = useState("");
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // Selection states for Doc-style range editing
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [lastClickedWordId, setLastClickedWordId] = useState<string | null>(null);

  // Audio tab states
  const [voiceEnhance, setVoiceEnhance] = useState(true);
  const [autoDucking, setAutoDucking] = useState(true);
  const [duckingLevel, setDuckingLevel] = useState(75);

  // Silence threshold (supports local or controlled)
  const [localSilenceThreshold, setLocalSilenceThreshold] = useState(0.5);
  const silenceThreshold = propSilenceThreshold ?? localSilenceThreshold;
  const handleSilenceThresholdChange = (val: number) => {
    setLocalSilenceThreshold(val);
    onSilenceThresholdChange?.(val);
  };

  const fillerCount = useMemo(() => {
    return words.filter((w) => w.isFiller && !w.deleted).length;
  }, [words]);

  const deletedWordCount = useMemo(() => {
    return words.filter((w) => w.deleted).length;
  }, [words]);

  // Real-Time Duration & Retention Metrics
  const originalDuration = useMemo(() => {
    if (duration && duration > 0) return duration;
    if (words.length > 0) return words[words.length - 1].end;
    return 0;
  }, [duration, words]);

  const totalCutDuration = useMemo(() => {
    const intervals: { start: number; end: number }[] = [];
    words.filter((w) => w.deleted).forEach((w) => {
      if (w.end > w.start) intervals.push({ start: w.start, end: w.end });
    });
    if (cuts && cuts.length > 0) {
      cuts.forEach((c) => {
        if (c.end > c.start) intervals.push({ start: c.start, end: c.end });
      });
    }
    if (intervals.length === 0) return 0;
    intervals.sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
      const prev = merged[merged.length - 1];
      const cur = intervals[i];
      if (cur.start <= prev.end + 0.02) {
        prev.end = Math.max(prev.end, cur.end);
      } else {
        merged.push({ ...cur });
      }
    }
    return merged.reduce((acc, cur) => acc + (cur.end - cur.start), 0);
  }, [words, cuts]);

  const trimmedDuration = Math.max(0, originalDuration - totalCutDuration);
  const percentCut = originalDuration > 0 ? (totalCutDuration / originalDuration) * 100 : 0;

  // Handle word click with Shift-range selection
  const handleWordClick = (w: StudioWord, e: React.MouseEvent) => {
    if (e.shiftKey && lastClickedWordId) {
      e.preventDefault();
      const lastIdx = words.findIndex((item) => item.id === lastClickedWordId);
      const currIdx = words.findIndex((item) => item.id === w.id);
      if (lastIdx !== -1 && currIdx !== -1) {
        const start = Math.min(lastIdx, currIdx);
        const end = Math.max(lastIdx, currIdx);
        const newSelected = new Set(selectedWordIds);
        for (let i = start; i <= end; i++) {
          newSelected.add(words[i].id);
        }
        setSelectedWordIds(newSelected);
        return;
      }
    }

    setLastClickedWordId(w.id);
    onSeekToWord(w.start);
  };

  // Batch Cut selected words
  const handleCutSelected = () => {
    const ids = Array.from(selectedWordIds);
    if (onBatchToggleWords) {
      onBatchToggleWords(ids, true);
    } else {
      ids.forEach((id) => onToggleWordDeleted(id));
    }
    setSelectedWordIds(new Set());
  };

  // Batch Restore selected words
  const handleRestoreSelected = () => {
    const ids = Array.from(selectedWordIds);
    if (onBatchToggleWords) {
      onBatchToggleWords(ids, false);
    } else {
      ids.forEach((id) => onToggleWordDeleted(id));
    }
    setSelectedWordIds(new Set());
  };

  // Detect real silence gaps with 0.05s safety padding
  const detectedSilences = useMemo(() => {
    return detectSilenceGaps(words, duration, silenceThreshold, 0.05);
  }, [words, duration, silenceThreshold]);

  // Check if a silence gap is currently cut in timeline cuts
  const isGapCut = useCallback(
    (gap: SilenceGap) => {
      return cuts.some(
        (c) =>
          c.id === `cut-silence-${gap.id}` ||
          (Math.abs(c.start - gap.start) < 0.08 && Math.abs(c.end - gap.end) < 0.08)
      );
    },
    [cuts]
  );

  const cutGapsCount = useMemo(() => {
    return detectedSilences.filter(isGapCut).length;
  }, [detectedSilences, isGapCut]);

  const uncutGaps = useMemo(() => {
    return detectedSilences.filter((g) => !isGapCut(g));
  }, [detectedSilences, isGapCut]);

  const totalSilenceSecs = useMemo(() => {
    return detectedSilences.reduce((acc, g) => acc + g.duration, 0);
  }, [detectedSilences]);

  const uncutSilenceSecs = useMemo(() => {
    return uncutGaps.reduce((acc, g) => acc + g.duration, 0);
  }, [uncutGaps]);

  const cutSilenceSecs = useMemo(() => {
    return detectedSilences.filter(isGapCut).reduce((acc, g) => acc + g.duration, 0);
  }, [detectedSilences, isGapCut]);

  const handleCopilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim()) return;
    const prompt = copilotInput.trim();
    setCopilotInput("");
    setIsCopilotThinking(true);
    setTimeout(() => {
      setIsCopilotThinking(false);
      onExecuteCopilotPrompt(prompt);
    }, 600);
  };

  const handleSuggestionClick = (prompt: string) => {
    setIsCopilotThinking(true);
    setTimeout(() => {
      setIsCopilotThinking(false);
      onExecuteCopilotPrompt(prompt);
    }, 500);
  };

  return (
    <aside className="w-80 sm:w-96 shrink-0 bg-[#121217] border-l border-white/[0.08] flex flex-col justify-between select-none z-20">
      {/* Inspector Tab Bar */}
      <div className="h-11 border-b border-white/[0.08] px-2 flex items-center justify-between bg-[#0e0e13]">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => onTabChange("transcript")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "transcript"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Doc Edit</span>
          </button>

          <button
            onClick={() => onTabChange("captions")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "captions"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Type className="h-3.5 w-3.5" />
            <span>Captions</span>
          </button>

          <button
            onClick={() => onTabChange("silence")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "silence"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            <span>Silence</span>
          </button>

          <button
            onClick={() => onTabChange("audio")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "audio"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/40"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Audio & SFX</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content View */}
      <div className="flex-1 overflow-y-auto p-3.5 scrollbar-thin scrollbar-thumb-zinc-800">
        {/* TAB 1: INTERACTIVE TRANSCRIPT ("Edit Like a Doc") */}
        {activeTab === "transcript" && (
          <div className="flex flex-col gap-3">
            {/* Live Real-Time Duration & Retention Metric Readout */}
            <div className="p-2.5 rounded-xl bg-[#15151f] border border-violet-500/30 flex flex-col gap-1 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                  <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
                  Live Duration & Retention Engine
                </span>
                {totalCutDuration > 0 && (
                  <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
                    +{percentCut.toFixed(1)}% Boost
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-zinc-300">
                Original: <span className="text-zinc-100 font-bold">{originalDuration.toFixed(1)}s</span> • Trimmed: <span className="text-emerald-400 font-bold">{trimmedDuration.toFixed(1)}s</span> • <span className="text-rose-400 font-bold">{totalCutDuration.toFixed(1)}s cut</span> <span className="text-emerald-400 font-medium">(-{percentCut.toFixed(1)}% retention boost)</span>
              </div>
            </div>

            {/* Top Action Bar & Search */}
            <div className="flex flex-col gap-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter spoken text..."
                  className="w-full bg-[#181820] text-zinc-200 placeholder-zinc-500 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-white/5 focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Action Bar with Cut All Fillers & Restore All Cuts */}
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <button
                  onClick={onDeleteAllFillers}
                  disabled={fillerCount === 0}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    fillerCount > 0
                      ? "text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 shadow-sm"
                      : "text-zinc-600 bg-zinc-900 border border-white/5 cursor-not-allowed opacity-50"
                  }`}
                  title="Cut all filler words"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Cut {fillerCount > 0 ? `${fillerCount} Fillers` : "All Fillers"}</span>
                </button>

                {deletedWordCount > 0 && (
                  <button
                    onClick={onRestoreAllCuts}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-zinc-300 hover:text-white bg-[#181820] hover:bg-[#22222d] border border-white/10 transition-all cursor-pointer"
                    title="Restore all cuts in the transcript"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Restore All Cuts ({deletedWordCount})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sticky Floating Batch Cut Toolbar when words are selected */}
            {selectedWordIds.size > 0 && (
              <div className="sticky top-0 z-30 flex items-center justify-between p-2 rounded-xl bg-violet-950/95 border border-violet-500/50 backdrop-blur-md shadow-2xl text-xs animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-1.5 text-violet-200 font-bold">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                  <span>{selectedWordIds.size} words selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCutSelected}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/40 transition-all cursor-pointer"
                  >
                    <span>✂️ Cut Selected ({selectedWordIds.size} words)</span>
                  </button>
                  <button
                    onClick={handleRestoreSelected}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                    title="Restore selected words"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => setSelectedWordIds(new Set())}
                    className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/10 text-xs cursor-pointer"
                    title="Clear selection"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Hint bar */}
            <div className="px-2.5 py-1.5 rounded-lg bg-violet-950/20 border border-violet-500/20 flex items-center justify-between text-[11px] text-zinc-300">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>Click to seek • Shift+Click to range select • &ldquo;×&rdquo; to cut</span>
              </div>
              {selectedWordIds.size > 0 && (
                <button
                  onClick={() => setSelectedWordIds(new Set())}
                  className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Deselect all
                </button>
              )}
            </div>

            {/* Word Chips Flow */}
            {words.length === 0 ? (
              <div className="py-14 text-center text-zinc-500 px-4">
                <FileText className="h-8 w-8 mx-auto mb-2.5 opacity-30 text-zinc-400" />
                <p className="text-xs font-semibold text-zinc-300 mb-1">No Spoken Transcript Loaded</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Import a video with dialogue to see interactive word timestamps, detect filler words, and edit like a doc.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 leading-relaxed pt-1">
                {words.map((w) => {
                  const isActive = currentTime >= w.start && currentTime <= w.end;
                  const isSelected = selectedWordIds.has(w.id);
                  const matchesSearch =
                    !searchQuery ||
                    w.word.toLowerCase().includes(searchQuery.toLowerCase().trim());

                  if (!matchesSearch) return null;

                  return (
                    <div
                      key={w.id}
                      className={`group relative inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                        w.deleted
                          ? "line-through opacity-40 bg-rose-950/20 text-rose-400 border-rose-900/40 border"
                          : isSelected
                          ? "ring-2 ring-violet-400 bg-violet-600/40 text-white font-semibold border border-violet-500/50 shadow-md shadow-violet-500/20"
                          : isActive
                          ? "bg-violet-600 text-white font-bold ring-2 ring-violet-400 shadow-md shadow-violet-500/40 scale-105 z-10"
                          : w.isFiller
                          ? "bg-amber-400/10 text-amber-300 border border-amber-500/30 hover:bg-amber-400/20"
                          : "bg-[#181820] text-zinc-300 hover:bg-[#22222d] hover:text-white border border-white/5"
                      }`}
                    >
                      <button
                        onClick={(e) => handleWordClick(w, e)}
                        className="cursor-pointer flex items-center gap-1"
                        title={`${w.word} (${formatTimecode(w.start)}) • Shift-click to select range`}
                      >
                        <span>{w.word}</span>
                      </button>

                      {/* Strikethrough Delete / Restore button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWordDeleted(w.id);
                        }}
                        className={`p-0.5 rounded transition-all cursor-pointer text-xs ${
                          w.deleted
                            ? "opacity-100 text-rose-300 hover:text-emerald-400 hover:bg-emerald-500/20 font-bold"
                            : "opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/20"
                        }`}
                        title={w.deleted ? "Restore word (↺)" : "Cut word (×)"}
                      >
                        {w.deleted ? "↺" : "×"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CAPTIONS & STYLES */}
        {activeTab === "captions" && (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-bold text-white mb-2">Kinetic Preset Styles</h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Hormozi Style */}
                <button
                  onClick={() => onCaptionStyleChange("hormozi")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    captionStyle === "hormozi"
                      ? "bg-amber-500/15 border-amber-400/50 shadow-md shadow-amber-500/10"
                      : "bg-[#181820] hover:bg-[#20202a] border-white/5"
                  }`}
                >
                  <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
                    ⚡ Hormozi Gold
                  </div>
                  <div className="text-sm font-black text-white bg-black/50 p-1.5 rounded text-center">
                    VIRAL <span className="text-[#FACC15]">REEL</span>
                  </div>
                </button>

                {/* MrBeast Yellow */}
                <button
                  onClick={() => onCaptionStyleChange("beast")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    captionStyle === "beast"
                      ? "bg-amber-500/15 border-amber-400/50 shadow-md shadow-amber-500/10"
                      : "bg-[#181820] hover:bg-[#20202a] border-white/5"
                  }`}
                >
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                    🔥 Beast Box
                  </div>
                  <div className="text-sm font-black text-zinc-950 bg-[#FACC15] p-1 rounded text-center rotate-[-1deg]">
                    INSANE POP
                  </div>
                </button>

                {/* Cyber Neon Cyan */}
                <button
                  onClick={() => onCaptionStyleChange("cyber")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    captionStyle === "cyber"
                      ? "bg-cyan-500/15 border-cyan-400/50 shadow-md shadow-cyan-500/10"
                      : "bg-[#181820] hover:bg-[#20202a] border-white/5"
                  }`}
                >
                  <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider mb-1">
                    🌐 Cyber Cyan
                  </div>
                  <div className="text-sm font-black text-[#38BDF8] bg-black/50 p-1.5 rounded text-center">
                    TECH GLOW
                  </div>
                </button>

                {/* Clean Minimalist */}
                <button
                  onClick={() => onCaptionStyleChange("clean")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    captionStyle === "clean"
                      ? "bg-violet-500/15 border-violet-400/50 shadow-md shadow-violet-500/10"
                      : "bg-[#181820] hover:bg-[#20202a] border-white/5"
                  }`}
                >
                  <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1">
                    ✨ Minimalist
                  </div>
                  <div className="text-sm font-bold text-white bg-black/50 p-1.5 rounded text-center">
                    Clean Subtitle
                  </div>
                </button>
              </div>
            </div>

            {/* Typography Tuning */}
            <div className="p-3 rounded-xl bg-[#181820] border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Auto-Emphasize Hooks</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Words Per Line</span>
                <span className="text-[10px] font-mono text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                  3 - 4 words
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SILENCE SURGERY */}
        {activeTab === "silence" && (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-900/20 via-zinc-900 to-black border border-violet-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Scissors className="h-4 w-4 text-violet-400" />
                  Silence Detection Engine
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    cutGapsCount > 0 && cutGapsCount === detectedSilences.length
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                      : "text-amber-300 bg-amber-400/10 border-amber-400/30"
                  }`}
                >
                  {cutGapsCount > 0
                    ? `${cutGapsCount}/${detectedSilences.length} Cut`
                    : `${detectedSilences.length} Pauses`}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                Smart jump cut engine removes dead air and awkward breaths with 50ms safety margins so words never get clipped.
              </p>

              {/* Action Button: Auto-Cut or Restore */}
              {uncutGaps.length > 0 ? (
                <button
                  onClick={onAutoCutSilences}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  <span>
                    Auto-Cut All {uncutGaps.length} Silences (-{uncutSilenceSecs.toFixed(1)}s)
                  </span>
                </button>
              ) : detectedSilences.length > 0 ? (
                <button
                  onClick={onRestoreAllSilences || onRestoreAllCuts}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs shadow-lg shadow-emerald-500/10 transition-all cursor-pointer active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>All Pauses Cut! Click to Restore All</span>
                </button>
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-800/50 text-zinc-500 font-semibold text-xs border border-white/5 cursor-not-allowed"
                >
                  <span>No Silences Detected</span>
                </button>
              )}
            </div>

            {/* Threshold Slider & Presets */}
            <div className="p-3 rounded-xl bg-[#181820] border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Pause Sensitivity Threshold</span>
                <span className="text-xs font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 rounded border border-white/10">
                  {silenceThreshold.toFixed(1)}s
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1.5}
                step={0.1}
                value={silenceThreshold}
                onChange={(e) => handleSilenceThresholdChange(parseFloat(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                <button
                  onClick={() => handleSilenceThresholdChange(0.3)}
                  className={`hover:text-white transition-colors cursor-pointer px-1.5 py-0.5 rounded ${
                    Math.abs(silenceThreshold - 0.3) < 0.05 ? "text-violet-400 font-bold bg-violet-500/10" : ""
                  }`}
                >
                  0.3s (Aggressive)
                </button>
                <button
                  onClick={() => handleSilenceThresholdChange(0.5)}
                  className={`hover:text-white transition-colors cursor-pointer px-1.5 py-0.5 rounded ${
                    Math.abs(silenceThreshold - 0.5) < 0.05 ? "text-amber-400 font-bold bg-amber-500/10" : ""
                  }`}
                >
                  0.5s (Natural)
                </button>
                <button
                  onClick={() => handleSilenceThresholdChange(1.0)}
                  className={`hover:text-white transition-colors cursor-pointer px-1.5 py-0.5 rounded ${
                    Math.abs(silenceThreshold - 1.0) < 0.05 ? "text-indigo-400 font-bold bg-indigo-500/10" : ""
                  }`}
                >
                  1.0s (Lenient)
                </button>
              </div>

              <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  Speech guard safety:
                </span>
                <span className="font-mono text-zinc-300">±0.05s padding</span>
              </div>
            </div>

            {/* Retention & Watch-Time Impact */}
            {detectedSilences.length > 0 && (
              <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/20 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                    Watch-Time Boost
                  </div>
                  <div className="text-sm font-black text-amber-400 flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 fill-current" />
                    <span>+{Math.min(35, Math.max(8, Math.round(totalSilenceSecs * 3.5)))}% Retention</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400">Dead Air Recoverable</div>
                  <div className="text-xs font-mono font-bold text-white">
                    {cutSilenceSecs > 0 ? (
                      <span className="text-emerald-400">-{cutSilenceSecs.toFixed(1)}s cut</span>
                    ) : (
                      <span>{totalSilenceSecs.toFixed(1)}s total</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Live Detected Silences Itemized List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <Scissors className="h-3.5 w-3.5 text-violet-400" />
                  Detected Pauses ({detectedSilences.length})
                </span>
                {cutGapsCount > 0 && (
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                    {cutGapsCount} Active Cuts
                  </span>
                )}
              </div>

              {detectedSilences.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#181820] border border-white/5 text-center text-zinc-500">
                  <p className="text-xs font-semibold text-zinc-400 mb-1">No Silences Found</p>
                  <p className="text-[11px] leading-relaxed">
                    {words.length === 0
                      ? "Import a video with speech to detect and jump-cut pauses automatically."
                      : `No pauses >= ${silenceThreshold.toFixed(1)}s detected. Try moving the threshold slider to 0.3s.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {detectedSilences.map((gap) => {
                    const isCut = isGapCut(gap);
                    const isPlayingInside =
                      currentTime >= gap.rawStart && currentTime <= gap.rawEnd;

                    return (
                      <div
                        key={gap.id}
                        className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                          isCut
                            ? "bg-rose-950/20 border-rose-900/30 text-rose-300/80"
                            : isPlayingInside
                            ? "bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10"
                            : "bg-[#181820] hover:bg-[#20202a] border-white/5 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => onSeekToWord(gap.rawStart)}
                            className="p-1.5 rounded-lg bg-black/40 hover:bg-violet-600/30 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                            title={`Jump to silence at ${formatTimecode(gap.rawStart)}`}
                          >
                            <VolumeX className="h-3.5 w-3.5" />
                          </button>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold">
                              <span>{formatTimecode(gap.start)}</span>
                              <span className="text-zinc-600">→</span>
                              <span>{formatTimecode(gap.end)}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  isCut
                                    ? "bg-rose-500/20 text-rose-300"
                                    : "bg-amber-400/20 text-amber-300"
                                }`}
                              >
                                {gap.duration.toFixed(2)}s
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                              {gap.prevWord && gap.nextWord
                                ? `"${gap.prevWord}" ⏸ "${gap.nextWord}"`
                                : gap.prevWord
                                ? `After "${gap.prevWord}"`
                                : `Before "${gap.nextWord}"`}
                            </div>
                          </div>
                        </div>

                        {/* Cut / Restore Toggle Button */}
                        <button
                          onClick={() => onToggleSilenceCut?.(gap)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                            isCut
                              ? "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
                              : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 shadow-sm shadow-amber-500/20"
                          }`}
                        >
                          {isCut ? (
                            <>
                              <RotateCcw className="h-3 w-3" />
                              <span>Restore</span>
                            </>
                          ) : (
                            <>
                              <Scissors className="h-3 w-3" />
                              <span>Cut</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIO & SFX */}
        {activeTab === "audio" && (
          <div className="flex flex-col gap-4">
            {/* Voice Enhancer */}
            <div className="p-3 rounded-xl bg-[#181820] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                  Studio Voice Clarifier
                </span>
                <button
                  onClick={() => setVoiceEnhance(!voiceEnhance)}
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                    voiceEnhance ? "bg-violet-600" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      voiceEnhance ? "translate-x-4" : ""
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                Deep neural noise removal and condenser mic presence enhancement.
              </p>
            </div>

            {/* Auto Ducking */}
            <div className="p-3 rounded-xl bg-[#181820] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Music className="h-3.5 w-3.5 text-indigo-400" />
                  Smart Music Auto-Ducking
                </span>
                <button
                  onClick={() => setAutoDucking(!autoDucking)}
                  className={`w-9 h-5 rounded-full transition-colors p-0.5 cursor-pointer ${
                    autoDucking ? "bg-violet-600" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      autoDucking ? "translate-x-4" : ""
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-zinc-400">
                Automatically attenuates background music when speech begins.
              </p>
              {autoDucking && (
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Ducking Depth</span>
                    <span>-{duckingLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={90}
                    value={duckingLevel}
                    onChange={(e) => setDuckingLevel(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* SFX Triggers */}
            <div>
              <h4 className="text-xs font-bold text-white mb-2">1-Click Viral SFX</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleSuggestionClick("Add whoosh sound effect to hook")}
                  className="p-2 rounded-lg bg-[#181820] hover:bg-[#22222d] border border-white/5 text-zinc-300 text-left cursor-pointer transition-colors"
                >
                  💨 Whoosh Hook
                </button>
                <button
                  onClick={() => handleSuggestionClick("Add camera shutter pop")}
                  className="p-2 rounded-lg bg-[#181820] hover:bg-[#22222d] border border-white/5 text-zinc-300 text-left cursor-pointer transition-colors"
                >
                  📸 Camera Shutter
                </button>
                <button
                  onClick={() => handleSuggestionClick("Add cash register ding")}
                  className="p-2 rounded-lg bg-[#181820] hover:bg-[#22222d] border border-white/5 text-zinc-300 text-left cursor-pointer transition-colors"
                >
                  💰 Cash Ding
                </button>
                <button
                  onClick={() => handleSuggestionClick("Add deep bass drop on punchline")}
                  className="p-2 rounded-lg bg-[#181820] hover:bg-[#22222d] border border-white/5 text-zinc-300 text-left cursor-pointer transition-colors"
                >
                  🔊 Bass Impact
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING AI COPILOT COMMAND BAR AT BOTTOM */}
      <div className="p-3 border-t border-white/[0.08] bg-[#0c0c10] flex flex-col gap-2">
        {/* Copilot feedback toast */}
        {copilotFeedback && (
          <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in duration-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{copilotFeedback}</span>
          </div>
        )}

        {/* Suggestion pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => handleSuggestionClick("Cut all pauses > 0.5s")}
            className="shrink-0 px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-violet-600/20 hover:text-violet-300 text-zinc-400 text-[10px] font-medium transition-colors border border-white/5 cursor-pointer"
          >
            ⚡ Cut pauses &gt; 0.5s
          </button>
          <button
            onClick={() => handleSuggestionClick("Highlight keywords in gold")}
            className="shrink-0 px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-amber-400/20 hover:text-amber-300 text-zinc-400 text-[10px] font-medium transition-colors border border-white/5 cursor-pointer"
          >
            🔥 Gold keywords
          </button>
          <button
            onClick={() => handleSuggestionClick("Make intro faster and add whoosh")}
            className="shrink-0 px-2 py-0.5 rounded-full bg-white/[0.06] hover:bg-indigo-400/20 hover:text-indigo-300 text-zinc-400 text-[10px] font-medium transition-colors border border-white/5 cursor-pointer"
          >
            💨 Fast hook
          </button>
        </div>

        {/* Copilot Input Form */}
        <form onSubmit={handleCopilotSubmit} className="relative flex items-center">
          <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-violet-400" />
          <input
            type="text"
            value={copilotInput}
            onChange={(e) => setCopilotInput(e.target.value)}
            placeholder='Ask Copilot: "Make intro faster..." ↵'
            className="w-full bg-[#16161e] text-white placeholder-zinc-500 text-xs rounded-xl pl-8 pr-8 py-2 border border-violet-500/30 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={isCopilotThinking}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer disabled:opacity-50"
          >
            {isCopilotThinking ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
            ) : (
              <Send className="h-3.5 w-3.5 text-violet-400" />
            )}
          </button>
        </form>
      </div>
    </aside>
  );
}
