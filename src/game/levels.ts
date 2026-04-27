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

// Decoration themes drawn in the background per level.
export type DecorationTheme =
  | "mountains"
  | "city"
  | "stars"
  | "waves"
  | "circuit"
  | "pyramids"
  | "rain"
  | "trees"
  | "crystals"
  | "skull";

export interface LevelDef {
  id: string;
  name: string;
  difficulty: "Easy" | "Normal" | "Hard";
  difficultyStars: 1 | 2 | 3; // intrinsic rating shown on the card
  bg: string; // css gradient var
  accent: string; // hex-ish or var
  bpm: number;
  length: number; // total tiles
  obstacles: Obstacle[];
  decoration: DecorationTheme;
}

const easy: Obstacle[] = [
  { x: 14, type: "spike" },
  { x: 18, type: "spike" },
  { x: 24, type: "spike" },
  { x: 30, type: "spike3" },
  { x: 42, type: "block" },
  { x: 48, type: "spike" },
  { x: 54, type: "spike" },
  { x: 60, type: "block" },
  { x: 61, type: "block" },
  { x: 68, type: "spike" },
  { x: 72, type: "spike" },
  { x: 80, type: "spike3" },
  { x: 92, type: "pad" },
  { x: 98, type: "tall" },
  { x: 106, type: "spike" },
  { x: 112, type: "spike" },
  { x: 118, type: "portal-ship" },
  { x: 126, type: "block" },
  { x: 130, type: "spike" },
  { x: 136, type: "spike3" },
  { x: 148, type: "spike" },
  { x: 154, type: "spike" },
  { x: 160, type: "portal-cube" },
  { x: 168, type: "spike" },
  { x: 174, type: "spike" },
  { x: 180, type: "spike3" },
  { x: 192, type: "block" },
  { x: 198, type: "spike" },
  { x: 204, type: "pad" },
  { x: 210, type: "tall" },
  { x: 218, type: "portal-ball" },
  { x: 226, type: "spike" },
  { x: 232, type: "spike3" },
  { x: 246, type: "portal-cube" },
  { x: 254, type: "block" },
  { x: 258, type: "spike" },
  { x: 264, type: "spike" },
  { x: 272, type: "spike3" },
  { x: 286, type: "spike" },
  { x: 294, type: "tall" },
  { x: 302, type: "spike" },
  { x: 310, type: "spike3" },
];

const normal: Obstacle[] = [
  { x: 12, type: "spike" },
  { x: 18, type: "spike" },
  { x: 24, type: "spike" },
  { x: 30, type: "spike3" },
  { x: 42, type: "block" },
  { x: 43, type: "block" },
  { x: 50, type: "spike" },
  { x: 56, type: "tall" },
  { x: 64, type: "spike" },
  { x: 70, type: "portal-ufo" },
  { x: 80, type: "spike" },
  { x: 86, type: "spike" },
  { x: 92, type: "spike" },
  { x: 100, type: "portal-cube" },
  { x: 108, type: "spike" },
  { x: 114, type: "spike3" },
  { x: 126, type: "block" },
  { x: 127, type: "block" },
  { x: 134, type: "spike" },
  { x: 140, type: "pad" },
  { x: 146, type: "portal-wave" },
  { x: 156, type: "spike" },
  { x: 162, type: "spike" },
  { x: 170, type: "spike" },
  { x: 178, type: "portal-cube" },
  { x: 186, type: "pad" },
  { x: 192, type: "tall" },
  { x: 200, type: "spike3" },
  { x: 214, type: "spike" },
  { x: 220, type: "portal-ball" },
  { x: 228, type: "block" },
  { x: 232, type: "spike" },
  { x: 238, type: "spike3" },
  { x: 250, type: "spike" },
  { x: 256, type: "tall" },
  { x: 264, type: "portal-cube" },
  { x: 272, type: "spike" },
  { x: 278, type: "spike3" },
  { x: 292, type: "block" },
  { x: 298, type: "spike" },
  { x: 304, type: "spike" },
  { x: 312, type: "pad" },
  { x: 320, type: "spike3" },
  { x: 332, type: "tall" },
  { x: 340, type: "spike" },
];

const hard: Obstacle[] = [
  { x: 10, type: "spike" },
  { x: 14, type: "spike" },
  { x: 18, type: "spike" },
  { x: 22, type: "spike" },
  { x: 30, type: "spike3" },
  { x: 42, type: "tall" },
  { x: 50, type: "portal-ship" },
  { x: 58, type: "spike" },
  { x: 64, type: "spike" },
  { x: 70, type: "spike" },
  { x: 78, type: "block" },
  { x: 84, type: "spike" },
  { x: 90, type: "portal-cube" },
  { x: 96, type: "spike" },
  { x: 100, type: "spike" },
  { x: 106, type: "portal-spider" },
  { x: 114, type: "spike" },
  { x: 118, type: "spike" },
  { x: 124, type: "portal-cube" },
  { x: 130, type: "spike3" },
  { x: 142, type: "portal-robot" },
  { x: 150, type: "spike" },
  { x: 156, type: "spike" },
  { x: 162, type: "tall" },
  { x: 168, type: "portal-cube" },
  { x: 174, type: "spike" },
  { x: 180, type: "spike" },
  { x: 186, type: "spike" },
  { x: 192, type: "portal-wave" },
  { x: 200, type: "spike" },
  { x: 206, type: "spike" },
  { x: 214, type: "portal-cube" },
  { x: 222, type: "spike3" },
  { x: 234, type: "portal-swing" },
  { x: 242, type: "spike" },
  { x: 248, type: "spike" },
  { x: 254, type: "spike" },
  { x: 260, type: "portal-cube" },
  { x: 266, type: "spike3" },
  { x: 278, type: "spike" },
  { x: 284, type: "spike" },
  { x: 290, type: "tall" },
  { x: 298, type: "portal-ball" },
  { x: 306, type: "spike" },
  { x: 312, type: "spike3" },
  { x: 324, type: "portal-cube" },
  { x: 332, type: "spike" },
  { x: 338, type: "spike" },
  { x: 346, type: "tall" },
  { x: 354, type: "spike3" },
];

// Additional levels — densified
const neonDrift: Obstacle[] = [
  { x: 12, type: "spike" }, { x: 16, type: "spike" }, { x: 22, type: "spike" },
  { x: 30, type: "spike3" }, { x: 42, type: "block" }, { x: 48, type: "spike" },
  { x: 54, type: "spike" }, { x: 60, type: "portal-ship" }, { x: 70, type: "spike" },
  { x: 76, type: "spike" }, { x: 82, type: "spike" }, { x: 90, type: "portal-cube" },
  { x: 98, type: "spike3" }, { x: 112, type: "pad" }, { x: 120, type: "tall" },
  { x: 128, type: "spike" }, { x: 134, type: "spike" }, { x: 142, type: "portal-ball" },
  { x: 152, type: "spike" }, { x: 160, type: "block" }, { x: 168, type: "portal-cube" },
  { x: 176, type: "spike" }, { x: 182, type: "spike3" }, { x: 196, type: "spike" },
  { x: 204, type: "portal-wave" }, { x: 212, type: "spike" }, { x: 218, type: "spike" },
  { x: 224, type: "spike" }, { x: 232, type: "portal-cube" }, { x: 240, type: "tall" },
  { x: 248, type: "spike" }, { x: 254, type: "spike" }, { x: 262, type: "spike3" },
  { x: 276, type: "spike" }, { x: 284, type: "pad" }, { x: 292, type: "tall" },
  { x: 300, type: "spike" }, { x: 308, type: "spike3" }, { x: 322, type: "block" },
  { x: 330, type: "spike" },
];

const plasmaTide: Obstacle[] = [
  { x: 10, type: "spike" }, { x: 14, type: "spike" }, { x: 20, type: "spike" },
  { x: 26, type: "spike" }, { x: 34, type: "portal-ufo" }, { x: 44, type: "spike" },
  { x: 50, type: "spike" }, { x: 56, type: "spike3" }, { x: 70, type: "portal-cube" },
  { x: 78, type: "tall" }, { x: 86, type: "spike" }, { x: 92, type: "spike" },
  { x: 100, type: "portal-wave" }, { x: 108, type: "spike" }, { x: 114, type: "spike" },
  { x: 120, type: "spike" }, { x: 128, type: "portal-cube" }, { x: 136, type: "spike3" },
  { x: 150, type: "pad" }, { x: 158, type: "spike" }, { x: 164, type: "spike" },
  { x: 172, type: "portal-ship" }, { x: 182, type: "spike" }, { x: 188, type: "spike" },
  { x: 194, type: "spike" }, { x: 202, type: "portal-cube" }, { x: 212, type: "block" },
  { x: 218, type: "spike" }, { x: 224, type: "spike3" }, { x: 238, type: "spike" },
  { x: 244, type: "tall" }, { x: 252, type: "spike" }, { x: 258, type: "spike" },
  { x: 266, type: "spike3" }, { x: 280, type: "portal-ball" }, { x: 288, type: "spike" },
  { x: 294, type: "spike" }, { x: 302, type: "tall" }, { x: 310, type: "spike3" },
  { x: 322, type: "spike" }, { x: 330, type: "pad" },
];

const glitchCity: Obstacle[] = [
  { x: 12, type: "spike3" }, { x: 26, type: "tall" }, { x: 36, type: "portal-spider" },
  { x: 44, type: "spike" }, { x: 50, type: "spike" }, { x: 56, type: "spike" },
  { x: 64, type: "portal-cube" }, { x: 72, type: "spike3" }, { x: 86, type: "portal-robot" },
  { x: 94, type: "spike" }, { x: 100, type: "spike" }, { x: 106, type: "tall" },
  { x: 114, type: "portal-cube" }, { x: 122, type: "spike" }, { x: 128, type: "spike" },
  { x: 134, type: "spike3" }, { x: 148, type: "portal-ball" }, { x: 156, type: "spike" },
  { x: 162, type: "spike" }, { x: 168, type: "block" }, { x: 174, type: "portal-cube" },
  { x: 182, type: "spike" }, { x: 188, type: "spike" }, { x: 194, type: "spike" },
  { x: 200, type: "portal-swing" }, { x: 210, type: "spike3" }, { x: 224, type: "portal-cube" },
  { x: 232, type: "pad" }, { x: 240, type: "tall" }, { x: 248, type: "spike" },
  { x: 254, type: "spike3" }, { x: 268, type: "spike" }, { x: 274, type: "portal-spider" },
  { x: 282, type: "spike" }, { x: 288, type: "spike" }, { x: 296, type: "tall" },
  { x: 304, type: "portal-cube" }, { x: 312, type: "spike3" }, { x: 326, type: "spike" },
];

const laserDawn: Obstacle[] = [
  { x: 14, type: "spike" }, { x: 20, type: "spike" }, { x: 26, type: "spike" },
  { x: 34, type: "block" }, { x: 40, type: "spike" }, { x: 46, type: "spike" },
  { x: 52, type: "portal-ship" }, { x: 60, type: "spike" }, { x: 66, type: "spike" },
  { x: 72, type: "spike3" }, { x: 86, type: "portal-cube" }, { x: 94, type: "pad" },
  { x: 102, type: "tall" }, { x: 110, type: "spike" }, { x: 116, type: "spike" },
  { x: 124, type: "portal-wave" }, { x: 132, type: "spike" }, { x: 138, type: "spike" },
  { x: 144, type: "spike" }, { x: 152, type: "portal-cube" }, { x: 160, type: "spike3" },
  { x: 174, type: "spike" }, { x: 180, type: "spike" }, { x: 188, type: "portal-ball" },
  { x: 196, type: "spike" }, { x: 204, type: "block" }, { x: 212, type: "portal-cube" },
  { x: 220, type: "spike" }, { x: 226, type: "spike" }, { x: 232, type: "spike3" },
  { x: 246, type: "tall" }, { x: 254, type: "spike" }, { x: 260, type: "spike" },
  { x: 268, type: "pad" }, { x: 276, type: "spike3" }, { x: 290, type: "portal-cube" },
  { x: 298, type: "spike" }, { x: 304, type: "tall" },
];

const vortexRun: Obstacle[] = [
  { x: 10, type: "spike" }, { x: 16, type: "spike3" }, { x: 30, type: "portal-ufo" },
  { x: 40, type: "spike" }, { x: 46, type: "spike" }, { x: 52, type: "tall" },
  { x: 60, type: "portal-cube" }, { x: 68, type: "spike" }, { x: 74, type: "spike" },
  { x: 80, type: "spike3" }, { x: 94, type: "portal-ball" }, { x: 102, type: "spike" },
  { x: 108, type: "spike" }, { x: 114, type: "spike" }, { x: 122, type: "portal-cube" },
  { x: 130, type: "pad" }, { x: 138, type: "tall" }, { x: 146, type: "portal-wave" },
  { x: 154, type: "spike" }, { x: 160, type: "spike" }, { x: 168, type: "spike" },
  { x: 176, type: "spike3" }, { x: 190, type: "portal-cube" }, { x: 198, type: "block" },
  { x: 204, type: "spike" }, { x: 210, type: "spike" }, { x: 218, type: "portal-spider" },
  { x: 226, type: "spike" }, { x: 232, type: "spike" }, { x: 238, type: "spike3" },
  { x: 252, type: "spike" }, { x: 258, type: "tall" }, { x: 266, type: "portal-cube" },
  { x: 274, type: "spike" }, { x: 280, type: "spike3" }, { x: 294, type: "spike" },
  { x: 302, type: "pad" }, { x: 310, type: "tall" }, { x: 318, type: "portal-cube" },
];

const hyperLoop: Obstacle[] = [
  { x: 10, type: "spike" }, { x: 14, type: "spike" }, { x: 18, type: "spike" },
  { x: 24, type: "spike" }, { x: 30, type: "spike3" }, { x: 44, type: "portal-ship" },
  { x: 52, type: "spike" }, { x: 58, type: "spike" }, { x: 64, type: "spike" },
  { x: 72, type: "portal-cube" }, { x: 80, type: "tall" }, { x: 88, type: "spike3" },
  { x: 102, type: "portal-ball" }, { x: 110, type: "spike" }, { x: 116, type: "spike" },
  { x: 122, type: "spike" }, { x: 130, type: "portal-cube" }, { x: 138, type: "pad" },
  { x: 146, type: "spike" }, { x: 152, type: "portal-ufo" }, { x: 162, type: "spike" },
  { x: 168, type: "spike" }, { x: 174, type: "spike3" }, { x: 188, type: "portal-cube" },
  { x: 196, type: "spike" }, { x: 202, type: "block" }, { x: 210, type: "portal-wave" },
  { x: 218, type: "spike" }, { x: 224, type: "spike" }, { x: 230, type: "spike" },
  { x: 238, type: "spike3" }, { x: 252, type: "tall" }, { x: 260, type: "spike" },
  { x: 266, type: "spike" }, { x: 272, type: "portal-cube" }, { x: 280, type: "spike3" },
  { x: 294, type: "portal-spider" }, { x: 302, type: "spike" }, { x: 308, type: "spike" },
  { x: 316, type: "tall" }, { x: 324, type: "portal-cube" }, { x: 332, type: "spike3" },
];

const finalBoss: Obstacle[] = [
  { x: 8, type: "spike" }, { x: 12, type: "spike" }, { x: 16, type: "spike" },
  { x: 20, type: "spike" }, { x: 26, type: "spike3" }, { x: 38, type: "portal-ship" },
  { x: 46, type: "spike" }, { x: 52, type: "spike" }, { x: 58, type: "spike" },
  { x: 66, type: "portal-spider" }, { x: 74, type: "spike" }, { x: 80, type: "spike" },
  { x: 86, type: "tall" }, { x: 94, type: "portal-cube" }, { x: 102, type: "spike" },
  { x: 108, type: "spike" }, { x: 114, type: "spike3" }, { x: 128, type: "portal-robot" },
  { x: 136, type: "spike" }, { x: 142, type: "spike" }, { x: 148, type: "tall" },
  { x: 156, type: "portal-cube" }, { x: 164, type: "spike" }, { x: 170, type: "spike" },
  { x: 176, type: "portal-wave" }, { x: 184, type: "spike" }, { x: 190, type: "spike" },
  { x: 196, type: "spike" }, { x: 204, type: "portal-cube" }, { x: 212, type: "spike3" },
  { x: 226, type: "portal-swing" }, { x: 234, type: "spike" }, { x: 240, type: "spike" },
  { x: 246, type: "spike" }, { x: 254, type: "portal-cube" }, { x: 262, type: "spike3" },
  { x: 276, type: "portal-ball" }, { x: 284, type: "spike" }, { x: 290, type: "spike" },
  { x: 296, type: "spike" }, { x: 304, type: "portal-cube" }, { x: 312, type: "spike3" },
  { x: 326, type: "tall" }, { x: 334, type: "spike" }, { x: 340, type: "spike" },
  { x: 346, type: "spike" }, { x: 354, type: "portal-ufo" }, { x: 362, type: "spike3" },
  { x: 376, type: "spike" }, { x: 384, type: "tall" }, { x: 392, type: "portal-cube" },
  { x: 400, type: "spike3" }, { x: 414, type: "spike" }, { x: 422, type: "spike" },
];

export const LEVELS: LevelDef[] = [
  {
    id: "stereo-pulse",
    name: "Stereo Pulse",
    difficulty: "Easy",
    difficultyStars: 1,
    bg: "var(--gradient-bg-1)",
    accent: "var(--neon-pink)",
    bpm: 140,
    length: 330,
    obstacles: easy,
    decoration: "mountains",
  },
  {
    id: "cyber-rush",
    name: "Cyber Rush",
    difficulty: "Normal",
    difficultyStars: 2,
    bg: "var(--gradient-bg-2)",
    accent: "var(--neon-cyan)",
    bpm: 155,
    length: 360,
    obstacles: normal,
    decoration: "city",
  },
  {
    id: "voltage-storm",
    name: "Voltage Storm",
    difficulty: "Hard",
    difficultyStars: 3,
    bg: "var(--gradient-bg-3)",
    accent: "var(--neon-green)",
    bpm: 170,
    length: 380,
    obstacles: hard,
    decoration: "circuit",
  },
  {
    id: "neon-drift",
    name: "Neon Drift",
    difficulty: "Easy",
    difficultyStars: 1,
    bg: "var(--gradient-bg-2)",
    accent: "var(--neon-cyan)",
    bpm: 138,
    length: 350,
    obstacles: neonDrift,
    decoration: "stars",
  },
  {
    id: "plasma-tide",
    name: "Plasma Tide",
    difficulty: "Normal",
    difficultyStars: 2,
    bg: "var(--gradient-bg-1)",
    accent: "var(--neon-pink)",
    bpm: 150,
    length: 350,
    obstacles: plasmaTide,
    decoration: "waves",
  },
  {
    id: "glitch-city",
    name: "Glitch City",
    difficulty: "Hard",
    difficultyStars: 3,
    bg: "var(--gradient-bg-3)",
    accent: "var(--neon-green)",
    bpm: 165,
    length: 350,
    obstacles: glitchCity,
    decoration: "city",
  },
  {
    id: "laser-dawn",
    name: "Laser Dawn",
    difficulty: "Normal",
    difficultyStars: 2,
    bg: "var(--gradient-bg-endless)",
    accent: "var(--neon-pink)",
    bpm: 148,
    length: 330,
    obstacles: laserDawn,
    decoration: "pyramids",
  },
  {
    id: "vortex-run",
    name: "Vortex Run",
    difficulty: "Hard",
    difficultyStars: 3,
    bg: "var(--gradient-bg-2)",
    accent: "var(--neon-cyan)",
    bpm: 162,
    length: 350,
    obstacles: vortexRun,
    decoration: "crystals",
  },
  {
    id: "hyper-loop",
    name: "Hyper Loop",
    difficulty: "Hard",
    difficultyStars: 3,
    bg: "var(--gradient-bg-1)",
    accent: "var(--neon-pink)",
    bpm: 172,
    length: 360,
    obstacles: hyperLoop,
    decoration: "rain",
  },
  {
    id: "final-boss",
    name: "Final Boss",
    difficulty: "Hard",
    difficultyStars: 3,
    bg: "var(--gradient-bg-3)",
    accent: "var(--neon-green)",
    bpm: 180,
    length: 450,
    obstacles: finalBoss,
    decoration: "skull",
  },
];

export const ENDLESS_BG = "var(--gradient-bg-endless)";
export const ENDLESS_ACCENT = "var(--neon-pink)";
export const ENDLESS_DECORATION: DecorationTheme = "stars";

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
