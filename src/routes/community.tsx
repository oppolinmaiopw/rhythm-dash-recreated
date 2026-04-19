import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NeonHeader } from "@/components/NeonHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/community")({
  component: Community,
  head: () => ({
    meta: [
      { title: "Community Levels — Cubefall" },
      {
        name: "description",
        content:
          "Browse and play levels published by the Cubefall community. New levels every day.",
      },
      { property: "og:title", content: "Community Levels — Cubefall" },
    ],
  }),
});

interface CommunityLevel {
  id: string;
  name: string;
  author_name: string;
  difficulty: string;
  length_tiles: number;
  play_count: number;
  created_at: string;
}

function Community() {
  const [levels, setLevels] = useState<CommunityLevel[] | null>(null);
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLevels(null);
    supabase
      .from("community_levels")
      .select("id,name,author_name,difficulty,length_tiles,play_count,created_at")
      .order(sort === "recent" ? "created_at" : "play_count", { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setError(error.message);
          setLevels([]);
          return;
        }
        setLevels(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [sort]);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 80% 0%, oklch(0.32 0.18 200 / 0.5), transparent 60%), oklch(0.12 0.04 270)",
      }}
    >
      <NeonHeader active="community" />
      <div className="mx-auto max-w-6xl px-5 py-10 md:px-10 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl uppercase tracking-widest text-white text-glow-cyan md:text-6xl">
              Community
            </h1>
            <p className="mt-3 max-w-xl text-white/80">
              Levels made and published by other players. Pick one and try to clear it.
            </p>
          </div>
          <Link to="/editor">
            <Button size="lg" className="font-display uppercase tracking-widest">
              + Create a level
            </Button>
          </Link>
        </div>

        <div className="mt-6 inline-flex rounded-full border border-white/10 bg-black/40 p-1">
          {(["recent", "popular"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-full px-4 py-1.5 font-display text-xs uppercase tracking-widest transition-colors ${
                sort === s ? "bg-neon-pink/20 text-white text-glow-pink" : "text-white/70"
              }`}
            >
              {s === "recent" ? "Recent" : "Most played"}
            </button>
          ))}
        </div>

        <section className="mt-6">
          {levels === null && (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl border border-white/10 bg-black/40"
                />
              ))}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
              Couldn't load community levels: {error}
            </div>
          )}
          {levels && levels.length === 0 && !error && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center text-white/70">
              <p className="font-display text-xl uppercase tracking-widest">No levels yet</p>
              <p className="mt-2">Be the first — open the editor and publish one.</p>
              <Link to="/editor" className="mt-4 inline-block">
                <Button>Open Editor</Button>
              </Link>
            </div>
          )}
          {levels && levels.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {levels.map((lvl) => (
                <Link
                  key={lvl.id}
                  to="/community/$levelId"
                  params={{ levelId: lvl.id }}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 transition-all hover:border-neon-pink/60 hover:bg-black/60"
                >
                  <div className="min-w-0">
                    <div className="font-display text-lg uppercase tracking-widest text-white group-hover:text-glow-pink truncate">
                      {lvl.name}
                    </div>
                    <div className="mt-1 text-xs text-white/60">
                      by {lvl.author_name} · {lvl.length_tiles} tiles · {lvl.play_count} plays
                    </div>
                  </div>
                  <DifficultyBadge difficulty={lvl.difficulty} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const color =
    difficulty === "Easy"
      ? "var(--neon-green)"
      : difficulty === "Normal"
        ? "var(--neon-cyan)"
        : difficulty === "Hard"
          ? "var(--neon-orange)"
          : "var(--neon-pink)";
  return (
    <span
      className="shrink-0 rounded-full border px-3 py-1 font-display text-[10px] uppercase tracking-widest"
      style={{ borderColor: color, color, boxShadow: `0 0 10px ${color}55` }}
    >
      {difficulty}
    </span>
  );
}
