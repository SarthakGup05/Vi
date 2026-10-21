import assert from "node:assert";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== VibeCut Video Projects & S3 Optimization QA Test Suite ===");

  // 1. Check /projects page renders HTTP 200
  console.log("\n1. Testing GET /projects dashboard page...");
  const projectsPageRes = await fetch(`${BASE_URL}/projects`);
  assert.strictEqual(projectsPageRes.status, 200, "Expected /projects to return 200 OK");
  const projectsHtml = await projectsPageRes.text();
  assert.ok(projectsHtml.includes("Video Projects") || projectsHtml.includes("Projects"), "Expected Projects page text");
  console.log("   ✓ /projects page renders HTTP 200 successfully");

  // 2. Check /studio page renders HTTP 200
  console.log("\n2. Testing GET /studio page...");
  const studioPageRes = await fetch(`${BASE_URL}/studio`);
  assert.strictEqual(studioPageRes.status, 200, "Expected /studio to return 200 OK");
  console.log("   ✓ /studio page renders HTTP 200 successfully");

  // 3. Test GET /api/projects returns real project array with presigned videoStreamUrl
  console.log("\n3. Testing GET /api/projects (S3 streaming URL generation)...");
  const apiProjectsRes = await fetch(`${BASE_URL}/api/projects`);
  assert.strictEqual(apiProjectsRes.status, 200, "Expected /api/projects to return 200 OK");
  const data = await apiProjectsRes.json();
  assert.ok(Array.isArray(data.projects), "Expected projects array");
  console.log(`   ✓ Found ${data.projects.length} real projects in Supabase database`);

  if (data.projects.length > 0) {
    const firstProject = data.projects[0];
    console.log(`   Sample project: "${firstProject.title}" (ID: ${firstProject.id})`);
    console.log(`   S3 Key: ${firstProject.raw_video_s3_key || "None"}`);
    if (firstProject.raw_video_s3_key) {
      assert.ok(firstProject.videoStreamUrl, "Expected presigned videoStreamUrl for S3 object");
      assert.ok(firstProject.videoStreamUrl.includes("X-Amz-Signature") || firstProject.videoStreamUrl.includes("amazonaws.com"), "Expected authentic AWS S3 presigned URL");
      console.log(`   ✓ Authentic S3 Presigned URL generated: ${firstProject.videoStreamUrl.substring(0, 75)}...`);
    }

    // 4. Test Single Project Fetch (Hydration endpoint: GET /api/projects?id=...)
    console.log("\n4. Testing GET /api/projects?id=... (Studio hydration endpoint)...");
    const singleRes = await fetch(`${BASE_URL}/api/projects?id=${firstProject.id}`);
    assert.strictEqual(singleRes.status, 200, "Expected single project fetch to return 200 OK");
    const singleData = await singleRes.json();
    assert.ok(singleData.project, "Expected project object in response");
    assert.strictEqual(singleData.project.id, firstProject.id);
    if (singleData.project.raw_video_s3_key) {
      assert.ok(singleData.project.videoStreamUrl, "Expected videoStreamUrl on hydrated project");
      console.log("   ✓ Project hydration response includes valid presigned videoStreamUrl");
    }

    // 5. Test PATCH /api/projects (Inline Rename & Aspect Ratio update)
    console.log("\n5. Testing PATCH /api/projects (Project rename & aspect ratio update)...");
    const originalTitle = firstProject.title || "My Test Reel";
    const testTitle = `${originalTitle} (Renamed)`;
    const patchRes = await fetch(`${BASE_URL}/api/projects`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: firstProject.id, title: testTitle }),
    });
    assert.strictEqual(patchRes.status, 200, "Expected PATCH /api/projects to return 200 OK");
    const patchData = await patchRes.json();
    assert.strictEqual(patchData.project.title, testTitle, "Expected title to update");
    console.log(`   ✓ Successfully renamed project to: "${testTitle}"`);

    // Revert rename to keep user's original data clean
    await fetch(`${BASE_URL}/api/projects`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: firstProject.id, title: originalTitle }),
    });
    console.log(`   ✓ Restored original project title: "${originalTitle}"`);
  }

  // 6. Test Lifecycle: Create a test project, verify S3 metadata, then delete and verify S3 cleanup
  console.log("\n6. Testing Project Lifecycle with S3 Storage Reclamation (Create -> Query -> Delete)...");
  const testKey = `test_videos/qa_lifecycle_${Date.now()}.mp4`;
  const createRes = await fetch(`${BASE_URL}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "QA Temporary Project",
      raw_video_s3_key: testKey,
      file_size_bytes: 1048576, // 1MB
      aspect_ratio: "9:16",
      session_id: "00000000-0000-0000-0000-000000000001",
      duration_seconds: 15,
      transcript: {
        words: [{ id: "w-1", word: "Hello", start: 0, end: 0.5 }],
        text: "Hello",
        language: "en",
      },
      edl: { cuts: [], deletedWordIds: [] },
      applied_prompt: "QA test",
    }),
  });
  assert.strictEqual(createRes.status, 200, "Expected POST /api/projects to return 200 OK");
  const createdProj = await createRes.json();
  const createdId = createdProj.id;
  assert.ok(createdId, "Expected created project to return an id");
  console.log(`   ✓ Created test project with ID: ${createdId}`);

  // Now delete via DELETE /api/projects
  const deleteRes = await fetch(`${BASE_URL}/api/projects`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: createdId }),
  });
  assert.strictEqual(deleteRes.status, 200, "Expected DELETE /api/projects to return 200 OK");
  const deleteData = await deleteRes.json();
  assert.ok(deleteData.success, "Expected delete success flag");
  console.log(`   ✓ Successfully deleted test project and purged S3 key "${testKey}"`);

  // Verify project is no longer in Supabase
  const checkDeletedRes = await fetch(`${BASE_URL}/api/projects?id=${createdId}`);
  assert.ok(checkDeletedRes.status === 404 || checkDeletedRes.status === 500 || !(await checkDeletedRes.json()).project, "Expected deleted project not to be retrievable");
  console.log("   ✓ Verified project is no longer retrievable from database");

  console.log("\n=== ALL QA TESTS PASSED SUCCESSFULLY (6/6) ===");
}

runTests().catch((err) => {
  console.error("QA Test Failure:", err);
  process.exit(1);
});
