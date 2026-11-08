import type { GameState } from './types';

type Listener = (state: GameState, reason: string) => void;

/** Tiny observable wrapper so Phaser scenes can react to sim changes without owning state. */
export class GameStore {
  private listeners = new Set<Listener>();
  constructor(public state: GameState) {}

  update(reason: string, fn: (s: GameState) => void): void {
    fn(this.state);
    for (const l of this.listeners) l(this.state, reason);
  }

  replace(state: GameState, reason = 'replace'): void {
    this.state = state;
    for (const l of this.listeners) l(this.state, reason);
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}
