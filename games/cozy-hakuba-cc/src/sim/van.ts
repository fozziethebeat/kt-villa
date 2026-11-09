import { CONTENT, chassisDef, moduleDef } from './content';
import { canPlace, type Board, type Piece, type Placed } from './puzzles/gridPacking';
import type { Content, GameState, Placement, ScoredSeason } from './types';

/** The van interior is a grid-packing board; modules are pieces (reuses the puzzle engine). */
export function vanBoard(state: GameState): Board {
  return { w: state.van.grid.w, h: state.van.grid.h, blocked: [] };
}

export function vanPieces(state: GameState, content: Content = CONTENT): Piece[] {
  return state.van.owned.filter((id) => moduleDef(content, id).category !== 'roof').map((id) => ({ id, shape: moduleDef(content, id).shape }));
}

const toPlaced = (p: Placement): Placed => ({ id: p.moduleId, x: p.x, y: p.y, rot: p.rot });

export function canPlaceModule(state: GameState, moduleId: string, x: number, y: number, rot: number, content: Content = CONTENT): boolean {
  if (!state.van.owned.includes(moduleId) || moduleDef(content, moduleId).category === 'roof') return false;
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
  return activeModules(state).reduce((n, id) => n + moduleDef(content, id).comfort, 0);
}

export function comfortStaminaBonus(state: GameState, content: Content = CONTENT): number {
  const b = content.business;
  return Math.min(b.comfortStaminaCap, Math.floor(comfort(state, content) / b.comfortStaminaDivisor));
}

/** Everything the currently placed modules enable (recipes, crafting). */
export function enabled(state: GameState, content: Content = CONTENT): Set<string> {
  const out = new Set<string>();
  for (const id of activeModules(state)) for (const e of moduleDef(content, id).enables) out.add(e);
  return out;
}

export type BuyResult = { ok: true } | { ok: false; reason: 'owned' | 'locked' | 'yen' };

export function buyModule(state: GameState, moduleId: string, content: Content = CONTENT): BuyResult {
  const def = moduleDef(content, moduleId);
  if (state.van.owned.includes(moduleId)) return { ok: false, reason: 'owned' };
  if (def.price === 0) return { ok: false, reason: 'locked' }; // free modules come from quests
  const price = priceWithMods(state, def.price, content);
  if (state.yen < price) return { ok: false, reason: 'yen' };
  state.yen -= price;
  state.van.owned.push(moduleId);
  return { ok: true };
}

/** Grant a module from a quest reward (free). */
export function grantModule(state: GameState, moduleId: string): void {
  if (!state.van.owned.includes(moduleId)) state.van.owned.push(moduleId);
}

// ---- roof & chassis (M2) -----------------------------------------------------

export function roofSlots(state: GameState, content: Content = CONTENT): number {
  return chassisDef(content, state.chassisTier).roofSlots;
}

export type RoofResult = { ok: true } | { ok: false; reason: 'not_owned' | 'not_roof' | 'full' | 'installed' };

export function installRoof(state: GameState, moduleId: string, content: Content = CONTENT): RoofResult {
  if (!state.van.owned.includes(moduleId)) return { ok: false, reason: 'not_owned' };
  if (moduleDef(content, moduleId).category !== 'roof') return { ok: false, reason: 'not_roof' };
  if (state.van.roof.includes(moduleId)) return { ok: false, reason: 'installed' };
  if (state.van.roof.length >= roofSlots(state, content)) return { ok: false, reason: 'full' };
  state.van.roof.push(moduleId);
  return { ok: true };
}

export function uninstallRoof(state: GameState, moduleId: string): void {
  state.van.roof = state.van.roof.filter((id) => id !== moduleId);
}

/** Modules currently doing something: placed interior modules + installed roof modules. */
export function activeModules(state: GameState): string[] {
  return [...state.van.placed.map((p) => p.moduleId), ...state.van.roof];
}

export interface VanEffects { stockBonus: number; customerMult: Record<ScoredSeason, number>; tipMult: number }

export function vanEffects(state: GameState, content: Content = CONTENT): VanEffects {
  const out: VanEffects = { stockBonus: 0, customerMult: { winter: 1, green: 1 }, tipMult: 1 };
  for (const id of activeModules(state)) {
    const e = moduleDef(content, id).effects;
    if (!e) continue;
    out.stockBonus += e.stockBonus ?? 0;
    out.tipMult *= e.tipMult ?? 1;
    for (const s of ['winter', 'green'] as const) out.customerMult[s] *= e.customerMult?.[s] ?? 1;
  }
  return out;
}

/** Price after personality discounts (the Tinkerer pays 15% less for van parts). */
export function priceWithMods(state: GameState, base: number, content: Content = CONTENT): number {
  const p = content.personalities.find((x) => x.id === state.player.personality);
  return Math.round(base * (p?.mods.moduleCost ?? 1));
}

export type ChassisResult = { ok: true } | { ok: false; reason: 'no_garage' | 'max' | 'unavailable' | 'yen' };

/** Garage upgrade to the next chassis tier. Interior placements survive (grids only grow). */
export function upgradeChassis(state: GameState, content: Content = CONTENT): ChassisResult {
  if (!state.unlocks.includes('garage')) return { ok: false, reason: 'no_garage' };
  const next = content.chassis.find((c) => c.tier === state.chassisTier + 1);
  if (!next) return { ok: false, reason: 'max' };
  if (!next.available) return { ok: false, reason: 'unavailable' };
  const price = priceWithMods(state, next.price, content);
  if (state.yen < price) return { ok: false, reason: 'yen' };
  state.yen -= price;
  state.chassisTier = next.tier;
  state.van.grid = { ...next.grid };
  state.log.push(`Day ${state.day}: van upgraded to ${next.name}.`);
  return { ok: true };
}
