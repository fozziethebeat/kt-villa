import { nextRandom } from '../rng';

/**
 * Flow / path-connect engine (§5.3): join each pair of matching stops with a path through the grid.
 * Paths move orthogonally and never cross. First used for Happo-One shuttle routes; later MTB trails and boardwalks.
 */
export type Cell = [number, number];
export interface FlowPair { id: string; a: Cell; b: Cell }
export interface FlowPuzzle { w: number; h: number; pairs: FlowPair[]; solution: Record<string, Cell[]> }
export type Paths = Record<string, Cell[]>;

const eq = (p: Cell, q: Cell) => p[0] === q[0] && p[1] === q[1];
const key = (c: Cell) => `${c[0]},${c[1]}`;
const adjacent = (p: Cell, q: Cell) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) === 1;

/** A path is valid when it runs a↔b through adjacent in-bounds cells and touches no other pair's stops. */
export function pathValid(p: FlowPuzzle, pair: FlowPair, path: Cell[] | undefined): boolean {
  if (!path || path.length < 2) return false;
  const first = path[0], last = path[path.length - 1];
  if (!((eq(first, pair.a) && eq(last, pair.b)) || (eq(first, pair.b) && eq(last, pair.a)))) return false;
  const seen = new Set<string>();
  for (let i = 0; i < path.length; i++) {
    const c = path[i];
    if (c[0] < 0 || c[1] < 0 || c[0] >= p.w || c[1] >= p.h) return false;
    if (seen.has(key(c))) return false;
    seen.add(key(c));
    if (i > 0 && !adjacent(path[i - 1], c)) return false;
    if (p.pairs.some((o) => o.id !== pair.id && (eq(o.a, c) || eq(o.b, c)))) return false;
  }
  return true;
}

export function overlaps(paths: Paths): boolean {
  const used = new Set<string>();
  for (const path of Object.values(paths)) for (const c of path) { if (used.has(key(c))) return true; used.add(key(c)); }
  return false;
}

export function connected(p: FlowPuzzle, paths: Paths): string[] {
  return p.pairs.filter((pair) => pathValid(p, pair, paths[pair.id])).map((pair) => pair.id);
}

export function isSolved(p: FlowPuzzle, paths: Paths): boolean {
  return !overlaps(paths) && connected(p, paths).length === p.pairs.length;
}

export function coverage(p: FlowPuzzle, paths: Paths): number {
  const used = new Set<string>();
  for (const path of Object.values(paths)) for (const c of path) used.add(key(c));
  return used.size / (p.w * p.h);
}

/**
 * Seeded generator: grow non-crossing random-walk routes one by one (each at least `minLen` long);
 * their endpoints become the stops. Solvable by construction.
 */
export function generateFlow(seed: number, w: number, h: number, nPairs: number, ids: string[], minLen = 4): FlowPuzzle {
  let st = seed >>> 0;
  const rand = () => { const [v, n] = nextRandom(st); st = n; return v; };
  for (let attempt = 0; attempt < 400; attempt++) {
    const used = new Set<string>();
    const solution: Record<string, Cell[]> = {};
    const pairs: FlowPair[] = [];
    let ok = true;
    for (let k = 0; k < nPairs && ok; k++) {
      let path: Cell[] | null = null;
      for (let tries = 0; tries < 60 && !path; tries++) {
        const start: Cell = [Math.floor(rand() * w), Math.floor(rand() * h)];
        if (used.has(key(start))) continue;
        const walk: Cell[] = [start];
        const inWalk = new Set([key(start)]);
        const target = minLen + Math.floor(rand() * Math.max(1, Math.floor((w * h) / nPairs) - minLen));
        while (walk.length < target) {
          const [x, y] = walk[walk.length - 1];
          const opts = ([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as Cell[]).filter((c) => c[0] >= 0 && c[1] >= 0 && c[0] < w && c[1] < h && !used.has(key(c)) && !inWalk.has(key(c)));
          if (!opts.length) break;
          const n = opts[Math.floor(rand() * opts.length)];
          walk.push(n); inWalk.add(key(n));
        }
        // Reject endpoints that touch each other (trivial) or walks that are too short.
        if (walk.length >= minLen && !adjacent(walk[0], walk[walk.length - 1])) path = walk;
      }
      if (!path) { ok = false; break; }
      for (const c of path) used.add(key(c));
      const id = ids[k];
      solution[id] = path;
      pairs.push({ id, a: path[0], b: path[path.length - 1] });
    }
    if (ok) return { w, h, pairs, solution };
  }
  throw new Error('flow generator failed');
}
