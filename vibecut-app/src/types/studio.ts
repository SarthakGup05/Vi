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

export type CaptionStyle = "hormozi" | "beast" | "cyber" | "clean";

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
