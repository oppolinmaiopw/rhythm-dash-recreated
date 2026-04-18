import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { NeonHeader } from "@/components/NeonHeader";
import { LEVELS } from "@/game/levels";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Cubefall — Neon Rhythm Runner" },
      {
        name: "description",
        content:
          "Cubefall is a fast neon rhythm-platformer. Time your jumps to a pulsing beat across hand-crafted levels and an endless mode.",
      },
      { property: "og:title", content: "Cubefall — Neon Rhythm Runner" },
      {
        property: "og:description",
        content: "Tap to jump. Survive the spikes. Free in your browser.",
      },
    ],
  }),
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div
        className="relative min-h-screen overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, oklch(0.32 0.18 320 / 0.6), transparent 60%), radial-gradient(ellipse at 80% 100%, oklch(0.35 0.18 200 / 0.5), transparent 60%), oklch(0.12 0.04 270)",
        }}
      >
        <NeonHeader active="home" />

        {/* Hero */}
        <section className="relative px-5 pb-20 pt-10 md:px-10 md:pb-32 md:pt-16">
          <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
            <div>
              <div className="mb-3 inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 font-display text-xs uppercase tracking-widest text-white/80 backdrop-blur-sm">
                A neon rhythm runner
              </div>
              <h1 className="font-display text-5xl uppercase leading-[0.95] tracking-tight text-white text-glow-pink md:text-7xl">
                Jump to <br />
                <span className="bg-gradient-hero bg-clip-text text-transparent">the beat.</span>
                <br />
                Don't <span className="text-neon-cyan text-glow-cyan">crash.</span>
              </h1>
              <p className="mt-6 max-w-md text-base text-white/80 md:text-lg">
                One button. Pulsing music. Spikes everywhere. Cubefall is a fast,
                geometry-inspired platformer you can play right in your browser.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/levels">
                  <Button size="lg" className="font-display uppercase tracking-widest shadow-neon-pink">
                    Play now
                  </Button>
                </Link>
                <Link to="/endless">
                  <Button size="lg" variant="secondary" className="font-display uppercase tracking-widest">
                    Endless mode
                  </Button>
                </Link>
                <Link to="/how-to-play">
                  <Button size="lg" variant="ghost" className="font-display uppercase tracking-widest text-white">
                    How to play
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-white/70">
                <Stat value="3" label="Hand-built levels" />
                <Stat value="∞" label="Endless mode" />
                <Stat value="1" label="Button. That's it." />
              </div>
            </div>

            {/* Decorative cube stack */}
            <div className="relative hidden h-[420px] items-center justify-center md:flex">
              <div className="relative">
                <div className="absolute -left-24 top-12 h-16 w-16 rotate-12 rounded-md bg-neon-cyan/90 shadow-neon-cyan animate-float" />
                <div
                  className="h-44 w-44 rotate-[18deg] rounded-2xl bg-gradient-hero shadow-neon-pink animate-pulse-neon"
                  style={{ animationDelay: "0.4s" }}
                />
                <div className="absolute -right-20 -top-10 h-12 w-12 -rotate-12 rounded-md bg-neon-yellow shadow-[0_0_20px_oklch(0.9_0.2_95)] animate-float" style={{ animationDelay: "0.7s" }} />
                <div className="absolute -bottom-12 right-0 flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-0 w-0"
                      style={{
                        borderLeft: "16px solid transparent",
                        borderRight: "16px solid transparent",
                        borderBottom: "26px solid white",
                        filter: "drop-shadow(0 0 10px var(--neon-pink))",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Levels preview */}
        <section className="relative px-5 pb-24 md:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="font-display text-3xl uppercase tracking-widest text-white md:text-4xl">
                Pick a level
              </h2>
              <Link to="/levels" className="font-display text-sm uppercase tracking-widest text-neon-cyan hover:text-glow-cyan">
                See all →
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {LEVELS.map((lvl) => (
                <Link
                  key={lvl.id}
                  to="/play/$levelId"
                  params={{ levelId: lvl.id }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 p-6 transition-transform hover:-translate-y-1"
                  style={{ background: lvl.bg }}
                >
                  <div className="font-display text-xs uppercase tracking-widest text-white/80">
                    {lvl.difficulty}
                  </div>
                  <div className="mt-2 font-display text-2xl uppercase text-white text-glow-pink">
                    {lvl.name}
                  </div>
                  <div className="mt-1 text-sm text-white/70">{lvl.bpm} BPM</div>
                  <div className="mt-6 flex h-16 items-end justify-around">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 rounded-t bg-white/80"
                        style={{ height: `${20 + ((i * 13 + lvl.bpm) % 80)}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 font-display text-sm uppercase tracking-widest text-white">
                    Play →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-white text-glow-pink">{value}</div>
      <div className="text-xs uppercase tracking-widest text-white/60">{label}</div>
    </div>
  );
}
