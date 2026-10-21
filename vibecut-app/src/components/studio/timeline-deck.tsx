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
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Magnet,
  MousePointer2,
  Music,
  Sparkles,
  Film,
  SlidersHorizontal,
  Camera,
  Layers,
} from "lucide-react";
import {
  StudioWord,
  TimelineCut,
  PunchZoomInterval,
  VFXFilterId,
  TransitionItem,
  TransitionEffectId,
} from "@/types/studio";
import {
  TRANSITION_EFFECTS_CATALOG,
  TRANSITION_CONFIG_MAP,
} from "@/lib/transitions-engine";
import { playProceduralSfx } from "@/lib/vfx-sfx-engine";
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
  punchZoomIntervals?: PunchZoomInterval[];
  activeVFXFilter?: VFXFilterId;
  transitions?: TransitionItem[];
  selectedTransitionId?: string | null;
  onSelectTransition?: (idOrTrans: string | TransitionItem | null) => void;
  onUpdateTransitions?: (transitions: TransitionItem[]) => void;
  onAddOrChangeTransitionAtTime?: (time: number, effect: TransitionEffectId, duration?: number) => void;
  onRemoveTransition?: (id: string) => void;
  onOpenTransitionsTab?: () => void;
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
  punchZoomIntervals = [],
  activeVFXFilter = "none",
  transitions = [],
  selectedTransitionId: propSelectedTransitionId,
  onSelectTransition,
  onUpdateTransitions,
  onAddOrChangeTransitionAtTime,
  onRemoveTransition,
  onOpenTransitionsTab,
}: TimelineDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Tools & UI Modes
  const [activeTool, setActiveTool] = useState<"select" | "razor">("select");
  const [isSnapping, setIsSnapping] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [activeSnapPoint, setActiveSnapPoint] = useState<number | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>("main-clip-0");
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null);
  const [activePopoverSeamId, setActivePopoverSeamId] = useState<string | null>(null);

  // Close popover on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActivePopoverSeamId(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Track Sovereignty Controls (Premiere Pro Track Headers)
  const [trackStates, setTrackStates] = useState({
    subtitles: { visible: true, locked: false },
    video: { visible: true, locked: false },
    dialogue: { visible: true, locked: false, muted: false, solo: false },
    music: { visible: true, locked: false, muted: false, solo: false },
  });

  // Safe duration fallback
  const validDuration = duration > 0 ? duration : 30;

  // Keyframe/Snap points collection (clip boundaries, cuts, word starts)
  const snapTimestamps = useMemo(() => {
    const points = new Set<number>([0, validDuration]);
    words.forEach((w) => {
      points.add(w.start);
      points.add(w.end);
    });
    cuts.forEach((c) => {
      points.add(c.start);
      if (c.end > c.start) points.add(c.end);
    });
    punchZoomIntervals.forEach((pz) => {
      points.add(pz.start);
      points.add(pz.end);
    });
    return Array.from(points).sort((a, b) => a - b);
  }, [words, cuts, punchZoomIntervals, validDuration]);

  // Handle seeking via click or drag with magnetic snapping
  const handleSeekFromEvent = useCallback(
    (e: MouseEvent<HTMLDivElement> | globalThis.MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, clickX / rect.width));
      let targetTime = percent * validDuration;

      // Magnetic Snapping check (within 8px / ~0.15s threshold)
      if (isSnapping) {
        const snapThreshold = (8 / rect.width) * validDuration;
        const nearestSnap = snapTimestamps.find(
          (t) => Math.abs(t - targetTime) <= snapThreshold
        );
        if (nearestSnap !== undefined) {
          targetTime = nearestSnap;
          setActiveSnapPoint(nearestSnap);
        } else {
          setActiveSnapPoint(null);
        }
      } else {
        setActiveSnapPoint(null);
      }

      onSeek(targetTime);
    },
    [validDuration, onSeek, isSnapping, snapTimestamps]
  );

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (activeTool === "razor") {
      // Razor tool cuts immediately at clicked position
      if (trackRef.current) {
        const rect = trackRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, clickX / rect.width));
        const cutTime = percent * validDuration;
        onAddSplitCut?.(cutTime);
      }
      return;
    }
    setIsScrubbing(true);
    handleSeekFromEvent(e);
  };

  const handleMouseMoveRuler = (e: MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    setHoverTime(percent * validDuration);
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
        setActiveSnapPoint(null);
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

  // Group words into phrases (3-5 words) for track 1 (VN Kinetic Subtitle Chips)
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

  // Compute total cut duration (silences + deleted words)
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
  const { cutZones, splitLines, videoClips } = useMemo(() => {
    const rawZones: { id: string; start: number; end: number; label: string }[] = [];
    const splits: { id: string; start: number }[] = [];

    // Deleted words as cut zones
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

    // Timeline cuts
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

    // Split raw video into distinct clips based on cuts and split points
    const splitPoints = Array.from(
      new Set([0, ...splits.map((s) => s.start), validDuration])
    ).sort((a, b) => a - b);

    const clips: { id: string; start: number; end: number; duration: number }[] = [];
    for (let i = 0; i < splitPoints.length - 1; i++) {
      const s = splitPoints[i];
      const e = splitPoints[i + 1];
      if (e - s > 0.1) {
        clips.push({
          id: `clip-${i}`,
          start: s,
          end: e,
          duration: e - s,
        });
      }
    }

    return { cutZones: mergedZones, splitLines: splits, videoClips: clips };
  }, [words, cuts, validDuration]);

  // All cut seam points where transitions can exist (cuts + transitions)
  const seamNodes = useMemo(() => {
    const list: {
      id: string;
      timestamp: number;
      transition?: TransitionItem;
    }[] = [];

    const processedTransitions = new Set<string>();

    // 1. Add all split cuts
    splitLines.forEach((split) => {
      const matchingTr = transitions.find(
        (t) => Math.abs(t.timestamp - split.start) <= 0.35
      );
      if (matchingTr) processedTransitions.add(matchingTr.id);
      list.push({
        id: split.id,
        timestamp: split.start,
        transition: matchingTr,
      });
    });

    // 2. Add any active transitions not on exact split lines
    transitions.forEach((t) => {
      if (!processedTransitions.has(t.id)) {
        list.push({
          id: t.id,
          timestamp: t.timestamp,
          transition: t,
        });
      }
    });

    return list.sort((a, b) => a.timestamp - b.timestamp);
  }, [splitLines, transitions]);


  // Audio waveform generator with speech density
  const waveformBars = useMemo(() => {
    const totalBars = 120;
    const bars: { height: number; isSilence: boolean }[] = [];

    for (let i = 0; i < totalBars; i++) {
      const barTime = (i / totalBars) * validDuration;
      const isSpeaking = words.some(
        (w) => !w.deleted && barTime >= w.start && barTime <= w.end
      );

      if (isSpeaking) {
        const pseudoRandom = Math.sin(i * 12.3) * 0.35 + 0.65;
        bars.push({ height: Math.max(25, pseudoRandom * 90), isSilence: false });
      } else {
        bars.push({ height: 10 + Math.random() * 8, isSilence: true });
      }
    }
    return bars;
  }, [words, validDuration]);

  // Precision Timecode Ruler: Major ticks + minor frame sub-ticks (Premiere Pro style)
  const rulerElements = useMemo(() => {
    const step = validDuration > 60 ? 10 : validDuration > 20 ? 5 : 2;
    const majorTicks: { time: number; label: string; percent: number }[] = [];
    const minorTicks: { percent: number }[] = [];

    for (let t = 0; t <= validDuration; t += step) {
      majorTicks.push({
        time: t,
        label: formatTimecode(t),
        percent: (t / validDuration) * 100,
      });

      // Add 4 minor ticks between major ticks
      const subStep = step / 5;
      for (let s = 1; s < 5; s++) {
        const subTime = t + s * subStep;
        if (subTime < validDuration) {
          minorTicks.push({
            percent: (subTime / validDuration) * 100,
          });
        }
      }
    }
    return { majorTicks, minorTicks };
  }, [validDuration]);

  const playheadPercent = Math.min(100, (currentTime / validDuration) * 100);

  return (
    <div
      ref={containerRef}
      className="h-64 shrink-0 bg-[#09090d] border-t border-white/[0.1] flex flex-col select-none z-30 font-sans shadow-2xl"
    >
      {/* 1. TOP NLE CONTROL BAR (VN / Premiere Hybrid) */}
      <div className="h-11 px-3 border-b border-white/[0.08] bg-[#101015] flex items-center justify-between">
        {/* Left: Tools & Surgical Actions */}
        <div className="flex items-center gap-1.5">
          {/* Tool Mode Picker (Select / Razor) */}
          <div className="flex items-center bg-black/60 p-0.5 rounded-lg border border-white/10 mr-1.5 shadow-inner">
            <button
              onClick={() => setActiveTool("select")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                activeTool === "select"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
              title="Selection Pointer Tool (V)"
            >
              <MousePointer2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setActiveTool("razor")}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                activeTool === "razor"
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
              title="Razor Cut Tool (C) - Click anywhere on timeline to split"
            >
              <Scissors className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Playhead Split Action */}
          <button
            onClick={() => onAddSplitCut?.(currentTime)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-200 hover:text-white bg-[#171720] hover:bg-[#20202c] border border-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Split clip at playhead position (S)"
          >
            <Scissors className="h-3 w-3 text-indigo-400" />
            <span>Split (S)</span>
          </button>

          {/* Auto Silence Cut Action */}
          <button
            onClick={() => onCutSilences?.()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 transition-all cursor-pointer shadow-sm shadow-amber-500/10 active:scale-95"
            title="Detect and auto-trim silent pauses"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span>Cut Silences ({silenceCount})</span>
          </button>

          {/* Magnetic Snapping Toggle */}
          <button
            onClick={() => setIsSnapping(!isSnapping)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
              isSnapping
                ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300 shadow-sm shadow-cyan-500/20"
                : "bg-transparent border-white/10 text-zinc-500 hover:text-zinc-300"
            }`}
            title="Toggle Magnetic Snapping (Snaps to clip edges & cuts)"
          >
            <Magnet className="h-3.5 w-3.5" />
          </button>

          {/* Reset Cuts */}
          <button
            onClick={onResetCuts}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
            title="Reset all timeline cuts"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Active Punch Zooms & VFX Status Badges */}
          {punchZoomIntervals.length > 0 && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[11px] font-mono font-bold text-amber-300"
              title={`${punchZoomIntervals.length} Camera punch zoom cuts configured`}
            >
              <Zap className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{punchZoomIntervals.length} Zooms</span>
            </div>
          )}

          {activeVFXFilter && activeVFXFilter !== "none" && (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-[11px] font-mono font-bold text-violet-300"
              title={`Active Visual FX Filter: ${activeVFXFilter}`}
            >
              <Sparkles className="h-3 w-3 text-violet-400" />
              <span className="uppercase text-[10px]">{activeVFXFilter.replace("_", " ")}</span>
            </div>
          )}
        </div>

        {/* Center: Precision Digital Timecode HUD */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-xs font-black text-rose-400 bg-black/80 px-3 py-1 rounded-lg border border-white/15 flex items-center gap-1.5 shadow-inner">
            <span className="tracking-wider">{formatTimecode(currentTime)}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400 font-semibold">{formatTimecode(validDuration)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400">
            <span>Effective: {formatTimecode(effectiveDuration)}</span>
            {totalCutDuration > 0 && (
              <span className="text-rose-400 text-[10px] font-semibold">
                (-{totalCutDuration.toFixed(1)}s cut)
              </span>
            )}
          </div>
        </div>

        {/* Right: Zoom Slider & Scale */}
        <div className="flex items-center gap-1.5 bg-[#171720] px-2 py-1 rounded-lg border border-white/10 text-zinc-400">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
            className="p-1 hover:text-white hover:bg-white/10 rounded cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1 font-bold text-zinc-300 min-w-[36px] text-center">
            {zoomLevel.toFixed(1)}x
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
            className="p-1 hover:text-white hover:bg-white/10 rounded cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. MULTI-TRACK TIMELINE CANVAS */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Track Headers (Premiere Pro Track Sovereignty) */}
        <div className="w-32 shrink-0 bg-[#0c0c11] border-r border-white/[0.08] flex flex-col justify-between py-1 px-2 text-[10px] font-mono font-semibold text-zinc-400 z-20">
          {/* Header Title */}
          <div className="h-6 flex items-center justify-between text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
            <span>TRACKS</span>
            <SlidersHorizontal className="h-2.5 w-2.5 text-zinc-600" />
          </div>

          {/* T1 Subtitles Track Header */}
          <div className="h-10 flex items-center justify-between px-2 rounded-lg bg-[#14141c] border border-white/5 text-violet-300">
            <div className="flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5 text-violet-400" />
              <span className="font-bold">T1</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <button
                onClick={() =>
                  setTrackStates((s) => ({
                    ...s,
                    subtitles: { ...s.subtitles, visible: !s.subtitles.visible },
                  }))
                }
                title="Toggle Track Visibility"
                className="hover:text-white cursor-pointer"
              >
                {trackStates.subtitles.visible ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3 text-zinc-600" />
                )}
              </button>
              <button
                onClick={() =>
                  setTrackStates((s) => ({
                    ...s,
                    subtitles: { ...s.subtitles, locked: !s.subtitles.locked },
                  }))
                }
                title="Lock Track"
                className="hover:text-white cursor-pointer"
              >
                {trackStates.subtitles.locked ? (
                  <Lock className="h-3 w-3 text-amber-400" />
                ) : (
                  <Unlock className="h-3 w-3 text-zinc-600" />
                )}
              </button>
            </div>
          </div>

          {/* V1 Video Track Header */}
          <div className="h-14 flex items-center justify-between px-2 rounded-lg bg-[#14141c] border border-white/5 text-indigo-300">
            <div className="flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-bold">V1</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <button
                onClick={() =>
                  setTrackStates((s) => ({
                    ...s,
                    video: { ...s.video, visible: !s.video.visible },
                  }))
                }
                title="Toggle Video Display"
                className="hover:text-white cursor-pointer"
              >
                {trackStates.video.visible ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3 text-zinc-600" />
                )}
              </button>
              <button
                onClick={() =>
                  setTrackStates((s) => ({
                    ...s,
                    video: { ...s.video, locked: !s.video.locked },
                  }))
                }
                title="Lock Video Track"
                className="hover:text-white cursor-pointer"
              >
                {trackStates.video.locked ? (
                  <Lock className="h-3 w-3 text-amber-400" />
                ) : (
                  <Unlock className="h-3 w-3 text-zinc-600" />
                )}
              </button>
            </div>
          </div>

          {/* A1 Dialogue Track Header */}
          <div className="h-11 flex items-center justify-between px-2 rounded-lg bg-[#14141c] border border-white/5 text-emerald-300">
            <div className="flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-bold">A1</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <button
                onClick={() =>
                  setTrackStates((s) => ({
                    ...s,
                    dialogue: { ...s.dialogue, muted: !s.dialogue.muted },
                  }))
                }
                title="Mute Track (M)"
                className="hover:text-white cursor-pointer"
              >
                {trackStates.dialogue.muted ? (
                  <VolumeX className="h-3 w-3 text-rose-400" />
                ) : (
                  <Volume2 className="h-3 w-3 text-emerald-400" />
                )}
              </button>
              <button
                onClick={() =>
                  setTrackStates((s) => ({
                    ...s,
                    dialogue: { ...s.dialogue, solo: !s.dialogue.solo },
                  }))
                }
                title="Solo Track (S)"
                className={`text-[9px] font-black px-1 rounded ${
                  trackStates.dialogue.solo
                    ? "bg-amber-400 text-black font-extrabold"
                    : "text-zinc-500 hover:text-white"
                } cursor-pointer`}
              >
                S
              </button>
            </div>
          </div>
        </div>

        {/* Right Track Canvas (Ruler, VN Filmstrip Cards, Waveform, Playhead) */}
        <div
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMoveRuler}
          onMouseLeave={() => setHoverTime(null)}
          className={`flex-1 relative overflow-x-auto overflow-y-hidden flex flex-col justify-between p-1 bg-[#07070a] ${
            activeTool === "razor" ? "cursor-crosshair" : "cursor-pointer"
          }`}
        >
          {/* Time Ruler (Seconds + Minor ticks) */}
          <div className="h-6 relative w-full border-b border-white/[0.08] text-[10px] font-mono text-zinc-500">
            {/* Minor Ticks */}
            {rulerElements.minorTicks.map((m, idx) => (
              <span
                key={idx}
                className="absolute top-2 w-[1px] h-1.5 bg-zinc-800 -translate-x-1/2 pointer-events-none"
                style={{ left: `${m.percent}%` }}
              />
            ))}

            {/* Major Ticks */}
            {rulerElements.majorTicks.map((tick) => (
              <div
                key={tick.time}
                className="absolute top-0 flex flex-col items-center -translate-x-1/2 pointer-events-none"
                style={{ left: `${tick.percent}%` }}
              >
                <span className="text-[9px] text-zinc-400 font-bold">{tick.label}</span>
                <span className="w-[1.5px] h-2 bg-zinc-600 mt-0.5" />
              </div>
            ))}

            {/* Punch Zoom Ruler Markers */}
            {punchZoomIntervals.map((zoom) => {
              const leftPercent = (zoom.start / validDuration) * 100;
              const isCurrent = currentTime >= zoom.start && currentTime <= zoom.end;
              return (
                <div
                  key={`pin-zoom-${zoom.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(zoom.start);
                  }}
                  className="absolute top-0 z-35 -translate-x-1/2 flex flex-col items-center cursor-pointer group"
                  style={{ left: `${leftPercent}%` }}
                  title={`Punch Zoom ${zoom.scale}x (${formatTimecode(zoom.start)} - ${formatTimecode(zoom.end)})`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center transition-all ${
                      isCurrent
                        ? "bg-amber-300 border-white scale-125 shadow-[0_0_8px_#FACC15]"
                        : "bg-amber-500 border-amber-900 group-hover:scale-110"
                    }`}
                  >
                    <span className="w-1 h-1 rounded-full bg-zinc-950" />
                  </div>
                  <div className={`w-[1px] h-3.5 ${isCurrent ? "bg-amber-400" : "bg-amber-500/50"}`} />
                </div>
              );
            })}

            {/* Hover Ghost Needle & Tooltip */}
            {hoverTime !== null && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-30 transition-none"
                style={{ left: `${(hoverTime / validDuration) * 100}%` }}
              >
                <div className="w-[1px] h-full bg-white/40" />
                <span className="absolute -top-1 -translate-x-1/2 px-1.5 py-0.5 rounded bg-zinc-800 text-[9px] font-mono font-bold text-white border border-white/20 shadow">
                  {formatTimecode(hoverTime)}
                </span>
              </div>
            )}

            {/* Magnetic Snap Vertical Guide */}
            {activeSnapPoint !== null && (
              <div
                className="absolute top-0 bottom-0 w-[1.5px] bg-cyan-400 z-40 shadow-[0_0_8px_cyan] pointer-events-none"
                style={{ left: `${(activeSnapPoint / validDuration) * 100}%` }}
              />
            )}
          </div>

          {/* TRACK 1: Subtitle Chips (VN Kinetic Pills) */}
          <div
            className={`h-10 relative w-full bg-[#101016]/80 rounded-lg border border-white/5 overflow-hidden flex items-center px-1 transition-opacity ${
              trackStates.subtitles.visible ? "opacity-100" : "opacity-20 pointer-events-none"
            }`}
          >
            {subtitleBlocks.length === 0 ? (
              <span className="text-[10px] text-zinc-600 italic px-2">
                Awaiting synchronized word-timestamps...
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
                    className={`absolute top-1 bottom-1 rounded-full px-2.5 flex items-center transition-all cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-bold shadow-sm ${
                      block.isDeleted
                        ? "line-through opacity-30 bg-rose-950/40 border border-rose-900/60 text-rose-400"
                        : isActive
                        ? "bg-amber-400 text-zinc-950 ring-2 ring-amber-300 shadow-lg shadow-amber-400/40 z-10 scale-[1.02]"
                        : "bg-violet-600/30 text-violet-200 border border-violet-500/40 hover:bg-violet-600/50"
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`Subtitle: "${block.text}" (${formatTimecode(block.start)} - ${formatTimecode(block.end)})${
                      block.isDeleted ? " [CUT]" : ""
                    }`}
                  >
                    <span className="truncate flex items-center gap-1">
                      <Sparkles className={`h-2.5 w-2.5 ${isActive ? "text-zinc-950 fill-zinc-950" : "text-amber-400"}`} />
                      {block.words.map((bw) => (
                        <span
                          key={bw.id}
                          className={bw.deleted ? "line-through text-rose-400/60" : ""}
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

          {/* TRACK 2: Video Filmstrip Clip Strip (VN Signature Clips with Sprockets & Handles) */}
          <div
            className={`h-14 relative w-full bg-[#0e0e14] rounded-lg border border-indigo-500/30 overflow-hidden flex items-center transition-opacity ${
              trackStates.video.visible ? "opacity-100" : "opacity-20 pointer-events-none"
            }`}
          >
            {/* VN Sliced Clips with Filmstrip Borders */}
            {videoClips.map((clip, index) => {
              const leftPercent = (clip.start / validDuration) * 100;
              const widthPercent = (clip.duration / validDuration) * 100;
              const isSelected = selectedClipId === clip.id;

              return (
                <div
                  key={clip.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClipId(clip.id);
                  }}
                  className={`absolute top-1 bottom-1 rounded-md overflow-hidden flex flex-col justify-between border transition-all cursor-pointer ${
                    isSelected
                      ? "border-amber-400 bg-[#161625] shadow-lg shadow-amber-500/10 z-10 ring-1 ring-amber-400/50"
                      : "border-indigo-500/40 bg-[#12121e] hover:border-indigo-400/70"
                  }`}
                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                >
                  {/* Top Filmstrip Perforations */}
                  <div className="h-1.5 w-full bg-[#0a0a10] border-b border-white/5 flex items-center justify-around px-1">
                    {Array.from({ length: 8 }).map((_, pi) => (
                      <span key={pi} className="w-1.5 h-1 rounded-[1px] bg-white/20" />
                    ))}
                  </div>

                  {/* Clip Center Info */}
                  <div className="flex-1 flex items-center justify-between px-2">
                    {/* Left Tactile VN Trim Handle */}
                    <div
                      className="w-1.5 h-6 rounded-full bg-indigo-400/60 hover:bg-amber-400 cursor-ew-resize transition-colors"
                      title="Trim In-Point"
                    />

                    <div className="flex items-center gap-1.5 truncate px-1">
                      <Film className="h-3 w-3 text-indigo-400 shrink-0" />
                      <span className="text-[10px] font-mono font-bold text-indigo-200 truncate">
                        Clip {index + 1} &bull; {clip.duration.toFixed(1)}s
                      </span>
                    </div>

                    {/* Right Tactile VN Trim Handle */}
                    <div
                      className="w-1.5 h-6 rounded-full bg-indigo-400/60 hover:bg-amber-400 cursor-ew-resize transition-colors"
                      title="Trim Out-Point"
                    />
                  </div>

                  {/* Bottom Filmstrip Perforations */}
                  <div className="h-1.5 w-full bg-[#0a0a10] border-t border-white/5 flex items-center justify-around px-1">
                    {Array.from({ length: 8 }).map((_, pi) => (
                      <span key={pi} className="w-1.5 h-1 rounded-[1px] bg-white/20" />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Red Cut Zones for deleted words & silence cuts */}
            {cutZones.map((zone) => {
              const leftPercent = Math.max(0, (zone.start / validDuration) * 100);
              const widthPercent = Math.max(0.6, ((zone.end - zone.start) / validDuration) * 100);
              return (
                <div
                  key={zone.id}
                  className="absolute top-1 bottom-1 z-20 bg-rose-950/85 border-x-2 border-rose-500 rounded flex items-center justify-center overflow-hidden pointer-events-none shadow-sm shadow-rose-900/50"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(244,63,94,0.3), rgba(244,63,94,0.3) 4px, transparent 4px, transparent 8px)",
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

            {/* VN Transition Seam Nodes between clips */}
            {seamNodes.map((seam, i) => {
              const leftPercent = (seam.timestamp / validDuration) * 100;
              const tr = seam.transition;
              const cfg = tr ? (TRANSITION_CONFIG_MAP[tr.effect] || { name: tr.effect, iconEmoji: "🌀" }) : null;
              const isPopoverOpen = activePopoverSeamId === seam.id;
              const tooltipText = tr
                ? `Transition: ${cfg?.name || "Transition"} (${tr.duration.toFixed(1)}s)${tr.aiSuggested ? " [AI Auto-Matched]" : ""}`
                : `Cut Seam at ${formatTimecode(seam.timestamp)} - Click to add transition`;

              return (
                <div
                  key={seam.id}
                  className="absolute top-0 bottom-0 z-30 flex items-center justify-center -translate-x-1/2 pointer-events-auto group/seam"
                  style={{ left: `${leftPercent}%` }}
                >
                  {/* Seam Cut Line */}
                  <div
                    className={`w-[2px] h-full transition-all ${
                      tr
                        ? "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)]"
                        : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                    }`}
                  />

                  {/* VN Transition Pill Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTransitionId(`trans-${i}`);
                      if (tr) {
                        onSelectTransition?.(tr.id);
                      }
                      setActivePopoverSeamId(isPopoverOpen ? null : seam.id);
                    }}
                    className={`absolute w-5 h-5 rounded-lg flex items-center justify-center shadow-lg transition-transform hover:scale-125 cursor-pointer font-bold select-none ${
                      tr
                        ? tr.aiSuggested
                          ? "bg-gradient-to-tr from-cyan-400 to-indigo-500 text-black border border-cyan-200 shadow-cyan-500/50 text-[10px]"
                          : "bg-cyan-400 text-black border border-cyan-300 shadow-cyan-400/50 text-[10px]"
                        : "bg-[#181822] text-zinc-400 hover:text-cyan-300 border border-white/20 hover:border-cyan-400 text-[10px]"
                    }`}
                    title={tooltipText}
                  >
                    {tr ? cfg?.iconEmoji : "⋈"}
                  </button>

                  {/* Inline Mini-Picker Popover */}
                  {isPopoverOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-50 w-72 rounded-2xl bg-[#101016]/95 backdrop-blur-xl border border-cyan-500/30 p-3 shadow-2xl shadow-black flex flex-col gap-2.5 animate-in fade-in zoom-in-95 pointer-events-auto"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">⚡</span>
                          <span className="text-xs font-bold text-white">Cut Seam Transition</span>
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-300">
                            {formatTimecode(seam.timestamp)}
                          </span>
                        </div>
                        <button
                          onClick={() => setActivePopoverSeamId(null)}
                          className="p-1 text-zinc-400 hover:text-white rounded-md transition-colors cursor-pointer text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Current transition status */}
                      {tr && (
                        <div className="p-2 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{cfg?.iconEmoji}</span>
                            <div>
                              <span className="text-xs font-bold text-cyan-300 block leading-tight">{cfg?.name}</span>
                              <span className="text-[9px] text-zinc-400">{tr.duration}s {tr.aiSuggested ? "• AI Auto-Matched" : ""}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (onRemoveTransition) {
                                onRemoveTransition(tr.id);
                              } else {
                                onUpdateTransitions?.(transitions.filter((t) => t.id !== tr.id));
                              }
                              playProceduralSfx("whoosh");
                              setActivePopoverSeamId(null);
                            }}
                            className="text-[10px] text-zinc-400 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                            title="Remove transition"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {/* Quick-Swap 8 Transitions Grid */}
                      <div>
                        <span className="text-[10px] font-semibold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                          Swap Effect
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {TRANSITION_EFFECTS_CATALOG.map((ef) => {
                            const isActive = tr?.effect === ef.id;
                            return (
                              <button
                                key={ef.id}
                                onClick={() => {
                                  if (onAddOrChangeTransitionAtTime) {
                                    onAddOrChangeTransitionAtTime(seam.timestamp, ef.id, ef.defaultDuration);
                                  } else if (onUpdateTransitions) {
                                    const filtered = transitions.filter(
                                      (t) => Math.abs(t.timestamp - seam.timestamp) > 0.35
                                    );
                                    const newTr: TransitionItem = {
                                      id: tr?.id || `tr-seam-${Date.now().toString(36)}`,
                                      timestamp: parseFloat(seam.timestamp.toFixed(2)),
                                      effect: ef.id,
                                      duration: ef.defaultDuration,
                                      aiSuggested: false,
                                    };
                                    onUpdateTransitions([...filtered, newTr].sort((a, b) => a.timestamp - b.timestamp));
                                  }
                                  playProceduralSfx(ef.sfxCue || "whoosh");
                                  setActivePopoverSeamId(null);
                                }}
                                className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                                  isActive
                                    ? "bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-sm"
                                    : "bg-[#181824] hover:bg-[#202030] border-white/5 text-zinc-300 hover:text-white"
                                }`}
                                title={`${ef.name} (${ef.tagline})`}
                              >
                                <span className="text-base">{ef.iconEmoji}</span>
                                <span className="text-[9px] font-semibold truncate max-w-[50px]">{ef.name.split(" ")[0]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Open Transitions in Inspector Button */}
                      {onOpenTransitionsTab && (
                        <button
                          onClick={() => {
                            onOpenTransitionsTab();
                            setActivePopoverSeamId(null);
                          }}
                          className="w-full py-1 px-2 rounded-lg text-[10px] font-semibold text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 transition-all cursor-pointer text-center"
                        >
                          Configure All in Transitions Tab →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Punch Zoom Highlight Overlays on Video Track */}
            {punchZoomIntervals.map((zoom) => {
              const leftPercent = (zoom.start / validDuration) * 100;
              const widthPercent = Math.max(1.8, ((zoom.end - zoom.start) / validDuration) * 100);
              const isZoomActive = currentTime >= zoom.start && currentTime <= zoom.end;

              return (
                <div
                  key={`track-zoom-${zoom.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(zoom.start);
                  }}
                  className={`absolute top-0.5 bottom-0.5 z-25 rounded-md flex items-center justify-center px-1 border transition-all cursor-pointer ${
                    isZoomActive
                      ? "bg-amber-400/35 border-amber-300 ring-2 ring-amber-400/80 shadow-lg shadow-amber-400/30"
                      : "bg-amber-500/20 border-amber-400/40 hover:bg-amber-500/30"
                  }`}
                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                  title={`Punch Zoom ${zoom.scale}x [${formatTimecode(zoom.start)} - ${formatTimecode(zoom.end)}]`}
                >
                  <span className="text-[8px] font-black font-mono text-amber-200 flex items-center gap-0.5 truncate drop-shadow">
                    <Zap className="h-2.5 w-2.5 fill-amber-300 text-amber-300 shrink-0" />
                    {widthPercent > 3 && <span>{zoom.scale}x ZOOM</span>}
                  </span>
                </div>
              );
            })}
          </div>

          {/* TRACK 3: Audio Waveform Track (A1 Dialogue) */}
          <div
            className={`h-11 relative w-full bg-[#0c0c11] rounded-lg border border-emerald-500/20 overflow-hidden flex items-center px-1 transition-opacity ${
              trackStates.dialogue.visible ? "opacity-100" : "opacity-20 pointer-events-none"
            }`}
          >
            {/* Decibel Baseline */}
            <div className="absolute left-0 right-0 top-1/2 h-px bg-emerald-500/20 pointer-events-none" />

            <div className="w-full h-full flex items-center gap-[2px]">
              {waveformBars.map((bar, idx) => (
                <div key={idx} className="flex-1 flex items-center justify-center h-full">
                  <div
                    className={`w-full rounded-full transition-all ${
                      bar.isSilence
                        ? "bg-rose-500/25"
                        : "bg-gradient-to-t from-emerald-600 via-teal-400 to-emerald-400 opacity-90 hover:opacity-100"
                    }`}
                    style={{ height: `${bar.height}%` }}
                  />
                </div>
              ))}
            </div>

            {/* Silence Marker badge */}
            {silenceCount > 0 && (
              <div className="absolute right-2 top-1 text-[9px] font-mono text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30 backdrop-blur-sm pointer-events-none">
                ⚡ {silenceCount} silent pauses
              </div>
            )}
          </div>

          {/* SCRUBBABLE PLAYHEAD NEEDLE (Premiere Pro / VN signature) */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-40 transition-none"
            style={{ left: `${playheadPercent}%` }}
          >
            {/* Top Needle Diamond */}
            <div className="w-3.5 h-3.5 -ml-[6px] bg-rose-500 rotate-45 shadow-[0_0_10px_rgba(244,63,94,0.9)] flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-white" />
            </div>
            {/* Vertical Laser Needle Line */}
            <div className="w-[2px] h-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] -ml-[1px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
