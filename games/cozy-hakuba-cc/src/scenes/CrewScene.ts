import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT, archetypeDef } from '../sim/content';
import { availableHelpers, chooseSecondary, dismissHelper, helperDef, hireHelper, nextRank, rankDef, secondaryChoices, thrivingCount } from '../sim/progression';
import { label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop } from '../ui/widgets';
import { PAL, hex } from '../theme';

/** Business Rank, helpers (key people who pitch in) and the second trade (Rank 3). */
export class CrewScene extends Phaser.Scene {
  private msg = '';
  constructor() { super('Crew'); }

  create() {
    this.msg = '';
    this.input.keyboard!.on('keydown-ESC', () => closeOverlay(this));
    this.draw();
  }

  private draw() {
    this.children.removeAll(true);
    const s = store.state;
    const r = rankDef(s), nx = nextRank(s);
    overlayBackdrop(this, 'Your Business & Crew', `絆 ${s.kizuna}`);

    // Rank.
    paperPanel(this, 40, 90, 580, 250, PAL.snow);
    label(this, 64, 104, `Rank ${r.rank} · ${r.title}`, 26, PAL.ink, '900');
    label(this, 64, 144, `Menu slots ${r.menuSlots} · helper slots ${r.helpers}${r.secondary ? ' · second trade' : ''}`, 16, PAL.twilight, '500');
    if (nx) {
      const bar = (y: number, text: string, v: number, max: number) => {
        label(this, 64, y, text, 16, PAL.ink, '700');
        const g = this.add.graphics();
        g.fillStyle(hex(PAL.snowShadow), 1).fillRoundedRect(300, y + 2, 280, 16, 8);
        g.fillStyle(hex(v >= max ? PAL.fresh : PAL.lantern), 1).fillRoundedRect(300, y + 2, Math.max(16, (280 * Math.min(v, max)) / max), 16, 8);
      };
      label(this, 64, 184, `Next: Rank ${nx.rank} · ${nx.title}`, 18, PAL.cedar, '900');
      bar(220, `Reputation ${Math.floor(s.business.reputation)}/${nx.reputation}`, s.business.reputation, nx.reputation);
      bar(252, `Thriving regions ${thrivingCount(s)}/${nx.regions}`, thrivingCount(s), nx.regions);
      label(this, 64, 290, 'Reputation grows with every happy customer.', 14, PAL.twilight, '500');
    } else label(this, 64, 190, 'Top rank! The whole valley knows your van.', 18, PAL.cedar, '900');

    // Second trade.
    paperPanel(this, 40, 356, 580, 320, '#fdf1d8');
    label(this, 64, 370, 'Second trade', 22, PAL.ink, '900');
    if (s.secondaryArchetype) {
      const a = archetypeDef(CONTENT, s.secondaryArchetype);
      label(this, 64, 410, `${a.name}\n${a.pitch}\nBuy its module in the van shop.`, 16, PAL.ink, '500').setWordWrapWidth(530).setLineSpacing(6);
    } else if (!r.secondary) {
      label(this, 64, 410, 'Unlocks at Rank 3. A second trade that is strong in your\nfirst trade’s weak season is the key to a busy green season.', 16, PAL.twilight, '500').setLineSpacing(6);
    } else {
      secondaryChoices(s).forEach((id, i) => {
        const a = archetypeDef(CONTENT, id);
        const y = 410 + i * 64;
        label(this, 64, y, `${a.name}`, 17, PAL.ink, '900');
        label(this, 64, y + 24, `Winter ${'●'.repeat(Math.round(a.strongIn.winter * 4))}  Green ${'●'.repeat(Math.round(a.strongIn.green * 4))}`, 14, PAL.cedar, '700');
        button(this, 520, y + 20, 160, 44, 'Choose', () => {
          store.update('crew', (st) => chooseSecondary(st, id));
          this.msg = `${a.name} added! Its module is now in the van shop.`;
          this.draw();
        }, PAL.lantern, 15);
      });
    }

    // Helpers.
    paperPanel(this, 650, 90, 590, 586, PAL.snow);
    label(this, 674, 104, `Helpers ${s.helpers.length}/${r.helpers}  ·  hiring costs 絆 ${CONTENT.business.helperCost}`, 20, PAL.ink, '900');
    let y = 146;
    for (const id of s.helpers) {
      const h = helperDef(id);
      label(this, 674, y, `✓ ${h.name}`, 17, PAL.cedar, '900');
      label(this, 674, y + 24, h.blurb, 14, PAL.ink, '500');
      button(this, 1150, y + 20, 140, 40, 'Thank & rest', () => { store.update('crew', (st) => dismissHelper(st, id)); this.draw(); }, PAL.paper, 14);
      y += 62;
    }
    const avail = availableHelpers(s);
    if (!avail.length && !s.helpers.length) label(this, 674, y, 'Restore a region to Thriving and its key person can help.', 15, PAL.twilight, '500');
    for (const h of avail.slice(0, 8 - s.helpers.length)) {
      label(this, 674, y, h.name, 17, PAL.ink, '900');
      label(this, 674, y + 24, h.blurb, 14, PAL.twilight, '500');
      const b = button(this, 1150, y + 20, 140, 40, 'Invite', () => {
        let res!: ReturnType<typeof hireHelper>;
        store.update('crew', (st) => { res = hireHelper(st, h.region); });
        this.msg = res.ok ? `${h.name} is helping at the van!` : res.reason === 'slots' ? 'No free helper slots. Rank up for more.' : 'Not enough 絆.';
        this.draw();
      }, PAL.lantern, 14);
      b.setEnabled(s.helpers.length < r.helpers && s.kizuna >= CONTENT.business.helperCost);
      y += 62;
    }
    label(this, 40, 690, this.msg, 15, PAL.noren, '700');
    button(this, 1140, 690, 180, 40, 'Back', () => closeOverlay(this), PAL.paper, 15);
    paperGrain(this);
  }
}
