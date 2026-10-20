"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Search,
  Plus,
  Clock,
  Sparkles,
  Smartphone,
  Monitor,
  Square,
  Film,
  Flame,
  ArrowRight,
  TrendingUp,
  FolderOpen,
} from "lucide-react";
import { ProjectVaultItem, AspectRatioMode } from "@/types/studio";

interface ProjectVaultDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: ProjectVaultItem[];
  onSelectProject: (project: ProjectVaultItem) => void;
  onCreateBlank: () => void;
  activeProjectId?: string;
}

export function ProjectVaultDrawer({
  isOpen,
  onClose,
  projects = [],
  onSelectProject,
  onCreateBlank,
  activeProjectId,
}: ProjectVaultDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const allProjects = projects;

  // Keyboard shortcut: Escape closes drawer, ⌘K focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k" && isOpen) {
        e.preventDefault();
        document.getElementById("vault-search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return allProjects;
    return allProjects.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [allProjects, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-sm sm:max-w-md h-full bg-[#121217] border-r border-white/10 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
        {/* Drawer Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/30 flex items-center justify-center">
              <FolderOpen className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Project Vault
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20">
                  {allProjects.length} Projects
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">All local & synced video edits</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Close Vault (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Action: Create Blank Reel */}
        <div className="p-3 border-b border-white/[0.06]">
          <button
            onClick={() => {
              onCreateBlank();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-600/25 transition-all cursor-pointer active:scale-[0.99]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Create Blank Reel</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              id="vault-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reels or clips... (⌘K)"
              className="w-full bg-[#181820] text-zinc-200 placeholder-zinc-500 text-xs rounded-xl pl-9 pr-8 py-2 border border-white/[0.08] focus:outline-none focus:border-violet-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Project Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-zinc-800">
          {filteredProjects.length === 0 ? (
            <div className="py-14 px-4 text-center text-zinc-500">
              <Film className="h-10 w-10 mx-auto mb-3 opacity-30 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-300 mb-1">
                {searchQuery ? "No matching projects found" : "No saved projects in vault"}
              </p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                {searchQuery
                  ? "Try searching for a different video title."
                  : "Upload a video clip and click 'Save Draft' to persist your EDL revisions here."}
              </p>
            </div>
          ) : (
            filteredProjects.map((p) => {
              const isActive = activeProjectId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p);
                    onClose();
                  }}
                  className={`group relative rounded-xl p-3 border transition-all cursor-pointer select-none ${
                    isActive
                      ? "bg-[#1d1d28] border-violet-500/60 shadow-lg shadow-violet-500/10"
                      : "bg-[#181820] hover:bg-[#1f1f2a] border-white/[0.06] hover:border-violet-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail representation */}
                    <div
                      className={`relative shrink-0 rounded-lg overflow-hidden border border-white/10 bg-gradient-to-br ${p.thumbnailGradient} flex flex-col items-center justify-center ${
                        p.aspectRatio === "9:16"
                          ? "w-12 h-16"
                          : p.aspectRatio === "1:1"
                          ? "w-14 h-14"
                          : "w-16 h-11"
                      }`}
                    >
                      <Film className="h-4 w-4 text-white/40" />
                      <span className="text-[9px] font-mono text-zinc-400 mt-1">
                        {p.duration}s
                      </span>
                    </div>

                    {/* Metadata & Badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                          {p.title}
                        </h4>
                        {p.status === "Ready" ? (
                          <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                            Ready
                          </span>
                        ) : p.status === "Exported" ? (
                          <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/25">
                            Exported
                          </span>
                        ) : (
                          <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Draft
                          </span>
                        )}
                      </div>

                      {/* Info row */}
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-zinc-500" />
                          {p.updatedAt}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {p.aspectRatio === "9:16" ? (
                            <Smartphone className="h-3 w-3 text-zinc-500" />
                          ) : p.aspectRatio === "1:1" ? (
                            <Square className="h-3 w-3 text-zinc-500" />
                          ) : (
                            <Monitor className="h-3 w-3 text-zinc-500" />
                          )}
                          {p.aspectRatio}
                        </span>
                      </div>

                      {/* Retention score pill */}
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/25 text-[10px] font-bold text-amber-300">
                          <Flame className="h-3 w-3 text-amber-400 fill-amber-400" />
                          <span>{p.retentionScore}% Retention</span>
                        </div>

                        <span className="text-[11px] text-zinc-500 group-hover:text-violet-400 font-medium flex items-center gap-0.5 transition-colors">
                          Load <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/[0.08] bg-[#0f0f13] flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span>Cloud Sync: Active</span>
          </span>
          <span className="text-zinc-500">CapCut & Descript format compatible</span>
        </div>
      </div>
    </div>
  );
}
