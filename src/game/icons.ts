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
  pattern: number;
}

// 12 unique icons per mode. Each mode has its own pattern set in iconPatterns.ts.
export const ICONS_PER_MODE = 12;

export interface PlayerSkin {
  primary: string;
  secondary: string;
  glow: string;
  icons: Record<GameMode, number>;
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

// Per-mode patterns live in ./iconPatterns. Re-export the dispatcher so existing
// imports from "@/game/icons" keep working.
export { drawModePattern } from "./iconPatterns";

// Back-compat shim: legacy callers used drawIconPattern without mode context.
// Routes through the cube pattern set so existing screens still render something.
import { drawModePattern } from "./iconPatterns";
export function drawIconPattern(
  ctx: CanvasRenderingContext2D,
  pattern: number,
  s: number,
  skin: PlayerSkin,
) {
  drawModePattern(ctx, "cube", pattern, s, skin);
}
