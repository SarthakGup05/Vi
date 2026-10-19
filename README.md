# VibeCut AI (formerly AutoReel)

> **The smartest way to edit shorts. No VPNs, no timelines, just viral videos in 60 seconds.**

VibeCut AI is a lightweight, web-first automated video studio engineered for short-form creators in high-growth, mobile-first markets. It automatically removes silences, generates algorithm-optimized kinetic captions (Hormozi, MrBeast styles) with Hinglish support, applies dynamic audio ducking, and renders viral Reels via a serverless AWS cloud pipeline.

---

## Repository Structure

```
Vi/
├── docs/                                  # Complete System & Architectural Documentation
│   ├── vibecut_ai_product_requirements_document.md  # PRD (Features, Personas, Pricing)
│   ├── system_architecture.md             # End-to-end Architecture & S3 Multipart Pipeline
│   ├── api_design.md                      # REST API Contracts & TypeScript Interfaces
│   ├── database_design.md                 # Supabase PostgreSQL ERD & Schemas
│   ├── AWS_AND_GROQ_SETUP_GUIDE.md        # Cloud Setup & Free Tier Configuration
│   └── README.md                          # Documentation Index
│
└── vibecut-app/                           # Next.js 15 Starter Application
    ├── src/                               # App router, components & API endpoints
    ├── package.json                       # Dependencies (AWS SDK, Groq SDK, Lucide)
    └── .env.example                       # Environment variables template
```

---

## Quick Start

### 1. App Setup
```bash
cd vibecut-app
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 2. Documentation
Explore the full design specifications and architectural blueprints inside the [`docs/`](docs/) directory.
