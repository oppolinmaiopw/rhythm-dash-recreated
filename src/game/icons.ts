// Icon gallery: presets for each game mode.
// Each icon is rendered procedurally on canvas — colors come from the player's
// chosen color scheme. This keeps the bundle tiny and lets users mix/match.

export type GameMode =
  | "cube"
  | "ship"
  | "ball"
  | "ufo"
  | "wave"
  | "robot"
  | "spider"
  | "swing";

export const GAME_MODES: GameMode[] = [
  "cube",
  "ship",
  "ball",
  "ufo",
  "wave",
  "robot",
  "spider",
  "swing",
];

export const MODE_LABEL: Record<GameMode, string> = {
  cube: "Cube",
  ship: "Ship",
  ball: "Ball",
  ufo: "UFO",
  wave: "Wave",
  robot: "Robot",
  spider: "Spider",
  swing: "Swing",
};

export interface IconStyle {
  // Pattern id determines how it's drawn on the cube/ship/etc.
  // 0..11 — 12 styles per mode.
  pattern: number;
}

// 12 icons per mode = 96 total presets. Each pattern is rendered by
// drawIconBody below. The visual differences are pattern-only; the silhouette
// for each mode (cube, ship, etc.) is drawn around the pattern.
export const ICONS_PER_MODE = 12;

export interface PlayerSkin {
  primary: string;   // body main color
  secondary: string; // accent
  glow: string;      // glow color
  icons: Record<GameMode, number>; // selected pattern per mode
}

const DEFAULT_SKIN: PlayerSkin = {
  primary: "#f472b6",
  secondary: "#a855f7",
  glow: "#ec4899",
  icons: {
    cube: 0,
    ship: 0,
    ball: 0,
    ufo: 0,
    wave: 0,
    robot: 0,
    spider: 0,
    swing: 0,
  },
};

const STORAGE_KEY = "cubefall-skin-v1";

export function loadSkin(): PlayerSkin {
  if (typeof window === "undefined") return { ...DEFAULT_SKIN };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SKIN };
    const parsed = JSON.parse(raw) as Partial<PlayerSkin>;
    return {
      ...DEFAULT_SKIN,
      ...parsed,
      icons: { ...DEFAULT_SKIN.icons, ...(parsed.icons ?? {}) },
    };
  } catch {
    return { ...DEFAULT_SKIN };
  }
}

export function saveSkin(skin: PlayerSkin) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(skin));
}

export const COLOR_PRESETS: { name: string; primary: string; secondary: string; glow: string }[] = [
  { name: "Magenta",   primary: "#f472b6", secondary: "#a855f7", glow: "#ec4899" },
  { name: "Cyan",      primary: "#22d3ee", secondary: "#0ea5e9", glow: "#06b6d4" },
  { name: "Lime",      primary: "#a3e635", secondary: "#65a30d", glow: "#84cc16" },
  { name: "Sunset",    primary: "#fb923c", secondary: "#ef4444", glow: "#f97316" },
  { name: "Gold",      primary: "#fde047", secondary: "#f59e0b", glow: "#facc15" },
  { name: "Violet",    primary: "#c4b5fd", secondary: "#7c3aed", glow: "#8b5cf6" },
  { name: "Mint",      primary: "#6ee7b7", secondary: "#10b981", glow: "#34d399" },
  { name: "Crimson",   primary: "#fb7185", secondary: "#be123c", glow: "#f43f5e" },
  { name: "Ice",       primary: "#e0f2fe", secondary: "#7dd3fc", glow: "#bae6fd" },
  { name: "Toxic",     primary: "#bef264", secondary: "#a3e635", glow: "#d9f99d" },
  { name: "Blood",     primary: "#ef4444", secondary: "#7f1d1d", glow: "#dc2626" },
  { name: "Mono",      primary: "#f3f4f6", secondary: "#6b7280", glow: "#d1d5db" },
];

// Draw a pattern decoration inside an arbitrary box. Patterns 0..11.
// All patterns assume ctx is already translated/rotated to the body center,
// and box ranges from (-s/2,-s/2) to (s/2,s/2).
export function drawIconPattern(
  ctx: CanvasRenderingContext2D,
  pattern: number,
  s: number,
  skin: PlayerSkin,
) {
  const half = s / 2;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  switch (pattern % 12) {
    case 0: {
      // Classic face
      ctx.fillRect(-half + 8, -half + 10, 6, 6);
      ctx.fillRect(half - 14, -half + 10, 6, 6);
      ctx.fillRect(-half + 10, half - 14, s - 20, 4);
      break;
    }
    case 1: {
      // Visor band
      ctx.fillStyle = skin.secondary;
      ctx.fillRect(-half + 4, -4, s - 8, 8);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(-half + 8, -2, 4, 4);
      ctx.fillRect(half - 12, -2, 4, 4);
      break;
    }
    case 2: {
      // Diagonal stripes
      ctx.strokeStyle = skin.secondary;
      ctx.lineWidth = 4;
      for (let i = -s; i < s; i += 8) {
        ctx.beginPath();
        ctx.moveTo(i, -half);
        ctx.lineTo(i + s, half);
        ctx.stroke();
      }
      break;
    }
    case 3: {
      // Concentric squares
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      for (let i = 4; i < half; i += 5) {
        ctx.strokeRect(-i, -i, i * 2, i * 2);
      }
      break;
    }
    case 4: {
      // Smile
      ctx.fillRect(-half + 9, -half + 11, 5, 5);
      ctx.fillRect(half - 14, -half + 11, 5, 5);
      ctx.beginPath();
      ctx.arc(0, 4, half - 12, 0, Math.PI);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.stroke();
      break;
    }
    case 5: {
      // Triangle ascendant
      ctx.fillStyle = skin.secondary;
      ctx.beginPath();
      ctx.moveTo(0, -half + 6);
      ctx.lineTo(half - 6, half - 6);
      ctx.lineTo(-half + 6, half - 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.stroke();
      break;
    }
    case 6: {
      // Star
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      drawStar(ctx, 0, 0, half - 6, half / 2.4, 5);
      break;
    }
    case 7: {
      // Circuit
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-half + 4, 0); ctx.lineTo(0, 0); ctx.lineTo(0, -half + 4);
      ctx.moveTo(0, 0); ctx.lineTo(half - 4, half - 4);
      ctx.stroke();
      ctx.fillStyle = skin.secondary;
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(half - 4, half - 4, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 8: {
      // Heart
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      drawHeart(ctx, 0, 0, half - 6);
      break;
    }
    case 9: {
      // Skull dots
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(-half + 8, -half + 12, 6, 6);
      ctx.fillRect(half - 14, -half + 12, 6, 6);
      ctx.fillRect(-half + 8, half - 12, 4, 4);
      ctx.fillRect(-half + 14, half - 12, 4, 4);
      ctx.fillRect(half - 12, half - 12, 4, 4);
      ctx.fillRect(half - 18, half - 12, 4, 4);
      break;
    }
    case 10: {
      // Cross hatch
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      for (let i = -s; i < s; i += 5) {
        ctx.beginPath(); ctx.moveTo(i, -half); ctx.lineTo(i + s, half); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(i, half); ctx.lineTo(i + s, -half); ctx.stroke();
      }
      break;
    }
    case 11: {
      // Bolt
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.moveTo(-2, -half + 4);
      ctx.lineTo(half - 8, -2);
      ctx.lineTo(2, 2);
      ctx.lineTo(half - 4, half - 4);
      ctx.lineTo(-half + 6, 4);
      ctx.lineTo(2, 0);
      ctx.lineTo(-half + 4, -half + 8);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number, points: number) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath();
  const top = cy - size / 4;
  ctx.moveTo(cx, cy + size / 2);
  ctx.bezierCurveTo(cx + size, cy, cx + size / 2, top - size / 2, cx, top);
  ctx.bezierCurveTo(cx - size / 2, top - size / 2, cx - size, cy, cx, cy + size / 2);
  ctx.closePath();
  ctx.fill();
}
