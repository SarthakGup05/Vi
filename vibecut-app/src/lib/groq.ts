import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY || "";

export const groq = new Groq({
  apiKey,
});

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
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in .env.local");
  }

  const response = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3",
    response_format: "verbose_json",
    timestamp_granularities: ["word", "segment"],
    // Prompt hints for Hinglish / Indian creator vocabulary
    prompt: "Subtitles for Hindi, Hinglish, and English viral short video reel.",
  });

  const parsed = response as unknown as {
    text: string;
    language: string;
    duration: number;
    words?: WordTimestamp[];
    segments?: SegmentTimestamp[];
  };

  return {
    text: parsed.text || "",
    language: parsed.language || "en",
    duration: parsed.duration || 0,
    words: parsed.words || [],
    segments: parsed.segments || [],
  };
}
