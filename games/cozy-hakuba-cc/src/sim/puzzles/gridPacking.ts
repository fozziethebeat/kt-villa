import { nextRandom } from '../rng';
import type { Shape } from '../types';

/**
 * Grid-packing engine (polyominoes on a rectangular grid). Shared by the luggage puzzle,
 * garden beds, and van module layout. Pure and deterministic.
 */
export interface Piece { id: string; shape: Shape; color?: number }
export interface Placed { id: string; x: number; y: number; rot: number }
export interface Board { w: number; h: number; blocked: Shape }

const key = (x: number, y: number) => `${x},${y}`;

export function normalize(shape: Shape): Shape {
  const minX = Math.min(...shape.map((c) => c[0]));
  const minY = Math.min(...shape.map((c) => c[1]));
  return shape.map(([x, y]) => [x - minX, y - minY] as [number, number]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

/** Rotate a shape by rot * 90° clockwise, normalized to the origin. */
export function rotate(shape: Shape, rot: number): Shape {
  let s: Shape = shape.map(([x, y]) => [x, y]);
  for (let i = 0; i < ((rot % 4) + 4) % 4; i++) s = s.map(([x, y]) => [-y, x]);
  return normalize(s);
}

export function cellsOf(piece: Piece, p: Placed): Shape {
  return rotate(piece.shape, p.rot).map(([x, y]) => [x + p.x, y + p.y]);
}

export function occupancy(board: Board, pieces: Piece[], placed: Placed[], ignoreId?: string): Map<string, string> {
  const occ = new Map<string, string>();
  for (const [x, y] of board.blocked) occ.set(key(x, y), '#');
  for (const p of placed) {
    if (p.id === ignoreId) continue;
    const piece = pieces.find((pc) => pc.id === p.id);
    if (!piece) continue;
    for (const [x, y] of cellsOf(piece, p)) occ.set(key(x, y), p.id);
  }
  return occ;
}

export function canPlace(board: Board, pieces: Piece[], placed: Placed[], candidate: Placed): boolean {
  const piece = pieces.find((pc) => pc.id === candidate.id);
  if (!piece) return false;
  const occ = occupancy(board, pieces, placed, candidate.id);
  return cellsOf(piece, candidate).every(([x, y]) => x >= 0 && y >= 0 && x < board.w && y < board.h && !occ.has(key(x, y)));
}

/** Returns the new placement list, or null if the move is illegal. */
export function place(board: Board, pieces: Piece[], placed: Placed[], candidate: Placed): Placed[] | null {
  if (!canPlace(board, pieces, placed, candidate)) return null;
  return [...placed.filter((p) => p.id !== candidate.id), candidate];
}

export function isSolved(board: Board, pieces: Piece[], placed: Placed[]): boolean {
  if (pieces.some((pc) => !placed.find((p) => p.id === pc.id))) return false;
  const occ = occupancy(board, pieces, placed);
  return occ.size === board.w * board.h;
}

export interface GeneratedPuzzle { board: Board; pieces: Piece[]; solution: Placed[]; rngState: number }

/**
 * Generate a solvable puzzle by carving the free cells of a board into random polyominoes.
 * Solvable by construction; each piece's canonical shape is a random rotation of its solved cells.
 */
export function generate(w: number, h: number, rngState: number, opts: { minSize?: number; maxSize?: number; blocked?: Shape } = {}): GeneratedPuzzle {
  const minSize = opts.minSize ?? 2;
  const maxSize = opts.maxSize ?? 4;
  let st = rngState;
  const rand = () => { const [v, n] = nextRandom(st); st = n; return v; };
  const blocked = opts.blocked ?? [];
  const owner = new Map<string, number>();
  for (const [x, y] of blocked) owner.set(key(x, y), -1);
  const groups: Shape[] = [];
  const free = () => { const out: Shape = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!owner.has(key(x, y))) out.push([x, y]); return out; };
  const neighbors = ([x, y]: [number, number]): Shape => ([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as Shape).filter(([a, b]) => a >= 0 && b >= 0 && a < w && b < h);

  let cells = free();
  while (cells.length) {
    const start = cells[0]; // scan order keeps regions compact and avoids isolated singletons
    const target = minSize + Math.floor(rand() * (maxSize - minSize + 1));
    const group: Shape = [start];
    owner.set(key(...start), groups.length);
    while (group.length < target) {
      const frontier = group.flatMap(neighbors).filter(([x, y]) => !owner.has(key(x, y)));
      if (!frontier.length) break;
      const pick = frontier[Math.floor(rand() * frontier.length)];
      owner.set(key(...pick), groups.length);
      group.push(pick);
    }
    groups.push(group);
    cells = free();
  }
  // Merge singletons into a neighbouring group so pieces stay interesting.
  for (let gi = 0; gi < groups.length; gi++) {
    if (groups[gi].length !== 1 || minSize <= 1) continue;
    const [c] = groups[gi];
    const n = neighbors(c).map(([x, y]) => owner.get(key(x, y))).find((o) => o !== undefined && o >= 0 && o !== gi && groups[o].length < maxSize + 1);
    if (n === undefined) continue;
    groups[n].push(c); owner.set(key(...c), n); groups[gi] = [];
  }

  const pieces: Piece[] = [];
  const solution: Placed[] = [];
  groups.filter((g) => g.length).forEach((g, i) => {
    const id = `p${i}`;
    const minX = Math.min(...g.map((c) => c[0]));
    const minY = Math.min(...g.map((c) => c[1]));
    const solved = normalize(g);
    // Canonical shape = solved shape rotated by -rot, so placing it at rot reproduces the solution.
    const rot = Math.floor(rand() * 4);
    const canonical = rotate(solved, (4 - rot) % 4);
    // Rotation normalization may shift the anchor; recompute the offset so cells match exactly.
    const rotated = rotate(canonical, rot);
    const offX = minX + (Math.min(...solved.map((c) => c[0])) - Math.min(...rotated.map((c) => c[0])));
    const offY = minY + (Math.min(...solved.map((c) => c[1])) - Math.min(...rotated.map((c) => c[1])));
    pieces.push({ id, shape: canonical });
    solution.push({ id, x: offX, y: offY, rot });
  });
  return { board: { w, h, blocked }, pieces, solution, rngState: st };
}
