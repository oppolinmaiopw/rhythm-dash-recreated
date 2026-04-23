import { createFileRoute, Link } from "@tanstack/react-router";
import { NeonHeader } from "@/components/NeonHeader";
import { Button } from "@/components/ui/button";
import { LEVELS } from "@/game/levels";
import { getProgress } from "@/lib/progress";

export const Route = createFileRoute("/levels")({
  component: Levels,
  head: () => ({
    meta: [
      { title: "Levels — Cubefall" },
      { name: "description", content: "Pick a Cubefall level: Stereo Pulse, Cyber Rush, or Voltage Storm." },
      { property: "og:title", content: "Cubefall Levels" },
      { property: "og:description", content: "Three hand-built neon levels and an endless mode." },
    ],
  }),
});

function StarRow({ filled }: { filled: 0 | 1 | 2 | 3 }) {
  return (
    <span className="inline-flex text-base">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={i < filled ? "text-yellow-300" : "text-white/25"}
          style={i < filled ? { textShadow: "0 0 8px rgba(253,224,71,0.9)" } : undefined}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function DifficultyStars({ count }: { count: 1 | 2 | 3 }) {
  const colors = ["#4ade80", "#facc15", "#f87171"]; // green, yellow, red
  const color = colors[count - 1];
  return (
    <span className="inline-flex items-center gap-0.5 text-xs">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={
            i < count
              ? { color, textShadow: `0 0 6px ${color}` }
              : { color: "rgba(255,255,255,0.2)" }
          }
        >
          ★
        </span>
      ))}
    </span>
  );
}

function Levels() {
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-4xl uppercase tracking-widest text-white text-glow-pink md:text-6xl">
            Choose your level
          </h1>
          <Link to="/stats">
            <Button variant="ghost" className="font-display uppercase tracking-widest text-white">
              📊 My Stats
            </Button>
          </Link>
        </div>
        <p className="mt-3 max-w-xl text-white/70">
          Each level has its own pulsing soundtrack and rhythm. Earn 1★ at 33%, 2★ at 66%, 3★ for finishing.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {LEVELS.map((lvl) => {
            const p = typeof window !== "undefined" ? getProgress(lvl.id) : { bestPct: 0, stars: 0 as const, completions: 0, attempts: 0 };
            const best = Math.round(p.bestPct * 100);
            return (
              <Link
                key={lvl.id}
                to="/play/$levelId"
                params={{ levelId: lvl.id }}
                className="group relative flex h-72 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-6 transition-transform hover:-translate-y-1"
                style={{ background: lvl.bg }}
              >
                <div>
                  <div className="flex items-center gap-2 font-display text-xs uppercase tracking-widest text-white/80">
                    <span>{lvl.difficulty}</span>
                    <DifficultyStars count={lvl.difficultyStars} />
                    <span className="text-white/50">· {lvl.bpm} BPM</span>
                  </div>
                  <div className="mt-2 font-display text-3xl uppercase text-white text-glow-pink">
                    {lvl.name}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <StarRow filled={p.stars} />
                    <span className="font-display text-[10px] uppercase tracking-widest text-white/50">earned</span>
                  </div>
                </div>
                <div>
                  <div className="mb-3 h-2 overflow-hidden rounded-full bg-black/40">
                    <div
                      className="h-full"
                      style={{
                        width: `${best}%`,
                        background: "linear-gradient(90deg, var(--neon-pink), var(--neon-cyan))",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between font-display text-sm uppercase tracking-widest text-white">
                    <span>Best: {best}%</span>
                    <span className="group-hover:text-neon-cyan">Play →</span>
                  </div>
                </div>
              </Link>
            );
          })}

          <Link
            to="/endless"
            className="group relative flex h-72 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-6 transition-transform hover:-translate-y-1"
            style={{ background: "var(--gradient-bg-endless)" }}
          >
            <div>
              <div className="font-display text-xs uppercase tracking-widest text-white/80">
                ∞ Endless · Procedural
              </div>
              <div className="mt-2 font-display text-3xl uppercase text-white text-glow-cyan">
                Endless Mode
              </div>
            </div>
            <div className="font-display text-sm uppercase tracking-widest text-white">
              Survive →
            </div>
          </Link>
        </div>

        <div className="mt-10">
          <Link to="/">
            <Button variant="ghost" className="text-white/80">← Back home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
