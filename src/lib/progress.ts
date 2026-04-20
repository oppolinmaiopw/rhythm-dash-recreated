// Local-only progression: stars per level, completions, likes for community levels,
// list of my published level ids. All keyed in localStorage — no accounts.

export interface LevelProgress {
  bestPct: number; // 0..1
  stars: 0 | 1 | 2 | 3;
  completions: number;
  attempts: number;
}

const PROGRESS_PREFIX = "cubefall-progress-"; // + levelId
const ATTEMPTS_PREFIX = "cubefall-attempts-"; // + levelId
const LIKED_KEY = "cubefall-liked-ids";
const MINE_KEY = "cubefall-my-published-ids";

export function starsForPct(pct: number): 0 | 1 | 2 | 3 {
  if (pct >= 1) return 3;
  if (pct >= 0.66) return 2;
  if (pct >= 0.33) return 1;
  return 0;
}

export function getProgress(levelId: string): LevelProgress {
  if (typeof window === "undefined") return { bestPct: 0, stars: 0, completions: 0, attempts: 0 };
  try {
    const raw = localStorage.getItem(PROGRESS_PREFIX + levelId);
    if (raw) return JSON.parse(raw) as LevelProgress;
  } catch { /* noop */ }
  // Migrate from old `gd-best-${id}`
  const legacy = localStorage.getItem(`gd-best-${levelId}`);
  const bestPct = legacy ? Math.max(0, Math.min(1, parseFloat(legacy))) : 0;
  return { bestPct, stars: starsForPct(bestPct), completions: 0, attempts: 0 };
}

export function recordAttempt(levelId: string) {
  if (typeof window === "undefined") return;
  const cur = getProgress(levelId);
  cur.attempts += 1;
  localStorage.setItem(PROGRESS_PREFIX + levelId, JSON.stringify(cur));
  localStorage.setItem(ATTEMPTS_PREFIX + levelId, String(cur.attempts));
}

export function recordRun(levelId: string, pct: number, finished: boolean) {
  if (typeof window === "undefined") return;
  const cur = getProgress(levelId);
  cur.bestPct = Math.max(cur.bestPct, pct);
  if (finished) cur.completions += 1;
  cur.stars = starsForPct(cur.bestPct);
  localStorage.setItem(PROGRESS_PREFIX + levelId, JSON.stringify(cur));
  // Mirror to legacy key so old code keeps working
  localStorage.setItem(`gd-best-${levelId}`, String(cur.bestPct));
}

export function getAllProgress(): { id: string; progress: LevelProgress }[] {
  if (typeof window === "undefined") return [];
  const out: { id: string; progress: LevelProgress }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PROGRESS_PREFIX)) {
      const id = k.slice(PROGRESS_PREFIX.length);
      try {
        out.push({ id, progress: JSON.parse(localStorage.getItem(k)!) as LevelProgress });
      } catch { /* noop */ }
    }
  }
  return out;
}

// ---- Likes (community) ----
function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}
function writeSet(key: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

export function getLikedIds(): Set<string> { return readSet(LIKED_KEY); }
export function isLiked(id: string): boolean { return getLikedIds().has(id); }
export function toggleLike(id: string): boolean {
  const set = getLikedIds();
  if (set.has(id)) { set.delete(id); writeSet(LIKED_KEY, set); return false; }
  set.add(id); writeSet(LIKED_KEY, set); return true;
}

// ---- My published ----
export function getMyPublishedIds(): string[] {
  return Array.from(readSet(MINE_KEY));
}
export function addMyPublished(id: string) {
  const set = readSet(MINE_KEY);
  set.add(id);
  writeSet(MINE_KEY, set);
}
export function removeMyPublished(id: string) {
  const set = readSet(MINE_KEY);
  set.delete(id);
  writeSet(MINE_KEY, set);
}
