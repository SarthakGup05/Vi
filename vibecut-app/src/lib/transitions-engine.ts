// ==============================================================================
// VibeCut AI — Transition Effects Section & AI Content-Aware Transitions Engine
// Self-contained module supporting Real-Time Playback, Inspector & Node.js CI
// ==============================================================================

export type TransitionEffectId =
  | "cross_dissolve"
  | "whip_pan"
  | "flash_white"
  | "dip_black"
  | "zoom_crash"
  | "glitch_slice"
  | "slide_left"
  | "spin_roll";

export interface TransitionItem {
  id: string;
  timestamp: number;
  effect: TransitionEffectId;
  duration: number; // in seconds
  aiSuggested?: boolean;
  aiReason?: string;
}

export type TransitionCategory = "cinematic" | "dynamic" | "glitch" | "motion" | "geometric";

export type SfxCueId = "whoosh" | "boom" | "ding" | "bell" | "pop" | "cash" | "glitch" | "tape_click" | "tape";

export interface TransitionEffectConfig {
  id: TransitionEffectId;
  name: string;
  category: TransitionCategory;
  tagline: string;
  iconEmoji: string;
  defaultDuration: number;
  sfxCue: SfxCueId;
  description: string;
  tags?: string[];
}

export interface StudioWord {
  id?: string;
  word: string;
  start: number;
  end: number;
  deleted?: boolean;
}

export interface TimelineCut {
  id: string;
  start: number;
  end: number;
  type?: string;
}

export interface SilenceGap {
  id: string;
  start: number;
  end: number;
  duration: number;
  rawDuration?: number;
}

// ---------------------------------------------------------------------------
// 1. TRANSITION EFFECTS CATALOG (All 8 Cinematic & Social Transitions)
// ---------------------------------------------------------------------------

export const TRANSITION_EFFECTS_CATALOG: TransitionEffectConfig[] = [
  {
    id: "whip_pan",
    name: "Whip Pan",
    category: "dynamic",
    tagline: "High-speed directional sweep",
    iconEmoji: "🌀",
    defaultDuration: 0.3,
    sfxCue: "whoosh",
    description: "Ultra-fast camera sweep with horizontal kinetic blur for quick subject or topic switches.",
  },
  {
    id: "flash_white",
    name: "Flash White",
    category: "cinematic",
    tagline: "Impact luminance light leak burst",
    iconEmoji: "⚡",
    defaultDuration: 0.25,
    sfxCue: "boom",
    description: "Blinding white luminance flash for high-impact hook drops and dramatic sentence reveals.",
  },
  {
    id: "dip_black",
    name: "Dip to Black",
    category: "cinematic",
    tagline: "Theatrical scene pause",
    iconEmoji: "🎬",
    defaultDuration: 0.45,
    sfxCue: "whoosh",
    description: "Classic theatrical fade to black for major topic shifts, pacing reset, and dramatic pauses.",
  },
  {
    id: "zoom_crash",
    name: "Zoom Crash",
    category: "dynamic",
    tagline: "Snap punch crash",
    iconEmoji: "💥",
    defaultDuration: 0.3,
    sfxCue: "boom",
    description: "Aggressive hyper-zoom snap pushing into the subject focal point with radial optical energy.",
  },
  {
    id: "glitch_slice",
    name: "Glitch Slice",
    category: "glitch",
    tagline: "Digital signal tearing",
    iconEmoji: "⚡",
    defaultDuration: 0.28,
    sfxCue: "glitch",
    description: "Horizontal digital artifact slicing with RGB displacement tearing for tech and cyber aesthetics.",
  },
  {
    id: "slide_left",
    name: "Slide Push",
    category: "geometric",
    tagline: "Directional card push",
    iconEmoji: "📐",
    defaultDuration: 0.35,
    sfxCue: "whoosh",
    description: "Fast lateral push sliding the current scene leftward while revealing new context.",
  },
  {
    id: "cross_dissolve",
    name: "Cross Dissolve",
    category: "cinematic",
    tagline: "Filmic alpha dissolve",
    iconEmoji: "🔄",
    defaultDuration: 0.4,
    sfxCue: "whoosh",
    description: "Smooth continuous alpha crossfade blending preceding and following scenes seamlessly.",
  },
  {
    id: "spin_roll",
    name: "Spin Roll",
    category: "geometric",
    tagline: "Kinetic barrel rotation",
    iconEmoji: "🌀",
    defaultDuration: 0.35,
    sfxCue: "whoosh",
    description: "Dynamic centrifugal 360-degree rotational snap ideal for energetic creator vlogs.",
  },
];

export const TRANSITION_CONFIG_MAP: Record<TransitionEffectId, TransitionEffectConfig> =
  TRANSITION_EFFECTS_CATALOG.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<TransitionEffectId, TransitionEffectConfig>
  );

export const TRANSITION_EFFECTS = TRANSITION_CONFIG_MAP;
export const TRANSITION_EFFECTS_LIST = TRANSITION_EFFECTS_CATALOG;

// ---------------------------------------------------------------------------
// 2. AI CONTENT-AWARE TRANSITION RECOMMENDATION ALGORITHM
// ---------------------------------------------------------------------------

const TRANSITIONAL_WORDS = new Set([
  "so",
  "next",
  "however",
  "meanwhile",
  "therefore",
  "then",
  "finally",
  "secondly",
  "firstly",
  "furthermore",
  "moreover",
  "instead",
  "now",
  "anyway",
  "besides",
]);

const HIGH_ENERGY_HOOK_WORDS = new Set([
  "insane",
  "secret",
  "stop",
  "crazy",
  "huge",
  "never",
  "always",
  "warning",
  "danger",
  "money",
  "viral",
  "massive",
  "unbelievable",
  "shocking",
  "boom",
  "bawal",
  "angaar",
  "dhamaka",
]);

const TECH_DATA_WORDS = new Set([
  "algorithm",
  "system",
  "code",
  "ai",
  "tech",
  "data",
  "server",
  "database",
  "software",
  "cyber",
  "bot",
  "cloud",
  "python",
  "javascript",
  "crypto",
  "matrix",
]);

export interface RecommendTransitionsOptions {
  minIntervalDistance?: number; // Minimum seconds between two transitions (default: 1.0s)
  maxTransitions?: number;
  cuts?: TimelineCut[];
  silences?: SilenceGap[];
}

/**
 * AI Content-Aware Transition Recommendation Algorithm:
 * - Scans transcript words, punctuation, energy cues, and silence gaps.
 * - Topic/pause shifts (>0.8s silence or transitional discourse words "so", "next", "however") -> dip_black or cross_dissolve.
 * - High energy / hook exclamation ("insane", "secret", "!") -> whip_pan, zoom_crash, or flash_white.
 * - Tech / data words ("algorithm", "system", "code") -> glitch_slice.
 * - Assigns clear human-readable AI reason strings.
 */
export function recommendTransitions(
  words: StudioWord[] = [],
  options: RecommendTransitionsOptions = {}
): TransitionItem[] {
  const { minIntervalDistance = 1.0, maxTransitions = 12, cuts = [], silences = [] } = options;
  const candidates: TransitionItem[] = [];

  // 1. Scan Silences (> 0.8s silence gap indicates topic or scene pause)
  for (const silence of silences) {
    const rawDur = silence.rawDuration ?? silence.duration;
    if (rawDur >= 0.8) {
      const effect: TransitionEffectId = rawDur >= 1.2 ? "dip_black" : "cross_dissolve";
      const duration = TRANSITION_CONFIG_MAP[effect].defaultDuration;
      candidates.push({
        id: `tr-silence-${silence.id}`,
        timestamp: parseFloat(silence.start.toFixed(2)),
        effect,
        duration,
        aiSuggested: true,
        aiReason: `Topic pause shift (${rawDur.toFixed(1)}s silence gap) -> ${TRANSITION_CONFIG_MAP[effect].name}`,
      });
    }
  }

  // 2. Scan Cuts (Timeline cuts / jump cut seams)
  for (let i = 0; i < cuts.length; i++) {
    const cut = cuts[i];
    if (cut.type === "silence" || cut.type === "manual") {
      const effect: TransitionEffectId = i % 2 === 0 ? "whip_pan" : "slide_left";
      const duration = TRANSITION_CONFIG_MAP[effect].defaultDuration;
      candidates.push({
        id: `tr-cut-${cut.id}`,
        timestamp: parseFloat(cut.start.toFixed(2)),
        effect,
        duration,
        aiSuggested: true,
        aiReason: `Jump cut seam boundary #${i + 1} -> ${TRANSITION_CONFIG_MAP[effect].name}`,
      });
    }
  }

  // 3. Scan Words for Transitional Words, Exclamation Hooks, and Tech Keywords
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.deleted) continue;
    const clean = (w.word || "").trim().toLowerCase().replace(/[^a-z0-9!]/g, "");
    const rawText = (w.word || "").trim();
    const hasExclamation = rawText.includes("!");

    // 3a. High Energy Hook Exclamation ("!", "insane", "secret")
    if (hasExclamation || HIGH_ENERGY_HOOK_WORDS.has(clean)) {
      let effect: TransitionEffectId = "whip_pan";
      if (clean === "insane" || clean === "secret") {
        effect = "zoom_crash";
      } else if (hasExclamation) {
        effect = clean === "stop" || clean === "warning" ? "flash_white" : "whip_pan";
      }

      candidates.push({
        id: `tr-hook-${w.id || i}`,
        timestamp: parseFloat(w.start.toFixed(2)),
        effect,
        duration: TRANSITION_CONFIG_MAP[effect].defaultDuration,
        aiSuggested: true,
        aiReason: `High-energy hook exclamation "${rawText}" -> ${TRANSITION_CONFIG_MAP[effect].name}`,
      });
      continue;
    }

    // 3b. Tech / Data Words ("algorithm", "system", "code")
    if (TECH_DATA_WORDS.has(clean)) {
      const effect: TransitionEffectId = "glitch_slice";
      candidates.push({
        id: `tr-tech-${w.id || i}`,
        timestamp: parseFloat(w.start.toFixed(2)),
        effect,
        duration: TRANSITION_CONFIG_MAP[effect].defaultDuration,
        aiSuggested: true,
        aiReason: `Tech keyword "${rawText}" -> ${TRANSITION_CONFIG_MAP[effect].name}`,
      });
      continue;
    }

    // 3c. Topic / Transition Discourse Markers ("so", "next", "however")
    if (TRANSITIONAL_WORDS.has(clean)) {
      const effect: TransitionEffectId = clean === "however" || clean === "finally" ? "dip_black" : "cross_dissolve";
      candidates.push({
        id: `tr-trans-${w.id || i}`,
        timestamp: parseFloat(w.start.toFixed(2)),
        effect,
        duration: TRANSITION_CONFIG_MAP[effect].defaultDuration,
        aiSuggested: true,
        aiReason: `Transitional topic shift "${rawText}" -> ${TRANSITION_CONFIG_MAP[effect].name}`,
      });
      continue;
    }
  }

  // 4. Sort Candidates Chronologically and Deduplicate by Minimum Interval
  candidates.sort((a, b) => a.timestamp - b.timestamp);

  const finalTransitions: TransitionItem[] = [];
  for (const cand of candidates) {
    if (finalTransitions.length >= maxTransitions) break;
    if (finalTransitions.length === 0) {
      finalTransitions.push(cand);
    } else {
      const prev = finalTransitions[finalTransitions.length - 1];
      if (cand.timestamp - prev.timestamp >= minIntervalDistance) {
        finalTransitions.push(cand);
      }
    }
  }

  return finalTransitions;
}

// ---------------------------------------------------------------------------
// 3. REAL-TIME PLAYBACK TRANSITION DETECTION & MATH
// ---------------------------------------------------------------------------

export interface ActiveTransitionState {
  active: boolean;
  transition: TransitionItem | null;
  progress: number; // 0.0 to 1.0 normalized over [t - dur/2, t + dur/2]
  phase: "in" | "out" | null;
  effect: TransitionEffectId | null;
  intensity: number; // Sine curve 0 -> 1 -> 0
}

const INACTIVE_TRANSITION_STATE: ActiveTransitionState = {
  active: false,
  transition: null,
  progress: 0,
  phase: null,
  effect: null,
  intensity: 0,
};

/**
 * Real-Time Playback Transition Detection & Math:
 * Accurately identifies whether currentTime is within the active window:
 * [t - duration / 2, t + duration / 2]
 * Calculates normalized linear progress from 0.0 to 1.0,
 * and bell-curve intensity (sin(progress * PI)).
 * Outside timestamps return active: false.
 */
export function getActiveTransition(
  currentTime: number,
  transitions: TransitionItem[] = []
): ActiveTransitionState {
  if (!transitions || transitions.length === 0 || currentTime < 0) {
    return INACTIVE_TRANSITION_STATE;
  }

  for (const tr of transitions) {
    const halfDur = tr.duration / 2;
    const startTime = tr.timestamp - halfDur;
    const endTime = tr.timestamp + halfDur;

    if (currentTime >= startTime && currentTime <= endTime) {
      const rawProgress = (currentTime - startTime) / tr.duration;
      const progress = Math.max(0, Math.min(1, rawProgress));
      const phase: "in" | "out" = progress < 0.5 ? "in" : "out";
      const intensity = Math.sin(progress * Math.PI);

      return {
        active: true,
        transition: tr,
        progress: parseFloat(progress.toFixed(4)),
        phase,
        effect: tr.effect,
        intensity: parseFloat(intensity.toFixed(4)),
      };
    }
  }

  return INACTIVE_TRANSITION_STATE;
}

export interface TransitionVisualProps {
  containerStyle: React.CSSProperties;
  overlayClass: string;
  overlayStyle: React.CSSProperties;
  effectName: string;
  zoomScale: number;
  videoTransform: string;
  videoFilter: string;
  flashWhiteOpacity: number;
  dipBlackOpacity: number;
  glitchActive: boolean;
  crossDissolveOpacity: number;
  slideLeftOffset: number;
  spinRollRotation: number;
}

export const DEFAULT_TRANSITION_VISUAL_PROPS: TransitionVisualProps = {
  containerStyle: {},
  overlayClass: "hidden",
  overlayStyle: { opacity: 0 },
  effectName: "none",
  zoomScale: 1.0,
  videoTransform: "none",
  videoFilter: "none",
  flashWhiteOpacity: 0,
  dipBlackOpacity: 0,
  glitchActive: false,
  crossDissolveOpacity: 0,
  slideLeftOffset: 0,
  spinRollRotation: 0,
};

/**
 * Returns CSS styles and overlay transforms for any active transition effect
 */
export function getTransitionVisualProps(activeState: ActiveTransitionState): TransitionVisualProps {
  if (!activeState.active || !activeState.effect) {
    return DEFAULT_TRANSITION_VISUAL_PROPS;
  }

  const { effect, progress, intensity } = activeState;
  const centered = (progress - 0.5) * 2; // -1 to +1

  const baseProps: TransitionVisualProps = {
    ...DEFAULT_TRANSITION_VISUAL_PROPS,
    effectName: effect,
    flashWhiteOpacity: effect === "flash_white" ? Math.min(1, intensity * 0.95) : 0,
    dipBlackOpacity: effect === "dip_black" ? Math.min(1, intensity * 0.98) : 0,
    glitchActive: effect === "glitch_slice",
    crossDissolveOpacity: effect === "cross_dissolve" ? intensity * 0.5 : 0,
    slideLeftOffset: effect === "slide_left" ? centered * -100 : 0,
    spinRollRotation: effect === "spin_roll" ? centered * 180 : 0,
    zoomScale: effect === "zoom_crash" ? 1 + intensity * 0.38 : 1.0,
  };

  switch (effect) {
    case "cross_dissolve": {
      // Filmic alpha crossfade
      return {
        ...baseProps,
        containerStyle: {
          opacity: 1 - intensity * 0.45,
          filter: `blur(${intensity * 3}px)`,
        },
        overlayClass: "absolute inset-0 pointer-events-none z-30 bg-black/40",
        overlayStyle: { opacity: intensity * 0.5 },
        effectName: "cross_dissolve",
      };
    }

    case "whip_pan": {
      // Rapid horizontal translate blur
      const shiftX = centered * 60; // -60% to +60%
      return {
        ...baseProps,
        containerStyle: {
          transform: `translateX(${shiftX}%) scale(${1 + intensity * 0.08})`,
          filter: `blur(${intensity * 6}px)`,
        },
        overlayClass: "absolute inset-0 pointer-events-none z-30 bg-gradient-to-r from-transparent via-white/20 to-transparent",
        overlayStyle: { opacity: intensity * 0.6 },
        effectName: "whip_pan",
      };
    }

    case "flash_white": {
      // Intense white luminance flash peaking at center
      return {
        ...baseProps,
        containerStyle: {
          filter: `brightness(${1 + intensity * 1.8})`,
        },
        overlayClass: "absolute inset-0 pointer-events-none z-30 bg-white",
        overlayStyle: { opacity: Math.min(1, intensity * 0.95) },
        effectName: "flash_white",
      };
    }

    case "dip_black": {
      // Theatrical fade to black peaking at center
      return {
        ...baseProps,
        containerStyle: {
          filter: `brightness(${1 - intensity * 0.85})`,
        },
        overlayClass: "absolute inset-0 pointer-events-none z-30 bg-black",
        overlayStyle: { opacity: Math.min(1, intensity * 0.98) },
        effectName: "dip_black",
      };
    }

    case "zoom_crash": {
      // Snap hyper-zoom punch
      const scale = 1 + intensity * 0.38;
      return {
        ...baseProps,
        containerStyle: {
          transform: `scale(${scale})`,
          filter: `blur(${intensity * 4}px)`,
        },
        overlayClass: "absolute inset-0 pointer-events-none z-30 bg-violet-600/20 mix-blend-screen",
        overlayStyle: { opacity: intensity * 0.7 },
        effectName: "zoom_crash",
      };
    }

    case "glitch_slice": {
      // Digital horizontal chromatic slice
      const glitchX = (Math.sin(progress * 30) * 12 * intensity).toFixed(1);
      return {
        ...baseProps,
        containerStyle: {
          transform: `translateX(${glitchX}px) skewX(${centered * 4}deg)`,
          filter: `hue-rotate(${intensity * 90}deg) saturate(${1 + intensity * 1.2})`,
        },
        overlayClass: "absolute inset-0 pointer-events-none z-30 bg-cyan-400/20 mix-blend-color-dodge",
        overlayStyle: { opacity: intensity * 0.75 },
        effectName: "glitch_slice",
      };
    }

    case "slide_left": {
      // Fast lateral slide left
      const slideX = centered * -100;
      return {
        ...baseProps,
        containerStyle: {
          transform: `translateX(${slideX}%)`,
        },
        overlayClass: "absolute inset-0 pointer-events-none z-30 bg-black/30",
        overlayStyle: { opacity: intensity * 0.4 },
        effectName: "slide_left",
      };
    }

    case "spin_roll": {
      // Kinetic 360-degree rotation
      const rotation = centered * 180;
      const spinScale = 1 - intensity * 0.2;
      return {
        ...baseProps,
        containerStyle: {
          transform: `rotate(${rotation}deg) scale(${spinScale})`,
        },
        overlayClass: "absolute inset-0 pointer-events-none z-30 bg-indigo-500/15 mix-blend-overlay",
        overlayStyle: { opacity: intensity * 0.5 },
        effectName: "spin_roll",
      };
    }

    default:
      return DEFAULT_TRANSITION_VISUAL_PROPS;
  }
}

export const getTransitionStyles = getTransitionVisualProps;

export function aiAnalyzeAndSuggestTransitions(
  words: StudioWord[] = [],
  cutsOrOptions?: TimelineCut[] | RecommendTransitionsOptions,
  duration?: number
): TransitionItem[] {
  if (Array.isArray(cutsOrOptions)) {
    return recommendTransitions(words, { cuts: cutsOrOptions });
  }
  return recommendTransitions(words, cutsOrOptions);
}

