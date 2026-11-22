import { SAVE_KEY, deserialize, serialize } from './sim/save';
import { CONTENT } from './sim/content';
import { season } from './sim/game';
import type { GameState } from './sim/types';

/** Browser save storage. Every access is wrapped: storage can be blocked or throw. */
export function saveGame(state: GameState): boolean {
  try { localStorage.setItem(SAVE_KEY, serialize(state)); return true; } catch { return false; }
}

export function loadGame(): GameState | null {
  try { return deserialize(localStorage.getItem(SAVE_KEY)); } catch { return null; }
}

export function clearSave(): void {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}

// ---- manual save slots (M5) ---------------------------------------------------

export const SLOT_COUNT = 3;
const slotKey = (n: number) => `${SAVE_KEY}-slot-${n}`;

export interface SlotInfo { slot: number; empty: boolean; label: string; savedAt: string | null }

/** One-line description of a save: who, when, where. */
export function describeSave(s: GameState): string {
  const region = CONTENT.regions.find((r) => r.id === s.currentRegion)?.name ?? s.currentRegion;
  return `${s.player.name} · Day ${s.day} ${season(s).label} · ${region}`;
}

export function saveToSlot(n: number, state: GameState): boolean {
  try {
    localStorage.setItem(slotKey(n), JSON.stringify({ savedAt: new Date().toISOString(), state: serialize(state) }));
    return true;
  } catch { return false; }
}

export function loadSlot(n: number): GameState | null {
  try {
    const raw = JSON.parse(localStorage.getItem(slotKey(n)) ?? 'null');
    return raw ? deserialize(raw.state) : null;
  } catch { return null; }
}

export function listSlots(): SlotInfo[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => {
    const n = i + 1;
    try {
      const raw = JSON.parse(localStorage.getItem(slotKey(n)) ?? 'null');
      const st = raw ? deserialize(raw.state) : null;
      if (st) return { slot: n, empty: false, label: describeSave(st), savedAt: raw.savedAt ?? null };
    } catch { /* fall through */ }
    return { slot: n, empty: true, label: 'Empty slot', savedAt: null };
  });
}
