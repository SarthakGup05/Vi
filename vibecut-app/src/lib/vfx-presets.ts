import type {
  TrendingTemplateId,
  TemplatePreset,
  VFXFilterId,
  PunchZoomCadence,
  PunchZoomScale,
  PunchZoomInterval,
  SfxCueId,
  SFXSoundId,
  StudioWord,
  CaptionStyle,
  CaptionPosition,
  WordsPerLine,
  CaptionSettings,
  VFXSettings,
  SFXSettings,
} from "../types/studio";
import { DEFAULT_CAPTION_SETTINGS } from "./caption-engine";

// ============================================================================
// 1. VISUAL FX FILTERS & SVG OVERLAYS CATALOG
// ============================================================================

export interface VfxFilterDefinition {
  id: VFXFilterId;
  name: string;
  label: string;
  tagline: string;
  badge: string;
  cssFilter: string;
  intensityDefault: number;
  hasSvgOverlay: boolean;
  overlayType: "grain" | "rgb" | "vhs" | "cyber" | "letterbox" | "none";
  description: string;
  svgOverlay: string;
  iconName: string;
}

export const VFX_FILTERS: Record<VFXFilterId, VfxFilterDefinition> = {
  none: {
    id: "none",
    name: "Clean / Pass-through",
    label: "None",
    tagline: "Standard Natural Grade",
    badge: "Raw",
    cssFilter: "none",
    intensityDefault: 0,
    hasSvgOverlay: false,
    overlayType: "none",
    description: "No artificial color or texture overlays applied.",
    svgOverlay: "",
    iconName: "Ban",
  },
  film_grain: {
    id: "film_grain",
    name: "35mm Film Grain",
    label: "Film Grain",
    tagline: "Organic Kodak 500T Emulsion",
    badge: "Film",
    cssFilter: "contrast(1.08) brightness(1.02) sepia(0.08)",
    intensityDefault: 70,
    hasSvgOverlay: true,
    overlayType: "grain",
    description: "Subtle micro-texture grain for cinema aesthetic and eliminating digital compression artifacts.",
    svgOverlay: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><filter id="filmGrain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0"/></filter><rect width="100%" height="100%" filter="url(#filmGrain)" opacity="0.6"/></svg>`,
    iconName: "Film",
  },
  rgb_split: {
    id: "rgb_split",
    name: "RGB Glitch Split",
    label: "RGB Split",
    tagline: "Chromatic Color Fringe",
    badge: "Glitch",
    cssFilter: "drop-shadow(-2px 0px 0px rgba(255, 30, 86, 0.75)) drop-shadow(2px 0px 0px rgba(0, 240, 255, 0.75)) contrast(1.05)",
    intensityDefault: 80,
    hasSvgOverlay: true,
    overlayType: "rgb",
    description: "High-octane red/cyan lateral chromatic aberration displacement for hooks and beat drops.",
    svgOverlay: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><filter id="rgbSplit"><feOffset in="SourceGraphic" dx="-3" dy="0" result="red"/><feOffset in="SourceGraphic" dx="3" dy="0" result="cyan"/><feBlend in="red" in2="cyan" mode="screen"/></filter></svg>`,
    iconName: "Zap",
  },
  vhs_retro: {
    id: "vhs_retro",
    name: "Vintage VHS 90s",
    label: "VHS Retro",
    tagline: "Camcorder OSD & Tape Glow",
    badge: "Retro",
    cssFilter: "contrast(1.15) saturate(1.25) hue-rotate(-8deg) sepia(0.18)",
    intensityDefault: 85,
    hasSvgOverlay: true,
    overlayType: "vhs",
    description: "Authentic 1994 camcorder timestamp, blinking REC dot, analog scan jitter, and warm phosphors.",
    svgOverlay: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><pattern id="vhsScanlines" width="100" height="4" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="100" y2="0" stroke="rgba(0,0,0,0.3)" stroke-width="1"/></pattern><rect width="100%" height="100%" fill="url(#vhsScanlines)"/></svg>`,
    iconName: "Tv",
  },
  cyber_scan: {
    id: "cyber_scan",
    name: "Cyber Scanlines",
    label: "Cyber Scan",
    tagline: "Sci-Fi HUD CRT Grid",
    badge: "Cyber",
    cssFilter: "hue-rotate(180deg) saturate(1.35) contrast(1.12)",
    intensityDefault: 75,
    hasSvgOverlay: true,
    overlayType: "cyber",
    description: "Horizontal phosphor raster scanlines with faint neon telemetry vignette.",
    svgOverlay: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><pattern id="cyberGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56,189,248,0.15)" stroke-width="0.5"/></pattern><rect width="100%" height="100%" fill="url(#cyberGrid)"/></svg>`,
    iconName: "Cpu",
  },
  letterbox_cinematic: {
    id: "letterbox_cinematic",
    name: "Cinematic Letterbox",
    label: "Cinematic",
    tagline: "2.39:1 Anamorphic Scope",
    badge: "Cinema",
    cssFilter: "contrast(1.1) saturate(0.92) brightness(0.98)",
    intensityDefault: 100,
    hasSvgOverlay: true,
    overlayType: "letterbox",
    description: "Signature Hollywood black bars creating an ultrawide theatrical aspect framing.",
    svgOverlay: `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="10%" fill="#000000"/><rect y="90%" width="100%" height="10%" fill="#000000"/></svg>`,
    iconName: "Maximize2",
  },
};

export interface VFXFilterConfig {
  id: VFXFilterId;
  name: string;
  tagline: string;
  badge: string;
  description: string;
  iconName: string;
}

export const VFX_FILTERS_CONFIG: VFXFilterConfig[] = Object.values(VFX_FILTERS).map((f) => ({
  id: f.id,
  name: f.name,
  tagline: f.tagline,
  badge: f.badge,
  description: f.description,
  iconName: f.iconName,
}));

/**
 * Returns computed CSS filter string with variable intensity factor (0 to 100)
 */
export function getVfxFilterCss(filterId: VFXFilterId, intensityPercent: number = 100): string {
  const def = VFX_FILTERS[filterId];
  if (!def || def.id === "none") return "none";
  if (intensityPercent <= 0) return "none";

  const factor = Math.min(1, Math.max(0, intensityPercent / 100));

  switch (filterId) {
    case "film_grain": {
      const c = (1 + 0.08 * factor).toFixed(3);
      const b = (1 + 0.02 * factor).toFixed(3);
      const s = (0.08 * factor).toFixed(3);
      return `contrast(${c}) brightness(${b}) sepia(${s})`;
    }
    case "rgb_split": {
      const px = Math.round(2 * factor);
      return `drop-shadow(-${px}px 0px 0px rgba(255, 30, 86, ${0.75 * factor})) drop-shadow(${px}px 0px 0px rgba(0, 240, 255, ${0.75 * factor})) contrast(${1 + 0.05 * factor})`;
    }
    case "vhs_retro": {
      const c = (1 + 0.15 * factor).toFixed(3);
      const sat = (1 + 0.25 * factor).toFixed(3);
      const deg = Math.round(-8 * factor);
      const sep = (0.18 * factor).toFixed(3);
      return `contrast(${c}) saturate(${sat}) hue-rotate(${deg}deg) sepia(${sep})`;
    }
    case "cyber_scan": {
      const deg = Math.round(180 * factor);
      const sat = (1 + 0.35 * factor).toFixed(3);
      const c = (1 + 0.12 * factor).toFixed(3);
      return `hue-rotate(${deg}deg) saturate(${sat}) contrast(${c})`;
    }
    case "letterbox_cinematic": {
      const c = (1 + 0.1 * factor).toFixed(3);
      const sat = (1 - 0.08 * factor).toFixed(3);
      const b = (1 - 0.02 * factor).toFixed(3);
      return `contrast(${c}) saturate(${sat}) brightness(${b})`;
    }
    default:
      return def.cssFilter;
  }
}

// ============================================================================
// 2. 5 TRENDING PRESET TEMPLATES
// ============================================================================

export const TRENDING_TEMPLATES: TemplatePreset[] = [
  {
    id: "cinematic",
    name: "Cinematic VN",
    label: "Cinematic",
    badge: "Trending 🎬",
    platform: "Instagram",
    tagline: "2.39:1 Scope letterbox, emerald clean titles & low sub 808s",
    description: "Sophisticated luxury editorial look with anamorphic widescreen bars, smooth 5s camera drifts, and deep bass impacts.",
    gradient: "from-emerald-500/20 via-teal-600/10 to-cyan-500/20",
    borderClass: "hover:border-emerald-400 border-emerald-500/40",
    accentColor: "#10B981",
    vfxFilter: "letterbox_cinematic",
    captionStyle: "clean",
    captionHighlight: "#FACC15",
    captionHighlightColor: "#FACC15",
    captionPosition: "bottom",
    wordsPerLine: 3,
    autoEmoji: false,
    zoomCadence: "natural_5s",
    punchZoomCadence: "natural_5s",
    zoomScale: 1.15,
    punchZoomScale: 1.15,
    sfxCue: "boom",
    vfx: {
      filter: "letterbox_cinematic",
      intensity: 100,
      letterbox: true,
      grain: false,
      rgbSplit: false,
      scanlines: false,
      vhsHud: false,
      colorGrade: "teal_orange",
    },
    sfx: {
      enabled: true,
      masterVolume: 0.6,
      zoomWhoosh: true,
      cutWhoosh: false,
      emojiPop: false,
      emphasisImpact: true,
    },
  },
  {
    id: "hyper_fast",
    name: "Hyper-Fast VN",
    label: "Hyper-Fast",
    badge: "Viral ⚡",
    platform: "TikTok",
    tagline: "Aggressive 1.15x snap zooms, RGB chromatic split & rapid crimson cuts",
    description: "Ultra-high cadence for sub-20s viral hooks: crimson kinetic fonts, quick pop transitions, and instant visual impact.",
    gradient: "from-rose-500/20 via-red-600/10 to-pink-500/20",
    borderClass: "hover:border-rose-400 border-rose-500/40",
    accentColor: "#F43F5E",
    vfxFilter: "rgb_split",
    captionStyle: "crimson",
    captionHighlight: "#F43F5E",
    captionHighlightColor: "#F43F5E",
    captionPosition: "center",
    wordsPerLine: 1,
    autoEmoji: true,
    zoomCadence: "fast_3s",
    punchZoomCadence: "fast_3s",
    zoomScale: 1.15,
    punchZoomScale: 1.15,
    sfxCue: "whoosh",
    vfx: {
      filter: "rgb_split",
      intensity: 80,
      letterbox: false,
      grain: false,
      rgbSplit: true,
      scanlines: false,
      vhsHud: false,
      colorGrade: "beast_punch",
    },
    sfx: {
      enabled: true,
      masterVolume: 0.7,
      zoomWhoosh: true,
      cutWhoosh: true,
      emojiPop: true,
      emphasisImpact: true,
    },
  },
  {
    id: "beast_viral",
    name: "Beast Viral",
    label: "Beast Viral",
    badge: "Top Pick 🏆",
    platform: "YouTube Shorts",
    tagline: "High retention, punchy 1-word kinetic text & fast zooms",
    description: "Engineered after top-performing shorts: rapid 3s punch-zooms, gold explosive font, and whoosh cut accents.",
    gradient: "from-amber-500/20 via-yellow-600/10 to-orange-500/20",
    borderClass: "hover:border-amber-400 border-amber-500/40",
    accentColor: "#FACC15",
    vfxFilter: "film_grain",
    captionStyle: "beast",
    captionHighlight: "#FACC15",
    captionHighlightColor: "#FACC15",
    captionPosition: "bottom",
    wordsPerLine: 3,
    autoEmoji: true,
    zoomCadence: "emphasis",
    punchZoomCadence: "emphasis",
    zoomScale: 1.15,
    punchZoomScale: 1.15,
    sfxCue: "whoosh",
    vfx: {
      filter: "film_grain",
      intensity: 70,
      letterbox: false,
      grain: true,
      rgbSplit: false,
      scanlines: false,
      vhsHud: false,
      colorGrade: "beast_punch",
    },
    sfx: {
      enabled: true,
      masterVolume: 0.65,
      zoomWhoosh: true,
      cutWhoosh: false,
      emojiPop: true,
      emphasisImpact: true,
    },
  },
  {
    id: "cyber_glitch",
    name: "Cyber Glitch",
    label: "Cyber Glitch",
    badge: "Futuristic 🤖",
    platform: "VN / CapCut",
    tagline: "CRT raster scanlines, electric cyan subtitles & static zap",
    description: "Futuristic digital gaming aesthetic with horizontal raster scanlines, cyber glowing text, and static pulse audio.",
    gradient: "from-cyan-500/20 via-blue-600/10 to-indigo-500/20",
    borderClass: "hover:border-cyan-400 border-cyan-500/40",
    accentColor: "#38BDF8",
    vfxFilter: "cyber_scan",
    captionStyle: "cyber",
    captionHighlight: "#38BDF8",
    captionHighlightColor: "#38BDF8",
    captionPosition: "bottom",
    wordsPerLine: 3,
    autoEmoji: true,
    zoomCadence: "fast_3s",
    punchZoomCadence: "fast_3s",
    zoomScale: 1.15,
    punchZoomScale: 1.15,
    sfxCue: "glitch",
    vfx: {
      filter: "cyber_scan",
      intensity: 75,
      letterbox: false,
      grain: false,
      rgbSplit: false,
      scanlines: true,
      vhsHud: false,
      colorGrade: "cyber_cyan",
    },
    sfx: {
      enabled: true,
      masterVolume: 0.6,
      zoomWhoosh: true,
      cutWhoosh: true,
      emojiPop: false,
      emphasisImpact: true,
    },
  },
  {
    id: "vintage_vhs",
    name: "Vintage VHS",
    label: "Vintage VHS",
    badge: "Retro Analog 📼",
    platform: "VN / CapCut",
    tagline: "1990s retro scanlines, warm analog color & Hormozi gold captions",
    description: "Nostalgic 1990s camcorder aesthetic complete with mechanical tape clicks, OSD display, and organic emulsion texture.",
    gradient: "from-fuchsia-500/20 via-purple-600/10 to-amber-500/20",
    borderClass: "hover:border-fuchsia-400 border-fuchsia-500/40",
    accentColor: "#D946EF",
    vfxFilter: "vhs_retro",
    captionStyle: "hormozi",
    captionHighlight: "#10B981",
    captionHighlightColor: "#10B981",
    captionPosition: "bottom",
    wordsPerLine: 3,
    autoEmoji: true,
    zoomCadence: "natural_5s",
    punchZoomCadence: "natural_5s",
    zoomScale: 1.15,
    punchZoomScale: 1.15,
    sfxCue: "tape_click",
    vfx: {
      filter: "vhs_retro",
      intensity: 85,
      letterbox: false,
      grain: false,
      rgbSplit: false,
      scanlines: true,
      vhsHud: true,
      colorGrade: "vhs_warm",
    },
    sfx: {
      enabled: true,
      masterVolume: 0.55,
      zoomWhoosh: false,
      cutWhoosh: false,
      emojiPop: true,
      emphasisImpact: true,
      vhsTapeClick: true,
    },
  },
];

export const TRENDING_PRESET_TEMPLATES: Record<TrendingTemplateId, TemplatePreset> = {
  cinematic: TRENDING_TEMPLATES[0],
  hyper_fast: TRENDING_TEMPLATES[1],
  beast_viral: TRENDING_TEMPLATES[2],
  cyber_glitch: TRENDING_TEMPLATES[3],
  vintage_vhs: TRENDING_TEMPLATES[4],
};

/**
 * Applies a full bundle of settings for a trending preset template.
 */
export function applyPresetTemplate(
  templateId: TrendingTemplateId,
  duration: number,
  words: StudioWord[] = []
): {
  preset: TemplatePreset;
  captionSettings: CaptionSettings;
  vfxSettings: VFXSettings;
  zoomCadence: PunchZoomCadence;
  zoomIntervals: PunchZoomInterval[];
  sfxSettings: SFXSettings;
} {
  const preset = TRENDING_PRESET_TEMPLATES[templateId] || TRENDING_PRESET_TEMPLATES.beast_viral;

  const captionSettings: CaptionSettings = {
    ...DEFAULT_CAPTION_SETTINGS,
    style: preset.captionStyle,
    highlightColor: preset.captionHighlightColor || preset.captionHighlight || "#FACC15",
    position: preset.captionPosition || "bottom",
    wordsPerLine: preset.wordsPerLine || 3,
    autoEmoji: preset.autoEmoji ?? true,
    fontSize: preset.wordsPerLine === 1 ? "xl" : "lg",
  };

  const vfxSettings: VFXSettings = {
    ...preset.vfx!,
  };

  const zoomCadence = preset.zoomCadence || preset.punchZoomCadence || "natural_5s";
  const zoomScale = preset.zoomScale || preset.punchZoomScale || 1.15;

  const zoomIntervals = calculatePunchZoomIntervals(zoomCadence, duration, words, {
    scale: zoomScale,
  });

  return {
    preset,
    captionSettings,
    vfxSettings,
    zoomCadence,
    zoomIntervals,
    sfxSettings: preset.sfx!,
  };
}

// ============================================================================
// 3. PUNCH ZOOM ALGORITHM
// ============================================================================

export const HIGH_EMPHASIS_KEYWORDS = new Set([
  // High impact attention hooks
  "insane",
  "massive",
  "stop",
  "secret",
  "never",
  "always",
  "money",
  "win",
  "crazy",
  "huge",
  "shocking",
  "important",
  "best",
  "truth",
  "viral",
  "warning",
  "hack",
  "mistake",
  "critical",
  "danger",
  "exclusive",
  // Hinglish viral emphasis
  "crore",
  "lakh",
  "paisa",
  "bawal",
  "angaar",
  "dhamaka",
  "kamaal",
  "shandar",
  "dhamaal",
]);

export interface PunchZoomOptions {
  scale?: number; // default 1.15
  minIntervalDuration?: number; // in seconds
  emphasisDuration?: number; // in seconds
}

/**
 * Calculates non-overlapping punch zoom intervals based on selected cadence.
 *
 * Rules:
 * 1. "off": returns exactly 0 intervals ([]).
 * 2. "fast_3s": alternates cuts (~1.15x) every ~3 seconds without overlaps.
 * 3. "natural_5s": creates smooth push intervals every ~5 seconds without overlaps.
 * 4. "emphasis": detects sentence punctuation (!, ?) and high-energy keywords,
 *    placing punch zoom intervals without overlaps.
 */
export function calculatePunchZoomIntervals(
  cadence: PunchZoomCadence,
  duration: number,
  words: StudioWord[] = [],
  options: PunchZoomOptions = {}
): PunchZoomInterval[] {
  if (cadence === "off" || !duration || duration <= 0) {
    return [];
  }

  const zoomScale = options.scale || 1.15;
  const intervals: PunchZoomInterval[] = [];

  if (cadence === "fast_3s" || cadence === "3s") {
    const step = 3.0;
    // Alternates: [3s..6s], [9s..12s], [15s..18s] ...
    // Strictly non-overlapping: each interval ends before the next starts.
    let start = step;
    let idx = 1;
    while (start < duration) {
      const end = Math.min(duration, start + step);
      if (end - start >= 0.5) {
        intervals.push({
          id: `zoom-fast-${idx}`,
          start: parseFloat(start.toFixed(2)),
          end: parseFloat(end.toFixed(2)),
          scale: zoomScale,
          originX: 50,
          originY: 50,
          reason: "cadence",
        });
        idx++;
      }
      start += step * 2; // Jump over normal zoom period
    }
    return intervals;
  }

  if (cadence === "natural_5s" || cadence === "5s") {
    const step = 5.0;
    // Alternates: [5s..10s], [15s..20s], [25s..30s] ...
    let start = step;
    let idx = 1;
    while (start < duration) {
      const end = Math.min(duration, start + step);
      if (end - start >= 1.0) {
        intervals.push({
          id: `zoom-nat-${idx}`,
          start: parseFloat(start.toFixed(2)),
          end: parseFloat(end.toFixed(2)),
          scale: zoomScale,
          originX: 50,
          originY: 50,
          reason: "cadence",
        });
        idx++;
      }
      start += step * 2;
    }
    return intervals;
  }

  if (cadence === "emphasis") {
    if (!words || words.length === 0) {
      // Fallback to natural_5s if no transcript words provided
      return calculatePunchZoomIntervals("natural_5s", duration, [], options);
    }

    const rawIntervals: { start: number; end: number; word: string }[] = [];
    const emphasisDuration = options.emphasisDuration || 1.4;

    for (const w of words) {
      if (w.deleted) continue;
      const rawText = w.word.trim();
      const cleanWord = rawText.toLowerCase().replace(/[^a-z0-9]/g, "");

      const hasPunctuationEmphasis = rawText.includes("!") || rawText.includes("?");
      const hasKeywordEmphasis = HIGH_EMPHASIS_KEYWORDS.has(cleanWord);

      if (hasPunctuationEmphasis || hasKeywordEmphasis) {
        const iStart = Math.max(0, w.start);
        const iEnd = Math.min(duration, Math.max(w.end + 0.4, w.start + emphasisDuration));
        rawIntervals.push({ start: iStart, end: iEnd, word: rawText });
      }
    }

    if (rawIntervals.length === 0) {
      if (words.length > 0) {
        const hookEnd = Math.min(duration, Math.max(1.8, words[0].end + 1.0));
        rawIntervals.push({ start: words[0].start, end: hookEnd, word: words[0].word });
      }
    }

    // Sort intervals by start time
    rawIntervals.sort((a, b) => a.start - b.start);

    // Merge overlapping or contiguous intervals to guarantee ZERO overlaps
    const merged: { start: number; end: number; word: string }[] = [];
    for (const cur of rawIntervals) {
      if (merged.length === 0) {
        merged.push(cur);
      } else {
        const prev = merged[merged.length - 1];
        if (cur.start <= prev.end + 0.2) {
          // Overlap or touch within 200ms -> merge
          prev.end = Math.max(prev.end, cur.end);
        } else {
          merged.push(cur);
        }
      }
    }

    // Build final PunchZoomInterval objects
    return merged.map((m, idx) => ({
      id: `zoom-emp-${idx + 1}`,
      start: parseFloat(m.start.toFixed(2)),
      end: parseFloat(m.end.toFixed(2)),
      scale: zoomScale,
      originX: 50,
      originY: 50,
      reason: "emphasis",
    }));
  }

  return [];
}

/**
 * Backwards compatibility helper for existing callers
 */
export function generatePunchZoomIntervals(
  duration: number,
  cadence: PunchZoomCadence,
  scale: PunchZoomScale = 1.15,
  words: StudioWord[] = [],
  isEmphasis = true
): PunchZoomInterval[] {
  if (duration <= 0) return [];
  if (cadence === "off" && !isEmphasis) return [];

  const effCadence = isEmphasis && words.length > 0 ? "emphasis" : cadence;
  return calculatePunchZoomIntervals(effCadence, duration, words, { scale });
}

/**
 * Returns the effective zoom scale factor for the active playback playhead time.
 */
export function getCurrentZoomScale(currentTime: number, intervals: PunchZoomInterval[] = []): number {
  if (!intervals || intervals.length === 0) return 1.0;
  for (const interval of intervals) {
    if (currentTime >= interval.start && currentTime < interval.end) {
      return interval.scale || 1.15;
    }
  }
  return 1.0;
}

// ============================================================================
// 4. PROCEDURAL SFX ENGINE WITH SAFE HEADLESS FALLBACK
// ============================================================================

export interface SFXSoundConfig {
  id: SFXSoundId;
  name: string;
  emoji: string;
  tagline: string;
  category?: "impact" | "transition" | "accent" | "retro";
  durationMs: number;
  frequencyDesc: string;
  colorClass: string;
  description: string;
}

export const SFX_CATALOG: Record<SfxCueId, SFXSoundConfig> = {
  whoosh: {
    id: "whoosh",
    name: "Whoosh",
    emoji: "💨",
    tagline: "Airy Punch Whoosh",
    category: "transition",
    durationMs: 250,
    frequencyDesc: "Air Sweep (400-3200Hz)",
    colorClass: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/40",
    description: "Synthesized dynamic bandpass sweep for snap zoom cuts and scene transitions.",
  },
  boom: {
    id: "boom",
    name: "808 Boom",
    emoji: "💥",
    tagline: "Sub-Bass Drop Impact",
    category: "impact",
    durationMs: 650,
    frequencyDesc: "Sub 45Hz Sine Drop",
    colorClass: "from-red-500/20 to-rose-600/20 text-rose-300 border-rose-500/40",
    description: "Deep cinematic sub-bass pitch drop (110Hz to 32Hz) for climactic hook punches.",
  },
  ding: {
    id: "ding",
    name: "Metric Ding Chime",
    emoji: "🔔",
    tagline: "Key Point Notification",
    category: "accent",
    durationMs: 700,
    frequencyDesc: "Harmonic 1760Hz & 3520Hz Chime",
    colorClass: "from-yellow-500/20 to-amber-400/20 text-yellow-300 border-yellow-500/40",
    description: "Dual-harmonic bell chime (1760Hz & 3520Hz) for statistical callouts and tips.",
  },
  bell: {
    id: "bell",
    name: "Bell Ding",
    emoji: "🔔",
    tagline: "Key Point Notification",
    category: "accent",
    durationMs: 700,
    frequencyDesc: "Harmonic 1760Hz Chime",
    colorClass: "from-yellow-500/20 to-amber-400/20 text-yellow-300 border-yellow-500/40",
    description: "Dual-harmonic bell chime for notification accents.",
  },
  pop: {
    id: "pop",
    name: "Pop",
    emoji: "🫧",
    tagline: "Subtitle Word Accent",
    category: "accent",
    durationMs: 80,
    frequencyDesc: "Bubble Snap (950Hz)",
    colorClass: "from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40",
    description: "High-speed pitch dive for contextual emoji pops and snappy cut cues.",
  },
  cash: {
    id: "cash",
    name: "Cash",
    emoji: "💰",
    tagline: "Value / Revenue Metric",
    category: "accent",
    durationMs: 450,
    frequencyDesc: "Dual Register Ding (2200Hz)",
    colorClass: "from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/40",
    description: "Metallic dual-tone chime strike (1318Hz & 2093Hz) with noise latch.",
  },
  glitch: {
    id: "glitch",
    name: "Glitch",
    emoji: "⚡",
    tagline: "Cyber Cut Jitter",
    category: "transition",
    durationMs: 140,
    frequencyDesc: "60Hz Modulated Static",
    colorClass: "from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40",
    description: "Fast frequency-modulated square-wave crunch for cyber cuts and glitch frames.",
  },
  tape_click: {
    id: "tape_click",
    name: "Tape Click",
    emoji: "📼",
    tagline: "Analog Deck Solenoid",
    category: "retro",
    durationMs: 90,
    frequencyDesc: "Impulse Click / Clack",
    colorClass: "from-purple-500/20 to-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
    description: "Analog cassette latch transient with short filtered noise tail.",
  },
  tape: {
    id: "tape",
    name: "Tape Click",
    emoji: "📼",
    tagline: "Analog Deck Solenoid",
    category: "retro",
    durationMs: 90,
    frequencyDesc: "Impulse Click / Clack",
    colorClass: "from-purple-500/20 to-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
    description: "Analog cassette latch transient with short filtered noise tail.",
  },
};

export const SFX_SOUNDS_CONFIG: SFXSoundConfig[] = [
  SFX_CATALOG.whoosh,
  SFX_CATALOG.boom,
  SFX_CATALOG.ding,
  SFX_CATALOG.pop,
  SFX_CATALOG.cash,
  SFX_CATALOG.glitch,
  SFX_CATALOG.tape_click,
];

export interface PlaySfxResult {
  success: boolean;
  played: boolean;
  isHeadless: boolean;
  cue: SfxCueId;
  durationMs: number;
  error?: string;
}

let sharedAudioContext: AudioContext | null = null;

function getSafeAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  try {
    if (!sharedAudioContext || sharedAudioContext.state === "closed") {
      sharedAudioContext = new AudioCtx();
    }
    if (sharedAudioContext.state === "suspended") {
      sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

/**
 * Synthesizes 100% procedural Web Audio sound effect with 0 external network dependencies.
 * If running in Node.js / SSR / headless CI, gracefully logs and returns safe fallback result.
 */
export function playProceduralSfx(cue: SfxCueId, volume: number = 0.5): PlaySfxResult {
  const normCue = (cue === "bell" ? "ding" : cue === "tape" ? "tape_click" : cue) as SfxCueId;
  const def = SFX_CATALOG[normCue] || SFX_CATALOG.whoosh;

  const ctx = getSafeAudioContext();

  // Headless / SSR / Mock Fallback
  if (!ctx) {
    return {
      success: true,
      played: false,
      isHeadless: true,
      cue: normCue,
      durationMs: def.durationMs,
    };
  }

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume)), now);
    masterGain.connect(ctx.destination);

    switch (normCue) {
      case "whoosh": {
        const bufferSize = ctx.sampleRate * 0.25;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q.setValueAtTime(3.0, now);
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(1800, now + 0.12);
        filter.frequency.exponentialRampToValueAtTime(250, now + 0.24);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.001, now);
        env.gain.linearRampToValueAtTime(0.9, now + 0.1);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

        noise.connect(filter);
        filter.connect(env);
        env.connect(masterGain);
        noise.start(now);
        noise.stop(now + 0.25);
        break;
      }

      case "boom": {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.6);

        const env = ctx.createGain();
        env.gain.setValueAtTime(1.0, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc.connect(env);
        env.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.65);
        break;
      }

      case "ding":
      case "bell": {
        [1760, 3520].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);

          const env = ctx.createGain();
          const amp = idx === 0 ? 0.8 : 0.35;
          env.gain.setValueAtTime(amp, now);
          env.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

          osc.connect(env);
          env.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.7);
        });
        break;
      }

      case "pop": {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.02);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.07);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.01, now);
        env.gain.linearRampToValueAtTime(0.95, now + 0.015);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(env);
        env.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case "cash": {
        [1318.5, 2093.0].forEach((freq) => {
          const osc = ctx.createOscillator();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now);

          const env = ctx.createGain();
          env.gain.setValueAtTime(0.6, now);
          env.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

          osc.connect(env);
          env.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.45);
        });
        break;
      }

      case "glitch": {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(880, now + 0.03);
        osc.frequency.setValueAtTime(140, now + 0.07);
        osc.frequency.setValueAtTime(1200, now + 0.1);

        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(400, now);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.7, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(filter);
        filter.connect(env);
        env.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.14);
        break;
      }

      case "tape_click":
      case "tape": {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.8, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(env);
        env.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.07);
        break;
      }
    }

    return {
      success: true,
      played: true,
      isHeadless: false,
      cue: normCue,
      durationMs: def.durationMs,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      played: false,
      isHeadless: false,
      cue: normCue,
      durationMs: def.durationMs,
      error: errorMsg,
    };
  }
}

/**
 * Backwards compatible helper for playSFXSound
 */
export function playSFXSound(soundId: SFXSoundId, volume = 0.8, isMuted = false): void {
  if (isMuted || volume <= 0) return;
  playProceduralSfx(soundId, volume);
}
