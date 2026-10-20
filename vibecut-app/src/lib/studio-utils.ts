import { VideoMetadata, StudioWord, AspectRatioMode } from "@/types/studio";
import { WordTimestamp } from "@/lib/groq";

/**
 * Format seconds into mm:ss.s timecode string (e.g. 00:04.2)
 */
export function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00.0";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${tenths}`;
}

/**
 * Format bytes into human-readable string (e.g. 14.8 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Common filler words in English, Hindi, and Hinglish creator speech
 */
const COMMON_FILLER_WORDS = new Set([
  "um",
  "umm",
  "uh",
  "uhh",
  "like",
  "basically",
  "actually",
  "literally",
  "matlab",
  "toh",
  "haan",
  "arrey",
  "yaar",
  "bhai",
  "so",
]);

/**
 * Convert raw WordTimestamps into interactive StudioWords with filler detection
 */
export function detectFillerWords(words: WordTimestamp[]): StudioWord[] {
  return words.map((w, index) => {
    // Strip punctuation to check base word
    const cleanWord = w.word.toLowerCase().replace(/[^a-z0-9]/g, "");
    const isFiller = COMMON_FILLER_WORDS.has(cleanWord);

    return {
      id: `word-${index}-${Math.round(w.start * 100)}`,
      word: w.word,
      start: w.start,
      end: w.end,
      isFiller,
      deleted: false,
    };
  });
}

/**
 * Extract video resolution, duration, aspect ratio from a File object
 */
export function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const width = video.videoWidth || 1080;
      const height = video.videoHeight || 1920;
      const duration = video.duration || 0;

      let aspectRatio: AspectRatioMode = "9:16";
      if (width > height) {
        aspectRatio = "16:9";
      } else if (Math.abs(width / height - 9 / 16) < 0.1) {
        aspectRatio = "9:16";
      } else {
        aspectRatio = "9:16";
      }

      resolve({
        fileName: file.name,
        fileSize: file.size,
        duration,
        width,
        height,
        aspectRatio,
        format: file.type || "video/mp4",
        lastModified: file.lastModified,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        fileName: file.name,
        fileSize: file.size,
        duration: 9.8,
        width: 1080,
        height: 1920,
        aspectRatio: "9:16",
        format: file.type || "video/mp4",
        lastModified: file.lastModified,
      });
    };
  });
}
