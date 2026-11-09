import { CONTENT, moduleDef } from './content';
import { canPlace, type Board, type Piece, type Placed } from './puzzles/gridPacking';
import type { Content, GameState, Placement } from './types';

/** The van interior is a grid-packing board; modules are pieces (reuses the puzzle engine). */
export function vanBoard(state: GameState): Board {
  return { w: state.van.grid.w, h: state.van.grid.h, blocked: [] };
}

export function vanPieces(state: GameState, content: Content = CONTENT): Piece[] {
  return state.van.owned.map((id) => ({ id, shape: moduleDef(content, id).shape }));
}

const toPlaced = (p: Placement): Placed => ({ id: p.moduleId, x: p.x, y: p.y, rot: p.rot });

export function canPlaceModule(state: GameState, moduleId: string, x: number, y: number, rot: number, content: Content = CONTENT): boolean {
  if (!state.van.owned.includes(moduleId)) return false;
  return canPlace(vanBoard(state), vanPieces(state, content), state.van.placed.map(toPlaced), { id: moduleId, x, y, rot });
}

export function placeModule(state: GameState, moduleId: string, x: number, y: number, rot: number, content: Content = CONTENT): boolean {
  if (!canPlaceModule(state, moduleId, x, y, rot, content)) return false;
  state.van.placed = [...state.van.placed.filter((p) => p.moduleId !== moduleId), { moduleId, x, y, rot }];
  return true;
}

export function removeModule(state: GameState, moduleId: string): void {
  state.van.placed = state.van.placed.filter((p) => p.moduleId !== moduleId);
}

export function isPlaced(state: GameState, moduleId: string): boolean {
  return state.van.placed.some((p) => p.moduleId === moduleId);
}

export function comfort(state: GameState, content: Content = CONTENT): number {
  return state.van.placed.reduce((n, p) => n + moduleDef(content, p.moduleId).comfort, 0);
}

export function comfortStaminaBonus(state: GameState, content: Content = CONTENT): number {
  const b = content.business;
  return Math.min(b.comfortStaminaCap, Math.floor(comfort(state, content) / b.comfortStaminaDivisor));
}

/** Everything the currently placed modules enable (recipes, crafting). */
export function enabled(state: GameState, content: Content = CONTENT): Set<string> {
  const out = new Set<string>();
  for (const p of state.van.placed) for (const e of moduleDef(content, p.moduleId).enables) out.add(e);
  return out;
}

export type BuyResult = { ok: true } | { ok: false; reason: 'owned' | 'locked' | 'yen' };

export function buyModule(state: GameState, moduleId: string, content: Content = CONTENT): BuyResult {
  const def = moduleDef(content, moduleId);
  if (state.van.owned.includes(moduleId)) return { ok: false, reason: 'owned' };
  if (def.price === 0) return { ok: false, reason: 'locked' }; // free modules come from quests
  if (state.yen < def.price) return { ok: false, reason: 'yen' };
  state.yen -= def.price;
  state.van.owned.push(moduleId);
  return { ok: true };
}

/** Grant a module from a quest reward (free). */
export function grantModule(state: GameState, moduleId: string): void {
  if (!state.van.owned.includes(moduleId)) state.van.owned.push(moduleId);
}
