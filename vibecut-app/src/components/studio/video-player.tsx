"use client";

import React, { useRef, useState, useEffect, useCallback, MouseEvent, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  FastForward,
  Rewind,
  Smartphone,
  Monitor,
  Square,
  Shield,
  Type,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  RotateCw,
  UploadCloud,
} from "lucide-react";
import { formatTimecode } from "@/lib/studio-utils";
import { AspectRatioMode, StudioWord, CaptionStyle, TimelineCut } from "@/types/studio";

interface VideoPlayerProps {
  src: string;
  aspectRatio: AspectRatioMode;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  playerRef?: React.RefObject<HTMLVideoElement | null>;
  words?: StudioWord[];
  cuts?: TimelineCut[];
  captionStyle?: CaptionStyle;
  showCaptions?: boolean;
  onToggleCaptions?: () => void;
  onAttachLocalFile?: (file: File) => void;
}

export function VideoPlayer({
  src,
  aspectRatio,
  onTimeUpdate,
  onDurationChange,
  playerRef: externalRef,
  words = [],
  cuts = [],
  captionStyle = "hormozi",
  showCaptions = true,
  onToggleCaptions,
  onAttachLocalFile,
}: VideoPlayerProps) {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = externalRef || localRef;
  const localFileInputRef = useRef<HTMLInputElement | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [captionsVisible, setCaptionsVisible] = useState(showCaptions);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Clear errors and reload when src changes
  useEffect(() => {
    setVideoError(null);
    if (videoRef.current && src) {
      videoRef.current.load();
    }
  }, [src, videoRef]);

  const handleRetryStream = () => {
    setVideoError(null);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };

  // Prevent repeated seek triggers on the same skip target
  const lastSkippedTimeRef = useRef<number>(-1);

  // Merge deleted words and timeline cuts into sorted, unified non-overlapping intervals
  const mergedCutIntervals = useMemo(() => {
    const raw: { start: number; end: number }[] = [];

    // Add deleted words
    if (words && words.length > 0) {
      for (const w of words) {
        if (w.deleted && w.end > w.start) {
          raw.push({ start: w.start, end: w.end });
        }
      }
    }

    // Add timeline cuts
    if (cuts && cuts.length > 0) {
      for (const c of cuts) {
        if (c.end > c.start) {
          raw.push({ start: c.start, end: c.end });
        }
      }
    }

    if (raw.length === 0) return [];

    // Sort by start time ascending
    raw.sort((a, b) => a.start - b.start);

    // Merge overlapping or immediately contiguous intervals (within 0.02s threshold)
    const merged: { start: number; end: number }[] = [raw[0]];
    for (let i = 1; i < raw.length; i++) {
      const prev = merged[merged.length - 1];
      const cur = raw[i];
      if (cur.start <= prev.end + 0.02) {
        prev.end = Math.max(prev.end, cur.end);
      } else {
        merged.push({ ...cur });
      }
    }
    return merged;
  }, [words, cuts]);

  // Real-time cut skipping logic: checks if current playback time is inside any cut/deleted word
  const checkAndSkipCuts = useCallback(
    (time: number): number => {
      if (!videoRef.current || mergedCutIntervals.length === 0) return time;

      for (const interval of mergedCutIntervals) {
        // If currentTime falls inside a deleted word or timeline cut interval
        if (time >= interval.start && time < interval.end) {
          const nextTime = interval.end;

          // Prevent infinite re-seek loop if we're already at or extremely close to the skip target
          if (Math.abs(lastSkippedTimeRef.current - nextTime) < 0.02) {
            return time;
          }

          lastSkippedTimeRef.current = nextTime;

          if (duration > 0 && nextTime >= duration) {
            videoRef.current.currentTime = duration;
            videoRef.current.pause();
            setIsPlaying(false);
            setCurrentTime(duration);
            onTimeUpdate?.(duration);
            return duration;
          }

          videoRef.current.currentTime = nextTime;
          setCurrentTime(nextTime);
          onTimeUpdate?.(nextTime);
          return nextTime;
        }
      }
      return time;
    },
    [mergedCutIntervals, duration, onTimeUpdate, videoRef]
  );

  // Sub-frame animation loop for ultra-smooth instantaneous cut skipping during playback
  useEffect(() => {
    if (!isPlaying || mergedCutIntervals.length === 0) return;

    let animId: number;
    const tick = () => {
      if (videoRef.current && !videoRef.current.paused) {
        const curr = videoRef.current.currentTime;
        checkAndSkipCuts(curr);
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, mergedCutIntervals, checkAndSkipCuts, videoRef]);

  useEffect(() => {
    setCaptionsVisible(showCaptions);
  }, [showCaptions]);

  // Play / Pause toggle with safe Promise handling
  const togglePlay = useCallback(() => {
    if (!videoRef.current || !src || videoError) return;
    if (videoRef.current.paused) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err: unknown) => {
            if (err instanceof Error && err.name === "AbortError") return;
            console.warn("Playback interrupted or delayed:", err);
          });
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [videoRef, src, videoError]);

  // Keyboard shortcut: Spacebar toggles play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  // Handle time update from video
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const validTime = checkAndSkipCuts(curr);
    setCurrentTime(validTime);
    onTimeUpdate?.(validTime);
  };

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (dur && !isNaN(dur)) {
      setDuration(dur);
      onDurationChange?.(dur);
    }
  };

  // Seek on progress bar click
  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    let newTime = percentage * duration;

    // If seeking directly into a cut or deleted word, advance to the end of the cut
    for (const interval of mergedCutIntervals) {
      if (newTime >= interval.start && newTime < interval.end) {
        newTime = Math.min(duration, interval.end);
        break;
      }
    }

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    onTimeUpdate?.(newTime);
  };

  // Skip +/- 5 seconds
  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    let newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    for (const interval of mergedCutIntervals) {
      if (newTime >= interval.start && newTime < interval.end) {
        newTime = Math.min(duration, interval.end);
        break;
      }
    }
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    onTimeUpdate?.(newTime);
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Change Volume
  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  // Toggle Playback rate
  const cyclePlaybackRate = () => {
    if (!videoRef.current) return;
    const rates = [1, 1.25, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    videoRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  // Calculate current active kinetic subtitle phrase and active word
  const currentCaptionGroup = useMemo(() => {
    if (!words || words.length === 0) return null;

    // Find all non-deleted words
    const activeWords = words.filter((w) => !w.deleted);
    if (activeWords.length === 0) return null;

    // 1. Find direct active word at currentTime
    let currentIndex = activeWords.findIndex(
      (w) => currentTime >= w.start && currentTime <= w.end
    );

    // 2. If in a brief pause between words, hold the previous word active for up to 0.8s
    if (currentIndex === -1) {
      for (let i = activeWords.length - 1; i >= 0; i--) {
        if (currentTime >= activeWords[i].end && currentTime <= activeWords[i].end + 0.8) {
          currentIndex = i;
          break;
        }
      }
    }

    if (currentIndex === -1) {
      return null;
    }

    // Create a 3-4 word window centered around current word
    const CHUNK_SIZE = 4;
    const startIdx = Math.floor(currentIndex / CHUNK_SIZE) * CHUNK_SIZE;
    const endIdx = Math.min(startIdx + CHUNK_SIZE, activeWords.length);
    const phraseWords = activeWords.slice(startIdx, endIdx);
    const highlightedIndex = phraseWords.findIndex((w) => w.id === activeWords[currentIndex].id);

    return { phraseWords, highlightedIndex };
  }, [words, currentTime]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full h-full p-2 select-none"
    >
      {/* Outer Master Video Frame with bezel */}
      <div
        className={`relative overflow-hidden transition-all duration-300 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.85)] ${
          aspectRatio === "9:16"
            ? "h-[calc(100%-60px)] max-h-[520px] aspect-[9/16] rounded-[28px] border-[3px] border-[#2a2a35] bg-black ring-1 ring-white/10"
            : aspectRatio === "1:1"
            ? "h-[calc(100%-60px)] max-h-[460px] aspect-square rounded-2xl border-2 border-[#2a2a35] bg-black"
            : "h-[calc(100%-60px)] max-h-[440px] aspect-video rounded-2xl border-2 border-[#2a2a35] bg-black"
        }`}
      >
        {/* Smartphone Camera Notch for 9:16 */}
        {aspectRatio === "9:16" && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-20 h-3 rounded-full bg-black/90 border border-white/10 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
          </div>
        )}

        {/* Hidden file input for attaching local file directly */}
        <input
          ref={localFileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && onAttachLocalFile) {
              setVideoError(null);
              onAttachLocalFile(f);
            }
          }}
        />

        {/* Video Element */}
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-contain cursor-pointer"
          playsInline
          preload="auto"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            setVideoError(null);
            handleLoadedMetadata();
          }}
          onCanPlay={() => {
            setVideoError(null);
          }}
          onError={() => {
            // If duration already loaded or video has frames, ignore transient network skips
            if (duration > 0 || (videoRef.current && videoRef.current.readyState >= 1)) {
              return;
            }
            const err = videoRef.current?.error;
            console.warn("Video stream load notice:", err?.code, err?.message);
            setVideoError("Cloud video stream buffering or reconnecting.");
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Video Error Fallback Card with Interactive Recovery */}
        {videoError && (
          <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
              <AlertCircle className="h-6 w-6 text-amber-400" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Stream Notice</h4>
            <p className="text-xs text-zinc-400 max-w-xs mb-4 leading-relaxed">{videoError}</p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={handleRetryStream}
                className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-violet-600/30 transition-all cursor-pointer active:scale-95"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Retry Stream</span>
              </button>

              {onAttachLocalFile && (
                <button
                  onClick={() => localFileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer active:scale-95"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-amber-400" />
                  <span>Choose Local File</span>
                </button>
              )}

              <button
                onClick={() => setVideoError(null)}
                className="px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 text-xs transition-colors cursor-pointer"
                title="Dismiss notice"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Center Big Play Button Overlay on Pause */}
        {!isPlaying && !videoError && (
          <button
            onClick={togglePlay}
            className="absolute z-20 w-16 h-16 rounded-full bg-violet-600/90 hover:bg-violet-500 text-white flex items-center justify-center shadow-2xl shadow-violet-600/50 hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-sm"
          >
            <Play className="h-7 w-7 fill-white translate-x-0.5" />
          </button>
        )}

        {/* Top Floating Format Indicator */}
        <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-zinc-300 flex items-center gap-1.5">
          {aspectRatio === "9:16" ? (
            <>
              <Smartphone className="h-3 w-3 text-amber-400" />
              <span>9:16 Shorts/Reels</span>
            </>
          ) : aspectRatio === "1:1" ? (
            <>
              <Square className="h-3 w-3 text-emerald-400" />
              <span>1:1 Square</span>
            </>
          ) : (
            <>
              <Monitor className="h-3 w-3 text-violet-400" />
              <span>16:9 YouTube</span>
            </>
          )}
        </div>

        {/* LIVE KINETIC SUBTITLE OVERLAY (Hormozi / Viral Subtitle Engine) */}
        {captionsVisible && currentCaptionGroup && currentCaptionGroup.phraseWords.length > 0 && (
          <div
            className={`absolute z-20 pointer-events-none transition-all duration-100 flex flex-wrap items-center justify-center text-center px-4 max-w-[85%] ${
              aspectRatio === "9:16" ? "bottom-[22%]" : "bottom-[14%]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              {currentCaptionGroup.phraseWords.map((wordObj, i) => {
                const isWordHighlighted = i === currentCaptionGroup.highlightedIndex;

                if (captionStyle === "cyber") {
                  return (
                    <span
                      key={wordObj.id}
                      className={`font-black uppercase tracking-wider transition-all duration-100 text-base sm:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] ${
                        isWordHighlighted
                          ? "text-[#38BDF8] scale-110 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)] font-extrabold"
                          : "text-white"
                      }`}
                      style={{ textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000" }}
                    >
                      {wordObj.word}
                    </span>
                  );
                }

                if (captionStyle === "beast") {
                  return (
                    <span
                      key={wordObj.id}
                      className={`font-black uppercase tracking-tight transition-all duration-100 text-base sm:text-xl drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)] ${
                        isWordHighlighted
                          ? "bg-[#FACC15] text-zinc-950 px-1.5 py-0.5 rounded-md scale-115 rotate-[-1deg] shadow-lg shadow-amber-400/50"
                          : "text-white"
                      }`}
                      style={{ textShadow: isWordHighlighted ? "none" : "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000" }}
                    >
                      {wordObj.word}
                    </span>
                  );
                }

                // Default: Hormozi Style
                return (
                  <span
                    key={wordObj.id}
                    className={`font-black uppercase tracking-wide transition-all duration-100 text-base sm:text-xl drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)] ${
                      isWordHighlighted
                        ? "text-[#FACC15] scale-115 font-black drop-shadow-[0_0_16px_rgba(250,204,21,0.9)]"
                        : "text-white/95"
                    }`}
                    style={{
                      textShadow:
                        "3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 3px 0 0 #000, -3px 0 0 #000",
                    }}
                  >
                    {wordObj.word}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional Safe-Area UI Guides for Instagram Reels / TikTok */}
        {showSafeArea && aspectRatio === "9:16" && (
          <div className="absolute inset-0 z-20 pointer-events-none border border-dashed border-red-500/40 p-4 flex flex-col justify-between">
            {/* Top header safe bar */}
            <div className="w-full flex items-center justify-between text-[9px] font-mono text-zinc-400/80 bg-red-500/10 px-2 py-1 rounded">
              <span>Following | For You</span>
              <span className="text-red-400 font-bold">TOP UI ZONE</span>
            </div>

            {/* Middle Safe Zone boundary */}
            <div className="w-full h-36 border border-emerald-500/30 rounded-lg flex items-center justify-center text-[10px] font-mono text-emerald-400/80 bg-emerald-500/5">
              <span>OPTIMAL CAPTION & HOOK ZONE (Safe from all UI overlaps)</span>
            </div>

            {/* Bottom & Right UI guides */}
            <div className="w-full flex items-end justify-between text-[9px] font-mono text-zinc-400/80">
              <div className="bg-red-500/10 p-1.5 rounded max-w-[65%] text-[8px] text-red-300">
                @creator_handle • Caption text area (Avoid placing subtitles here)
              </div>
              <div className="bg-red-500/10 p-1 rounded flex flex-col gap-1 items-center text-[7px] text-red-300">
                <span>❤️</span>
                <span>💬</span>
                <span>↗️</span>
                <span>🎵</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Under-Video Transport Dock */}
      <div className="w-full max-w-[720px] mt-2 px-3 py-2 rounded-xl bg-[#14141a]/95 border border-white/[0.08] shadow-xl backdrop-blur-md flex flex-col gap-1.5 z-30">
        {/* Scrubbable Mini Seeker */}
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          className="relative w-full h-1.5 bg-zinc-800 rounded-full cursor-pointer group/bar flex items-center hover:h-2 transition-all"
        >
          <div
            className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-amber-400 rounded-full relative"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full shadow-md scale-0 group-hover/bar:scale-100 transition-transform" />
          </div>
        </div>

        {/* Transport Buttons Row */}
        <div className="flex items-center justify-between text-zinc-300">
          {/* Left: Playback & Precision Timecode */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={togglePlay}
              className="p-1 hover:bg-white/[0.08] rounded-md text-white hover:text-amber-400 transition-colors cursor-pointer"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            </button>

            <button
              onClick={() => skip(-5)}
              className="p-1 hover:bg-white/[0.08] rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Rewind 5s"
            >
              <Rewind className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => skip(5)}
              className="p-1 hover:bg-white/[0.08] rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Forward 5s"
            >
              <FastForward className="h-3.5 w-3.5" />
            </button>

            {/* High Precision Timecode & 60 FPS Readout */}
            <div className="text-[11px] font-mono text-zinc-300 ml-1 flex items-center gap-1 font-medium">
              <span className="text-amber-400 font-bold">{formatTimecode(currentTime)}</span>
              <span className="text-zinc-600">/</span>
              <span>{formatTimecode(duration)}</span>
              <span className="hidden sm:inline-block text-[9px] font-bold text-zinc-500 bg-zinc-800/80 px-1 py-0.2 rounded ml-1">
                60 FPS
              </span>
            </div>
          </div>

          {/* Right: Safe Area Toggle, Captions Toggle, Speed, Volume, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Safe Area Guides Toggle */}
            <button
              onClick={() => setShowSafeArea(!showSafeArea)}
              className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                showSafeArea
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              }`}
              title="Toggle TikTok / Reels Safe-Area Overlay"
            >
              <Shield className="h-3.5 w-3.5" />
            </button>

            {/* Kinetic Captions Toggle */}
            <button
              onClick={() => {
                const next = !captionsVisible;
                setCaptionsVisible(next);
                onToggleCaptions?.();
              }}
              className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                captionsVisible
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]"
              }`}
              title="Toggle Live Kinetic Subtitles Overlay"
            >
              <Type className="h-3.5 w-3.5" />
            </button>

            {/* Volume scrubbing */}
            <div className="flex items-center gap-1 group/vol">
              <button
                onClick={toggleMute}
                className="p-1 hover:bg-white/[0.08] rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-14 h-1 bg-zinc-700 accent-violet-500 rounded cursor-pointer hidden md:block"
              />
            </div>

            {/* Playback speed cycle */}
            <button
              onClick={cyclePlaybackRate}
              className="px-1.5 py-0.5 hover:bg-white/[0.08] rounded text-[10px] font-mono font-bold text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer"
              title="Playback speed"
            >
              {playbackRate}x
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1 hover:bg-white/[0.08] rounded-md text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
