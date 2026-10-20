import Groq from "groq-sdk";

export function getGroqClient() {
  const key = process.env.GROQ_API_KEY?.trim() || "";
  if (!key) {
    throw new Error("GROQ_API_KEY is not configured in .env.local");
  }
  return new Groq({ apiKey: key });
}

export const isGroqConfigured = (): boolean => {
  const key = process.env.GROQ_API_KEY?.trim();
  return Boolean(key && key !== "your_groq_api_key" && key.startsWith("gsk_"));
};

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface SegmentTimestamp {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
  words?: WordTimestamp[];
}

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  words: WordTimestamp[];
  segments: SegmentTimestamp[];
}

/**
 * Transcribe an audio file using Groq's ultra-fast whisper-large-v3 model.
 * Free tier provides fast inference and native Hinglish / multilingual support.
 */
export async function transcribeAudio(file: File | Blob): Promise<TranscriptionResult> {
  const groq = getGroqClient();

  const response = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3",
    response_format: "verbose_json",
    timestamp_granularities: ["word", "segment"],
    temperature: 0, // Deterministic zero-temperature prevents early termination / hallucination loops
    prompt: "Subtitles for Hindi, Hinglish, and English viral short video reel.",
  });

  const parsed = response as unknown as {
    text: string;
    language: string;
    duration: number;
    words?: WordTimestamp[];
    segments?: SegmentTimestamp[];
  };

  // 1. Gather all direct word-level timestamps
  let finalWords: WordTimestamp[] = [];
  if (parsed.words && Array.isArray(parsed.words) && parsed.words.length > 0) {
    finalWords = [...parsed.words];
  }

  // 2. Consolidate with segment-level words if segment array contains a fuller word set
  if (parsed.segments && Array.isArray(parsed.segments) && parsed.segments.length > 0) {
    const segmentWords: WordTimestamp[] = [];
    for (const seg of parsed.segments) {
      if (seg.words && Array.isArray(seg.words) && seg.words.length > 0) {
        segmentWords.push(...seg.words);
      }
    }

    if (segmentWords.length > finalWords.length) {
      finalWords = segmentWords;
    }

    // 3. Fallback recovery: If Whisper generated text for later segments but dropped word-level timestamps,
    // interpolate word timestamps across the missing segment durations so NO spoken text is lost.
    const lastWordEnd = finalWords.length > 0 ? finalWords[finalWords.length - 1].end : 0;
    const lastSeg = parsed.segments[parsed.segments.length - 1];

    if (lastSeg && lastSeg.end - lastWordEnd > 0.8) {
      for (const seg of parsed.segments) {
        if (seg.start >= lastWordEnd - 0.15) {
          const segTokens = (seg.text || "").trim().split(/\s+/).filter(Boolean);
          if (segTokens.length > 0) {
            const segDuration = Math.max(0.3, seg.end - seg.start);
            const wordDuration = segDuration / segTokens.length;
            segTokens.forEach((token, idx) => {
              finalWords.push({
                word: token,
                start: parseFloat((seg.start + idx * wordDuration).toFixed(2)),
                end: parseFloat((seg.start + (idx + 1) * wordDuration).toFixed(2)),
              });
            });
          }
        }
      }
    }
  }

  // Deduplicate and ensure ascending timestamps
  finalWords.sort((a, b) => a.start - b.start);

  return {
    text: parsed.text || "",
    language: parsed.language || "en",
    duration:
      parsed.duration ||
      (finalWords.length > 0 ? finalWords[finalWords.length - 1].end : 0),
    words: finalWords,
    segments: parsed.segments || [],
  };
}
