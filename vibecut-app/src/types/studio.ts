import { TranscriptionResult, WordTimestamp, SegmentTimestamp } from "@/lib/groq";

export interface StudioWord extends WordTimestamp {
  id: string;
  isFiller?: boolean;
  deleted?: boolean;
  confidence?: number;
}

export type AspectRatioMode = "9:16" | "16:9" | "1:1" | "original";

export interface VideoMetadata {
  fileName: string;
  fileSize: number; // in bytes
  duration: number; // in seconds
  width: number;
  height: number;
  aspectRatio: AspectRatioMode;
  format: string;
  lastModified?: number;
}

export interface S3UploadState {
  status: "idle" | "requesting_url" | "uploading" | "completed" | "error";
  progress: number; // 0 to 100
  fileKey?: string;
  bucket?: string;
  uploadUrl?: string;
  isMock?: boolean;
  errorMessage?: string;
  bytesUploaded?: number;
  totalBytes?: number;
}

export interface TranscriptionState {
  status: "idle" | "extracting_audio" | "transcribing" | "completed" | "error";
  progress: number; // 0 to 100
  result?: TranscriptionResult;
  isMock?: boolean;
  errorMessage?: string;
  language?: string;
  duration?: number;
}

export type StudioTab = "transcript" | "ingestion" | "silence" | "captions" | "audio" | "presets";

export type ActivityRailTab = "media" | "subtitles" | "silence" | "broll" | "audio" | "presets";

export type SfxCueId = "whoosh" | "boom" | "ding" | "bell" | "pop" | "cash" | "glitch" | "tape_click" | "tape";
export type SFXSoundId = SfxCueId;

export type CaptionStyle = "hormozi" | "beast" | "cyber" | "clean" | "crimson";

export type CaptionPosition = "top" | "center" | "bottom";

export type WordsPerLine = 1 | 3 | 5;

export type CaptionFontSize = "sm" | "md" | "lg" | "xl";

export interface CaptionHighlightColorItem {
  id: string;
  name: string;
  hex: string;
  bgClass: string;
}

export const CAPTION_HIGHLIGHT_COLORS: CaptionHighlightColorItem[] = [
  { id: "gold", name: "Gold", hex: "#FACC15", bgClass: "bg-[#FACC15]" },
  { id: "emerald", name: "Neon Emerald", hex: "#10B981", bgClass: "bg-[#10B981]" },
  { id: "cyan", name: "Cyber Cyan", hex: "#38BDF8", bgClass: "bg-[#38BDF8]" },
  { id: "rose", name: "Hot Rose", hex: "#F43F5E", bgClass: "bg-[#F43F5E]" },
];

export interface CaptionSettings {
  style: CaptionStyle;
  autoEmoji: boolean;
  wordsPerLine: number;
  position: "top" | "center" | "bottom";
  highlightColor: string;
  fontSize: "sm" | "md" | "lg" | "xl";
}

export interface CaptionChunk {
  id: string;
  chunkIndex: number;
  words: StudioWord[];
  start: number;
  end: number;
  duration: number;
  text: string;
  emojis: string[];
}

export interface ActiveCaptionState {
  phraseWords: StudioWord[];
  activeIndex: number;
  activeWord: StudioWord | null;
  activeEmoji: string | null;
  chunk?: CaptionChunk | null;
}

export interface CaptionPresetConfig {
  id: CaptionStyle;
  name: string;
  label: string;
  tagline: string;
  defaultHighlight: string;
  fontFamily: string;
  textTransform: "uppercase" | "none" | "capitalize";
  activeClass: string;
  inactiveClass: string;
}

export interface ProjectVaultItem {
  id: string;
  title: string;
  updatedAt: string;
  aspectRatio: AspectRatioMode;
  duration: number; // in seconds
  retentionScore: number; // 0-100 percentage
  status: "Draft" | "Exported" | "Ready";
  thumbnailGradient: string;
  wordCount?: number;
  s3Key?: string;
  videoStreamUrl?: string;
  fileSizeBytes?: number;
}

export interface TimelineCut {
  id: string;
  start: number;
  end: number;
  type: "silence" | "manual" | "filler";
  label?: string;
}

export interface SilenceGap {
  id: string;
  start: number;       // Safety-padded cut start time (in seconds)
  end: number;         // Safety-padded cut end time (in seconds)
  duration: number;    // Effective silence cut duration
  rawStart: number;    // Exact speech boundary start
  rawEnd: number;      // Exact speech boundary end
  rawDuration: number; // Unpadded silence duration
  prevWord?: string;   // Spoken word preceding silence
  nextWord?: string;   // Spoken word following silence
}

export type TrendingTemplateId = "cinematic" | "hyper_fast" | "beast_viral" | "cyber_glitch" | "vintage_vhs";

export type VFXFilterId = "none" | "film_grain" | "rgb_split" | "vhs_retro" | "cyber_scan" | "letterbox_cinematic";

export type PunchZoomCadence = "off" | "fast_3s" | "natural_5s" | "emphasis" | "3s" | "5s";

export type PunchZoomScale = 1.10 | 1.15 | 1.20 | number;

export interface PunchZoomInterval {
  id: string;
  start: number;
  end: number;
  scale: number;
  originX?: number; // 0-100%
  originY?: number; // 0-100%
  isEmphasis?: boolean;
  reason?: "cadence" | "emphasis" | "hook";
}

export interface VFXSettings {
  filter: VFXFilterId;
  intensity: number; // 0 - 100
  letterbox: boolean;
  grain: boolean;
  rgbSplit: boolean;
  scanlines: boolean;
  vhsHud: boolean;
  colorGrade?: "none" | "teal_orange" | "cyber_cyan" | "vhs_warm" | "beast_punch" | "monochrome";
}

export interface SFXSettings {
  enabled: boolean;
  masterVolume: number; // 0.0 - 1.0
  zoomWhoosh: boolean;
  cutWhoosh: boolean;
  emojiPop: boolean;
  emphasisImpact: boolean;
  vhsTapeClick?: boolean;
}

export interface TemplatePreset {
  id: TrendingTemplateId;
  name: string;
  label?: string;
  tagline: string;
  badge?: string;
  platform?: "Instagram" | "VN / CapCut" | "TikTok" | "YouTube Shorts" | string;
  description?: string;
  gradient?: string;
  borderClass?: string;
  accentColor?: string;
  captionStyle: CaptionStyle;
  captionHighlightColor?: string;
  captionHighlight?: string;
  captionPosition?: CaptionPosition;
  wordsPerLine: WordsPerLine;
  autoEmoji: boolean;
  zoomCadence?: PunchZoomCadence;
  punchZoomCadence?: PunchZoomCadence;
  zoomScale?: number;
  punchZoomScale?: number;
  vfxFilter?: VFXFilterId;
  sfxCue?: SFXSoundId;
  vfx?: VFXSettings;
  sfx?: SFXSettings;
}
