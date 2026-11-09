import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT } from '../sim/content';
import { buyModule, installRoof, priceWithMods, roofSlots, uninstallRoof, upgradeChassis } from '../sim/van';
import { art, label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop } from '../ui/widgets';
import { PAL, hex } from '../theme';

/** Takumi's garage: chassis tiers (traversal + roof slots) and roof modules. */
export class GarageScene extends Phaser.Scene {
  private msg = '';
  constructor() { super('Garage'); }

  create() {
    this.msg = '';
    this.input.keyboard!.on('keydown-ESC', () => closeOverlay(this));
    this.draw();
  }

  /** Redraw in place (restart would fire SHUTDOWN and resume the scene underneath). */
  private draw() {
    this.children.removeAll(true);
    const s = store.state;
    overlayBackdrop(this, "Takumi's Garage", `¥ ${s.yen.toLocaleString('en-US')}`);
    // Chassis column.
    label(this, 50, 92, 'Chassis: decides which roads you can drive and how much fits', 17, PAL.twilight, '500');
    CONTENT.chassis.forEach((c, i) => {
      const y = 122 + i * 128;
      const current = s.chassisTier === c.tier;
      const done = s.chassisTier >= c.tier;
      paperPanel(this, 40, y, 600, 114, current ? '#fdf1d8' : done ? PAL.snow : PAL.paper);
      label(this, 62, y + 14, `Tier ${c.tier} · ${c.name}`, 21, PAL.ink, '900');
      label(this, 62, y + 46, c.blurb, 15, PAL.ink, '500').setWordWrapWidth(380);
      label(this, 62, y + 86, `Interior ${c.grid.w}×${c.grid.h} · roof slots ${c.roofSlots}`, 14, PAL.cedar, '700');
      const next = c.tier === s.chassisTier + 1;
      const price = priceWithMods(s, c.price);
      const b = button(this, 540, y + 57, 160, 50, done ? (current ? 'Your van ✓' : 'Owned ✓') : next && c.available ? `Upgrade ¥${price.toLocaleString('en-US')}` : c.available ? 'Later' : 'Coming soon', () => {
        let r!: ReturnType<typeof upgradeChassis>;
        store.update('garage', (st) => { r = upgradeChassis(st); });
        this.msg = r.ok ? `Snow tires on, rack bolted down. "She'll grip anything now," says Takumi.` : r.reason === 'yen' ? 'Not enough yen yet.' : '';
        this.draw();
      }, done ? PAL.fresh : PAL.lantern, 15);
      b.setEnabled(next && c.available && s.yen >= price);
    });

    // Van + roof column.
    paperPanel(this, 670, 92, 580, 600, PAL.snow);
    const slots = roofSlots(s);
    label(this, 692, 108, `Roof rack: ${s.van.roof.length}/${slots} slots used`, 20, PAL.ink, '900');
    art(this, 960, 372, 'van_kei').setScale(0.5 * 1.2);
    if (s.chassisTier >= 1) art(this, 960, 372, 'van_kit_t1').setScale(0.5 * 1.2);
    const g = this.add.graphics();
    for (let i = 0; i < Math.max(slots, 2); i++) {
      const x = 852 + i * 112, y = 138;
      g.lineStyle(3, hex(i < slots ? PAL.ink : '#b7a98e'), 1).strokeRoundedRect(x, y, 100, 56, 8);
      const id = s.van.roof[i];
      if (id) art(this, x + 50, y + 28, `mod_${id}`, 0.5, 0.5).setScale(0.3);
      else label(this, x + 50, y + 28, i < slots ? 'empty' : 'needs rack', 13, PAL.twilight, '500').setOrigin(0.5);
    }
    CONTENT.modules.filter((m) => m.category === 'roof').forEach((m, i) => {
      const y = 392 + i * 92;
      art(this, 730, y + 34, `mod_${m.id}`, 0.5, 0.5).setScale(0.36);
      label(this, 786, y + 4, `${m.name}  ·  ¥${priceWithMods(s, m.price).toLocaleString('en-US')}`, 17, PAL.ink, '900');
      label(this, 786, y + 30, m.blurb, 14, PAL.twilight, '500').setWordWrapWidth(300);
      const owned = s.van.owned.includes(m.id);
      const on = s.van.roof.includes(m.id);
      const act = !owned ? 'Buy' : on ? 'Take down' : 'Install';
      const b = button(this, 1170, y + 34, 130, 46, act, () => {
        store.update('garage', (st) => {
          if (!owned) { const r = buyModule(st, m.id); this.msg = r.ok ? `Bought the ${m.name}.` : 'Not enough yen yet.'; if (r.ok && installRoof(st, m.id).ok) this.msg += ' Installed on the rack.'; }
          else if (on) { uninstallRoof(st, m.id); this.msg = ''; }
          else { const r = installRoof(st, m.id); this.msg = r.ok ? `${m.name} installed.` : r.reason === 'full' ? 'The rack is full. Take something down first.' : 'You need a roof rack first (Tier 1).'; }
        });
        this.draw();
      }, owned ? PAL.paper : PAL.lantern, 15);
      b.setEnabled(owned ? (on || slots > 0) : s.yen >= priceWithMods(s, m.price));
    });
    label(this, 40, 650, this.msg, 16, PAL.noren, '700').setWordWrapWidth(600);
    button(this, 540, 680, 180, 44, 'Back', () => closeOverlay(this), PAL.paper, 16);
    paperGrain(this);
  }
}
