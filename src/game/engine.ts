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

// Mode-specific constants — tuned to give every mode a distinct feel.
// Cube: classic snappy jump (uses GRAVITY + JUMP_VELOCITY directly).
const CUBE_GRAVITY_MULT = 1.05; // slightly punchier than default

// Ship: smooth thrust, capped speed for control, mild auto-damping when not holding.
const SHIP_THRUST = 2600;
const SHIP_MAX_SPEED = 620;
const SHIP_GRAVITY_MULT = 0.9;

// UFO: floaty hopper. Lower gravity, softer flap so each tap feels weightless.
const UFO_FLAP = 620;
const UFO_GRAVITY_MULT = 0.7;

// Wave: instant diagonal, faster than other modes for that "knife" feel.
const WAVE_SPEED = 560;

// Ball: heavy gravity = decisive flips, fast spin.
const BALL_GRAVITY_MULT = 1.55;

// Robot: short tap = small hop, hold = high arc. Bigger hold boost than before.
const ROBOT_JUMP = 720;
const ROBOT_HOLD_BOOST = 1400;

// Spider: brutal gravity so snaps land instantly with no hangtime.
const SPIDER_GRAVITY = 3400;

// Swing: copter-style. Holding gives a brief hover (reduced gravity), tap flips.
const SWING_GRAVITY_MULT = 1.1;
const SWING_HOLD_GRAVITY_MULT = 0.35;

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
      case "spike-ceil": {
        rects.push({
          left: ox + 6, right: ox + TILE - 6,
          top: 0, bottom: TILE - 8,
          lethal: true, landable: false, obstacle: o,
        });
        break;
      }
      case "spike3-ceil": {
        for (let i = 0; i < 3; i++) {
          rects.push({
            left: ox + i * TILE + 6, right: ox + i * TILE + TILE - 6,
            top: 0, bottom: TILE - 8,
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
      case "block-ceil": {
        rects.push({
          left: ox, right: ox + TILE,
          top: 0, bottom: TILE,
          lethal: false, landable: true, obstacle: o,
        });
        break;
      }
      case "tall-ceil": {
        rects.push({
          left: ox, right: ox + TILE,
          top: 0, bottom: TILE * 2,
          lethal: false, landable: true, obstacle: o,
        });
        break;
      }
      case "slope-up":
      case "slope-down": {
        // 45° floor ramp spanning `hTiles` tiles wide and `hTiles` tiles tall.
        // slope-up: top edge rises from y=baseTiles at left to baseTiles+hTiles at right.
        // slope-down: top edge falls from y=baseTiles at left to baseTiles-hTiles at right.
        const baseTiles = o.y ?? 0;
        const hTiles = Math.max(1, o.h ?? 1);
        const widthPx = hTiles * TILE;
        const STEPS = 6 * hTiles;
        for (let i = 0; i < STEPS; i++) {
          const t0 = i / STEPS;
          const t1 = (i + 1) / STEPS;
          const tMax = Math.max(t0, t1);
          const tMin = Math.min(t0, t1);
          // Use the higher (more conservative) end so the player can't clip into the slope.
          const heightTiles = o.type === "slope-up"
            ? baseTiles + tMax * hTiles
            : baseTiles - tMin * hTiles;
          rects.push({
            left: ox + i * (widthPx / STEPS),
            right: ox + (i + 1) * (widthPx / STEPS),
            top: groundTop - heightTiles * TILE,
            bottom: groundTop,
            lethal: false, landable: true, obstacle: o,
          });
        }
        break;
      }
      case "slope-up-ceil":
      case "slope-down-ceil": {
        // 45° ceiling ramp spanning `hTiles` tiles wide and `hTiles` tiles tall.
        const baseTiles = o.y ?? 0;
        const hTiles = Math.max(1, o.h ?? 1);
        const widthPx = hTiles * TILE;
        const STEPS = 6 * hTiles;
        for (let i = 0; i < STEPS; i++) {
          const t0 = i / STEPS;
          const t1 = (i + 1) / STEPS;
          const tMax = Math.max(t0, t1);
          const tMin = Math.min(t0, t1);
          const heightTiles = o.type === "slope-up-ceil"
            ? baseTiles - tMin * hTiles
            : baseTiles + tMax * hTiles;
          rects.push({
            left: ox + i * (widthPx / STEPS),
            right: ox + (i + 1) * (widthPx / STEPS),
            top: 0,
            bottom: heightTiles * TILE,
            lethal: false, landable: true, obstacle: o,
          });
        }
        break;
      }
      case "coin": {
        // Visual only — provide a small rect for rendering, no collision side effects.
        const yTiles = o.y ?? 3;
        const cy = groundTop - yTiles * TILE;
        rects.push({
          left: ox + 8, right: ox + TILE - 8,
          top: cy - 10, bottom: cy + 10,
          lethal: false, landable: false, obstacle: o,
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
    case "cube": {
      state.vy += GRAVITY * CUBE_GRAVITY_MULT * state.gravityDir * dt;
      break;
    }
    case "robot": {
      let g = GRAVITY;
      if (state.holding && !state.onGround && state.vy * state.gravityDir < 0) {
        // While holding & moving up, reduce effective gravity for a higher arc.
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
      // hold = thrust opposite gravity; otherwise gentle gravity pulls you back.
      if (state.holding) {
        state.vy += -SHIP_THRUST * state.gravityDir * dt;
      } else {
        state.vy += GRAVITY * SHIP_GRAVITY_MULT * state.gravityDir * dt;
        // Mild damping so the ship feels controllable when coasting.
        state.vy *= Math.pow(0.92, dt * 60);
      }
      if (state.vy > SHIP_MAX_SPEED) state.vy = SHIP_MAX_SPEED;
      if (state.vy < -SHIP_MAX_SPEED) state.vy = -SHIP_MAX_SPEED;
      break;
    }
    case "ufo": {
      state.vy += GRAVITY * UFO_GRAVITY_MULT * state.gravityDir * dt;
      break;
    }
    case "wave": {
      // Pure diagonal — vy is locked to ±WAVE_SPEED based on input.
      state.vy = state.holding ? -WAVE_SPEED * state.gravityDir : WAVE_SPEED * state.gravityDir;
      break;
    }
    case "swing": {
      // Holding briefly lightens gravity for a copter-like hover.
      const mult = state.holding ? SWING_HOLD_GRAVITY_MULT : SWING_GRAVITY_MULT;
      state.vy += GRAVITY * mult * state.gravityDir * dt;
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

  // Rotation — distinct feel per mode.
  if (state.mode === "cube") {
    if (state.onGround) {
      const target = Math.round(state.rotation / (Math.PI / 2)) * (Math.PI / 2);
      state.rotation += (target - state.rotation) * Math.min(1, dt * 22);
    } else {
      state.rotation += dt * 8 * state.gravityDir;
    }
  } else if (state.mode === "robot") {
    // Robot: heavier, slower spin to feel mechanical.
    if (state.onGround) {
      const target = Math.round(state.rotation / (Math.PI / 2)) * (Math.PI / 2);
      state.rotation += (target - state.rotation) * Math.min(1, dt * 14);
    } else {
      state.rotation += dt * 4 * state.gravityDir;
    }
  } else if (state.mode === "ship") {
    // Ship: pronounced pitch from vertical velocity.
    const target = Math.max(-0.7, Math.min(0.7, state.vy / 700)) * state.gravityDir;
    state.rotation += (target - state.rotation) * Math.min(1, dt * 16);
  } else if (state.mode === "wave") {
    // Wave: hard 45° lock based on direction (no easing — knife-feel).
    state.rotation = (state.holding ? -0.78 : 0.78) * state.gravityDir;
  } else if (state.mode === "ball") {
    // Ball: spin proportional to scroll, faster than passive rotators.
    state.rotation += dt * 12 * state.gravityDir;
  } else if (state.mode === "spider") {
    // Spider: snap-rotate toward upright orientation; barely spins otherwise.
    const target = state.gravityDir === 1 ? 0 : Math.PI;
    state.rotation += (target - state.rotation) * Math.min(1, dt * 24);
  } else if (state.mode === "swing") {
    // Swing: gentler rotation, kicks when input held.
    state.rotation += dt * (state.holding ? 10 : 5) * state.gravityDir;
  } else if (state.mode === "ufo") {
    const target = Math.max(-0.25, Math.min(0.25, state.vy / 1400)) * state.gravityDir;
    state.rotation += (target - state.rotation) * Math.min(1, dt * 10);
  }

  // Wave trail — longer ribbon now that wave is faster.
  if (state.mode === "wave") {
    state.waveTrail.push({ x: state.scrollX + state.px, y: state.py });
    if (state.waveTrail.length > 110) state.waveTrail.shift();
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
  drawDecorations(ctx, state, accent);

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

  // Obstacles. For slopes, the obstacleRects function emits multiple sub-rects
  // (for staircase collision); we draw each slope only once using its full bbox.
  const rects = obstacleRects(state);
  const groundTopForDraw = state.height - groundPx(state.height);
  const drawnSlopes = new Set<Obstacle>();
  for (const r of rects) {
    const t = r.obstacle.type;
    if (t === "slope-up" || t === "slope-down" || t === "slope-up-ceil" || t === "slope-down-ceil") {
      if (drawnSlopes.has(r.obstacle)) continue;
      drawnSlopes.add(r.obstacle);
      const ox = r.obstacle.x * TILE - state.scrollX;
      const base = r.obstacle.y ?? 0;
      const hT = Math.max(1, r.obstacle.h ?? 1);
      const widthPx = hT * TILE;
      if (t === "slope-up") {
        // bbox: from ground up to (base+hT) tiles, width = hT tiles.
        const top = groundTopForDraw - (base + hT) * TILE;
        drawObstacle(ctx, t, ox, top, widthPx, (base + hT) * TILE, accent);
      } else if (t === "slope-down") {
        const top = groundTopForDraw - base * TILE;
        drawObstacle(ctx, t, ox, top, widthPx, base * TILE, accent);
      } else if (t === "slope-up-ceil") {
        drawObstacle(ctx, t, ox, 0, widthPx, base * TILE, accent);
      } else {
        drawObstacle(ctx, t, ox, 0, widthPx, (base + hT) * TILE, accent);
      }
      continue;
    }
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

function drawDecorations(ctx: CanvasRenderingContext2D, state: GameState, accent: string) {
  const w = state.width;
  const h = state.height;
  const groundTop = h - groundPx(state.height);
  const theme = state.level.decoration ?? "mountains";
  ctx.save();
  switch (theme) {
    case "mountains": {
      // Two parallax layers of triangular peaks
      const drawLayer = (parallax: number, baseY: number, amp: number, spacing: number, alpha: number, color: string) => {
        const offset = (state.scrollX * parallax) % spacing;
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        for (let x = -offset; x < w + spacing; x += spacing) {
          ctx.beginPath();
          ctx.moveTo(x, baseY);
          ctx.lineTo(x + spacing / 2, baseY - amp);
          ctx.lineTo(x + spacing, baseY);
          ctx.closePath();
          ctx.fill();
        }
      };
      drawLayer(0.15, groundTop, 90, 200, 0.18, accent);
      drawLayer(0.3, groundTop, 60, 130, 0.28, "#ffffff");
      break;
    }
    case "city": {
      // Skyline of buildings with lit windows
      const drawSkyline = (parallax: number, baseY: number, alpha: number, color: string) => {
        const spacing = 70;
        const offset = (state.scrollX * parallax) % spacing;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        for (let i = 0; i < Math.ceil(w / spacing) + 2; i++) {
          const x = -offset + i * spacing;
          // pseudo-random height per slot
          const seed = Math.floor((state.scrollX * parallax) / spacing) + i;
          const hh = 60 + ((seed * 9301 + 49297) % 90);
          ctx.fillRect(x + 4, baseY - hh, spacing - 8, hh);
          // windows
          ctx.fillStyle = accent;
          for (let wy = baseY - hh + 8; wy < baseY - 8; wy += 12) {
            for (let wx = x + 10; wx < x + spacing - 10; wx += 10) {
              if (((seed + wx + wy) % 3) === 0) ctx.fillRect(wx, wy, 4, 4);
            }
          }
          ctx.fillStyle = color;
        }
      };
      drawSkyline(0.2, groundTop, 0.35, "rgba(8,4,20,0.95)");
      drawSkyline(0.45, groundTop, 0.6, "rgba(0,0,0,0.92)");
      break;
    }
    case "stars": {
      // Static star field with slow parallax
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < 80; i++) {
        const seed = i * 9301 + 49297;
        const px = ((seed % 1000) / 1000) * w;
        const py = (((seed * 17) % 1000) / 1000) * groundTop;
        const off = (state.scrollX * 0.05 + (seed % 200)) % w;
        const sx = (px - off + w) % w;
        const size = 1 + (seed % 3);
        ctx.globalAlpha = 0.4 + ((seed % 100) / 200);
        ctx.fillRect(sx, py, size, size);
      }
      // a moon
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(w * 0.8, h * 0.18, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }
    case "waves": {
      // Sine waves in background
      for (let layer = 0; layer < 3; layer++) {
        const parallax = 0.1 + layer * 0.15;
        const amp = 18 + layer * 10;
        const yBase = groundTop - 40 - layer * 30;
        ctx.globalAlpha = 0.18 + layer * 0.1;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const y = yBase + Math.sin((x + state.scrollX * parallax) * 0.02) * amp;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
    case "circuit": {
      // Glowing horizontal traces with nodes
      const spacing = 80;
      const offset = (state.scrollX * 0.4) % spacing;
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 8;
      for (let row = 1; row < 5; row++) {
        const y = (groundTop / 5) * row;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
        for (let x = -offset; x < w + spacing; x += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fillStyle = accent;
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      break;
    }
    case "pyramids": {
      // Sharp neon triangles
      const spacing = 160;
      const offset = (state.scrollX * 0.25) % spacing;
      ctx.globalAlpha = 0.25;
      for (let x = -offset; x < w + spacing; x += spacing) {
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.moveTo(x, groundTop);
        ctx.lineTo(x + spacing / 2, groundTop - 110);
        ctx.lineTo(x + spacing, groundTop);
        ctx.closePath();
        ctx.fill();
        // inner darker triangle
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.moveTo(x + 20, groundTop);
        ctx.lineTo(x + spacing / 2, groundTop - 80);
        ctx.lineTo(x + spacing - 20, groundTop);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "rain": {
      // Diagonal rain streaks
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;
      const t = state.scrollX * 0.6;
      for (let i = 0; i < 60; i++) {
        const seed = i * 9973 + 31;
        const x = ((seed + t) % (w + 100)) - 50;
        const y = ((seed * 7 + t * 1.5) % (groundTop + 100)) - 50;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 6, y + 14);
        ctx.stroke();
      }
      break;
    }
    case "trees": {
      // Pine tree silhouettes
      const spacing = 90;
      const offset = (state.scrollX * 0.3) % spacing;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.globalAlpha = 0.7;
      for (let x = -offset; x < w + spacing; x += spacing) {
        const baseY = groundTop;
        const treeH = 70;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x + spacing / 2, baseY - treeH);
        ctx.lineTo(x + spacing, baseY);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "crystals": {
      // Floating diamond crystals
      const spacing = 130;
      const offset = (state.scrollX * 0.35) % spacing;
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 14;
      for (let x = -offset; x < w + spacing; x += spacing) {
        const seed = Math.floor((state.scrollX * 0.35 + x) / spacing);
        const cy = (groundTop * 0.3) + ((seed % 100) / 100) * (groundTop * 0.4);
        const sz = 14 + (seed % 8);
        ctx.beginPath();
        ctx.moveTo(x, cy - sz);
        ctx.lineTo(x + sz, cy);
        ctx.lineTo(x, cy + sz);
        ctx.lineTo(x - sz, cy);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      break;
    }
    case "skull": {
      // Giant ominous skull silhouette pulsing in the distance
      ctx.globalAlpha = 0.18 + 0.08 * Math.sin(state.scrollX * 0.01);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = accent;
      ctx.shadowBlur = 30;
      const cx = w * 0.78 + Math.sin(state.scrollX * 0.002) * 20;
      const cy = h * 0.32;
      const sz = 110;
      // cranium
      ctx.beginPath();
      ctx.arc(cx, cy, sz, Math.PI, 0);
      ctx.lineTo(cx + sz * 0.7, cy + sz * 0.6);
      ctx.lineTo(cx - sz * 0.7, cy + sz * 0.6);
      ctx.closePath();
      ctx.fill();
      // jaw
      ctx.fillRect(cx - sz * 0.45, cy + sz * 0.6, sz * 0.9, sz * 0.25);
      // eyes
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(cx - sz * 0.35, cy + sz * 0.05, sz * 0.18, 0, Math.PI * 2);
      ctx.arc(cx + sz * 0.35, cy + sz * 0.05, sz * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // glowing eye dots
      ctx.fillStyle = accent;
      ctx.shadowColor = accent;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(cx - sz * 0.35, cy + sz * 0.05, 4, 0, Math.PI * 2);
      ctx.arc(cx + sz * 0.35, cy + sz * 0.05, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      break;
    }
  }
  ctx.restore();
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
    case "spike-ceil":
    case "spike3-ceil": {
      // Inverted spike — apex points down
      ctx.fillStyle = "#fff";
      ctx.shadowColor = accent;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w / 2, y + h);
      ctx.lineTo(x + w, y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
    case "block":
    case "tall":
    case "block-ceil":
    case "tall-ceil": {
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
    case "coin": {
      // Decorative golden coin with pulse
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.fillStyle = "#facc15";
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px 'Russo One', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("$", cx, cy + 1);
      break;
    }
    case "slope-up":
    case "slope-down":
    case "slope-up-ceil":
    case "slope-down-ceil": {
      // The collision rect spans the full triangle bounding box.
      // We render a filled triangle inside (x,y,w,h).
      // Determine triangle orientation by type.
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.shadowColor = accent;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      if (type === "slope-up") {
        // floor going up: bottom-left, bottom-right, top-right
        ctx.moveTo(x, y + h);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x + w, y);
      } else if (type === "slope-down") {
        // floor going down: top-left, bottom-left, bottom-right
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x + w, y + h);
      } else if (type === "slope-up-ceil") {
        // ceiling slope falling away (height shrinks left→right):
        // bbox top is the canvas top, bottom edge is the diagonal.
        // top-left, top-right, bottom-left
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x, y + h);
      } else {
        // slope-down-ceil: ceiling growing left→right
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + h);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.stroke();
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
      drawModePattern(ctx, state.mode, pattern, s, skin);
      break;
    }
    case "robot": {
      drawRobotBody(ctx, s, skin);
      ctx.save();
      ctx.translate(0, -3);
      ctx.scale(0.8, 0.8);
      drawModePattern(ctx, state.mode, pattern, s, skin);
      ctx.restore();
      break;
    }
    case "ship": {
      drawShipBody(ctx, s, skin);
      ctx.save();
      ctx.scale(0.7, 0.7);
      drawModePattern(ctx, state.mode, pattern, s, skin);
      ctx.restore();
      break;
    }
    case "ball": {
      drawBallBody(ctx, s, skin);
      ctx.save();
      ctx.scale(0.85, 0.85);
      drawModePattern(ctx, state.mode, pattern, s, skin);
      ctx.restore();
      break;
    }
    case "ufo": {
      drawUfoBody(ctx, s, skin);
      ctx.save();
      ctx.translate(0, -2);
      ctx.scale(0.6, 0.6);
      drawModePattern(ctx, state.mode, pattern, s, skin);
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
      drawModePattern(ctx, state.mode, pattern, s, skin);
      ctx.restore();
      break;
    }
    case "swing": {
      drawSwingBody(ctx, s, skin);
      ctx.save();
      ctx.scale(0.75, 0.75);
      drawModePattern(ctx, state.mode, pattern, s, skin);
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
