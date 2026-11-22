import Phaser from 'phaser';
import manifest from '../../content/asset-manifest.json';
import { FONT, PAL } from '../theme';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const { width, height } = this.scale;
    const label = this.add.text(width / 2, height / 2 - 30, 'Loading the valley…', { fontFamily: FONT, fontSize: '24px', color: PAL.ink }).setOrigin(0.5);
    const bar = this.add.rectangle(width / 2 - 200, height / 2 + 10, 0, 10, 0x4f8f8a).setOrigin(0, 0.5);
    this.load.on('progress', (p: number) => { bar.width = 400 * p; });
    this.load.on('complete', () => label.setText('Ready'));
    // Load every asset at 2x for crisp rendering when the canvas scales up.
    for (const a of manifest.assets) {
      this.load.svg(a.id, `assets/${a.file}`, { width: a.w * 2, height: a.h * 2 });
    }
  }

  create() {
    // Tiny generated textures for weather particles (snow, petals, fireflies).
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1).fillCircle(6, 6, 5); g.generateTexture('fx_snow', 12, 12); g.clear();
    g.fillStyle(0xe89fb0, 1).fillEllipse(7, 4, 12, 7); g.generateTexture('fx_petal', 14, 8); g.clear();
    g.fillStyle(0xfff3a0, 0.35).fillCircle(10, 10, 10); g.fillStyle(0xfff7c2, 1).fillCircle(10, 10, 3.5); g.generateTexture('fx_glow', 20, 20);
    g.destroy();
    this.scene.start('Title');
  }
}
