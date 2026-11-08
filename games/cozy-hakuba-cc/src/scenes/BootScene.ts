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
    this.scene.start('Title');
  }
}
