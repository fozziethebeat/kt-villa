import type Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT } from '../sim/content';
import { createNewGame, grant, jumpToSeason, phase, season, setVitality, spendAction, staminaLeft } from '../sim/game';
import type { ActionKind, SeasonId, Vitality } from '../sim/types';

/**
 * Debug/playtest API exposed as window.__hakuba. Used by Claude in the browser pane and by Playwright.
 * Mutations go through store.update('debug', ...) so scenes snap to the new state without long tweens.
 */
export function installDebugApi(game: Phaser.Game) {
  const api = {
    game,
    content: CONTENT,
    getState: () => JSON.parse(JSON.stringify(store.state)),
    summary: () => ({ day: store.state.day, season: season(store.state), phase: phase(store.state), stamina: staminaLeft(store.state), yen: store.state.yen, kizuna: store.state.kizuna, vitality: Object.fromEntries(Object.entries(store.state.regions).map(([k, v]) => [k, v.vitality])) }),
    activeScenes: () => game.scene.getScenes(true).map((s) => s.scene.key),
    startScene: (key: string) => { for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key); game.scene.start(key); },
    newGame: (seed?: number) => store.replace(createNewGame({ seed }), 'debug'),
    setSeason: (s: SeasonId) => store.update('debug', (st) => jumpToSeason(st, s)),
    setVitality: (region: string, v: Vitality) => store.update('debug', (st) => setVitality(st, region, v)),
    grant: (item: string, n = 1) => store.update('debug', (st) => grant(st, item, n)),
    spend: (kind: ActionKind) => { let r; store.update('debug', (st) => { r = spendAction(st, kind); }); return r; },
    endDay: () => game.events.emit('endDay'),
    warp: (x: number, y: number) => (game.scene.getScene('Station') as unknown as { warp(x: number, y: number): void }).warp(x, y),
    /** Freeze tweens/animations for stable screenshots. */
    freeze: (on = true) => game.scene.getScenes(true).forEach((s) => { if (on) s.tweens.pauseAll(); else s.tweens.resumeAll(); }),
  };
  (window as unknown as { __hakuba: typeof api }).__hakuba = api;
  return api;
}
