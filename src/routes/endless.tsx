import { createFileRoute } from "@tanstack/react-router";
import { GameCanvas } from "@/components/GameCanvas";
import { LEVELS, ENDLESS_BG, ENDLESS_ACCENT } from "@/game/levels";

export const Route = createFileRoute("/endless")({
  component: Endless,
  head: () => ({
    meta: [
      { title: "Endless Mode — Cubefall" },
      { name: "description", content: "Procedurally generated obstacles. How far can you go?" },
      { property: "og:title", content: "Cubefall Endless" },
      { property: "og:description", content: "How far can you survive?" },
    ],
  }),
});

function Endless() {
  // Use the first level's BPM/track as the soundtrack but with endless world.
  const baseLevel = {
    ...LEVELS[0],
    id: "stereo-pulse",
    name: "Endless",
    difficulty: "Hard" as const,
    bg: ENDLESS_BG,
    accent: ENDLESS_ACCENT,
    bpm: 160,
    length: 99999,
  };
  return (
    <div className="h-screen w-screen overflow-hidden">
      <GameCanvas level={baseLevel} endless />
    </div>
  );
}
