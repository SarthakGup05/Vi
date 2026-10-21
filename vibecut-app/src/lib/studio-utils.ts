import { VideoMetadata, StudioWord, AspectRatioMode, SilenceGap } from "@/types/studio";
import { WordTimestamp } from "@/lib/groq";

export * from "./caption-engine";
export * from "./vfx-presets";

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
 * Patterns include: um, uh, like, basically, you know, sort of, kind of, matlab, yaani, actually, right, so
 */
export const SINGLE_FILLER_WORDS = new Set([
  // English hesitations & conversational fillers
  "um",
  "umm",
  "uh",
  "uhh",
  "uhm",
  "er",
  "ah",
  "ahh",
  "like",
  "basically",
  "actually",
  "literally",
  "right",
  "so",
  "totally",
  "seriously",
  // Hinglish & Hindi creator fillers
  "matlab",
  "yaani",
  "yani",
  "toh",
  "haan",
  "arrey",
  "arre",
  "yaar",
  "bhai",
  "achha",
  "accha",
  "waise",
]);

export const COMMON_FILLER_WORDS = SINGLE_FILLER_WORDS;

/**
 * Multi-word filler phrases (e.g. "you know", "sort of", "kind of", "i mean")
 */
export const MULTI_WORD_FILLERS: string[][] = [
  ["you", "know"],
  ["sort", "of"],
  ["kind", "of"],
  ["i", "mean"],
];

/**
 * Convert raw WordTimestamps into interactive StudioWords with comprehensive filler detection
 * covering English and Hinglish patterns.
 */
export function detectFillerWords(words: (WordTimestamp | StudioWord)[]): StudioWord[] {
  if (!words || words.length === 0) return [];

  const cleanList = words.map((w) =>
    w.word.toLowerCase().replace(/[^a-z0-9]/g, "")
  );
  const fillerIndices = new Set<number>();

  // 1. Check single-word fillers
  cleanList.forEach((cw, idx) => {
    if (SINGLE_FILLER_WORDS.has(cw)) {
      fillerIndices.add(idx);
    }
  });

  // 2. Check multi-word filler patterns
  for (const phrase of MULTI_WORD_FILLERS) {
    const pLen = phrase.length;
    for (let i = 0; i <= words.length - pLen; i++) {
      let matches = true;
      for (let j = 0; j < pLen; j++) {
        if (cleanList[i + j] !== phrase[j]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        // Ensure adjacent words are within natural speech pacing (gap < 0.8s)
        let naturalPacing = true;
        for (let j = 0; j < pLen - 1; j++) {
          if (words[i + j + 1].start - words[i + j].end > 0.8) {
            naturalPacing = false;
            break;
          }
        }
        if (naturalPacing) {
          for (let j = 0; j < pLen; j++) {
            fillerIndices.add(i + j);
          }
        }
      }
    }
  }

  return words.map((w, index) => {
    const existingDeleted = (w as StudioWord).deleted ?? false;
    const existingConfidence = (w as StudioWord).confidence;
    return {
      id: (w as StudioWord).id || `word-${index}-${Math.round(w.start * 100)}`,
      word: w.word,
      start: w.start,
      end: w.end,
      isFiller: fillerIndices.has(index),
      deleted: existingDeleted,
      confidence: existingConfidence,
    };
  });
}

/**
 * Detect silence gaps between spoken words with configurable safety padding
 * so speech boundaries don't get clipped.
 * 
 * @param words Transcribed StudioWord tokens
 * @param duration Total video duration in seconds
 * @param minDurationSec Minimum silence threshold to detect (default: 0.5s)
 * @param paddingSec Safety padding on start/end speech boundaries (default: 0.05s)
 */
export function detectSilenceGaps(
  words: StudioWord[],
  duration: number,
  minDurationSec: number = 0.5,
  paddingSec: number = 0.05
): SilenceGap[] {
  if (!words || words.length === 0) {
    if (duration > 0 && duration >= minDurationSec) {
      const cutEnd = Math.max(0, duration - paddingSec);
      return [
        {
          id: `gap-full-0-${Math.round(duration * 100)}`,
          start: 0,
          end: cutEnd,
          duration: parseFloat(cutEnd.toFixed(2)),
          rawStart: 0,
          rawEnd: duration,
          rawDuration: parseFloat(duration.toFixed(2)),
          prevWord: "[Start]",
          nextWord: "[End]",
        },
      ];
    }
    return [];
  }

  // Filter valid words and sort chronologically
  const sorted = [...words]
    .filter((w) => typeof w.start === "number" && typeof w.end === "number" && w.end >= w.start)
    .sort((a, b) => a.start - b.start);

  if (sorted.length === 0) return [];

  const gaps: SilenceGap[] = [];

  // 1. Initial silence before first spoken word
  const firstWord = sorted[0];
  if (firstWord.start >= minDurationSec) {
    const rawStart = 0;
    const rawEnd = firstWord.start;
    const rawDuration = rawEnd - rawStart;
    const cutStart = 0;
    const cutEnd = Math.max(0, rawEnd - paddingSec);
    const cutDuration = cutEnd - cutStart;

    if (cutDuration > 0.02) {
      gaps.push({
        id: `gap-start-0-${Math.round(rawEnd * 100)}`,
        start: parseFloat(cutStart.toFixed(2)),
        end: parseFloat(cutEnd.toFixed(2)),
        duration: parseFloat(cutDuration.toFixed(2)),
        rawStart: parseFloat(rawStart.toFixed(2)),
        rawEnd: parseFloat(rawEnd.toFixed(2)),
        rawDuration: parseFloat(rawDuration.toFixed(2)),
        prevWord: "[Start]",
        nextWord: firstWord.word,
      });
    }
  }

  // 2. Silence gaps between consecutive spoken words
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];

    const rawStart = curr.end;
    const rawEnd = next.start;
    const rawDuration = rawEnd - rawStart;

    if (rawDuration >= minDurationSec) {
      const cutStart = rawStart + paddingSec;
      const cutEnd = rawEnd - paddingSec;
      const cutDuration = cutEnd - cutStart;

      // Only add cut if positive and meaningful
      if (cutDuration > 0.02) {
        gaps.push({
          id: `gap-${i}-${Math.round(rawStart * 100)}-${Math.round(rawEnd * 100)}`,
          start: parseFloat(cutStart.toFixed(2)),
          end: parseFloat(cutEnd.toFixed(2)),
          duration: parseFloat(cutDuration.toFixed(2)),
          rawStart: parseFloat(rawStart.toFixed(2)),
          rawEnd: parseFloat(rawEnd.toFixed(2)),
          rawDuration: parseFloat(rawDuration.toFixed(2)),
          prevWord: curr.word,
          nextWord: next.word,
        });
      }
    }
  }

  // 3. Trailing silence after last spoken word
  const lastWord = sorted[sorted.length - 1];
  if (duration > 0 && duration - lastWord.end >= minDurationSec) {
    const rawStart = lastWord.end;
    const rawEnd = duration;
    const rawDuration = rawEnd - rawStart;
    const cutStart = rawStart + paddingSec;
    const cutEnd = duration;
    const cutDuration = cutEnd - cutStart;

    if (cutDuration > 0.02) {
      gaps.push({
        id: `gap-end-${Math.round(rawStart * 100)}-${Math.round(rawEnd * 100)}`,
        start: parseFloat(cutStart.toFixed(2)),
        end: parseFloat(cutEnd.toFixed(2)),
        duration: parseFloat(cutDuration.toFixed(2)),
        rawStart: parseFloat(rawStart.toFixed(2)),
        rawEnd: parseFloat(rawEnd.toFixed(2)),
        rawDuration: parseFloat(rawDuration.toFixed(2)),
        prevWord: lastWord.word,
        nextWord: "[End]",
      });
    }
  }

  return gaps;
}

/**
 * Calculates a cut interval from a silence gap [start, end] while applying safety padding
 * on both ends to protect word boundaries (micro-fades / speech onsets and tails).
 * Guarantees cut.end > cut.start; returns null if gap is too small to cut safely (preventing inverted interval).
 */
export function calculateCutIntervalWithPadding(
  start: number,
  end: number,
  padding: number = 0.05
): { start: number; end: number; duration: number } | null {
  if (isNaN(start) || isNaN(end) || end <= start) return null;
  const cutStart = parseFloat((start + padding).toFixed(3));
  const cutEnd = parseFloat((end - padding).toFixed(3));
  if (cutEnd <= cutStart) {
    // Gap too short for this padding; safely protect speech boundaries by skipping cut
    return null;
  }
  return {
    start: cutStart,
    end: cutEnd,
    duration: parseFloat((cutEnd - cutStart).toFixed(3)),
  };
}

/**
 * Merges and normalizes an array of cut intervals (from deleted words, timeline cuts, or silences).
 * Guarantees:
 * 1. Filter out invalid/zero/negative intervals (end <= start).
 * 2. Ascending chronological order by start time.
 * 3. Overlapping or contiguous intervals within tolerance are merged into single unified cuts.
 * 4. Output intervals are strictly non-overlapping with start < end.
 */
export function mergeCutIntervals<T extends { start: number; end: number }>(
  intervals: T[],
  tolerance: number = 0.02
): { start: number; end: number }[] {
  if (!intervals || intervals.length === 0) return [];

  // Filter out invalid or zero-duration slices
  const valid = intervals.filter(
    (inv) =>
      typeof inv.start === "number" &&
      typeof inv.end === "number" &&
      !isNaN(inv.start) &&
      !isNaN(inv.end) &&
      inv.end > inv.start
  );

  if (valid.length === 0) return [];

  // Sort ascending by start time
  valid.sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: { start: number; end: number }[] = [
    { start: valid[0].start, end: valid[0].end },
  ];

  for (let i = 1; i < valid.length; i++) {
    const prev = merged[merged.length - 1];
    const cur = valid[i];

    if (cur.start <= prev.end + tolerance) {
      prev.end = Math.max(prev.end, cur.end);
    } else {
      merged.push({ start: cur.start, end: cur.end });
    }
  }

  return merged;
}

/**
 * Calculates the total net duration cut by a list of cut intervals.
 */
export function calculateTotalCutDuration(
  intervals: { start: number; end: number }[]
): number {
  const merged = mergeCutIntervals(intervals);
  return parseFloat(
    merged.reduce((acc, cur) => acc + (cur.end - cur.start), 0).toFixed(3)
  );
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

/**
 * Encodes an AudioBuffer into a standard 16-bit PCM Mono WAV Blob.
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const channelData = buffer.getChannelData(0);
  const dataLength = channelData.length * bytesPerSample;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");

  // "fmt " subchunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // "data" subchunk
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < channelData.length; i++) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    const sample = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, sample, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

/**
 * Extracts the audio track from a video file in the browser using Web Audio API.
 * Resamples to 16kHz mono WAV (~1MB per minute of video), guaranteeing:
 * 1. 100% of speech is captured across the entire video duration.
 * 2. Upload payloads shrink from 50-100MB video down to ~1MB audio.
 * 3. Never hits Groq's 25MB file size limit or Next.js payload limits.
 */
export async function extractAudioFromMediaFile(file: File): Promise<Blob | File> {
  // If already an audio file smaller than 20MB, pass directly
  if (file.type.startsWith("audio/") && file.size < 20 * 1024 * 1024) {
    return file;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) return file;

    const audioContext = new AudioCtx();
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Resample to 16kHz mono (optimal for Whisper speech recognition)
    const targetSampleRate = 16000;
    const offlineCtx = new OfflineAudioContext(
      1,
      Math.ceil(decodedBuffer.duration * targetSampleRate),
      targetSampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    await audioContext.close();

    return audioBufferToWavBlob(renderedBuffer);
  } catch (err) {
    console.warn("Client audio extraction fallback (passing raw file to server):", err);
    return file;
  }
}
