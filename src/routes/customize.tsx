import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { NeonHeader } from "@/components/NeonHeader";
import { Button } from "@/components/ui/button";
import {
  COLOR_PRESETS,
  GAME_MODES,
  ICONS_PER_MODE,
  MODE_LABEL,
  drawIconPattern,
  loadSkin,
  saveSkin,
  type GameMode,
  type PlayerSkin,
} from "@/game/icons";

export const Route = createFileRoute("/customize")({
  component: Customize,
  head: () => ({
    meta: [
      { title: "Customize — Cubefall" },
      { name: "description", content: "Pick icons and colors for every game mode: cube, ship, ball, UFO, wave, robot, spider, swing." },
      { property: "og:title", content: "Customize your icons — Cubefall" },
      { property: "og:description", content: "12 icons per game mode and a color palette to pick from." },
    ],
  }),
});

function Customize() {
  const [skin, setSkin] = useState<PlayerSkin>(() => loadSkin());
  const [mode, setMode] = useState<GameMode>("cube");

  useEffect(() => { saveSkin(skin); }, [skin]);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 20% 0%, oklch(0.32 0.18 320 / 0.6), transparent 60%), radial-gradient(ellipse at 80% 100%, oklch(0.35 0.18 200 / 0.5), transparent 60%), oklch(0.12 0.04 270)",
      }}
    >
      <NeonHeader active="customize" />
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-10 md:py-14">
        <h1 className="font-display text-4xl uppercase tracking-widest text-white text-glow-pink md:text-6xl">
          Customize
        </h1>
        <p className="mt-3 max-w-xl text-white/80">
          Pick a different icon for every game mode and a color scheme that travels with you.
          Saved automatically to this browser.
        </p>

        {/* Mode tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {GAME_MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full border px-4 py-2 font-display text-xs uppercase tracking-widest transition-colors ${
                mode === m
                  ? "border-neon-pink bg-neon-pink/20 text-white text-glow-pink"
                  : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>

        {/* Icon grid */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl uppercase tracking-widest text-white">
              {MODE_LABEL[mode]} icons
            </h2>
            <span className="text-xs uppercase tracking-widest text-white/60">
              {ICONS_PER_MODE} presets
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {Array.from({ length: ICONS_PER_MODE }).map((_, i) => {
              const selected = skin.icons[mode] === i;
              return (
                <button
                  key={i}
                  onClick={() => setSkin({ ...skin, icons: { ...skin.icons, [mode]: i } })}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                    selected
                      ? "border-neon-pink shadow-neon-pink"
                      : "border-white/10 hover:border-white/30"
                  }`}
                  style={{ background: "rgba(0,0,0,0.4)" }}
                >
                  <IconPreview mode={mode} pattern={i} skin={skin} />
                  <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 font-display text-[10px] text-white/80">
                    {i + 1}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Color presets */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl uppercase tracking-widest text-white">
              Color scheme
            </h2>
            <span className="text-xs uppercase tracking-widest text-white/60">
              applies to all modes
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {COLOR_PRESETS.map((c) => {
              const selected = skin.primary === c.primary && skin.secondary === c.secondary;
              return (
                <button
                  key={c.name}
                  onClick={() =>
                    setSkin({
                      ...skin,
                      primary: c.primary,
                      secondary: c.secondary,
                      glow: c.glow,
                    })
                  }
                  className={`group rounded-xl border-2 p-3 text-left transition-all ${
                    selected
                      ? "border-neon-cyan shadow-neon-cyan"
                      : "border-white/10 hover:border-white/30"
                  }`}
                  style={{ background: "rgba(0,0,0,0.4)" }}
                >
                  <div
                    className="h-12 w-full rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${c.primary}, ${c.secondary})`,
                      boxShadow: `0 0 12px ${c.glow}80`,
                    }}
                  />
                  <div className="mt-2 font-display text-xs uppercase tracking-widest text-white/80">
                    {c.name}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/levels">
            <Button size="lg" className="font-display uppercase tracking-widest">
              Play with this loadout
            </Button>
          </a>
          <a href="/how-to-play">
            <Button size="lg" variant="ghost" className="font-display uppercase tracking-widest text-white">
              Mode guide
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

function IconPreview({ mode, pattern, skin }: { mode: GameMode; pattern: number; skin: PlayerSkin }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 96;
    c.width = size * dpr;
    c.height = size * dpr;
    c.style.width = `${size}px`;
    c.style.height = `${size}px`;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    const s = 56;
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 16;
    drawModeBody(ctx, mode, s, skin);
    ctx.shadowBlur = 0;
    drawIconPattern(ctx, pattern, s, skin);
    ctx.restore();
  }, [mode, pattern, skin]);
  return <canvas ref={ref} className="h-full w-full" />;
}

function drawModeBody(
  ctx: CanvasRenderingContext2D,
  mode: GameMode,
  s: number,
  skin: PlayerSkin,
) {
  const grad = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
  grad.addColorStop(0, skin.primary);
  grad.addColorStop(1, skin.secondary);
  ctx.fillStyle = grad;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  switch (mode) {
    case "cube":
    case "spider": {
      ctx.fillRect(-s / 2, -s / 2, s, s);
      ctx.strokeRect(-s / 2 + 1, -s / 2 + 1, s - 2, s - 2);
      break;
    }
    case "robot": {
      // Robot torso + antenna + legs
      const torsoH = s * 0.7;
      const torsoW = s * 0.85;
      ctx.fillRect(-torsoW / 2, -torsoH / 2, torsoW, torsoH);
      ctx.strokeRect(-torsoW / 2 + 1, -torsoH / 2 + 1, torsoW - 2, torsoH - 2);
      ctx.strokeStyle = skin.secondary;
      ctx.beginPath();
      ctx.moveTo(0, -torsoH / 2);
      ctx.lineTo(0, -s / 2 + 2);
      ctx.stroke();
      ctx.fillStyle = skin.glow;
      ctx.beginPath();
      ctx.arc(0, -s / 2 + 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = skin.secondary;
      ctx.fillRect(-torsoW / 2 + 2, torsoH / 2, 7, s / 2 - torsoH / 2);
      ctx.fillRect(torsoW / 2 - 9, torsoH / 2, 7, s / 2 - torsoH / 2);
      break;
    }
    case "ship": {
      // Jet shape
      ctx.beginPath();
      ctx.moveTo(s / 2, 0);
      ctx.lineTo(s / 6, -s / 3);
      ctx.lineTo(-s / 2, -s / 2);
      ctx.lineTo(-s / 2 + 6, -s / 6);
      ctx.lineTo(-s / 2 + 2, 0);
      ctx.lineTo(-s / 2 + 6, s / 6);
      ctx.lineTo(-s / 2, s / 2);
      ctx.lineTo(s / 6, s / 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.ellipse(s / 8, -2, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "ball": {
      ctx.beginPath();
      ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "ufo": {
      ctx.beginPath();
      ctx.ellipse(0, 4, s / 2, s / 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.ellipse(0, -4, s / 2 - 8, s / 2 - 8, 0, Math.PI, 0);
      ctx.fill();
      break;
    }
    case "wave": {
      ctx.beginPath();
      ctx.moveTo(0, -s / 3);
      ctx.lineTo(s / 3, 0);
      ctx.lineTo(0, s / 3);
      ctx.lineTo(-s / 3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case "swing": {
      ctx.beginPath();
      ctx.moveTo(-s / 2, -2); ctx.lineTo(s / 2, -2); ctx.lineTo(0, -s / 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s / 2, 2); ctx.lineTo(s / 2, 2); ctx.lineTo(0, s / 2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    }
  }
}
