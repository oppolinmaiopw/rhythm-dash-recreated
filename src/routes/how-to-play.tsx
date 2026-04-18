import { createFileRoute, Link } from "@tanstack/react-router";
import { NeonHeader } from "@/components/NeonHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-to-play")({
  component: HowToPlay,
  head: () => ({
    meta: [
      { title: "How to play — Cubefall" },
      { name: "description", content: "One button to jump. Time it to the beat. Avoid spikes." },
      { property: "og:title", content: "How to play Cubefall" },
    ],
  }),
});

function HowToPlay() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 80% 0%, oklch(0.3 0.18 200 / 0.5), transparent 60%), oklch(0.12 0.04 270)",
      }}
    >
      <NeonHeader active="how" />
      <div className="mx-auto max-w-3xl px-5 py-10 md:px-10 md:py-16">
        <h1 className="font-display text-4xl uppercase tracking-widest text-white text-glow-cyan md:text-6xl">
          How to play
        </h1>
        <p className="mt-4 text-white/80">
          Cubefall is a one-button rhythm platformer. Your cube auto-runs forward
          to the beat. Your only job: jump at the right moment.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card title="Controls" lines={["Tap / Click — Action", "Space / W / ↑ — Action", "Hold for ship/wave/robot", "R — Restart instantly"]} />
          <Card title="Obstacles" lines={["▲ Spikes — instant death", "■ Blocks — land on top, side hit kills", "▰ Platforms — float in midair"]} />
          <Card title="Power-ups" lines={["Yellow pad — super jump", "Mode portals — switch form mid-level", "Gravity portal (↕) — flip up/down"]} />
          <Card
            title="Game modes"
            lines={[
              "Cube (C) — tap to jump",
              "Ship (S) — hold to fly up",
              "Ball (B) — tap to swap gravity",
              "UFO (U) — tap to flap",
              "Wave (W) — hold = up, release = down",
              "Robot (R) — tap to jump, hold higher",
              "Spider (X) — tap to teleport surface",
              "Swing (G) — tap to swap gravity midair",
            ]}
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/levels"><Button size="lg" className="font-display uppercase tracking-widest">Pick a level</Button></Link>
          <Link to="/customize"><Button size="lg" variant="secondary" className="font-display uppercase tracking-widest">Customize icons</Button></Link>
          <Link to="/endless"><Button size="lg" variant="ghost" className="font-display uppercase tracking-widest text-white">Endless</Button></Link>
        </div>
      </div>
    </div>
  );
}

function Card({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
      <h3 className="font-display text-xl uppercase tracking-widest text-neon-pink text-glow-pink">{title}</h3>
      <ul className="mt-3 space-y-2 text-white/85">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}
