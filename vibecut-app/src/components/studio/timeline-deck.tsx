"use client";

import React, { useRef, useState, useMemo, MouseEvent, useCallback, useEffect } from "react";
import {
  Scissors,
  Zap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Type,
  Video,
  Volume2,
  SlidersHorizontal,
  Layers,
  Sparkles,
} from "lucide-react";
import { StudioWord, TimelineCut } from "@/types/studio";
import { formatTimecode } from "@/lib/studio-utils";

interface TimelineDeckProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  words?: StudioWord[];
  cuts?: TimelineCut[];
  onAddSplitCut?: (time: number) => void;
  onCutSilences?: () => void;
  onResetCuts?: () => void;
  silenceCount?: number;
}

export function TimelineDeck({
  currentTime,
  duration,
  onSeek,
  words = [],
  cuts = [],
  onAddSplitCut,
  onCutSilences,
  onResetCuts,
  silenceCount = 14,
}: TimelineDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Safe duration fallback
  const validDuration = duration > 0 ? duration : 30;

  // Handle seeking via click or drag on the timeline
  const handleSeekFromEvent = useCallback(
    (e: MouseEvent<HTMLDivElement> | globalThis.MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, clickX / rect.width));
      const targetTime = percent * validDuration;
      onSeek(targetTime);
    },
    [validDuration, onSeek]
  );

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    handleSeekFromEvent(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isScrubbing) {
        handleSeekFromEvent(e);
      }
    };
    const handleMouseUp = () => {
      if (isScrubbing) {
        setIsScrubbing(false);
      }
    };

    if (isScrubbing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, handleSeekFromEvent]);

  // Group words into phrases (3-5 words) for track 1
  const subtitleBlocks = useMemo(() => {
    if (!words || words.length === 0) return [];
    const blocks: {
      id: string;
      start: number;
      end: number;
      text: string;
      isDeleted: boolean;
      words: StudioWord[];
    }[] = [];

    const chunkSize = 4;
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize);
      const start = chunk[0].start;
      const end = chunk[chunk.length - 1].end;
      const isAllDeleted = chunk.every((w) => w.deleted);
      const text = chunk.map((w) => w.word).join(" ");
      blocks.push({
        id: `sub-block-${i}`,
        start,
        end,
        text,
        isDeleted: isAllDeleted,
        words: chunk,
      });
    }
    return blocks;
  }, [words]);

  // Total cut duration calculation
  const totalCutDuration = useMemo(() => {
    const intervals: { start: number; end: number }[] = [];
    words.filter((w) => w.deleted).forEach((w) => {
      if (w.end > w.start) intervals.push({ start: w.start, end: w.end });
    });
    cuts.forEach((c) => {
      if (c.end > c.start) intervals.push({ start: c.start, end: c.end });
    });
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

  const effectiveDuration = Math.max(0, validDuration - totalCutDuration);

  // Combine all deleted word spans and timeline cuts for V1 Video track
  const { cutZones, splitLines } = useMemo(() => {
    const rawZones: { id: string; start: number; end: number; label: string }[] = [];
    const splits: { id: string; start: number }[] = [];

    // Add deleted words as cut zones
    words.forEach((w) => {
      if (w.deleted && w.end > w.start) {
        rawZones.push({
          id: `cut-word-${w.id}`,
          start: w.start,
          end: w.end,
          label: `Cut word: "${w.word}"`,
        });
      }
    });

    // Add timeline cuts
    cuts.forEach((c) => {
      if (c.end > c.start) {
        rawZones.push({
          id: c.id,
          start: c.start,
          end: c.end,
          label: c.label || (c.type === "silence" ? "Silence Cut" : "Cut Segment"),
        });
      } else {
        splits.push({ id: c.id, start: c.start });
      }
    });

    // Sort and merge overlapping cut zones
    rawZones.sort((a, b) => a.start - b.start);
    const mergedZones: { id: string; start: number; end: number; label: string }[] = [];
    for (const zone of rawZones) {
      if (mergedZones.length === 0) {
        mergedZones.push({ ...zone });
      } else {
        const last = mergedZones[mergedZones.length - 1];
        if (zone.start <= last.end + 0.02) {
          last.end = Math.max(last.end, zone.end);
          last.label += `, ${zone.label}`;
        } else {
          mergedZones.push({ ...zone });
        }
      }
    }

    return { cutZones: mergedZones, splitLines: splits };
  }, [words, cuts]);

  // Audio waveform bars generator
  const waveformBars = useMemo(() => {
    const totalBars = 96;
    const bars: { height: number; isSilence: boolean }[] = [];

    for (let i = 0; i < totalBars; i++) {
      const barTime = (i / totalBars) * validDuration;
      // Check if bar falls into speech or pause
      const isSpeaking = words.some(
        (w) => !w.deleted && barTime >= w.start && barTime <= w.end
      );

      if (isSpeaking) {
        // High speech activity bar
        const pseudoRandom = Math.sin(i * 12.3) * 0.35 + 0.65;
        bars.push({ height: Math.max(25, pseudoRandom * 90), isSilence: false });
      } else {
        // Silence/valley bar
        bars.push({ height: 10 + Math.random() * 8, isSilence: true });
      }
    }
    return bars;
  }, [words, validDuration]);

  // Generate ruler tick marks based on duration
  const rulerTicks = useMemo(() => {
    const ticks: { time: number; label: string; percent: number }[] = [];
    const interval = validDuration > 60 ? 10 : validDuration > 20 ? 5 : 2;
    for (let t = 0; t <= validDuration; t += interval) {
      ticks.push({
        time: t,
        label: formatTimecode(t),
        percent: (t / validDuration) * 100,
      });
    }
    return ticks;
  }, [validDuration]);

  const playheadPercent = Math.min(100, (currentTime / validDuration) * 100);

  return (
    <div
      ref={containerRef}
      className="h-56 shrink-0 bg-[#0d0d12] border-t border-white/[0.08] flex flex-col select-none z-30"
    >
      {/* Timeline Action Header Bar */}
      <div className="h-10 px-3 border-b border-white/[0.06] bg-[#121217] flex items-center justify-between">
        {/* Left: Quick Actions (Split, Cut Silences, Reset) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAddSplitCut?.(currentTime)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-zinc-300 hover:text-white bg-[#181820] hover:bg-[#22222c] border border-white/5 transition-all cursor-pointer"
            title="Split clip at playhead position (S)"
          >
            <Scissors className="h-3 w-3 text-indigo-400" />
            <span>Split (S)</span>
          </button>

          <button
            onClick={onCutSilences}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 transition-all cursor-pointer shadow-sm shadow-amber-500/10"
            title="Detect and auto-trim silent pauses"
          >
            <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span>Cut Silences ({silenceCount})</span>
          </button>

          <button
            onClick={onResetCuts}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
            title="Reset timeline cuts"
          >
            <RotateCcw className="h-3 w-3" />
            <span className="hidden sm:inline">Reset Cuts</span>
          </button>
        </div>

        {/* Center: Playhead Timecode & Live Effective Duration Indicator */}
        <div className="flex items-center gap-2">
          <div className="font-mono text-xs font-bold text-white bg-black/60 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1.5">
            <span className="text-rose-400">{formatTimecode(currentTime)}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">{formatTimecode(validDuration)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400">
            <span>Effective: {formatTimecode(effectiveDuration)}</span>
            {totalCutDuration > 0 && (
              <span className="text-rose-400 text-[10px] font-semibold">
                (-{totalCutDuration.toFixed(1)}s cut)
              </span>
            )}
          </div>
        </div>

        {/* Right: Zoom controls */}
        <div className="flex items-center gap-1 bg-[#181820] p-0.5 rounded-lg border border-white/5 text-zinc-400">
          <button
            onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
            className="p-1 hover:text-white hover:bg-white/10 rounded cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          <span className="text-[10px] font-mono px-1 font-bold text-zinc-300">
            {zoomLevel.toFixed(2)}x
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
            className="p-1 hover:text-white hover:bg-white/10 rounded cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Multi-Track Horizontal Canvas Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Track Headers (T1, V1, A1) */}
        <div className="w-28 shrink-0 bg-[#0f0f14] border-r border-white/[0.08] flex flex-col justify-between py-1 px-2 text-[10px] font-mono font-semibold text-zinc-400">
          {/* Ruler space */}
          <div className="h-6 flex items-center text-[9px] text-zinc-500 font-bold tracking-wider">
            TIMELINE
          </div>

          {/* Track 1 Label */}
          <div className="h-10 flex items-center gap-1.5 px-1 rounded bg-[#15151c] border border-white/5 text-violet-300">
            <Type className="h-3 w-3 text-violet-400" />
            <span>T1 Subtitles</span>
          </div>

          {/* Track 2 Label */}
          <div className="h-12 flex items-center gap-1.5 px-1 rounded bg-[#15151c] border border-white/5 text-indigo-300">
            <Video className="h-3 w-3 text-indigo-400" />
            <span>V1 Video</span>
          </div>

          {/* Track 3 Label */}
          <div className="h-11 flex items-center gap-1.5 px-1 rounded bg-[#15151c] border border-white/5 text-emerald-300">
            <Volume2 className="h-3 w-3 text-emerald-400" />
            <span>A1 Dialogue</span>
          </div>
        </div>

        {/* Right Interactive Track Deck (Ruler + Tracks + Playhead) */}
        <div
          ref={trackRef}
          onMouseDown={handleMouseDown}
          className="flex-1 relative overflow-x-auto overflow-y-hidden flex flex-col justify-between p-1 cursor-pointer bg-[#0a0a0d]"
        >
          {/* Time Ruler with Seconds markers */}
          <div className="h-6 relative w-full border-b border-white/[0.06] text-[10px] font-mono text-zinc-500">
            {rulerTicks.map((tick) => (
              <div
                key={tick.time}
                className="absolute top-0 flex flex-col items-center -translate-x-1/2 pointer-events-none"
                style={{ left: `${tick.percent}%` }}
              >
                <span className="text-[9px] text-zinc-400">{tick.label}</span>
                <span className="w-px h-1.5 bg-zinc-600 mt-0.5" />
              </div>
            ))}
          </div>

          {/* TRACK 1: Subtitle blocks */}
          <div className="h-10 relative w-full bg-[#121217]/60 rounded-md border border-white/5 overflow-hidden flex items-center px-1">
            {subtitleBlocks.length === 0 ? (
              <span className="text-[10px] text-zinc-600 italic px-2">
                Awaiting word-timestamps...
              </span>
            ) : (
              subtitleBlocks.map((block) => {
                const left = (block.start / validDuration) * 100;
                const width = Math.max(2, ((block.end - block.start) / validDuration) * 100);
                const isActive = currentTime >= block.start && currentTime <= block.end;

                return (
                  <div
                    key={block.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(block.start);
                    }}
                    className={`absolute top-1 bottom-1 rounded px-1.5 flex items-center transition-all cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-bold ${
                      block.isDeleted
                        ? "line-through opacity-40 bg-rose-950/40 border border-rose-900/60 text-rose-400/70"
                        : isActive
                        ? "bg-amber-400 text-zinc-950 ring-1 ring-amber-300 shadow-md shadow-amber-400/40 z-10"
                        : "bg-violet-600/30 text-violet-200 border border-violet-500/40 hover:bg-violet-600/50"
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`Subtitle: "${block.text}" (${formatTimecode(block.start)} - ${formatTimecode(block.end)})${block.isDeleted ? " [CUT]" : ""}`}
                  >
                    <span className="truncate flex items-center gap-1">
                      {block.words.map((bw) => (
                        <span
                          key={bw.id}
                          className={bw.deleted ? "line-through text-rose-400/60 opacity-60" : ""}
                        >
                          {bw.word}
                        </span>
                      ))}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* TRACK 2: Video clip slice strip with cut gap indicators and split lines */}
          <div className="h-12 relative w-full bg-[#121218] rounded-md border border-indigo-500/20 overflow-hidden flex items-center">
            {/* Base video clip bar */}
            <div className="w-full h-full bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-indigo-950/80 flex items-center justify-between px-3 border border-indigo-500/30 rounded">
              <span className="text-[10px] font-mono text-indigo-300 font-bold truncate">
                Main Video Clip • 1080x1920 (60fps)
              </span>
              <span className="text-[9px] font-mono text-zinc-500">ProRes / H.264</span>
            </div>

            {/* Red Cut Gap Indicators for deleted words & silence cuts */}
            {cutZones.map((zone) => {
              const leftPercent = Math.max(0, (zone.start / validDuration) * 100);
              const widthPercent = Math.max(0.6, ((zone.end - zone.start) / validDuration) * 100);
              return (
                <div
                  key={zone.id}
                  className="absolute top-0 bottom-0 z-20 bg-rose-950/85 border-x-2 border-rose-500 flex items-center justify-center overflow-hidden pointer-events-none shadow-sm shadow-rose-900/50"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(244,63,94,0.25), rgba(244,63,94,0.25) 4px, transparent 4px, transparent 8px)",
                  }}
                  title={zone.label}
                >
                  {widthPercent > 2.5 && (
                    <span className="text-[8px] font-black font-mono text-rose-300 uppercase tracking-tighter truncate px-0.5 drop-shadow">
                      ✂ CUT
                    </span>
                  )}
                </div>
              );
            })}

            {/* Split lines where single cuts or manual cuts exist */}
            {splitLines.map((split) => {
              const leftPercent = (split.start / validDuration) * 100;
              return (
                <div
                  key={split.id}
                  className="absolute top-0 bottom-0 w-[2px] bg-amber-400 z-20 shadow-[0_0_8px_rgba(251,191,36,0.9)] flex flex-col justify-between items-center pointer-events-none"
                  style={{ left: `${leftPercent}%` }}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400 -mt-0.5" />
                  <span className="w-2 h-2 rounded-full bg-amber-400 -mb-0.5" />
                </div>
              );
            })}
          </div>

          {/* TRACK 3: Audio Waveform track */}
          <div className="h-11 relative w-full bg-[#101015] rounded-md border border-emerald-500/20 overflow-hidden flex items-center px-1">
            <div className="w-full h-full flex items-center gap-[2px]">
              {waveformBars.map((bar, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex items-center justify-center h-full"
                >
                  <div
                    className={`w-full rounded-full transition-all ${
                      bar.isSilence
                        ? "bg-rose-500/30 border-t border-rose-500/40"
                        : "bg-gradient-to-t from-emerald-600 to-teal-400 opacity-90 hover:opacity-100"
                    }`}
                    style={{ height: `${bar.height}%` }}
                  />
                </div>
              ))}
            </div>

            {/* Silence markers callout if any */}
            {silenceCount > 0 && (
              <div className="absolute right-2 top-1 text-[9px] font-mono text-amber-300 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/30">
                ⚡ {silenceCount} silent pauses detected
              </div>
            )}
          </div>

          {/* SCRUBBABLE PLAYHEAD (Red vertical needle line) */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-30 transition-none"
            style={{ left: `${playheadPercent}%` }}
          >
            {/* Top needle head */}
            <div className="w-3.5 h-3.5 -ml-[6px] bg-rose-500 rounded-sm rotate-45 shadow-lg shadow-rose-500/50 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-white" />
            </div>
            {/* Vertical red line */}
            <div className="w-[2px] h-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] -ml-[1px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
