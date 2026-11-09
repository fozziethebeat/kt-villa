import { CONTENT, regionDef } from './content';
import { addUnlock, canTravelTo, spendAction, staminaLeft, take } from './game';
import type { Content, GameState } from './types';

export function roadOpen(state: GameState, id: string): boolean {
  return id === 'station' || state.unlocks.includes(`road:${id}`);
}

export type DriveCheck = { ok: true } | { ok: false; reason: 'here' | 'road' | 'chassis' | 'region' | 'not_built' | 'tired' };

export function canDriveTo(state: GameState, id: string, content: Content = CONTENT): DriveCheck {
  if (state.currentRegion === id) return { ok: false, reason: 'here' };
  if (!roadOpen(state, id)) return { ok: false, reason: 'road' };
  const t = canTravelTo(state, id, content);
  if (!t.ok) return { ok: false, reason: t.missing.some((m) => m.startsWith('chassis')) ? 'chassis' : 'region' };
  if (!regionDef(content, id).playable) return { ok: false, reason: 'not_built' };
  if (staminaLeft(state) < content.tuning.actionCosts.drive) return { ok: false, reason: 'tired' };
  return { ok: true };
}

/** Drive the van to another region (1 stamina). */
export function drive(state: GameState, id: string, content: Content = CONTENT): DriveCheck {
  const c = canDriveTo(state, id, content);
  if (!c.ok) return c;
  spendAction(state, 'drive', content);
  state.currentRegion = id;
  state.log.push(`Day ${state.day}: drove to ${regionDef(content, id).name}.`);
  return c;
}

/** Roads the Revival Board can open: unopened neighbours of any Thriving region you can already reach. */
export function roadOffers(state: GameState, content: Content = CONTENT): string[] {
  const out: string[] = [];
  for (const r of [...content.regions].sort((a, b) => a.order - b.order)) {
    if (!roadOpen(state, r.id) || state.regions[r.id].vitality < 3) continue;
    for (const n of r.connects) if (!out.includes(n) && n !== 'station') out.push(n);
  }
  return out;
}

export type RoadResult = { ok: true } | { ok: false; reason: 'open' | 'not_offered' | 'kizuna' };

export function openRoad(state: GameState, id: string, content: Content = CONTENT): RoadResult {
  if (roadOpen(state, id)) return { ok: false, reason: 'open' };
  if (!roadOffers(state, content).includes(id)) return { ok: false, reason: 'not_offered' };
  if (!take(state, 'kizuna', content.tuning.roadCost)) return { ok: false, reason: 'kizuna' };
  addUnlock(state, `road:${id}`);
  return { ok: true };
}
