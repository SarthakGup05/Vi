"use client";

import React from "react";
import { Film, HardDrive, Clock, Maximize, FileCode, CheckCircle2 } from "lucide-react";
import { VideoMetadata, S3UploadState } from "@/types/studio";
import { formatFileSize, formatTimecode } from "@/lib/studio-utils";

interface MetadataCardProps {
  metadata: VideoMetadata;
  s3State: S3UploadState;
}

export function MetadataCard({ metadata, s3State }: MetadataCardProps) {
  return (
    <div className="w-full rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3 border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Media Ingestion Specs
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[200px]">
          {metadata.fileName}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Resolution */}
        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/50">
          <Maximize className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-500 font-medium uppercase">Resolution</div>
            <div className="font-mono font-semibold text-zinc-200">
              {metadata.width} × {metadata.height}
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/50">
          <Clock className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-500 font-medium uppercase">Duration</div>
            <div className="font-mono font-semibold text-zinc-200">
              {formatTimecode(metadata.duration)} ({metadata.duration.toFixed(1)}s)
            </div>
          </div>
        </div>

        {/* File Size */}
        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/50">
          <HardDrive className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-500 font-medium uppercase">File Size</div>
            <div className="font-mono font-semibold text-zinc-200">
              {formatFileSize(metadata.fileSize)}
            </div>
          </div>
        </div>

        {/* Container / Format */}
        <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/50">
          <FileCode className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-500 font-medium uppercase">Format / Ingest</div>
            <div className="font-mono font-semibold text-zinc-200 truncate max-w-[100px]">
              {metadata.format.split("/")[1]?.toUpperCase() || "MP4"}
            </div>
          </div>
        </div>
      </div>

      {/* S3 File Key Bar */}
      {s3State.fileKey && (
        <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono">
          <span className="text-zinc-500 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            S3 Key:
          </span>
          <span className="text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 truncate max-w-[320px]">
            {s3State.fileKey}
          </span>
        </div>
      )}
    </div>
  );
}
