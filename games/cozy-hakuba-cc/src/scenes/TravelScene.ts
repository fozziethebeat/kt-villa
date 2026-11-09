import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT, chassisDef, regionDef } from '../sim/content';
import { canDriveTo, drive, roadOpen } from '../sim/travel';
import { label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop, type Button } from '../ui/widgets';
import { PAL, hex } from '../theme';
import { goToRegion } from './regions';

const WHY: Record<string, string> = {
  here: "You're parked here.", road: 'Road closed. Open it on the Valley Revival Board.', chassis: 'Needs a van upgrade first.',
  region: 'Wake up the neighbouring region first.', not_built: 'This region opens in a later milestone.', tired: 'Too tired to drive. Sleep first.',
};
const VITALITY = ['Dormant', 'Stirring', 'Awake', 'Thriving'];

/** Valley map: pick a region and drive there (1 stamina). */
export class TravelScene extends Phaser.Scene {
  private selected = '';
  private info!: Phaser.GameObjects.Text;
  private go!: Button;
  private sel!: Phaser.GameObjects.Graphics;

  constructor() { super('Travel'); }

  create() {
    const s = store.state;
    this.selected = s.currentRegion;
    overlayBackdrop(this, 'Valley Map · Drive', 'Click a region · driving costs 1 stamina');
    paperPanel(this, 30, 86, 900, 620, '#e8efe0');
    const g = this.add.graphics();
    // Himekawa river running down the valley.
    g.lineStyle(14, hex(PAL.lake), 0.45).beginPath().moveTo(760, 90);
    for (const [x, y] of [[730, 220], [700, 330], [690, 420], [600, 520], [520, 620], [430, 700]]) g.lineTo(x, y);
    g.strokePath();
    // Roads.
    for (const r of CONTENT.regions) for (const n of r.connects) {
      if (r.order > regionDef(CONTENT, n).order) continue;
      const b = regionDef(CONTENT, n);
      const open = roadOpen(s, r.id) && roadOpen(s, n);
      g.lineStyle(open ? 7 : 4, hex(open ? PAL.wood : '#b7a98e'), open ? 1 : 0.8);
      if (open) g.lineBetween(r.map[0], r.map[1], b.map[0], b.map[1]);
      else this.dashed(g, r.map, b.map);
    }
    this.sel = this.add.graphics();
    for (const r of CONTENT.regions) {
      const open = roadOpen(s, r.id);
      const here = s.currentRegion === r.id;
      const v = s.regions[r.id].vitality;
      const fill = here ? PAL.lantern : open && r.playable ? PAL.teal : open ? '#c9c2b3' : PAL.paper;
      const [x, y] = r.map;
      this.add.circle(x, y, 20, hex(fill)).setStrokeStyle(3, hex(PAL.ink));
      if (!open) label(this, x, y, '🔒', 14).setOrigin(0.5);
      else label(this, x, y, String(v), 16, PAL.ink, '900').setOrigin(0.5);
      const right = x < 600;
      label(this, x + (right ? -28 : 28), y - 11, r.name, 16, PAL.ink, '700').setOrigin(right ? 1 : 0, 0).setStroke('#e8efe0', 5);
      const z = this.add.zone(x - 26, y - 26, 52, 52).setOrigin(0).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => this.select(r.id));
    }
    label(this, 50, 100, 'Orange: you are here · Teal: open road · Number: vitality 0–3', 14, PAL.twilight, '500');

    paperPanel(this, 950, 86, 300, 470, PAL.snow);
    this.info = label(this, 970, 104, '', 17, PAL.ink, '500').setWordWrapWidth(262).setLineSpacing(5);
    this.go = button(this, 1100, 600, 300, 60, 'Drive here', () => this.driveTo(), PAL.lantern, 20);
    button(this, 1100, 670, 300, 44, 'Back to the van', () => closeOverlay(this), PAL.paper, 16);
    this.input.keyboard!.on('keydown-ESC', () => closeOverlay(this));
    this.select(this.selected);
    paperGrain(this);
  }

  private dashed(g: Phaser.GameObjects.Graphics, a: [number, number], b: [number, number]) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let t = 0; t < len; t += 18) {
      const t2 = Math.min(len, t + 9);
      g.lineBetween(a[0] + ((b[0] - a[0]) * t) / len, a[1] + ((b[1] - a[1]) * t) / len, a[0] + ((b[0] - a[0]) * t2) / len, a[1] + ((b[1] - a[1]) * t2) / len);
    }
  }

  select(id: string) {
    this.selected = id;
    const r = regionDef(CONTENT, id);
    const s = store.state;
    this.sel.clear().lineStyle(5, hex(PAL.noren), 1).strokeCircle(r.map[0], r.map[1], 28);
    const c = canDriveTo(s, id);
    const need = r.requires.chassisTier > 0 ? `\nNeeds: ${chassisDef(CONTENT, r.requires.chassisTier).name}` : '';
    this.info.setText(`${r.name}\n${r.nameJa}\n\nKey person: ${r.keyPerson}\n${VITALITY[s.regions[id].vitality]}\nWinter draw ${'●'.repeat(Math.round(r.draw.winter * 5))}\nGreen draw ${'●'.repeat(Math.round(r.draw.green * 5))}${need}\n\n${c.ok ? 'Road open. Ready to drive.' : WHY[c.reason]}`);
    this.go.setEnabled(c.ok);
  }

  private driveTo() {
    let ok = false;
    store.update('drive', (s) => { ok = drive(s, this.selected).ok; });
    if (ok) goToRegion(this.game, this.selected);
  }
}
