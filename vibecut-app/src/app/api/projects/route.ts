import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const isValidUUID = (id?: string | null): boolean =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      title = "Untitled Reel",
      raw_video_s3_key,
      file_size_bytes = 0,
      aspect_ratio = "9:16",
      width = 1080,
      height = 1920,
      duration_seconds = 0,
      session_id,
      user_id,
      transcript,
      edl,
      applied_prompt,
    } = body;

    if (!raw_video_s3_key) {
      return NextResponse.json(
        { error: "raw_video_s3_key is required" },
        { status: 400 }
      );
    }

    if (!session_id && !user_id) {
      return NextResponse.json(
        { error: "Either session_id or user_id must be provided" },
        { status: 400 }
      );
    }

    // Fallback if Supabase credentials are mock/not configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        id: projectId || `mock_proj_${Date.now()}`,
        title,
        raw_video_s3_key,
        file_size_bytes,
        aspect_ratio,
        width,
        height,
        duration_seconds,
        session_id,
        user_id,
        status: "ready",
        edlRevision: edl ? { id: `mock_rev_${Date.now()}`, edl_payload: edl } : null,
        isMock: true,
      });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Supabase admin client not initialized" },
        { status: 500 }
      );
    }

    // Ensure session_id exists in guest_sessions if provided and valid UUID
    const validSessionId = isValidUUID(session_id) ? session_id : null;
    if (validSessionId) {
      const { error: guestError } = await admin
        .from("guest_sessions")
        .upsert({ id: validSessionId, last_active_at: new Date().toISOString() }, { onConflict: "id" });

      if (guestError) {
        console.warn("Could not upsert guest session:", guestError.message);
      }
    }

    // Insert or update project
    let savedProject;
    if (isValidUUID(projectId)) {
      const { data, error } = await admin
        .from("projects")
        .update({
          title,
          raw_video_s3_key,
          file_size_bytes,
          aspect_ratio,
          width,
          height,
          duration_seconds,
          session_id: validSessionId,
          user_id: user_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .select()
        .maybeSingle();

      if (error) throw error;
      savedProject = data;
    }

    if (!savedProject) {
      const { data, error } = await admin
        .from("projects")
        .insert({
          title,
          raw_video_s3_key,
          file_size_bytes,
          aspect_ratio,
          width,
          height,
          duration_seconds,
          session_id: validSessionId,
          user_id: user_id || null,
          status: "ready",
        })
        .select()
        .single();

      if (error) throw error;
      savedProject = data;
    }

    // If transcript payload is also attached, persist to transcripts table
    if (savedProject?.id && transcript && transcript.words) {
      const { error: transcriptError } = await admin
        .from("transcripts")
        .insert({
          project_id: savedProject.id,
          language: transcript.language || "en",
          full_text: transcript.text || "",
          words_json: transcript.words || [],
        });

      if (transcriptError) {
        console.warn("Could not insert transcript:", transcriptError.message);
      }
    }

    // If EDL payload is attached, persist to edl_revisions table
    let edlRevision = null;
    if (savedProject?.id && edl) {
      const { data: latestRev } = await admin
        .from("edl_revisions")
        .select("revision_number")
        .eq("project_id", savedProject.id)
        .order("revision_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextRevision = (latestRev?.revision_number || 0) + 1;

      const { data: revData, error: revError } = await admin
        .from("edl_revisions")
        .insert({
          project_id: savedProject.id,
          revision_number: nextRevision,
          applied_prompt: applied_prompt || "Draft EDL save",
          edl_payload: edl,
        })
        .select()
        .single();

      if (revError) {
        console.warn("Could not insert edl_revision:", revError.message);
      } else {
        edlRevision = revData;
      }
    }

    return NextResponse.json({
      ...savedProject,
      edlRevision,
      isMock: false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save project";
    console.error("Projects API error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const sessionId = searchParams.get("session_id");
    const userId = searchParams.get("user_id");

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ projects: [], isMock: true });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });
    }

    if (id) {
      const { data: project, error } = await admin
        .from("projects")
        .select("*, transcripts(*), edl_revisions(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return NextResponse.json({ project });
    }

    let query = admin.from("projects").select("*, transcripts(*), edl_revisions(*)").order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    const { data: projects, error } = await query;
    if (error) throw error;

    return NextResponse.json({ projects });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch projects";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
