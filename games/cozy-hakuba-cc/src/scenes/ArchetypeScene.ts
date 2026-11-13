import Phaser from 'phaser';
import { store } from '../gameStore';
import { chooseArchetype } from '../sim/archetype';
import { CONTENT, moduleDef, productDef } from '../sim/content';
import { art, label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop, type Button } from '../ui/widgets';
import { PAL, hex } from '../theme';

export const ARCH_CARDS = { y: 110, w: 560, h: 450, xs: [60, 660] };

/** Snow Peak step 3, part 1: choose the van's primary trade (one-time). */
export class ArchetypeScene extends Phaser.Scene {
  private selected: string | null = null;
  private rings: Record<string, Phaser.GameObjects.Graphics> = {};
  private confirm!: Button;

  constructor() { super('Archetype'); }

  create() {
    this.selected = null; this.rings = {};
    overlayBackdrop(this, "Takumi's Workbench · What's your trade?", 'This is your van’s main business');
    CONTENT.archetypes.filter((a) => a.primaryChoice).forEach((a, i) => {
      const x = ARCH_CARDS.xs[i], y = ARCH_CARDS.y;
      paperPanel(this, x, y, ARCH_CARDS.w, ARCH_CARDS.h, PAL.snow);
      this.rings[a.id] = this.add.graphics();
      label(this, x + 28, y + 22, a.name, 28, PAL.ink, '900');
      label(this, x + 28, y + 62, `Signature mini-game: ${a.signature}`, 17, PAL.twilight, '500');
      a.products.forEach((pid, k) => {
        art(this, x + 70 + k * 150, y + 150, `prod_${pid}`, 0.5, 0.5).setScale(0.75);
        label(this, x + 70 + k * 150, y + 192, productDef(CONTENT, pid).name, 15, PAL.ink, '700').setOrigin(0.5, 0);
      });
      label(this, x + 28, y + 236, a.pitch, 18, PAL.ink, '500').setWordWrapWidth(ARCH_CARDS.w - 56).setLineSpacing(4);
      const dots = (v: number) => '●'.repeat(Math.round(v * 4)) + '○'.repeat(Math.max(0, 5 - Math.round(v * 4)));
      label(this, x + 28, y + 310, `Winter ${dots(a.strongIn.winter)}   Green ${dots(a.strongIn.green)}`, 18, PAL.cedar, '700');
      const best = (Object.entries(a.phaseMult) as [string, number][]).sort((p, q) => q[1] - p[1])[0][0];
      label(this, x + 28, y + 342, `Busiest in the ${best}. You'll build: ${moduleDef(CONTENT, a.builds).name}`, 16, PAL.twilight, '500').setWordWrapWidth(ARCH_CARDS.w - 56);
      art(this, x + ARCH_CARDS.w - 110, y + 410, `mod_${a.builds}`, 0.5, 0.5).setScale(0.32);
      const zone = this.add.zone(x, y, ARCH_CARDS.w, ARCH_CARDS.h).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.select(a.id));
    });
    this.confirm = button(this, 640, 630, 340, 60, 'Choose a trade', () => this.choose(), PAL.lantern, 22);
    this.confirm.setEnabled(false);
    button(this, 1120, 660, 200, 46, 'Not yet', () => closeOverlay(this), PAL.snow, 16);
    this.input.keyboard!.on('keydown-ESC', () => closeOverlay(this));
    paperGrain(this);
  }

  select(id: string) {
    this.selected = id;
    CONTENT.archetypes.filter((a) => a.primaryChoice).forEach((a, i) => {
      const g = this.rings[a.id].clear();
      if (a.id === id) g.lineStyle(6, hex(PAL.lantern), 1).strokeRoundedRect(ARCH_CARDS.xs[i] - 6, ARCH_CARDS.y - 6, ARCH_CARDS.w + 12, ARCH_CARDS.h + 12, 18);
    });
    const a = CONTENT.archetypes.find((x) => x.id === id)!;
    this.confirm.setLabel(`Make it official: ${a.name.split(' ')[0]}`);
    this.confirm.setEnabled(true);
  }

  private choose() {
    if (!this.selected) return;
    const id = this.selected;
    store.update('archetype', (s) => chooseArchetype(s, id));
    closeOverlay(this);
  }
}
