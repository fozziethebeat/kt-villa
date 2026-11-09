import { nextRandom } from '../rng';

/**
 * Cairn balance (balance / placement engine, §5.3), first used at Happo Pond.
 * Stack stones one at a time (side view). The stack stands when, for every stone, the centre of mass of
 * everything above it sits over that stone, and the whole stack's centre of mass sits over the base rock.
 * Cairns point the way: the top stone must end up over the trail marker.
 */
export interface Stone { id: string; w: number; h: number }
export interface CairnPuzzle { stones: Stone[]; baseW: number; target: number; tolerance: number; solution: { id: string; x: number }[] }
export interface Placed { id: string; x: number }

const mass = (s: Stone) => s.w * s.h;

/** Index of the lowest stone that the stack above it would topple off (or -1 = base), null when stable. */
export function failPoint(p: CairnPuzzle, stack: Placed[]): number | null {
  const stone = (id: string) => p.stones.find((s) => s.id === id)!;
  for (let k = stack.length - 1; k >= -1; k--) {
    const above = stack.slice(k + 1);
    if (!above.length) continue;
    const m = above.reduce((a, s) => a + mass(stone(s.id)), 0);
    const com = above.reduce((a, s) => a + mass(stone(s.id)) * s.x, 0) / m;
    const half = k >= 0 ? stone(stack[k].id).w / 2 : p.baseW / 2;
    const cx = k >= 0 ? stack[k].x : 0;
    if (Math.abs(com - cx) > half) return k;
  }
  return null;
}

export function evaluate(p: CairnPuzzle, stack: Placed[]): { stable: boolean; complete: boolean; pointing: boolean; solved: boolean } {
  const stable = failPoint(p, stack) === null;
  const complete = stack.length === p.stones.length;
  const top = stack[stack.length - 1];
  const pointing = !!top && Math.abs(top.x - p.target) <= p.tolerance;
  return { stable, complete, pointing, solved: stable && complete && pointing };
}

/**
 * Seeded generator. Builds the widest-first "staircase" with maximum safe overhang, then scales it so the top
 * lands on the trail marker. Scaling a stable stack toward the centre keeps it stable, so it's solvable.
 */
export function generateCairn(seed: number, n = 5): CairnPuzzle {
  let st = seed >>> 0;
  const rand = () => { const [v, nx] = nextRandom(st); st = nx; return v; };
  const stones: Stone[] = Array.from({ length: n }, (_, i) => ({ id: `s${i}`, w: Math.round(70 + rand() * 80), h: Math.round(26 + rand() * 16) }));
  const order = [...stones].sort((a, b) => b.w - a.w);
  const baseW = 170;
  // Greedy max overhang to the right, built bottom-up while keeping every partial stack stable.
  const xs: number[] = [];
  for (let i = 0; i < order.length; i++) {
    let lo = i ? xs[i - 1] : 0, hi = lo + order[i].w;
    for (let it = 0; it < 30; it++) {
      const mid = (lo + hi) / 2;
      const trial = [...order.slice(0, i + 1).map((s, k) => ({ id: s.id, x: k < i ? xs[k] : mid }))];
      if (failPoint({ stones, baseW, target: 0, tolerance: 0, solution: [] }, trial) === null) lo = mid; else hi = mid;
    }
    xs.push(lo * 0.98);
  }
  const scale = 0.55 + rand() * 0.15;
  const solution = order.map((s, k) => ({ id: s.id, x: Math.round(xs[k] * scale) }));
  return { stones, baseW, target: solution[solution.length - 1].x, tolerance: 16, solution };
}
