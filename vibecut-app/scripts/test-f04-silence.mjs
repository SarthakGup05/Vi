import assert from "node:assert";

console.log("=== F04 Smart Jump Cut & Silence / Filler Surgery Test Suite ===");

// 1. Test Filler Words Detection Logic
const SINGLE_FILLER_WORDS = new Set([
  "um", "umm", "uh", "uhh", "uhm", "er", "ah", "ahh", "like", "basically",
  "actually", "literally", "right", "so", "totally", "seriously",
  "matlab", "yaani", "yani", "toh", "haan", "arrey", "arre", "yaar", "bhai",
  "achha", "accha", "waise"
]);

const MULTI_WORD_FILLERS = [
  ["you", "know"],
  ["sort", "of"],
  ["kind", "of"],
  ["i", "mean"],
];

function testDetectFillerWords(words) {
  if (!words || words.length === 0) return [];
  const cleanList = words.map((w) => w.word.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const fillerIndices = new Set();

  cleanList.forEach((cw, idx) => {
    if (SINGLE_FILLER_WORDS.has(cw)) {
      fillerIndices.add(idx);
    }
  });

  for (const phrase of MULTI_WORD_FILLERS) {
    const pLen = phrase.length;
    for (let i = 0; i <= words.length - pLen; i++) {
      let matches = true;
      for (let j = 0; j < pLen; j++) {
        if (cleanList[i + j] !== phrase[j]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        let naturalPacing = true;
        for (let j = 0; j < pLen - 1; j++) {
          if (words[i + j + 1].start - words[i + j].end > 0.8) {
            naturalPacing = false;
            break;
          }
        }
        if (naturalPacing) {
          for (let j = 0; j < pLen; j++) {
            fillerIndices.add(i + j);
          }
        }
      }
    }
  }

  return words.map((w, index) => ({
    id: w.id || `word-${index}`,
    word: w.word,
    start: w.start,
    end: w.end,
    isFiller: fillerIndices.has(index),
    deleted: w.deleted ?? false,
  }));
}

// Test dataset containing all required English + Hinglish fillers:
// "um, uh, like, basically, you know, sort of, kind of, matlab, yaani, actually, right, so"
const mockWords = [
  { word: "Um,", start: 0.1, end: 0.3 },
  { word: "uh", start: 0.4, end: 0.6 },
  { word: "welcome", start: 0.7, end: 1.1 },
  { word: "everyone", start: 1.2, end: 1.6 },
  { word: "Basically,", start: 2.5, end: 3.0 }, // Pause of 0.9s before this
  { word: "this", start: 3.1, end: 3.3 },
  { word: "is", start: 3.4, end: 3.5 },
  { word: "like", start: 3.6, end: 3.8 },
  { word: "you", start: 3.9, end: 4.1 },
  { word: "know", start: 4.15, end: 4.35 }, // Multi-word filler: "you know"
  { word: "kind", start: 4.4, end: 4.6 },
  { word: "of", start: 4.65, end: 4.8 },  // Multi-word filler: "kind of"
  { word: "sort", start: 4.9, end: 5.1 },
  { word: "of", start: 5.15, end: 5.3 },  // Multi-word filler: "sort of"
  { word: "awesome,", start: 5.4, end: 5.9 },
  { word: "matlab", start: 7.0, end: 7.4 }, // Pause of 1.1s before this! Hinglish: matlab
  { word: "yaani", start: 7.5, end: 7.8 },  // Hinglish: yaani
  { word: "it", start: 7.9, end: 8.0 },
  { word: "actually", start: 8.1, end: 8.5 },
  { word: "works,", start: 8.6, end: 9.0 },
  { word: "right", start: 9.1, end: 9.3 },
  { word: "so", start: 9.4, end: 9.6 },
  { word: "cool!", start: 9.7, end: 10.0 },
];

const taggedWords = testDetectFillerWords(mockWords);

console.log("\n1. Verifying Filler Word Detection:");
const fillerWordsFound = taggedWords.filter(w => w.isFiller).map(w => w.word);
console.log("Detected filler words:", fillerWordsFound.join(" "));

const requiredFillers = [
  "Um,", "uh", "Basically,", "like", "you", "know", "kind", "of", "sort", "of",
  "matlab", "yaani", "actually", "right", "so"
];

for (const req of requiredFillers) {
  const match = taggedWords.find(w => w.word === req && w.isFiller);
  assert(match, `Expected '${req}' to be flagged as filler!`);
}
console.log("✓ All English + Hinglish filler words and phrases detected successfully!");

// Non-filler verification:
const nonFillers = ["welcome", "everyone", "this", "is", "awesome,", "it", "works,", "cool!"];
for (const nf of nonFillers) {
  const match = taggedWords.find(w => w.word === nf);
  assert(match && !match.isFiller, `Expected '${nf}' NOT to be flagged as filler!`);
}
console.log("✓ Legitimate content words correctly retained as non-fillers!");

// 2. Test Silence Gap Calculation Logic with Safety Padding
function testDetectSilenceGaps(words, duration, minDurationSec = 0.5, paddingSec = 0.05) {
  if (!words || words.length === 0) return [];
  const sorted = [...words]
    .filter((w) => typeof w.start === "number" && typeof w.end === "number" && w.end >= w.start)
    .sort((a, b) => a.start - b.start);

  if (sorted.length === 0) return [];
  const gaps = [];

  // Initial silence
  const firstWord = sorted[0];
  if (firstWord.start >= minDurationSec) {
    const rawStart = 0;
    const rawEnd = firstWord.start;
    const rawDuration = rawEnd - rawStart;
    const cutStart = 0;
    const cutEnd = Math.max(0, rawEnd - paddingSec);
    const cutDuration = cutEnd - cutStart;
    if (cutDuration > 0.02) {
      gaps.push({
        id: `gap-start-0-${Math.round(rawEnd * 100)}`,
        start: parseFloat(cutStart.toFixed(2)),
        end: parseFloat(cutEnd.toFixed(2)),
        duration: parseFloat(cutDuration.toFixed(2)),
        rawStart: parseFloat(rawStart.toFixed(2)),
        rawEnd: parseFloat(rawEnd.toFixed(2)),
        rawDuration: parseFloat(rawDuration.toFixed(2)),
        prevWord: "[Start]",
        nextWord: firstWord.word,
      });
    }
  }

  // Silence between words
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    const rawStart = curr.end;
    const rawEnd = next.start;
    const rawDuration = rawEnd - rawStart;

    if (rawDuration >= minDurationSec) {
      const cutStart = rawStart + paddingSec;
      const cutEnd = rawEnd - paddingSec;
      const cutDuration = cutEnd - cutStart;
      if (cutDuration > 0.02) {
        gaps.push({
          id: `gap-${i}-${Math.round(rawStart * 100)}-${Math.round(rawEnd * 100)}`,
          start: parseFloat(cutStart.toFixed(2)),
          end: parseFloat(cutEnd.toFixed(2)),
          duration: parseFloat(cutDuration.toFixed(2)),
          rawStart: parseFloat(rawStart.toFixed(2)),
          rawEnd: parseFloat(rawEnd.toFixed(2)),
          rawDuration: parseFloat(rawDuration.toFixed(2)),
          prevWord: curr.word,
          nextWord: next.word,
        });
      }
    }
  }

  // Trailing silence
  const lastWord = sorted[sorted.length - 1];
  if (duration > 0 && duration - lastWord.end >= minDurationSec) {
    const rawStart = lastWord.end;
    const rawEnd = duration;
    const rawDuration = rawEnd - rawStart;
    const cutStart = rawStart + paddingSec;
    const cutEnd = duration;
    const cutDuration = cutEnd - cutStart;
    if (cutDuration > 0.02) {
      gaps.push({
        id: `gap-end-${Math.round(rawStart * 100)}-${Math.round(rawEnd * 100)}`,
        start: parseFloat(cutStart.toFixed(2)),
        end: parseFloat(cutEnd.toFixed(2)),
        duration: parseFloat(cutDuration.toFixed(2)),
        rawStart: parseFloat(rawStart.toFixed(2)),
        rawEnd: parseFloat(rawEnd.toFixed(2)),
        rawDuration: parseFloat(rawDuration.toFixed(2)),
        prevWord: lastWord.word,
        nextWord: "[End]",
      });
    }
  }

  return gaps;
}

console.log("\n2. Verifying Silence Gap Detection with Safety Padding:");
const silences = testDetectSilenceGaps(mockWords, 12.0, 0.5, 0.05);
console.log(`Found ${silences.length} silence gaps >= 0.5s in 12s video:`);
silences.forEach(s => {
  console.log(` - [${s.start}s - ${s.end}s] (${s.duration}s cut, raw: ${s.rawStart}s - ${s.rawEnd}s = ${s.rawDuration}s) between "${s.prevWord}" and "${s.nextWord}"`);
});

assert(silences.length === 3, `Expected 3 silences, got ${silences.length}`);

// Check safety padding on Gap 1 (between "everyone" at 1.6s and "Basically," at 2.5s)
// raw gap: [1.60s, 2.50s], rawDuration: 0.90s
// with 0.05s padding on start and end: cut is [1.65s, 2.45s], cut duration is 0.80s
const gap1 = silences.find(s => s.prevWord === "everyone" && s.nextWord === "Basically,");
assert(gap1, "Gap 1 must exist");
assert.strictEqual(gap1.rawStart, 1.6);
assert.strictEqual(gap1.rawEnd, 2.5);
assert.strictEqual(gap1.start, 1.65); // 1.60 + 0.05s padding!
assert.strictEqual(gap1.end, 2.45);   // 2.50 - 0.05s padding!
assert.strictEqual(gap1.duration, 0.8);
console.log("✓ Safety padding correctly leaves 50ms guard on preceding word and 50ms guard on succeeding word!");

// Check trailing silence (between "cool!" at 10.0s and video end at 12.0s = 2.0s raw gap)
const gapTrailing = silences.find(s => s.nextWord === "[End]");
assert(gapTrailing, "Trailing silence must exist");
assert.strictEqual(gapTrailing.start, 10.05); // 10.0 + 0.05s padding
assert.strictEqual(gapTrailing.end, 12.0);   // to end of video
assert.strictEqual(gapTrailing.duration, 1.95);
console.log("✓ Trailing silence detected with padding after last spoken word!");

// 3. Test Sensitivity Threshold Adjustment
const strictSilences = testDetectSilenceGaps(mockWords, 12.0, 1.0, 0.05);
console.log(`\n3. Verifying Sensitivity Threshold (>= 1.0s):`);
console.log(`Found ${strictSilences.length} gaps >= 1.0s.`);
assert(strictSilences.length === 2, "Expected 2 gaps with duration >= 1.0s");
console.log("✓ Threshold filtering accurately responds to user slider values!");

console.log("\n=== ALL F04 VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
