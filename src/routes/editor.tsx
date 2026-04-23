import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { NeonHeader } from "@/components/NeonHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameCanvas } from "@/components/GameCanvas";
import type { LevelDef, Obstacle, ObstacleType } from "@/game/levels";
import { supabase } from "@/integrations/supabase/client";
import { addMyPublished } from "@/lib/progress";
import { toast } from "sonner";

export const Route = createFileRoute("/editor")({
  component: Editor,
  head: () => ({
    meta: [
      { title: "Level Editor — Cubefall" },
      {
        name: "description",
        content:
          "Build your own Cubefall level. Place spikes, blocks, pads, and mode portals on a grid, then publish to the community.",
      },
      { property: "og:title", content: "Level Editor — Cubefall" },
    ],
  }),
});

const TOOLS: { id: ObstacleType | "erase"; label: string; color: string; key: string }[] = [
  { id: "spike", label: "Spike", color: "#fff", key: "1" },
  { id: "spike3", label: "3 Spikes", color: "#fff", key: "2" },
  { id: "block", label: "Block", color: "#fde047", key: "3" },
  { id: "tall", label: "Tall", color: "#fde047", key: "4" },
  { id: "platform", label: "Platform", color: "#22d3ee", key: "5" },
  { id: "pad", label: "Jump Pad", color: "#facc15", key: "6" },
  { id: "portal-grav", label: "Gravity", color: "#a78bfa", key: "7" },
  { id: "portal-cube", label: "→ Cube", color: "#f472b6", key: "8" },
  { id: "portal-ship", label: "→ Ship", color: "#fb923c", key: "9" },
  { id: "portal-ball", label: "→ Ball", color: "#fde047", key: "0" },
  { id: "portal-ufo", label: "→ UFO", color: "#22d3ee", key: "" },
  { id: "portal-wave", label: "→ Wave", color: "#a78bfa", key: "" },
  { id: "portal-robot", label: "→ Robot", color: "#34d399", key: "" },
  { id: "portal-spider", label: "→ Spider", color: "#f87171", key: "" },
  { id: "portal-swing", label: "→ Swing", color: "#e879f9", key: "" },
  { id: "erase", label: "🗑 Erase", color: "#888", key: "e" },
];

const ROWS = 8;
const TILE_PX = 36;
const DRAFT_KEY = "cubefall-editor-draft-v1";

interface Draft {
  name: string;
  authorName: string;
  difficulty: "Easy" | "Normal" | "Hard" | "Insane";
  length: number;
  obstacles: Obstacle[];
}

function loadDraft(): Draft {
  if (typeof window === "undefined") return defaultDraft();
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return defaultDraft();
    return { ...defaultDraft(), ...(JSON.parse(raw) as Partial<Draft>) };
  } catch {
    return defaultDraft();
  }
}
function defaultDraft(): Draft {
  return { name: "My Level", authorName: "Anonymous", difficulty: "Normal", length: 100, obstacles: [] };
}
function saveDraft(d: Draft) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
}

function difficultyToBpm(d: string) {
  switch (d) { case "Easy": return 140; case "Normal": return 155; case "Hard": return 170; case "Insane": return 185; default: return 150; }
}
function difficultyToBg(d: string) {
  switch (d) { case "Easy": return "var(--gradient-bg-1)"; case "Normal": return "var(--gradient-bg-2)"; case "Hard": return "var(--gradient-bg-3)"; default: return "var(--gradient-bg-endless)"; }
}

const HISTORY_LIMIT = 50;

function Editor() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft>(() => loadDraft());
  const [tool, setTool] = useState<(typeof TOOLS)[number]["id"]>("spike");
  const [scrollX, setScrollX] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [playtest, setPlaytest] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Undo/redo stacks of obstacles arrays only
  const undoStack = useRef<Obstacle[][]>([]);
  const redoStack = useRef<Obstacle[][]>([]);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  const obstaclesByCell = useMemo(() => {
    const map = new Map<string, Obstacle>();
    for (const o of draft.obstacles) {
      const key = `${o.x},${o.y ?? 0}`;
      map.set(key, o);
    }
    return map;
  }, [draft.obstacles]);

  function pushHistory(prev: Obstacle[]) {
    undoStack.current.push(prev);
    if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
    redoStack.current = [];
  }

  function commit(next: Obstacle[]) {
    pushHistory(draft.obstacles);
    setDraft({ ...draft, obstacles: next });
  }

  function undo() {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(draft.obstacles);
    setDraft({ ...draft, obstacles: prev });
  }
  function redo() {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(draft.obstacles);
    setDraft({ ...draft, obstacles: next });
  }

  function placeAt(xTile: number, rowFromGround: number) {
    if (xTile < 2 || xTile >= draft.length) return;
    const key = `${xTile},${rowFromGround}`;
    if (tool === "erase") {
      const next = draft.obstacles.filter(
        (o) => !(o.x === xTile && (o.y ?? 0) === rowFromGround),
      );
      if (next.length !== draft.obstacles.length) commit(next);
      return;
    }
    if (obstaclesByCell.has(key)) return;
    const isGround =
      tool !== "platform" &&
      tool !== "portal-grav" &&
      tool !== "portal-cube" &&
      tool !== "portal-ship" &&
      tool !== "portal-ball" &&
      tool !== "portal-ufo" &&
      tool !== "portal-wave" &&
      tool !== "portal-robot" &&
      tool !== "portal-spider" &&
      tool !== "portal-swing";
    const finalRow = isGround ? 0 : rowFromGround;
    if (tool === "platform" && finalRow < 2) return;
    const newOb: Obstacle = { x: xTile, type: tool };
    if (tool === "platform") newOb.y = finalRow;
    commit([...draft.obstacles, newOb]);
  }

  function clearAll() {
    if (confirm("Clear every obstacle? This cannot be undone.")) {
      commit([]);
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    if (playtest) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA")) return;
      // Undo / Redo
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }
      if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      // Tool shortcuts
      const t = TOOLS.find((x) => x.key === e.key.toLowerCase());
      if (t) { setTool(t.id); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, playtest]);

  const playtestLevel = useMemo<LevelDef>(
    () => ({
      id: "playtest-" + Math.random().toString(36).slice(2, 8),
      name: draft.name || "Playtest",
      difficulty: (draft.difficulty as LevelDef["difficulty"]) ?? "Normal",
      difficultyStars: (draft.difficulty === "Easy" ? 1 : draft.difficulty === "Hard" ? 3 : 2) as 1 | 2 | 3,
      bg: difficultyToBg(draft.difficulty),
      accent: "var(--neon-pink)",
      bpm: difficultyToBpm(draft.difficulty),
      length: draft.length,
      obstacles: draft.obstacles,
      decoration: "stars",
    }),
    [draft],
  );

  async function publish() {
    if (draft.obstacles.length < 3) { toast.error("Add at least 3 obstacles before publishing."); return; }
    if (draft.name.trim().length < 1) { toast.error("Name your level."); return; }
    setPublishing(true);
    try {
      const { data, error } = await supabase
        .from("community_levels")
        .insert({
          name: draft.name.trim().slice(0, 60),
          author_name: (draft.authorName || "Anonymous").trim().slice(0, 32),
          difficulty: draft.difficulty,
          length_tiles: draft.length,
          obstacles: draft.obstacles as unknown as never,
        })
        .select("id")
        .single();
      if (error) throw error;
      addMyPublished(data.id);
      toast.success("Published to the community!");
      navigate({ to: "/community/$levelId", params: { levelId: data.id } });
    } catch (e) {
      console.error(e);
      toast.error("Failed to publish. Check your connection.");
    } finally {
      setPublishing(false);
    }
  }

  const visibleStart = Math.floor(scrollX / TILE_PX);
  const visibleCount = 36;

  if (playtest) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <GameCanvas level={playtestLevel} ephemeral onExit={() => setPlaytest(false)} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 0% 0%, oklch(0.30 0.15 320 / 0.5), transparent 60%), oklch(0.12 0.04 270)",
      }}
    >
      <NeonHeader active="editor" />
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl uppercase tracking-widest text-white text-glow-pink md:text-5xl">
              Level Editor
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Click cells to place obstacles. Shortcuts: <kbd className="rounded bg-white/10 px-1">1-9</kbd> tools, <kbd className="rounded bg-white/10 px-1">E</kbd> erase, <kbd className="rounded bg-white/10 px-1">Ctrl+Z</kbd> undo, <kbd className="rounded bg-white/10 px-1">Ctrl+Shift+Z</kbd> redo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={undo}
              disabled={undoStack.current.length === 0}
              className="font-display uppercase tracking-widest text-white"
            >
              ↶ Undo
            </Button>
            <Button
              variant="ghost"
              onClick={redo}
              disabled={redoStack.current.length === 0}
              className="font-display uppercase tracking-widest text-white"
            >
              ↷ Redo
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (draft.obstacles.length === 0) { toast.error("Place a few obstacles first."); return; }
                setPlaytest(true);
              }}
              className="font-display uppercase tracking-widest"
            >
              ▶ Playtest
            </Button>
            <Link to="/community">
              <Button variant="ghost" className="font-display uppercase tracking-widest text-white">
                Community
              </Button>
            </Link>
            <Button
              onClick={publish}
              disabled={publishing}
              className="font-display uppercase tracking-widest"
            >
              {publishing ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <section className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-black/40 p-5 md:grid-cols-4">
          <div>
            <label className="block font-display text-xs uppercase tracking-widest text-white/70">Name</label>
            <Input
              value={draft.name}
              maxLength={60}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="mt-1 bg-black/40 text-white"
            />
          </div>
          <div>
            <label className="block font-display text-xs uppercase tracking-widest text-white/70">Author</label>
            <Input
              value={draft.authorName}
              maxLength={32}
              onChange={(e) => setDraft({ ...draft, authorName: e.target.value })}
              className="mt-1 bg-black/40 text-white"
            />
          </div>
          <div>
            <label className="block font-display text-xs uppercase tracking-widest text-white/70">Difficulty</label>
            <select
              value={draft.difficulty}
              onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as Draft["difficulty"] })}
              className="mt-1 h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 font-sans text-sm text-white"
            >
              <option>Easy</option>
              <option>Normal</option>
              <option>Hard</option>
              <option>Insane</option>
            </select>
          </div>
          <div>
            <label className="block font-display text-xs uppercase tracking-widest text-white/70">
              Length (tiles): {draft.length}
            </label>
            <input
              type="range"
              min={40}
              max={500}
              step={10}
              value={draft.length}
              onChange={(e) => setDraft({ ...draft, length: parseInt(e.target.value, 10) })}
              className="mt-3 w-full accent-pink-500"
            />
          </div>
        </section>

        {/* Toolbar */}
        <section className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3">
          <div className="flex flex-wrap gap-2">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`rounded-md border px-3 py-2 font-display text-[11px] uppercase tracking-widest transition-colors ${
                  tool === t.id
                    ? "border-neon-pink bg-neon-pink/20 text-white text-glow-pink"
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
                style={tool === t.id ? undefined : { borderColor: `${t.color}55` }}
              >
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-sm align-middle"
                  style={{ background: t.color }}
                />
                {t.label}
                {t.key && <span className="ml-2 rounded bg-white/10 px-1 text-[9px]">{t.key.toUpperCase()}</span>}
              </button>
            ))}
            <button
              onClick={clearAll}
              className="ml-auto rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 font-display text-[11px] uppercase tracking-widest text-red-200 hover:bg-red-500/20"
            >
              Clear all
            </button>
          </div>
        </section>

        {/* Grid */}
        <section className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-white/60">
            <span>Tile {visibleStart}–{visibleStart + visibleCount} of {draft.length}</span>
            <span>{draft.obstacles.length} obstacles placed</span>
          </div>
          <div
            ref={scrollRef}
            onScroll={(e) => setScrollX(e.currentTarget.scrollLeft)}
            className="overflow-x-auto rounded-lg border border-white/10 bg-gradient-to-b from-indigo-950/40 to-black/60"
            style={{ touchAction: "pan-x" }}
          >
            <div
              className="relative"
              style={{ width: draft.length * TILE_PX, height: (ROWS + 2) * TILE_PX }}
            >
              <div className="absolute inset-x-0 top-0" style={{ height: ROWS * TILE_PX }} />
              <div
                className="absolute inset-x-0"
                style={{
                  top: ROWS * TILE_PX,
                  height: 2 * TILE_PX,
                  background: "rgba(0,0,0,0.5)",
                  borderTop: "2px solid var(--neon-pink)",
                  boxShadow: "0 0 12px var(--neon-pink)",
                }}
              />
              {Array.from({ length: ROWS + 1 }).map((_, rowIdx) => {
                const rowFromGround = ROWS - rowIdx;
                return Array.from({ length: draft.length }).map((__, x) => {
                  const isGroundRow = rowFromGround === 0;
                  return (
                    <button
                      key={`${x}-${rowIdx}`}
                      onClick={() => placeAt(x, rowFromGround)}
                      className="absolute border border-white/[0.04] hover:bg-white/10"
                      style={{
                        left: x * TILE_PX,
                        top: rowIdx * TILE_PX,
                        width: TILE_PX,
                        height: TILE_PX,
                        background: isGroundRow ? "rgba(255,255,255,0.03)" : undefined,
                      }}
                      aria-label={`Tile ${x},${rowFromGround}`}
                    />
                  );
                });
              })}
              {draft.obstacles.map((o, i) => {
                const rowFromGround = o.y ?? 0;
                const rowIdx = ROWS - rowFromGround;
                const t = TOOLS.find((x) => x.id === o.type);
                const w = o.type === "spike3" ? TILE_PX * 3 : o.type === "platform" ? TILE_PX * 2 : TILE_PX;
                const h = o.type === "tall" ? TILE_PX * 2 : TILE_PX;
                const top = o.type === "tall" ? rowIdx * TILE_PX - TILE_PX : rowIdx * TILE_PX;
                return (
                  <div
                    key={i}
                    className="pointer-events-none absolute flex items-center justify-center rounded-sm font-display text-[10px] text-black"
                    style={{
                      left: o.x * TILE_PX,
                      top,
                      width: w,
                      height: o.type.startsWith("portal") ? (ROWS + 1) * TILE_PX - rowIdx * TILE_PX : h,
                      background: t?.color ?? "#fff",
                      boxShadow: `0 0 8px ${t?.color ?? "#fff"}aa`,
                      opacity: o.type.startsWith("portal") ? 0.55 : 0.9,
                      clipPath:
                        o.type === "spike" || o.type === "spike3"
                          ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                          : undefined,
                    }}
                  >
                    {o.type.startsWith("portal") ? o.type.replace("portal-", "").toUpperCase() : ""}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 text-xs text-white/50">
            Tip: ground obstacles snap to the bottom row. Platforms snap to the row you click. Portals always span the full height.
          </div>
        </section>
      </div>
    </div>
  );
}
