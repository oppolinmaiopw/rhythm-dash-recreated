import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  createGame,
  jump,
  render,
  reset,
  resize,
  setHolding,
  update,
  type GameState,
} from "@/game/engine";
import type { LevelDef } from "@/game/levels";
import type { GameMode } from "@/game/icons";
import {
  getMuted,
  getMusicVolume,
  getSfxVolume,
  setMuted,
  setMusicVolume,
  setSfxVolume,
  startMusic,
  stopMusic,
  unlockAudio,
} from "@/game/audio";
import { Button } from "@/components/ui/button";
import { recordAttempt, recordRun, getProgress, starsForPct } from "@/lib/progress";

interface GameCanvasProps {
  level: LevelDef;
  endless?: boolean;
  /** Starting game mode (used for endless single-mode runs). */
  startMode?: GameMode;
  /** When true, skip persistence (used for editor playtest). */
  ephemeral?: boolean;
  onExit?: () => void;
}

const TRACK_MAP: Record<string, "pulse" | "rush" | "storm"> = {
  "stereo-pulse": "pulse",
  "cyber-rush": "rush",
  "voltage-storm": "storm",
};

export function GameCanvas({ level, endless = false, startMode, ephemeral = false, onExit }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const recordedRef = useRef<boolean>(false);

  const [, setTick] = useState(0); // force HUD updates
  const [muted, setMutedState] = useState(getMuted());
  const [showAudio, setShowAudio] = useState(false);
  const [musicVol, setMusicVol] = useState(getMusicVolume());
  const [sfxVol, setSfxVol] = useState(getSfxVolume());
  const [bestProgress, setBestProgress] = useState(0);
  const [bestEndless, setBestEndless] = useState(0);
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0);

  const storageKey = endless
    ? `gd-best-endless${startMode ? `-${startMode}` : ""}`
    : `gd-best-${level.id}`;

  // Init
  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    stateRef.current = createGame(level, { endless, width: w, height: h, startMode });
    recordedRef.current = false;
    if (!ephemeral && !endless) recordAttempt(level.id);
  }, [level, endless, ephemeral, startMode]);

  useEffect(() => {
    init();
    if (!endless) {
      const p = getProgress(level.id);
      setBestProgress(p.bestPct);
      setStars(p.stars);
    } else {
      const stored = localStorage.getItem(storageKey);
      if (stored) setBestEndless(parseFloat(stored));
    }
    startMusic(TRACK_MAP[level.id] ?? "pulse", level.bpm);

    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !stateRef.current) return;
      const parent = canvas.parentElement!;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resize(stateRef.current, w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopMusic();
    };
  }, [init, level, endless, storageKey]);

  // Save best — used for endless and as a record trigger for normal levels
  const saveBest = useCallback(
    (state: GameState) => {
      if (endless) {
        const traveled = state.scrollX;
        if (traveled > bestEndless) {
          setBestEndless(traveled);
          localStorage.setItem(storageKey, String(traveled));
        }
      } else if (!ephemeral && !recordedRef.current) {
        recordedRef.current = true;
        recordRun(level.id, state.progress, state.finished);
        const p = getProgress(level.id);
        setBestProgress(p.bestPct);
        setStars(p.stars);
      }
    },
    [bestEndless, endless, storageKey, ephemeral, level.id],
  );

  // Game loop
  useEffect(() => {
    const loop = (t: number) => {
      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!state || !canvas) return;
      const dt = Math.min(0.033, (t - lastTimeRef.current) / 1000 || 0);
      lastTimeRef.current = t;

      const wasAlive = state.alive;
      const wasFinished = state.finished;
      const prevMode = state.mode;
      update(state, dt);
      if ((wasAlive && !state.alive) || (!wasFinished && state.finished) || prevMode !== state.mode) {
        saveBest(state);
        setTick((x) => x + 1);
      }
      const ctx = canvas.getContext("2d")!;
      render(ctx, state, getAccentColor(state.level.accent));
      rafRef.current = requestAnimationFrame(loop);
    };
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [saveBest]);

  // Input
  useEffect(() => {
    const onPress = () => {
      unlockAudio();
      const s = stateRef.current;
      if (!s) return;
      if (!s.alive || s.finished) {
        recordedRef.current = false;
        if (!ephemeral && !endless) recordAttempt(level.id);
        reset(s);
        setTick((x) => x + 1);
        return;
      }
      setHolding(s, true);
      jump(s);
    };
    const onRelease = () => {
      const s = stateRef.current;
      if (!s) return;
      setHolding(s, false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        if (e.repeat) return;
        e.preventDefault();
        onPress();
      }
      if (e.code === "KeyR") {
        const s = stateRef.current;
        if (s) {
          recordedRef.current = false;
          if (!ephemeral && !endless) recordAttempt(level.id);
          reset(s);
          setTick((x) => x + 1);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        onRelease();
      }
    };
    const canvas = canvasRef.current;
    const onPointerDown = (e: PointerEvent) => { e.preventDefault(); onPress(); };
    const onPointerUp = (e: PointerEvent) => { e.preventDefault(); onRelease(); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas?.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas?.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [ephemeral, endless, level.id]);

  const state = stateRef.current;
  const progressPct = state ? Math.round(state.progress * 100) : 0;
  const traveled = state ? Math.round(state.scrollX / 40) : 0;
  const runStars = state ? starsForPct(state.progress) : 0;

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: level.bg }}>
      <canvas ref={canvasRef} className="absolute inset-0 touch-none" />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3 md:p-5">
        <div className="pointer-events-auto flex items-center gap-2">
          {onExit ? (
            <Button variant="ghost" size="sm" className="bg-black/40 backdrop-blur-sm hover:bg-black/60" onClick={onExit}>
              ← Exit
            </Button>
          ) : (
            <Link to="/levels">
              <Button variant="ghost" size="sm" className="bg-black/40 backdrop-blur-sm hover:bg-black/60">
                ← Menu
              </Button>
            </Link>
          )}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="bg-black/40 backdrop-blur-sm hover:bg-black/60"
              onClick={() => setShowAudio((v) => !v)}
              aria-label="Audio settings"
            >
              {muted ? "🔇" : "🔊"}
            </Button>
            {showAudio && (
              <div className="absolute left-0 top-11 w-56 rounded-lg border border-white/10 bg-black/85 p-3 text-white shadow-lg backdrop-blur-md">
                <button
                  onClick={() => {
                    const m = !muted;
                    setMuted(m);
                    setMutedState(m);
                  }}
                  className="mb-2 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-left font-display text-xs uppercase tracking-widest hover:bg-white/10"
                >
                  {muted ? "🔇 Unmute" : "🔊 Mute all"}
                </button>
                <label className="block font-display text-[10px] uppercase tracking-widest text-white/70">Music · {Math.round(musicVol * 100)}%</label>
                <input
                  type="range" min={0} max={1} step={0.01} value={musicVol}
                  onChange={(e) => { const v = parseFloat(e.target.value); setMusicVol(v); setMusicVolume(v); }}
                  className="mb-2 w-full accent-pink-500"
                />
                <label className="block font-display text-[10px] uppercase tracking-widest text-white/70">SFX · {Math.round(sfxVol * 100)}%</label>
                <input
                  type="range" min={0} max={1} step={0.01} value={sfxVol}
                  onChange={(e) => { const v = parseFloat(e.target.value); setSfxVol(v); setSfxVolume(v); }}
                  className="w-full accent-pink-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="text-right font-display">
          <div className="text-xs uppercase tracking-widest text-white/70">{level.difficulty}</div>
          <div className="text-lg text-white text-glow-pink md:text-2xl">{level.name}</div>
          {state && (
            <div className="mt-1 text-xs uppercase tracking-widest text-neon-cyan text-glow-cyan">
              Mode: {state.mode}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar (normal) */}
      {!endless && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-10 px-4 md:top-20 md:px-12">
          <div className="mx-auto h-2 max-w-2xl overflow-hidden rounded-full bg-black/50 ring-1 ring-white/10">
            <div
              className="h-full transition-all duration-100"
              style={{
                width: `${progressPct}%`,
                background: `linear-gradient(90deg, var(--neon-pink), var(--neon-cyan))`,
                boxShadow: "0 0 12px var(--neon-pink)",
              }}
            />
          </div>
          <div className="mt-1 flex items-center justify-center gap-2 font-display text-xs text-white/80">
            <span>{progressPct}%</span>
            <span className="text-white/40">·</span>
            <span>Best {Math.round(bestProgress * 100)}%</span>
            <span className="text-white/40">·</span>
            <Stars filled={ephemeral ? runStars : stars} />
          </div>
        </div>
      )}

      {endless && (
        <div className="pointer-events-none absolute right-3 top-16 z-10 text-right font-display md:right-12 md:top-20">
          <div className="text-3xl text-white text-glow-cyan md:text-5xl">{traveled}</div>
          <div className="text-xs uppercase tracking-widest text-white/70">
            tiles · best {Math.round(bestEndless / 40)}
          </div>
        </div>
      )}

      {/* Death / finish overlays */}
      {state && !state.alive && (
        <Overlay
          title="Game Over"
          subtitle={endless ? `You traveled ${traveled} tiles` : `${progressPct}% — Attempt ${state.attempts}`}
          actionLabel="Tap / Space to retry"
          accent="pink"
          stars={ephemeral ? runStars : stars}
          showStars={!endless}
          onAction={() => {
            recordedRef.current = false;
            if (!ephemeral && !endless) recordAttempt(level.id);
            reset(state);
            setTick((x) => x + 1);
          }}
          onExit={onExit}
        />
      )}
      {state && state.finished && (
        <Overlay
          title="Level Complete!"
          subtitle="Master cube. Top 1% reaction time."
          actionLabel="Play again"
          accent="cyan"
          stars={3}
          showStars={!endless}
          onAction={() => {
            recordedRef.current = false;
            if (!ephemeral && !endless) recordAttempt(level.id);
            reset(state);
            setTick((x) => x + 1);
          }}
          onExit={onExit}
        />
      )}

      {/* Bottom hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 text-center text-xs text-white/70 md:text-sm">
        {state ? modeHint(state.mode) : "Tap / Space"} · R to restart
      </div>
    </div>
  );
}

function Stars({ filled }: { filled: 0 | 1 | 2 | 3 }) {
  return (
    <span aria-label={`${filled} of 3 stars`} className="inline-flex">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={i < filled ? "text-yellow-300" : "text-white/20"}
          style={i < filled ? { textShadow: "0 0 8px rgba(253,224,71,0.9)" } : undefined}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function Overlay({
  title, subtitle, actionLabel, accent, stars, showStars, onAction, onExit,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  accent: "pink" | "cyan";
  stars: 0 | 1 | 2 | 3;
  showStars: boolean;
  onAction: () => void;
  onExit?: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 backdrop-blur-sm">
      <div className="mx-4 max-w-md rounded-2xl border border-white/10 bg-black/60 p-6 text-center shadow-neon-pink md:p-10">
        <h2
          className={`font-display text-4xl md:text-6xl ${accent === "pink" ? "text-glow-pink text-neon-pink" : "text-glow-cyan text-neon-cyan"}`}
        >
          {title}
        </h2>
        {showStars && (
          <div className="mt-3 text-3xl">
            <Stars filled={stars} />
          </div>
        )}
        <p className="mt-3 text-sm text-white/80 md:text-base">{subtitle}</p>
        <Button className="mt-6 font-display text-base" size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
        <div className="mt-4 flex justify-center gap-3">
          {onExit ? (
            <Button variant="outline" size="sm" onClick={onExit}>Exit</Button>
          ) : (
            <Link to="/levels">
              <Button variant="outline" size="sm">Levels</Button>
            </Link>
          )}
          <Link to="/">
            <Button variant="ghost" size="sm">Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getAccentColor(cssVar: string): string {
  if (typeof window === "undefined") return "#ec4899";
  const m = cssVar.match(/var\((--[^)]+)\)/);
  if (!m) return cssVar;
  const v = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
  return v || "#ec4899";
}

function modeHint(mode: string): string {
  switch (mode) {
    case "cube":   return "Tap to jump";
    case "ship":   return "Hold to fly up · release to fall";
    case "ball":   return "Tap to swap gravity (on surface)";
    case "ufo":    return "Tap to flap";
    case "wave":   return "Hold = up · release = down";
    case "robot":  return "Tap to jump · hold for higher jump";
    case "spider": return "Tap to teleport between floor/ceiling";
    case "swing":  return "Tap to swap gravity mid-air";
    default:       return "Tap to jump";
  }
}
