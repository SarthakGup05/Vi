import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, isGroqConfigured, TranscriptionResult } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No audio or video file provided in form-data" },
        { status: 400 }
      );
    }

    if (!isGroqConfigured()) {
      // Return a realistic mock transcript if the key isn't pasted yet
      // so the user can test the UI immediately out of the box!
      const mockResult: TranscriptionResult = {
        text: "Hey everyone! Stop scrolling right now because this AI video editor is going to change how you make Reels forever. No VPN, no timelines, just viral edits in 60 seconds. Subscribe for more!",
        language: "en",
        duration: 9.8,
        words: [
          { word: "Hey", start: 0.1, end: 0.3 },
          { word: "everyone!", start: 0.35, end: 0.75 },
          { word: "Stop", start: 0.9, end: 1.15 },
          { word: "scrolling", start: 1.2, end: 1.6 },
          { word: "right", start: 1.65, end: 1.85 },
          { word: "now", start: 1.9, end: 2.2 },
          { word: "because", start: 2.3, end: 2.6 },
          { word: "this", start: 2.65, end: 2.85 },
          { word: "AI", start: 2.9, end: 3.1 },
          { word: "video", start: 3.15, end: 3.4 },
          { word: "editor", start: 3.45, end: 3.8 },
          { word: "is", start: 3.85, end: 4.0 },
          { word: "going", start: 4.05, end: 4.25 },
          { word: "to", start: 4.3, end: 4.4 },
          { word: "change", start: 4.45, end: 4.75 },
          { word: "how", start: 4.8, end: 4.95 },
          { word: "you", start: 5.0, end: 5.15 },
          { word: "make", start: 5.2, end: 5.4 },
          { word: "Reels", start: 5.45, end: 5.8 },
          { word: "forever.", start: 5.85, end: 6.3 },
          { word: "No", start: 6.5, end: 6.7 },
          { word: "VPN,", start: 6.75, end: 7.1 },
          { word: "no", start: 7.2, end: 7.4 },
          { word: "timelines,", start: 7.45, end: 7.9 },
          { word: "just", start: 8.0, end: 8.2 },
          { word: "viral", start: 8.25, end: 8.5 },
          { word: "edits", start: 8.55, end: 8.85 },
          { word: "in", start: 8.9, end: 9.0 },
          { word: "60", start: 9.05, end: 9.25 },
          { word: "seconds.", start: 9.3, end: 9.75 },
        ],
        segments: [
          {
            id: 0,
            seek: 0,
            start: 0.1,
            end: 2.2,
            text: "Hey everyone! Stop scrolling right now",
            tokens: [],
            temperature: 0,
            avg_logprob: -0.2,
            compression_ratio: 1.2,
            no_speech_prob: 0.01,
          },
          {
            id: 1,
            seek: 2.2,
            start: 2.3,
            end: 6.3,
            text: "because this AI video editor is going to change how you make Reels forever.",
            tokens: [],
            temperature: 0,
            avg_logprob: -0.15,
            compression_ratio: 1.2,
            no_speech_prob: 0.01,
          },
          {
            id: 2,
            seek: 6.3,
            start: 6.5,
            end: 9.75,
            text: "No VPN, no timelines, just viral edits in 60 seconds.",
            tokens: [],
            temperature: 0,
            avg_logprob: -0.18,
            compression_ratio: 1.2,
            no_speech_prob: 0.01,
          },
        ],
      };

      return NextResponse.json({
        ...mockResult,
        isMock: true,
        message: "GROQ_API_KEY not found in .env.local; returning demo transcription.",
      });
    }

    const result = await transcribeAudio(file);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Transcription API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
