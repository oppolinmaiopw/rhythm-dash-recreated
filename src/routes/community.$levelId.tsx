import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameCanvas } from "@/components/GameCanvas";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { LevelDef, Obstacle } from "@/game/levels";

export const Route = createFileRoute("/community/$levelId")({
  component: PlayCommunity,
  head: ({ params }) => ({
    meta: [
      { title: `Community level — Cubefall` },
      {
        name: "description",
        content: `Play a community-made Cubefall level (id ${params.levelId}).`,
      },
      { property: "og:title", content: "Community level — Cubefall" },
    ],
  }),
});

interface CommunityLevelRow {
  id: string;
  name: string;
  author_name: string;
  difficulty: string;
  length_tiles: number;
  obstacles: Obstacle[];
}

function difficultyToBpm(d: string) {
  switch (d) {
    case "Easy":   return 140;
    case "Normal": return 155;
    case "Hard":   return 170;
    case "Insane": return 185;
    default:       return 150;
  }
}

function difficultyToBg(d: string) {
  switch (d) {
    case "Easy":   return "var(--gradient-bg-1)";
    case "Normal": return "var(--gradient-bg-2)";
    case "Hard":   return "var(--gradient-bg-3)";
    default:       return "var(--gradient-bg-endless)";
  }
}

function PlayCommunity() {
  const { levelId } = useParams({ from: "/community/$levelId" });
  const [level, setLevel] = useState<LevelDef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ name: string; author: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("community_levels")
      .select("id,name,author_name,difficulty,length_tiles,obstacles")
      .eq("id", levelId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setError(error.message); return; }
        if (!data) { setError("Level not found."); return; }
        const row = data as unknown as CommunityLevelRow;
        const obstacles: Obstacle[] = Array.isArray(row.obstacles) ? row.obstacles : [];
        setMeta({ name: row.name, author: row.author_name });
        setLevel({
          id: row.id,
          name: row.name,
          difficulty: (row.difficulty as LevelDef["difficulty"]) ?? "Normal",
          difficultyStars: (row.difficulty === "Easy" ? 1 : row.difficulty === "Hard" ? 3 : 2) as 1 | 2 | 3,
          bg: difficultyToBg(row.difficulty),
          accent: "var(--neon-pink)",
          bpm: difficultyToBpm(row.difficulty),
          length: row.length_tiles,
          obstacles,
          decoration: "stars",
        });
        // Fire-and-forget play count increment
        supabase.rpc("increment_level_play_count", { level_id: row.id });
      });
    return () => { cancelled = true; };
  }, [levelId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-white">
        <div className="text-center">
          <h1 className="font-display text-3xl text-glow-pink">Couldn't load level</h1>
          <p className="mt-2 text-white/70">{error}</p>
          <Link to="/community" className="mt-4 inline-block">
            <Button>Back to community</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!level || !meta) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-pulse-neon rounded-md bg-gradient-hero" />
          <p className="mt-4 font-display uppercase tracking-widest text-white/70">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      <GameCanvas level={level} />
    </div>
  );
}
