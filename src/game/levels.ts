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
  | "pad"
  | "portal-cube"
  | "portal-ship"
  | "portal-ball"
  | "portal-ufo"
  | "portal-wave"
  | "portal-robot"
  | "portal-spider"
  | "portal-swing";

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
  { x: 116, type: "portal-ship" },
  { x: 124, type: "block" },
  { x: 132, type: "spike3" },
  { x: 144, type: "spike" },
  { x: 152, type: "spike" },
  { x: 160, type: "portal-cube" },
  { x: 170, type: "spike" },
  { x: 180, type: "spike" },
  { x: 190, type: "block" },
  { x: 198, type: "spike" },
  { x: 206, type: "portal-ball" },
  { x: 216, type: "spike3" },
  { x: 226, type: "portal-cube" },
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
  { x: 66, type: "portal-ufo" },
  { x: 76, type: "spike" },
  { x: 84, type: "spike" },
  { x: 92, type: "spike" },
  { x: 100, type: "portal-cube" },
  { x: 108, type: "spike" },
  { x: 114, type: "spike" },
  { x: 120, type: "spike" },
  { x: 130, type: "block" },
  { x: 131, type: "block" },
  { x: 138, type: "spike" },
  { x: 146, type: "portal-wave" },
  { x: 156, type: "spike" },
  { x: 162, type: "spike" },
  { x: 170, type: "spike" },
  { x: 178, type: "portal-cube" },
  { x: 186, type: "pad" },
  { x: 196, type: "spike3" },
  { x: 210, type: "spike" },
  { x: 216, type: "portal-ball" },
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
  { x: 54, type: "portal-ship" },
  { x: 62, type: "spike" },
  { x: 70, type: "spike" },
  { x: 78, type: "block" },
  { x: 86, type: "portal-cube" },
  { x: 94, type: "spike" },
  { x: 100, type: "portal-spider" },
  { x: 108, type: "spike" },
  { x: 114, type: "spike" },
  { x: 122, type: "portal-cube" },
  { x: 130, type: "spike3" },
  { x: 142, type: "portal-robot" },
  { x: 150, type: "spike" },
  { x: 158, type: "tall" },
  { x: 166, type: "portal-cube" },
  { x: 174, type: "spike" },
  { x: 180, type: "spike" },
  { x: 188, type: "portal-wave" },
  { x: 196, type: "spike" },
  { x: 204, type: "spike" },
  { x: 212, type: "portal-cube" },
  { x: 222, type: "spike3" },
  { x: 234, type: "portal-swing" },
  { x: 244, type: "spike" },
  { x: 252, type: "spike" },
  { x: 260, type: "portal-cube" },
  { x: 268, type: "spike3" },
  { x: 280, type: "spike" },
  { x: 288, type: "tall" },
];

// Additional levels
const neonDrift: Obstacle[] = [
  { x: 14, type: "spike" }, { x: 22, type: "spike" }, { x: 30, type: "spike3" },
  { x: 42, type: "block" }, { x: 50, type: "spike" }, { x: 58, type: "portal-ship" },
  { x: 70, type: "spike" }, { x: 80, type: "spike" }, { x: 90, type: "portal-cube" },
  { x: 100, type: "spike3" }, { x: 114, type: "pad" }, { x: 122, type: "tall" },
  { x: 132, type: "spike" }, { x: 142, type: "portal-ball" }, { x: 152, type: "spike" },
  { x: 162, type: "block" }, { x: 170, type: "portal-cube" }, { x: 180, type: "spike3" },
  { x: 194, type: "spike" }, { x: 204, type: "portal-wave" }, { x: 214, type: "spike" },
  { x: 224, type: "spike" }, { x: 232, type: "portal-cube" }, { x: 242, type: "tall" },
  { x: 252, type: "spike" }, { x: 262, type: "spike3" }, { x: 276, type: "spike" },
];

const plasmaTide: Obstacle[] = [
  { x: 12, type: "spike" }, { x: 20, type: "spike" }, { x: 28, type: "spike" },
  { x: 38, type: "portal-ufo" }, { x: 48, type: "spike" }, { x: 56, type: "spike3" },
  { x: 70, type: "portal-cube" }, { x: 80, type: "tall" }, { x: 90, type: "spike" },
  { x: 98, type: "portal-wave" }, { x: 108, type: "spike" }, { x: 116, type: "spike" },
  { x: 126, type: "portal-cube" }, { x: 136, type: "spike3" }, { x: 150, type: "pad" },
  { x: 160, type: "spike" }, { x: 170, type: "portal-ship" }, { x: 182, type: "spike" },
  { x: 192, type: "spike" }, { x: 202, type: "portal-cube" }, { x: 212, type: "block" },
  { x: 220, type: "spike3" }, { x: 232, type: "spike" }, { x: 242, type: "tall" },
  { x: 252, type: "spike" }, { x: 262, type: "spike" }, { x: 272, type: "spike3" },
];

const glitchCity: Obstacle[] = [
  { x: 14, type: "spike3" }, { x: 28, type: "tall" }, { x: 38, type: "portal-spider" },
  { x: 48, type: "spike" }, { x: 56, type: "spike" }, { x: 66, type: "portal-cube" },
  { x: 76, type: "spike3" }, { x: 90, type: "portal-robot" }, { x: 100, type: "spike" },
  { x: 108, type: "tall" }, { x: 118, type: "portal-cube" }, { x: 128, type: "spike" },
  { x: 136, type: "spike3" }, { x: 150, type: "portal-ball" }, { x: 160, type: "spike" },
  { x: 170, type: "block" }, { x: 178, type: "portal-cube" }, { x: 188, type: "spike" },
  { x: 196, type: "spike" }, { x: 204, type: "portal-swing" }, { x: 216, type: "spike3" },
  { x: 230, type: "portal-cube" }, { x: 240, type: "pad" }, { x: 250, type: "tall" },
  { x: 260, type: "spike" }, { x: 270, type: "spike3" }, { x: 284, type: "spike" },
];

const laserDawn: Obstacle[] = [
  { x: 16, type: "spike" }, { x: 24, type: "spike" }, { x: 34, type: "block" },
  { x: 42, type: "spike" }, { x: 52, type: "portal-ship" }, { x: 62, type: "spike" },
  { x: 72, type: "spike3" }, { x: 86, type: "portal-cube" }, { x: 96, type: "pad" },
  { x: 106, type: "tall" }, { x: 116, type: "spike" }, { x: 124, type: "portal-wave" },
  { x: 134, type: "spike" }, { x: 144, type: "spike" }, { x: 154, type: "portal-cube" },
  { x: 164, type: "spike3" }, { x: 178, type: "spike" }, { x: 188, type: "portal-ball" },
  { x: 198, type: "spike" }, { x: 208, type: "block" }, { x: 216, type: "portal-cube" },
  { x: 226, type: "spike" }, { x: 234, type: "spike3" }, { x: 248, type: "tall" },
  { x: 258, type: "spike" }, { x: 266, type: "spike" },
];

const vortexRun: Obstacle[] = [
  { x: 12, type: "spike" }, { x: 20, type: "spike3" }, { x: 34, type: "portal-ufo" },
  { x: 44, type: "spike" }, { x: 54, type: "tall" }, { x: 64, type: "portal-cube" },
  { x: 74, type: "spike" }, { x: 82, type: "spike3" }, { x: 96, type: "portal-ball" },
  { x: 106, type: "spike" }, { x: 116, type: "spike" }, { x: 126, type: "portal-cube" },
  { x: 136, type: "pad" }, { x: 146, type: "tall" }, { x: 156, type: "portal-wave" },
  { x: 166, type: "spike" }, { x: 176, type: "spike" }, { x: 186, type: "spike3" },
  { x: 200, type: "portal-cube" }, { x: 210, type: "block" }, { x: 218, type: "spike" },
  { x: 228, type: "portal-spider" }, { x: 238, type: "spike" }, { x: 248, type: "spike3" },
  { x: 262, type: "spike" }, { x: 272, type: "tall" },
];

const hyperLoop: Obstacle[] = [
  { x: 12, type: "spike" }, { x: 18, type: "spike" }, { x: 24, type: "spike" },
  { x: 32, type: "spike3" }, { x: 46, type: "portal-ship" }, { x: 56, type: "spike" },
  { x: 66, type: "spike" }, { x: 76, type: "portal-cube" }, { x: 86, type: "tall" },
  { x: 96, type: "spike3" }, { x: 110, type: "portal-ball" }, { x: 120, type: "spike" },
  { x: 130, type: "spike" }, { x: 140, type: "portal-cube" }, { x: 150, type: "pad" },
  { x: 160, type: "spike" }, { x: 170, type: "portal-ufo" }, { x: 180, type: "spike" },
  { x: 190, type: "spike3" }, { x: 204, type: "portal-cube" }, { x: 214, type: "spike" },
  { x: 224, type: "block" }, { x: 232, type: "portal-wave" }, { x: 242, type: "spike" },
  { x: 252, type: "spike" }, { x: 262, type: "spike3" }, { x: 276, type: "tall" },
  { x: 286, type: "spike" }, { x: 296, type: "spike" },
];

const finalBoss: Obstacle[] = [
  { x: 10, type: "spike" }, { x: 16, type: "spike" }, { x: 22, type: "spike" },
  { x: 30, type: "spike3" }, { x: 42, type: "portal-ship" }, { x: 52, type: "spike" },
  { x: 60, type: "spike" }, { x: 70, type: "portal-spider" }, { x: 80, type: "spike" },
  { x: 88, type: "tall" }, { x: 98, type: "portal-cube" }, { x: 106, type: "spike" },
  { x: 114, type: "spike3" }, { x: 128, type: "portal-robot" }, { x: 138, type: "spike" },
  { x: 146, type: "tall" }, { x: 156, type: "portal-cube" }, { x: 166, type: "spike" },
  { x: 174, type: "portal-wave" }, { x: 184, type: "spike" }, { x: 194, type: "spike" },
  { x: 204, type: "portal-cube" }, { x: 214, type: "spike3" }, { x: 228, type: "portal-swing" },
  { x: 238, type: "spike" }, { x: 246, type: "spike" }, { x: 254, type: "portal-cube" },
  { x: 262, type: "spike3" }, { x: 276, type: "portal-ball" }, { x: 286, type: "spike" },
  { x: 294, type: "spike" }, { x: 304, type: "portal-cube" }, { x: 312, type: "spike3" },
  { x: 326, type: "tall" }, { x: 336, type: "spike" }, { x: 344, type: "spike" },
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
  {
    id: "neon-drift",
    name: "Neon Drift",
    difficulty: "Easy",
    bg: "var(--gradient-bg-2)",
    accent: "var(--neon-cyan)",
    bpm: 138,
    length: 290,
    obstacles: neonDrift,
  },
  {
    id: "plasma-tide",
    name: "Plasma Tide",
    difficulty: "Normal",
    bg: "var(--gradient-bg-1)",
    accent: "var(--neon-pink)",
    bpm: 150,
    length: 290,
    obstacles: plasmaTide,
  },
  {
    id: "glitch-city",
    name: "Glitch City",
    difficulty: "Hard",
    bg: "var(--gradient-bg-3)",
    accent: "var(--neon-green)",
    bpm: 165,
    length: 300,
    obstacles: glitchCity,
  },
  {
    id: "laser-dawn",
    name: "Laser Dawn",
    difficulty: "Normal",
    bg: "var(--gradient-bg-endless)",
    accent: "var(--neon-pink)",
    bpm: 148,
    length: 280,
    obstacles: laserDawn,
  },
  {
    id: "vortex-run",
    name: "Vortex Run",
    difficulty: "Hard",
    bg: "var(--gradient-bg-2)",
    accent: "var(--neon-cyan)",
    bpm: 162,
    length: 290,
    obstacles: vortexRun,
  },
  {
    id: "hyper-loop",
    name: "Hyper Loop",
    difficulty: "Hard",
    bg: "var(--gradient-bg-1)",
    accent: "var(--neon-pink)",
    bpm: 172,
    length: 310,
    obstacles: hyperLoop,
  },
  {
    id: "final-boss",
    name: "Final Boss",
    difficulty: "Hard",
    bg: "var(--gradient-bg-3)",
    accent: "var(--neon-green)",
    bpm: 180,
    length: 360,
    obstacles: finalBoss,
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

export type EndlessMode =
  | "cube"
  | "ship"
  | "ball"
  | "ufo"
  | "wave"
  | "robot"
  | "spider"
  | "swing"
  | "mixed";

export function generateEndlessObstacles(seed: number, chunkCount: number, startMode: EndlessMode = "mixed"): Obstacle[] {
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
      // In single-mode runs, strip random portals from chunks so the player stays in their chosen mode.
      if (startMode !== "mixed" && o.type.startsWith("portal-")) continue;
      out.push({ ...o, x: o.x + cursor });
    }
    if (rand() < difficultyBoost) {
      const extra = chunks[Math.floor(rand() * chunks.length)];
      for (const o of extra) {
        if (startMode !== "mixed" && o.type.startsWith("portal-")) continue;
        out.push({ ...o, x: o.x + cursor + 2 });
      }
    }
    cursor += CHUNK_LEN;
  }
  return out;
}
