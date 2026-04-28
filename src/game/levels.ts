// Level definitions for the runner — built procedurally with per-mode segments.
//
// Each gamemode has its own segment generators tailored to its strengths:
//  - cube:   ground spikes + blocks at jumpable spacing
//  - ship:   floor + ceiling obstacles forming corridors
//  - ball:   alternating floor/ceiling spikes (gravity flip)
//  - ufo:    stair-step blocks forcing repeated flaps
//  - wave:   tight sawtooth corridors with diagonal gaps
//  - robot:  wide pits requiring high held jumps
//  - spider: alternating floor/ceiling spike fields
//  - swing:  two-walled corridors needing mid-air flips
//
// "x" is in tiles (TILE = 40 px). Tile 0 is the start; player begins ~9 tiles in.

export type ObstacleType =
  | "spike"
  | "spike3"
  | "spike-ceil"
  | "spike3-ceil"
  | "block"
  | "tall"
  | "block-ceil"
  | "tall-ceil"
  | "slope-up"        // floor slope rising left→right (1 tile wide, 1 tile tall)
  | "slope-down"      // floor slope falling left→right
  | "slope-up-ceil"   // ceiling slope descending left→right (hangs from ceiling)
  | "slope-down-ceil" // ceiling slope ascending left→right
  | "platform"
  | "portal-grav"
  | "pad"
  | "coin"
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
  difficultyStars: 1 | 2 | 3;
  bg: string;
  accent: string;
  bpm: number;
  length: number;
  obstacles: Obstacle[];
  decoration: DecorationTheme;
}

// ============================================================================
// Per-mode segment builders. Each appends obstacles starting at `cursor` and
// returns the new cursor position.
// ============================================================================

type ModeKey = "cube" | "ship" | "ball" | "ufo" | "wave" | "robot" | "spider" | "swing";

interface BuildCtx {
  out: Obstacle[];
  cursor: number;
  rand: () => number;
  difficulty: 1 | 2 | 3;
}

function pushCoinLine(ctx: BuildCtx, fromX: number, toX: number, yTile: number, step = 2) {
  for (let x = fromX; x < toX; x += step) ctx.out.push({ x, type: "coin", y: yTile });
}

function buildCube(ctx: BuildCtx, lengthTiles: number): number {
  const end = ctx.cursor + lengthTiles;
  // Density: spacing between obstacles.
  const minGap = ctx.difficulty === 1 ? 7 : ctx.difficulty === 2 ? 6 : 5;
  let x = ctx.cursor + 4;
  while (x < end - 4) {
    const r = ctx.rand();
    if (r < 0.5) {
      ctx.out.push({ x, type: "spike" });
      pushCoinLine(ctx, x - 2, x, 3);
      x += minGap;
    } else if (r < 0.75) {
      ctx.out.push({ x, type: "spike3" });
      x += minGap + 3;
    } else if (r < 0.88) {
      ctx.out.push({ x, type: "block" });
      ctx.out.push({ x: x + 1, type: "block" });
      ctx.out.push({ x: x + 4, type: "spike" });
      x += minGap + 4;
    } else if (r < 0.96) {
      ctx.out.push({ x, type: "tall" });
      ctx.out.push({ x: x + 5, type: "spike" });
      x += minGap + 5;
    } else {
      ctx.out.push({ x, type: "pad" });
      ctx.out.push({ x: x + 4, type: "tall" });
      x += minGap + 6;
    }
  }
  return end;
}

function buildShip(ctx: BuildCtx, lengthTiles: number): number {
  const end = ctx.cursor + lengthTiles;
  // Ship corridors: opposing floor + ceiling obstacles forming gaps.
  const gapTiles = ctx.difficulty === 1 ? 4 : ctx.difficulty === 2 ? 3 : 3;
  let x = ctx.cursor + 4;
  while (x < end - 4) {
    const r = ctx.rand();
    if (r < 0.55) {
      // tall floor block + hanging ceiling block forming a gap
      ctx.out.push({ x, type: "tall" });
      ctx.out.push({ x: x + 3, type: "tall-ceil" });
      pushCoinLine(ctx, x - 1, x + 5, 3);
      x += gapTiles + 6;
    } else if (r < 0.8) {
      // floor spikes you must rise over, then ceiling spikes you must dip under
      ctx.out.push({ x, type: "spike3" });
      ctx.out.push({ x: x + 5, type: "spike3-ceil" });
      x += gapTiles + 7;
    } else {
      // pinch: tall on both sides
      ctx.out.push({ x, type: "block" });
      ctx.out.push({ x: x + 1, type: "block-ceil" });
      ctx.out.push({ x: x + 4, type: "tall-ceil" });
      ctx.out.push({ x: x + 6, type: "tall" });
      x += gapTiles + 8;
    }
  }
  return end;
}

function buildBall(ctx: BuildCtx, lengthTiles: number): number {
  const end = ctx.cursor + lengthTiles;
  const minGap = ctx.difficulty === 1 ? 8 : ctx.difficulty === 2 ? 7 : 6;
  let x = ctx.cursor + 4;
  let onCeiling = false;
  while (x < end - 4) {
    if (onCeiling) {
      ctx.out.push({ x, type: "spike-ceil" });
      ctx.out.push({ x: x + 2, type: "spike-ceil" });
    } else {
      ctx.out.push({ x, type: "spike" });
      ctx.out.push({ x: x + 2, type: "spike" });
    }
    pushCoinLine(ctx, x - 1, x + 3, onCeiling ? 5 : 1);
    x += minGap;
    if (ctx.rand() < 0.5) onCeiling = !onCeiling;
  }
  return end;
}

function buildUfo(ctx: BuildCtx, lengthTiles: number): number {
  const end = ctx.cursor + lengthTiles;
  let x = ctx.cursor + 4;
  while (x < end - 4) {
    const r = ctx.rand();
    if (r < 0.6) {
      // stairs of tall blocks requiring repeated flaps
      ctx.out.push({ x, type: "tall" });
      ctx.out.push({ x: x + 3, type: "tall-ceil" });
      pushCoinLine(ctx, x - 1, x + 4, 3);
      x += 7;
    } else if (r < 0.85) {
      // ceiling overhang
      ctx.out.push({ x, type: "block-ceil" });
      ctx.out.push({ x: x + 4, type: "spike" });
      x += 8;
    } else {
      ctx.out.push({ x, type: "spike3-ceil" });
      x += 8;
    }
  }
  return end;
}

function buildWave(ctx: BuildCtx, lengthTiles: number): number {
  const end = ctx.cursor + lengthTiles;
  // Wave gameplay = diagonal 45° hold/release through tight slope corridors.
  // We build pairs of floor + ceiling slopes that funnel the wave up and down.
  // Difficulty controls corridor tightness (vertical gap between floor & ceiling).
  let x = ctx.cursor + 2;
  // floorH = current floor block height (tiles); ceilH = current ceiling block height (tiles).
  // Playfield is ~7 tiles tall above ground. Keep floor+ceil <= playfield - gap.
  const playH = 7;
  const minGap = ctx.difficulty === 1 ? 4 : ctx.difficulty === 2 ? 3 : 2;
  let floorH = 0;
  let ceilH = 0;

  while (x < end - 4) {
    const r = ctx.rand();
    // Choose a target floor/ceiling height that respects the min vertical gap.
    const maxFloor = Math.max(0, playH - minGap - ceilH);
    const maxCeil = Math.max(0, playH - minGap - floorH);

    if (r < 0.35) {
      // Ramp the floor UP by 1 tile via a slope, mirror with falling ceiling.
      const newFloor = Math.min(maxFloor, floorH + 1);
      const newCeil = Math.max(0, ceilH - 1);
      if (newFloor > floorH) ctx.out.push({ x, type: "slope-up", y: floorH });
      if (newCeil < ceilH) ctx.out.push({ x, type: "slope-up-ceil", y: ceilH });
      floorH = newFloor;
      ceilH = newCeil;
      x += 1;
    } else if (r < 0.7) {
      // Ramp the floor DOWN by 1 tile, ceiling rises.
      const newFloor = Math.max(0, floorH - 1);
      const newCeil = Math.min(maxCeil, ceilH + 1);
      if (newFloor < floorH) ctx.out.push({ x, type: "slope-down", y: floorH });
      if (newCeil > ceilH) ctx.out.push({ x, type: "slope-down-ceil", y: ceilH });
      floorH = newFloor;
      ceilH = newCeil;
      x += 1;
    } else {
      // Flat corridor segment using stacked tall blocks (matching current heights).
      // Render flat floor/ceiling blocks of current heights for 1-2 tiles.
      const span = 1 + Math.floor(ctx.rand() * 2);
      for (let i = 0; i < span; i++) {
        if (floorH >= 1) ctx.out.push({ x: x + i, type: floorH >= 2 ? "tall" : "block" });
        if (ceilH >= 1) ctx.out.push({ x: x + i, type: ceilH >= 2 ? "tall-ceil" : "block-ceil" });
      }
      x += span;
    }
  }
  return end;
}

function buildRobot(ctx: BuildCtx, lengthTiles: number): number {
  const end = ctx.cursor + lengthTiles;
  let x = ctx.cursor + 4;
  while (x < end - 4) {
    const r = ctx.rand();
    if (r < 0.55) {
      // wide spike pit — needs held jump
      ctx.out.push({ x, type: "spike3" });
      ctx.out.push({ x: x + 3, type: "spike3" });
      pushCoinLine(ctx, x, x + 6, 4);
      x += 10;
    } else if (r < 0.85) {
      // tall + landing block + spike — held jump up to platform
      ctx.out.push({ x, type: "spike" });
      ctx.out.push({ x: x + 4, type: "tall" });
      ctx.out.push({ x: x + 8, type: "spike3" });
      x += 12;
    } else {
      ctx.out.push({ x, type: "pad" });
      ctx.out.push({ x: x + 5, type: "tall" });
      ctx.out.push({ x: x + 8, type: "spike" });
      x += 11;
    }
  }
  return end;
}

function buildSpider(ctx: BuildCtx, lengthTiles: number): number {
  const end = ctx.cursor + lengthTiles;
  const minGap = ctx.difficulty === 1 ? 6 : ctx.difficulty === 2 ? 5 : 4;
  let x = ctx.cursor + 4;
  let top = false;
  while (x < end - 4) {
    if (top) {
      ctx.out.push({ x, type: "spike3-ceil" });
    } else {
      ctx.out.push({ x, type: "spike3" });
    }
    x += minGap + 2;
    top = !top;
  }
  return end;
}

function buildSwing(ctx: BuildCtx, lengthTiles: number): number {
  const end = ctx.cursor + lengthTiles;
  let x = ctx.cursor + 4;
  while (x < end - 4) {
    const r = ctx.rand();
    if (r < 0.6) {
      // two walls forming a flip-required corridor
      ctx.out.push({ x, type: "tall" });
      ctx.out.push({ x: x + 4, type: "tall-ceil" });
      pushCoinLine(ctx, x - 1, x + 5, 3);
      x += 8;
    } else {
      ctx.out.push({ x, type: "spike3-ceil" });
      ctx.out.push({ x: x + 4, type: "spike3" });
      x += 9;
    }
  }
  return end;
}

const BUILDERS: Record<ModeKey, (ctx: BuildCtx, len: number) => number> = {
  cube: buildCube,
  ship: buildShip,
  ball: buildBall,
  ufo: buildUfo,
  wave: buildWave,
  robot: buildRobot,
  spider: buildSpider,
  swing: buildSwing,
};

function modeToPortalType(m: ModeKey): ObstacleType {
  return ("portal-" + m) as ObstacleType;
}

// Build a full level by chaining mode segments.
// `segments` is a list of [mode, lengthTiles]. A 4-tile portal lead-in is added
// between segments. The first segment is always the player's starting mode (cube)
// so they get a safe runway.
function buildLevel(
  seed: number,
  difficulty: 1 | 2 | 3,
  intro: number,
  segments: [ModeKey, number][],
): { obstacles: Obstacle[]; length: number } {
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out: Obstacle[] = [];
  // Generous starting runway — player spawns ~9 tiles in, no obstacles in first `intro`.
  const ctx: BuildCtx = { out, cursor: intro, rand, difficulty };

  for (let i = 0; i < segments.length; i++) {
    const [mode, len] = segments[i];
    if (i > 0) {
      // Insert portal 2 tiles before segment start
      ctx.out.push({ x: ctx.cursor - 1, type: modeToPortalType(mode) });
    }
    ctx.cursor = BUILDERS[mode](ctx, len);
    // Small breather between segments
    ctx.cursor += 2;
  }
  // Sort by x for safety
  out.sort((a, b) => a.x - b.x);
  return { obstacles: out, length: ctx.cursor + 6 };
}

// ============================================================================
// Hand-curated level lineup — each highlights different modes.
// ============================================================================

function makeLevel(
  base: Omit<LevelDef, "obstacles" | "length"> & { length?: number },
  seed: number,
  segments: [ModeKey, number][],
): LevelDef {
  const built = buildLevel(seed, base.difficultyStars, 14, segments);
  return { ...base, obstacles: built.obstacles, length: built.length };
}

export const LEVELS: LevelDef[] = [
  makeLevel(
    {
      id: "stereo-pulse",
      name: "Stereo Pulse",
      difficulty: "Easy",
      difficultyStars: 1,
      bg: "var(--gradient-bg-1)",
      accent: "var(--neon-pink)",
      bpm: 140,
      decoration: "mountains",
    },
    101,
    [["cube", 70], ["ship", 60], ["cube", 60], ["ball", 60]],
  ),
  makeLevel(
    {
      id: "cyber-rush",
      name: "Cyber Rush",
      difficulty: "Normal",
      difficultyStars: 2,
      bg: "var(--gradient-bg-2)",
      accent: "var(--neon-cyan)",
      bpm: 155,
      decoration: "city",
    },
    202,
    [["cube", 60], ["ufo", 60], ["cube", 50], ["ship", 70], ["wave", 50]],
  ),
  makeLevel(
    {
      id: "voltage-storm",
      name: "Voltage Storm",
      difficulty: "Hard",
      difficultyStars: 3,
      bg: "var(--gradient-bg-3)",
      accent: "var(--neon-green)",
      bpm: 170,
      decoration: "circuit",
    },
    303,
    [["cube", 50], ["ship", 60], ["spider", 60], ["robot", 60], ["wave", 50], ["cube", 50]],
  ),
  makeLevel(
    {
      id: "neon-drift",
      name: "Neon Drift",
      difficulty: "Easy",
      difficultyStars: 1,
      bg: "var(--gradient-bg-2)",
      accent: "var(--neon-cyan)",
      bpm: 138,
      decoration: "stars",
    },
    404,
    [["cube", 70], ["ufo", 60], ["cube", 60], ["ship", 60]],
  ),
  makeLevel(
    {
      id: "plasma-tide",
      name: "Plasma Tide",
      difficulty: "Normal",
      difficultyStars: 2,
      bg: "var(--gradient-bg-1)",
      accent: "var(--neon-pink)",
      bpm: 150,
      decoration: "waves",
    },
    505,
    [["cube", 60], ["wave", 50], ["cube", 50], ["ball", 60], ["ship", 60]],
  ),
  makeLevel(
    {
      id: "glitch-city",
      name: "Glitch City",
      difficulty: "Hard",
      difficultyStars: 3,
      bg: "var(--gradient-bg-3)",
      accent: "var(--neon-green)",
      bpm: 165,
      decoration: "city",
    },
    606,
    [["cube", 50], ["spider", 60], ["robot", 60], ["ufo", 60], ["swing", 60], ["cube", 40]],
  ),
  makeLevel(
    {
      id: "laser-dawn",
      name: "Laser Dawn",
      difficulty: "Normal",
      difficultyStars: 2,
      bg: "var(--gradient-bg-endless)",
      accent: "var(--neon-pink)",
      bpm: 148,
      decoration: "pyramids",
    },
    707,
    [["cube", 60], ["ship", 70], ["cube", 50], ["robot", 60]],
  ),
  makeLevel(
    {
      id: "vortex-run",
      name: "Vortex Run",
      difficulty: "Hard",
      difficultyStars: 3,
      bg: "var(--gradient-bg-2)",
      accent: "var(--neon-cyan)",
      bpm: 162,
      decoration: "crystals",
    },
    808,
    [["cube", 50], ["ball", 60], ["ufo", 60], ["wave", 60], ["spider", 50], ["cube", 40]],
  ),
  makeLevel(
    {
      id: "hyper-loop",
      name: "Hyper Loop",
      difficulty: "Hard",
      difficultyStars: 3,
      bg: "var(--gradient-bg-1)",
      accent: "var(--neon-pink)",
      bpm: 172,
      decoration: "rain",
    },
    909,
    [["cube", 50], ["ship", 60], ["wave", 60], ["ufo", 50], ["swing", 60], ["robot", 60]],
  ),
  makeLevel(
    {
      id: "final-boss",
      name: "Final Boss",
      difficulty: "Hard",
      difficultyStars: 3,
      bg: "var(--gradient-bg-3)",
      accent: "var(--neon-green)",
      bpm: 180,
      decoration: "skull",
    },
    1010,
    [
      ["cube", 50], ["ship", 50], ["spider", 50], ["robot", 50],
      ["ufo", 50], ["wave", 50], ["ball", 50], ["swing", 50], ["cube", 60],
    ],
  ),
];

export const ENDLESS_BG = "var(--gradient-bg-endless)";
export const ENDLESS_ACCENT = "var(--neon-pink)";
export const ENDLESS_DECORATION: DecorationTheme = "stars";

// ============================================================================
// Endless: pick a builder per chunk. Single-mode runs lock to that builder.
// ============================================================================

export type EndlessMode = ModeKey | "mixed";

const CHUNK_LEN = 30;

export function generateEndlessObstacles(
  seed: number,
  chunkCount: number,
  startMode: EndlessMode = "mixed",
): Obstacle[] {
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out: Obstacle[] = [];
  const ctx: BuildCtx = { out, cursor: 14, rand, difficulty: 2 };
  const allModes: ModeKey[] = ["cube", "ship", "ball", "ufo", "wave", "robot", "spider", "swing"];

  let lastMode: ModeKey = startMode === "mixed" ? "cube" : startMode;
  for (let i = 0; i < chunkCount; i++) {
    let mode: ModeKey;
    if (startMode === "mixed") {
      // Insert a portal before each chunk (except the first which inherits cube start).
      mode = i === 0 ? "cube" : allModes[Math.floor(rand() * allModes.length)];
      if (i > 0 && mode !== lastMode) {
        ctx.out.push({ x: ctx.cursor - 1, type: modeToPortalType(mode) });
      }
    } else {
      mode = startMode;
    }
    // Ramp difficulty slowly
    ctx.difficulty = (Math.min(3, 1 + Math.floor(i / 4)) as 1 | 2 | 3);
    ctx.cursor = BUILDERS[mode](ctx, CHUNK_LEN);
    ctx.cursor += 2;
    lastMode = mode;
  }
  out.sort((a, b) => a.x - b.x);
  return out;
}
