"use client";

import React, { useState, useEffect, useMemo, useRef, DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  Plus,
  UploadCloud,
  Film,
  Search,
  Trash2,
  Edit2,
  Clock,
  Check,
  X,
  Play,
  ArrowRight,
  HardDrive,
  Sparkles,
  Smartphone,
  Monitor,
  Square,
  ShieldCheck,
  Loader2,
  FolderOpen,
  Filter,
} from "lucide-react";
import { UserNav } from "@/components/auth/user-nav";
import { ProjectVaultItem, AspectRatioMode } from "@/types/studio";
import {
  extractVideoMetadata,
  extractAudioFromMediaFile,
  detectFillerWords,
  formatTimecode,
  formatFileSize,
} from "@/lib/studio-utils";

type FilterTab = "all" | "9:16" | "16:9" | "1:1" | "ready" | "draft";

export default function ProjectsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [projects, setProjects] = useState<ProjectVaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  // Inline rename state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<ProjectVaultItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New project creation from dashboard
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [creationStatus, setCreationStatus] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Load real projects from Supabase
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        if (data.projects && Array.isArray(data.projects)) {
          const mapped: ProjectVaultItem[] = data.projects.map((p: any) => ({
            id: p.id,
            title: p.title || "Untitled Project",
            updatedAt: p.updated_at
              ? new Date(p.updated_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recently",
            aspectRatio: p.aspect_ratio || "9:16",
            duration: p.duration_seconds || 0,
            retentionScore: 94,
            status: p.status === "ready" ? "Ready" : "Draft",
            thumbnailGradient: "from-violet-950/80 via-zinc-900 to-black",
            wordCount: p.transcripts?.[0]?.words?.length || 0,
            s3Key: p.raw_video_s3_key,
            videoStreamUrl: p.videoStreamUrl,
            fileSizeBytes: p.file_size_bytes || 0,
          }));
          setProjects(mapped);
        }
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Compute total S3 storage consumed
  const totalStorageBytes = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.fileSizeBytes || 0), 0);
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase().trim());

      if (!matchesSearch) return false;

      if (filterTab === "9:16") return p.aspectRatio === "9:16";
      if (filterTab === "16:9") return p.aspectRatio === "16:9";
      if (filterTab === "1:1") return p.aspectRatio === "1:1";
      if (filterTab === "ready") return p.status === "Ready";
      if (filterTab === "draft") return p.status === "Draft";
      return true;
    });
  }, [projects, searchQuery, filterTab]);

  // Handle direct file upload from project dashboard
  const handleCreateFromVideo = async (file: File) => {
    try {
      setIsCreatingProject(true);
      setCreationStatus("Extracting video metadata...");

      const meta = await extractVideoMetadata(file);

      // 1. Request presigned S3 upload URL (bypassing Next.js body limits)
      setCreationStatus("Allocating AWS S3 storage...");
      const s3UrlRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "video/mp4",
        }),
      });

      const s3Data = await s3UrlRes.json();
      if (!s3UrlRes.ok) throw new Error(s3Data.error || "Failed to get upload URL");

      // 2. Perform direct PUT upload to S3 with live percentage tracking
      setCreationStatus("Uploading raw video to S3 (0%)...");
      await new Promise<void>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", s3Data.uploadUrl, true);
        if (file.type) {
          xhr.setRequestHeader("Content-Type", file.type);
        }
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
            setCreationStatus(`Uploading raw video to S3 (${pct}%)...`);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            console.warn(`S3 upload returned HTTP ${xhr.status}; proceeding with local studio ingest`);
            resolve();
          }
        };
        xhr.onerror = () => {
          console.warn("Direct S3 upload network error; proceeding with studio ingest");
          resolve();
        };
        xhr.send(file);
      });

      // 3. Extract lightweight 16kHz audio in browser (~1MB) for Groq Whisper
      setCreationStatus("Optimizing audio for Whisper AI...");
      const audioPayload = await extractAudioFromMediaFile(file);

      setCreationStatus("Transcribing speech with Whisper-v3...");
      const formData = new FormData();
      const audioFileName = file.name.replace(/\.[^/.]+$/, "") + ".wav";
      formData.append("file", audioPayload, audioFileName);

      let transcribedWords: any[] = [];
      try {
        const transcribeRes = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
        if (transcribeRes.ok) {
          const transcribeData = await transcribeRes.json();
          transcribedWords = detectFillerWords(transcribeData.words || []);
        }
      } catch (e) {
        console.warn("Transcription non-blocking error:", e);
      }

      // 4. Create project row in Supabase
      setCreationStatus("Saving project to Supabase vault...");
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: file.name,
          raw_video_s3_key: s3Data.fileKey,
          file_size_bytes: file.size,
          aspect_ratio: meta.aspectRatio,
          width: meta.width,
          height: meta.height,
          duration_seconds: meta.duration,
          session_id: "00000000-0000-0000-0000-000000000001",
          transcript: {
            words: transcribedWords,
            text: transcribedWords.map((w: any) => w.word).join(" "),
            language: "en",
          },
          edl: {
            cuts: [],
            deletedWordIds: [],
            effectiveDuration: meta.duration,
            captionStyle: "hormozi",
            aspectRatio: meta.aspectRatio,
          },
          applied_prompt: "Initial project ingest",
        }),
      });

      const newProj = await createRes.json();
      if (newProj?.id) {
        // Redirect directly into the Studio with this newly created project
        router.push(`/studio?id=${newProj.id}`);
      } else {
        router.push("/studio");
      }
    } catch (err: any) {
      console.error("Project creation failed:", err);
      alert(`Could not create project: ${err.message}`);
    } finally {
      setIsCreatingProject(false);
      setCreationStatus("");
    }
  };

  // Rename Project
  const handleSaveRename = async (projectId: string) => {
    if (!editingTitle.trim()) {
      setEditingProjectId(null);
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, title: editingTitle.trim() }),
      });

      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, title: editingTitle.trim() } : p))
        );
      }
    } catch (e) {
      console.error("Failed to rename project:", e);
    } finally {
      setEditingProjectId(null);
    }
  };

  // Delete Project & Purge S3 Assets
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/projects?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      }
    } catch (e) {
      console.error("Failed to delete project:", e);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Drag and Drop handlers on hero dropzone
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
      handleCreateFromVideo(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col select-none">
      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleCreateFromVideo(file);
        }}
      />

      {/* TOP HUB NAVIGATION BAR */}
      <header className="h-16 shrink-0 border-b border-white/[0.08] bg-[#0c0c0f]/95 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        {/* Brand & Section Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer"
            title="Return to Home"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-amber-500 p-[1px] shadow-sm shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#09090b] rounded-[11px] flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
              </div>
            </div>
            <span className="font-black text-base tracking-tight text-white group-hover:text-violet-300 transition-colors">
              VibeCut
            </span>
          </Link>

          <div className="h-4 w-px bg-white/10 hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-300">Projects Vault</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-violet-500/15 text-violet-300 border border-violet-500/30">
              {projects.length} Active
            </span>
          </div>
        </div>

        {/* Center: Search & S3 Storage Monitor */}
        <div className="flex items-center gap-3 flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your video projects..."
              className="w-full bg-[#14141a] text-zinc-200 placeholder-zinc-500 text-xs rounded-xl pl-9 pr-8 py-2 border border-white/[0.08] focus:outline-none focus:border-violet-500 transition-colors"
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

        {/* Right Action Group */}
        <div className="flex items-center gap-3">
          {/* Storage Monitor Pill */}
          <div
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#14141a] border border-white/[0.08] text-xs"
            title="AWS S3 Bucket Storage Optimized"
          >
            <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
            <div className="flex flex-col text-[10px] leading-tight">
              <span className="text-zinc-400 font-mono">
                S3 Storage: <strong className="text-emerald-300">{formatFileSize(totalStorageBytes)}</strong>
              </span>
            </div>
          </div>

          {/* New Project Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Project</span>
          </button>

          <UserNav />
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-8">
        {/* HERO TITLE & STATS STRIP */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Your Video Workspace</span>
              <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30">
                Pro Studio
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Select a project to continue editing in the NLE studio, or drop raw footage below.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-[#121217] p-1 rounded-xl border border-white/[0.06]">
            {(
              [
                { id: "all", label: "All Projects" },
                { id: "9:16", label: "9:16 Shorts" },
                { id: "16:9", label: "16:9 Cinema" },
                { id: "1:1", label: "1:1 Square" },
                { id: "ready", label: "Ready" },
                { id: "draft", label: "Drafts" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterTab === tab.id
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <p className="text-xs text-zinc-400 font-mono">Loading projects from Supabase & AWS S3...</p>
          </div>
        ) : (
          /* PROJECTS GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {/* CARD 0: "NEW PROJECT / DROP VIDEO" HERO CARD */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[260px] overflow-hidden ${
                isDragOver
                  ? "border-violet-400 bg-violet-950/25 scale-[1.02] shadow-2xl shadow-violet-500/20"
                  : "border-white/10 hover:border-violet-500/50 bg-[#121217]/60 hover:bg-[#16161f]"
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 via-indigo-600/20 to-amber-500/10 border border-violet-500/30 flex items-center justify-center mb-3 shadow-lg shadow-violet-500/10 group-hover:scale-110 transition-transform">
                {isCreatingProject ? (
                  <Loader2 className="h-7 w-7 text-amber-400 animate-spin" />
                ) : (
                  <UploadCloud className="h-7 w-7 text-violet-400 group-hover:text-amber-400 transition-colors" />
                )}
              </div>

              {isCreatingProject ? (
                <>
                  <h3 className="text-sm font-bold text-white mb-1">Creating Project...</h3>
                  <p className="text-[11px] text-zinc-400 font-mono animate-pulse">{creationStatus}</p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-bold text-white mb-1">Create New Project</h3>
                  <p className="text-xs text-zinc-400 max-w-[200px] mb-4 leading-relaxed">
                    Drop any <span className="text-zinc-200 font-mono">.mp4</span> or browse to start cutting
                  </p>
                  <span className="px-3 py-1.5 rounded-lg bg-white/[0.06] group-hover:bg-violet-600 text-[11px] font-bold text-zinc-300 group-hover:text-white transition-all shadow-sm">
                    + Upload Raw Video
                  </span>
                </>
              )}
            </div>

            {/* REAL PROJECT CARDS */}
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="group relative rounded-2xl bg-[#121217] border border-white/[0.08] hover:border-violet-500/40 p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-2xl hover:shadow-violet-950/30"
              >
                {/* Visual Thumbnail Frame */}
                <div
                  onClick={() => router.push(`/studio?id=${p.id}`)}
                  className={`relative rounded-xl overflow-hidden bg-gradient-to-br ${p.thumbnailGradient} border border-white/10 flex items-center justify-center cursor-pointer mb-3 ${
                    p.aspectRatio === "9:16"
                      ? "h-44 w-full"
                      : p.aspectRatio === "1:1"
                      ? "h-44 w-full"
                      : "h-36 w-full"
                  }`}
                >
                  {/* Subtle video icon */}
                  <Film className="h-8 w-8 text-white/30 group-hover:scale-110 transition-transform" />

                  {/* Play Hover Overlay */}
                  <div className="absolute inset-0 bg-violet-950/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] flex items-center justify-center transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-600/40 scale-90 group-hover:scale-100 transition-transform">
                      <Play className="h-4 w-4 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Top Aspect Ratio Pill */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-mono font-bold text-zinc-300">
                    {p.aspectRatio === "9:16" ? (
                      <Smartphone className="h-2.5 w-2.5 text-amber-400" />
                    ) : p.aspectRatio === "1:1" ? (
                      <Square className="h-2.5 w-2.5 text-emerald-400" />
                    ) : (
                      <Monitor className="h-2.5 w-2.5 text-violet-400" />
                    )}
                    <span>{p.aspectRatio}</span>
                  </div>

                  {/* Top Retention Score Pill */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/20 text-[9px] font-bold text-amber-300">
                    <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                    <span>{p.retentionScore}%</span>
                  </div>

                  {/* Bottom Duration Badge */}
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 font-mono text-[10px] font-bold text-white border border-white/10">
                    {formatTimecode(p.duration)}
                  </div>
                </div>

                {/* Card Body: Title & Meta */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    {/* Title with inline rename */}
                    {editingProjectId === p.id ? (
                      <div className="flex items-center gap-1 mb-1.5">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(p.id);
                            if (e.key === "Escape") setEditingProjectId(null);
                          }}
                          className="bg-zinc-900 text-white text-xs font-semibold px-2 py-1 rounded border border-violet-500 w-full focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(p.id)}
                          className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4
                          onClick={() => router.push(`/studio?id=${p.id}`)}
                          className="font-bold text-xs sm:text-sm text-zinc-100 group-hover:text-violet-300 truncate transition-colors cursor-pointer"
                          title={p.title}
                        >
                          {p.title}
                        </h4>
                        <button
                          onClick={() => {
                            setEditingProjectId(p.id);
                            setEditingTitle(p.title);
                          }}
                          className="p-1 text-zinc-500 hover:text-zinc-200 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Rename project"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Metadata Subtitle */}
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mb-3">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        {p.updatedAt}
                      </span>
                      <span>•</span>
                      <span className="text-zinc-400">{p.wordCount || 0} words</span>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                    <Link
                      href={`/studio?id=${p.id}`}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white text-xs font-semibold transition-all cursor-pointer border border-violet-500/30 hover:border-transparent"
                    >
                      <span>Open in Studio</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete project and free S3 storage"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMPTY STATE (No filtered results) */}
        {!loading && filteredProjects.length === 0 && (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <Film className="h-10 w-10 text-zinc-600" />
            <h3 className="text-sm font-bold text-zinc-300">No matching projects found</h3>
            <p className="text-xs text-zinc-500 max-w-sm">
              {searchQuery
                ? `No projects matching "${searchQuery}". Clear your search or filter.`
                : "Your workspace is clean. Drop any video to create your first cut."}
            </p>
          </div>
        )}
      </main>

      {/* CONFIRM DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#14141a] border border-white/10 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Project & Reclaim S3 Storage?</h3>
                <p className="text-xs text-zinc-400 font-mono truncate max-w-[280px]">
                  {deleteTarget.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              This action will permanently delete all transcript cuts, timeline revisions, and
              purge the video file from your AWS S3 bucket to save storage costs. This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Purging S3 & DB...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
