import { createFileRoute, Link } from "@tanstack/react-router";
import { NeonHeader } from "@/components/NeonHeader";
import { Button } from "@/components/ui/button";
import { LEVELS } from "@/game/levels";
import { getAllProgress, getMyPublishedIds } from "@/lib/progress";

export const Route = createFileRoute("/stats")({
  component: Stats,
  head: () => ({
    meta: [
      { title: "My Stats — Cubefall" },
      { name: "description", content: "Your Cubefall progression: stars earned, levels completed, attempts, and published levels." },
      { property: "og:title", content: "My Stats — Cubefall" },
    ],
  }),
});

function Stats() {
  const all = typeof window !== "undefined" ? getAllProgress() : [];
  const totalStars = all.reduce((s, e) => s + e.progress.stars, 0);
  const totalCompletions = all.reduce((s, e) => s + e.progress.completions, 0);
  const totalAttempts = all.reduce((s, e) => s + e.progress.attempts, 0);
  const myIds = typeof window !== "undefined" ? getMyPublishedIds() : [];
  const officialMaxStars = LEVELS.length * 3;

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 30% 0%, oklch(0.30 0.15 280 / 0.5), transparent 60%), oklch(0.12 0.04 270)",
      }}
    >
      <NeonHeader />
      <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
        <h1 className="font-display text-4xl uppercase tracking-widest text-white text-glow-cyan md:text-6xl">
          My Stats
        </h1>
        <p className="mt-2 text-white/70">Saved on this device only.</p>

        <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Stars" value={`${totalStars}`} sub={`/ ${officialMaxStars} on built-ins`} accent="yellow" />
          <Stat label="Completions" value={`${totalCompletions}`} accent="cyan" />
          <Stat label="Attempts" value={`${totalAttempts}`} accent="pink" />
          <Stat label="Published" value={`${myIds.length}`} accent="green" />
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl uppercase tracking-widest text-white">Built-in levels</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {LEVELS.map((lvl) => {
              const p = all.find((e) => e.id === lvl.id)?.progress ?? { bestPct: 0, stars: 0 as const, completions: 0, attempts: 0 };
              return (
                <Link
                  key={lvl.id}
                  to="/play/$levelId"
                  params={{ levelId: lvl.id }}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 hover:border-neon-pink/60"
                >
                  <div>
                    <div className="font-display text-lg uppercase tracking-widest text-white">{lvl.name}</div>
                    <div className="mt-1 text-xs text-white/60">
                      {lvl.difficulty} · {Math.round(p.bestPct * 100)}% best · {p.completions} clears · {p.attempts} attempts
                    </div>
                  </div>
                  <span className="text-xl">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className={i < p.stars ? "text-yellow-300" : "text-white/20"} style={i < p.stars ? { textShadow: "0 0 8px rgba(253,224,71,0.9)" } : undefined}>★</span>
                    ))}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {myIds.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl uppercase tracking-widest text-white">My published levels</h2>
            <p className="mt-1 text-sm text-white/60">Anonymous &mdash; stored by id on this device.</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {myIds.map((id) => (
                <Link
                  key={id}
                  to="/community/$levelId"
                  params={{ levelId: id }}
                  className="rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-white/80 hover:border-neon-pink/60"
                >
                  {id}
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10">
          <Link to="/levels">
            <Button variant="ghost" className="text-white/80">← Back to levels</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: "yellow" | "cyan" | "pink" | "green" }) {
  const color = accent === "yellow" ? "#facc15" : accent === "cyan" ? "var(--neon-cyan)" : accent === "pink" ? "var(--neon-pink)" : "var(--neon-green)";
  return (
    <div
      className="rounded-2xl border bg-black/40 p-4"
      style={{ borderColor: `${color}55` }}
    >
      <div className="font-display text-xs uppercase tracking-widest text-white/60">{label}</div>
      <div className="mt-1 font-display text-3xl text-white" style={{ color, textShadow: `0 0 10px ${color}` }}>{value}</div>
      {sub && <div className="mt-1 text-[10px] uppercase tracking-widest text-white/50">{sub}</div>}
    </div>
  );
}
