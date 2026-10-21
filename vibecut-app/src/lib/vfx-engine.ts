// ==============================================================================
// VibeCut AI — Trending Instagram/VN VFX, SFX & Template Presets Engine
// ==============================================================================

import {
  TrendingTemplateId,
  VFXFilterId,
  PunchZoomCadence,
  PunchZoomInterval,
  VFXSettings,
  SFXSettings,
  TemplatePreset,
  StudioWord,
} from "@/types/studio";

export const DEFAULT_VFX_SETTINGS: VFXSettings = {
  filter: "none",
  intensity: 100,
  letterbox: false,
  grain: false,
  rgbSplit: false,
  scanlines: false,
  vhsHud: false,
  colorGrade: "none",
};

export const DEFAULT_SFX_SETTINGS: SFXSettings = {
  enabled: true,
  masterVolume: 0.6,
  zoomWhoosh: true,
  cutWhoosh: true,
  emojiPop: true,
  emphasisImpact: true,
  vhsTapeClick: false,
};

// ==============================================================================
// 1. Trending Preset Catalog
// ==============================================================================

export const TRENDING_PRESETS: Record<TrendingTemplateId, TemplatePreset> = {
  cinematic: {
    id: "cinematic",
    name: "Cinematic Film (35mm)",
    label: "Cinematic",
    tagline: "Teal & orange color grade, 35mm grain, 2.39 anamorphic letterbox, slow 1.1x zooms",
    badge: "35mm Film",
    captionStyle: "clean",
    captionHighlightColor: "#FACC15",
    captionPosition: "bottom",
    wordsPerLine: 3,
    autoEmoji: false,
    zoomCadence: "natural_5s",
    zoomScale: 1.1,
    vfx: {
      filter: "letterbox_cinematic",
      intensity: 85,
      letterbox: true,
      grain: true,
      rgbSplit: false,
      scanlines: false,
      vhsHud: false,
      colorGrade: "teal_orange",
    },
    sfx: {
      enabled: true,
      masterVolume: 0.5,
      zoomWhoosh: true,
      cutWhoosh: false,
      emojiPop: false,
      emphasisImpact: true,
      vhsTapeClick: false,
    },
  },

  hyper_fast: {
    id: "hyper_fast",
    name: "Hormozi Hyper-Fast",
    label: "Hyper Fast",
    tagline: "Rapid pacing, 3s punch zooms 1.18x, flash cut whoosh SFX, high-retention 1-word captions",
    badge: "Viral Retention",
    captionStyle: "hormozi",
    captionHighlightColor: "#10B981",
    captionPosition: "center",
    wordsPerLine: 1,
    autoEmoji: true,
    zoomCadence: "fast_3s",
    zoomScale: 1.18,
    vfx: {
      filter: "film_grain",
      intensity: 75,
      letterbox: false,
      grain: true,
      rgbSplit: false,
      scanlines: false,
      vhsHud: false,
      colorGrade: "none",
    },
    sfx: {
      enabled: true,
      masterVolume: 0.75,
      zoomWhoosh: true,
      cutWhoosh: true,
      emojiPop: true,
      emphasisImpact: true,
      vhsTapeClick: false,
    },
  },

  beast_viral: {
    id: "beast_viral",
    name: "MrBeast Viral Pop",
    label: "Beast Viral",
    tagline: "High saturation contrast punch, chromatic RGB split on emphasis, 808 sub boom drop",
    badge: "100M+ Views",
    captionStyle: "beast",
    captionHighlightColor: "#FACC15",
    captionPosition: "bottom",
    wordsPerLine: 3,
    autoEmoji: true,
    zoomCadence: "emphasis",
    zoomScale: 1.16,
    vfx: {
      filter: "rgb_split",
      intensity: 90,
      letterbox: false,
      grain: false,
      rgbSplit: true,
      scanlines: false,
      vhsHud: false,
      colorGrade: "beast_punch",
    },
    sfx: {
      enabled: true,
      masterVolume: 0.8,
      zoomWhoosh: true,
      cutWhoosh: true,
      emojiPop: true,
      emphasisImpact: true,
      vhsTapeClick: false,
    },
  },

  cyber_glitch: {
    id: "cyber_glitch",
    name: "Cyber Glitch HUD",
    label: "Cyber Glitch",
    tagline: "CRT scanlines, digital glitch burst on transitions, neon cyan kinetic captions",
    badge: "Sci-Fi HUD",
    captionStyle: "cyber",
    captionHighlightColor: "#38BDF8",
    captionPosition: "bottom",
    wordsPerLine: 3,
    autoEmoji: true,
    zoomCadence: "fast_3s",
    zoomScale: 1.15,
    vfx: {
      filter: "cyber_scan",
      intensity: 85,
      letterbox: false,
      grain: false,
      rgbSplit: true,
      scanlines: true,
      vhsHud: false,
      colorGrade: "cyber_cyan",
    },
    sfx: {
      enabled: true,
      masterVolume: 0.65,
      zoomWhoosh: true,
      cutWhoosh: true,
      emojiPop: true,
      emphasisImpact: true,
      vhsTapeClick: false,
    },
  },

  vintage_vhs: {
    id: "vintage_vhs",
    name: "Vintage 90s VHS Camcorder",
    label: "Vintage VHS",
    tagline: "Authentic tape grain, live REC HUD overlay, analog tracking lines, solenoid tape click",
    badge: "90s Retro",
    captionStyle: "crimson",
    captionHighlightColor: "#F43F5E",
    captionPosition: "bottom",
    wordsPerLine: 3,
    autoEmoji: false,
    zoomCadence: "natural_5s",
    zoomScale: 1.08,
    vfx: {
      filter: "vhs_retro",
      intensity: 90,
      letterbox: false,
      grain: true,
      rgbSplit: true,
      scanlines: false,
      vhsHud: true,
      colorGrade: "vhs_warm",
    },
    sfx: {
      enabled: true,
      masterVolume: 0.55,
      zoomWhoosh: false,
      cutWhoosh: false,
      emojiPop: false,
      emphasisImpact: false,
      vhsTapeClick: true,
    },
  },
};

export const TRENDING_PRESETS_LIST: TemplatePreset[] = Object.values(TRENDING_PRESETS);

// ==============================================================================
// 2. Punch Zoom Cadence Generator
// ==============================================================================

const EMPHASIS_KEYWORDS = new Set([
  "never", "always", "insane", "million", "billion", "secret", "stop", "huge",
  "crazy", "money", "win", "lose", "free", "first", "viral", "boom", "100%",
  "best", "worst", "shocking", "now", "warning", "key", "truth", "dollar",
  "rich", "power", "hack", "mistake", "game", "change"
]);

/**
 * Snaps a target timestamp to the nearest word start within a search window (default 0.75s).
 */
function snapToNearestWordStart(words: StudioWord[], targetTime: number, maxDelta = 0.75): number {
  if (!words || words.length === 0) return targetTime;
  let bestTime = targetTime;
  let minDiff = Infinity;

  for (const w of words) {
    if (w.deleted) continue;
    const diff = Math.abs(w.start - targetTime);
    if (diff < minDiff && diff <= maxDelta) {
      minDiff = diff;
      bestTime = w.start;
    }
  }

  return bestTime;
}

/**
 * Generates punch-zoom camera intervals based on video cadence and speech alignment.
 */
export function generatePunchZooms(
  words: StudioWord[],
  duration: number,
  cadence: PunchZoomCadence,
  scale: number = 1.15
): PunchZoomInterval[] {
  if (cadence === "off" || duration <= 0) {
    return [];
  }

  const effectiveScale = Math.max(1.05, Math.min(1.35, scale));
  const intervals: PunchZoomInterval[] = [];

  if (cadence === "fast_3s") {
    // Alternates punch zoom every ~2.8 to 3.2 seconds
    const step = 3.0;
    let isZoomed = false;
    let t = 0;

    while (t < duration - 0.5) {
      const segStart = snapToNearestWordStart(words, t);
      const segEnd = snapToNearestWordStart(words, Math.min(duration, t + step));
      if (segEnd <= segStart) break;

      if (isZoomed) {
        intervals.push({
          id: `pz-fast-${intervals.length}`,
          start: Math.max(0, segStart),
          end: Math.min(duration, segEnd),
          scale: effectiveScale,
          originX: 50,
          originY: 45,
          reason: "cadence",
        });
      }

      isZoomed = !isZoomed;
      t = segEnd;
    }
    return intervals;
  }

  if (cadence === "natural_5s") {
    // Alternates punch zoom every ~5.0 seconds
    const step = 5.0;
    let isZoomed = false;
    let t = 0;

    while (t < duration - 0.8) {
      const segStart = snapToNearestWordStart(words, t, 1.0);
      const segEnd = snapToNearestWordStart(words, Math.min(duration, t + step), 1.0);
      if (segEnd <= segStart) break;

      if (isZoomed) {
        intervals.push({
          id: `pz-nat-${intervals.length}`,
          start: Math.max(0, segStart),
          end: Math.min(duration, segEnd),
          scale: effectiveScale,
          originX: 50,
          originY: 50,
          reason: "cadence",
        });
      }

      isZoomed = !isZoomed;
      t = segEnd;
    }
    return intervals;
  }

  if (cadence === "emphasis") {
    // Detects high-energy punctuation, capitalized words, and viral power words
    if (!words || words.length === 0) {
      // Fallback to 4s cadence if no transcript is present
      return generatePunchZooms(words, duration, "natural_5s", effectiveScale);
    }

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (w.deleted) continue;

      const cleanWord = w.word.toLowerCase().replace(/[^a-z0-9]/g, "");
      const isExclamation = w.word.includes("!") || w.word.includes("?");
      const isPowerWord = EMPHASIS_KEYWORDS.has(cleanWord);
      const isCapitalized = w.word.length >= 3 && w.word === w.word.toUpperCase();
      const isLongStress = (w.end - w.start) >= 0.55 && !w.isFiller;

      if (isExclamation || isPowerWord || isCapitalized || isLongStress) {
        const start = Math.max(0, w.start - 0.05);
        // Punch zoom lasts for 1.2s to 1.6s
        const end = Math.min(duration, Math.max(w.end + 0.6, start + 1.25));

        // Avoid overlap with existing intervals
        const overlaps = intervals.some(
          (ex) => Math.max(ex.start, start) < Math.min(ex.end, end) + 0.5
        );

        if (!overlaps) {
          intervals.push({
            id: `pz-emp-${intervals.length}`,
            start,
            end,
            scale: effectiveScale,
            originX: 50,
            originY: 42,
            reason: "emphasis",
          });
        }
      }
    }

    // If no emphasis words were detected, add an initial hook zoom in the first 3s
    if (intervals.length === 0 && duration > 2) {
      intervals.push({
        id: "pz-hook-0",
        start: 0,
        end: Math.min(duration, 3.2),
        scale: effectiveScale,
        originX: 50,
        originY: 45,
        reason: "hook",
      });
    }

    return intervals;
  }

  return [];
}

// ==============================================================================
// 3. Filter CSS & SVG Overlay Styles Generator
// ==============================================================================

/**
 * Computes CSS filter styles based on active VFXSettings and intensity.
 */
export function getVFXFilterStyle(vfx?: VFXSettings): React.CSSProperties {
  if (!vfx || vfx.filter === "none" || vfx.intensity <= 0) {
    return {};
  }

  const factor = (vfx.intensity ?? 100) / 100;
  const filters: string[] = [];

  const grade = vfx.colorGrade || (vfx.filter === "letterbox_cinematic" ? "teal_orange" : "none");

  switch (grade) {
    case "teal_orange": {
      // Hollywood Blockbuster Teal & Orange LUT approximation
      const c = 1 + 0.18 * factor;
      const s = 1 + 0.32 * factor;
      const sep = 0.18 * factor;
      const hue = -12 * factor;
      filters.push(`contrast(${c.toFixed(2)}) saturate(${s.toFixed(2)}) sepia(${sep.toFixed(2)}) hue-rotate(${hue.toFixed(1)}deg)`);
      break;
    }
    case "beast_punch": {
      // MrBeast eye-popping high saturation + hyper contrast
      const c = 1 + 0.28 * factor;
      const s = 1 + 0.55 * factor;
      const b = 1 + 0.04 * factor;
      filters.push(`contrast(${c.toFixed(2)}) saturate(${s.toFixed(2)}) brightness(${b.toFixed(2)})`);
      break;
    }
    case "cyber_cyan": {
      // Sci-fi Neon matrix tone
      const c = 1 + 0.22 * factor;
      const s = 1 + 0.35 * factor;
      const hue = 160 * factor;
      filters.push(`contrast(${c.toFixed(2)}) saturate(${s.toFixed(2)}) hue-rotate(${hue.toFixed(1)}deg)`);
      break;
    }
    case "vhs_warm": {
      // Warm analog magnetic tape glow
      const c = 1 + 0.12 * factor;
      const s = 1 + 0.2 * factor;
      const sep = 0.35 * factor;
      const hue = -20 * factor;
      filters.push(`contrast(${c.toFixed(2)}) saturate(${s.toFixed(2)}) sepia(${sep.toFixed(2)}) hue-rotate(${hue.toFixed(1)}deg)`);
      break;
    }
    case "monochrome": {
      filters.push(`grayscale(${factor}) contrast(${1 + 0.2 * factor})`);
      break;
    }
  }

  return filters.length > 0 ? { filter: filters.join(" ") } : {};
}

/**
 * Helper to determine which overlay elements should be rendered over the video.
 */
export function getVFXOverlayFlags(vfx?: VFXSettings) {
  if (!vfx) {
    return {
      showLetterbox: false,
      showGrain: false,
      showRgbSplit: false,
      showScanlines: false,
      showVhsHud: false,
    };
  }

  const isCinematic = vfx.filter === "letterbox_cinematic";
  const isVhs = vfx.filter === "vhs_retro";
  const isCyber = vfx.filter === "cyber_scan";
  const isRgb = vfx.filter === "rgb_split";
  const isGrain = vfx.filter === "film_grain";

  return {
    showLetterbox: Boolean(vfx.letterbox || isCinematic),
    showGrain: Boolean(vfx.grain || isGrain || isCinematic || isVhs),
    showRgbSplit: Boolean(vfx.rgbSplit || isRgb || isCyber || isVhs),
    showScanlines: Boolean(vfx.scanlines || isCyber),
    showVhsHud: Boolean(vfx.vhsHud || isVhs),
  };
}
