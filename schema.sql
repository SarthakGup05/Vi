-- ==============================================================================
-- VibeCut AI — Complete Production PostgreSQL Database Schema
-- Version: 1.0 (MVP)
-- Engine: PostgreSQL 15+ (Supabase Free Tier Optimized)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Table: public.guest_sessions
-- Tracks anonymous creators exploring and editing before creating an account
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.guest_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_sessions_last_active ON public.guest_sessions(last_active_at);

-- ==============================================================================
-- 2. Table: public.users
-- Profiles for registered creators, automatically synced with auth.users
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    tier TEXT NOT NULL DEFAULT 'free', -- 'free' | 'day_pass' | 'pro' | 'agency'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Auto-sync trigger from auth.users -> public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, tier)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'tier', 'free')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing auth users (such as our test user creator.test@vibecut.ai)
INSERT INTO public.users (id, email, full_name, avatar_url, tier)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    raw_user_meta_data->>'avatar_url',
    COALESCE(raw_user_meta_data->>'tier', 'Pro Creator')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 3. Table: public.day_passes
-- Tracks 24-hour UPI Creator Day Passes (₹99) and Pro subscriptions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.day_passes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.guest_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    plan_type TEXT NOT NULL DEFAULT 'day_pass_99', -- 'day_pass_99' | 'pro_monthly_799'
    amount_inr_paise INTEGER NOT NULL DEFAULT 9900, -- ₹99.00 = 9900 paise
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'created',        -- 'created' | 'paid' | 'failed' | 'expired'
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_pass_owner CHECK (session_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_day_passes_active ON public.day_passes(session_id, user_id, expires_at)
    WHERE status = 'paid';

-- ==============================================================================
-- 4. Table: public.projects
-- Core video project entity storing media metadata and storage references
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.guest_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Reel',
    raw_video_s3_key TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    aspect_ratio TEXT NOT NULL DEFAULT '9:16',    -- '9:16' | '1:1' | '16:9'
    width INTEGER NOT NULL DEFAULT 1080,
    height INTEGER NOT NULL DEFAULT 1920,
    duration_seconds REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'ready',         -- 'uploading' | 'ready' | 'archived'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chk_project_owner CHECK (session_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_projects_session ON public.projects(session_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- ==============================================================================
-- 5. Table: public.transcripts
-- Stores word-level speech recognition result generated by Groq Whisper
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    language TEXT NOT NULL DEFAULT 'en',           -- 'en' | 'hi' | 'ta' | 'te'
    full_text TEXT NOT NULL,
    words_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_project ON public.transcripts(project_id);

-- ==============================================================================
-- 6. Table: public.edl_revisions
-- Stores chronological timeline state (cuts, kinetic captions, auto-ducking, FX)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.edl_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    revision_number INTEGER NOT NULL DEFAULT 1,
    applied_prompt TEXT,                          -- E.g. "AI: Made intro faster and added whoosh"
    edl_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_project_revision UNIQUE (project_id, revision_number)
);

CREATE INDEX IF NOT EXISTS idx_edl_project ON public.edl_revisions(project_id, revision_number DESC);

-- ==============================================================================
-- 7. Table: public.render_jobs
-- Tracks serverless rendering tasks running on AWS Lambda FFmpeg workers
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.render_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    edl_revision_id UUID REFERENCES public.edl_revisions(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'queued',        -- 'queued' | 'processing' | 'completed' | 'failed'
    resolution TEXT NOT NULL DEFAULT '1080p',     -- '720p' | '1080p'
    include_watermark BOOLEAN NOT NULL DEFAULT true,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    output_video_s3_key TEXT,
    error_message TEXT,
    render_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON public.render_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_render_jobs_project ON public.render_jobs(project_id);

-- ==============================================================================
-- 8. Row-Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edl_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_jobs ENABLE ROW LEVEL SECURITY;

-- Allow full access to service role (backend operations)
CREATE POLICY "Service role full access on guest_sessions" ON public.guest_sessions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on users" ON public.users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on day_passes" ON public.day_passes FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on projects" ON public.projects FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on transcripts" ON public.transcripts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on edl_revisions" ON public.edl_revisions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access on render_jobs" ON public.render_jobs FOR ALL TO service_role USING (true);

-- Public User Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Projects Access: Owned by user or matching guest session
CREATE POLICY "Projects accessible by owner or guest" ON public.projects
    FOR ALL
    USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR
        (session_id IS NOT NULL)
    );

-- Transcripts Access via Project
CREATE POLICY "Transcripts accessible by project owner" ON public.transcripts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = transcripts.project_id
            AND ((auth.uid() IS NOT NULL AND auth.uid() = projects.user_id) OR projects.session_id IS NOT NULL)
        )
    );

-- EDL Revisions Access via Project
CREATE POLICY "EDL accessible by project owner" ON public.edl_revisions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = edl_revisions.project_id
            AND ((auth.uid() IS NOT NULL AND auth.uid() = projects.user_id) OR projects.session_id IS NOT NULL)
        )
    );

-- Render Jobs Access via Project
CREATE POLICY "Render jobs accessible by project owner" ON public.render_jobs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE public.projects.id = render_jobs.project_id
            AND ((auth.uid() IS NOT NULL AND auth.uid() = projects.user_id) OR projects.session_id IS NOT NULL)
        )
    );

-- Day Passes Access
CREATE POLICY "Passes viewable by owner" ON public.day_passes
    FOR SELECT
    USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR session_id IS NOT NULL
    );

-- ==============================================================================
-- 9. Helper Function: Link Guest Projects to Authenticated User
-- When a guest creator signs up or logs in, transfer their draft projects
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.link_guest_projects_to_user(
    p_guest_id UUID,
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    UPDATE public.projects
    SET user_id = p_user_id,
        updated_at = NOW()
    WHERE session_id = p_guest_id
      AND user_id IS NULL;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 10. Auto-Prune Function (Zero-Cost Supabase Free Tier Maintenance)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.purge_expired_guest_data()
RETURNS void AS $$
BEGIN
    -- Delete guest projects inactive for > 48 hours
    DELETE FROM public.projects
    WHERE user_id IS NULL
      AND updated_at < NOW() - INTERVAL '48 hours';

    -- Delete old completed render job logs > 7 days
    DELETE FROM public.render_jobs
    WHERE created_at < NOW() - INTERVAL '7 days';

    -- Delete old guest sessions inactive for > 7 days
    DELETE FROM public.guest_sessions
    WHERE last_active_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
