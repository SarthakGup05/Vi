# VibeCut AI Documentation

Welcome to the project documentation for **VibeCut AI**.

## Documents Index

1. **[Product Requirements Document (PRD)](vibecut_ai_product_requirements_document.md)**
   - Executive summary and market opportunity (The CapCut Vacuum in India)
   - Target personas & core MVP features
   - ₹99 Day Pass UPI monetization model
   - High-level technical architecture

2. **[System Architecture Document](system_architecture.md)**
   - End-to-end component data flow
   - Resilient S3 5MB chunked multipart upload specification
   - Sub-second Groq Whisper audio pipeline
   - In-browser EDL (Edit Decision List) and kinetic canvas subtitles
   - Serverless AWS Lambda FFmpeg render engine & credit optimization

3. **[API Design Specification](api_design.md)**
   - REST endpoint contracts and TypeScript interfaces
   - AWS S3 chunked multipart upload protocol (`initiate`, `sign-part`, `complete`, `abort`)
   - Groq Whisper audio transcription endpoint
   - AI Copilot natural language prompt-to-EDL mutation
   - AWS Lambda serverless render and status polling
   - Razorpay UPI Day Pass order and webhook handlers

4. **[Database Design Specification](database_design.md)**
   - Supabase PostgreSQL schema with ERD diagram
   - Guest-to-user polymorphic ownership (`guest_sessions`, `users`, `projects`)
   - `edl_revisions` JSONB audit trail for undo/redo and AI prompts
   - `render_jobs` serverless status tracking
   - `day_passes` UPI payment state tracking
   - Row-Level Security (RLS) policies and auto-pruning maintenance

5. **[AWS & Groq Setup Guide](AWS_AND_GROQ_SETUP_GUIDE.md)**
   - Configuring your $100 AWS credits for S3 video storage and pre-signed uploads
   - S3 CORS rules for direct client uploads
   - Connecting the free Groq Whisper STT API (`whisper-large-v3`)
   - Environment variables reference

---
*All project documentation, specifications, and architecture notes are organized in this `docs/` directory.*
