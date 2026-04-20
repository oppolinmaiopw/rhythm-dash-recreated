// Tiny Web Audio synth for an original chiptune-style loop and SFX.
// No copyrighted music — sequenced from scratch.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let loopTimer: number | null = null;
let isMuted = false;
let musicVolume = 0.35;
let sfxVolume = 0.5;
let masterVolume = 0.7;

const MUTE_KEY = "cubefall-muted";
const MVOL_KEY = "cubefall-music-vol";
const SVOL_KEY = "cubefall-sfx-vol";

if (typeof window !== "undefined") {
  isMuted = localStorage.getItem(MUTE_KEY) === "1";
  const mv = parseFloat(localStorage.getItem(MVOL_KEY) ?? "");
  const sv = parseFloat(localStorage.getItem(SVOL_KEY) ?? "");
  if (!Number.isNaN(mv)) musicVolume = mv;
  if (!Number.isNaN(sv)) sfxVolume = sv;
}

function ensureCtx() {
  if (ctx) return ctx;
  const Ctor =
    (window as unknown as { AudioContext: typeof AudioContext }).AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new Ctor();
  masterGain = ctx.createGain();
  masterGain.gain.value = isMuted ? 0 : masterVolume;
  masterGain.connect(ctx.destination);
  musicGain = ctx.createGain();
  musicGain.gain.value = musicVolume;
  musicGain.connect(masterGain);
  sfxGain = ctx.createGain();
  sfxGain.gain.value = sfxVolume;
  sfxGain.connect(masterGain);
  return ctx;
}

export function unlockAudio() {
  const c = ensureCtx();
  if (c.state === "suspended") void c.resume();
}

export function setMuted(m: boolean) {
  isMuted = m;
  if (typeof window !== "undefined") localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  if (masterGain && ctx) {
    masterGain.gain.setTargetAtTime(m ? 0 : masterVolume, ctx.currentTime, 0.05);
  }
}
export function getMuted() {
  return isMuted;
}

export function setMusicVolume(v: number) {
  musicVolume = Math.max(0, Math.min(1, v));
  if (typeof window !== "undefined") localStorage.setItem(MVOL_KEY, String(musicVolume));
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(musicVolume, ctx.currentTime, 0.05);
}
export function getMusicVolume() { return musicVolume; }

export function setSfxVolume(v: number) {
  sfxVolume = Math.max(0, Math.min(1, v));
  if (typeof window !== "undefined") localStorage.setItem(SVOL_KEY, String(sfxVolume));
  if (sfxGain && ctx) sfxGain.gain.setTargetAtTime(sfxVolume, ctx.currentTime, 0.05);
}
export function getSfxVolume() { return sfxVolume; }

function note(freq: number, time: number, dur: number, type: OscillatorType, gainVal: number, dest: AudioNode) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(gainVal, time + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  o.connect(g).connect(dest);
  o.start(time);
  o.stop(time + dur + 0.05);
}

function noiseBurst(time: number, dur: number, gainVal: number, dest: AudioNode) {
  if (!ctx) return;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gainVal, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1200;
  src.connect(hp).connect(g).connect(dest);
  src.start(time);
  src.stop(time + dur);
}

const BASE_FREQS: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

// Synthwave-flavored loops, 16 steps. Lead is gentle pulse; bass walks; pad on downbeats.
const LEAD_PATTERNS: Record<string, (string | null)[]> = {
  pulse: ["E4", null, "G4", null, "B4", null, "A4", "G4", "E4", null, "G4", "B4", "D5", null, "B4", "A4"],
  rush:  ["A3", "E4", "A4", "E4", "C5", "E4", "B4", "G4", "A3", "E4", "A4", "G4", "F4", "E4", "D4", "C4"],
  storm: ["E4", "G4", "B4", "E5", "D5", "B4", "G4", "E4", "F4", "A4", "C5", "E5", "D5", "B4", "A4", "F4"],
};
const BASS_PATTERNS: Record<string, (string | null)[]> = {
  pulse: ["E2", null, "E2", null, "G2", null, "E2", null, "A2", null, "A2", null, "D2", null, "G2", null],
  rush:  ["A2", null, "A2", "E2", "C3", null, "G2", "E2", "A2", null, "A2", "E2", "F2", null, "G2", "E2"],
  storm: ["E2", "E2", "G2", "E2", "A2", "A2", "C3", "A2", "F2", "F2", "A2", "F2", "D2", "D2", "G2", "G2"],
};
const PAD_PATTERNS: Record<string, (string | null)[]> = {
  pulse: ["E3", null, null, null, "G3", null, null, null, "A3", null, null, null, "D3", null, null, null],
  rush:  ["A3", null, null, null, "C4", null, null, null, "F3", null, null, null, "G3", null, null, null],
  storm: ["E3", null, null, null, "A3", null, null, null, "F3", null, null, null, "G3", null, null, null],
};

let currentTrack: keyof typeof LEAD_PATTERNS = "pulse";
let bpm = 140;
let nextStepAt = 0;
let stepIndex = 0;

function scheduleStep() {
  if (!ctx || !musicGain) return;
  const stepDur = 60 / bpm / 2; // 8th notes
  while (nextStepAt < ctx.currentTime + 0.2) {
    const lead = LEAD_PATTERNS[currentTrack][stepIndex % 16];
    const bass = BASS_PATTERNS[currentTrack][stepIndex % 16];
    const pad = PAD_PATTERNS[currentTrack][stepIndex % 16];
    if (lead) note(BASE_FREQS[lead], nextStepAt, stepDur * 0.9, "square", 0.11, musicGain);
    if (bass) note(BASE_FREQS[bass], nextStepAt, stepDur * 0.95, "sawtooth", 0.16, musicGain);
    if (pad) {
      // pad chord shimmer
      note(BASE_FREQS[pad], nextStepAt, stepDur * 4, "triangle", 0.05, musicGain);
      const fifth = BASE_FREQS[pad] * 1.5;
      note(fifth, nextStepAt, stepDur * 4, "triangle", 0.04, musicGain);
    }
    // kick on every other step
    if (stepIndex % 2 === 0) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(140, nextStepAt);
      o.frequency.exponentialRampToValueAtTime(45, nextStepAt + 0.12);
      g.gain.setValueAtTime(0.5, nextStepAt);
      g.gain.exponentialRampToValueAtTime(0.001, nextStepAt + 0.18);
      o.connect(g).connect(musicGain);
      o.start(nextStepAt);
      o.stop(nextStepAt + 0.2);
    }
    // hat
    if (stepIndex % 2 === 1) noiseBurst(nextStepAt, 0.04, 0.08, musicGain);
    // snare on backbeats
    if (stepIndex % 8 === 4) noiseBurst(nextStepAt, 0.12, 0.18, musicGain);
    stepIndex++;
    nextStepAt += stepDur;
  }
}

export function startMusic(track: keyof typeof LEAD_PATTERNS, trackBpm: number) {
  unlockAudio();
  if (!ctx) return;
  currentTrack = track;
  bpm = trackBpm;
  stepIndex = 0;
  nextStepAt = ctx.currentTime + 0.05;
  if (loopTimer) window.clearInterval(loopTimer);
  loopTimer = window.setInterval(scheduleStep, 50);
}

export function stopMusic() {
  if (loopTimer) {
    window.clearInterval(loopTimer);
    loopTimer = null;
  }
}

export function sfxJump() {
  if (!ctx || !sfxGain) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "square";
  o.frequency.setValueAtTime(520, t);
  o.frequency.exponentialRampToValueAtTime(880, t + 0.08);
  g.gain.setValueAtTime(0.2, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  o.connect(g).connect(sfxGain);
  o.start(t);
  o.stop(t + 0.15);
}

export function sfxCrash() {
  if (!ctx || !sfxGain) return;
  const t = ctx.currentTime;
  noiseBurst(t, 0.35, 0.5, sfxGain);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(200, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.4);
  g.gain.setValueAtTime(0.35, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  o.connect(g).connect(sfxGain);
  o.start(t);
  o.stop(t + 0.5);
}

export function sfxPad() {
  if (!ctx || !sfxGain) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(440, t);
  o.frequency.exponentialRampToValueAtTime(1200, t + 0.18);
  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  o.connect(g).connect(sfxGain);
  o.start(t);
  o.stop(t + 0.25);
}

export function sfxPortal() {
  if (!ctx || !sfxGain) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 4; i++) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(300 + i * 200, t + i * 0.03);
    g.gain.setValueAtTime(0.15, t + i * 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.03 + 0.15);
    o.connect(g).connect(sfxGain);
    o.start(t + i * 0.03);
    o.stop(t + i * 0.03 + 0.18);
  }
}

export function sfxVictory() {
  if (!ctx || !sfxGain) return;
  const t = ctx.currentTime;
  // arpeggio up
  const seq = [BASE_FREQS.C4, BASE_FREQS.E4, BASE_FREQS.G4, BASE_FREQS.C5, BASE_FREQS.E5, BASE_FREQS.G5];
  seq.forEach((f, i) => {
    const o = ctx!.createOscillator();
    const g = ctx!.createGain();
    o.type = "square";
    o.frequency.value = f;
    g.gain.setValueAtTime(0, t + i * 0.08);
    g.gain.linearRampToValueAtTime(0.22, t + i * 0.08 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);
    o.connect(g).connect(sfxGain!);
    o.start(t + i * 0.08);
    o.stop(t + i * 0.08 + 0.3);
  });
}

export function sfxClick() {
  if (!ctx || !sfxGain) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "square";
  o.frequency.value = 720;
  g.gain.setValueAtTime(0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  o.connect(g).connect(sfxGain);
  o.start(t);
  o.stop(t + 0.06);
}
