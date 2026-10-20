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
 * Generate a dynamic 9.8s sample video file in-memory using Canvas & Web Audio
 * Useful for 1-click zero-setup demo testing in any browser.
 */
export async function createSampleDemoVideoFile(): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext("2d");

  // Create Web Audio context for tone generation
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioCtx();
  const dest = audioContext.createMediaStreamDestination();

  // Create an oscillator that hums softly during video playback
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, audioContext.currentTime);
  gain.gain.setValueAtTime(0.05, audioContext.currentTime);
  osc.connect(gain);
  gain.connect(dest);
  osc.start();

  const canvasStream = canvas.captureStream(30);
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  let mimeType = "video/webm";
  if (MediaRecorder.isTypeSupported("video/mp4")) {
    mimeType = "video/mp4";
  } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
    mimeType = "video/webm;codecs=vp9";
  }

  const recorder = new MediaRecorder(combinedStream, { mimeType });
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  return new Promise((resolve) => {
    let frame = 0;
    const totalFrames = 30 * 9.8; // ~9.8s

    const drawFrame = () => {
      if (!ctx) return;
      const progress = frame / totalFrames;
      const timeSec = (frame / 30).toFixed(1);

      // Background gradient (Obsidian dark to violet)
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#09090b");
      grad.addColorStop(0.5, "#18181b");
      grad.addColorStop(1, "#2e1065");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer glow pulse
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 8;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Top badge
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⚡ VibeCut AI Studio Demo", canvas.width / 2, 120);

      // Subtitle
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "20px sans-serif";
      ctx.fillText("9:16 Creator Short • 9.8s", canvas.width / 2, 160);

      // Visual audio waveforms
      const barCount = 24;
      const barWidth = 12;
      const barSpacing = 16;
      const startX = (canvas.width - barCount * (barWidth + barSpacing)) / 2;

      for (let i = 0; i < barCount; i++) {
        const heightMultiplier = Math.sin(frame * 0.15 + i * 0.5) * 0.5 + 0.5;
        const barHeight = 40 + heightMultiplier * 140;
        const x = startX + i * (barWidth + barSpacing);
        const y = canvas.height / 2 - barHeight / 2;

        ctx.fillStyle = i % 2 === 0 ? "#a855f7" : "#f59e0b";
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 6);
        ctx.fill();
      }

      // Word display simulation
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px sans-serif";
      const sampleText =
        timeSec < "2.2"
          ? "Hey everyone! Stop scrolling right now"
          : timeSec < "6.3"
          ? "This AI editor changes how you make Reels!"
          : "No VPN, no timelines, viral in 60s!";
      ctx.fillText(sampleText, canvas.width / 2, canvas.height / 2 + 180);

      // Timecode
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 28px monospace";
      ctx.fillText(`00:0${Math.floor(Number(timeSec))}.0 / 00:09.8`, canvas.width / 2, canvas.height - 120);

      // Progress bar
      ctx.fillStyle = "#27272a";
      ctx.fillRect(80, canvas.height - 80, canvas.width - 160, 10);
      ctx.fillStyle = "#8b5cf6";
      ctx.fillRect(80, canvas.height - 80, (canvas.width - 160) * progress, 10);

      frame++;
      if (frame < totalFrames && recorder.state === "recording") {
        requestAnimationFrame(drawFrame);
      } else {
        try {
          osc.stop();
          audioContext.close();
        } catch {
          // ignore
        }
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `sample-creator-reel.${extension}`, {
        type: mimeType,
      });
      resolve(file);
    };

    recorder.start();
    drawFrame();
  });
}
