import { SAVE_KEY, deserialize, serialize } from './sim/save';
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
