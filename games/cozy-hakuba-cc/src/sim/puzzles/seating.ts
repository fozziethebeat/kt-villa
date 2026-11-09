import { nextRandom } from '../rng';

/**
 * Constraint-seating engine (§5.3): seat guests so every wish holds.
 * Layouts: a straight izakaya `counter` (neighbours are i±1), or a gondola `cabin` (two benches facing each
 * other; neighbours share a bench, and the two benches must balance by weight).
 */
export type Layout = 'counter' | 'cabin';
export interface Guest { id: string; name: string; weight: number }
export type Constraint =
  | { kind: 'next'; a: string; b: string }
  | { kind: 'apart'; a: string; b: string }
  | { kind: 'end'; a: string }
  | { kind: 'door'; a: string }
  | { kind: 'balanced'; tolerance: number };
export interface SeatingPuzzle { layout: Layout; seats: number; guests: Guest[]; constraints: Constraint[]; solution: string[] }
/** Seat index → guest id (or null for empty). */
export type Assignment = (string | null)[];

export function bench(layout: Layout, seats: number, i: number): number {
  return layout === 'cabin' ? (i < seats / 2 ? 0 : 1) : 0;
}

export function neighbours(layout: Layout, seats: number, i: number): number[] {
  return [i - 1, i + 1].filter((j) => j >= 0 && j < seats && bench(layout, seats, j) === bench(layout, seats, i));
}

export function isEnd(layout: Layout, seats: number, i: number): boolean {
  return neighbours(layout, seats, i).length < 2;
}

export type Status = 'ok' | 'bad' | 'open';

export function checkConstraint(p: SeatingPuzzle, c: Constraint, seat: Assignment): Status {
  const at = (id: string) => seat.indexOf(id);
  if (c.kind === 'balanced') {
    if (seat.some((s) => s === null)) return 'open';
    const side = [0, 0];
    seat.forEach((id, i) => { side[bench(p.layout, p.seats, i)] += p.guests.find((g) => g.id === id)!.weight; });
    return Math.abs(side[0] - side[1]) <= c.tolerance ? 'ok' : 'bad';
  }
  if (c.kind === 'door') {
    const i = at(c.a);
    return i < 0 ? 'open' : i === 0 ? 'ok' : 'bad';
  }
  if (c.kind === 'end') {
    const i = at(c.a);
    return i < 0 ? 'open' : isEnd(p.layout, p.seats, i) ? 'ok' : 'bad';
  }
  const i = at(c.a), j = at(c.b);
  if (i < 0 || j < 0) return 'open';
  const adj = neighbours(p.layout, p.seats, i).includes(j);
  return (c.kind === 'next') === adj ? 'ok' : 'bad';
}

export function isSolved(p: SeatingPuzzle, seat: Assignment): boolean {
  return seat.every((s) => s !== null) && p.constraints.every((c) => checkConstraint(p, c, seat) === 'ok');
}

function permutations<T>(xs: T[]): T[][] {
  if (xs.length <= 1) return [xs];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((r) => [x, ...r]));
}

export function countSolutions(p: SeatingPuzzle, limit = 2): number {
  let n = 0;
  for (const perm of permutations(p.guests.map((g) => g.id))) {
    if (isSolved(p, perm)) { n++; if (n >= limit) break; }
  }
  return n;
}

export function describe(c: Constraint, guests: Guest[]): string {
  const name = (id: string) => guests.find((g) => g.id === id)!.name;
  switch (c.kind) {
    case 'next': return `${name(c.a)} wants to sit next to ${name(c.b)}`;
    case 'apart': return `Keep ${name(c.a)} and ${name(c.b)} apart`;
    case 'end': return `${name(c.a)} wants an end seat`;
    case 'door': return `${name(c.a)} wants the seat by the door (seat 1)`;
    case 'balanced': return `Both benches must weigh about the same (within ${c.tolerance})`;
  }
}

/**
 * Seeded generator: shuffle a hidden solution, then add true-in-solution wishes until the seating is unique
 * (mirror images count as different seatings, so a unique answer needs an "end" or one-sided wish).
 */
export function generateSeating(seed: number, layout: Layout, guests: Guest[], opts: { maxConstraints?: number } = {}): SeatingPuzzle {
  let st = seed >>> 0;
  const rand = () => { const [v, n] = nextRandom(st); st = n; return v; };
  const shuffle = <T,>(xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const seats = guests.length;
  for (let attempt = 0; attempt < 50; attempt++) {
    const solution = shuffle(guests.map((g) => g.id));
    const base: SeatingPuzzle = { layout, seats, guests, constraints: [], solution };
    if (layout === 'cabin') {
      base.constraints.push({ kind: 'balanced', tolerance: 1 });
      if (checkConstraint(base, base.constraints[0], solution) !== 'ok') continue;
    }
    const pool: Constraint[] = [];
    const ids = guests.map((g) => g.id);
    for (const a of ids) for (const b of ids) if (a < b) {
      const c: Constraint = { kind: checkConstraint(base, { kind: 'next', a, b }, solution) === 'ok' ? 'next' : 'apart', a, b };
      pool.push(c);
    }
    for (const a of ids) if (checkConstraint(base, { kind: 'end', a }, solution) === 'ok' && a !== solution[0]) pool.push({ kind: 'end', a });
    pool.push({ kind: 'door', a: solution[0] });
    const picks = shuffle(pool).sort((x, y) => (x.kind === 'apart' ? 1 : 0) - (y.kind === 'apart' ? 1 : 0)); // prefer friendly wishes
    const p: SeatingPuzzle = { ...base, constraints: [...base.constraints] };
    for (const c of picks) {
      if (countSolutions(p, 2) === 1) break;
      if (p.constraints.length >= (opts.maxConstraints ?? 8)) break;
      p.constraints.push(c);
    }
    // Uniqueness isn't required for fun, but the hidden solution must satisfy everything.
    if (isSolved(p, solution)) return p;
  }
  throw new Error('seating generator failed');
}
