// ==============================================================================
// VibeCut AI — Procedural Web Audio API SFX Engine
// Zero external audio files or network dependencies.
// 100% procedurally synthesized in real-time in the browser.
// ==============================================================================

export type SFXCue =
  | "whoosh"
  | "boom"
  | "ding"
  | "pop"
  | "cash"
  | "glitch"
  | "vhsTapeClick";

export interface SFXCueMetadata {
  id: SFXCue;
  name: string;
  emoji: string;
  description: string;
  defaultVolume: number;
}

export const SFX_CUE_CATALOG: SFXCueMetadata[] = [
  {
    id: "whoosh",
    name: "Fast Whoosh",
    emoji: "💨",
    description: "Dynamic air sweep for punch zooms and rapid jump cuts",
    defaultVolume: 0.5,
  },
  {
    id: "boom",
    name: "808 Sub Boom",
    emoji: "💥",
    description: "Deep viral sub-bass impact on hook and emphasis drops",
    defaultVolume: 0.7,
  },
  {
    id: "pop",
    name: "Emoji Pop",
    emoji: "🎈",
    description: "Crisp bubble chirp on kinetic emoji & sticker appearances",
    defaultVolume: 0.45,
  },
  {
    id: "ding",
    name: "Chime Ding",
    emoji: "🔔",
    description: "Bright metallic ping for tips, highlights, and bullet points",
    defaultVolume: 0.5,
  },
  {
    id: "cash",
    name: "Ka-Ching",
    emoji: "💰",
    description: "Viral money register chime for finance & stats callouts",
    defaultVolume: 0.55,
  },
  {
    id: "glitch",
    name: "Cyber Glitch",
    emoji: "⚡",
    description: "Digital artifact stutter burst for fast transitions",
    defaultVolume: 0.5,
  },
  {
    id: "vhsTapeClick",
    name: "Tape Click",
    emoji: "📼",
    description: "Mechanical VHS cassette solenoid engagement click",
    defaultVolume: 0.4,
  },
];

let globalAudioCtx: AudioContext | null = null;

/**
 * SSR-safe AudioContext getter with auto-resume on user gestures.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    if (!globalAudioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        globalAudioCtx = new AudioCtxClass();
      }
    }

    if (globalAudioCtx && globalAudioCtx.state === "suspended") {
      globalAudioCtx.resume().catch(() => {});
    }

    return globalAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Synthesizes dynamic wind/air whoosh using filtered white noise sweep.
 */
function synthesizeWhoosh(ctx: AudioContext, vol: number) {
  const duration = 0.32;
  const sampleRate = ctx.sampleRate;
  const bufferSize = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  // Generate white noise with soft pink rolloff
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.4;
  }

  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 2.4;

  const now = ctx.currentTime;
  // Sweep frequency up then down
  filter.frequency.setValueAtTime(260, now);
  filter.frequency.exponentialRampToValueAtTime(2400, now + duration * 0.45);
  filter.frequency.exponentialRampToValueAtTime(160, now + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(vol * 0.95, now + duration * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noiseNode.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noiseNode.start(now);
  noiseNode.stop(now + duration);
}

/**
 * Synthesizes punchy 808 sub-bass drop with punch harmonic.
 */
function synthesizeBoom(ctx: AudioContext, vol: number) {
  const duration = 0.95;
  const now = ctx.currentTime;

  // Sub bass primary sine wave
  const oscSub = ctx.createOscillator();
  oscSub.type = "sine";
  oscSub.frequency.setValueAtTime(145, now);
  oscSub.frequency.exponentialRampToValueAtTime(58, now + 0.08);
  oscSub.frequency.exponentialRampToValueAtTime(32, now + duration);

  // Punch triangle harmonic for presence
  const oscPunch = ctx.createOscillator();
  oscPunch.type = "triangle";
  oscPunch.frequency.setValueAtTime(110, now);
  oscPunch.frequency.exponentialRampToValueAtTime(45, now + 0.15);

  const gainSub = ctx.createGain();
  gainSub.gain.setValueAtTime(0.001, now);
  gainSub.gain.linearRampToValueAtTime(vol * 1.0, now + 0.015);
  gainSub.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const gainPunch = ctx.createGain();
  gainPunch.gain.setValueAtTime(0.001, now);
  gainPunch.gain.linearRampToValueAtTime(vol * 0.4, now + 0.01);
  gainPunch.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  oscSub.connect(gainSub);
  oscPunch.connect(gainPunch);
  gainSub.connect(ctx.destination);
  gainPunch.connect(ctx.destination);

  oscSub.start(now);
  oscPunch.start(now);
  oscSub.stop(now + duration);
  oscPunch.stop(now + 0.2);
}

/**
 * Synthesizes bright metallic ding chime.
 */
function synthesizeDing(ctx: AudioContext, vol: number) {
  const duration = 0.65;
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(1760, now); // A6

  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(2637, now); // E7 harmonic

  const gain1 = ctx.createGain();
  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.linearRampToValueAtTime(vol * 0.7, now + 0.004);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.001, now);
  gain2.gain.linearRampToValueAtTime(vol * 0.35, now + 0.004);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);

  osc1.connect(gain1);
  osc2.connect(gain2);
  gain1.connect(ctx.destination);
  gain2.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration);
  osc2.stop(now + duration);
}

/**
 * Synthesizes cheerful bubble/pop chirp for emojis and kinetic tags.
 */
function synthesizePop(ctx: AudioContext, vol: number) {
  const duration = 0.07;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(380, now);
  osc.frequency.exponentialRampToValueAtTime(1150, now + 0.038);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(vol * 0.85, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * Synthesizes cash register ka-ching (two high bell pings + mechanical slide).
 */
function synthesizeCash(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;

  // Ping 1
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(1320, now);
  const gain1 = ctx.createGain();
  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.linearRampToValueAtTime(vol * 0.6, now + 0.005);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.4);

  // Ping 2 (higher, offset by 70ms)
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(2093, now + 0.07); // C7
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.001, now + 0.07);
  gain2.gain.linearRampToValueAtTime(vol * 0.75, now + 0.075);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.07);
  osc2.stop(now + 0.55);

  // Mechanical register ratchet click
  const oscClick = ctx.createOscillator();
  oscClick.type = "triangle";
  oscClick.frequency.setValueAtTime(600, now + 0.14);
  oscClick.frequency.exponentialRampToValueAtTime(200, now + 0.22);
  const gainClick = ctx.createGain();
  gainClick.gain.setValueAtTime(0.001, now + 0.14);
  gainClick.gain.linearRampToValueAtTime(vol * 0.4, now + 0.145);
  gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
  oscClick.connect(gainClick);
  gainClick.connect(ctx.destination);
  oscClick.start(now + 0.14);
  oscClick.stop(now + 0.25);
}

/**
 * Synthesizes digital glitch artifact stutter.
 */
function synthesizeGlitch(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;
  const frequencies = [880, 440, 1320, 220];

  frequencies.forEach((freq, idx) => {
    const startT = now + idx * 0.035;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, startT);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, startT);
    gain.gain.linearRampToValueAtTime(vol * 0.35, startT + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startT);
    osc.stop(startT + 0.035);
  });
}

/**
 * Synthesizes vintage mechanical tape deck solenoid click.
 */
function synthesizeVhsTapeClick(ctx: AudioContext, vol: number) {
  const now = ctx.currentTime;

  // Primary mechanical click
  const osc1 = ctx.createOscillator();
  osc1.type = "square";
  osc1.frequency.setValueAtTime(340, now);
  osc1.frequency.exponentialRampToValueAtTime(60, now + 0.035);

  const gain1 = ctx.createGain();
  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.linearRampToValueAtTime(vol * 0.6, now + 0.003);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.05);

  // Secondary engagement solenoid click (40ms later)
  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(180, now + 0.04);
  osc2.frequency.exponentialRampToValueAtTime(45, now + 0.09);

  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.001, now + 0.04);
  gain2.gain.linearRampToValueAtTime(vol * 0.45, now + 0.045);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.04);
  osc2.stop(now + 0.12);
}

/**
 * Primary SSR-safe entry point to trigger procedural SFX cues.
 */
export function playSFX(cue: SFXCue, volume: number = 0.5, muted: boolean = false): void {
  if (muted || volume <= 0) return;
  if (typeof window === "undefined") return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const effectiveVol = Math.max(0, Math.min(1, volume));

  try {
    switch (cue) {
      case "whoosh":
        synthesizeWhoosh(ctx, effectiveVol);
        break;
      case "boom":
        synthesizeBoom(ctx, effectiveVol);
        break;
      case "ding":
        synthesizeDing(ctx, effectiveVol);
        break;
      case "pop":
        synthesizePop(ctx, effectiveVol);
        break;
      case "cash":
        synthesizeCash(ctx, effectiveVol);
        break;
      case "glitch":
        synthesizeGlitch(ctx, effectiveVol);
        break;
      case "vhsTapeClick":
        synthesizeVhsTapeClick(ctx, effectiveVol);
        break;
    }
  } catch (err) {
    console.warn("SFX synthesis notice:", err);
  }
}
