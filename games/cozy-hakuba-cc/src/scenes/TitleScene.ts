import Phaser from 'phaser';
import { art, label, paperGrain, paperPanel } from '../ui/art';
import { PAL, hex } from '../theme';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const { width, height } = this.scale;
    art(this, 0, 0, 'bg_mountains_winter', 0, 0).setDisplaySize(width, 460);
    art(this, 0, 430, 'ground_winter', 0, 0).setDisplaySize(width, 300);
    for (const [x, s] of [[90, 1.1], [190, 0.85], [1110, 1.0], [1210, 1.2]] as const) {
      art(this, x, 520, 'tree_cedar').setScale(0.5 * s);
      art(this, x, 520, 'tree_cedar_snow').setScale(0.5 * s);
    }

    const van = art(this, -200, 640, 'van_kei').setScale(0.75);
    this.tweens.add({ targets: van, x: width - 300, duration: 2200, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: van, y: 637, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const panel = paperPanel(this, width / 2 - 330, 90, 660, 200);
    const title = label(this, width / 2, 150, 'Hakuba Wake-Up', 64, PAL.ink, '900').setOrigin(0.5);
    const sub = label(this, width / 2, 215, '白馬 ・ a cozy van-life revival', 24, PAL.cedar, '500').setOrigin(0.5);
    const ver = label(this, width / 2, 258, 'M0 skeleton build', 16, PAL.twilight, '500').setOrigin(0.5);
    for (const o of [panel, title, sub, ver]) { o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, duration: 700, delay: 300 }); }

    const btn = paperPanel(this, width / 2 - 120, 330, 240, 64, PAL.lantern);
    const btnText = label(this, width / 2, 362, 'Start  ▶', 28).setOrigin(0.5);
    const hit = this.add.zone(width / 2, 362, 240, 64).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => { btn.y = 326; btnText.y = 358; });
    hit.on('pointerout', () => { btn.y = 330; btnText.y = 362; });
    hit.on('pointerdown', () => this.begin());
    this.tweens.add({ targets: [btn, btnText], scale: { from: 1, to: 1.03 }, duration: 900, yoyo: true, repeat: -1 });

    label(this, width / 2, height - 30, 'Enter / click to start  ·  WASD or arrows to walk  ·  E to interact', 16, PAL.ink, '500').setOrigin(0.5).setAlpha(0.7);
    this.input.keyboard?.once('keydown-ENTER', () => this.begin());

    const flash = this.add.rectangle(0, 0, width, height, hex(PAL.snow)).setOrigin(0).setAlpha(0).setDepth(9000);
    this.events.once('begin', () => this.tweens.add({ targets: flash, alpha: 1, duration: 300, onComplete: () => this.scene.start('Station') }));
    paperGrain(this);
  }

  private begin() { this.events.emit('begin'); }
}
