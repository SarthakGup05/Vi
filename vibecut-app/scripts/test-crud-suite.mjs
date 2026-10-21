import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

async function runCrudAudit() {
  console.log("============================================================");
  console.log("   VibeCut Pro — Comprehensive CRUD Operations Audit Suite   ");
  console.log("============================================================\n");

  // Step 1: CREATE (C) — New Project Ingestion
  console.log("▶ 1. [CREATE] Ingesting New Project with Transcripts & EDL...");
  const initialS3Key = `raw-uploads/crud-test-${Date.now()}.mp4`;
  const initialWords = [
    { id: "w-1", word: "Welcome", start: 0.0, end: 0.45, isFiller: false, deleted: false },
    { id: "w-2", word: "um", start: 0.48, end: 0.85, isFiller: true, deleted: false },
    { id: "w-3", word: "to", start: 0.9, end: 1.1, isFiller: false, deleted: false },
    { id: "w-4", word: "VibeCut", start: 1.15, end: 1.8, isFiller: false, deleted: false },
  ];
  const initialEdl = {
    cuts: [],
    deletedWordIds: [],
    effectiveDuration: 1.8,
    captionStyle: "hormozi",
    aspectRatio: "9:16",
  };

  const createRes = await fetch(`${BASE_URL}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "CRUD Verification Reel",
      raw_video_s3_key: initialS3Key,
      file_size_bytes: 4194304, // 4MB
      aspect_ratio: "9:16",
      width: 1080,
      height: 1920,
      duration_seconds: 1.8,
      session_id: "00000000-0000-0000-0000-000000000001",
      transcript: {
        words: initialWords,
        text: "Welcome um to VibeCut",
        language: "en",
      },
      edl: initialEdl,
      applied_prompt: "Initial Project Create",
    }),
  });

  assert.strictEqual(createRes.status, 200, "POST /api/projects must return 200");
  const createData = await createRes.json();
  assert.ok(createData.id, "Created project must have UUID id");
  const projectId = createData.id;
  console.log(`   ✓ Created Project ID: ${projectId}`);
  console.log(`   ✓ Initial Revision ID: ${createData.edlRevision?.id || "rev-1"} (Revision #1)`);

  // Step 2: READ (R) — Batch Listing & Word Count Normalization
  console.log("\n▶ 2. [READ - Batch] Querying /api/projects list...");
  const listRes = await fetch(`${BASE_URL}/api/projects`);
  assert.strictEqual(listRes.status, 200, "GET /api/projects must return 200");
  const listData = await listRes.json();
  assert.ok(Array.isArray(listData.projects), "Projects must be an array");
  
  const foundInList = listData.projects.find((p) => p.id === projectId);
  assert.ok(foundInList, "Newly created project must appear in project list");
  assert.strictEqual(foundInList.title, "CRUD Verification Reel");
  assert.strictEqual(foundInList.aspect_ratio, "9:16");
  assert.ok(foundInList.transcripts && foundInList.transcripts.length > 0, "Transcripts must be attached");
  assert.strictEqual(foundInList.transcripts[0].words.length, 4, "Transcripts.words must have 4 words normalized");
  console.log(`   ✓ Project found in batch list with ${foundInList.transcripts[0].words.length} normalized words`);

  // Step 3: READ (R) — Single Project Studio Hydration Endpoint
  console.log("\n▶ 3. [READ - Single] Hydrating Project for Studio (/api/projects?id=...)...");
  const singleRes = await fetch(`${BASE_URL}/api/projects?id=${projectId}`);
  assert.strictEqual(singleRes.status, 200, "GET /api/projects?id= must return 200");
  const singleData = await singleRes.json();
  assert.ok(singleData.project, "Response must include project");
  assert.strictEqual(singleData.project.id, projectId);
  assert.strictEqual(singleData.project.transcripts[0].transcript_text, "Welcome um to VibeCut");
  assert.strictEqual(singleData.project.edl_revisions[0].revision_number, 1);
  console.log("   ✓ Studio hydration data verified with exact transcript text and latest EDL revision");

  // Step 4: UPDATE (U) — Inline Metadata Update via PATCH
  console.log("\n▶ 4. [UPDATE - Metadata] Updating title & aspect ratio via PATCH...");
  const patchRes = await fetch(`${BASE_URL}/api/projects`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: projectId,
      title: "CRUD Verification Reel (Renamed to Cinema)",
      aspect_ratio: "16:9",
    }),
  });
  assert.strictEqual(patchRes.status, 200, "PATCH /api/projects must return 200");
  const patchData = await patchRes.json();
  assert.strictEqual(patchData.project.title, "CRUD Verification Reel (Renamed to Cinema)");
  assert.strictEqual(patchData.project.aspect_ratio, "16:9");
  console.log(`   ✓ Updated title: "${patchData.project.title}"`);
  console.log(`   ✓ Updated aspect ratio: ${patchData.project.aspect_ratio}`);

  // Step 5: UPDATE (U) — Studio Draft Save with EDL Revisions & Word Cuts
  console.log("\n▶ 5. [UPDATE - Draft & EDL] Simulating Word-Cut Surgery & EDL Revision #2...");
  const updatedWords = [
    { id: "w-1", word: "Welcome", start: 0.0, end: 0.45, isFiller: false, deleted: false },
    { id: "w-2", word: "um", start: 0.48, end: 0.85, isFiller: true, deleted: true }, // Cut filler
    { id: "w-3", word: "to", start: 0.9, end: 1.1, isFiller: false, deleted: false },
    { id: "w-4", word: "VibeCut", start: 1.15, end: 1.8, isFiller: false, deleted: false },
  ];
  const updatedEdl = {
    cuts: [{ id: "cut-filler-1", start: 0.48, end: 0.85, type: "filler" }],
    deletedWordIds: ["w-2"],
    effectiveDuration: 1.43,
    captionStyle: "beast",
    aspectRatio: "16:9",
  };

  const saveDraftRes = await fetch(`${BASE_URL}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      title: "CRUD Verification Reel (Renamed to Cinema)",
      aspect_ratio: "16:9",
      duration_seconds: 1.43,
      session_id: "00000000-0000-0000-0000-000000000001",
      transcript: {
        words: updatedWords,
        text: "Welcome to VibeCut",
        language: "en",
      },
      edl: updatedEdl,
      applied_prompt: "Cut filler 'um' (-0.37s)",
    }),
  });
  assert.strictEqual(saveDraftRes.status, 200, "Draft save must return 200");
  const saveDraftData = await saveDraftRes.json();
  assert.strictEqual(saveDraftData.id, projectId);
  assert.strictEqual(saveDraftData.edlRevision?.revision_number, 2, "Must create Revision #2");
  console.log(`   ✓ EDL Revision #2 persisted: ${saveDraftData.edlRevision?.applied_prompt}`);

  // Verify that the updated project reflects Revision #2 as the latest
  const reFetchRes = await fetch(`${BASE_URL}/api/projects?id=${projectId}`);
  const reFetchData = await reFetchRes.json();
  assert.strictEqual(reFetchData.project.edl_revisions[0].revision_number, 2, "Latest revision must be #2");
  assert.strictEqual(reFetchData.project.transcripts[0].words.find((w) => w.id === "w-2").deleted, true);
  console.log("   ✓ Verified latest revision is #2 and word cut state is saved in DB");

  // Step 6: DELETE (D) — Project Deletion & Storage Reclamation
  console.log("\n▶ 6. [DELETE] Deleting Project & Purging Storage...");
  const deleteRes = await fetch(`${BASE_URL}/api/projects?id=${projectId}`, {
    method: "DELETE",
  });
  assert.strictEqual(deleteRes.status, 200, "DELETE /api/projects must return 200");
  const deleteData = await deleteRes.json();
  assert.strictEqual(deleteData.success, true);
  console.log("   ✓ Project deleted and S3 purge invoked");

  // Verify project is no longer in Supabase
  const verifyDeleteRes = await fetch(`${BASE_URL}/api/projects?id=${projectId}`);
  const verifyDeleteData = await verifyDeleteRes.json();
  assert.ok(!verifyDeleteData.project, "Project must not exist after deletion");
  console.log("   ✓ Confirmed project no longer retrievable from database");

  console.log("\n============================================================");
  console.log("   ✅ ALL CRUD OPERATIONS PASSED WITH 100% INTEGRITY!       ");
  console.log("============================================================\n");
}

runCrudAudit().catch((err) => {
  console.error("CRUD Audit Failed:", err);
  process.exit(1);
});
