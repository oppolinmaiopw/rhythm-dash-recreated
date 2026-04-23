// Per-mode icon patterns. Each game mode gets 12 hand-drawn patterns that suit
// its silhouette. Patterns assume ctx is already translated to the body center
// and that drawing should fit roughly in (-s/2..s/2).

import type { GameMode, PlayerSkin } from "./icons";

type PatternFn = (ctx: CanvasRenderingContext2D, s: number, skin: PlayerSkin) => void;

// =================== CUBE (12) ===================
const cubePatterns: PatternFn[] = [
  // 0 — classic face
  (ctx, s) => {
    const h = s / 2;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillRect(-h + 8, -h + 10, 6, 6);
    ctx.fillRect(h - 14, -h + 10, 6, 6);
    ctx.fillRect(-h + 10, h - 14, s - 20, 4);
  },
  // 1 — visor band
  (ctx, s, skin) => {
    const h = s / 2;
    ctx.fillStyle = skin.secondary;
    ctx.fillRect(-h + 4, -4, s - 8, 8);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(-h + 8, -2, 4, 4);
    ctx.fillRect(h - 12, -2, 4, 4);
  },
  // 2 — diagonal stripes
  (ctx, s, skin) => {
    const h = s / 2;
    ctx.strokeStyle = skin.secondary;
    ctx.lineWidth = 4;
    for (let i = -s; i < s; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, -h);
      ctx.lineTo(i + s, h);
      ctx.stroke();
    }
  },
  // 3 — concentric squares
  (ctx, s) => {
    const h = s / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    for (let i = 4; i < h; i += 5) ctx.strokeRect(-i, -i, i * 2, i * 2);
  },
  // 4 — smile
  (ctx, s) => {
    const h = s / 2;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fillRect(-h + 9, -h + 11, 5, 5);
    ctx.fillRect(h - 14, -h + 11, 5, 5);
    ctx.beginPath();
    ctx.arc(0, 4, h - 12, 0, Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.stroke();
  },
  // 5 — checker
  (ctx, s, skin) => {
    const h = s / 2;
    ctx.fillStyle = skin.secondary;
    const c = 4;
    const step = s / c;
    for (let y = 0; y < c; y++) for (let x = 0; x < c; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(-h + x * step, -h + y * step, step, step);
    }
  },
  // 6 — bolt
  (ctx, s) => {
    const h = s / 2;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.moveTo(-2, -h + 4); ctx.lineTo(h - 8, -2); ctx.lineTo(2, 2);
    ctx.lineTo(h - 4, h - 4); ctx.lineTo(-h + 6, 4); ctx.lineTo(2, 0);
    ctx.lineTo(-h + 4, -h + 8); ctx.closePath(); ctx.fill();
  },
  // 7 — pixel skull
  (ctx, s) => {
    const h = s / 2;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(-h + 8, -h + 12, 6, 6);
    ctx.fillRect(h - 14, -h + 12, 6, 6);
    ctx.fillRect(-h + 8, h - 12, 4, 4);
    ctx.fillRect(-h + 14, h - 12, 4, 4);
    ctx.fillRect(h - 12, h - 12, 4, 4);
    ctx.fillRect(h - 18, h - 12, 4, 4);
  },
  // 8 — heart
  (ctx, s) => {
    const h = s / 2;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    drawHeart(ctx, 0, 0, h - 6);
  },
  // 9 — star
  (ctx, s) => {
    const h = s / 2;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    drawStar(ctx, 0, 0, h - 6, h / 2.4, 5);
  },
  // 10 — circuit
  (ctx, s, skin) => {
    const h = s / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-h + 4, 0); ctx.lineTo(0, 0); ctx.lineTo(0, -h + 4);
    ctx.moveTo(0, 0); ctx.lineTo(h - 4, h - 4);
    ctx.stroke();
    ctx.fillStyle = skin.secondary;
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(h - 4, h - 4, 3, 0, Math.PI * 2); ctx.fill();
  },
  // 11 — rivets
  (ctx, s) => {
    const h = s / 2;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    const pts = [[-h+4,-h+4],[h-4,-h+4],[-h+4,h-4],[h-4,h-4],[0,-h+4],[0,h-4],[-h+4,0],[h-4,0]];
    for (const [x, y] of pts) { ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.strokeRect(-h + 6, -h + 6, s - 12, s - 12);
  },
];

// =================== SHIP (12) — wings, flames, cockpits ===================
const shipPatterns: PatternFn[] = [
  // 0 — chevron
  (ctx, s, skin) => {
    ctx.strokeStyle = skin.secondary; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-s/3, -s/4); ctx.lineTo(0, 0); ctx.lineTo(-s/3, s/4); ctx.stroke();
  },
  // 1 — racing stripe
  (ctx, s, skin) => { ctx.fillStyle = skin.secondary; ctx.fillRect(-s/2, -2, s, 4); },
  // 2 — cockpit dome
  (ctx, s) => {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath(); ctx.ellipse(s/8, -1, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1; ctx.stroke();
  },
  // 3 — twin engines
  (ctx, s, skin) => {
    ctx.fillStyle = skin.glow;
    ctx.fillRect(-s/2 + 2, -s/3 + 2, 4, 4);
    ctx.fillRect(-s/2 + 2, s/3 - 6, 4, 4);
  },
  // 4 — flame trail
  (ctx, s, skin) => {
    ctx.fillStyle = skin.glow;
    ctx.beginPath();
    ctx.moveTo(-s/2 + 2, -3); ctx.lineTo(-s/2 - 6, 0); ctx.lineTo(-s/2 + 2, 3); ctx.closePath();
    ctx.fill();
  },
  // 5 — rivets row
  (ctx, s) => {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (let x = -s/3; x < s/3; x += 5) { ctx.beginPath(); ctx.arc(x, -s/6, 1.5, 0, Math.PI * 2); ctx.fill(); }
  },
  // 6 — shark teeth
  (ctx, s) => {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    for (let i = 0; i < 4; i++) {
      const x = s/8 + i * 4;
      ctx.beginPath(); ctx.moveTo(x, -2); ctx.lineTo(x + 3, 2); ctx.lineTo(x - 1, 2); ctx.closePath(); ctx.fill();
    }
  },
  // 7 — fin lines
  (ctx, s, skin) => {
    ctx.strokeStyle = skin.secondary; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-s/4, -s/3); ctx.lineTo(s/6, -s/4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s/4, s/3); ctx.lineTo(s/6, s/4); ctx.stroke();
  },
  // 8 — number 1
  (ctx, s) => {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = `bold ${s/3}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("1", -s/8, 0);
  },
  // 9 — radar dish
  (ctx, s, skin) => {
    ctx.strokeStyle = skin.secondary; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, s/5, -Math.PI/2, Math.PI/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -s/5); ctx.lineTo(0, s/5); ctx.stroke();
  },
  // 10 — stealth panels
  (ctx, s) => {
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-s/3, -s/4); ctx.lineTo(s/4, -s/8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s/3, s/4); ctx.lineTo(s/4, s/8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s/3, 0); ctx.lineTo(s/4, 0); ctx.stroke();
  },
  // 11 — hazard chevrons
  (ctx, s, skin) => {
    ctx.strokeStyle = skin.glow; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const x = -s/4 + i * 6;
      ctx.beginPath(); ctx.moveTo(x, -4); ctx.lineTo(x + 4, 0); ctx.lineTo(x, 4); ctx.stroke();
    }
  },
];

// =================== BALL (12) — radial / spherical motifs ===================
const ballPatterns: PatternFn[] = [
  // 0 — yin segments
  (ctx, s, skin) => {
    ctx.fillStyle = skin.secondary;
    ctx.beginPath(); ctx.arc(0, 0, s/2 - 4, 0, Math.PI); ctx.closePath(); ctx.fill();
  },
  // 1 — cross
  (ctx, s) => {
    ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-s/2, 0); ctx.lineTo(s/2, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -s/2); ctx.lineTo(0, s/2); ctx.stroke();
  },
  // 2 — concentric rings
  (ctx, s) => {
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2;
    for (let r = 4; r < s/2; r += 5) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); }
  },
  // 3 — soccer hexes
  (ctx, s) => {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    drawHex(ctx, 0, 0, 5);
    drawHex(ctx, s/4, -s/5, 4);
    drawHex(ctx, -s/4, s/5, 4);
  },
  // 4 — pizza slices
  (ctx, s, skin) => {
    ctx.strokeStyle = skin.secondary; ctx.lineWidth = 2;
    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * (s/2 - 4), Math.sin(ang) * (s/2 - 4)); ctx.stroke();
    }
  },
  // 5 — pinwheel
  (ctx, s, skin) => {
    ctx.fillStyle = skin.glow;
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.rotate((i * Math.PI) / 2);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s/2 - 4, -3); ctx.lineTo(s/2 - 4, 3); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  },
  // 6 — orbit dot
  (ctx, s, skin) => {
    ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, s/2 - 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.arc(s/2 - 6, 0, 3, 0, Math.PI * 2); ctx.fill();
  },
  // 7 — spiral
  (ctx, s) => {
    ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let t = 0; t < 6.28 * 2; t += 0.2) {
      const r = t * 1.5; const x = Math.cos(t) * r, y = Math.sin(t) * r;
      if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  },
  // 8 — cat eye
  (ctx, s) => {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath(); ctx.ellipse(0, 0, s/2 - 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.beginPath(); ctx.ellipse(0, 0, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
  },
  // 9 — moon crescent
  (ctx, s, skin) => {
    ctx.fillStyle = skin.secondary;
    ctx.beginPath(); ctx.arc(2, 0, s/2 - 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.arc(6, 0, s/2 - 6, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  },
  // 10 — dot grid
  (ctx, s) => {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    for (let y = -s/3; y <= s/3; y += 5) for (let x = -s/3; x <= s/3; x += 5) {
      if (x*x + y*y < (s/2 - 5) ** 2) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }
    }
  },
  // 11 — equator band
  (ctx, s, skin) => {
    ctx.fillStyle = skin.secondary; ctx.fillRect(-s/2 + 4, -2, s - 8, 4);
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, s/2 - 4, 0, Math.PI * 2); ctx.stroke();
  },
];

// =================== UFO (12) — domes, beams, alien glyphs ===================
const ufoPatterns: PatternFn[] = [
  // 0 — three porthole lights
  (ctx, s, skin) => {
    ctx.fillStyle = skin.glow;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * s/4, s/8, 2.5, 0, Math.PI * 2); ctx.fill(); }
  },
  // 1 — alien eye
  (ctx, s) => {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.ellipse(0, -2, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.beginPath(); ctx.arc(0, -2, 2, 0, Math.PI * 2); ctx.fill();
  },
  // 2 — beam triangle
  (ctx, s, skin) => {
    ctx.fillStyle = `${skin.glow}80`;
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(10, s/3); ctx.lineTo(-10, s/3); ctx.closePath(); ctx.fill();
  },
  // 3 — antenna ball
  (ctx, s, skin) => {
    ctx.strokeStyle = skin.secondary; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, -s/3); ctx.stroke();
    ctx.fillStyle = skin.glow;
    ctx.beginPath(); ctx.arc(0, -s/3, 2.5, 0, Math.PI * 2); ctx.fill();
  },
  // 4 — runic glyph
  (ctx, s) => {
    ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(4, -2); ctx.moveTo(0, -4); ctx.lineTo(0, 4);
    ctx.moveTo(-3, 4); ctx.lineTo(3, 4); ctx.stroke();
  },
  // 5 — saucer ridges
  (ctx, s) => {
    ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1;
    for (let x = -s/3; x <= s/3; x += 4) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 4); ctx.stroke(); }
  },
  // 6 — radar pings
  (ctx, s, skin) => {
    ctx.strokeStyle = skin.glow; ctx.lineWidth = 1;
    for (let r = 3; r < 12; r += 4) { ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI/3, -2*Math.PI/3, true); ctx.stroke(); }
  },
  // 7 — abductee dot
  (ctx, s) => {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(-1, s/3, 2, 3);
  },
  // 8 — bolts
  (ctx, s, skin) => {
    ctx.fillStyle = skin.secondary;
    ctx.beginPath(); ctx.arc(-s/3, 4, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s/3, 4, 2, 0, Math.PI * 2); ctx.fill();
  },
  // 9 — three-eye tri
  (ctx, s) => {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.arc(-5, -1, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -3, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -1, 1.8, 0, Math.PI * 2); ctx.fill();
  },
  // 10 — flying saucer stripe
  (ctx, s, skin) => {
    ctx.fillStyle = skin.secondary;
    ctx.fillRect(-s/3, 2, s*2/3, 2);
  },
  // 11 — spiral hypno
  (ctx, s) => {
    ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let t = 0; t < 10; t += 0.2) {
      const r = t * 0.8; const x = Math.cos(t) * r, y = Math.sin(t) * r - 1;
      if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  },
];

// =================== WAVE (12) — energy / trails (drawn within diamond) ===================
const wavePatterns: PatternFn[] = [
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); },
  (ctx, s, skin) => { ctx.strokeStyle = skin.secondary; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s/4, 0); ctx.lineTo(s/4, 0); ctx.stroke(); },
  (ctx, s) => { ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.moveTo(0, -s/6); ctx.lineTo(s/6, 0); ctx.lineTo(0, s/6); ctx.lineTo(-s/6, 0); ctx.closePath(); ctx.fill(); },
  (ctx, s, skin) => {
    ctx.strokeStyle = skin.glow; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = -s/3; x <= s/3; x += 2) { const y = Math.sin(x * 0.6) * 3; if (x === -s/3) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
  },
  (ctx, s) => { ctx.fillStyle = "rgba(255,255,255,0.7)"; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * 4, 0, 1.2, 0, Math.PI * 2); ctx.fill(); } },
  (ctx, s, skin) => { ctx.strokeStyle = skin.secondary; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 6, -Math.PI/3, Math.PI/3); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 6, Math.PI - Math.PI/3, Math.PI + Math.PI/3); ctx.stroke(); },
  (ctx, s) => { ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s/4, -s/4); ctx.lineTo(s/4, s/4); ctx.moveTo(s/4, -s/4); ctx.lineTo(-s/4, s/4); ctx.stroke(); },
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(4, 0); ctx.lineTo(-2, 0); ctx.lineTo(2, 6); ctx.lineTo(-4, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); },
  (ctx, s) => { ctx.fillStyle = "rgba(255,255,255,0.85)"; drawStar(ctx, 0, 0, 6, 2.5, 4); },
  (ctx, s, skin) => { ctx.strokeStyle = skin.glow; ctx.lineWidth = 1.5; for (let r = 2; r <= 8; r += 3) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); } },
  (ctx, s) => { ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(-6, 0, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(6, 0, 1.5, 0, Math.PI * 2); ctx.fill(); },
  (ctx, s, skin) => { ctx.strokeStyle = skin.secondary; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -s/4); ctx.lineTo(0, s/4); ctx.stroke(); ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill(); },
];

// =================== ROBOT (12) — chest plates, screens ===================
const robotPatterns: PatternFn[] = [
  // 0 — heart core
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; drawHeart(ctx, 0, 0, 8); },
  // 1 — power button
  (ctx, s, skin) => { ctx.strokeStyle = skin.glow; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 6, -Math.PI/3, Math.PI + Math.PI/3, false); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, -1); ctx.stroke(); },
  // 2 — LED row
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * 6, 0, 2, 0, Math.PI * 2); ctx.fill(); } },
  // 3 — gauge
  (ctx, s, skin) => { ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 2, 7, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = skin.glow; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(4, -3); ctx.stroke(); },
  // 4 — single visor eye
  (ctx, s, skin) => { ctx.fillStyle = skin.secondary; ctx.fillRect(-8, -3, 16, 5); ctx.fillStyle = skin.glow; ctx.fillRect(-2, -2, 4, 3); },
  // 5 — chest grille
  (ctx, s) => { ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 1; for (let y = -4; y <= 4; y += 2) { ctx.beginPath(); ctx.moveTo(-7, y); ctx.lineTo(7, y); ctx.stroke(); } },
  // 6 — radiation
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill(); for (let a = 0; a < 3; a++) { ctx.save(); ctx.rotate(a * Math.PI * 2 / 3); ctx.beginPath(); ctx.arc(0, -7, 4, Math.PI/4, 3 * Math.PI/4); ctx.fill(); ctx.restore(); } },
  // 7 — bolt screen
  (ctx, s, skin) => { ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(-7, -5, 14, 10); ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.moveTo(-2, -4); ctx.lineTo(2, -1); ctx.lineTo(-1, 0); ctx.lineTo(2, 4); ctx.lineTo(-2, 1); ctx.lineTo(1, 0); ctx.closePath(); ctx.fill(); },
  // 8 — health cross
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; ctx.fillRect(-2, -7, 4, 14); ctx.fillRect(-7, -2, 14, 4); },
  // 9 — radar dot
  (ctx, s, skin) => { ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1; for (let r = 2; r <= 8; r += 3) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); } ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, Math.PI * 2); ctx.fill(); },
  // 10 — barcode
  (ctx, s) => { ctx.fillStyle = "rgba(0,0,0,0.7)"; const widths = [1, 2, 1, 3, 1, 2, 1]; let x = -7; for (const w of widths) { ctx.fillRect(x, -5, w, 10); x += w + 1; } },
  // 11 — happy bot face
  (ctx, s) => { ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.beginPath(); ctx.arc(-4, -2, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(4, -2, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.95)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 2, 4, 0, Math.PI); ctx.stroke(); },
];

// =================== SPIDER (12) — webs, eyes, fangs ===================
const spiderPatterns: PatternFn[] = [
  // 0 — eight eyes
  (ctx, s) => { ctx.fillStyle = "rgba(255,255,255,0.95)"; const eyes = [[-5,-4],[-2,-5],[2,-5],[5,-4],[-5,0],[-2,1],[2,1],[5,0]]; for (const [x,y] of eyes) { ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill(); } },
  // 1 — web corner
  (ctx, s) => { ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1; const h = s/2; for (let i = 0; i < 4; i++) { const a = -Math.PI/2 + i * Math.PI/6; ctx.beginPath(); ctx.moveTo(-h, -h); ctx.lineTo(-h + Math.cos(a) * h * 1.5, -h + Math.sin(a) * h * 1.5); ctx.stroke(); } for (let r = 6; r < h * 1.3; r += 5) { ctx.beginPath(); ctx.arc(-h, -h, r, 0, Math.PI/2); ctx.stroke(); } },
  // 2 — fang pair
  (ctx, s) => { ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(-2, 9); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(2, 9); ctx.lineTo(4, 4); ctx.closePath(); ctx.fill(); },
  // 3 — hourglass
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(6, -7); ctx.lineTo(0, 0); ctx.lineTo(6, 7); ctx.lineTo(-6, 7); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); },
  // 4 — leg dashes
  (ctx, s) => { ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.lineWidth = 1.5; for (let i = 0; i < 4; i++) { const y = -5 + i * 3; ctx.beginPath(); ctx.moveTo(-9, y); ctx.lineTo(-12, y - 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(9, y); ctx.lineTo(12, y - 2); ctx.stroke(); } },
  // 5 — drop of venom
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.moveTo(0, -8); ctx.bezierCurveTo(6, -2, 4, 5, 0, 5); ctx.bezierCurveTo(-4, 5, -6, -2, 0, -8); ctx.fill(); },
  // 6 — glowing pair eyes
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.arc(-4, -2, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(4, -2, 2.5, 0, Math.PI * 2); ctx.fill(); },
  // 7 — silk thread
  (ctx, s) => { ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(0, -s/2); ctx.lineTo(0, s/2); ctx.stroke(); ctx.setLineDash([]); },
  // 8 — skull spider
  (ctx, s) => { ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.beginPath(); ctx.arc(-2, -1, 1, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(2, -1, 1, 0, Math.PI * 2); ctx.fill(); },
  // 9 — radial web
  (ctx, s) => { ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 0.8; for (let a = 0; a < 8; a++) { const ang = a * Math.PI / 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * 10, Math.sin(ang) * 10); ctx.stroke(); } for (let r = 3; r <= 10; r += 3) { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); } },
  // 10 — three vertical eyes
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * 5, 0, 1.5, 0, Math.PI * 2); ctx.fill(); } },
  // 11 — segmented body lines
  (ctx, s) => { ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1; for (let y = -6; y <= 6; y += 4) { ctx.beginPath(); ctx.moveTo(-7, y); ctx.lineTo(7, y); ctx.stroke(); } },
];

// =================== SWING (12) — wings, arrows ===================
const swingPatterns: PatternFn[] = [
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.moveTo(0, -s/4); ctx.lineTo(s/6, 0); ctx.lineTo(0, s/4); ctx.lineTo(-s/6, 0); ctx.closePath(); ctx.fill(); },
  (ctx, s) => { ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); },
  (ctx, s, skin) => { ctx.strokeStyle = skin.secondary; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s/3, -s/4); ctx.lineTo(s/3, -s/4); ctx.moveTo(-s/3, s/4); ctx.lineTo(s/3, s/4); ctx.stroke(); },
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.moveTo(-s/3, 0); ctx.lineTo(0, -3); ctx.lineTo(s/3, 0); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill(); },
  (ctx, s) => { ctx.fillStyle = "rgba(255,255,255,0.95)"; drawStar(ctx, 0, 0, 6, 2.5, 4); },
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; ctx.beginPath(); ctx.moveTo(0, -s/3); ctx.lineTo(4, 0); ctx.lineTo(0, s/3); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill(); },
  (ctx, s) => { ctx.fillStyle = "rgba(255,255,255,0.85)"; for (let i = 0; i < 3; i++) { const y = -6 + i * 6; ctx.fillRect(-2, y, 4, 2); } },
  (ctx, s, skin) => { ctx.strokeStyle = skin.glow; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s/4, -3); ctx.lineTo(s/4, 0); ctx.lineTo(-s/4, 3); ctx.stroke(); },
  (ctx, s) => { ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.beginPath(); ctx.arc(-4, 0, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(4, 0, 1.5, 0, Math.PI * 2); ctx.fill(); },
  (ctx, s, skin) => { ctx.strokeStyle = skin.secondary; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -s/3); ctx.lineTo(0, s/3); ctx.stroke(); },
  (ctx, s, skin) => { ctx.fillStyle = skin.glow; drawHeart(ctx, 0, 0, 7); },
  (ctx, s) => { ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.moveTo(-2, -8); ctx.lineTo(4, -1); ctx.lineTo(-1, 0); ctx.lineTo(2, 8); ctx.lineTo(-4, 1); ctx.lineTo(1, 0); ctx.closePath(); ctx.fill(); },
];

const PER_MODE: Record<GameMode, PatternFn[]> = {
  cube: cubePatterns,
  ship: shipPatterns,
  ball: ballPatterns,
  ufo: ufoPatterns,
  wave: wavePatterns,
  robot: robotPatterns,
  spider: spiderPatterns,
  swing: swingPatterns,
};

export function drawModePattern(
  ctx: CanvasRenderingContext2D,
  mode: GameMode,
  pattern: number,
  s: number,
  skin: PlayerSkin,
) {
  const list = PER_MODE[mode] ?? cubePatterns;
  const fn = list[((pattern % list.length) + list.length) % list.length];
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  fn(ctx, s, skin);
  ctx.restore();
}

// ---------- shared shape helpers ----------
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number, points: number) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath();
  const top = cy - size / 4;
  ctx.moveTo(cx, cy + size / 2);
  ctx.bezierCurveTo(cx + size, cy, cx + size / 2, top - size / 2, cx, top);
  ctx.bezierCurveTo(cx - size / 2, top - size / 2, cx - size, cy, cx, cy + size / 2);
  ctx.closePath(); ctx.fill();
}

function drawHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fill();
}
