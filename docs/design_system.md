# Electric Obsidian Design System — VibeCut AI

**Document Version:** 1.0  
**Stitch Project:** `projects/10920844195803407164` (VibeCut AI Studio)  
**Stitch Asset:** `assets/13216663772918279446`  
**Theme Mode:** Dark  

---

## 1. Overview & Creative North Star

**Creative North Star: "The Viral Studio"**

The Electric Obsidian design system is tailored for fast-paced video creators. The canvas is a neutral, deep obsidian black (`#09090B`) to eliminate screen glare and let video colors, skin tones, and bright kinetic subtitles pop with zero chromatic competition. High-energy accents in **Electric Violet (`#8B5CF6`)** and **Hormozi Yellow (`#FACC15`)** communicate modern AI intelligence and high-retention short-form editing.

---

## 2. Color Palette & Surface Tokens

### 2.1 Surfaces & Canvas (Tonal Stacking)
* **Canvas Base:** `#09090B` *(Deep Zinc-950)* — Eliminates eye fatigue during video review.
* **Surface Tier 1 (Panels & Navbars):** `#141417` — Backdrop for timeline dock and transcript editor.
* **Surface Tier 2 (Cards & Drawers):** `#1C1C21` — Floating toolbars and configuration panels.
* **Surface Tier 3 (Interactive Chips & Inputs):** `#27272F` — Active buttons and selected states.
* **Ghost Outlines:** `rgba(255, 255, 255, 0.08)` — Subtle structural boundaries without harsh contrast.

### 2.2 Brand & Functional Accents
* **Primary AI Brand:** `#8B5CF6` *(Electric Violet)* — AI Copilot prompt bar, auto-cuts, and smart suggestions.
* **Viral Retention Gold:** `#FACC15` *(Hormozi Yellow)* — Kinetic subtitle active word pop, ₹99 Creator Day Pass badges.
* **Retention Cuts / Delete:** `#F43F5E` *(Punch Coral)* — Silence cut toggles, word deletion indicators, and export CTAs.
* **Success / Ready State:** `#10B981` *(Emerald)* — Render completed and download ready.

### 2.3 Typography & Text Contrast
* **Text Primary (High Contrast):** `#FAFAFA`
* **Text Secondary (Muted):** `#A1A1AA`
* **Text Disabled:** `#52525B`

---

## 3. Typography Scale (Inter & Montserrat)

| Level | Font Family | Size | Weight | Tracking / Letter Spacing | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Headline XL** | Inter | 36px | 800 (ExtraBold) | `-0.025em` | Modal titles, marketing hooks |
| **Headline LG** | Inter | 24px | 700 (Bold) | `-0.02em` | Studio section titles |
| **Body MD** | Inter | 14px | 400 (Regular) | `0em` | Transcripts and instructions |
| **Label SM** | Inter | 12px | 600 (SemiBold) | `+0.02em` | Buttons, badges, metadata |
| **Subtitles (Viral)** | Montserrat / Inter | 22px – 28px | 900 (Black) | `+0.04em` | Word-by-word kinetic video text |

---

## 4. Shapes, Spacing & Elevation

* **Roundness:** `12px` (`rounded-xl`) on panels, cards, and modals; `9999px` (`rounded-full`) on status badges and CTAs.
* **Spacing Scale:** 4px base unit (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`).
* **Ambient Glow:**
  * Active AI Accent: `box-shadow: 0 0 24px rgba(139, 92, 246, 0.25)`
  * Subtitle Active Word: `drop-shadow: 0 4px 12px rgba(250, 204, 21, 0.6)`
