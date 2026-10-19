# Product Requirements Document (PRD)

**Product Name:** VibeCut AI (formerly AutoReel)
**Tagline:** *The smartest way to edit shorts. No VPNs, no timelines, just viral videos in 60 seconds.*  
**Document Version:** 2.0 (Market-Optimized for India/Growth)  
**Target Release:** MVP Q1  

---

## 1. Executive Summary & Vision

### 1.1 The Market Opportunity (The CapCut Vacuum)
With CapCut banned in India, millions of creators are forced to rely on risky modified APKs, unstable VPNs, or timeline-heavy desktop alternatives (like Premiere Pro or VN) that demand high-end hardware. 
**VibeCut AI** is built to fill this massive vacuum. It is a lightweight, web-first automated video studio that bypasses app stores entirely, operating seamlessly on budget devices without requiring software downloads.

### 1.2 The Solution
VibeCut AI transforms raw phone videos into highly engaging TikToks, Instagram Reels, and YouTube Shorts for non-editors. 
1. Strips out silences, bad takes, and filler words.
2. Generates animated, kinetic word-by-word captions with full support for **Hinglish, Hindi, and regional languages**.
3. Keeps viewers engaged with automatic punch zooms and context-aware sound effects.
4. Cleans up audio to studio quality.
5. Utilizes a **Hybrid Render Pipeline** to export smoothly on any device.

---

## 2. Target Audience & Personas

| Persona | Core Pain Point | VibeCut AI Value Prop |
| :--- | :--- | :--- |
| **The Indian Solo Creator** | Wants CapCut-style magic but cannot deal with VPN drops or heavy APKs on their mid-range Android phone. | A browser-based, instant AI editor that just works on mobile without hardware constraints. |
| **Small Business Owner / Solopreneur** | Needs daily video marketing (real estate, coaching) but lacks editing skills and cannot afford a dedicated agency. | Text-based editing (like a Google Doc) allows for mistake-free, authoritative videos in minutes. |
| **Tier 2/3 City Influencers** | Faces spotty internet connections and relies heavily on regional language content. | Low-bandwidth resilience and native Hinglish/regional NLP support for captions. |

---

## 3. Product Features & Requirements

### 3.1 Core MVP Features (Phase 1)

#### Feature 1: "Edit Like a Doc" (Text-Based Video Editing)
- **Requirement:** Generates a timestamped transcript. Highlighting and deleting words instantly slices the underlying video.
- **Localization:** Native support for English, Hinglish, Hindi, Tamil, and Telugu using multi-lingual AI models.

#### Feature 2: Smart Jump Cut & Filler Surgery
- **Requirement:** Automatically detects pauses $>0.5s$ and cuts them cleanly using 5ms audio zero-crossing micro-fades.
- **Filler Word Detection:** Flags common fillers (both English "umms" and regional equivalents).

#### Feature 3: Kinetic Captions with Auto-Emoji
- **Requirement:** Animated, viral-style subtitles (Hormozi style) that pop on screen word-by-word.
- **Auto-Emoji:** Contextually inserts emojis based on sentiment and keywords.

#### Feature 4: Automatic Punch Zooms
- **Requirement:** Prevents visual fatigue by subtly zooming (1.1x–1.15x) every 4-6 seconds or during pitch changes.

#### Feature 5: Hybrid Render Pipeline & 1-Click Export
- **Requirement:** Zero-jargon exports for Reels/Shorts (9:16).
- **Hybrid Rendering:** Attempts zero-cost local browser rendering via `ffmpeg.wasm`. If the client device detects low memory (common on budget smartphones), it seamlessly offloads the render payload to a serverless cloud worker.
- **Low-Bandwidth Resilience:** Allows users to queue up edits offline/on cellular, deferring the heavy cloud render until they hit a Wi-Fi connection.

#### Feature 6: Custom Audio Templates & Dynamic Smart Ducking
- **Curated Trending Audio:** Built-in royalty-free soundscapes tailored for short-form retention (Lo-fi, Hype Beats, Cinematic Tension, Storytelling).
- **AI Auto-Ducking:** Automatically lowers background music by -18dB whenever speech occurs, swelling back up smoothly during pauses.
- **Contextual Sound Effects (SFX):** AI places trending audio cues (whooshes on punch zooms, pops on emoji pop-ins, dings on numerical metrics).

#### Feature 7: Trending Visual FX Presets
- **Algorithm-Tested Visuals:** 1-click trending visual effects including Glitch Impact, Flash Cuts, RGB Chromatic Aberration, Vintage 35mm Film Grain, and Motion Blur Whip Transitions.
- **Zero Timeline Friction:** Effects attach directly to speech emphasis points or transitions rather than requiring manual keyframing.

---

### 3.2 Advanced Features (Phase 2: Agentic Workflows & AI Copilot)

1. **"Prompt-to-Edit" AI Copilot (Editing Like Modern AI Coding):**
   - Similar to how modern AI coding assistants (e.g., Cursor, Claude Code) refactor entire codebases from natural language, creators can command the editor via prompt:
     - *"Make the first 5 seconds 20% faster, add a suspense beat at second 3, and add a whoosh on the punch zoom."*
     - *"Apply a retro film aesthetic with lo-fi background music and high-contrast yellow subtitles."*
   - The AI agent inspects the Edit Decision List (EDL) JSON, calculates cut coordinates, applies sound effects, and executes multi-step edits autonomously.
2. **Agentic B-Roll Retrieval:** AI analyzes the emotional tone and context of a paragraph, automatically querying stock libraries (Pexels/Unsplash) to insert highly cohesive, 2-second visual overlays.
3. **Dynamic Hook Generator:** AI finds the highest-energy 3-second visual moment in the raw footage, duplicates it to the front, and overlays a bold text hook to maximize initial retention.

---

## 4. Monetization & UPI-First Business Model

Pricing is optimized for Purchasing Power Parity (PPP) in the Indian market, favoring micro-transactions and local payment gateways (Razorpay).

### 4.1 Pricing Tiers

| Tier | Price | Capabilities | Target Customer |
| :--- | :--- | :--- | :--- |
| **Free (Hook)** | **₹0** | 3 exports/mo, 720p, small watermark, 60s length. | Casual users; serves as viral marketing. |
| **Creator Day Pass** | **₹99 / 24-hours** | Unlimited exports, 1080p, no watermark, full AI suite. | Budget creators who batch-edit videos on weekends. |
| **Pro Creator** | **₹799 / month** | Unlimited exports, priority cloud rendering, regional font packs. | Daily Reelers, local brands. |
| **Agency** | **₹2,499 / month** | 4K export, team sharing, API access. | Digital marketing agencies. |

---

## 5. Technical Stack & Infrastructure

- **Frontend:** Next.js 15, React 19, Tailwind CSS. Lightweight PWA (Progressive Web App) architecture.
- **Upload Pipeline:** AWS S3 direct chunked uploads via pre-signed URLs (bypasses frontend bottleneck).
- **Audio & Transcription:** OpenAI Whisper API (multi-lingual capability).
- **Rendering Engine:** Hybrid model (`ffmpeg.wasm` client-side with AWS/Vercel serverless worker fallbacks).
- **Auth & Database:** Supabase (PostgreSQL).
- **Billing:** Razorpay for UPI/NetBanking and Stripe for international overflow.

---

## 6. Next Steps for Implementation

1. **Review & Signoff:** Confirm the UPI billing model and hybrid render architecture.
2. **Scaffold Next.js & S3:** Setup the direct-to-cloud upload pipeline to handle large video files gracefully.
3. **Build Core Engine:** Implement the Wavesurfer.js waveform generator and text-based editor interface.
4. **Integrate Whisper:** Calibrate the transcription model specifically for Hinglish latency and accuracy.