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
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured in .env.local. Please provide your real Groq API key." },
        { status: 500 }
      );
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
