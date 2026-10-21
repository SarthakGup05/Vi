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

export type StudioTab = "transcript" | "ingestion" | "silence" | "captions" | "audio";

export type ActivityRailTab = "media" | "subtitles" | "silence" | "broll" | "audio" | "presets";

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
