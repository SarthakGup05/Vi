import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getPresignedDownloadUrl, deleteS3Object, isAwsConfigured } from "@/lib/aws";

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
      captionSettings,
      applied_prompt,
    } = body;

    let finalEdl = edl || null;
    if (captionSettings) {
      if (!finalEdl) {
        finalEdl = { captionSettings, captionStyle: captionSettings.style || captionSettings.preset };
      } else if (!finalEdl.captionSettings) {
        finalEdl = { ...finalEdl, captionSettings };
      }
    }

    if (!raw_video_s3_key && !projectId) {
      return NextResponse.json(
        { error: "raw_video_s3_key is required for new projects" },
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
      const updateData: Record<string, unknown> = {
        title,
        aspect_ratio,
        width,
        height,
        duration_seconds,
        session_id: validSessionId,
        user_id: user_id || null,
        updated_at: new Date().toISOString(),
      };
      if (raw_video_s3_key) {
        updateData.raw_video_s3_key = raw_video_s3_key;
      }
      if (file_size_bytes) {
        updateData.file_size_bytes = file_size_bytes;
      }

      const { data, error } = await admin
        .from("projects")
        .update(updateData)
        .eq("id", projectId)
        .select()
        .maybeSingle();

      if (error) throw error;
      savedProject = data;
    }

    if (!savedProject) {
      const insertData: Record<string, unknown> = {
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
      };
      if (isValidUUID(projectId)) {
        insertData.id = projectId;
      }

      const { data, error } = await admin
        .from("projects")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      savedProject = data;
    }

    // If transcript payload is also attached, upsert to transcripts table
    if (savedProject?.id && transcript && transcript.words) {
      const { data: existingTranscript } = await admin
        .from("transcripts")
        .select("id")
        .eq("project_id", savedProject.id)
        .maybeSingle();

      if (existingTranscript) {
        const { error: transcriptError } = await admin
          .from("transcripts")
          .update({
            language: transcript.language || "en",
            full_text: transcript.text || "",
            words_json: transcript.words || [],
          })
          .eq("id", existingTranscript.id);

        if (transcriptError) {
          console.warn("Could not update transcript:", transcriptError.message);
        }
      } else {
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
    }

    // If EDL payload is attached, persist to edl_revisions table
    let edlRevision = null;
    if (savedProject?.id && finalEdl) {
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
          edl_payload: finalEdl,
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

    // Helper to normalize transcripts (mapping words_json -> words) and sort edl_revisions
    const normalizeProject = (p: Record<string, any>, videoStreamUrl: string | null) => {
      const normalizedTranscripts = (p.transcripts || []).map((t: Record<string, any>) => ({
        ...t,
        words: t.words_json || t.words || [],
        transcript_text: t.full_text || t.transcript_text || "",
      }));

      const sortedEdl = (p.edl_revisions || []).sort(
        (a: Record<string, any>, b: Record<string, any>) => (b.revision_number || 0) - (a.revision_number || 0)
      );

      const latestEdlPayload = sortedEdl[0]?.edl_payload;

      return {
        ...p,
        transcripts: normalizedTranscripts,
        edl_revisions: sortedEdl,
        captionSettings: latestEdlPayload?.captionSettings || null,
        captionStyle: latestEdlPayload?.captionStyle || latestEdlPayload?.captionSettings?.style || "hormozi",
        videoStreamUrl,
      };
    };

    if (id) {
      const { data: project, error } = await admin
        .from("projects")
        .select("*, transcripts(*), edl_revisions(*)")
        .eq("id", id)
        .single();

      if (error) throw error;

      let videoStreamUrl: string | null = null;
      if (project?.raw_video_s3_key && isAwsConfigured()) {
        try {
          videoStreamUrl = await getPresignedDownloadUrl(project.raw_video_s3_key, 7200);
        } catch (e) {
          console.warn("Could not sign S3 download URL:", e);
        }
      }

      return NextResponse.json({
        project: normalizeProject(project, videoStreamUrl),
      });
    }

    let query = admin
      .from("projects")
      .select("*, transcripts(*), edl_revisions(*)")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    const { data: projects, error } = await query;
    if (error) throw error;

    // Attach presigned streaming URLs for each project
    const projectsWithUrls = await Promise.all(
      (projects || []).map(async (p) => {
        let videoStreamUrl: string | null = null;
        if (p.raw_video_s3_key && isAwsConfigured()) {
          try {
            videoStreamUrl = await getPresignedDownloadUrl(p.raw_video_s3_key, 7200);
          } catch {
            // ignore streaming URL error on batch listing
          }
        }
        return normalizeProject(p, videoStreamUrl);
      })
    );

    return NextResponse.json({ projects: projectsWithUrls });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch projects";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE: Delete a project and purge its raw video from AWS S3 to optimize storage
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Supabase admin client not initialized" }, { status: 500 });
    }

    // 1. Fetch project to locate S3 key for storage cleanup
    const { data: project } = await admin
      .from("projects")
      .select("id, raw_video_s3_key")
      .eq("id", id)
      .single();

    // 2. Reclaim S3 storage by purging raw video asset
    if (project?.raw_video_s3_key && isAwsConfigured()) {
      try {
        await deleteS3Object(project.raw_video_s3_key);
      } catch (err) {
        console.warn("Could not delete S3 object:", project.raw_video_s3_key, err);
      }
    }

    // 3. Delete from Supabase PostgreSQL (cascades to transcripts & edl_revisions)
    const { error } = await admin.from("projects").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Project and S3 storage purged successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH: Update project metadata (title, aspect ratio) and optionally persist EDL revisions
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, aspect_ratio, edl, captionSettings, applied_prompt } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Supabase admin client not initialized" }, { status: 500 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (title) updates.title = title;
    if (aspect_ratio) updates.aspect_ratio = aspect_ratio;

    const { data: updated, error } = await admin
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    let finalEdl = edl || null;
    if (captionSettings) {
      if (!finalEdl) {
        finalEdl = { captionSettings, captionStyle: captionSettings.style || captionSettings.preset };
      } else if (!finalEdl.captionSettings) {
        finalEdl = { ...finalEdl, captionSettings };
      }
    }

    let edlRevision = null;
    if (finalEdl) {
      const { data: latestRev } = await admin
        .from("edl_revisions")
        .select("revision_number")
        .eq("project_id", id)
        .order("revision_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextRevision = (latestRev?.revision_number || 0) + 1;

      const { data: revData, error: revError } = await admin
        .from("edl_revisions")
        .insert({
          project_id: id,
          revision_number: nextRevision,
          applied_prompt: applied_prompt || "EDL revision update",
          edl_payload: finalEdl,
        })
        .select()
        .single();

      if (revError) {
        console.warn("Could not insert edl_revision in PATCH:", revError.message);
      } else {
        edlRevision = revData;
      }
    }

    return NextResponse.json({ project: updated, edlRevision });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
