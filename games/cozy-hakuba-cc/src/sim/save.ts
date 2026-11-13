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
    if (v === undefined || v < 2 || v > 5) return null;
    // Fill any fields added after the save was written (v3 adds roof slots, menu choice, shift region; v4 adds season stats + reports; v5 adds ranks' second trade, helpers, ending).
    const base = createNewGame({ seed: parsed.seed });
    return { ...base, ...parsed, version: 5, van: { ...base.van, ...parsed.van }, business: { ...base.business, ...parsed.business } } as GameState;
  } catch {
    return null;
  }
}
