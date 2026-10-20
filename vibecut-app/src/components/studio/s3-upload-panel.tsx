"use client";

import React from "react";
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  Database,
  ShieldCheck,
  Server,
  Zap,
} from "lucide-react";
import { S3UploadState } from "@/types/studio";
import { formatFileSize } from "@/lib/studio-utils";

interface S3UploadPanelProps {
  s3State: S3UploadState;
  onRetry?: () => void;
}

export function S3UploadPanel({ s3State, onRetry }: S3UploadPanelProps) {
  return (
    <div className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            <Cloud className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Direct S3 Ingestion</h3>
            <p className="text-[11px] text-zinc-400">
              Presigned browser-to-cloud upload pipeline
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono">
          {s3State.status === "uploading" ? (
            <span className="flex items-center gap-1.5 text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
              <Loader2 className="h-3 w-3 animate-spin" /> Uploading {s3State.progress}%
            </span>
          ) : s3State.status === "completed" ? (
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="h-3 w-3" /> Synced to S3
            </span>
          ) : s3State.status === "error" ? (
            <span className="flex items-center gap-1.5 text-rose-400 bg-rose-400/10 border border-rose-400/30 px-2.5 py-0.5 rounded-full">
              <AlertCircle className="h-3 w-3" /> Failed
            </span>
          ) : (
            <span className="text-zinc-500 bg-zinc-800/60 px-2.5 py-0.5 rounded-full">
              Standby
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400">
            {s3State.status === "requesting_url"
              ? "Requesting presigned upload URL..."
              : s3State.status === "uploading"
              ? "Streaming chunked payload directly to S3 bucket..."
              : s3State.status === "completed"
              ? s3State.isMock
                ? "Mock Ingestion Complete (Local Dev Mode)"
                : "Uploaded to AWS S3 successfully!"
              : s3State.status === "error"
              ? s3State.errorMessage || "Upload error encountered"
              : "Ready to upload"}
          </span>
          <span className="font-bold text-white">{s3State.progress}%</span>
        </div>

        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              s3State.status === "error"
                ? "bg-rose-500"
                : s3State.status === "completed"
                ? "bg-emerald-500"
                : "bg-gradient-to-r from-amber-500 to-violet-500"
            }`}
            style={{ width: `${s3State.progress}%` }}
          />
        </div>

        {/* Byte Stats if available */}
        {s3State.totalBytes ? (
          <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
            <span>
              {formatFileSize(s3State.bytesUploaded || 0)} / {formatFileSize(s3State.totalBytes)}
            </span>
            <span>Multipart Stream</span>
          </div>
        ) : null}
      </div>

      {/* Technical Ingestion Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60 flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-zinc-500">Bucket:</span>
          <span className="text-zinc-200 font-semibold truncate">
            {s3State.bucket || "vibecut-uploads"}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/60 flex items-center gap-2">
          <Server className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-zinc-500">Mode:</span>
          <span className="text-amber-400 font-semibold truncate">
            {s3State.isMock ? "Mock / Local Fallback" : "Live AWS S3"}
          </span>
        </div>
      </div>

      {s3State.isMock && (
        <div className="mt-3 p-3 rounded-xl bg-amber-400/5 border border-amber-400/20 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-2">
          <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Zero-Configuration Out-of-the-Box Mode:</span> AWS S3 credentials are not set in <code className="text-white bg-zinc-800 px-1 py-0.5 rounded">.env.local</code>. Studio seamlessly runs with fast mock ingestion so you can test all features without any cloud setup!
          </div>
        </div>
      )}

      {s3State.status === "error" && onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 w-full py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors"
        >
          Retry S3 Upload
        </button>
      )}
    </div>
  );
}
