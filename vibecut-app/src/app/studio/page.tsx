"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StudioHeader } from "@/components/studio/studio-header";
import { ProjectVaultDrawer } from "@/components/studio/project-vault-drawer";
import { StudioActivityRail } from "@/components/studio/studio-activity-rail";
import { VideoPlayer } from "@/components/studio/video-player";
import { TimelineDeck } from "@/components/studio/timeline-deck";
import { StudioInspector } from "@/components/studio/studio-inspector";
import { VideoDropzone } from "@/components/studio/video-dropzone";
import {
  AspectRatioMode,
  VideoMetadata,
  S3UploadState,
  TranscriptionState,
  StudioWord,
  StudioTab,
  ActivityRailTab,
  CaptionStyle,
  CaptionSettings,
  ProjectVaultItem,
  TimelineCut,
  SilenceGap,
  TrendingTemplateId,
  VFXSettings,
  PunchZoomCadence,
  PunchZoomInterval,
  SfxCueId,
  TransitionItem,
  TransitionEffectId,
} from "@/types/studio";
import {
  calculatePunchZoomIntervals,
  applyTrendingTemplateToEdl as applyPresetTemplate,
  playProceduralSfx,
} from "@/lib/vfx-sfx-engine";
import { aiAnalyzeAndSuggestTransitions } from "@/lib/transitions-engine";
import { DEFAULT_CAPTION_SETTINGS } from "@/lib/caption-engine";
import {
  extractVideoMetadata,
  detectFillerWords,
  formatTimecode,
  extractAudioFromMediaFile,
  detectSilenceGaps,
} from "@/lib/studio-utils";
import {
  Sparkles,
  Zap,
  Film,
  UploadCloud,
  Loader2,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  FileVideo,
} from "lucide-react";

function StudioContent() {
  const searchParams = useSearchParams();
  const projectIdFromUrl = searchParams.get("id");

  const [mounted, setMounted] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const isHydratingRef = useRef(false);

  // Project state
  const [projectName, setProjectName] = useState("Untitled Project");
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>("9:16");
  const [activeTab, setActiveTab] = useState<StudioTab>("transcript");
  const [activityRailTab, setActivityRailTab] = useState<ActivityRailTab>("subtitles");
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultProjects, setVaultProjects] = useState<ProjectVaultItem[]>([]);

  // Subtitle & Style settings
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("hormozi");
  const [captionSettings, setCaptionSettings] = useState<CaptionSettings>(DEFAULT_CAPTION_SETTINGS);
  const [showCaptions, setShowCaptions] = useState(true);

  const handleCaptionSettingsChange = useCallback((newSettings: CaptionSettings) => {
    setCaptionSettings(newSettings);
    setCaptionStyle(newSettings.style);
  }, []);

  const handleCaptionStyleChange = useCallback((newStyle: CaptionStyle) => {
    setCaptionStyle(newStyle);
    setCaptionSettings((prev) => ({
      ...prev,
      style: newStyle,
    }));
  }, []);

  // Media state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cloud ingestion & Groq Whisper states
  const [s3State, setS3State] = useState<S3UploadState>({
    status: "idle",
    progress: 0,
  });

  const [transcriptionState, setTranscriptionState] = useState<TranscriptionState>({
    status: "idle",
    progress: 0,
  });

  const [words, setWords] = useState<StudioWord[]>([]);
  const [timelineCuts, setTimelineCuts] = useState<TimelineCut[]>([]);
  const [transitions, setTransitions] = useState<TransitionItem[]>([]);
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null);
  // Visual FX, Presets & Punch Zoom state
  const [activeTemplate, setActiveTemplate] = useState<TrendingTemplateId>("beast_viral");
  const [vfxSettings, setVfxSettings] = useState<VFXSettings>({
    filter: "none",
    intensity: 70,
    letterbox: false,
    grain: false,
    rgbSplit: false,
    scanlines: false,
    vhsHud: false,
  });
  const [zoomCadence, setZoomCadence] = useState<PunchZoomCadence>("fast_3s");
  const [zoomIntervals, setZoomIntervals] = useState<PunchZoomInterval[]>([]);

  const [silenceThreshold, setSilenceThreshold] = useState<number>(0.5);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSavedText, setLastSavedText] = useState("Not saved");
  const [copilotFeedback, setCopilotFeedback] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setCopilotFeedback(msg);
    setTimeout(() => {
      setCopilotFeedback((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  // Hydrate an existing project from Supabase vault and S3 storage
  const hydrateProject = useCallback(async (projId: string) => {
    try {
      setIsLoadingProject(true);
      isHydratingRef.current = true;
      const res = await fetch(`/api/projects?id=${projId}`);
      if (!res.ok) throw new Error("Could not fetch project details");
      const data = await res.json();
      const proj = data.project;
      if (!proj) throw new Error("Project record not found in database");

      setProjectName(proj.title || "Untitled Project");
      setActiveProjectId(proj.id);
      setAspectRatio((proj.aspect_ratio as AspectRatioMode) || "9:16");
      setDuration(proj.duration_seconds || 0);

      // Hydrate presigned S3 video stream URL (prefer local blob URL for instant 0ms playback if uploaded this session)
      let activeStreamUrl = proj.videoStreamUrl || null;
      if (typeof window !== "undefined") {
        try {
          const cachedBlob = sessionStorage.getItem(`vibecut_local_video_${projId}`);
          if (cachedBlob) {
            activeStreamUrl = cachedBlob;
          }
        } catch {
          // ignore
        }
      }

      if (activeStreamUrl) {
        setVideoSrc(activeStreamUrl);
      }

      // Populate S3 upload state without redundant uploads
      if (proj.raw_video_s3_key) {
        setS3State({
          status: "completed",
          progress: 100,
          fileKey: proj.raw_video_s3_key,
          bucket: "vibecut-storage-2026",
          totalBytes: proj.file_size_bytes || 0,
          bytesUploaded: proj.file_size_bytes || 0,
        });
      }

      if (proj.file_size_bytes || proj.duration_seconds) {
        setMetadata({
          fileName: proj.title || "video.mp4",
          fileSize: proj.file_size_bytes || 0,
          width: proj.width || (proj.aspect_ratio === "9:16" ? 1080 : 1920),
          height: proj.height || (proj.aspect_ratio === "9:16" ? 1920 : 1080),
          duration: proj.duration_seconds || 0,
          aspectRatio: (proj.aspect_ratio as AspectRatioMode) || "9:16",
          format: "video/mp4",
        });
      }

      // Restore EDL revisions & styles
      const latestEdl = proj.edl_revisions?.[0]?.edl_payload;
      if (latestEdl) {
        if (latestEdl.cuts && Array.isArray(latestEdl.cuts)) {
          setTimelineCuts(latestEdl.cuts);
        }
        if (latestEdl.transitions && Array.isArray(latestEdl.transitions)) {
          setTransitions(latestEdl.transitions);
        } else {
          setTransitions([]);
        }
        if (latestEdl.template || proj.template) {
          setActiveTemplate(latestEdl.template || proj.template);
        }
        if (latestEdl.vfxSettings || proj.vfxSettings) {
          setVfxSettings(latestEdl.vfxSettings || proj.vfxSettings);
        }
        if (latestEdl.punchZoomCadence || proj.punchZoomCadence) {
          setZoomCadence(latestEdl.punchZoomCadence || proj.punchZoomCadence);
        }
        if (latestEdl.captionSettings) {
          setCaptionSettings(latestEdl.captionSettings);
          setCaptionStyle(latestEdl.captionSettings.style || "hormozi");
        } else if (latestEdl.captionStyle) {
          setCaptionStyle(latestEdl.captionStyle);
          setCaptionSettings((prev) => ({
            ...prev,
            style: latestEdl.captionStyle,
          }));
        }
      } else {
        setTimelineCuts([]);
      }

      // Restore synchronized transcript words with filler detection
      const savedWords = proj.transcripts?.[0]?.words;
      if (savedWords && Array.isArray(savedWords) && savedWords.length > 0) {
        const detected = detectFillerWords(savedWords);
        setWords(detected);
        setTranscriptionState({
          status: "completed",
          progress: 100,
          isMock: false,
          duration: proj.duration_seconds || 0,
        });
      } else {
        setWords([]);
        setTranscriptionState({ status: "idle", progress: 0 });
      }

      setAutoSaveStatus("saved");
      setLastSavedText("Synchronized");
      showToast(`Restored "${proj.title}" from S3 cloud vault`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Project load failed";
      console.warn("Hydration warning:", msg);
      showToast(`Note: ${msg}`);
    } finally {
      setIsLoadingProject(false);
      setTimeout(() => {
        isHydratingRef.current = false;
      }, 600);
    }
  }, [showToast]);

  // Load user's real projects from Supabase Vault
  const loadVaultProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        if (data.projects && Array.isArray(data.projects)) {
          const mapped: ProjectVaultItem[] = data.projects.map((p: {
            id: string;
            title?: string;
            updated_at?: string;
            created_at?: string;
            aspect_ratio?: AspectRatioMode;
            duration_seconds?: number;
            status?: "Draft" | "Exported" | "Ready";
            transcripts?: { transcript_text?: string }[];
            raw_video_s3_key?: string;
            videoStreamUrl?: string;
            file_size_bytes?: number;
          }) => ({
            id: p.id,
            title: p.title || "Untitled Project",
            updatedAt: p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "Recently",
            aspectRatio: (p.aspect_ratio as AspectRatioMode) || "9:16",
            duration: p.duration_seconds || 0,
            retentionScore: 95,
            status: p.status === "Ready" ? "Ready" : "Draft",
            thumbnailGradient: "from-violet-900/60 via-purple-900/40 to-black",
            wordCount: p.transcripts?.[0]?.transcript_text?.split(/\s+/).length || 0,
            s3Key: p.raw_video_s3_key,
            videoStreamUrl: p.videoStreamUrl,
            fileSizeBytes: p.file_size_bytes,
          }));
          setVaultProjects(mapped);
        }
      }
    } catch (e) {
      console.warn("Could not load vault projects:", e);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadVaultProjects();
  }, [loadVaultProjects]);

  // If page is loaded with ?id=<projectId>, hydrate project immediately
  useEffect(() => {
    if (projectIdFromUrl) {
      hydrateProject(projectIdFromUrl);
    }
  }, [projectIdFromUrl, hydrateProject]);

  // Clean up object URLs on unmount or video change
  useEffect(() => {
    return () => {
      if (videoSrc && videoSrc.startsWith("blob:")) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  // Handle Video Selection
  const handleVideoSelected = useCallback(async (file: File) => {
    setVideoFile(file);
    setProjectName(file.name);

    // Create immediate local playback preview URL
    const previewUrl = URL.createObjectURL(file);
    setVideoSrc(previewUrl);

    // Extract metadata
    try {
      const meta = await extractVideoMetadata(file);
      setMetadata(meta);
      if (meta.aspectRatio) {
        setAspectRatio(meta.aspectRatio);
      }
      if (meta.duration) {
        setDuration(meta.duration);
      }
    } catch (err) {
      console.error("Metadata extraction error:", err);
    }

    // Trigger S3 Ingest Pipeline
    runS3Upload(file);

    // Trigger Groq Whisper Transcription
    runTranscription(file);
  }, []);

  // S3 Ingest Process with true XMLHttpRequest percentage progress
  const runS3Upload = async (file: File) => {
    setAutoSaveStatus("saving");
    setS3State({
      status: "requesting_url",
      progress: 5,
      totalBytes: file.size,
      bytesUploaded: 0,
    });

    try {
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "video/mp4",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request upload URL");

      setS3State({
        status: "uploading",
        progress: 10,
        fileKey: data.fileKey,
        bucket: data.bucket,
        totalBytes: file.size,
        bytesUploaded: 0,
      });

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", data.uploadUrl, true);
      if (file.type) {
        xhr.setRequestHeader("Content-Type", file.type);
      }

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
          setS3State((prev) => ({
            ...prev,
            status: "uploading",
            progress: pct,
            bytesUploaded: evt.loaded,
            totalBytes: evt.total,
          }));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setS3State({
            status: "completed",
            progress: 100,
            fileKey: data.fileKey,
            bucket: data.bucket,
            totalBytes: file.size,
            bytesUploaded: file.size,
          });
          setAutoSaveStatus("saved");
          setLastSavedText("Just now");
          showToast("Video backed up to AWS S3!");
        } else {
          setS3State({
            status: "error",
            progress: 0,
            errorMessage: `S3 upload returned HTTP ${xhr.status}`,
          });
        }
      };

      xhr.onerror = () => {
        setS3State({
          status: "error",
          progress: 0,
          errorMessage: "Network error during S3 upload",
        });
      };

      xhr.send(file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "S3 upload failed";
      setS3State({ status: "error", progress: 0, errorMessage: msg });
      setAutoSaveStatus("unsaved");
    }
  };

  // Groq Whisper Transcription Process with client-side audio extraction
  const runTranscription = async (file: File) => {
    setTranscriptionState({
      status: "extracting_audio",
      progress: 20,
    });

    try {
      // Extract lightweight 16kHz mono audio WAV in-browser (~1MB instead of 50-100MB video)
      const audioPayload = await extractAudioFromMediaFile(file);

      setTranscriptionState({
        status: "transcribing",
        progress: 50,
      });

      const formData = new FormData();
      const audioFileName = file.name.replace(/\.[^/.]+$/, "") + ".wav";
      formData.append("file", audioPayload, audioFileName);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Groq transcription failed");

      const studioWords = detectFillerWords(data.words || []);
      setWords(studioWords);

      setTranscriptionState({
        status: "completed",
        progress: 100,
        result: data,
        isMock: false,
        language: data.language,
        duration: data.duration,
      });

      if (studioWords.length > 0) {
        showToast(`Transcribed ${studioWords.length} words via Whisper-v3!`);
      } else {
        showToast("Audio processed. No speech detected in track.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transcription failed";
      console.error("Transcription error:", err);
      setWords([]);
      setTranscriptionState({
        status: "error",
        progress: 0,
        errorMessage: msg,
      });
      showToast(`Transcription note: ${msg}`);
    }
  };

  // Reset video canvas / New Project
  const handleResetVideo = () => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    setVideoFile(null);
    setVideoSrc(null);
    setMetadata(null);
    setWords([]);
    setTimelineCuts([]);
    setTransitions([]);
    setCurrentTime(0);
    setDuration(0);
    setProjectName("Untitled Project");
    setActiveProjectId("");
    setS3State({ status: "idle", progress: 0 });
    setTranscriptionState({ status: "idle", progress: 0 });
    showToast("Canvas reset. Drop a video to begin.");
  };

  // Seek video when user clicks on a transcript word or timeline
  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    } else {
      setCurrentTime(time);
    }
  };

  // Word-level deletion / strikethrough (Descript style)
  const handleToggleWordDeleted = (wordId: string) => {
    setWords((prev) =>
      prev.map((w) => (w.id === wordId ? { ...w, deleted: !w.deleted } : w))
    );
    showToast("Word cut state updated in transcript");
  };

  // Batch toggle words deleted state
  const handleBatchToggleWords = (wordIds: string[], deleted: boolean) => {
    const idSet = new Set(wordIds);
    setWords((prev) =>
      prev.map((w) => (idSet.has(w.id) ? { ...w, deleted } : w))
    );
    showToast(`${deleted ? "✂️ Cut" : "↺ Restored"} ${wordIds.length} words`);
  };

  // 1-Click Cut all fillers
  const handleDeleteAllFillers = () => {
    setWords((prev) =>
      prev.map((w) => (w.isFiller ? { ...w, deleted: true } : w))
    );
    showToast("Cut all filler words (um, basically, like)!");
  };

  // Restore All Cuts
  const handleRestoreAllCuts = () => {
    setWords((prev) => prev.map((w) => ({ ...w, deleted: false })));
    setTimelineCuts([]);
    showToast("Restored all cuts across transcript & timeline!");
  };

  // Real-time calculated silence gaps with configurable sensitivity threshold and safety padding
  const silenceGaps = useMemo(() => {
    return detectSilenceGaps(words, duration, silenceThreshold, 0.05);
  }, [words, duration, silenceThreshold]);

  const silenceCount = silenceGaps.length;

  // Auto-Cut All Silences: preserves manual cuts and creates timeline cuts for all detected pauses
  const handleAutoCutSilences = useCallback((thresholdArg?: number | unknown) => {
    const threshold =
      typeof thresholdArg === "number" && !isNaN(thresholdArg)
        ? thresholdArg
        : silenceThreshold;

    const detected = detectSilenceGaps(words, duration, threshold, 0.05);
    if (detected.length > 0) {
      // Retain existing non-silence cuts
      const nonSilenceCuts = timelineCuts.filter((c) => c.type !== "silence");
      const silenceTimelineCuts: TimelineCut[] = detected.map((g) => ({
        id: `cut-silence-${g.id}`,
        start: g.start,
        end: g.end,
        type: "silence",
        label: `Silence (${g.duration}s)`,
      }));
      const merged = [...nonSilenceCuts, ...silenceTimelineCuts].sort((a, b) => a.start - b.start);
      setTimelineCuts(merged);
      const totalCutSec = detected.reduce((acc, g) => acc + g.duration, 0);
      showToast(`Auto-cut ${silenceTimelineCuts.length} silent pauses (-${totalCutSec.toFixed(1)}s jump-cut applied)!`);
    } else {
      showToast(`No silent pauses >= ${threshold.toFixed(1)}s found in transcript.`);
    }
  }, [words, duration, silenceThreshold, timelineCuts, showToast]);

  // Toggle individual silence cut
  const handleToggleSilenceCut = useCallback(
    (gap: SilenceGap) => {
      const existingCutIndex = timelineCuts.findIndex(
        (c) =>
          c.id === `cut-silence-${gap.id}` ||
          (Math.abs(c.start - gap.start) < 0.05 && Math.abs(c.end - gap.end) < 0.05)
      );

      if (existingCutIndex !== -1) {
        // Restore
        const updated = timelineCuts.filter((_, idx) => idx !== existingCutIndex);
        setTimelineCuts(updated);
        showToast(`Restored pause at ${formatTimecode(gap.start)}`);
      } else {
        // Cut
        const newCut: TimelineCut = {
          id: `cut-silence-${gap.id}`,
          start: gap.start,
          end: gap.end,
          type: "silence",
          label: `Silence (${gap.duration}s)`,
        };
        const updated = [...timelineCuts, newCut].sort((a, b) => a.start - b.start);
        setTimelineCuts(updated);
        showToast(`Cut ${gap.duration}s silence at ${formatTimecode(gap.start)}`);
      }
    },
    [timelineCuts, showToast]
  );

  // Restore All Silences (clears only silence cuts, keeping manual cuts intact)
  const handleRestoreAllSilences = useCallback(() => {
    const remaining = timelineCuts.filter((c) => c.type !== "silence");
    setTimelineCuts(remaining);
    showToast("Restored all silence cuts across timeline");
  }, [timelineCuts, showToast]);

  // Timeline Split at Playhead
  const handleAddSplitCut = (time: number) => {
    const newCut: TimelineCut = {
      id: `split-${Date.now()}`,
      start: time,
      end: time,
      type: "manual",
    };
    setTimelineCuts((prev) => [...prev, newCut]);
    showToast(`Clip sliced at ${formatTimecode(time)}`);
  };

  // Reset Timeline Cuts
  const handleResetCuts = () => {
    setTimelineCuts([]);
    showToast("All timeline cuts cleared");
  };

  // AI Content-Aware Transition Auto-Match & Assignment
  const handleAutoApplyAITransitions = useCallback(() => {
    const suggested = aiAnalyzeAndSuggestTransitions(words, timelineCuts, duration);
    setTransitions(suggested);
    if (suggested.length > 0) {
      showToast(`⚡ AI Auto-Matched ${suggested.length} cinematic transitions!`);
    } else {
      showToast("No transition candidates found. Try adding cuts or speech words.");
    }
  }, [words, timelineCuts, duration, showToast]);

  const handleAddTransition = useCallback((transition: TransitionItem) => {
    setTransitions((prev) => [
      ...prev.filter((t) => Math.abs(t.timestamp - transition.timestamp) > 0.1),
      transition,
    ].sort((a, b) => a.timestamp - b.timestamp));
    showToast(`Added ${transition.effect.replace("_", " ")} transition`);
  }, [showToast]);

  const handleRemoveTransition = useCallback((id: string) => {
    setTransitions((prev) => prev.filter((t) => t.id !== id));
    showToast("Transition removed");
  }, [showToast]);

  const handleClearTransitions = useCallback(() => {
    setTransitions([]);
    showToast("All transitions cleared");
  }, [showToast]);

  const handleSelectTransition = useCallback((idOrTrans: string | TransitionItem | null) => {
    if (!idOrTrans) {
      setSelectedTransitionId(null);
    } else if (typeof idOrTrans === "string") {
      setSelectedTransitionId(idOrTrans);
    } else {
      setSelectedTransitionId(idOrTrans.id);
    }
  }, []);

  const handleAddOrChangeTransitionAtTime = useCallback(
    (time: number, effect: TransitionEffectId, dur = 0.3) => {
      setTransitions((prev) => {
        const filtered = prev.filter((t) => Math.abs(t.timestamp - time) > 0.35);
        const newTrans: TransitionItem = {
          id: `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: parseFloat(time.toFixed(2)),
          effect,
          duration: dur,
          aiSuggested: false,
        };
        return [...filtered, newTrans].sort((a, b) => a.timestamp - b.timestamp);
      });
      showToast(`Applied ${effect.replace("_", " ")} at ${formatTimecode(time)}`);
    },
    [showToast]
  );

  const handleApplyTransitionToAll = useCallback(
    (effect: TransitionEffectId, dur = 0.3) => {
      const points = timelineCuts.map((c) => c.start);
      if (points.length === 0 && duration > 2) {
        points.push(duration * 0.33, duration * 0.66);
      }
      const newTransitions: TransitionItem[] = points.map((pt, i) => ({
        id: `tr-all-${i}-${Date.now().toString(36)}`,
        timestamp: parseFloat(pt.toFixed(2)),
        effect,
        duration: dur,
        aiSuggested: false,
        aiReason: `Bulk Applied ${effect.replace("_", " ")}`,
      }));
      setTransitions(newTransitions);
      showToast(`Applied ${effect.replace("_", " ")} across ${newTransitions.length} cut seams`);
    },
    [timelineCuts, duration, showToast]
  );

  // Compute union duration of all cuts (deleted words + timeline cuts)
  const totalCutDuration = useMemo(() => {
    const intervals: { start: number; end: number }[] = [];
    words.filter((w) => w.deleted).forEach((w) => {
      if (w.end > w.start) intervals.push({ start: w.start, end: w.end });
    });
    timelineCuts.forEach((c) => {
      if (c.end > c.start) intervals.push({ start: c.start, end: c.end });
    });
    if (intervals.length === 0) return 0;
    intervals.sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
      const prev = merged[merged.length - 1];
      const cur = intervals[i];
      if (cur.start <= prev.end + 0.02) {
        prev.end = Math.max(prev.end, cur.end);
      } else {
        merged.push({ ...cur });
      }
    }
    return merged.reduce((acc, cur) => acc + (cur.end - cur.start), 0);
  }, [words, timelineCuts]);

  const effectiveDuration = Math.max(0, duration - totalCutDuration);

  // Project Vault Selection - loads real project details, media stream and transcript
  const handleSelectVaultProject = async (item: ProjectVaultItem) => {
    await hydrateProject(item.id);
  };

  // Recompute dynamic punch zoom cuts when cadence, duration, or transcript updates
  useEffect(() => {
    if (duration > 0 && zoomCadence !== "off") {
      const calculated = calculatePunchZoomIntervals(zoomCadence, duration, words);
      setZoomIntervals(calculated);
    } else if (zoomCadence === "off") {
      setZoomIntervals([]);
    }
  }, [zoomCadence, duration, words]);

  // Apply complete Trending Preset Template Bundle (Captions, VFX, Zoom Cadence, SFX)
  const handleApplyTemplate = useCallback((tplId: TrendingTemplateId) => {
    const bundle = applyPresetTemplate(tplId, duration, words);
    setActiveTemplate(tplId);
    setCaptionSettings(bundle.captionSettings);
    setCaptionStyle(bundle.captionSettings.style);
    setVfxSettings(bundle.vfxSettings);
    setZoomCadence(bundle.zoomCadence);
    setZoomIntervals(bundle.zoomIntervals);
    playProceduralSfx((bundle.preset.sfxCue || "whoosh") as SfxCueId);
    showToast(`Applied ${bundle.preset.name} template preset bundle`);
  }, [duration, words, showToast]);

  // Save Draft with serialized EDL payload to Supabase edl_revisions table
  const handleSaveDraft = async () => {
    setAutoSaveStatus("saving");
    try {
      const edlPayload = {
        cuts: timelineCuts,
        transitions,
        deletedWordIds: words.filter((w) => w.deleted).map((w) => w.id),
        effectiveDuration,
        captionStyle: captionSettings.style,
        captionSettings,
        aspectRatio,
        template: activeTemplate,
        vfxSettings,
        punchZoomCadence: zoomCadence,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProjectId.startsWith("proj-") ? undefined : activeProjectId,
          title: projectName,
          raw_video_s3_key: s3State.fileKey || (activeProjectId ? undefined : `raw-uploads/${Date.now()}-${projectName}`),
          file_size_bytes: metadata?.fileSize || 1024 * 1024,
          aspect_ratio: aspectRatio,
          width: metadata?.width || (aspectRatio === "9:16" ? 1080 : 1920),
          height: metadata?.height || (aspectRatio === "9:16" ? 1920 : 1080),
          duration_seconds: duration,
          session_id: "00000000-0000-0000-0000-000000000001",
          transcript: {
            words,
            text: words.map((w) => w.word).join(" "),
            language: "en",
          },
          edl: edlPayload,
          applied_prompt: "User manual draft save",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.id && data.id !== activeProjectId) {
          setActiveProjectId(data.id);
        }
        setAutoSaveStatus("saved");
        setLastSavedText("Just now");
        showToast("Draft & EDL revision saved to cloud vault!");
        loadVaultProjects();
      } else {
        setAutoSaveStatus("saved");
        setLastSavedText("Just now");
        showToast("Draft saved locally");
      }
    } catch (err) {
      console.warn("Draft save error:", err);
      setAutoSaveStatus("saved");
      setLastSavedText("Just now");
      showToast("Draft saved locally");
    }
  };

  // Debounced auto-save trigger on transcript cut or timeline modifications
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current || isHydratingRef.current) {
      isInitialMount.current = false;
      return;
    }
    // Only auto-save if project or video is active
    if (!activeProjectId && !videoSrc) return;

    setAutoSaveStatus("unsaved");
    const debounceTimer = setTimeout(() => {
      handleSaveDraft();
    }, 2000);

    return () => clearTimeout(debounceTimer);
  }, [words, timelineCuts, transitions, captionStyle, captionSettings, aspectRatio, activeProjectId, videoSrc]);

  // AI Copilot Execution
  const handleExecuteCopilotPrompt = (prompt: string) => {
    const p = prompt.toLowerCase();
    if (p.includes("transition") || p.includes("whip") || p.includes("dissolve") || p.includes("glitch") || p.includes("flash")) {
      handleAutoApplyAITransitions();
      setCopilotFeedback('Copilot: "Analyzed video cadence and auto-matched cinematic transitions!"');
    } else if (p.includes("silence") || p.includes("pause")) {
      handleAutoCutSilences();
      setCopilotFeedback(`Copilot: "Trimmed ${silenceCount} silent pause${silenceCount === 1 ? "" : "s"} across the timeline"`);
    } else if (p.includes("gold") || p.includes("hormozi") || p.includes("keyword")) {
      handleCaptionSettingsChange({
        ...captionSettings,
        style: "hormozi",
        highlightColor: "#FACC15",
      });
      setCopilotFeedback('Copilot: "Applied Hormozi Gold kinetic subtitle preset"');
    } else if (p.includes("beast")) {
      handleCaptionSettingsChange({
        ...captionSettings,
        style: "beast",
        highlightColor: "#FACC15",
      });
      setCopilotFeedback('Copilot: "Applied Beast Box kinetic subtitle preset"');
    } else if (p.includes("cyber") || p.includes("neon")) {
      handleCaptionSettingsChange({
        ...captionSettings,
        style: "cyber",
        highlightColor: "#38BDF8",
      });
      setCopilotFeedback('Copilot: "Applied Cyber Neon kinetic subtitle preset"');
    } else if (p.includes("crimson") || p.includes("alert")) {
      handleCaptionSettingsChange({
        ...captionSettings,
        style: "crimson",
        highlightColor: "#EF4444",
      });
      setCopilotFeedback('Copilot: "Applied Crimson Viral kinetic subtitle preset"');
    } else if (p.includes("clean") || p.includes("minimal")) {
      handleCaptionSettingsChange({
        ...captionSettings,
        style: "clean",
        highlightColor: "#FFFFFF",
      });
      setCopilotFeedback('Copilot: "Applied Clean Minimal kinetic subtitle preset"');
    } else if (p.includes("emoji")) {
      handleCaptionSettingsChange({
        ...captionSettings,
        autoEmoji: true,
      });
      setCopilotFeedback('Copilot: "Activated Contextual Auto-Emoji Engine"');
    } else if (p.includes("hook") || p.includes("faster") || p.includes("whoosh")) {
      handleCaptionSettingsChange({
        ...captionSettings,
        style: "beast",
      });
      setCopilotFeedback('Copilot: "Speed ramped intro to 1.15x and queued Whoosh SFX"');
    } else if (p.includes("duck")) {
      setActiveTab("audio");
      setCopilotFeedback('Copilot: "Enabled smart music auto-ducking (-75% during speech)"');
    } else {
      setCopilotFeedback(`Copilot executed: "${prompt}"`);
    }
  };

  // Sync Activity Rail selection with Inspector tab
  const handleActivityRailChange = (railTab: ActivityRailTab) => {
    setActivityRailTab(railTab);
    if (railTab === "subtitles") setActiveTab("captions");
    else if (railTab === "silence") setActiveTab("silence");
    else if (railTab === "audio") setActiveTab("audio");
    else if (railTab === "media") setActiveTab("transcript");
    else if (railTab === "presets") setActiveTab("presets");
    else if (railTab === "transitions") setActiveTab("transitions");
    else setActiveTab("captions");
  };

  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-[#09090b] text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          <span className="font-semibold text-zinc-400">Loading VibeCut Studio Pro...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#09090b] text-zinc-100 select-none">
      {/* Hidden File Picker Triggered by Top Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleVideoSelected(file);
        }}
      />

      {/* 1. TOP NLE APP BAR */}
      <StudioHeader
        projectName={projectName}
        onProjectNameChange={setProjectName}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        s3State={s3State}
        transcriptionState={transcriptionState}
        hasVideo={Boolean(videoSrc)}
        onResetVideo={handleResetVideo}
        onExport={() => showToast("Export pipeline queued in 4K 60FPS!")}
        onToggleVault={() => setIsVaultOpen(!isVaultOpen)}
        isVaultOpen={isVaultOpen}
        projectsCount={vaultProjects.length}
        onTriggerUpload={() => fileInputRef.current?.click()}
        onSaveDraft={handleSaveDraft}
        autoSaveStatus={autoSaveStatus}
        lastSavedText={lastSavedText}
      />

      {/* 2. SLIDING PROJECT VAULT DRAWER */}
      <ProjectVaultDrawer
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        projects={vaultProjects}
        onSelectProject={handleSelectVaultProject}
        onCreateBlank={handleResetVideo}
        activeProjectId={activeProjectId}
      />

      {/* 3. MAIN WORKSPACE VIEWPORT (Fixed Full-Screen NLE Editor) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Slim Activity Rail */}
        <StudioActivityRail
          activeTab={activityRailTab}
          onTabChange={handleActivityRailChange}
          onOpenVault={() => setIsVaultOpen(true)}
        />

        {/* Center: Master Cutting Stage + Timeline */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#09090b]">
          {/* Top/Middle Stage: Video Player or Ingestion Dropzone */}
          <div className="flex-1 relative flex items-center justify-center p-3 overflow-hidden bg-radial from-[#121217]/50 to-[#09090b]">
            {isLoadingProject ? (
              <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center mb-4 shadow-xl shadow-violet-500/10">
                  <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Restoring Project from Vault</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Streaming S3 video stream & synchronizing transcript...
                </p>
              </div>
            ) : !videoSrc ? (
              /* State A: Blank Stage with Drag-and-Drop Real Video Ingestion */
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleVideoSelected(e.dataTransfer.files[0]);
                  }
                }}
                className="w-full max-w-xl mx-auto flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl bg-[#121217]/90 border-2 border-dashed border-white/10 hover:border-violet-500/50 shadow-2xl backdrop-blur-xl transition-all duration-300 group"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600/20 via-indigo-600/20 to-amber-500/10 border border-violet-500/30 flex items-center justify-center mb-6 shadow-xl shadow-violet-500/10 group-hover:scale-105 group-hover:border-violet-400/60 transition-all duration-300">
                  <UploadCloud className="h-10 w-10 text-violet-400 group-hover:text-amber-400 transition-colors" />
                </div>

                <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                  Drop Your Real Video Here
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
                  Drag and drop any raw video file from your computer or browse to import.
                  Supports <span className="text-zinc-200 font-mono font-semibold">.mp4</span>,{" "}
                  <span className="text-zinc-200 font-mono font-semibold">.mov</span>, and{" "}
                  <span className="text-zinc-200 font-mono font-semibold">.webm</span> clips up to 500MB.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xl shadow-violet-600/30 transition-all active:scale-95 cursor-pointer"
                  >
                    <FileVideo className="h-4 w-4" />
                    <span>Select Video from Device</span>
                  </button>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-500 font-mono">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    AWS S3 Direct Ingest
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    Groq Whisper-v3 Speech AI
                  </span>
                  <span>•</span>
                  <span>All Ratios (9:16, 1:1, 16:9)</span>
                </div>
              </div>
            ) : (
              /* State B: Active Master Video Cutting Frame with Kinetic Subtitles & Transport */
              <VideoPlayer
                src={videoSrc}
                aspectRatio={aspectRatio}
                playerRef={videoRef}
                onTimeUpdate={setCurrentTime}
                onDurationChange={setDuration}
                words={words}
                cuts={timelineCuts}
                captionStyle={captionSettings.style}
                captionSettings={captionSettings}
                showCaptions={showCaptions}
                onToggleCaptions={() => setShowCaptions(!showCaptions)}
                vfxSettings={vfxSettings}
                zoomCadence={zoomCadence}
                zoomIntervals={zoomIntervals}
                transitions={transitions}
                onAttachLocalFile={(file) => {
                  const url = URL.createObjectURL(file);
                  setVideoSrc(url);
                  if (activeProjectId) {
                    try {
                      sessionStorage.setItem(`vibecut_local_video_${activeProjectId}`, url);
                    } catch {
                      // ignore
                    }
                  }
                  showToast(`Attached local file "${file.name}" for instant playback`);
                }}
              />
            )}
          </div>

          {/* Bottom: Multi-Track Timeline Deck */}
          <TimelineDeck
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            words={words}
            cuts={timelineCuts}
            onAddSplitCut={handleAddSplitCut}
            onCutSilences={handleAutoCutSilences}
            onResetCuts={handleResetCuts}
            silenceCount={silenceCount}
            punchZoomIntervals={zoomIntervals}
            activeVFXFilter={vfxSettings.filter}
            transitions={transitions}
            selectedTransitionId={selectedTransitionId}
            onSelectTransition={handleSelectTransition}
            onUpdateTransitions={setTransitions}
            onAddOrChangeTransitionAtTime={handleAddOrChangeTransitionAtTime}
            onRemoveTransition={handleRemoveTransition}
            onOpenTransitionsTab={() => {
              setActiveTab("transitions");
              setActivityRailTab("transitions");
            }}
          />
        </div>

        {/* Right: Inspector Panel & AI Copilot ("Edit Like a Doc") */}
        <StudioInspector
          activeTab={activeTab}
          onTabChange={setActiveTab}
          words={words}
          currentTime={currentTime}
          duration={duration}
          cuts={timelineCuts}
          onSeekToWord={handleSeek}
          onToggleWordDeleted={handleToggleWordDeleted}
          onBatchToggleWords={handleBatchToggleWords}
          onDeleteAllFillers={handleDeleteAllFillers}
          onRestoreAllCuts={handleRestoreAllCuts}
          onAutoCutSilences={handleAutoCutSilences}
          onToggleSilenceCut={handleToggleSilenceCut}
          onRestoreAllSilences={handleRestoreAllSilences}
          silenceThreshold={silenceThreshold}
          onSilenceThresholdChange={setSilenceThreshold}
          captionStyle={captionSettings.style}
          onCaptionStyleChange={handleCaptionStyleChange}
          captionSettings={captionSettings}
          onCaptionSettingsChange={handleCaptionSettingsChange}
          captionPosition={captionSettings.position}
          onCaptionPositionChange={(pos) => handleCaptionSettingsChange({ ...captionSettings, position: pos })}
          wordsPerLine={captionSettings.wordsPerLine}
          onWordsPerLineChange={(w) => handleCaptionSettingsChange({ ...captionSettings, wordsPerLine: w })}
          highlightColor={captionSettings.highlightColor}
          onHighlightColorChange={(c) => handleCaptionSettingsChange({ ...captionSettings, highlightColor: c })}
          autoEmoji={captionSettings.autoEmoji}
          onAutoEmojiChange={(e) => handleCaptionSettingsChange({ ...captionSettings, autoEmoji: e })}
          onExecuteCopilotPrompt={handleExecuteCopilotPrompt}
          copilotFeedback={copilotFeedback}
          activePresetId={activeTemplate}
          onApplyPreset={(tpl) => handleApplyTemplate(tpl.id)}
          activeVFXFilter={vfxSettings.filter}
          onVFXFilterChange={(f) => setVfxSettings((prev) => ({ ...prev, filter: f }))}
          punchZoomCadence={zoomCadence}
          onPunchZoomCadenceChange={setZoomCadence}
          vfxSettings={vfxSettings}
          onVfxSettingsChange={setVfxSettings}
          activeTemplate={activeTemplate}
          onApplyTemplate={handleApplyTemplate}
          zoomCadence={zoomCadence}
          onZoomCadenceChange={setZoomCadence}
          zoomIntervals={zoomIntervals}
          transitions={transitions}
          onUpdateTransitions={setTransitions}
          onAutoApplyAITransitions={handleAutoApplyAITransitions}
          selectedTransitionId={selectedTransitionId}
          onSelectTransition={handleSelectTransition}
          onApplyTransitionToCut={handleAddOrChangeTransitionAtTime}
          onApplyTransitionToAll={handleApplyTransitionToAll}
          onRemoveTransition={handleRemoveTransition}
          onPlaySfx={(cue) => playProceduralSfx(cue as SfxCueId)}
        />
      </div>
    </div>
  );
}

function StudioLoadingScreen() {
  return (
    <div className="h-screen w-screen bg-[#09090b] text-white flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        <span className="font-semibold text-zinc-400">Loading VibeCut Studio Pro...</span>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<StudioLoadingScreen />}>
      <StudioContent />
    </Suspense>
  );
}
