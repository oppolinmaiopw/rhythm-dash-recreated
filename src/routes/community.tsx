import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { NeonHeader } from "@/components/NeonHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getLikedIds, getMyPublishedIds, toggleLike } from "@/lib/progress";

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

type SortMode = "recent" | "popular" | "liked" | "mine";
type DiffFilter = "all" | "Easy" | "Normal" | "Hard" | "Insane";

function Community() {
  const [levels, setLevels] = useState<CommunityLevel[] | null>(null);
  const [sort, setSort] = useState<SortMode>("recent");
  const [diff, setDiff] = useState<DiffFilter>("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [likedSet, setLikedSet] = useState<Set<string>>(() => (typeof window !== "undefined" ? getLikedIds() : new Set()));
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLevels(null);
    setError(null);

    const myIds = sort === "mine" ? getMyPublishedIds() : null;
    const likedIds = sort === "liked" ? Array.from(getLikedIds()) : null;

    let q = supabase
      .from("community_levels")
      .select("id,name,author_name,difficulty,length_tiles,play_count,created_at")
      .order(sort === "popular" ? "play_count" : "created_at", { ascending: false })
      .limit(80);

    if (diff !== "all") q = q.eq("difficulty", diff);
    if (myIds) {
      if (myIds.length === 0) { setLevels([]); return; }
      q = q.in("id", myIds);
    }
    if (likedIds) {
      if (likedIds.length === 0) { setLevels([]); return; }
      q = q.in("id", likedIds);
    }

    q.then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setError(error.message); setLevels([]); return; }
      setLevels(data ?? []);
    });
    return () => { cancelled = true; };
  }, [sort, diff]);

  const filtered = useMemo(() => {
    if (!levels) return null;
    const q = search.trim().toLowerCase();
    if (!q) return levels;
    return levels.filter(
      (l) => l.name.toLowerCase().includes(q) || l.author_name.toLowerCase().includes(q),
    );
  }, [levels, search]);

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

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex flex-wrap rounded-full border border-white/10 bg-black/40 p-1">
            {([
              ["recent", "Recent"],
              ["popular", "Most played"],
              ["liked", "❤ Liked"],
              ["mine", "Mine"],
            ] as const).map(([s, label]) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`rounded-full px-3 py-1.5 font-display text-xs uppercase tracking-widest transition-colors ${
                  sort === s ? "bg-neon-pink/20 text-white text-glow-pink" : "text-white/70 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={diff}
            onChange={(e) => setDiff(e.target.value as DiffFilter)}
            className="h-9 rounded-md border border-white/10 bg-black/40 px-3 font-display text-xs uppercase tracking-widest text-white"
          >
            <option value="all">All difficulty</option>
            <option value="Easy">Easy</option>
            <option value="Normal">Normal</option>
            <option value="Hard">Hard</option>
            <option value="Insane">Insane</option>
          </select>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or author…"
            className="h-9 max-w-xs bg-black/40 text-white"
          />
        </div>

        <section className="mt-6">
          {filtered === null && (
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
          {filtered && filtered.length === 0 && !error && (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-8 text-center text-white/70">
              <p className="font-display text-xl uppercase tracking-widest">
                {sort === "mine" ? "You haven't published any levels yet" : sort === "liked" ? "No likes yet" : "No matches"}
              </p>
              <p className="mt-2">
                {sort === "mine" ? "Open the editor and publish your first one." : "Try a different filter."}
              </p>
              {sort === "mine" && (
                <Link to="/editor" className="mt-4 inline-block">
                  <Button>Open Editor</Button>
                </Link>
              )}
            </div>
          )}
          {filtered && filtered.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((lvl) => {
                const liked = likedSet.has(lvl.id);
                return (
                  <div
                    key={lvl.id}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 transition-all hover:border-neon-pink/60 hover:bg-black/60"
                  >
                    <Link
                      to="/community/$levelId"
                      params={{ levelId: lvl.id }}
                      className="min-w-0 flex-1"
                    >
                      <div className="font-display text-lg uppercase tracking-widest text-white group-hover:text-glow-pink truncate">
                        {lvl.name}
                      </div>
                      <div className="mt-1 text-xs text-white/60">
                        by {lvl.author_name} · {lvl.length_tiles} tiles · {lvl.play_count} plays
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        toggleLike(lvl.id);
                        setLikedSet(getLikedIds());
                        setTick((x) => x + 1);
                      }}
                      aria-label={liked ? "Unlike" : "Like"}
                      className={`shrink-0 rounded-full border px-3 py-2 font-display text-sm transition-colors ${
                        liked ? "border-pink-400 bg-pink-500/20 text-pink-200" : "border-white/15 bg-white/5 text-white/60 hover:text-white"
                      }`}
                    >
                      {liked ? "♥" : "♡"}
                    </button>
                    <DifficultyBadge difficulty={lvl.difficulty} />
                  </div>
                );
              })}
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
