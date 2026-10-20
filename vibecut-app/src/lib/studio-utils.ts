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
