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
    if (parsed.version !== 2) return null;
    // Fill any fields added after the save was written.
    const base = createNewGame({ seed: parsed.seed });
    return { ...base, ...parsed, van: { ...base.van, ...parsed.van }, business: { ...base.business, ...parsed.business } } as GameState;
  } catch {
    return null;
  }
}
