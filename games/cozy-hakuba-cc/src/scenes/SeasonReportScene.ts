import Phaser from 'phaser';
import { THRIVING_BUZZ } from '../sim/report';
import type { SeasonReport } from '../sim/types';
import { label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop } from '../ui/widgets';
import { PAL, hex } from '../theme';

const RATING_COLOR = { Quiet: PAL.twilight, Busy: PAL.lantern, Thriving: PAL.cedar };

/** Stardew-style end-of-season summary (§8.3). No failure: just buzz, earnings and gentle tips. */
export class SeasonReportScene extends Phaser.Scene {
  private report!: SeasonReport;
  constructor() { super('SeasonReport'); }

  init(data: { report: SeasonReport }) { this.report = data.report; }

  create() {
    const r = this.report;
    overlayBackdrop(this, `${r.label}, Year ${r.year} · Season Report`, `ended on day ${r.endedDay}`);
    // Valley buzz headline.
    paperPanel(this, 40, 92, 600, 110, PAL.snow);
    label(this, 64, 106, 'Valley Buzz', 20, PAL.twilight, '700');
    label(this, 64, 136, `${r.valleyBuzz}`, 48, PAL.ink, '900');
    label(this, 170, 148, r.rating, 30, RATING_COLOR[r.rating], '900');
    label(this, 380, 112, `Thriving at ${THRIVING_BUZZ}+.\nWin by keeping a winter and the\nnext green season both Thriving.`, 14, PAL.twilight, '500').setLineSpacing(4);

    // Region bars.
    paperPanel(this, 40, 220, 600, 470, PAL.snow);
    label(this, 64, 234, 'Regions', 20, PAL.ink, '900');
    const g = this.add.graphics();
    r.regions.forEach((x, i) => {
      const y = 274 + i * 40;
      label(this, 64, y, x.name, 16, PAL.ink, '700');
      g.fillStyle(hex(PAL.snowShadow), 1).fillRoundedRect(300, y + 2, 240, 18, 9);
      g.fillStyle(hex(x.buzz >= THRIVING_BUZZ ? PAL.fresh : x.buzz >= 50 ? PAL.lantern : PAL.twilight), 1).fillRoundedRect(300, y + 2, Math.max(18, 240 * x.buzz / 100), 18, 9);
      label(this, 552, y, `${x.buzz}${x.attraction ? ' ★' : ''}`, 16, PAL.ink, '900');
    });
    if (!r.regions.length) label(this, 64, 280, 'No region has woken up yet.', 16, PAL.twilight, '500');
    label(this, 64, 660, '★ = a seasonal attraction is open there', 13, PAL.twilight, '500');

    // Business + tips.
    paperPanel(this, 670, 92, 570, 250, PAL.snow);
    const b = r.business;
    label(this, 694, 106, 'Your van', 20, PAL.ink, '900');
    label(this, 694, 142, [
      `Shifts        ${b.shifts}`,
      `Served        ${b.served}`,
      `Sold out      ${b.soldOut}`,
      `Earned        ¥${b.yen.toLocaleString('en-US')}`,
      `Reputation    ${b.reputation}`,
      `Best seller   ${b.bestSeller ?? '—'}`,
    ].join('\n'), 17, PAL.ink, '500').setLineSpacing(6);
    paperPanel(this, 670, 360, 570, 250, '#fdf1d8');
    label(this, 694, 374, 'Tips for next season', 20, PAL.ink, '900');
    label(this, 694, 410, r.tips.map((t) => `· ${t}`).join('\n') || '· Keep it up!', 16, PAL.ink, '500').setWordWrapWidth(520).setLineSpacing(8);
    button(this, 955, 654, 300, 56, 'On to the next season', () => closeOverlay(this), PAL.lantern, 20);
    this.input.keyboard!.on('keydown-ESC', () => closeOverlay(this));
    paperGrain(this);
  }
}
