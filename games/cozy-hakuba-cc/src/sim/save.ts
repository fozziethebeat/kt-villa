import { createNewGame } from './game';
import type { GameState } from './types';

export const SAVE_KEY = 'hakuba-wakeup-save';

export function serialize(state: GameState): string {
  return JSON.stringify(state);
}

/** Parse a save; returns null for corrupt or incompatible saves (never throws). */
export function deserialize(raw: string | null | undefined): GameState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GameState>;
    const v = parsed.version as number | undefined;
    if (v !== 2 && v !== 3 && v !== 4) return null;
    // Fill any fields added after the save was written (v3 adds roof slots, menu choice, shift region; v4 adds season stats + reports).
    const base = createNewGame({ seed: parsed.seed });
    return { ...base, ...parsed, version: 4, van: { ...base.van, ...parsed.van }, business: { ...base.business, ...parsed.business } } as GameState;
  } catch {
    return null;
  }
}
