// Geometry-style runner engine.
// Pure functions + an internal state object driven by requestAnimationFrame from the React layer.

import type { LevelDef, Obstacle } from "./levels";
import { generateEndlessObstacles } from "./levels";
import { sfxCrash, sfxJump, sfxPad, sfxPortal } from "./audio";

export const TILE = 40;
export const GROUND_Y_TILES = 2; // ground sits 2 tiles above bottom of canvas
export const PLAYER_SIZE = TILE; // 40px cube
export const SCROLL_SPEED = 360; // px/sec
export const GRAVITY = 2400;
export const JUMP_VELOCITY = 880;
export const PAD_VELOCITY = 1250;

export interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number;
}

export interface GameState {
  // World
  scrollX: number;        // how far the world has moved (px)
  obstacles: Obstacle[];  // sorted by x
  endless: boolean;
  endlessChunksGenerated: number;
  // Player
  px: number;             // fixed screen x of player (px)
  py: number;             // world y of player center (px) — y grows downward
  vy: number;
  onGround: boolean;
  gravityDir: 1 | -1;     // 1 = normal, -1 = flipped
  rotation: number;
  // Meta
  alive: boolean;
  finished: boolean;
  progress: number;       // 0..1 for normal levels
  attempts: number;
  particles: Particle[];
  level: LevelDef;
  width: number;
  height: number;
  // Pad cooldown so we don't double-trigger
  lastPadTile: number;
  flashTime: number;
}

export function createGame(level: LevelDef, opts: { endless?: boolean; width: number; height: number }): GameState {
  const endless = !!opts.endless;
  const obstacles = endless ? generateEndlessObstacles(Math.floor(Math.random() * 1e6), 12) : level.obstacles.slice();
  return {
    scrollX: 0,
    obstacles,
    endless,
    endlessChunksGenerated: endless ? 12 : 0,
    px: opts.width * 0.28,
    py: opts.height - groundPx(opts.height) - PLAYER_SIZE / 2,
    vy: 0,
    onGround: true,
    gravityDir: 1,
    rotation: 0,
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
  };
}

export function groundPx(h: number) {
  return GROUND_Y_TILES * TILE + 0.0 * h; // ground line distance from bottom
}

export function resize(state: GameState, w: number, h: number) {
  state.width = w;
  state.height = h;
  state.px = w * 0.28;
  if (state.onGround && state.gravityDir === 1) {
    state.py = h - groundPx(h) - PLAYER_SIZE / 2;
  }
}

export function jump(state: GameState) {
  if (!state.alive) return;
  if (state.onGround) {
    state.vy = -JUMP_VELOCITY * state.gravityDir;
    state.onGround = false;
    sfxJump();
  }
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

function getPlayerAabb(state: GameState) {
  const half = PLAYER_SIZE / 2;
  // Slightly inset hitbox for fairness
  const inset = 4;
  return {
    left: state.px - half + inset,
    right: state.px + half - inset,
    top: state.py - half + inset,
    bottom: state.py + half - inset,
  };
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
      case "portal-grav": {
        rects.push({
          left: ox + 8, right: ox + TILE - 8,
          top: groundTop - TILE * 3, bottom: groundTop,
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

export function update(state: GameState, dt: number) {
  if (!state.alive || state.finished) return;

  // Scroll & progress
  state.scrollX += SCROLL_SPEED * dt;
  if (!state.endless) {
    const totalPx = state.level.length * TILE;
    state.progress = Math.min(1, state.scrollX / totalPx);
    if (state.progress >= 1) {
      state.finished = true;
      return;
    }
  } else {
    // Generate more endless obstacles when the scroll approaches the end of generated content
    const generatedEnd = state.endlessChunksGenerated * 24 * TILE;
    if (state.scrollX + state.width * 2 > generatedEnd) {
      const more = generateEndlessObstacles(Math.floor(Math.random() * 1e6) + state.endlessChunksGenerated, 8);
      const offsetTiles = state.endlessChunksGenerated * 24;
      for (const o of more) state.obstacles.push({ ...o, x: o.x + offsetTiles });
      state.endlessChunksGenerated += 8;
    }
  }

  // Physics
  state.vy += GRAVITY * state.gravityDir * dt;
  state.py += state.vy * dt;

  const groundTop = state.height - groundPx(state.height);
  const ceilingTop = 0;

  // World x of player based on scroll
  const playerWorldX = state.scrollX + state.px;
  const aabb = {
    left: playerWorldX - PLAYER_SIZE / 2 + 4,
    right: playerWorldX + PLAYER_SIZE / 2 - 4,
    top: state.py - PLAYER_SIZE / 2 + 4,
    bottom: state.py + PLAYER_SIZE / 2 - 4,
  };

  // Ground / ceiling collision
  let landed = false;
  if (state.gravityDir === 1) {
    if (aabb.bottom >= groundTop) {
      state.py = groundTop - PLAYER_SIZE / 2 + 4;
      state.vy = 0;
      landed = true;
    }
  } else {
    if (aabb.top <= ceilingTop) {
      state.py = ceilingTop + PLAYER_SIZE / 2 - 4;
      state.vy = 0;
      landed = true;
    }
  }

  // Obstacle interactions
  const rects = obstacleRects(state);
  for (const r of rects) {
    if (!aabbOverlap(aabb, r)) continue;

    if (r.obstacle.type === "pad") {
      if (state.lastPadTile !== r.obstacle.x) {
        state.vy = -PAD_VELOCITY * state.gravityDir;
        state.onGround = false;
        state.lastPadTile = r.obstacle.x;
        sfxPad();
        spawnParticles(state, state.px, state.py + PLAYER_SIZE / 2, "#facc15", 14);
      }
      continue;
    }
    if (r.obstacle.type === "portal-grav") {
      state.gravityDir = state.gravityDir === 1 ? -1 : 1;
      state.vy = 0;
      sfxPortal();
      continue;
    }
    if (r.lethal) {
      die(state);
      return;
    }
    if (r.landable) {
      // Determine if landing on top vs side hit
      const prevBottom = aabb.bottom - state.vy * dt;
      const prevTop = aabb.top - state.vy * dt;
      if (state.gravityDir === 1 && prevBottom <= r.top + 2 && state.vy >= 0) {
        // landed on top
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

  // Rotation: smooth in air, snap on landing
  if (state.onGround) {
    const target = Math.round(state.rotation / (Math.PI / 2)) * (Math.PI / 2);
    state.rotation += (target - state.rotation) * Math.min(1, dt * 18);
  } else {
    state.rotation += dt * 7 * state.gravityDir;
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
  if (state.alive && Math.random() < 0.6) {
    state.particles.push({
      x: state.px - PLAYER_SIZE / 2,
      y: state.py + (state.gravityDir === 1 ? PLAYER_SIZE / 4 : -PLAYER_SIZE / 4),
      vx: -60, vy: 0,
      life: 0, max: 0.4,
      color: "rgba(236, 72, 153, 0.8)",
      size: 4,
    });
  }

  if (state.flashTime > 0) state.flashTime = Math.max(0, state.flashTime - dt);
}

function die(state: GameState) {
  state.alive = false;
  state.flashTime = 0.25;
  spawnParticles(state, state.px, state.py, "#f472b6", 50);
  sfxCrash();
}

export function render(ctx: CanvasRenderingContext2D, state: GameState, accent: string) {
  const w = state.width;
  const h = state.height;
  const groundTop = h - groundPx(h);
  ctx.clearRect(0, 0, w, h);

  // Parallax grid background
  drawGridBackground(ctx, state, accent);

  // Ground
  const grad = ctx.createLinearGradient(0, groundTop, 0, h);
  grad.addColorStop(0, "rgba(0,0,0,0.55)");
  grad.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundTop, w, h - groundTop);

  // Top "ceiling" strip when gravity is flipped to give visual cue
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

  // Death flash
  if (state.flashTime > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.flashTime * 1.4})`;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawGridBackground(ctx: CanvasRenderingContext2D, state: GameState, accent: string) {
  const w = state.width;
  const h = state.height;
  const groundTop = h - groundPx(state.height);

  // Floor grid (perspective-ish horizontal lines)
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

  // Sky grid (slower parallax)
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
      // For spike3, drawObstacle is called per-spike already.
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
      // arrows
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 6, y + h - 14);
      ctx.lineTo(x + w / 2, y + h - 22);
      ctx.lineTo(x + w / 2 + 6, y + h - 14);
      ctx.stroke();
      break;
    }
    case "portal-grav": {
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.strokeStyle = "#a78bfa";
      ctx.shadowColor = "#a78bfa";
      ctx.shadowBlur = 22;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
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

  // Glow
  ctx.shadowColor = "#ec4899";
  ctx.shadowBlur = 28;

  // Body
  const grad = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
  grad.addColorStop(0, "#f472b6");
  grad.addColorStop(1, "#a855f7");
  ctx.fillStyle = grad;
  ctx.fillRect(-s / 2, -s / 2, s, s);

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(-s / 2 + 1, -s / 2 + 1, s - 2, s - 2);

  // Inner detail (face-ish)
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(-s / 2 + 8, -s / 2 + 10, 6, 6);
  ctx.fillRect(s / 2 - 14, -s / 2 + 10, 6, 6);
  ctx.fillRect(-s / 2 + 10, s / 2 - 14, s - 20, 4);

  ctx.restore();
}

export function reset(state: GameState) {
  const fresh = createGame(state.level, { endless: state.endless, width: state.width, height: state.height });
  Object.assign(state, fresh, { attempts: state.attempts + 1 });
}
