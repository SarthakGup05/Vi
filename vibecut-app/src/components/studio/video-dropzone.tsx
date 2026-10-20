"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import {
  UploadCloud,
  FileVideo,
  Sparkles,
  Zap,
  Play,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Film,
} from "lucide-react";
import { createSampleDemoVideoFile } from "@/lib/studio-utils";

interface VideoDropzoneProps {
  onVideoSelected: (file: File) => void;
  isProcessing?: boolean;
}

export function VideoDropzone({ onVideoSelected, isProcessing = false }: VideoDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    setValidationError(null);

    const validTypes = ["video/mp4", "video/quicktime", "video/webm"];
    const extension = file.name.split(".").pop()?.toLowerCase();
    const isValidExtension = ["mp4", "mov", "webm"].includes(extension || "");

    if (!validTypes.includes(file.type) && !isValidExtension) {
      setValidationError("Please select a valid video file (.mp4, .mov, or .webm)");
      return;
    }

    // Maximum 500MB safety check
    if (file.size > 500 * 1024 * 1024) {
      setValidationError("Video file exceeds 500MB limit. Please upload a shorter clip.");
      return;
    }

    onVideoSelected(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setIsGeneratingDemo(true);
      const demoFile = await createSampleDemoVideoFile();
      onVideoSelected(demoFile);
    } catch (err) {
      console.error("Failed to generate demo reel:", err);
      setValidationError("Could not generate demo video. Please choose a local file.");
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-10 px-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Hero Ingestion Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group rounded-3xl border-2 border-dashed transition-all duration-300 p-8 sm:p-14 text-center cursor-pointer overflow-hidden ${
          isDragOver
            ? "border-violet-400 bg-violet-950/25 scale-[1.01] shadow-2xl shadow-violet-500/20"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/70"
        }`}
      >
        {/* Glow ambient effects */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-violet-600/20 transition-colors" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-400/15 transition-colors" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Animated upload icon circle */}
          <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:border-violet-500/60 transition-all duration-300">
            <UploadCloud className="h-10 w-10 text-violet-400 group-hover:text-amber-400 transition-colors" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            Drop your raw footage here
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base max-w-md mb-6 leading-relaxed">
            Drag & drop your video or{" "}
            <span className="text-violet-400 font-semibold underline underline-offset-4 hover:text-violet-300">
              browse files
            </span>
            . Supports <span className="text-zinc-200 font-mono">.mp4</span>,{" "}
            <span className="text-zinc-200 font-mono">.mov</span>, and{" "}
            <span className="text-zinc-200 font-mono">.webm</span>.
          </p>

          {/* Validation error message */}
          {validationError && (
            <div className="mb-6 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {validationError}
            </div>
          )}

          {/* Button row */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/25 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <FileVideo className="h-4 w-4" />
              <span>Select Video File</span>
            </button>

            {/* Instant Demo Reel Generator Button */}
            <button
              type="button"
              disabled={isGeneratingDemo || isProcessing}
              onClick={(e) => {
                e.stopPropagation();
                handleLoadDemo();
              }}
              className="px-5 py-3 rounded-full bg-zinc-900 border border-amber-400/40 hover:border-amber-400 text-amber-300 font-semibold text-sm hover:bg-amber-400/10 transition-all active:scale-95 cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-60"
            >
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span>
                {isGeneratingDemo ? "Synthesizing Demo Reel..." : "Load Sample Demo Reel (9.8s)"}
              </span>
            </button>
          </div>

          <div className="mt-8 flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Direct S3 Multipart Upload
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" /> Groq Whisper-v3 Ingestion
            </span>
          </div>
        </div>
      </div>

      {/* Three Feature Highlight Cards */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Direct S3 Ingest</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Presigned browser-to-S3 uploads bypass Next.js & Vercel body limits completely.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Whisper-v3 Timestamps</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sub-3s word-level transcription with built-in Hinglish & Indian dialect support.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Play className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Zero-Wait Local Preview</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Instant playback using in-memory ObjectURL while cloud sync streams in background.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
