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

// =====================================================================
// MODE-TAILORED CHUNKS
// Each chunk is ~24 tiles wide and is hand-shaped to suit the gamemode.
// All x's are relative to the chunk start. We compose them into both the
// campaign levels (via emitMode helper) and the endless generator.
// =====================================================================

type Chunk = Obstacle[];

// CUBE — classic ground-based timing puzzles.
const cubeChunks: Chunk[] = [
  [{ x: 4, type: "spike" }, { x: 10, type: "spike" }, { x: 16, type: "spike3" }],
  [{ x: 4, type: "block" }, { x: 5, type: "block" }, { x: 12, type: "spike" }, { x: 18, type: "spike3" }],
  [{ x: 4, type: "spike3" }, { x: 14, type: "tall" }, { x: 22, type: "spike" }],
  [{ x: 4, type: "pad" }, { x: 12, type: "tall" }, { x: 20, type: "spike" }],
  [{ x: 4, type: "spike" }, { x: 8, type: "spike" }, { x: 12, type: "spike" }, { x: 18, type: "spike3" }],
  [{ x: 4, type: "block" }, { x: 8, type: "spike" }, { x: 14, type: "block" }, { x: 18, type: "spike3" }],
];

// SHIP — tunnels and ceilings. Fly between ground hazards and overhead platforms.
const shipChunks: Chunk[] = [
  // Low ceiling tunnel — platforms overhead force you to dip down between spikes.
  [
    { x: 2, type: "platform", y: 5 }, { x: 6, type: "platform", y: 5 }, { x: 10, type: "platform", y: 5 },
    { x: 14, type: "platform", y: 5 }, { x: 18, type: "platform", y: 5 },
    { x: 6, type: "spike" }, { x: 12, type: "spike" }, { x: 18, type: "spike" },
  ],
  // Stair-step ceiling
  [
    { x: 2, type: "platform", y: 6 }, { x: 6, type: "platform", y: 5 },
    { x: 10, type: "platform", y: 4 }, { x: 14, type: "platform", y: 5 },
    { x: 18, type: "platform", y: 6 },
    { x: 8, type: "spike" }, { x: 16, type: "spike3" },
  ],
  // Pinch zone — block + ceiling
  [
    { x: 4, type: "tall" }, { x: 5, type: "platform", y: 5 },
    { x: 12, type: "tall" }, { x: 13, type: "platform", y: 5 },
    { x: 20, type: "spike3" },
  ],
  // Open sky with floor spike fields
  [
    { x: 2, type: "spike3" }, { x: 8, type: "spike" }, { x: 12, type: "spike" },
    { x: 16, type: "spike3" }, { x: 22, type: "spike" },
  ],
];

// BALL — pairs of floor + ceiling spike groups, encouraging gravity flips.
const ballChunks: Chunk[] = [
  // Floor spikes then a forced flip section with ceiling spikes
  [
    { x: 4, type: "spike" }, { x: 10, type: "spike" },
    { x: 14, type: "platform", y: 4 }, { x: 18, type: "platform", y: 4 },
    { x: 16, type: "spike" }, { x: 22, type: "spike" },
  ],
  // Ceiling rail you roll along
  [
    { x: 2, type: "platform", y: 4 }, { x: 6, type: "platform", y: 4 },
    { x: 10, type: "platform", y: 4 }, { x: 14, type: "platform", y: 4 },
    { x: 18, type: "platform", y: 4 },
    { x: 8, type: "spike" }, { x: 16, type: "spike" },
  ],
  // Alternating floor/floor flip teaser
  [
    { x: 4, type: "spike3" }, { x: 14, type: "spike3" }, { x: 22, type: "block" },
  ],
  [
    { x: 4, type: "block" }, { x: 6, type: "platform", y: 4 },
    { x: 12, type: "spike" }, { x: 14, type: "platform", y: 4 },
    { x: 20, type: "spike" },
  ],
];

// UFO — flap timing. Tall obstacles + low platforms = pump up, dip under.
const ufoChunks: Chunk[] = [
  [
    { x: 4, type: "tall" }, { x: 10, type: "tall" }, { x: 16, type: "tall" },
    { x: 6, type: "platform", y: 5 }, { x: 12, type: "platform", y: 5 }, { x: 18, type: "platform", y: 5 },
  ],
  [
    { x: 4, type: "spike" }, { x: 8, type: "platform", y: 4 },
    { x: 14, type: "spike" }, { x: 18, type: "platform", y: 4 },
    { x: 22, type: "spike" },
  ],
  [
    { x: 2, type: "platform", y: 6 }, { x: 6, type: "platform", y: 3 },
    { x: 10, type: "platform", y: 6 }, { x: 14, type: "platform", y: 3 },
    { x: 18, type: "platform", y: 6 },
  ],
  [
    { x: 4, type: "tall" }, { x: 5, type: "platform", y: 5 },
    { x: 14, type: "spike3" }, { x: 22, type: "tall" },
  ],
];

// WAVE — sine/slope corridors. Chains of platforms at varying heights form
// a wave-shaped path you must thread.
const waveChunks: Chunk[] = [
  // Sine wave: ceiling dips down, floor obstacles rise up.
  [
    { x: 0, type: "platform", y: 6 }, { x: 3, type: "platform", y: 5 },
    { x: 6, type: "platform", y: 4 }, { x: 9, type: "platform", y: 5 },
    { x: 12, type: "platform", y: 6 }, { x: 15, type: "platform", y: 5 },
    { x: 18, type: "platform", y: 4 }, { x: 21, type: "platform", y: 5 },
  ],
  // Zig-zag tight gap
  [
    { x: 0, type: "platform", y: 6 }, { x: 4, type: "platform", y: 3 },
    { x: 8, type: "platform", y: 6 }, { x: 12, type: "platform", y: 3 },
    { x: 16, type: "platform", y: 6 }, { x: 20, type: "platform", y: 3 },
  ],
  // Rising ramp + falling ramp
  [
    { x: 0, type: "platform", y: 3 }, { x: 3, type: "platform", y: 4 },
    { x: 6, type: "platform", y: 5 }, { x: 9, type: "platform", y: 6 },
    { x: 12, type: "platform", y: 6 }, { x: 15, type: "platform", y: 5 },
    { x: 18, type: "platform", y: 4 }, { x: 21, type: "platform", y: 3 },
  ],
  // Open straightaway with a single mid-air gate
  [
    { x: 6, type: "platform", y: 5 }, { x: 12, type: "platform", y: 4 },
    { x: 18, type: "platform", y: 5 }, { x: 14, type: "spike" },
  ],
];

// ROBOT — wide gaps, tall walls. Reward holding for higher arcs.
const robotChunks: Chunk[] = [
  [{ x: 4, type: "tall" }, { x: 12, type: "tall" }, { x: 20, type: "tall" }],
  [{ x: 4, type: "spike3" }, { x: 12, type: "tall" }, { x: 18, type: "spike3" }],
  [{ x: 4, type: "block" }, { x: 5, type: "block" }, { x: 6, type: "block" }, { x: 14, type: "spike3" }, { x: 22, type: "tall" }],
  [{ x: 4, type: "pad" }, { x: 10, type: "platform", y: 6 }, { x: 16, type: "tall" }, { x: 22, type: "spike" }],
  [{ x: 4, type: "tall" }, { x: 10, type: "spike3" }, { x: 18, type: "tall" }],
];

// SPIDER — pairs of floor/ceiling spike walls forcing instant snaps.
const spiderChunks: Chunk[] = [
  [
    { x: 4, type: "spike" }, { x: 6, type: "platform", y: 4 },
    { x: 12, type: "spike" }, { x: 14, type: "platform", y: 4 },
    { x: 20, type: "spike" },
  ],
  [
    { x: 2, type: "platform", y: 4 }, { x: 6, type: "platform", y: 4 },
    { x: 10, type: "platform", y: 4 }, { x: 14, type: "platform", y: 4 },
    { x: 4, type: "spike" }, { x: 12, type: "spike" }, { x: 20, type: "spike3" },
  ],
  [
    { x: 4, type: "spike3" }, { x: 4, type: "platform", y: 4 },
    { x: 14, type: "spike3" }, { x: 14, type: "platform", y: 4 },
    { x: 22, type: "spike" },
  ],
  [
    { x: 6, type: "spike" }, { x: 12, type: "spike" }, { x: 18, type: "spike" },
    { x: 8, type: "platform", y: 4 }, { x: 16, type: "platform", y: 4 },
  ],
];

// SWING — mid-air spike pairs. Force gravity flips at speed.
const swingChunks: Chunk[] = [
  [
    { x: 4, type: "spike" }, { x: 4, type: "platform", y: 4 },
    { x: 12, type: "spike" }, { x: 12, type: "platform", y: 4 },
    { x: 20, type: "spike3" },
  ],
  [
    { x: 4, type: "spike3" }, { x: 14, type: "platform", y: 4 },
    { x: 14, type: "spike" }, { x: 22, type: "platform", y: 4 },
  ],
  [
    { x: 2, type: "platform", y: 5 }, { x: 8, type: "platform", y: 3 },
    { x: 14, type: "platform", y: 5 }, { x: 20, type: "platform", y: 3 },
    { x: 11, type: "spike" }, { x: 17, type: "spike" },
  ],
  [
    { x: 6, type: "spike" }, { x: 6, type: "platform", y: 4 },
    { x: 14, type: "spike" }, { x: 14, type: "platform", y: 4 },
    { x: 20, type: "spike" }, { x: 20, type: "platform", y: 4 },
  ],
];

const MODE_CHUNKS: Record<string, Chunk[]> = {
  cube: cubeChunks,
  ship: shipChunks,
  ball: ballChunks,
  ufo: ufoChunks,
  wave: waveChunks,
  robot: robotChunks,
  spider: spiderChunks,
  swing: swingChunks,
};

const CHUNK_LEN = 24;

// Helper: emit a sequence of chunks for a given mode, starting at tile cursor.
// Returns { obstacles, end }.
function emitMode(mode: keyof typeof MODE_CHUNKS, cursor: number, count: number, seed: number) {
  let s = seed * 9301 + 49297;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const chunks = MODE_CHUNKS[mode];
  const out: Obstacle[] = [];
  for (let i = 0; i < count; i++) {
    const ck = chunks[Math.floor(rand() * chunks.length)];
    for (const o of ck) out.push({ ...o, x: o.x + cursor });
    cursor += CHUNK_LEN;
  }
  return { obstacles: out, end: cursor };
}

// Build a campaign level by stitching mode segments together with portals between them.
function buildCampaign(seed: number, segments: { mode: keyof typeof MODE_CHUNKS; chunks: number }[]): { obstacles: Obstacle[]; length: number } {
  const portalForMode: Record<string, ObstacleType> = {
    cube: "portal-cube", ship: "portal-ship", ball: "portal-ball", ufo: "portal-ufo",
    wave: "portal-wave", robot: "portal-robot", spider: "portal-spider", swing: "portal-swing",
  };
  let cursor = 10; // initial runway
  const all: Obstacle[] = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (i === 0 && seg.mode !== "cube") {
      all.push({ x: cursor, type: portalForMode[seg.mode] });
      cursor += 4;
    } else if (i > 0) {
      all.push({ x: cursor, type: portalForMode[seg.mode] });
      cursor += 4;
    }
    const e = emitMode(seg.mode, cursor, seg.chunks, seed + i * 13);
    all.push(...e.obstacles);
    cursor = e.end + 2;
  }
  return { obstacles: all, length: cursor + 8 };
}

// Build campaign obstacle lists for each level. Mode mix is hand-tuned per level.
const lvl1 = buildCampaign(1, [
  { mode: "cube", chunks: 4 },
  { mode: "ship", chunks: 3 },
  { mode: "cube", chunks: 3 },
]);
const lvl2 = buildCampaign(2, [
  { mode: "cube", chunks: 3 },
  { mode: "ufo", chunks: 3 },
  { mode: "cube", chunks: 2 },
  { mode: "wave", chunks: 3 },
]);
const lvl3 = buildCampaign(3, [
  { mode: "cube", chunks: 2 },
  { mode: "ship", chunks: 3 },
  { mode: "spider", chunks: 3 },
  { mode: "cube", chunks: 2 },
  { mode: "robot", chunks: 3 },
]);
const lvl4 = buildCampaign(4, [
  { mode: "cube", chunks: 2 },
  { mode: "ball", chunks: 4 },
  { mode: "cube", chunks: 3 },
]);
const lvl5 = buildCampaign(5, [
  { mode: "wave", chunks: 4 },
  { mode: "cube", chunks: 2 },
  { mode: "wave", chunks: 3 },
]);
const lvl6 = buildCampaign(6, [
  { mode: "cube", chunks: 2 },
  { mode: "spider", chunks: 3 },
  { mode: "robot", chunks: 3 },
  { mode: "ball", chunks: 2 },
]);
const lvl7 = buildCampaign(7, [
  { mode: "ship", chunks: 4 },
  { mode: "cube", chunks: 2 },
  { mode: "ufo", chunks: 3 },
]);
const lvl8 = buildCampaign(8, [
  { mode: "cube", chunks: 2 },
  { mode: "wave", chunks: 3 },
  { mode: "spider", chunks: 3 },
  { mode: "swing", chunks: 2 },
]);
const lvl9 = buildCampaign(9, [
  { mode: "ball", chunks: 3 },
  { mode: "ship", chunks: 3 },
  { mode: "wave", chunks: 3 },
  { mode: "robot", chunks: 2 },
]);
const lvlBoss = buildCampaign(10, [
  { mode: "cube", chunks: 2 },
  { mode: "ship", chunks: 2 },
  { mode: "spider", chunks: 2 },
  { mode: "robot", chunks: 2 },
  { mode: "wave", chunks: 2 },
  { mode: "ball", chunks: 2 },
  { mode: "ufo", chunks: 2 },
  { mode: "swing", chunks: 2 },
  { mode: "cube", chunks: 2 },
]);

export const LEVELS: LevelDef[] = [
  {
    id: "stereo-pulse",
    name: "Stereo Pulse",
    difficulty: "Easy",
    difficultyStars: 1,
    bg: "var(--gradient-bg-1)",
    accent: "var(--neon-pink)",
    bpm: 140,
    length: lvl1.length,
    obstacles: lvl1.obstacles,
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
    length: lvl2.length,
    obstacles: lvl2.obstacles,
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
    length: lvl3.length,
    obstacles: lvl3.obstacles,
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
    length: lvl4.length,
    obstacles: lvl4.obstacles,
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
    length: lvl5.length,
    obstacles: lvl5.obstacles,
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
    length: lvl6.length,
    obstacles: lvl6.obstacles,
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
    length: lvl7.length,
    obstacles: lvl7.obstacles,
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
    length: lvl8.length,
    obstacles: lvl8.obstacles,
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
    length: lvl9.length,
    obstacles: lvl9.obstacles,
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
    length: lvlBoss.length,
    obstacles: lvlBoss.obstacles,
    decoration: "skull",
  },
];

export const ENDLESS_BG = "var(--gradient-bg-endless)";
export const ENDLESS_ACCENT = "var(--neon-pink)";
export const ENDLESS_DECORATION: DecorationTheme = "stars";

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

// Endless: in single-mode runs, only emit chunks tailored to that mode.
// In mixed runs, sprinkle portals between mode-tailored sections.
export function generateEndlessObstacles(seed: number, chunkCount: number, startMode: EndlessMode = "mixed"): Obstacle[] {
  let s = seed * 9301 + 49297;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  const out: Obstacle[] = [];
  let cursor = 12;

  if (startMode !== "mixed") {
    const e = emitMode(startMode, cursor, chunkCount, seed);
    return e.obstacles;
  }

  // Mixed: emit short mode-tailored sections separated by portals.
  const modes: (keyof typeof MODE_CHUNKS)[] = ["cube", "ship", "ball", "ufo", "wave", "robot", "spider", "swing"];
  const portalFor: Record<string, ObstacleType> = {
    cube: "portal-cube", ship: "portal-ship", ball: "portal-ball", ufo: "portal-ufo",
    wave: "portal-wave", robot: "portal-robot", spider: "portal-spider", swing: "portal-swing",
  };
  let prev: keyof typeof MODE_CHUNKS = "cube";
  let remaining = chunkCount;
  let segIdx = 0;
  while (remaining > 0) {
    const segLen = Math.min(remaining, 2 + Math.floor(rand() * 2));
    let mode: keyof typeof MODE_CHUNKS;
    if (segIdx === 0) {
      mode = "cube";
    } else {
      do { mode = modes[Math.floor(rand() * modes.length)]; } while (mode === prev);
      out.push({ x: cursor, type: portalFor[mode] });
      cursor += 4;
    }
    const e = emitMode(mode, cursor, segLen, seed + segIdx * 17);
    out.push(...e.obstacles);
    cursor = e.end + 2;
    prev = mode;
    remaining -= segLen;
    segIdx++;
  }
  return out;
}
