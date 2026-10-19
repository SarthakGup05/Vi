# 🚀 VibeCut AI - Setup & Pilot Guide

This guide walks you through connecting your **$100 AWS Credit** and **Free Groq API Key** to your newly built VibeCut app.

---

## 1. Quick Start (Running the App Right Now)

Your Next.js 15 app is completely built and ready inside the `vibecut-app` folder.

To start the local studio server:
```bash
cd vibecut-app
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

> **Note:** The app has a built-in interactive demo mode! Even without pasting any API keys yet, you can drop any 9:16 vertical video into the canvas to preview the **Hormozi kinetic subtitle engine**, **auto-cuts**, and **₹99 Day Pass paywall modal**.

---

## 2. Setting Up AWS S3 (Using your $100 Credits)

We use AWS S3 for direct chunked video uploads from creators' phones, bypassing Vercel body limits.

### Step 2.1: Create an S3 Bucket
1. Open the [AWS S3 Console](https://s3.console.aws.amazon.com/).
2. Click **Create bucket**.
3. Choose a bucket name (e.g., `vibecut-uploads-yourname`).
4. Select AWS Region: **Asia Pacific (Mumbai) `ap-south-1`** (fastest for Indian creators) or **US East (N. Virginia) `us-east-1`**.
5. Leave other settings as default and click **Create bucket**.

### Step 2.2: Add S3 CORS (Allows Browser Direct Uploads)
1. Click on your newly created bucket $\rightarrow$ Go to the **Permissions** tab.
2. Scroll down to **Cross-origin resource sharing (CORS)** and click **Edit**.
3. Paste the following JSON configuration and save:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Step 2.3: Get Your AWS Access Keys
1. In AWS Console, click your username in the top right $\rightarrow$ **Security credentials**.
2. Scroll to **Access keys** $\rightarrow$ Click **Create access key**.
3. Copy your `Access Key ID` and `Secret Access Key`.
4. Open `vibecut-app/.env.local` and paste them:
```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalrXU...
AWS_S3_BUCKET_NAME=vibecut-uploads-yourname
```

---

## 3. Free Groq Whisper API Key ($0 for Transcriptions)

Groq provides free, ultra-fast transcription powered by `whisper-large-v3` with built-in Hinglish and Hindi support.

1. Go to [Groq Console](https://console.groq.com) and sign in (free).
2. Click **API Keys** on the left menu $\rightarrow$ **Create API Key**.
3. Copy the key and paste it into `vibecut-app/.env.local`:
```env
GROQ_API_KEY=gsk_...
```

---

## 4. How This Pilot Tests Market Demand

1. **The Core Hook:** Creators upload raw, unedited footage and immediately see animated, Hormozi-style pop-out subtitles without needing Premiere Pro or CapCut VPNs.
2. **The "Day Pass" Demand Tracker:** When creators click **Export Reel** or **₹99 Day Pass**, the modal tracks intent to pay. 
3. **Distribution:** Share screen recordings of the app on Instagram/Twitter/LinkedIn showing: *"Editing Hinglish Shorts in 30 seconds without CapCut or VPN"*. If creators ask for access, you have validated real market demand before heavy engineering.
