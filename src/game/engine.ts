// Geometry-style runner engine with multiple game modes.
// Modes: cube (jump), ship (hold to thrust), ball (tap = swap gravity),
// ufo (tap = flap), wave (hold = up / release = down), robot (hold = higher jump),
// spider (tap = teleport to ceiling/floor), swing (tap = swap gravity mid-flight, copter-like).

import type { LevelDef, Obstacle } from "./levels";
import { generateEndlessObstacles } from "./levels";
import { sfxCrash, sfxJump, sfxPad, sfxPortal, sfxVictory } from "./audio";
import {
  drawModePattern,
  loadSkin,
  type GameMode,
  type PlayerSkin,
} from "./icons";

export const TILE = 40;
export const GROUND_Y_TILES = 2;
export const PLAYER_SIZE = TILE;
export const SCROLL_SPEED = 360;
export const GRAVITY = 2400;
export const JUMP_VELOCITY = 880;
export const PAD_VELOCITY = 1250;

// Mode-specific constants
const SHIP_THRUST = 3200;
const SHIP_MAX_SPEED = 700;
const UFO_FLAP = 700;
const WAVE_SPEED = 520;
const BALL_GRAVITY_MULT = 1.4;
const ROBOT_JUMP = 760;
const ROBOT_HOLD_BOOST = 1100; // extra upward accel while held in air
const SPIDER_GRAVITY = 3000;
const SWING_GRAVITY_MULT = 1.0;

export interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number;
}

export interface GameState {
  // World
  scrollX: number;
  obstacles: Obstacle[];
  endless: boolean;
  endlessChunksGenerated: number;
  startMode: GameMode;
  // Player
  px: number;
  py: number;
  vy: number;
  onGround: boolean;
  gravityDir: 1 | -1;
  rotation: number;
  mode: GameMode;
  holding: boolean; // input held down (for ship/wave/robot)
  // Wave trail
  waveTrail: { x: number; y: number }[];
  // Meta
  alive: boolean;
  finished: boolean;
  progress: number;
  attempts: number;
  particles: Particle[];
  level: LevelDef;
  width: number;
  height: number;
  lastPadTile: number;
  flashTime: number;
  shake: number; // remaining shake time in seconds
  shakeAmp: number; // peak px
  skin: PlayerSkin;
}

export function createGame(level: LevelDef, opts: { endless?: boolean; width: number; height: number; startMode?: GameMode }): GameState {
  const endless = !!opts.endless;
  const startMode: GameMode = opts.startMode ?? "cube";
  const obstacles = endless
    ? generateEndlessObstacles(Math.floor(Math.random() * 1e6), 12, startMode)
    : level.obstacles.slice();
  return {
    scrollX: 0,
    obstacles,
    endless,
    endlessChunksGenerated: endless ? 12 : 0,
    startMode,
    px: opts.width * 0.28,
    py: opts.height - groundPx(opts.height) - PLAYER_SIZE / 2,
    vy: 0,
    onGround: true,
    gravityDir: 1,
    rotation: 0,
    mode: startMode,
    holding: false,
    waveTrail: [],
    alive: true,
    finished: false,
    progress: 0,
    attempts: 1,
    particles: [],
    level,
    width: opts.width,
    height: opts.height,
    lastPadTile: -1,
    flashTime: 0,
    shake: 0,
    shakeAmp: 0,
    skin: loadSkin(),
  };
}

function addShake(state: GameState, amp: number, dur: number) {
  state.shake = Math.max(state.shake, dur);
  state.shakeAmp = Math.max(state.shakeAmp, amp);
}

export function groundPx(_h: number) {
  return GROUND_Y_TILES * TILE;
}

export function resize(state: GameState, w: number, h: number) {
  state.width = w;
  state.height = h;
  state.px = w * 0.28;
  if (state.onGround && state.gravityDir === 1 && state.mode === "cube") {
    state.py = h - groundPx(h) - PLAYER_SIZE / 2;
  }
}

export function jump(state: GameState) {
  if (!state.alive) return;
  switch (state.mode) {
    case "cube": {
      if (state.onGround) {
        state.vy = -JUMP_VELOCITY * state.gravityDir;
        state.onGround = false;
        sfxJump();
        const dustY = state.py + (state.gravityDir === 1 ? PLAYER_SIZE / 2 : -PLAYER_SIZE / 2);
        for (let i = 0; i < 8; i++) {
          const a = Math.PI + (Math.random() - 0.5) * 1.5;
          const sp = 80 + Math.random() * 140;
          state.particles.push({
            x: state.px + state.scrollX, y: dustY,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.3 * state.gravityDir,
            life: 0, max: 0.4 + Math.random() * 0.2,
            color: state.skin.glow + "cc",
            size: 3 + Math.random() * 3,
          });
        }
      }
      break;
    }
    case "ufo": {
      // Always flap
      state.vy = -UFO_FLAP * state.gravityDir;
      sfxJump();
      break;
    }
    case "ball": {
      // Swap gravity (only while on a surface)
      if (state.onGround) {
        state.gravityDir = state.gravityDir === 1 ? -1 : 1;
        state.vy = 0;
        state.onGround = false;
        sfxJump();
      }
      break;
    }
    case "spider": {
      // Teleport instantly to the opposite surface (ceiling <-> floor)
      const groundTop = state.height - groundPx(state.height);
      const ceilingTop = 0;
      const fromY = state.py;
      // Snap to opposite surface based on current gravity
      if (state.gravityDir === 1) {
        // currently floor-bound -> teleport to ceiling
        state.py = ceilingTop + PLAYER_SIZE / 2 - 4;
      } else {
        state.py = groundTop - PLAYER_SIZE / 2 + 4;
      }
      state.gravityDir = state.gravityDir === 1 ? -1 : 1;
      state.vy = 0;
      state.onGround = true;
      // Draw a vertical trace as particles
      const steps = 12;
      const x = state.px;
      for (let i = 0; i < steps; i++) {
        const ty = fromY + ((state.py - fromY) * i) / steps;
        state.particles.push({
          x: x + state.scrollX, y: ty,
          vx: 0, vy: 0,
          life: 0, max: 0.35,
          color: state.skin.glow,
          size: 5,
        });
      }
      sfxPortal();
      break;
    }
    case "swing": {
      // Swap gravity in mid-air freely
      state.gravityDir = state.gravityDir === 1 ? -1 : 1;
      state.vy = 0;
      sfxJump();
      break;
    }
    case "robot": {
      if (state.onGround) {
        state.vy = -ROBOT_JUMP * state.gravityDir;
        state.onGround = false;
        sfxJump();
      }
      break;
    }
    // ship & wave: handled by holding flag, but a tap also triggers a small effect
    case "ship":
    case "wave":
      sfxJump();
      break;
  }
}

export function setHolding(state: GameState, holding: boolean) {
  state.holding = holding;
}

function spawnParticles(state: GameState, x: number, y: number, color: string, count = 24) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 120 + Math.random() * 320;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0,
      max: 0.5 + Math.random() * 0.5,
      color,
      size: 3 + Math.random() * 4,
    });
  }
}

interface ObstacleRect {
  left: number; right: number; top: number; bottom: number; lethal: boolean; landable: boolean; obstacle: Obstacle;
}

function obstacleRects(state: GameState): ObstacleRect[] {
  const rects: ObstacleRect[] = [];
  const groundTop = state.height - groundPx(state.height);
  const viewLeft = state.scrollX - TILE * 2;
  const viewRight = state.scrollX + state.width + TILE * 2;
  for (const o of state.obstacles) {
    const ox = o.x * TILE;
    if (ox < viewLeft || ox > viewRight) continue;
    switch (o.type) {
      case "spike": {
        rects.push({
          left: ox + 6, right: ox + TILE - 6,
          top: groundTop - TILE + 8, bottom: groundTop,
          lethal: true, landable: false, obstacle: o,
        });
        break;
      }
      case "spike3": {
        for (let i = 0; i < 3; i++) {
          rects.push({
            left: ox + i * TILE + 6, right: ox + i * TILE + TILE - 6,
            top: groundTop - TILE + 8, bottom: groundTop,
            lethal: true, landable: false, obstacle: o,
          });
        }
        break;
      }
      case "block": {
        rects.push({
          left: ox, right: ox + TILE,
          top: groundTop - TILE, bottom: groundTop,
          lethal: false, landable: true, obstacle: o,
        });
        break;
      }
      case "tall": {
        rects.push({
          left: ox, right: ox + TILE,
          top: groundTop - TILE * 2, bottom: groundTop,
          lethal: false, landable: true, obstacle: o,
        });
        break;
      }
      case "platform": {
        const yTiles = o.y ?? 3;
        rects.push({
          left: ox, right: ox + TILE * 2,
          top: groundTop - TILE * yTiles, bottom: groundTop - TILE * yTiles + 14,
          lethal: false, landable: true, obstacle: o,
        });
        break;
      }
      case "pad": {
        rects.push({
          left: ox + 4, right: ox + TILE - 4,
          top: groundTop - 10, bottom: groundTop,
          lethal: false, landable: false, obstacle: o,
        });
        break;
      }
      case "portal-grav":
      case "portal-cube":
      case "portal-ship":
      case "portal-ball":
      case "portal-ufo":
      case "portal-wave":
      case "portal-robot":
      case "portal-spider":
      case "portal-swing": {
        rects.push({
          left: ox + 8, right: ox + TILE - 8,
          top: 0, bottom: groundTop,
          lethal: false, landable: false, obstacle: o,
        });
        break;
      }
    }
  }
  return rects;
}

function aabbOverlap(a: { left: number; right: number; top: number; bottom: number }, b: { left: number; right: number; top: number; bottom: number }) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function modeFromPortal(type: Obstacle["type"]): GameMode | null {
  switch (type) {
    case "portal-cube":   return "cube";
    case "portal-ship":   return "ship";
    case "portal-ball":   return "ball";
    case "portal-ufo":    return "ufo";
    case "portal-wave":   return "wave";
    case "portal-robot":  return "robot";
    case "portal-spider": return "spider";
    case "portal-swing":  return "swing";
    default: return null;
  }
}

function applyModePhysics(state: GameState, dt: number) {
  switch (state.mode) {
    case "cube":
    case "robot": {
      let g = GRAVITY;
      if (state.mode === "robot" && state.holding && !state.onGround && state.vy * state.gravityDir < 0) {
        // While holding & moving up, reduce effective gravity for higher jump
        g -= ROBOT_HOLD_BOOST;
      }
      state.vy += g * state.gravityDir * dt;
      break;
    }
    case "ball": {
      state.vy += GRAVITY * BALL_GRAVITY_MULT * state.gravityDir * dt;
      break;
    }
    case "spider": {
      state.vy += SPIDER_GRAVITY * state.gravityDir * dt;
      break;
    }
    case "ship": {
      // hold = thrust opposite gravity
      const dir = state.holding ? -state.gravityDir : state.gravityDir;
      state.vy += SHIP_THRUST * dir * dt;
      // clamp
      if (state.vy > SHIP_MAX_SPEED) state.vy = SHIP_MAX_SPEED;
      if (state.vy < -SHIP_MAX_SPEED) state.vy = -SHIP_MAX_SPEED;
      break;
    }
    case "ufo": {
      state.vy += GRAVITY * 0.85 * state.gravityDir * dt;
      break;
    }
    case "wave": {
      // diagonal: vy = ±WAVE_SPEED based on holding
      state.vy = state.holding ? -WAVE_SPEED * state.gravityDir : WAVE_SPEED * state.gravityDir;
      break;
    }
    case "swing": {
      state.vy += GRAVITY * SWING_GRAVITY_MULT * state.gravityDir * dt;
      break;
    }
  }
  state.py += state.vy * dt;
}

export function update(state: GameState, dt: number) {
  if (!state.alive || state.finished) return;

  state.scrollX += SCROLL_SPEED * dt;
  if (!state.endless) {
    const totalPx = state.level.length * TILE;
    state.progress = Math.min(1, state.scrollX / totalPx);
    if (state.progress >= 1) {
      state.finished = true;
      sfxVictory();
      addShake(state, 6, 0.4);
      spawnParticles(state, state.px, state.py, state.skin.glow, 60);
      return;
    }
  } else {
    const generatedEnd = state.endlessChunksGenerated * 24 * TILE;
    if (state.scrollX + state.width * 2 > generatedEnd) {
      const more = generateEndlessObstacles(Math.floor(Math.random() * 1e6) + state.endlessChunksGenerated, 8, state.startMode);
      const offsetTiles = state.endlessChunksGenerated * 24;
      for (const o of more) state.obstacles.push({ ...o, x: o.x + offsetTiles });
      state.endlessChunksGenerated += 8;
    }
  }

  applyModePhysics(state, dt);

  const groundTop = state.height - groundPx(state.height);
  const ceilingTop = 0;

  const playerWorldX = state.scrollX + state.px;
  const aabb = {
    left: playerWorldX - PLAYER_SIZE / 2 + 4,
    right: playerWorldX + PLAYER_SIZE / 2 - 4,
    top: state.py - PLAYER_SIZE / 2 + 4,
    bottom: state.py + PLAYER_SIZE / 2 - 4,
  };

  // Ground / ceiling collisions
  let landed = false;
  if (aabb.bottom >= groundTop) {
    state.py = groundTop - PLAYER_SIZE / 2 + 4;
    if (state.gravityDir === 1) {
      state.vy = 0;
      landed = true;
    } else {
      // Hit floor while gravity inverted: depends on mode
      if (state.mode === "ship" || state.mode === "ufo" || state.mode === "wave" || state.mode === "swing") {
        die(state); return;
      }
      state.vy = 0;
      landed = true;
    }
  }
  if (aabb.top <= ceilingTop) {
    state.py = ceilingTop + PLAYER_SIZE / 2 - 4;
    if (state.gravityDir === -1) {
      state.vy = 0;
      landed = true;
    } else {
      if (state.mode === "ship" || state.mode === "ufo" || state.mode === "wave" || state.mode === "swing") {
        die(state); return;
      }
      state.vy = 0;
      landed = true;
    }
  }

  // Obstacles
  const rects = obstacleRects(state);
  for (const r of rects) {
    if (!aabbOverlap(aabb, r)) continue;

    // Mode portals
    const newMode = modeFromPortal(r.obstacle.type);
    if (newMode) {
      if (state.mode !== newMode) {
        state.mode = newMode;
        state.vy = 0;
        // If switching to ground-based mode while in air, do NOT snap — let them fall
        sfxPortal();
        spawnParticles(state, state.px, state.py, "#a78bfa", 40);
        addShake(state, 4, 0.18);
      }
      continue;
    }
    if (r.obstacle.type === "portal-grav") {
      state.gravityDir = state.gravityDir === 1 ? -1 : 1;
      state.vy = 0;
      sfxPortal();
      spawnParticles(state, state.px, state.py, "#a78bfa", 24);
      addShake(state, 3, 0.15);
      continue;
    }
    if (r.obstacle.type === "pad") {
      if (state.lastPadTile !== r.obstacle.x) {
        state.vy = -PAD_VELOCITY * state.gravityDir;
        state.onGround = false;
        state.lastPadTile = r.obstacle.x;
        sfxPad();
        spawnParticles(state, state.px, state.py + PLAYER_SIZE / 2, "#facc15", 22);
        addShake(state, 3, 0.12);
      }
      continue;
    }
    if (r.lethal) {
      die(state);
      return;
    }
    if (r.landable) {
      const prevBottom = aabb.bottom - state.vy * dt;
      const prevTop = aabb.top - state.vy * dt;
      if (state.gravityDir === 1 && prevBottom <= r.top + 2 && state.vy >= 0) {
        state.py = r.top - PLAYER_SIZE / 2 + 4;
        state.vy = 0;
        landed = true;
      } else if (state.gravityDir === -1 && prevTop >= r.bottom - 2 && state.vy <= 0) {
        state.py = r.bottom + PLAYER_SIZE / 2 - 4;
        state.vy = 0;
        landed = true;
      } else {
        die(state);
        return;
      }
    }
  }

  state.onGround = landed;

  // Rotation
  if (state.mode === "cube" || state.mode === "robot") {
    if (state.onGround) {
      const target = Math.round(state.rotation / (Math.PI / 2)) * (Math.PI / 2);
      state.rotation += (target - state.rotation) * Math.min(1, dt * 18);
    } else {
      state.rotation += dt * 7 * state.gravityDir;
    }
  } else if (state.mode === "ship" || state.mode === "wave") {
    // Tilt based on vy
    const target = Math.max(-0.6, Math.min(0.6, state.vy / 800));
    state.rotation += (target - state.rotation) * Math.min(1, dt * 14);
  } else if (state.mode === "ball" || state.mode === "spider" || state.mode === "swing") {
    state.rotation += dt * 8 * state.gravityDir;
  } else if (state.mode === "ufo") {
    const target = Math.max(-0.3, Math.min(0.3, state.vy / 1200));
    state.rotation += (target - state.rotation) * Math.min(1, dt * 12);
  }

  // Wave trail
  if (state.mode === "wave") {
    state.waveTrail.push({ x: state.scrollX + state.px, y: state.py });
    if (state.waveTrail.length > 80) state.waveTrail.shift();
  } else if (state.waveTrail.length) {
    state.waveTrail.length = 0;
  }

  // Particles
  for (const p of state.particles) {
    p.life += dt;
    p.vy += 600 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  state.particles = state.particles.filter((p) => p.life < p.max);

  // Trail
  if (state.alive && state.mode !== "wave" && Math.random() < 0.6) {
    state.particles.push({
      x: state.px - PLAYER_SIZE / 2 + state.scrollX,
      y: state.py + (state.gravityDir === 1 ? PLAYER_SIZE / 4 : -PLAYER_SIZE / 4),
      vx: -60, vy: 0,
      life: 0, max: 0.4,
      color: state.skin.glow + "cc",
      size: 4,
    });
  }

  if (state.flashTime > 0) state.flashTime = Math.max(0, state.flashTime - dt);
  if (state.shake > 0) {
    state.shake = Math.max(0, state.shake - dt);
    if (state.shake === 0) state.shakeAmp = 0;
  }
}

function die(state: GameState) {
  state.alive = false;
  state.flashTime = 0.25;
  spawnParticles(state, state.px, state.py, state.skin.glow, 60);
  addShake(state, 10, 0.45);
  sfxCrash();
}

export function render(ctx: CanvasRenderingContext2D, state: GameState, accent: string) {
  const w = state.width;
  const h = state.height;
  const groundTop = h - groundPx(h);
  ctx.clearRect(0, 0, w, h);

  // Camera shake offset (also affects HUD-overlap visually)
  let shakeX = 0, shakeY = 0;
  if (state.shake > 0 && state.shakeAmp > 0) {
    shakeX = (Math.random() - 0.5) * 2 * state.shakeAmp;
    shakeY = (Math.random() - 0.5) * 2 * state.shakeAmp;
  }
  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawGridBackground(ctx, state, accent);

  // Ground
  const grad = ctx.createLinearGradient(0, groundTop, 0, h);
  grad.addColorStop(0, "rgba(0,0,0,0.55)");
  grad.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundTop, w, h - groundTop);

  // Ceiling strip
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, 0, w, 10);

  // Neon ground line
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(0, groundTop);
  ctx.lineTo(w, groundTop);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Wave trail
  if (state.mode === "wave" && state.waveTrail.length > 1) {
    ctx.strokeStyle = state.skin.glow;
    ctx.lineWidth = 3;
    ctx.shadowColor = state.skin.glow;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    for (let i = 0; i < state.waveTrail.length; i++) {
      const p = state.waveTrail[i];
      const sx = p.x - state.scrollX;
      if (i === 0) ctx.moveTo(sx, p.y); else ctx.lineTo(sx, p.y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Obstacles
  const rects = obstacleRects(state);
  for (const r of rects) {
    const sx = r.left - state.scrollX;
    const sw = r.right - r.left;
    const sh = r.bottom - r.top;
    drawObstacle(ctx, r.obstacle.type, sx, r.top, sw, sh, accent);
  }

  // Particles
  for (const p of state.particles) {
    const t = 1 - p.life / p.max;
    ctx.globalAlpha = Math.max(0, t);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - state.scrollX - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // Player
  if (state.alive) drawPlayer(ctx, state);

  ctx.restore();

  // Death flash (no shake)
  if (state.flashTime > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.flashTime * 1.4})`;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawGridBackground(ctx: CanvasRenderingContext2D, state: GameState, accent: string) {
  const w = state.width;
  const h = state.height;
  const groundTop = h - groundPx(state.height);

  ctx.strokeStyle = `${accent}33`;
  ctx.lineWidth = 1;
  const offset = state.scrollX % TILE;
  for (let x = -offset; x < w; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, groundTop);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = groundTop; y < h; y += TILE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = `${accent}1a`;
  const skyOffset = (state.scrollX * 0.3) % (TILE * 2);
  for (let x = -skyOffset; x < w; x += TILE * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, groundTop);
    ctx.stroke();
  }
  for (let y = 0; y < groundTop; y += TILE * 2) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function portalColors(type: string): { ring: string; label: string } {
  switch (type) {
    case "portal-cube":   return { ring: "#f472b6", label: "C" };
    case "portal-ship":   return { ring: "#fb923c", label: "S" };
    case "portal-ball":   return { ring: "#fde047", label: "B" };
    case "portal-ufo":    return { ring: "#22d3ee", label: "U" };
    case "portal-wave":   return { ring: "#a78bfa", label: "W" };
    case "portal-robot":  return { ring: "#34d399", label: "R" };
    case "portal-spider": return { ring: "#f87171", label: "X" };
    case "portal-swing":  return { ring: "#e879f9", label: "G" };
    case "portal-grav":   return { ring: "#a78bfa", label: "↕" };
    default:              return { ring: "#fff", label: "" };
  }
}

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  type: string,
  x: number, y: number, w: number, h: number,
  accent: string,
) {
  ctx.save();
  switch (type) {
    case "spike":
    case "spike3": {
      ctx.fillStyle = "#fff";
      ctx.shadowColor = accent;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
    case "block":
    case "tall": {
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, "rgba(255,255,255,0.95)");
      grad.addColorStop(1, "rgba(255,255,255,0.7)");
      ctx.fillStyle = grad;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 18;
      ctx.fillRect(x, y, w, h);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      break;
    }
    case "platform": {
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 18;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(x, y, w, 4);
      break;
    }
    case "pad": {
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - 2, w / 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 6, y + h - 14);
      ctx.lineTo(x + w / 2, y + h - 22);
      ctx.lineTo(x + w / 2 + 6, y + h - 14);
      ctx.stroke();
      break;
    }
    default: {
      // Portals (mode + grav). All drawn as a vertical pill with a label.
      const { ring, label } = portalColors(type);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.strokeStyle = ring;
      ctx.shadowColor = ring;
      ctx.shadowBlur = 22;
      ctx.lineWidth = 3;
      const cx = x + w / 2;
      const rx = w / 2 + 2;
      const ry = h / 2;
      ctx.beginPath();
      ctx.ellipse(cx, y + ry, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px 'Russo One', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, cx, y + ry);
      break;
    }
  }
  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  ctx.translate(state.px, state.py);
  ctx.rotate(state.rotation);
  const s = PLAYER_SIZE;
  const skin = state.skin;
  const pattern = skin.icons[state.mode] ?? 0;

  ctx.shadowColor = skin.glow;
  ctx.shadowBlur = 28;

  switch (state.mode) {
    case "cube": {
      drawCubeBody(ctx, s, skin);
      drawIconPattern(ctx, pattern, s, skin);
      break;
    }
    case "robot": {
      drawRobotBody(ctx, s, skin);
      ctx.save();
      ctx.translate(0, -3);
      ctx.scale(0.8, 0.8);
      drawIconPattern(ctx, pattern, s, skin);
      ctx.restore();
      break;
    }
    case "ship": {
      drawShipBody(ctx, s, skin);
      ctx.save();
      ctx.scale(0.7, 0.7);
      drawIconPattern(ctx, pattern, s, skin);
      ctx.restore();
      break;
    }
    case "ball": {
      drawBallBody(ctx, s, skin);
      ctx.save();
      ctx.scale(0.85, 0.85);
      drawIconPattern(ctx, pattern, s, skin);
      ctx.restore();
      break;
    }
    case "ufo": {
      drawUfoBody(ctx, s, skin);
      ctx.save();
      ctx.translate(0, -2);
      ctx.scale(0.6, 0.6);
      drawIconPattern(ctx, pattern, s, skin);
      ctx.restore();
      break;
    }
    case "wave": {
      drawWaveBody(ctx, s, skin);
      break;
    }
    case "spider": {
      drawSpiderBody(ctx, s, skin);
      ctx.save();
      ctx.scale(0.8, 0.8);
      drawIconPattern(ctx, pattern, s, skin);
      ctx.restore();
      break;
    }
    case "swing": {
      drawSwingBody(ctx, s, skin);
      ctx.save();
      ctx.scale(0.75, 0.75);
      drawIconPattern(ctx, pattern, s, skin);
      ctx.restore();
      break;
    }
  }

  ctx.restore();
}

function drawCubeBody(ctx: CanvasRenderingContext2D, s: number, skin: PlayerSkin) {
  const grad = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
  grad.addColorStop(0, skin.primary);
  grad.addColorStop(1, skin.secondary);
  ctx.fillStyle = grad;
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(-s / 2 + 1, -s / 2 + 1, s - 2, s - 2);
}

function drawRobotBody(ctx: CanvasRenderingContext2D, s: number, skin: PlayerSkin) {
  const torsoH = s * 0.7;
  const torsoW = s * 0.85;
  const grad = ctx.createLinearGradient(-torsoW / 2, -torsoH / 2, torsoW / 2, torsoH / 2);
  grad.addColorStop(0, skin.primary);
  grad.addColorStop(1, skin.secondary);
  ctx.fillStyle = grad;
  const r = 4;
  ctx.beginPath();
  ctx.moveTo(-torsoW / 2 + r, -torsoH / 2);
  ctx.lineTo(torsoW / 2 - r, -torsoH / 2);
  ctx.quadraticCurveTo(torsoW / 2, -torsoH / 2, torsoW / 2, -torsoH / 2 + r);
  ctx.lineTo(torsoW / 2, torsoH / 2 - r);
  ctx.quadraticCurveTo(torsoW / 2, torsoH / 2, torsoW / 2 - r, torsoH / 2);
  ctx.lineTo(-torsoW / 2 + r, torsoH / 2);
  ctx.quadraticCurveTo(-torsoW / 2, torsoH / 2, -torsoW / 2, torsoH / 2 - r);
  ctx.lineTo(-torsoW / 2, -torsoH / 2 + r);
  ctx.quadraticCurveTo(-torsoW / 2, -torsoH / 2, -torsoW / 2 + r, -torsoH / 2);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
  // Antenna
  ctx.strokeStyle = skin.secondary;
  ctx.beginPath();
  ctx.moveTo(0, -torsoH / 2);
  ctx.lineTo(0, -s / 2 + 2);
  ctx.stroke();
  ctx.fillStyle = skin.glow;
  ctx.beginPath();
  ctx.arc(0, -s / 2 + 2, 3, 0, Math.PI * 2);
  ctx.fill();
  // Legs
  ctx.fillStyle = skin.secondary;
  ctx.fillRect(-torsoW / 2 + 2, torsoH / 2, 7, s / 2 - torsoH / 2);
  ctx.fillRect(torsoW / 2 - 9, torsoH / 2, 7, s / 2 - torsoH / 2);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-torsoW / 2 + 2, torsoH / 2, 7, s / 2 - torsoH / 2);
  ctx.strokeRect(torsoW / 2 - 9, torsoH / 2, 7, s / 2 - torsoH / 2);
}

function drawShipBody(ctx: CanvasRenderingContext2D, s: number, skin: PlayerSkin) {
  // Jet/ship: pointed nose right, swept wings, flat tail
  const grad = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
  grad.addColorStop(0, skin.primary);
  grad.addColorStop(1, skin.secondary);
  ctx.fillStyle = grad;
  ctx.beginPath();
  // nose
  ctx.moveTo(s / 2, 0);
  // top wing
  ctx.lineTo(s / 6, -s / 3);
  ctx.lineTo(-s / 2, -s / 2);
  ctx.lineTo(-s / 2 + 6, -s / 6);
  // tail
  ctx.lineTo(-s / 2 + 2, 0);
  ctx.lineTo(-s / 2 + 6, s / 6);
  // bottom wing
  ctx.lineTo(-s / 2, s / 2);
  ctx.lineTo(s / 6, s / 3);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cockpit
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.beginPath();
  ctx.ellipse(s / 8, -2, 7, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Engine flame
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.moveTo(-s / 2 + 2, -3);
  ctx.lineTo(-s / 2 - 6, 0);
  ctx.lineTo(-s / 2 + 2, 3);
  ctx.closePath();
  ctx.fill();
}

function drawBallBody(ctx: CanvasRenderingContext2D, s: number, skin: PlayerSkin) {
  const grad = ctx.createRadialGradient(-s / 6, -s / 6, 2, 0, 0, s / 2);
  grad.addColorStop(0, skin.primary);
  grad.addColorStop(1, skin.secondary);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawUfoBody(ctx: CanvasRenderingContext2D, s: number, skin: PlayerSkin) {
  // Dome on top, disc below
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.ellipse(0, -4, s / 2 - 8, s / 2 - 8, 0, Math.PI, 0);
  ctx.fill();
  const grad = ctx.createLinearGradient(0, 0, 0, s / 2);
  grad.addColorStop(0, skin.primary);
  grad.addColorStop(1, skin.secondary);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 4, s / 2, s / 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawWaveBody(ctx: CanvasRenderingContext2D, s: number, skin: PlayerSkin) {
  const grad = ctx.createLinearGradient(-s / 2, 0, s / 2, 0);
  grad.addColorStop(0, skin.primary);
  grad.addColorStop(1, skin.secondary);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -s / 3);
  ctx.lineTo(s / 3, 0);
  ctx.lineTo(0, s / 3);
  ctx.lineTo(-s / 3, 0);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSpiderBody(ctx: CanvasRenderingContext2D, s: number, skin: PlayerSkin) {
  drawCubeBody(ctx, s * 0.85, skin);
  // 4 little legs
  ctx.shadowBlur = 0;
  ctx.strokeStyle = skin.secondary;
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath();
    ctx.moveTo(i * s / 2.4, -s / 4);
    ctx.lineTo(i * s / 1.7, -s / 2);
    ctx.moveTo(i * s / 2.4, s / 4);
    ctx.lineTo(i * s / 1.7, s / 2);
    ctx.stroke();
  }
}

function drawSwingBody(ctx: CanvasRenderingContext2D, s: number, skin: PlayerSkin) {
  // Two stacked triangles (top + bottom)
  const grad = ctx.createLinearGradient(0, -s / 2, 0, s / 2);
  grad.addColorStop(0, skin.primary);
  grad.addColorStop(1, skin.secondary);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-s / 2, -2);
  ctx.lineTo(s / 2, -2);
  ctx.lineTo(0, -s / 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-s / 2, 2);
  ctx.lineTo(s / 2, 2);
  ctx.lineTo(0, s / 2);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function reset(state: GameState) {
  const fresh = createGame(state.level, { endless: state.endless, width: state.width, height: state.height, startMode: state.startMode });
  Object.assign(state, fresh, { attempts: state.attempts + 1 });
}
