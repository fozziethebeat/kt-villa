import { nextRandom } from '../rng';

/**
 * Balance / placement engine (§5.3), first used for tent pitching at Snow Peak.
 * Top-down grid. The tent sits on the centre cell; its four corners each pull on a guy line pegged
 * somewhere in that corner's quadrant. Each line pulls like a spring (force = peg − corner), so the tent
 * stands straight when the four pulls cancel out. Rocks block cells; lines have a min/max length.
 */
export type Cell = [number, number];
export interface Corner { id: 'nw' | 'ne' | 'sw' | 'se'; at: Cell; dir: Cell }
export interface TentPuzzle { w: number; h: number; center: Cell; corners: Corner[]; rocks: Cell[]; minLen: number; maxLen: number }
export type Pegs = Partial<Record<Corner['id'], Cell>>;

export const CORNER_IDS: Corner['id'][] = ['nw', 'ne', 'sw', 'se'];

export function makeCorners(center: Cell): Corner[] {
  const [cx, cy] = center;
  return [
    { id: 'nw', at: [cx - 1, cy - 1], dir: [-1, -1] },
    { id: 'ne', at: [cx + 1, cy - 1], dir: [1, -1] },
    { id: 'sw', at: [cx - 1, cy + 1], dir: [-1, 1] },
    { id: 'se', at: [cx + 1, cy + 1], dir: [1, 1] },
  ];
}

const key = (c: Cell) => `${c[0]},${c[1]}`;
export const lineLength = (a: Cell, b: Cell) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Which corner owns a cell (the quadrant it's in), or null for the tent's own rows/columns. */
export function cornerForCell(p: TentPuzzle, cell: Cell): Corner | null {
  const dx = Math.sign(cell[0] - p.center[0]), dy = Math.sign(cell[1] - p.center[1]);
  if (!dx || !dy) return null;
  return p.corners.find((c) => c.dir[0] === dx && c.dir[1] === dy) ?? null;
}

export type PegCheck = { ok: true; corner: Corner } | { ok: false; reason: 'outside' | 'axis' | 'tent' | 'rock' | 'short' | 'long' };

export function checkPeg(p: TentPuzzle, cell: Cell): PegCheck {
  const [x, y] = cell;
  if (x < 0 || y < 0 || x >= p.w || y >= p.h) return { ok: false, reason: 'outside' };
  if (Math.abs(x - p.center[0]) <= 1 && Math.abs(y - p.center[1]) <= 1) return { ok: false, reason: 'tent' };
  const corner = cornerForCell(p, cell);
  if (!corner) return { ok: false, reason: 'axis' };
  if (p.rocks.some((r) => r[0] === x && r[1] === y)) return { ok: false, reason: 'rock' };
  const len = lineLength(corner.at, cell);
  if (len < p.minLen) return { ok: false, reason: 'short' };
  if (len > p.maxLen) return { ok: false, reason: 'long' };
  return { ok: true, corner };
}

/** Net pull on the tent (sum of spring forces). Zero = standing straight. */
export function netForce(p: TentPuzzle, pegs: Pegs): [number, number] {
  let fx = 0, fy = 0;
  for (const c of p.corners) {
    const peg = pegs[c.id];
    if (!peg) { fx -= c.dir[0] * 2; fy -= c.dir[1] * 2; continue; } // an unpegged corner sags inward
    fx += peg[0] - c.at[0]; fy += peg[1] - c.at[1];
  }
  return [fx, fy];
}

export function allPegged(p: TentPuzzle, pegs: Pegs): boolean {
  return p.corners.every((c) => { const g = pegs[c.id]; return !!g && checkPeg(p, g).ok; });
}

/** Solved when all four lines are pegged and the leftover lean is at most one cell. Perfect = exactly balanced. */
export function evaluate(p: TentPuzzle, pegs: Pegs): { solved: boolean; perfect: boolean; lean: number } {
  const [fx, fy] = netForce(p, pegs);
  const lean = Math.hypot(fx, fy);
  const ok = allPegged(p, pegs);
  return { solved: ok && lean <= 1, perfect: ok && lean === 0, lean };
}

export function candidates(p: TentPuzzle, corner: Corner): Cell[] {
  const out: Cell[] = [];
  for (let x = 0; x < p.w; x++) for (let y = 0; y < p.h; y++) {
    const r = checkPeg(p, [x, y]);
    if (r.ok && r.corner.id === corner.id) out.push([x, y]);
  }
  return out;
}

/** Find a perfectly balanced pegging, preferring one that agrees with `keep` (for hints). */
export function solve(p: TentPuzzle, keep: Pegs = {}): Pegs | null {
  const cands = p.corners.map((c) => (keep[c.id] && checkPeg(p, keep[c.id]!).ok ? [keep[c.id]!] : candidates(p, c)));
  const [a, b, c, d] = cands;
  const target: Cell = [p.corners.reduce((s, k) => s + k.at[0], 0), p.corners.reduce((s, k) => s + k.at[1], 0)];
  // Index the last quadrant's cells by coordinate for an O(n³) search.
  const dIndex = new Map(d.map((cell) => [key(cell), cell]));
  for (const pa of a) for (const pb of b) for (const pc of c) {
    const need: Cell = [target[0] - pa[0] - pb[0] - pc[0], target[1] - pa[1] - pb[1] - pc[1]];
    const pd = dIndex.get(key(need));
    if (pd) return { [p.corners[0].id]: pa, [p.corners[1].id]: pb, [p.corners[2].id]: pc, [p.corners[3].id]: pd } as Pegs;
  }
  // Retry without the kept pegs if they made it impossible.
  return Object.keys(keep).length ? solve(p, {}) : null;
}

/**
 * Seeded generator: scatter rocks (more on one side, so the obvious mirror-image pegging is blocked),
 * then keep only layouts that still have a perfect solution.
 */
export function generateTent(seed: number, opts: { w?: number; h?: number; rocks?: number } = {}): TentPuzzle {
  const w = opts.w ?? 11, h = opts.h ?? 9, nRocks = opts.rocks ?? 14;
  const center: Cell = [Math.floor(w / 2), Math.floor(h / 2)];
  let st = seed >>> 0;
  const rand = () => { const [v, n] = nextRandom(st); st = n; return v; };
  for (let attempt = 0; attempt < 200; attempt++) {
    const rocks: Cell[] = [];
    const taken = new Set<string>();
    while (rocks.length < nRocks) {
      // Bias rocks toward the east half so pulls must be rebalanced asymmetrically.
      const x = Math.floor(rand() < 0.65 ? center[0] + 1 + rand() * (w - center[0] - 1) : rand() * center[0]);
      const y = Math.floor(rand() * h);
      const c: Cell = [x, y];
      if (Math.abs(x - center[0]) <= 1 && Math.abs(y - center[1]) <= 1) continue;
      if (taken.has(key(c))) continue;
      taken.add(key(c)); rocks.push(c);
    }
    const p: TentPuzzle = { w, h, center, corners: makeCorners(center), rocks, minLen: 2, maxLen: 4 };
    // Require a solution, and that the symmetric "diagonal 2 out" pegging is blocked somewhere.
    const naive: Pegs = Object.fromEntries(p.corners.map((c) => [c.id, [c.at[0] + c.dir[0] * 2, c.at[1] + c.dir[1] * 2] as Cell]));
    if (allPegged(p, naive)) continue;
    if (solve(p)) return p;
  }
  throw new Error('tent generator failed');
}
