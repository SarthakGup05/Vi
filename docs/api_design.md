# VibeCut AI — API Design Specification

**Document Version:** 1.0  
**Target Release:** MVP Pilot  
**Base URL:** `/api/v1` (Next.js Route Handlers)  

---

## 1. Architectural Standards & Conventions

1. **Protocol:** All endpoints operate over HTTPS and consume/produce `application/json` (except audio binary uploads via `multipart/form-data`).
2. **Error Format:** Standardized JSON error response across all endpoints:
   ```typescript
   interface ApiErrorResponse {
     success: false;
     error: {
       code: string;       // E.g., "INVALID_FILE_TYPE", "UPLOAD_FAILED"
       message: string;    // Human-readable message
       details?: unknown;  // Optional debug/validation context
     };
   }
   ```
3. **Session Context:** Pilot requests identify users via an optional `x-session-id` (UUID generated on first visit and stored in client `localStorage`), allowing guest-first frictionless testing before sign-up.

---

## 2. Ingestion & S3 Multipart Upload Endpoints

Handles resilient 5 MB chunked uploads directly from mobile browsers to AWS S3.

### 2.1 Initiate Multipart Upload
Initializes a multipart upload session in AWS S3 and returns an `uploadId`.

* **Method:** `POST`
* **Path:** `/api/upload/multipart/initiate`
* **Request Body:**
  ```typescript
  interface InitiateUploadRequest {
    fileName: string;        // E.g., "my_reel_raw.mp4"
    contentType: string;     // E.g., "video/mp4", "video/quicktime"
    fileSize: number;        // File size in bytes
  }
  ```
* **Response (200 OK):**
  ```typescript
  interface InitiateUploadResponse {
    success: true;
    uploadId: string;        // AWS S3 UploadId
    fileKey: string;         // S3 storage key (e.g. "raw-uploads/17293400-reel.mp4")
    partSize: number;        // Suggested chunk size (5242880 = 5MB)
    totalParts: number;      // Calculated Math.ceil(fileSize / partSize)
  }
  ```

---

### 2.2 Sign Upload Part
Generates a pre-signed S3 PUT URL for a specific 5 MB chunk.

* **Method:** `POST`
* **Path:** `/api/upload/multipart/sign-part`
* **Request Body:**
  ```typescript
  interface SignPartRequest {
    fileKey: string;
    uploadId: string;
    partNumber: number;      // 1-indexed (1, 2, 3...)
  }
  ```
* **Response (200 OK):**
  ```typescript
  interface SignPartResponse {
    success: true;
    presignedUrl: string;    // Direct AWS S3 PUT URL valid for 15 minutes
    partNumber: number;
  }
  ```

---

### 2.3 Complete Multipart Upload
Signals AWS S3 to reassemble all uploaded 5 MB parts into one clean MP4 file.

* **Method:** `POST`
* **Path:** `/api/upload/multipart/complete`
* **Request Body:**
  ```typescript
  interface CompleteUploadRequest {
    fileKey: string;
    uploadId: string;
    parts: Array<{
      partNumber: number;
      eTag: string;          // ETag returned by AWS S3 in PUT response headers
    }>;
  }
  ```
* **Response (200 OK):**
  ```typescript
  interface CompleteUploadResponse {
    success: true;
    fileKey: string;
    s3Location: string;
    message: "Video upload successfully reassembled.";
  }
  ```

---

### 2.4 Abort Multipart Upload
Cleans up and removes orphaned S3 chunks if the user cancels or navigates away.

* **Method:** `POST`
* **Path:** `/api/upload/multipart/abort`
* **Request Body:**
  ```typescript
  interface AbortUploadRequest {
    fileKey: string;
    uploadId: string;
  }
  ```
* **Response (200 OK):**
  ```typescript
  interface AbortUploadResponse {
    success: true;
    message: "Multipart upload aborted and chunks purged.";
  }
  ```

---

## 3. Audio & AI Speech-to-Text Endpoints

### 3.1 Transcribe Audio (Groq Whisper)
Accepts client-extracted audio (1–2 MB MP3/WAV/WebM) and executes ultra-fast transcription via Groq `whisper-large-v3`.

* **Method:** `POST`
* **Path:** `/api/ai/transcribe`
* **Headers:** `Content-Type: multipart/form-data`
* **Request Payload (FormData):**
  * `file`: Binary audio blob (16kHz mono audio).
  * `languageHint`: Optional (e.g. `"hi"` for Hindi, `"en"` for English, or auto-detect).
* **Response (200 OK):**
  ```typescript
  interface TranscribeResponse {
    success: true;
    detectedLanguage: string;   // E.g. "en", "hi"
    durationSeconds: number;
    fullTranscript: string;
    words: Array<{
      word: string;
      start: number;           // In seconds (e.g., 0.42)
      end: number;             // In seconds (e.g., 0.88)
      confidence?: number;
    }>;
    segments: Array<{
      id: number;
      start: number;
      end: number;
      text: string;
    }>;
  }
  ```

---

## 4. AI Surgery & Copilot Endpoints

### 4.1 Detect Pauses & Filler Words
Identifies awkward silences $>0.5\text{s}$ and filler words (e.g., "umm", "ahh", "matlab").

* **Method:** `POST`
* **Path:** `/api/ai/detect-silence`
* **Request Body:**
  ```typescript
  interface DetectSilenceRequest {
    words: Array<{ word: string; start: number; end: number }>;
    totalDuration: number;
    minSilenceThresholdSeconds?: number; // Defaults to 0.5s
  }
  ```
* **Response (200 OK):**
  ```typescript
  interface DetectSilenceResponse {
    success: true;
    totalSilenceDuration: number;  // E.g., 4.2 seconds saved
    silenceIntervals: Array<{
      start: number;
      end: number;
      duration: number;
    }>;
    recommendedCuts: Array<{
      start: number;
      end: number;
    }>;
  }
  ```

---

### 4.2 Prompt-to-Edit Copilot
Translates natural language commands into an Edit Decision List (EDL) mutation diff.

* **Method:** `POST`
* **Path:** `/api/ai/copilot-prompt`
* **Request Body:**
  ```typescript
  interface CopilotPromptRequest {
    userPrompt: string;      // E.g. "Make intro faster and add whoosh at 4s"
    currentEdl: EditDecisionList;
    words: Array<{ word: string; start: number; end: number }>;
  }
  ```
* **Response (200 OK):**
  ```typescript
  interface CopilotPromptResponse {
    success: true;
    appliedSummary: string;  // E.g. "Sped up 0-5s by 1.25x and added whoosh SFX at 4.0s"
    updatedEdl: EditDecisionList;
  }
  ```

---

## 5. Video Rendering & Export Endpoints

Dispatches serverless cloud render jobs powered by AWS Lambda and FFmpeg.

### 5.1 Trigger Render Job
* **Method:** `POST`
* **Path:** `/api/render/export`
* **Request Body:**
  ```typescript
  interface ExportRenderRequest {
    fileKey: string;           // Raw S3 video key
    resolution: "720p" | "1080p";
    aspectRatio: "9:16" | "1:1" | "16:9";
    includeWatermark: boolean; // True for free tier, false for Day Pass
    edl: EditDecisionList;
  }
  ```
* **Response (202 Accepted):**
  ```typescript
  interface ExportRenderResponse {
    success: true;
    jobId: string;             // UUID to poll render progress
    status: "queued";
    estimatedWaitSeconds: number; // E.g., 20
  }
  ```

---

### 5.2 Poll Render Status
* **Method:** `GET`
* **Path:** `/api/render/status/:jobId`
* **Response (200 OK):**
  ```typescript
  interface RenderStatusResponse {
    success: true;
    jobId: string;
    status: "queued" | "processing" | "completed" | "failed";
    progressPercentage: number;   // 0 - 100
    downloadUrl?: string;         // Pre-signed S3 download URL valid for 24 hours
    fileSizeMb?: number;
    error?: string;
  }
  ```

---

## 6. Monetization & UPI Webhook (Razorpay)

### 6.1 Create Day Pass Payment Order
* **Method:** `POST`
* **Path:** `/api/billing/create-order`
* **Request Body:**
  ```typescript
  interface CreateOrderRequest {
    planType: "day_pass_99" | "pro_monthly_799";
    sessionId: string;
    userEmail?: string;
  }
  ```
* **Response (200 OK):**
  ```typescript
  interface CreateOrderResponse {
    success: true;
    orderId: string;         // Razorpay Order ID (e.g. "order_EKwxwAgituvd83")
    amount: number;          // 9900 (paise = ₹99)
    currency: "INR";
    keyId: string;           // Razorpay Public Key ID
  }
  ```

---

### 6.2 Razorpay Webhook Handler
* **Method:** `POST`
* **Path:** `/api/billing/webhook`
* **Headers:** `x-razorpay-signature: <hmac_sha256>`
* **Payload:** Razorpay event (`order.paid`, `payment.captured`).
* **Behavior:** Verifies the cryptographic HMAC signature, matches `sessionId`, and flags the user session as active with 24-hour expiration (`expiresAt = now() + 24 hours`).

---

## 7. Edit Decision List (EDL) Data Contract

```typescript
export interface EditDecisionList {
  version: "1.0";
  sourceFileKey: string;
  aspectRatio: "9:16" | "1:1" | "16:9";
  segmentsToKeep: Array<{
    start: number;
    end: number;
    speedMultiplier?: number; // Default 1.0 (e.g. 1.25x for fast hook)
  }>;
  subtitles: {
    enabled: boolean;
    preset: "hormozi" | "neon" | "minimal";
    fontFamily: string;
    activeWordColor: string;
    inactiveWordColor: string;
    maxWordsPerScreen: number; // Default: 3
    autoEmojis: boolean;
  };
  audio: {
    bgmTrackId?: string;
    bgmVolume: number;         // 0.0 to 1.0
    autoDucking: boolean;      // True: -18dB duck during speech
    sfxEvents: Array<{
      timestamp: number;
      soundFile: string;
      volume: number;
    }>;
  };
  visualEffects: Array<{
    timestamp: number;
    effectType: "punch_zoom" | "glitch" | "flash" | "rgb_split";
    duration: number;
  }>;
}
```
