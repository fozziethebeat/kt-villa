import Phaser from 'phaser';
import { FONT, PAL, hex } from '../theme';

/** Textures are loaded at 2x; place them at their logical size. */
export function art(scene: Phaser.Scene, x: number, y: number, id: string, originX = 0.5, originY = 1): Phaser.GameObjects.Image {
  return scene.add.image(x, y, id).setOrigin(originX, originY).setScale(0.5);
}

/** Full-screen washi grain overlay. Add last so it sits above everything in its scene. */
export function paperGrain(scene: Phaser.Scene, alpha = 0.22): Phaser.GameObjects.TileSprite {
  const { width, height } = scene.scale;
  return scene.add.tileSprite(0, 0, width, height, 'paper_grain').setOrigin(0).setTileScale(0.5).setAlpha(alpha).setDepth(10_000).setScrollFactor(0);
}

/** A papercraft panel: cream card with a darker offset "cut paper" shadow. */
export function paperPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill = PAL.paper): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(hex(PAL.ink), 0.25).fillRoundedRect(5, 6, w, h, 14);
  g.fillStyle(hex(fill), 1).fillRoundedRect(0, 0, w, h, 14);
  g.lineStyle(2.5, hex(PAL.ink), 1).strokeRoundedRect(0, 0, w, h, 14);
  return scene.add.container(x, y, [g]);
}

export function label(scene: Phaser.Scene, x: number, y: number, text: string, size = 20, color = PAL.ink, weight = '700'): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, { fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: weight });
}
