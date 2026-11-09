import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT, regionDef } from '../sim/content';
import { addUnlock, take } from '../sim/game';
import { label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop } from '../ui/widgets';
import { PAL } from '../theme';

export const ROAD_COST = 5;

/** Valley Revival Board: spend Kizuna to open roads to neighbouring regions. */
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
    const here = regionDef(CONTENT, 'station');
    label(this, 60, 100, `You have 絆 ${s.kizuna}.  Each road costs 絆 ${ROAD_COST}. New regions open in the next milestone (M2).`, 20, PAL.ink, '500');
    here.connects.forEach((id, i) => {
      const r = regionDef(CONTENT, id);
      const open = s.unlocks.includes(`road:${id}`);
      const x = 60 + i * 600, y = 160;
      paperPanel(this, x, y, 560, 300, open ? PAL.snow : PAL.paper);
      label(this, x + 24, y + 20, r.name, 28, PAL.ink, '900');
      label(this, x + 24, y + 60, r.nameJa, 20, PAL.cedar, '500');
      label(this, x + 24, y + 100, `Key person: ${r.keyPerson}`, 18, PAL.twilight, '500');
      label(this, x + 24, y + 130, `Winter draw ${'●'.repeat(Math.round(r.draw.winter * 5))}\nGreen draw  ${'●'.repeat(Math.round(r.draw.green * 5))}`, 18, PAL.ink, '500').setLineSpacing(6);
      const b = button(this, x + 280, y + 250, 300, 54, open ? 'Road open ✓' : `Open road · 絆 ${ROAD_COST}`, () => {
        store.update('board', (st) => { if (take(st, 'kizuna', ROAD_COST)) addUnlock(st, `road:${id}`); });
        this.draw();
      }, open ? PAL.fresh : PAL.lantern);
      b.setEnabled(!open && s.kizuna >= ROAD_COST);
    });
    button(this, 640, 640, 220, 56, 'Back', () => closeOverlay(this), PAL.snow);
  }
}
