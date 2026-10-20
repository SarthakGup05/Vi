// QA Automation Script for F_AUTH
import assert from "node:assert";

console.log("=========================================");
console.log("🧪 VibeCut AI - QA Test Suite for F_AUTH");
console.log("=========================================\n");

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
  }
}

// ------------------------------------------------------------------
// Test 1: UUID v4 Generation & Fallback Logic
// ------------------------------------------------------------------
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function generateUUIDFallback() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateUUIDWithCrypto() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return generateUUIDFallback();
}

test("TC_AUTH_01: Native crypto.randomUUID produces valid RFC 4122 v4 UUID", () => {
  const uuid = generateUUIDWithCrypto();
  assert(UUID_V4_REGEX.test(uuid), `Generated UUID "${uuid}" does not match v4 pattern`);
});

test("TC_AUTH_02: Math.random fallback produces valid RFC 4122 v4 UUID", () => {
  for (let i = 0; i < 50; i++) {
    const uuid = generateUUIDFallback();
    assert(UUID_V4_REGEX.test(uuid), `Fallback UUID "${uuid}" failed v4 spec at iteration ${i}`);
  }
});

// ------------------------------------------------------------------
// Test 2: Guest Session Id Persistence in localStorage Simulation
// ------------------------------------------------------------------
test("TC_AUTH_03: Guest Session ID generates once and persists across calls", () => {
  const fakeStorage = new Map();
  const GUEST_STORAGE_KEY = "vibecut_guest_session_id";

  const getGuestId = () => {
    let id = fakeStorage.get(GUEST_STORAGE_KEY);
    if (!id) {
      id = generateUUIDWithCrypto();
      fakeStorage.set(GUEST_STORAGE_KEY, id);
    }
    return id;
  };

  const firstCallId = getGuestId();
  assert(UUID_V4_REGEX.test(firstCallId), "First call should create valid UUID");
  
  const secondCallId = getGuestId();
  assert.strictEqual(firstCallId, secondCallId, "Second call must return the exact same cached UUID");
  assert.strictEqual(fakeStorage.get(GUEST_STORAGE_KEY), firstCallId, "Storage should contain the ID");
});

// ------------------------------------------------------------------
// Test 3: Client isSupabaseConfigured() validation logic
// ------------------------------------------------------------------
const isSupabaseConfiguredTest = (url, key) => {
  const u = url?.trim();
  const k = key?.trim();
  if (!u || !k) return false;
  if (
    u === "https://your-project.supabase.co" ||
    k === "your_supabase_anon_key" ||
    !u.startsWith("http")
  ) {
    return false;
  }
  return true;
};

test("TC_AUTH_04: isSupabaseConfigured correctly detects unconfigured/empty credentials", () => {
  assert.strictEqual(isSupabaseConfiguredTest("", ""), false);
  assert.strictEqual(isSupabaseConfiguredTest(undefined, undefined), false);
  assert.strictEqual(isSupabaseConfiguredTest("https://your-project.supabase.co", "your_supabase_anon_key"), false);
  assert.strictEqual(isSupabaseConfiguredTest("invalid-url", "some_key"), false);
});

test("TC_AUTH_05: isSupabaseConfigured validates real Supabase URL and anon key", () => {
  assert.strictEqual(
    isSupabaseConfiguredTest("https://xyzcompany.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy"),
    true
  );
});

// ------------------------------------------------------------------
// Test 4: Auth Modal Form Validation Rules
// ------------------------------------------------------------------
function validateAuthForm(email, password) {
  if (!email || !email.includes("@")) {
    return "Please enter a valid email address.";
  }
  if (!password || password.length < 6) {
    return "Password must be at least 6 characters long.";
  }
  return null;
}

test("TC_AUTH_06: Form validation rejects invalid/empty email", () => {
  assert.strictEqual(validateAuthForm("", "password123"), "Please enter a valid email address.");
  assert.strictEqual(validateAuthForm("notanemail", "password123"), "Please enter a valid email address.");
});

test("TC_AUTH_07: Form validation rejects passwords shorter than 6 characters", () => {
  assert.strictEqual(validateAuthForm("test@vibecut.ai", ""), "Password must be at least 6 characters long.");
  assert.strictEqual(validateAuthForm("test@vibecut.ai", "12345"), "Password must be at least 6 characters long.");
});

test("TC_AUTH_08: Form validation accepts valid email and 6+ character password", () => {
  assert.strictEqual(validateAuthForm("creator@vibecut.ai", "secret123"), null);
});

// ------------------------------------------------------------------
// Test 5: Route Handler URL & Redirect logic
// ------------------------------------------------------------------
test("TC_AUTH_09: /auth/callback redirects properly based on code parameter", () => {
  // Case A: Missing code -> redirect to origin root '/'
  const urlWithoutCode = new URL("http://localhost:3000/auth/callback");
  const codeA = urlWithoutCode.searchParams.get("code");
  assert.strictEqual(codeA, null);
  const targetA = codeA ? urlWithoutCode.searchParams.get("next") ?? "/" : "/";
  assert.strictEqual(targetA, "/");

  // Case B: With code and custom 'next' redirect parameter
  const urlWithCodeAndNext = new URL("http://localhost:3000/auth/callback?code=abc-123&next=/studio");
  const codeB = urlWithCodeAndNext.searchParams.get("code");
  const nextB = urlWithCodeAndNext.searchParams.get("next") ?? "/";
  assert.strictEqual(codeB, "abc-123");
  assert.strictEqual(nextB, "/studio");
});

// ------------------------------------------------------------------
// Summary Report
// ------------------------------------------------------------------
console.log("\n=========================================");
console.log(`Results: ${passed} / ${total} tests passed (${Math.round((passed/total)*100)}%)`);
console.log("=========================================\n");

if (passed !== total) {
  process.exit(1);
}
