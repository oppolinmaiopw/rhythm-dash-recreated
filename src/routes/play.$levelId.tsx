import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { GameCanvas } from "@/components/GameCanvas";
import { LEVELS } from "@/game/levels";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/play/$levelId")({
  component: Play,
  head: ({ params }) => {
    const lvl = LEVELS.find((l) => l.id === params.levelId);
    const title = lvl ? `${lvl.name} — Cubefall` : "Cubefall";
    return {
      meta: [
        { title },
        { name: "description", content: lvl ? `Play ${lvl.name} (${lvl.difficulty}) in Cubefall.` : "Play Cubefall." },
        { property: "og:title", content: title },
      ],
    };
  },
  notFoundComponent: NotFound,
});

function Play() {
  const { levelId } = useParams({ from: "/play/$levelId" });
  const level = LEVELS.find((l) => l.id === levelId);
  if (!level) return <NotFound />;
  return (
    <div className="h-screen w-screen overflow-hidden">
      <GameCanvas level={level} />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-white">
      <div className="text-center">
        <h1 className="font-display text-4xl text-glow-pink">Level not found</h1>
        <Link to="/levels" className="mt-4 inline-block">
          <Button>Back to levels</Button>
        </Link>
      </div>
    </div>
  );
}
