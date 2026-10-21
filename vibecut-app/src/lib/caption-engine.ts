import {
  StudioWord,
  CaptionStyle,
  WordsPerLine,
  CaptionPosition,
  CaptionFontSize,
  CaptionSettings,
  CaptionChunk,
  ActiveCaptionState,
  CaptionPresetConfig,
} from "@/types/studio";

/**
 * High-impact creator keyword to emoji map supporting English and Hinglish creator vocabularies.
 * Verified categories: Money 💰, Fire/Hype 🔥, Growth 🚀, Love ❤️, Brain/Idea 💡, Speed ⚡, Victory 🏆,
 * and Hinglish: paisa 💰, kamaal 🔥, dhamaka 💥.
 */
export const CONTEXTUAL_EMOJI_MAP: Record<string, string> = {
  // 1. Money & Wealth 💰 (English & Hinglish)
  money: "💰",
  cash: "💰",
  dollar: "💰",
  dollars: "💰",
  profit: "💰",
  profits: "💰",
  revenue: "💰",
  rich: "💰",
  wealth: "💰",
  wealthy: "💰",
  million: "💰",
  millions: "💰",
  billion: "💰",
  billions: "💰",
  crypto: "💰",
  bitcoin: "💰",
  btc: "💰",
  eth: "💰",
  pay: "💰",
  paid: "💰",
  paycheck: "💰",
  salary: "💰",
  expensive: "💰",
  bank: "💰",
  invest: "💰",
  investment: "💰",
  stonks: "💰",
  paisa: "💰",
  paise: "💰",
  rokda: "💰",
  daulat: "💰",
  dhan: "💰",
  kamai: "💰",
  dhanrashi: "💰",
  buck: "💰",
  bucks: "💰",
  rupee: "💰",
  rupees: "💰",
  crore: "💰",
  lakh: "💰",

  // 2. Fire & Hype 🔥 (English & Hinglish)
  fire: "🔥",
  hype: "🔥",
  lit: "🔥",
  hot: "🔥",
  flame: "🔥",
  flames: "🔥",
  burn: "🔥",
  banger: "🔥",
  heater: "🔥",
  trending: "🔥",
  bawal: "🔥",
  bawaal: "🔥",
  aag: "🔥",
  angaar: "🔥",
  kamaal: "🔥",
  kamal: "🔥",
  jalwa: "🔥",
  shandar: "🔥",
  shaandar: "🔥",

  // 3. Growth & Scale 🚀
  growth: "🚀",
  grow: "🚀",
  growing: "🚀",
  rocket: "🚀",
  launch: "🚀",
  moon: "🚀",
  scale: "🚀",
  scaling: "🚀",
  surge: "🚀",
  skyrocket: "🚀",
  boost: "🚀",
  "10x": "🚀",
  "100x": "🚀",
  takeoff: "🚀",
  faad: "🚀",
  faadu: "🚀",
  uraan: "🚀",
  udaan: "🚀",
  viral: "🚀",

  // 4. Love & Heart ❤️
  love: "❤️",
  heart: "❤️",
  crush: "❤️",
  adore: "❤️",
  passion: "❤️",
  pyaar: "❤️",
  pyar: "❤️",
  dil: "❤️",
  prem: "❤️",
  mohabbat: "❤️",
  ishq: "❤️",

  // 5. Brain, Idea & Intellect 💡
  brain: "💡",
  idea: "💡",
  smart: "💡",
  think: "💡",
  thinking: "💡",
  thought: "💡",
  genius: "💡",
  iq: "💡",
  logic: "💡",
  mind: "💡",
  intellect: "💡",
  hack: "💡",
  tip: "💡",
  trick: "💡",
  insight: "💡",
  secret: "💡",
  eureka: "💡",
  jugaad: "💡",
  jugad: "💡",
  tarika: "💡",
  tareeka: "💡",
  dimag: "💡",
  dimaag: "💡",
  buddhi: "💡",
  khopdi: "💡",

  // 6. Speed & Rapid Pacing ⚡
  speed: "⚡",
  fast: "⚡",
  quick: "⚡",
  rapid: "⚡",
  lightning: "⚡",
  electric: "⚡",
  flash: "⚡",
  turbo: "⚡",
  rush: "⚡",
  blitz: "⚡",
  zap: "⚡",
  jaldi: "⚡",
  fatfat: "⚡",
  phataphat: "⚡",
  turant: "⚡",
  raftaar: "⚡",

  // 7. Victory, Winning & Championship 🏆
  victory: "🏆",
  win: "🏆",
  winning: "🏆",
  winner: "🏆",
  champion: "🏆",
  champ: "🏆",
  trophy: "🏆",
  goat: "🏆",
  first: "🏆",
  king: "🏆",
  queen: "🏆",
  legend: "🏆",
  legendary: "🏆",
  jeet: "🏆",
  jeeta: "🏆",
  vijeta: "🏆",
  sikandar: "🏆",

  // 8. Hinglish & Explosion Specifics 💥
  dhamaka: "💥",
  dhamakedar: "💥",
  boom: "💥",
  blast: "💥",
  explosion: "💥",
  bang: "💥",
  insane: "🤯",
  crazy: "🤯",
  omg: "😱",
  target: "🎯",
  strong: "💪",
  muscle: "💪",
  time: "⏱️",
  clock: "⏱️",
  stop: "⚠️",
  danger: "⚠️",
  warning: "⚠️",
  look: "👀",
  check: "✅",
};

export const KEYWORD_EMOJI_MAP = CONTEXTUAL_EMOJI_MAP;

/**
 * Strips punctuation, non-alphanumeric symbols and normalizes case.
 * Guaranteed casing & punctuation invariant:
 * e.g. "Money!" -> "money", "$$CASH$$" -> "cash", "FIRE..." -> "fire"
 */
export function cleanWordToken(rawWord: string): string {
  if (!rawWord) return "";
  return rawWord.toLowerCase().replace(/[^a-z0-9]/gi, "").trim();
}

/**
 * Retrieve contextual emoji matching word keyword with casing & punctuation invariance.
 */
export function getContextualEmoji(rawWord: string): string | null {
  if (!rawWord) return null;
  const clean = cleanWordToken(rawWord);
  if (!clean) return null;

  if (CONTEXTUAL_EMOJI_MAP[clean]) {
    return CONTEXTUAL_EMOJI_MAP[clean];
  }

  // Singular fallback (e.g. dollars -> dollar, rockets -> rocket)
  if (clean.endsWith("s") && clean.length > 3) {
    const singular = clean.slice(0, -1);
    if (CONTEXTUAL_EMOJI_MAP[singular]) {
      return CONTEXTUAL_EMOJI_MAP[singular];
    }
  }

  // -ing fallback (e.g. winning -> win, scaling -> scale)
  if (clean.endsWith("ing") && clean.length > 5) {
    const root = clean.slice(0, -3);
    if (CONTEXTUAL_EMOJI_MAP[root]) return CONTEXTUAL_EMOJI_MAP[root];
    if (CONTEXTUAL_EMOJI_MAP[`${root}e`]) return CONTEXTUAL_EMOJI_MAP[`${root}e`];
  }

  return null;
}

export const getEmojiForKeyword = getContextualEmoji;
export const getEmojiForWord = getContextualEmoji;

/**
 * Word chunking algorithm across sizes (1 word rapid, 3 words punchy, 5 words standard)
 * with strict temporal window accuracy (start, end, duration).
 */
export function chunkWords(
  words: StudioWord[],
  chunkSize: number = 3
): CaptionChunk[] {
  if (!words || words.length === 0) return [];
  const activeWords = words.filter((w) => !w.deleted);
  if (activeWords.length === 0) return [];

  const size = Math.max(1, chunkSize || 3);
  const chunks: CaptionChunk[] = [];

  for (let i = 0; i < activeWords.length; i += size) {
    const chunkWords = activeWords.slice(i, i + size);
    const start = chunkWords[0].start;
    const end = chunkWords[chunkWords.length - 1].end;
    const duration = parseFloat((end - start).toFixed(3));
    const emojis = chunkWords
      .map((w) => getContextualEmoji(w.word))
      .filter((e): e is string => Boolean(e));

    chunks.push({
      id: `chunk-${Math.floor(i / size)}-${Math.round(start * 100)}`,
      chunkIndex: Math.floor(i / size),
      words: chunkWords,
      start,
      end,
      duration,
      text: chunkWords.map((w) => w.word).join(" "),
      emojis,
    });
  }

  return chunks;
}

/**
 * Active word identification during playback timestamps and emoji correlation.
 * Centers a chunk around the spoken word, with pause hold capability (up to holdPauseSec).
 */
export function chunkTranscriptWords(
  words: StudioWord[],
  activeTime: number,
  chunkSize: number | WordsPerLine = 3,
  holdPauseSec: number = 0.7
): ActiveCaptionState | null {
  if (!words || words.length === 0) return null;

  // Filter out cut/deleted words
  const activeWords = words.filter((w) => !w.deleted);
  if (activeWords.length === 0) return null;

  const validChunkSize = Math.max(1, Math.min(6, chunkSize || 3));

  // 1. Direct active word match at activeTime
  let currentIndex = activeWords.findIndex(
    (w) => activeTime >= w.start && activeTime <= w.end
  );

  // 2. Pause hold: keep last spoken word active during brief pauses
  if (currentIndex === -1 && holdPauseSec > 0) {
    for (let i = activeWords.length - 1; i >= 0; i--) {
      if (
        activeTime >= activeWords[i].end &&
        activeTime <= activeWords[i].end + holdPauseSec
      ) {
        currentIndex = i;
        break;
      }
    }
  }

  if (currentIndex === -1) {
    return null;
  }

  // Group into chunk-sized phrase window
  const startIdx = Math.floor(currentIndex / validChunkSize) * validChunkSize;
  const endIdx = Math.min(startIdx + validChunkSize, activeWords.length);
  const phraseWords = activeWords.slice(startIdx, endIdx);
  const activeIndex = phraseWords.findIndex(
    (w) => w.id === activeWords[currentIndex].id
  );

  const activeWordObj = activeWords[currentIndex] || null;
  const activeEmoji = activeWordObj ? getContextualEmoji(activeWordObj.word) : null;

  const start = phraseWords[0].start;
  const end = phraseWords[phraseWords.length - 1].end;
  const duration = parseFloat((end - start).toFixed(3));
  const emojis = phraseWords
    .map((w) => getContextualEmoji(w.word))
    .filter((e): e is string => Boolean(e));

  const chunk: CaptionChunk = {
    id: `chunk-${Math.floor(startIdx / validChunkSize)}-${Math.round(start * 100)}`,
    chunkIndex: Math.floor(startIdx / validChunkSize),
    words: phraseWords,
    start,
    end,
    duration,
    text: phraseWords.map((w) => w.word).join(" "),
    emojis,
  };

  return {
    phraseWords,
    activeIndex,
    activeWord: activeWordObj,
    activeEmoji,
    chunk,
  };
}

export const getActiveCaptionAtTimestamp = chunkTranscriptWords;

/**
 * All 5 curated Kinetic Caption Presets:
 * 1. Hormozi (Hormozi Gold)
 * 2. Beast Box (High-contrast yellow pill box)
 * 3. Cyber Cyan (Futuristic electric neon)
 * 4. Clean Vox (Modern minimalist documentary)
 * 5. Crimson Viral (Explosive viral red accent)
 */
export const CAPTION_PRESETS: Record<CaptionStyle, CaptionPresetConfig> = {
  hormozi: {
    id: "hormozi",
    name: "Hormozi Gold",
    label: "⚡ Hormozi Gold",
    tagline: "High retention, thick borders & yellow pop",
    defaultHighlight: "#FACC15",
    fontFamily: "font-black tracking-wide",
    textTransform: "uppercase",
    activeClass:
      "text-[#FACC15] scale-115 font-black drop-shadow-[0_0_16px_rgba(250,204,21,0.9)]",
    inactiveClass:
      "text-white/95 font-black uppercase tracking-wide drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)]",
  },
  beast: {
    id: "beast",
    name: "Beast Box",
    label: "🔥 Beast Box",
    tagline: "Angled high-contrast badge background",
    defaultHighlight: "#FACC15",
    fontFamily: "font-black tracking-tight",
    textTransform: "uppercase",
    activeClass:
      "bg-[#FACC15] text-zinc-950 px-2 py-0.5 rounded-md scale-115 rotate-[-1deg] shadow-lg shadow-amber-400/50 font-black uppercase tracking-tight",
    inactiveClass:
      "text-white font-black uppercase tracking-tight drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)]",
  },
  cyber: {
    id: "cyber",
    name: "Cyber Cyan",
    label: "🌐 Cyber Cyan",
    tagline: "Futuristic glow, neon cyan punch",
    defaultHighlight: "#38BDF8",
    fontFamily: "font-black tracking-wider",
    textTransform: "uppercase",
    activeClass:
      "text-[#38BDF8] scale-110 drop-shadow-[0_0_14px_rgba(56,189,248,0.9)] font-extrabold uppercase tracking-wider",
    inactiveClass:
      "text-white font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]",
  },
  clean: {
    id: "clean",
    name: "Clean Vox",
    label: "✨ Clean Vox",
    tagline: "Subtle modern documentary aesthetic",
    defaultHighlight: "#FFFFFF",
    fontFamily: "font-bold tracking-normal",
    textTransform: "none",
    activeClass:
      "text-white bg-white/20 px-2 py-0.5 rounded scale-105 font-bold tracking-normal backdrop-blur-sm border border-white/20",
    inactiveClass: "text-white/80 font-bold tracking-normal",
  },
  crimson: {
    id: "crimson",
    name: "Crimson Viral",
    label: "💥 Crimson Viral",
    tagline: "Intense fiery red with heavy shadow punch",
    defaultHighlight: "#EF4444",
    fontFamily: "font-black tracking-tight",
    textTransform: "uppercase",
    activeClass:
      "text-[#EF4444] scale-115 font-black uppercase tracking-tight drop-shadow-[0_0_18px_rgba(239,68,68,0.95)]",
    inactiveClass:
      "text-white font-black uppercase tracking-tight drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)]",
  },
};

/**
 * Color options for highlight customization
 */
export const CREATOR_HIGHLIGHT_COLORS = [
  { label: "Gold", value: "#FACC15" },
  { label: "Cyan", value: "#38BDF8" },
  { label: "Emerald", value: "#10B981" },
  { label: "Crimson", value: "#EF4444" },
  { label: "Pink", value: "#F43F5E" },
  { label: "Violet", value: "#A855F7" },
  { label: "White", value: "#FFFFFF" },
];

/**
 * Default CaptionSettings
 */
export const DEFAULT_CAPTION_SETTINGS: CaptionSettings = {
  style: "hormozi",
  autoEmoji: true,
  wordsPerLine: 3,
  position: "bottom",
  highlightColor: "#FACC15",
  fontSize: "lg",
};

/**
 * Returns safe-area CSS placement classes based on video aspect ratio and caption position
 */
export function getPositionClasses(
  position: CaptionPosition,
  aspectRatio: string
): string {
  const isVertical = aspectRatio === "9:16";

  switch (position) {
    case "top":
      return isVertical ? "top-[13%] sm:top-[12%]" : "top-[8%]";
    case "center":
      return "top-1/2 -translate-y-1/2";
    case "bottom":
    default:
      return isVertical ? "bottom-[22%] sm:bottom-[20%]" : "bottom-[12%]";
  }
}

export const getCaptionPositionClasses = getPositionClasses;

/**
 * Font size helper for responsive kinetic text
 */
export function getCaptionFontSizeClasses(size?: CaptionFontSize): string {
  switch (size) {
    case "sm":
      return "text-sm sm:text-base";
    case "md":
      return "text-base sm:text-lg";
    case "lg":
      return "text-lg sm:text-xl md:text-2xl";
    case "xl":
      return "text-xl sm:text-2xl md:text-3xl";
    default:
      return "text-lg sm:text-xl";
  }
}
