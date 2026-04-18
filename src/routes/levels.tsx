import { createFileRoute, Link } from "@tanstack/react-router";
import { NeonHeader } from "@/components/NeonHeader";
import { Button } from "@/components/ui/button";
import { LEVELS } from "@/game/levels";

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
        <h1 className="font-display text-4xl uppercase tracking-widest text-white text-glow-pink md:text-6xl">
          Choose your level
        </h1>
        <p className="mt-3 max-w-xl text-white/70">
          Each level has its own pulsing soundtrack and rhythm. Start easy, then crank it up.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {LEVELS.map((lvl) => {
            const best = typeof window !== "undefined"
              ? Math.round(parseFloat(localStorage.getItem(`gd-best-${lvl.id}`) ?? "0") * 100)
              : 0;
            return (
              <Link
                key={lvl.id}
                to="/play/$levelId"
                params={{ levelId: lvl.id }}
                className="group relative flex h-72 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 p-6 transition-transform hover:-translate-y-1"
                style={{ background: lvl.bg }}
              >
                <div>
                  <div className="font-display text-xs uppercase tracking-widest text-white/80">
                    {lvl.difficulty} · {lvl.bpm} BPM
                  </div>
                  <div className="mt-2 font-display text-3xl uppercase text-white text-glow-pink">
                    {lvl.name}
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
