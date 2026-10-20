"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Search,
  Copy,
  Check,
  Volume2,
  Clock,
  Filter,
  List,
  Layers,
  AlertCircle,
  Loader2,
  Zap,
  RotateCcw,
} from "lucide-react";
import { TranscriptionState, StudioWord } from "@/types/studio";
import { formatTimecode } from "@/lib/studio-utils";

interface TranscriptCardProps {
  transcriptionState: TranscriptionState;
  words: StudioWord[];
  currentTime: number;
  onSeekToWord: (startTime: number) => void;
  onRetryTranscription?: () => void;
}

export function TranscriptCard({
  transcriptionState,
  words,
  currentTime,
  onSeekToWord,
  onRetryTranscription,
}: TranscriptCardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"words" | "segments">("words");
  const [showFillersOnly, setShowFillersOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  // Copy full transcript text
  const handleCopyText = async () => {
    if (!transcriptionState.result?.text) return;
    try {
      await navigator.clipboard.writeText(transcriptionState.result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy transcript:", err);
    }
  };

  // Filter words according to search query & filler filter
  const filteredWords = useMemo(() => {
    return words.filter((w) => {
      const matchesSearch =
        !searchQuery ||
        w.word.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesFiller = !showFillersOnly || w.isFiller;
      return matchesSearch && matchesFiller;
    });
  }, [words, searchQuery, showFillersOnly]);

  const fillerCount = useMemo(() => {
    return words.filter((w) => w.isFiller).length;
  }, [words]);

  // Loading / Transcribing State
  if (
    transcriptionState.status === "transcribing" ||
    transcriptionState.status === "extracting_audio"
  ) {
    return (
      <div className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-800 p-8 text-center flex flex-col items-center justify-center min-h-[320px]">
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center animate-pulse">
            <Sparkles className="h-8 w-8 text-violet-400 animate-spin" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-zinc-950 font-black text-[10px]">
            AI
          </div>
        </div>

        <h3 className="text-base font-bold text-white mb-2">
          Groq Whisper-Large-v3 Transcribing...
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm mb-5 leading-relaxed">
          Extracting high-precision word timestamps and phonetic speech boundaries with sub-3s inference.
        </p>

        {/* Pulsing progress bar */}
        <div className="w-full max-w-xs h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 via-amber-400 to-violet-500 rounded-full animate-pulse w-full" />
        </div>

        <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-zinc-500">
          <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
          <span>Multilingual & Hinglish auto-detection active</span>
        </div>
      </div>
    );
  }

  // Error State
  if (transcriptionState.status === "error") {
    return (
      <div className="w-full rounded-2xl bg-zinc-900/60 border border-rose-500/30 p-6 text-center flex flex-col items-center justify-center min-h-[260px]">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">
          Transcription Encountered an Issue
        </h3>
        <p className="text-xs text-rose-400/90 max-w-md mb-4 font-mono">
          {transcriptionState.errorMessage || "Failed to transcribe audio with Groq Whisper"}
        </p>
        {onRetryTranscription && (
          <button
            onClick={onRetryTranscription}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Retry Transcription</span>
          </button>
        )}
      </div>
    );
  }

  // Standby / Idle State
  if (transcriptionState.status === "idle" || words.length === 0) {
    return (
      <div className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-800 p-8 text-center flex flex-col items-center justify-center min-h-[240px]">
        <Sparkles className="h-8 w-8 text-zinc-600 mb-3" />
        <p className="text-sm font-semibold text-zinc-400 mb-1">
          Awaiting media speech transcription
        </p>
        <p className="text-xs text-zinc-500 max-w-xs">
          Select or upload your video clip to instantly generate interactive word-synced subtitles.
        </p>
      </div>
    );
  }

  // Completed State: Interactive word list & controls
  return (
    <div className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 sm:p-5 flex flex-col">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Groq Whisper Transcript</h3>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                whisper-large-v3
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {words.length} words detected • {transcriptionState.language?.toUpperCase() || "EN"} • Click any word to seek video
            </p>
          </div>
        </div>

        {/* Action Buttons: Copy & View Switcher */}
        <div className="flex items-center gap-1.5">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 text-[11px]">
            <button
              onClick={() => setViewMode("words")}
              className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                viewMode === "words"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Word-by-word synced view"
            >
              <Layers className="h-3 w-3" />
              <span>Words</span>
            </button>
            <button
              onClick={() => setViewMode("segments")}
              className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                viewMode === "segments"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Segment paragraphs view"
            >
              <List className="h-3 w-3" />
              <span>Sentences</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyText}
            className="p-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors text-xs flex items-center gap-1"
            title="Copy full text transcript"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span className="text-[11px] hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-2 my-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search spoken words in transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 text-white text-xs pl-8 pr-3 py-1.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-zinc-600 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filler filter badge */}
        {fillerCount > 0 && (
          <button
            onClick={() => setShowFillersOnly(!showFillersOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              showFillersOnly
                ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-amber-300"
            }`}
            title="Toggle filler words filter"
          >
            <Filter className="h-3 w-3 text-amber-400" />
            <span className="text-[11px]">{fillerCount} Fillers</span>
          </button>
        )}
      </div>

      {/* Main Transcript Body */}
      {viewMode === "words" ? (
        /* Word Token Chips Flow */
        <div className="overflow-y-auto max-h-[360px] p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 scrollbar-thin">
          <div className="flex flex-wrap gap-1.5 items-center leading-relaxed">
            {filteredWords.map((w) => {
              const isActive = currentTime >= w.start && currentTime <= w.end;
              const isPast = currentTime > w.end;

              return (
                <button
                  key={w.id}
                  onClick={() => onSeekToWord(w.start)}
                  title={`Seek to ${formatTimecode(w.start)} (${w.start.toFixed(2)}s)`}
                  className={`group relative inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-amber-500 text-white font-bold ring-2 ring-amber-400 scale-105 shadow-lg shadow-violet-500/40 z-10"
                      : isPast
                      ? "bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800"
                      : "bg-zinc-900/40 text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200 border border-zinc-800/50"
                  } ${
                    w.isFiller
                      ? "border-b-2 border-b-amber-400/80"
                      : ""
                  }`}
                >
                  <span>{w.word}</span>

                  {/* Micro timestamp chip on hover or when active */}
                  <span
                    className={`text-[9px] font-mono px-1 rounded transition-opacity ${
                      isActive
                        ? "bg-black/40 text-amber-300 opacity-100"
                        : "text-zinc-500 group-hover:text-zinc-300 opacity-0 group-hover:opacity-100 hidden sm:inline"
                    }`}
                  >
                    {w.start.toFixed(1)}s
                  </span>

                  {/* Filler dot indicator */}
                  {w.isFiller && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                      title="AI detected filler word"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {filteredWords.length === 0 && (
            <div className="text-center py-8 text-zinc-500 text-xs font-mono">
              No words match query &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      ) : (
        /* Segment / Sentences Paragraph Flow */
        <div className="overflow-y-auto max-h-[360px] space-y-2 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 scrollbar-thin">
          {(transcriptionState.result?.segments || []).map((seg) => {
            const isSegmentActive =
              currentTime >= seg.start && currentTime <= seg.end;

            return (
              <div
                key={seg.id}
                onClick={() => onSeekToWord(seg.start)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSegmentActive
                    ? "bg-violet-950/30 border-violet-500/50 text-white shadow-md shadow-violet-900/20"
                    : "bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-900/80 hover:border-zinc-700 text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1.5">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Clock className="h-3 w-3" />
                    {formatTimecode(seg.start)} - {formatTimecode(seg.end)}
                  </span>
                  <span className="text-zinc-600">ID #{seg.id}</span>
                </div>
                <p className="text-xs leading-relaxed font-sans">{seg.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Instructions */}
      <div className="mt-3 pt-2.5 border-t border-zinc-800/70 flex flex-wrap items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            Word sync active
          </span>
          {fillerCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-0.5 bg-amber-400" />
              Underline = Filler word
            </span>
          )}
        </div>
        <span className="font-mono text-zinc-400">
          Current: <strong className="text-amber-400">{formatTimecode(currentTime)}</strong>
        </span>
      </div>
    </div>
  );
}
