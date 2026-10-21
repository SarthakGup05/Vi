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
import {
  AspectRatioMode,
  StudioWord,
  CaptionStyle,
  CaptionPosition,
  WordsPerLine,
  CaptionSettings,
  TimelineCut,
  PunchZoomInterval,
  PunchZoomCadence,
  VFXSettings,
  SFXSettings,
} from "@/types/studio";
import { motion, AnimatePresence } from "framer-motion";
import {
  chunkTranscriptWords,
  getEmojiForWord,
  getCaptionPositionClasses,
  getCaptionFontSizeClasses,
  DEFAULT_CAPTION_SETTINGS,
} from "@/lib/caption-engine";
import { getVFXFilterStyle, getVFXOverlayFlags } from "@/lib/vfx-engine";
import { playSFX } from "@/lib/sfx-engine";

interface VideoPlayerProps {
  src: string;
  aspectRatio: AspectRatioMode;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  playerRef?: React.RefObject<HTMLVideoElement | null>;
  words?: StudioWord[];
  cuts?: TimelineCut[];
  captionStyle?: CaptionStyle;
  captionPosition?: CaptionPosition;
  wordsPerLine?: WordsPerLine;
  highlightColor?: string;
  autoEmoji?: boolean;
  captionSettings?: CaptionSettings;
  showCaptions?: boolean;
  onToggleCaptions?: () => void;
  onAttachLocalFile?: (file: File) => void;
  vfxSettings?: VFXSettings;
  sfxSettings?: SFXSettings;
  punchZooms?: PunchZoomInterval[];
  zoomCadence?: PunchZoomCadence;
  zoomIntervals?: PunchZoomInterval[];
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
  captionPosition = "bottom",
  wordsPerLine = 3,
  highlightColor = "#FACC15",
  autoEmoji = true,
  captionSettings,
  showCaptions = true,
  onToggleCaptions,
  onAttachLocalFile,
  vfxSettings,
  sfxSettings,
  punchZooms,
  zoomIntervals,
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

  const effectivePunchZooms = punchZooms || zoomIntervals || [];

  // Active Punch Zooms & Camera Zoom Matrix
  const activeZoom = useMemo(() => {
    if (!effectivePunchZooms || effectivePunchZooms.length === 0) return null;
    return effectivePunchZooms.find((z) => currentTime >= z.start && currentTime < z.end) || null;
  }, [effectivePunchZooms, currentTime]);

  const zoomScale = activeZoom ? (activeZoom.scale || 1.15) : 1.0;
  const zoomOrigin =
    activeZoom?.originX !== undefined && activeZoom?.originY !== undefined
      ? `${activeZoom.originX}% ${activeZoom.originY}%`
      : "50% 50%";

  // Visual FX & CSS Filter Styles
  const vfxOverlayFlags = useMemo(() => {
    return getVFXOverlayFlags(vfxSettings);
  }, [vfxSettings]);

  const vfxFilterStyle = useMemo(() => {
    return getVFXFilterStyle(vfxSettings);
  }, [vfxSettings]);

  // SFX Trigger references
  const lastTriggeredZoomIdRef = useRef<string | null>(null);
  const lastEmojiWordKeyRef = useRef<string | null>(null);

  // Trigger SFX sound cues on Punch Zoom entrance (whoosh or 808 boom on emphasis)
  useEffect(() => {
    if (!isPlaying || !sfxSettings?.enabled) return;
    if (activeZoom) {
      if (activeZoom.id !== lastTriggeredZoomIdRef.current) {
        lastTriggeredZoomIdRef.current = activeZoom.id;
        if (activeZoom.reason === "emphasis" || activeZoom.isEmphasis) {
          if (sfxSettings.emphasisImpact) {
            playSFX("boom", sfxSettings.masterVolume, isMuted);
          }
        } else if (sfxSettings.zoomWhoosh) {
          playSFX("whoosh", (sfxSettings.masterVolume || 0.6) * 0.8, isMuted);
        }
      }
    } else {
      lastTriggeredZoomIdRef.current = null;
    }
  }, [activeZoom, isPlaying, sfxSettings, isMuted]);


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

          if (sfxSettings?.enabled && sfxSettings.cutWhoosh && isPlaying) {
            playSFX("whoosh", (sfxSettings.masterVolume || 0.6) * 0.75, isMuted);
          }

          return nextTime;
        }
      }
      return time;
    },
    [mergedCutIntervals, duration, onTimeUpdate, videoRef, sfxSettings, isPlaying, isMuted]
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

  // Calculate effective caption settings
  const effectiveCaptionSettings: CaptionSettings = useMemo(() => {
    return {
      style: captionSettings?.style || captionStyle || "hormozi",
      position: captionSettings?.position || captionPosition || "bottom",
      wordsPerLine: captionSettings?.wordsPerLine || wordsPerLine || 3,
      highlightColor: captionSettings?.highlightColor || highlightColor || "#FACC15",
      autoEmoji:
        captionSettings?.autoEmoji !== undefined
          ? captionSettings.autoEmoji
          : autoEmoji !== undefined
          ? autoEmoji
          : true,
      fontSize: captionSettings?.fontSize || "lg",
    };
  }, [
    captionSettings,
    captionStyle,
    captionPosition,
    wordsPerLine,
    highlightColor,
    autoEmoji,
  ]);

  // Calculate current active kinetic subtitle phrase, active word, and contextual emoji
  const currentCaptionGroup = useMemo(() => {
    if (!words || words.length === 0) return null;
    const chunkSize = effectiveCaptionSettings.wordsPerLine || 3;
    return chunkTranscriptWords(words, currentTime, chunkSize);
  }, [words, currentTime, effectiveCaptionSettings.wordsPerLine]);

  // Trigger SFX sound cues on contextual emoji appearance
  useEffect(() => {
    if (!isPlaying || !sfxSettings?.enabled || !sfxSettings.emojiPop) return;
    if (currentCaptionGroup?.activeWord) {
      const emoji = effectiveCaptionSettings.autoEmoji
        ? getEmojiForWord(currentCaptionGroup.activeWord.word)
        : null;
      if (emoji) {
        const key = `${currentCaptionGroup.activeWord.id}-${emoji}`;
        if (lastEmojiWordKeyRef.current !== key) {
          lastEmojiWordKeyRef.current = key;
          playSFX("pop", (sfxSettings.masterVolume || 0.6) * 0.7, isMuted);
        }
      }
    }
  }, [currentCaptionGroup, isPlaying, sfxSettings, isMuted, effectiveCaptionSettings.autoEmoji]);

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

        {/* Real-time Camera Punch Zoom Transform Container */}
        <div
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: zoomOrigin,
            transition: "transform 0.18s cubic-bezier(0.2, 0, 0, 1)",
          }}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-contain cursor-pointer"
            style={vfxFilterStyle}
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
        </div>

        {/* ACTIVE VFX OVERLAY LAYERS: film_grain, rgb_split, vhs_retro, cyber_scan, letterbox_cinematic */}
        {/* 1. 35mm Film Grain SVG (film_grain) */}
        {vfxOverlayFlags.showGrain && (
          <div
            data-vfx="film_grain"
            className="absolute inset-0 pointer-events-none z-20 opacity-25 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.7'/%3E%3C/svg%3E")`,
            }}
          />
        )}

        {/* 2. Cyber CRT Scanlines (cyber_scan) */}
        {vfxOverlayFlags.showScanlines && (
          <div
            data-vfx="cyber_scan"
            className="absolute inset-0 pointer-events-none z-20 opacity-30 mix-blend-overlay"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45) 1px, transparent 1px, transparent 3px)",
            }}
          />
        )}

        {/* 3. RGB Split Chromatic Aberration fringe on punch zoom (rgb_split) */}
        {vfxOverlayFlags.showRgbSplit && activeZoom && (
          <div
            data-vfx="rgb_split"
            className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-40 transition-opacity duration-150"
            style={{
              boxShadow:
                "inset 5px 0 12px rgba(239, 68, 68, 0.4), inset -5px 0 12px rgba(56, 189, 248, 0.4)",
            }}
          />
        )}

        {/* 4. 2.39:1 Anamorphic Letterbox Cinematic Bars (letterbox_cinematic) */}
        {vfxOverlayFlags.showLetterbox && (
          <div data-vfx="letterbox_cinematic" className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between">
            <div className="w-full bg-black shadow-md" style={{ height: "12%" }} />
            <div className="w-full bg-black shadow-md" style={{ height: "12%" }} />
          </div>
        )}

        {/* 5. Vintage 90s VHS Camcorder OSD HUD (vhs_retro) */}
        {vfxOverlayFlags.showVhsHud && (
          <div data-vfx="vhs_retro" className="absolute inset-0 pointer-events-none z-25 p-4 flex flex-col justify-between text-[#22c55e] font-mono select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            <div className="w-full flex items-center justify-between text-xs tracking-widest font-black">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span className="text-red-500 font-extrabold tracking-wider">REC</span>
              </div>
              <div className="text-zinc-200 text-[11px] font-mono bg-black/40 px-2 py-0.5 rounded border border-white/10">
                PLAY ▶ <span className="text-emerald-400">SP</span>
              </div>
            </div>

            <div className="w-full h-0.5 bg-white/20 opacity-40 blur-[0.5px] animate-pulse" />

            <div className="w-full flex items-end justify-between text-[11px] tracking-wider text-zinc-300 font-mono">
              <div className="flex flex-col">
                <span className="text-amber-300 text-[10px]">TAPE 01</span>
                <span className="font-bold text-white text-xs">{formatTimecode(currentTime)}</span>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[9px] text-zinc-400">AUTO-TRACK</span>
                <span className="text-emerald-400 text-[10px] font-bold">STEREO Hi-Fi</span>
              </div>
            </div>
          </div>
        )}

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

        {/* LIVE KINETIC SUBTITLE OVERLAY (Kinetic Captions & Contextual Auto-Emoji Engine) */}
        {captionsVisible && currentCaptionGroup && currentCaptionGroup.phraseWords.length > 0 && (
          <div
            className={`absolute z-20 pointer-events-none transition-all duration-150 flex flex-wrap items-center justify-center text-center px-4 max-w-[90%] ${getCaptionPositionClasses(
              effectiveCaptionSettings.position,
              aspectRatio
            )}`}
          >
            <div className="relative flex flex-wrap items-center justify-center gap-x-2 gap-y-2.5">
              {currentCaptionGroup.phraseWords.map((wordObj, i) => {
                const isWordHighlighted = i === currentCaptionGroup.activeIndex;
                const highlightColor = effectiveCaptionSettings.highlightColor || "#FACC15";
                const fontSizeClass = getCaptionFontSizeClasses(effectiveCaptionSettings.fontSize);
                const wordEmoji = effectiveCaptionSettings.autoEmoji
                  ? getEmojiForWord(wordObj.word)
                  : null;
                const showEmojiBadge = isWordHighlighted && wordEmoji;

                return (
                  <div key={wordObj.id} className="relative inline-flex flex-col items-center">
                    {/* Contextual Auto-Emoji Floating Pop Badge */}
                    <AnimatePresence>
                      {showEmojiBadge && (
                        <motion.span
                          initial={{ opacity: 0, y: 10, scale: 0.3, rotate: -12 }}
                          animate={{
                            opacity: 1,
                            y: effectiveCaptionSettings.wordsPerLine === 1 ? -32 : -28,
                            scale: [0.3, 1.4, 1.25],
                            rotate: [-12, 6, 0],
                          }}
                          exit={{ opacity: 0, y: -16, scale: 0.5 }}
                          transition={{ type: "spring", stiffness: 550, damping: 20 }}
                          className="absolute pointer-events-none text-2xl sm:text-3xl filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] z-30 select-none"
                        >
                          {wordEmoji}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Word Pop Spring Motion Span */}
                    <motion.span
                      layout
                      animate={{
                        scale: isWordHighlighted
                          ? effectiveCaptionSettings.wordsPerLine === 1
                            ? 1.28
                            : 1.16
                          : 1,
                        y: isWordHighlighted ? -2 : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 480,
                        damping: 24,
                      }}
                      className={getWordStyleClasses(
                        effectiveCaptionSettings.style,
                        isWordHighlighted,
                        fontSizeClass
                      )}
                      style={getWordCustomStyle(
                        effectiveCaptionSettings.style,
                        isWordHighlighted,
                        highlightColor
                      )}
                    >
                      {wordObj.word}
                    </motion.span>
                  </div>
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

function getWordStyleClasses(
  style: CaptionStyle,
  isHighlighted: boolean,
  fontSizeClass: string
): string {
  const base = `${fontSizeClass} transition-colors duration-150 select-none`;
  switch (style) {
    case "beast":
      return isHighlighted
        ? `${base} font-black uppercase tracking-tight text-zinc-950 px-2 py-0.5 rounded-md rotate-[-1.5deg] shadow-xl shadow-black/40`
        : `${base} font-black uppercase tracking-tight text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)]`;
    case "cyber":
      return isHighlighted
        ? `${base} font-black uppercase tracking-wider drop-shadow-[0_0_14px_rgba(56,189,248,0.85)]`
        : `${base} font-black uppercase tracking-wider text-white/90 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]`;
    case "clean":
      return isHighlighted
        ? `${base} font-bold tracking-normal bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm shadow-md`
        : `${base} font-bold tracking-normal text-white/85 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-xs`;
    case "crimson":
      return isHighlighted
        ? `${base} font-black uppercase tracking-tight drop-shadow-[0_0_18px_rgba(239,68,68,0.9)]`
        : `${base} font-black uppercase tracking-tight text-white/95 drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)]`;
    case "hormozi":
    default:
      return isHighlighted
        ? `${base} font-black uppercase tracking-wide drop-shadow-[0_0_16px_rgba(250,204,21,0.9)]`
        : `${base} font-black uppercase tracking-wide text-white/95 drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)]`;
  }
}

function getWordCustomStyle(
  style: CaptionStyle,
  isHighlighted: boolean,
  highlightColor: string
): React.CSSProperties {
  if (style === "beast") {
    if (isHighlighted) {
      return { backgroundColor: highlightColor };
    }
    return {
      textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
    };
  }

  if (style === "clean") {
    if (isHighlighted) {
      return { color: highlightColor };
    }
    return {
      textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
    };
  }

  if (style === "cyber") {
    return {
      color: isHighlighted ? highlightColor : "#FFFFFF",
      textShadow: "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000",
    };
  }

  if (style === "crimson") {
    return {
      color: isHighlighted ? highlightColor : "#FFFFFF",
      textShadow:
        "3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 3px 0 0 #000, -3px 0 0 #000, 0 4px 6px rgba(220,38,38,0.5)",
    };
  }

  // Hormozi default
  return {
    color: isHighlighted ? highlightColor : "#FFFFFF",
    textShadow:
      "3px 3px 0 #000, -3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 3px 0 0 #000, -3px 0 0 #000",
  };
}
