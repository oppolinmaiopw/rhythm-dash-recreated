import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GameCanvas } from "@/components/GameCanvas";
import { NeonHeader } from "@/components/NeonHeader";
import { Button } from "@/components/ui/button";
import { LEVELS, ENDLESS_BG, ENDLESS_ACCENT, type EndlessMode } from "@/game/levels";
import type { GameMode } from "@/game/icons";

export const Route = createFileRoute("/endless")({
  component: Endless,
  head: () => ({
    meta: [
      { title: "Endless Mode — Cubefall" },
      { name: "description", content: "Procedurally generated obstacles. Choose your gamemode and see how far you can go." },
      { property: "og:title", content: "Cubefall Endless" },
      { property: "og:description", content: "How far can you survive?" },
    ],
  }),
});

interface ModeCard {
  id: EndlessMode;
  name: string;
  blurb: string;
  icon: string;
}

const MODES: ModeCard[] = [
  { id: "mixed",  name: "Mixed",  blurb: "Random portals throughout the run.", icon: "🎲" },
  { id: "cube",   name: "Cube",   blurb: "Classic jump. Timing is everything.", icon: "🟦" },
  { id: "ship",   name: "Ship",   blurb: "Hold to climb, release to dive.",    icon: "🚀" },
  { id: "ball",   name: "Ball",   blurb: "Tap to flip gravity. Roll forever.", icon: "⚪" },
  { id: "ufo",    name: "UFO",    blurb: "Tap to flap. Low-gravity hover.",    icon: "🛸" },
  { id: "wave",   name: "Wave",   blurb: "Hold to ascend, release to dive.",   icon: "〰️" },
  { id: "robot",  name: "Robot",  blurb: "Hold for a longer, higher jump.",    icon: "🤖" },
  { id: "spider", name: "Spider", blurb: "Tap to snap to the other side.",     icon: "🕷️" },
  { id: "swing",  name: "Swing",  blurb: "Tap to flip gravity mid-air.",       icon: "🎯" },
];

function Endless() {
  const [mode, setMode] = useState<EndlessMode | null>(null);

  if (!mode) {
    return (
      <div
        className="min-h-screen"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, oklch(0.3 0.18 320 / 0.5), transparent 60%), oklch(0.12 0.04 270)",
        }}
      >
        <NeonHeader active="levels" />
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-10 md:py-16">
          <h1 className="font-display text-4xl uppercase tracking-widest text-white text-glow-cyan md:text-6xl">
            Endless Mode
          </h1>
          <p className="mt-3 max-w-xl text-white/70">
            Pick a gamemode — we'll lock the run to that mode so you can master it, or choose Mixed for chaotic portal swaps.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {MODES.map((m) => {
              const storageKey = `gd-best-endless${m.id === "mixed" ? "" : `-${m.id}`}`;
              const best =
                typeof window !== "undefined" ? parseFloat(localStorage.getItem(storageKey) ?? "0") : 0;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className="group relative flex h-44 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-5 text-left transition-transform hover:-translate-y-1"
                  style={{ background: "var(--gradient-bg-endless)" }}
                >
                  <div>
                    <div className="font-display text-xs uppercase tracking-widest text-white/80">
                      {m.id === "mixed" ? "Chaos" : "Single mode"}
                    </div>
                    <div className="mt-2 flex items-center gap-2 font-display text-2xl uppercase text-white text-glow-pink">
                      <span>{m.icon}</span>
                      <span>{m.name}</span>
                    </div>
                    <div className="mt-1 text-sm text-white/70">{m.blurb}</div>
                  </div>
                  <div className="font-display text-xs uppercase tracking-widest text-white/80">
                    Best: {Math.round(best)} px · Play →
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10">
            <Link to="/levels">
              <Button variant="ghost" className="text-white/80">← Back to levels</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Launch endless run with the chosen mode.
  const baseLevel = {
    ...LEVELS[0],
    id: "stereo-pulse",
    name: mode === "mixed" ? "Endless" : `Endless · ${mode}`,
    difficulty: "Hard" as const,
    bg: ENDLESS_BG,
    accent: ENDLESS_ACCENT,
    bpm: 160,
    length: 99999,
  };
  const startMode: GameMode | undefined = mode === "mixed" ? undefined : (mode as GameMode);
  return (
    <div className="h-screen w-screen overflow-hidden">
      <GameCanvas level={baseLevel} endless startMode={startMode} onExit={() => setMode(null)} />
    </div>
  );
}
