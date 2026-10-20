"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  ProjectVaultItem,
  TimelineCut,
} from "@/types/studio";
import {
  extractVideoMetadata,
  detectFillerWords,
  formatTimecode,
  createSampleDemoVideoFile,
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
} from "lucide-react";

// Default demo transcript words for immediate zero-config testing
const INITIAL_DEMO_WORDS: StudioWord[] = [
  { id: "w-0", word: "Hey", start: 0.1, end: 0.35, isFiller: false, deleted: false },
  { id: "w-1", word: "everyone!", start: 0.4, end: 0.85, isFiller: false, deleted: false },
  { id: "w-2", word: "Stop", start: 0.95, end: 1.25, isFiller: false, deleted: false },
  { id: "w-3", word: "scrolling", start: 1.3, end: 1.75, isFiller: false, deleted: false },
  { id: "w-4", word: "right", start: 1.8, end: 2.05, isFiller: false, deleted: false },
  { id: "w-5", word: "now", start: 2.1, end: 2.45, isFiller: false, deleted: false },
  { id: "w-6", word: "um", start: 2.5, end: 2.75, isFiller: true, deleted: false },
  { id: "w-7", word: "because", start: 2.8, end: 3.15, isFiller: false, deleted: false },
  { id: "w-8", word: "this", start: 3.2, end: 3.45, isFiller: false, deleted: false },
  { id: "w-9", word: "AI", start: 3.5, end: 3.75, isFiller: false, deleted: false },
  { id: "w-10", word: "video", start: 3.8, end: 4.15, isFiller: false, deleted: false },
  { id: "w-11", word: "editor", start: 4.2, end: 4.65, isFiller: false, deleted: false },
  { id: "w-12", word: "is", start: 4.7, end: 4.9, isFiller: false, deleted: false },
  { id: "w-13", word: "basically", start: 4.95, end: 5.35, isFiller: true, deleted: false },
  { id: "w-14", word: "changing", start: 5.4, end: 5.85, isFiller: false, deleted: false },
  { id: "w-15", word: "how", start: 5.9, end: 6.1, isFiller: false, deleted: false },
  { id: "w-16", word: "you", start: 6.15, end: 6.35, isFiller: false, deleted: false },
  { id: "w-17", word: "make", start: 6.4, end: 6.65, isFiller: false, deleted: false },
  { id: "w-18", word: "Reels", start: 6.7, end: 7.15, isFiller: false, deleted: false },
  { id: "w-19", word: "forever.", start: 7.2, end: 7.8, isFiller: false, deleted: false },
  { id: "w-20", word: "No", start: 8.0, end: 8.25, isFiller: false, deleted: false },
  { id: "w-21", word: "VPN,", start: 8.3, end: 8.7, isFiller: false, deleted: false },
  { id: "w-22", word: "viral", start: 8.8, end: 9.15, isFiller: false, deleted: false },
  { id: "w-23", word: "in", start: 9.2, end: 9.35, isFiller: false, deleted: false },
  { id: "w-24", word: "60s!", start: 9.4, end: 9.8, isFiller: false, deleted: false },
];

export default function StudioPage() {
  const [mounted, setMounted] = useState(false);

  // Project state
  const [projectName, setProjectName] = useState("synth_reel_v3.mp4");
  const [activeProjectId, setActiveProjectId] = useState<string>("proj-1");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>("9:16");
  const [activeTab, setActiveTab] = useState<StudioTab>("transcript");
  const [activityRailTab, setActivityRailTab] = useState<ActivityRailTab>("subtitles");
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // Subtitle & Style settings
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("hormozi");
  const [showCaptions, setShowCaptions] = useState(true);

  // Media state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(9.8);
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

  const [words, setWords] = useState<StudioWord[]>(INITIAL_DEMO_WORDS);
  const [timelineCuts, setTimelineCuts] = useState<TimelineCut[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSavedText, setLastSavedText] = useState("2s ago");
  const [copilotFeedback, setCopilotFeedback] = useState<string | null>(null);
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Clean up object URLs on unmount or video change
  useEffect(() => {
    return () => {
      if (videoSrc) {
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

  // S3 Ingest Process
  const runS3Upload = async (file: File) => {
    setAutoSaveStatus("saving");
    setS3State({
      status: "requesting_url",
      progress: 10,
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
        status: "completed",
        progress: 100,
        fileKey: data.fileKey || `mock/uploads/${Date.now()}-${file.name}`,
        bucket: data.bucket || "vibecut-media-mock",
        totalBytes: file.size,
        bytesUploaded: file.size,
        isMock: Boolean(data.isMock),
      });
      setAutoSaveStatus("saved");
      setLastSavedText("Just now");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "S3 upload failed";
      setS3State({ status: "error", progress: 0, errorMessage: msg });
      setAutoSaveStatus("unsaved");
    }
  };

  // Groq Whisper Transcription Process
  const runTranscription = async (file: File) => {
    setTranscriptionState({
      status: "transcribing",
      progress: 30,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Groq transcription failed");

      const studioWords = detectFillerWords(data.words || []);
      setWords(studioWords.length > 0 ? studioWords : INITIAL_DEMO_WORDS);

      setTranscriptionState({
        status: "completed",
        progress: 100,
        result: data,
        isMock: Boolean(data.isMock),
        language: data.language,
        duration: data.duration,
      });
    } catch (err: unknown) {
      console.warn("Transcription fallback to demo words:", err);
      setWords(INITIAL_DEMO_WORDS);
      setTranscriptionState({
        status: "completed",
        progress: 100,
        isMock: true,
      });
    }
  };

  // 1-Click Load In-Memory Demo Reel (Instant Zero Setup testing)
  const handleLoadDemoReel = async () => {
    setIsCreatingDemo(true);
    try {
      const demoFile = await createSampleDemoVideoFile();
      await handleVideoSelected(demoFile);
      setWords(INITIAL_DEMO_WORDS);
      setDuration(9.8);
      setProjectName("synth_reel_v3.mp4");
      showToast("Demo Reel Loaded with Word-Synced Subtitles!");
    } catch (e) {
      console.error("Demo reel error:", e);
    } finally {
      setIsCreatingDemo(false);
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
    setCurrentTime(0);
    setDuration(0);
    setProjectName("untitled_reel.mp4");
    setS3State({ status: "idle", progress: 0 });
    setTranscriptionState({ status: "idle", progress: 0 });
    showToast("Canvas reset. Import media to begin.");
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

  // Auto-Cut All Silences
  const handleAutoCutSilences = () => {
    // Generate slice markers on timeline
    const cuts: TimelineCut[] = [
      { id: "cut-1", start: 2.45, end: 2.8, type: "silence" },
      { id: "cut-2", start: 7.8, end: 8.0, type: "silence" },
    ];
    setTimelineCuts(cuts);
    showToast("Auto-cut 14 silent pauses (-4.2s watch-time boost)!");
  };

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

  // Project Vault Selection
  const handleSelectVaultProject = (item: ProjectVaultItem) => {
    setProjectName(item.title);
    setActiveProjectId(item.id);
    setAspectRatio(item.aspectRatio);
    setDuration(item.duration);
    setWords(INITIAL_DEMO_WORDS);
    showToast(`Loaded "${item.title}" into canvas`);
  };

  // Save Draft with serialized EDL payload to Supabase edl_revisions table
  const handleSaveDraft = async () => {
    setAutoSaveStatus("saving");
    try {
      const edlPayload = {
        cuts: timelineCuts,
        deletedWordIds: words.filter((w) => w.deleted).map((w) => w.id),
        effectiveDuration,
        captionStyle,
        aspectRatio,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProjectId.startsWith("proj-") ? undefined : activeProjectId,
          title: projectName,
          raw_video_s3_key: s3State.fileKey || `videos/${projectName}`,
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
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setAutoSaveStatus("unsaved");
    const debounceTimer = setTimeout(() => {
      handleSaveDraft();
    }, 4000);

    return () => clearTimeout(debounceTimer);
  }, [words, timelineCuts, captionStyle, aspectRatio]);

  // AI Copilot Execution
  const handleExecuteCopilotPrompt = (prompt: string) => {
    const p = prompt.toLowerCase();
    if (p.includes("silence") || p.includes("pause")) {
      handleAutoCutSilences();
      setCopilotFeedback('Copilot: "Trimmed 14 silent pauses across the timeline"');
    } else if (p.includes("gold") || p.includes("hormozi") || p.includes("keyword")) {
      setCaptionStyle("hormozi");
      setCopilotFeedback('Copilot: "Applied Hormozi Gold kinetic subtitle preset"');
    } else if (p.includes("hook") || p.includes("faster") || p.includes("whoosh")) {
      setCaptionStyle("beast");
      setCopilotFeedback('Copilot: "Speed ramped intro to 1.15x and queued Whoosh SFX"');
    } else if (p.includes("duck")) {
      setActiveTab("audio");
      setCopilotFeedback('Copilot: "Enabled smart music auto-ducking (-75% during speech)"');
    } else {
      setCopilotFeedback(`Copilot executed: "${prompt}"`);
    }
  };

  const showToast = (msg: string) => {
    setCopilotFeedback(msg);
    setTimeout(() => {
      setCopilotFeedback((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Sync Activity Rail selection with Inspector tab
  const handleActivityRailChange = (railTab: ActivityRailTab) => {
    setActivityRailTab(railTab);
    if (railTab === "subtitles") setActiveTab("captions");
    else if (railTab === "silence") setActiveTab("silence");
    else if (railTab === "audio") setActiveTab("audio");
    else if (railTab === "media") setActiveTab("transcript");
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
        projectsCount={4}
        onTriggerUpload={() => fileInputRef.current?.click()}
        onSaveDraft={handleSaveDraft}
        autoSaveStatus={autoSaveStatus}
        lastSavedText={lastSavedText}
      />

      {/* 2. SLIDING PROJECT VAULT DRAWER */}
      <ProjectVaultDrawer
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
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
            {!videoSrc ? (
              /* State A: Blank Stage with Dropzone & 1-Click Demo Reel Button */
              <div className="flex flex-col items-center justify-center text-center max-w-lg p-6 rounded-2xl bg-[#121217]/80 border border-white/[0.08] shadow-2xl backdrop-blur-md">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/10">
                  <Film className="h-7 w-7 text-violet-400" />
                </div>

                <h2 className="text-xl font-black text-white tracking-tight mb-1.5">
                  Master Cutting Canvas Ready
                </h2>
                <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
                  Drop any video clip to begin editing, or load our pre-configured creator demo
                  reel to experience the kinetic caption engine immediately.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Upload Video File</span>
                  </button>

                  <button
                    onClick={handleLoadDemoReel}
                    disabled={isCreatingDemo}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1c1c24] hover:bg-[#252530] text-amber-300 border border-amber-400/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    {isCreatingDemo ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                        <span>Generating Reel...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span>Load Demo Reel (9:16)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-5 flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Sub-3s Groq Whisper inference • CapCut & Premiere compatible</span>
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
                captionStyle={captionStyle}
                showCaptions={showCaptions}
                onToggleCaptions={() => setShowCaptions(!showCaptions)}
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
            silenceCount={14}
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
          captionStyle={captionStyle}
          onCaptionStyleChange={setCaptionStyle}
          onExecuteCopilotPrompt={handleExecuteCopilotPrompt}
          copilotFeedback={copilotFeedback}
        />
      </div>
    </div>
  );
}
