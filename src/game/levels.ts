// Level definitions for the runner.
// Obstacle types:
//  - "spike": triangular spike (lethal on contact)
//  - "block": square block to land on (lethal on side hit)
//  - "tall": tall block (2 high)
//  - "spike3": three spikes in a row
//  - "platform": floating platform at given y offset (in tiles above ground)
//  - "portal-grav": flips gravity
//  - "portal-ship": (reserved, not used in v1)
//  - "pad": yellow jump pad (extra-high jump)
// "x" is in tiles (TILE = 40 px). Levels auto-loop their last 80 tiles for endless.

export type ObstacleType =
  | "spike"
  | "block"
  | "tall"
  | "spike3"
  | "platform"
  | "portal-grav"
  | "pad";

export interface Obstacle {
  x: number;
  type: ObstacleType;
  y?: number; // for platform: tiles above ground
}

export interface LevelDef {
  id: string;
  name: string;
  difficulty: "Easy" | "Normal" | "Hard";
  bg: string; // css gradient var
  accent: string; // hex-ish or var
  bpm: number;
  length: number; // total tiles
  obstacles: Obstacle[];
}

const easy: Obstacle[] = [
  { x: 18, type: "spike" },
  { x: 26, type: "spike" },
  { x: 34, type: "spike" },
  { x: 44, type: "block" },
  { x: 52, type: "spike" },
  { x: 60, type: "block" },
  { x: 61, type: "block" },
  { x: 70, type: "spike" },
  { x: 78, type: "spike3" },
  { x: 90, type: "pad" },
  { x: 96, type: "tall" },
  { x: 108, type: "spike" },
  { x: 116, type: "spike" },
  { x: 124, type: "block" },
  { x: 132, type: "spike3" },
  { x: 144, type: "spike" },
  { x: 152, type: "spike" },
  { x: 162, type: "platform", y: 3 },
  { x: 170, type: "spike" },
  { x: 180, type: "spike" },
  { x: 190, type: "block" },
  { x: 198, type: "spike" },
  { x: 210, type: "spike3" },
  { x: 222, type: "spike" },
  { x: 232, type: "block" },
  { x: 240, type: "spike" },
];

const normal: Obstacle[] = [
  { x: 16, type: "spike" },
  { x: 22, type: "spike" },
  { x: 30, type: "spike3" },
  { x: 42, type: "block" },
  { x: 43, type: "block" },
  { x: 52, type: "spike" },
  { x: 58, type: "tall" },
  { x: 66, type: "spike" },
  { x: 72, type: "spike" },
  { x: 80, type: "pad" },
  { x: 88, type: "platform", y: 4 },
  { x: 96, type: "spike3" },
  { x: 108, type: "spike" },
  { x: 114, type: "spike" },
  { x: 120, type: "spike" },
  { x: 130, type: "block" },
  { x: 131, type: "block" },
  { x: 138, type: "spike" },
  { x: 146, type: "spike3" },
  { x: 158, type: "tall" },
  { x: 166, type: "spike" },
  { x: 172, type: "spike" },
  { x: 180, type: "pad" },
  { x: 188, type: "platform", y: 5 },
  { x: 198, type: "spike3" },
  { x: 210, type: "spike" },
  { x: 216, type: "spike" },
  { x: 224, type: "block" },
  { x: 232, type: "spike3" },
  { x: 244, type: "spike" },
  { x: 252, type: "tall" },
  { x: 260, type: "spike" },
];

const hard: Obstacle[] = [
  { x: 14, type: "spike" },
  { x: 20, type: "spike" },
  { x: 26, type: "spike" },
  { x: 34, type: "spike3" },
  { x: 46, type: "tall" },
  { x: 54, type: "spike" },
  { x: 60, type: "spike" },
  { x: 66, type: "spike3" },
  { x: 78, type: "block" },
  { x: 79, type: "block" },
  { x: 86, type: "spike" },
  { x: 92, type: "spike" },
  { x: 98, type: "spike" },
  { x: 106, type: "pad" },
  { x: 114, type: "tall" },
  { x: 122, type: "spike3" },
  { x: 134, type: "spike" },
  { x: 140, type: "spike" },
  { x: 146, type: "spike" },
  { x: 152, type: "spike" },
  { x: 162, type: "block" },
  { x: 170, type: "spike3" },
  { x: 182, type: "platform", y: 4 },
  { x: 190, type: "spike3" },
  { x: 202, type: "tall" },
  { x: 210, type: "spike" },
  { x: 216, type: "spike" },
  { x: 222, type: "spike3" },
  { x: 234, type: "pad" },
  { x: 242, type: "tall" },
  { x: 250, type: "spike" },
  { x: 256, type: "spike" },
  { x: 262, type: "spike3" },
  { x: 274, type: "spike" },
  { x: 280, type: "spike" },
  { x: 288, type: "tall" },
];

export const LEVELS: LevelDef[] = [
  {
    id: "stereo-pulse",
    name: "Stereo Pulse",
    difficulty: "Easy",
    bg: "var(--gradient-bg-1)",
    accent: "var(--neon-pink)",
    bpm: 140,
    length: 260,
    obstacles: easy,
  },
  {
    id: "cyber-rush",
    name: "Cyber Rush",
    difficulty: "Normal",
    bg: "var(--gradient-bg-2)",
    accent: "var(--neon-cyan)",
    bpm: 155,
    length: 280,
    obstacles: normal,
  },
  {
    id: "voltage-storm",
    name: "Voltage Storm",
    difficulty: "Hard",
    bg: "var(--gradient-bg-3)",
    accent: "var(--neon-green)",
    bpm: 170,
    length: 310,
    obstacles: hard,
  },
];

export const ENDLESS_BG = "var(--gradient-bg-endless)";
export const ENDLESS_ACCENT = "var(--neon-pink)";

// Procedural endless chunks. Each chunk is a list of obstacles relative to chunk start.
const CHUNK_LEN = 24;
const chunks: Obstacle[][] = [
  [{ x: 6, type: "spike" }, { x: 14, type: "spike" }],
  [{ x: 4, type: "spike" }, { x: 10, type: "spike3" }, { x: 20, type: "spike" }],
  [{ x: 6, type: "block" }, { x: 7, type: "block" }, { x: 16, type: "spike" }],
  [{ x: 4, type: "tall" }, { x: 14, type: "spike" }, { x: 20, type: "spike" }],
  [{ x: 6, type: "pad" }, { x: 14, type: "tall" }],
  [{ x: 4, type: "spike3" }, { x: 16, type: "spike3" }],
  [{ x: 6, type: "platform", y: 4 }, { x: 14, type: "spike" }],
  [{ x: 4, type: "spike" }, { x: 10, type: "block" }, { x: 18, type: "spike3" }],
];

export function generateEndlessObstacles(seed: number, chunkCount: number): Obstacle[] {
  // Deterministic LCG so increasing seed gives a stable run.
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out: Obstacle[] = [];
  let cursor = 12; // initial empty runway
  for (let i = 0; i < chunkCount; i++) {
    const idx = Math.floor(rand() * chunks.length);
    const difficultyBoost = Math.min(0.6, i * 0.02);
    // occasionally double up at higher difficulty
    const chunk = chunks[idx];
    for (const o of chunk) {
      out.push({ ...o, x: o.x + cursor });
    }
    if (rand() < difficultyBoost) {
      const extra = chunks[Math.floor(rand() * chunks.length)];
      for (const o of extra) {
        out.push({ ...o, x: o.x + cursor + 2 });
      }
    }
    cursor += CHUNK_LEN;
  }
  return out;
}
