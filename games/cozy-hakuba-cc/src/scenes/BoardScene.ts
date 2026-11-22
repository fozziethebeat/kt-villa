import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT, chassisDef, regionDef } from '../sim/content';
import { openRoad, roadOffers, roadOpen } from '../sim/travel';
import { sponsorFestival, sponsorshipCost } from '../sim/extras';
import { label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop } from '../ui/widgets';
import { PAL } from '../theme';
import { sfx } from '../audio';

export const BOARD_CARD = { x: 60, y: 140, w: 380, h: 220, gap: 400, rowGap: 240 };

/** Valley Revival Board: spend Kizuna to open roads next to Thriving regions. */
export class BoardScene extends Phaser.Scene {
  private tab: 'roads' | 'festivals' = 'roads';
  private msg = '';
  constructor() { super('Board'); }

  create() {
    this.tab = 'roads'; this.msg = '';
    this.input.keyboard!.on('keydown-ESC', () => closeOverlay(this));
    this.draw();
  }

  /** Redraw in place (scene.restart would fire SHUTDOWN and resume the scene underneath). */
  private draw() {
    this.children.removeAll(true);
    overlayBackdrop(this, 'Valley Revival Board', '');
    button(this, 980, 36, 170, 44, 'Roads', () => { this.tab = 'roads'; this.draw(); }, this.tab === 'roads' ? PAL.lantern : PAL.snow, 17);
    button(this, 1160, 36, 170, 44, 'Festivals', () => { this.tab = 'festivals'; this.draw(); }, this.tab === 'festivals' ? PAL.lantern : PAL.snow, 17);
    if (this.tab === 'roads') this.render(); else this.festivals();
    paperGrain(this);
  }

  /** Sponsor a Thriving region's festival with yen: +Valley Buzz every season from then on. */
  private festivals() {
    const s = store.state;
    const cost = sponsorshipCost(s);
    label(this, 60, 100, `¥ ${s.yen.toLocaleString('en-US')}. Sponsor a Thriving region's festival: +${CONTENT.business.sponsorship.buzz} Valley Buzz every season. Next costs ¥${cost.toLocaleString('en-US')}.`, 17, PAL.ink, '500');
    const regions = CONTENT.regions.filter((r) => s.regions[r.id].vitality >= 3);
    if (!regions.length) label(this, 60, 150, 'No Thriving regions yet.', 18, PAL.twilight, '500');
    regions.forEach((r, i) => {
      const x = 60 + (i % 2) * 590, y = 140 + Math.floor(i / 2) * 92;
      const on = (s.sponsored ?? []).includes(r.id);
      paperPanel(this, x, y, 570, 80, on ? '#fdf1d8' : PAL.snow);
      label(this, x + 20, y + 14, r.name, 19, PAL.ink, '900');
      label(this, x + 20, y + 44, r.attraction?.name ?? r.nameJa, 14, PAL.twilight, '500');
      const b = button(this, x + 470, y + 40, 170, 46, on ? 'Sponsored ★' : 'Sponsor', () => {
        let res!: ReturnType<typeof sponsorFestival>;
        store.update('board', (st) => { res = sponsorFestival(st, r.id); });
        if (res.ok) sfx('quest');
        this.msg = res.ok ? `${r.name} festival sponsored! Lanterns and a banner with your van on it.` : 'Not enough yen yet.';
        this.draw();
      }, on ? PAL.fresh : PAL.lantern, 16);
      b.setEnabled(!on && s.yen >= cost);
    });
    label(this, 60, 610, this.msg, 16, PAL.cedar, '700');
    button(this, 1100, 650, 220, 52, 'Back', () => closeOverlay(this), PAL.snow);
  }

  private render() {
    const s = store.state;
    const cost = CONTENT.tuning.roadCost;
    // Roads you can open first (valley order), then ones already open. Up to six cards.
    const byOrder = (a: string, b: string) => regionDef(CONTENT, a).order - regionDef(CONTENT, b).order;
    const offered = roadOffers(s).filter((id) => !roadOpen(s, id)).sort(byOrder);
    const opened = CONTENT.regions.filter((r) => r.id !== 'station' && roadOpen(s, r.id)).map((r) => r.id).sort(byOrder);
    const ids = [...offered, ...opened].slice(0, 6);
    label(this, 60, 100, `You have 絆 ${s.kizuna}. Each road costs 絆 ${cost}. Thriving regions offer roads to their neighbours.`, 19, PAL.ink, '500');
    ids.forEach((id, i) => {
      const r = regionDef(CONTENT, id);
      const open = roadOpen(s, id);
      const x = BOARD_CARD.x + (i % 3) * BOARD_CARD.gap, y = BOARD_CARD.y + Math.floor(i / 3) * BOARD_CARD.rowGap;
      paperPanel(this, x, y, BOARD_CARD.w, BOARD_CARD.h, open ? PAL.snow : PAL.paper);
      label(this, x + 22, y + 18, r.name, 24, PAL.ink, '900').setWordWrapWidth(BOARD_CARD.w - 40);
      label(this, x + 22, y + 56, r.nameJa, 18, PAL.cedar, '500');
      label(this, x + 22, y + 84, `Key person: ${r.keyPerson}  ·  winter ${'●'.repeat(Math.round(r.draw.winter * 5))}  green ${'●'.repeat(Math.round(r.draw.green * 5))}`, 14, PAL.twilight, '500');
      const notes = [r.requires.chassisTier > 0 ? `Needs ${chassisDef(CONTENT, r.requires.chassisTier).name}` : '', r.playable ? '' : 'Region opens in a later milestone'].filter(Boolean).join(' · ');
      label(this, x + 22, y + 108, notes, 13, PAL.noren, '700');
      const b = button(this, x + BOARD_CARD.w / 2, y + BOARD_CARD.h - 40, 280, 50, open ? 'Road open ✓' : `Open road · 絆 ${cost}`, () => {
        store.update('board', (st) => { openRoad(st, id); });
        sfx('stamp');
        this.draw();
      }, open ? PAL.fresh : PAL.lantern);
      b.setEnabled(!open && s.kizuna >= cost);
    });
    if (!ids.length) label(this, 60, 160, 'No roads to open yet. Help a key person until their region is Thriving.', 20, PAL.twilight, '500');
    label(this, 60, 626, 'Drive along open roads from your van (Drive…).', 16, PAL.twilight, '500');
    button(this, 1100, 650, 220, 52, 'Back', () => closeOverlay(this), PAL.snow);
  }
}
