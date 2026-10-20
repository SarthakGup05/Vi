"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  FolderOpen,
  Plus,
  UploadCloud,
  Save,
  Smartphone,
  Monitor,
  Square,
  Edit2,
  Check,
  Sparkles,
  CheckCircle2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { AspectRatioMode, S3UploadState, TranscriptionState } from "@/types/studio";
import { UserNav } from "@/components/auth/user-nav";

interface StudioHeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  aspectRatio: AspectRatioMode;
  onAspectRatioChange: (ratio: AspectRatioMode) => void;
  s3State?: S3UploadState;
  transcriptionState?: TranscriptionState;
  hasVideo: boolean;
  onResetVideo: () => void;
  onExport: () => void;
  onToggleVault: () => void;
  isVaultOpen: boolean;
  projectsCount?: number;
  onTriggerUpload: () => void;
  onSaveDraft?: () => void;
  autoSaveStatus?: "saved" | "saving" | "unsaved";
  lastSavedText?: string;
}

export function StudioHeader({
  projectName,
  onProjectNameChange,
  aspectRatio,
  onAspectRatioChange,
  s3State,
  transcriptionState,
  hasVideo,
  onResetVideo,
  onExport,
  onToggleVault,
  isVaultOpen,
  projectsCount = 4,
  onTriggerUpload,
  onSaveDraft,
  autoSaveStatus = "saved",
  lastSavedText = "2s ago",
}: StudioHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectName);
  const [showDraftPulse, setShowDraftPulse] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  useEffect(() => {
    setTempTitle(projectName);
  }, [projectName]);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onProjectNameChange(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleDraftClick = () => {
    onSaveDraft?.();
    setShowDraftPulse(true);
    setTimeout(() => setShowDraftPulse(false), 2400);
  };

  return (
    <>
      <header className="h-14 shrink-0 border-b border-white/[0.08] bg-[#0c0c0f]/95 backdrop-blur-xl px-3 sm:px-4 flex items-center justify-between sticky top-0 z-40 select-none">
        {/* Left Section: Back, Logo, Pro Badge, Inline Title & Auto-Save Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          {/* VibeCut Brand & Studio Pro v2.0 badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 via-indigo-600 to-amber-500 p-[1px] shadow-sm shadow-violet-500/20">
              <div className="w-full h-full bg-[#09090b] rounded-[7px] flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="font-black text-sm tracking-tight text-white">VibeCut</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-violet-500/15 text-violet-300 border border-violet-500/30">
                Studio Pro v2.0
              </span>
            </div>
          </div>

          {/* Inline Editable Project Title */}
          <div className="flex items-center gap-1.5 min-w-0 ml-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setIsEditingTitle(false);
                  }}
                  className="bg-zinc-900 text-white text-xs font-semibold px-2 py-1 rounded border border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-400 w-36 sm:w-52"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 hover:bg-zinc-800 rounded text-emerald-400 cursor-pointer"
                  title="Save title"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTempTitle(projectName);
                  setIsEditingTitle(true);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 hover:text-white group px-2 py-1 rounded-md hover:bg-white/[0.05] transition-colors truncate max-w-[130px] sm:max-w-[200px] cursor-pointer"
                title="Click to rename project"
              >
                <span className="truncate">{projectName}</span>
                <Edit2 className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
              </button>
            )}
          </div>

          {/* Live Auto-Save Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400 shrink-0">
            {autoSaveStatus === "saving" ? (
              <>
                <Loader2 className="h-2.5 w-2.5 animate-spin text-emerald-400" />
                <span className="text-[10px]">Saving to Cloud...</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px]">Saved to Cloud • {lastSavedText}</span>
              </>
            )}
          </div>
        </div>

        {/* Center-Right Action Group */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* My Projects Drawer Button */}
          <button
            onClick={onToggleVault}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              isVaultOpen
                ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                : "bg-[#16161c] hover:bg-[#202028] border-white/5 text-zinc-300 hover:text-white"
            }`}
            title="Open Project Vault (⌘K)"
          >
            <FolderOpen className="h-3.5 w-3.5 text-violet-400" />
            <span className="hidden md:inline">My Projects</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              {projectsCount}
            </span>
          </button>

          {/* New Project Button */}
          <button
            onClick={() => setShowNewConfirm(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-[#16161c] hover:bg-[#202028] border border-white/5 transition-all cursor-pointer"
            title="Create New Project"
          >
            <Plus className="h-3.5 w-3.5 text-zinc-400" />
            <span className="hidden sm:inline">New</span>
          </button>

          {/* Project Upload Button */}
          <button
            onClick={onTriggerUpload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-200 hover:text-white bg-[#16161c] hover:bg-[#202028] border border-white/5 transition-all cursor-pointer"
            title="Upload Media (Direct S3 Ingest)"
          >
            <UploadCloud className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Upload</span>
          </button>

          {/* Save Draft Button with visual pulse */}
          <button
            onClick={handleDraftClick}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              showDraftPulse
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-[#16161c] hover:bg-[#202028] border-white/5 text-zinc-300 hover:text-white"
            }`}
            title="Save Project Draft"
          >
            {showDraftPulse ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 animate-bounce" />
            ) : (
              <Save className="h-3.5 w-3.5 text-zinc-400" />
            )}
            <span className="hidden md:inline">
              {showDraftPulse ? "Draft Saved!" : "Save Draft"}
            </span>
          </button>

          {/* Aspect Ratio Pill Toggle (9:16 vs 1:1 vs 16:9) */}
          <div className="flex items-center bg-[#14141a] p-0.5 rounded-lg border border-white/[0.08] text-xs">
            <button
              onClick={() => onAspectRatioChange("9:16")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                aspectRatio === "9:16"
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="9:16 Shorts / Reels / TikTok"
            >
              <Smartphone className="h-3 w-3" />
              <span className="hidden xl:inline">9:16</span>
            </button>

            <button
              onClick={() => onAspectRatioChange("1:1")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                aspectRatio === "1:1"
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="1:1 Square Feed"
            >
              <Square className="h-3 w-3" />
              <span className="hidden xl:inline">1:1</span>
            </button>

            <button
              onClick={() => onAspectRatioChange("16:9")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                aspectRatio === "16:9"
                  ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="16:9 Cinema / YouTube Wide"
            >
              <Monitor className="h-3 w-3" />
              <span className="hidden xl:inline">16:9</span>
            </button>
          </div>

          {/* Primary CTA: Export 4K Button with glowing electric violet gradient */}
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-600/30 hover:shadow-violet-600/50 transition-all cursor-pointer active:scale-95 border border-violet-400/30"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Export 4K</span>
          </button>

          {/* User Nav Avatar Dropdown */}
          <UserNav />
        </div>
      </header>

      {/* Confirmation Modal for Resetting Canvas / New Project */}
      {showNewConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-[#14141a] border border-white/10 p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1.5">Start New Project?</h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              This will clear the current cutting canvas, transcript, and timeline slices.
              Unsaved changes will be discarded.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowNewConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNewConfirm(false);
                  onResetVideo();
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Reset Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
