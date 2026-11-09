import Phaser from 'phaser';
import { FONT, PAL, hex } from '../theme';
import { label, paperPanel } from './art';

export interface Button {
  container: Phaser.GameObjects.Container;
  text: Phaser.GameObjects.Text;
  setEnabled(on: boolean): void;
  setLabel(t: string): void;
}

/** Papercraft button. Lifts on hover; disabled buttons fade and ignore clicks. */
export function button(scene: Phaser.Scene, x: number, y: number, w: number, h: number, text: string, onClick: () => void, fill = PAL.lantern, size = 20): Button {
  const panel = paperPanel(scene, -w / 2, -h / 2, w, h, fill);
  const t = scene.add.text(0, 0, text, { fontFamily: FONT, fontSize: `${size}px`, color: PAL.ink, fontStyle: '700', align: 'center' }).setOrigin(0.5);
  const c = scene.add.container(x, y, [panel, t]).setSize(w, h);
  let enabled = true;
  c.setInteractive({ useHandCursor: true });
  c.on('pointerover', () => { if (enabled) { panel.y = -h / 2 - 3; t.y = -3; } });
  c.on('pointerout', () => { panel.y = -h / 2; t.y = 0; });
  c.on('pointerdown', () => { if (enabled) onClick(); });
  return {
    container: c,
    text: t,
    setEnabled(on) { enabled = on; c.setAlpha(on ? 1 : 0.4); },
    setLabel(s) { t.setText(s); },
  };
}

/** Full-screen paper backdrop used by overlay scenes. */
export function overlayBackdrop(scene: Phaser.Scene, title: string, subtitle = ''): void {
  const { width, height } = scene.scale;
  scene.add.rectangle(0, 0, width, height, hex(PAL.paper)).setOrigin(0);
  scene.add.rectangle(0, 0, width, 70, hex(PAL.cedarDark)).setOrigin(0);
  label(scene, 30, 16, title, 30, PAL.snow, '900');
  if (subtitle) label(scene, width - 30, 26, subtitle, 18, '#dfe6ee', '500').setOrigin(1, 0);
}

/** Star row like ★★☆. */
export function starsText(n: number): string {
  return '★'.repeat(n) + '☆'.repeat(Math.max(0, 3 - n));
}

/** Open an overlay scene on top of `from`, pausing it; `onClose` runs after the overlay stops. */
export function openOverlay(from: Phaser.Scene, key: string, data: object = {}, onClose?: () => void): void {
  from.scene.pause();
  from.input.keyboard?.resetKeys();
  from.scene.launch(key, { ...data, returnTo: from.scene.key });
  const overlay = from.scene.get(key);
  overlay.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    // When switching regions every scene is stopped; never revive a scene that has already shut down.
    if (from.sys.settings.status !== Phaser.Scenes.PAUSED) return;
    from.scene.resume();
    onClose?.();
  });
}

/** Close an overlay launched with openOverlay. */
export function closeOverlay(scene: Phaser.Scene): void {
  scene.scene.stop();
}

/** The "you did it" card shown when a mini-game finishes, with a Done button that closes the overlay. */
export function resultPanel(scene: Phaser.Scene, title: string, stars: number, text: string): void {
  const p = paperPanel(scene, 320, 210, 640, 260, PAL.snow).setDepth(100);
  label(scene, 640, 246, `${title}\n${starsText(stars)}`, 32, PAL.ink, '900').setOrigin(0.5, 0).setAlign('center').setDepth(101);
  label(scene, 640, 350, text, 18, PAL.twilight, '500').setOrigin(0.5, 0).setAlign('center').setWordWrapWidth(580).setDepth(101);
  const b = button(scene, 640, 430, 220, 50, 'Done', () => closeOverlay(scene), PAL.lantern);
  b.container.setDepth(102);
  void p;
}

/** Data passed to quest mini-game overlays opened from a region station. */
export interface QuestGameData { stepId: string; item: string; config: string; title?: string }
