import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT } from '../sim/content';
import { rankDef } from '../sim/progression';
import { art, label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay } from '../ui/widgets';
import { PAL, WIDTH, hex } from '../theme';

/** The ending (§8.4): the Hakuba Valley Festival. A celebration card, then keep playing. */
export class FestivalScene extends Phaser.Scene {
  constructor() { super('Festival'); }

  create() {
    const s = store.state;
    this.add.rectangle(0, 0, WIDTH, 720, hex(PAL.twilight)).setOrigin(0);
    art(this, 0, 0, 'bg_mountains_green', 0, 0).setDisplaySize(WIDTH, 480).setAlpha(0.9);
    art(this, 640, 40, 'deco_lanterns', 0.5, 0).setScale(0.8);
    paperPanel(this, 190, 150, 900, 470, PAL.snow);
    label(this, 640, 176, 'The Hakuba Valley Festival', 40, PAL.ink, '900').setOrigin(0.5, 0);
    label(this, 640, 232, `Day ${s.day} · every corner of the valley is awake, in snow and in green.`, 18, PAL.twilight, '500').setOrigin(0.5, 0);
    CONTENT.regions.forEach((r, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      label(this, 240 + col * 420, 280 + row * 34, `★ ${r.name} · ${r.keyPerson}`, 17, PAL.ink, '700');
    });
    label(this, 640, 460, `${s.player.name}'s van: Rank ${rankDef(s).rank} · ${rankDef(s).title}\n${s.business.served} customers served · ¥${s.yen.toLocaleString('en-US')} in the bank`, 18, PAL.cedar, '900').setOrigin(0.5, 0).setAlign('center').setLineSpacing(6);
    label(this, 640, 520, 'Thank you for playing the prototype! The valley keeps going if you do.', 15, PAL.twilight, '500').setOrigin(0.5, 0);
    button(this, 640, 580, 260, 54, 'Keep playing', () => closeOverlay(this), PAL.lantern, 20);
    this.cameras.main.fadeIn(800, 255, 240, 200);
    paperGrain(this);
  }
}
