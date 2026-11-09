import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT, chassisDef, regionDef } from '../sim/content';
import { openRoad, roadOffers, roadOpen } from '../sim/travel';
import { label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop } from '../ui/widgets';
import { PAL } from '../theme';

export const BOARD_CARD = { x: 60, y: 150, w: 380, h: 320, gap: 400 };

/** Valley Revival Board: spend Kizuna to open roads next to Thriving regions. */
export class BoardScene extends Phaser.Scene {
  constructor() { super('Board'); }

  create() {
    this.input.keyboard!.on('keydown-ESC', () => closeOverlay(this));
    this.draw();
  }

  /** Redraw in place (scene.restart would fire SHUTDOWN and resume the scene underneath). */
  private draw() {
    this.children.removeAll(true);
    overlayBackdrop(this, 'Valley Revival Board', 'Spend 絆 Kizuna to open roads');
    this.render();
    paperGrain(this);
  }

  private render() {
    const s = store.state;
    const cost = CONTENT.tuning.roadCost;
    // Offered roads plus ones already opened, in valley order.
    const ids = [...new Set([...roadOffers(s), ...CONTENT.regions.filter((r) => r.id !== 'station' && roadOpen(s, r.id)).map((r) => r.id)])]
      .sort((a, b) => regionDef(CONTENT, a).order - regionDef(CONTENT, b).order).slice(0, 3);
    label(this, 60, 100, `You have 絆 ${s.kizuna}. Each road costs 絆 ${cost}. Thriving regions offer roads to their neighbours.`, 19, PAL.ink, '500');
    ids.forEach((id, i) => {
      const r = regionDef(CONTENT, id);
      const open = roadOpen(s, id);
      const x = BOARD_CARD.x + i * BOARD_CARD.gap, y = BOARD_CARD.y;
      paperPanel(this, x, y, BOARD_CARD.w, BOARD_CARD.h, open ? PAL.snow : PAL.paper);
      label(this, x + 22, y + 18, r.name, 24, PAL.ink, '900').setWordWrapWidth(BOARD_CARD.w - 40);
      label(this, x + 22, y + 56, r.nameJa, 18, PAL.cedar, '500');
      label(this, x + 22, y + 92, `Key person: ${r.keyPerson}`, 16, PAL.twilight, '500');
      label(this, x + 22, y + 120, `Winter draw ${'●'.repeat(Math.round(r.draw.winter * 5))}\nGreen draw  ${'●'.repeat(Math.round(r.draw.green * 5))}`, 16, PAL.ink, '500').setLineSpacing(6);
      const notes = [r.requires.chassisTier > 0 ? `Needs ${chassisDef(CONTENT, r.requires.chassisTier).name}` : '', r.playable ? '' : 'Region opens in a later milestone'].filter(Boolean).join('\n');
      label(this, x + 22, y + 186, notes, 14, PAL.noren, '700').setLineSpacing(4);
      const b = button(this, x + BOARD_CARD.w / 2, y + BOARD_CARD.h - 44, 280, 54, open ? 'Road open ✓' : `Open road · 絆 ${cost}`, () => {
        store.update('board', (st) => { openRoad(st, id); });
        this.draw();
      }, open ? PAL.fresh : PAL.lantern);
      b.setEnabled(!open && s.kizuna >= cost);
    });
    if (!ids.length) label(this, 60, 160, 'No roads to open yet. Help a key person until their region is Thriving.', 20, PAL.twilight, '500');
    label(this, 60, 500, 'Drive along open roads from your van (Drive…).', 17, PAL.twilight, '500');
    button(this, 640, 640, 220, 56, 'Back', () => closeOverlay(this), PAL.snow);
  }
}
