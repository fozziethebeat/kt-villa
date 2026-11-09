import Phaser from 'phaser';
import { store } from '../gameStore';
import { saveGame } from '../persist';

/** Region id → walkable scene key (regions without a scene aren't playable yet). */
export const REGION_SCENES: Record<string, string> = { station: 'Station', snowpeak: 'SnowPeak' };

const LIVE = new Set<number>([
  Phaser.Scenes.INIT, Phaser.Scenes.START, Phaser.Scenes.LOADING, Phaser.Scenes.CREATING,
  Phaser.Scenes.RUNNING, Phaser.Scenes.PAUSED, Phaser.Scenes.SLEEPING,
]);

/** Stop every running, paused or sleeping scene, then start `key` on a later frame (so queued stops settle first). */
export function switchTo(game: Phaser.Game, key: string, data?: object): void {
  for (const s of game.scene.getScenes(false)) if (LIVE.has(s.sys.settings.status)) game.scene.stop(s.scene.key);
  setTimeout(() => game.scene.start(key, data), 60);
}

/** Arrive in a region (after driving or loading a save) and autosave. */
export function goToRegion(game: Phaser.Game, regionId: string): void {
  switchTo(game, REGION_SCENES[regionId] ?? 'Station');
  saveGame(store.state);
}
