import Phaser from 'phaser';
import { store } from '../gameStore';
import { prepQuality, prepYield, priceFor, settleShift, type PlannedCustomer, type PrepLine, type ServeOutcome, type ShiftPlan } from '../sim/business';
import { CONTENT, archetypeDef, productDef } from '../sim/content';
import { mod, season } from '../sim/game';
import { isSnowy } from '../sim/seasons';
import { art, label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, starsText } from '../ui/widgets';
import { PAL, WIDTH, hex } from '../theme';

const SLOTS = [250, 490, 730, 970];
const CUSTOMER_Y = 430;
const DRIPPER = { x: 640, y: 300 };
const ORBIT_R = 120;
const WINDOW_DEG = 26;
const BOARD = { x: 420, y: 166, w: 440 };
const CUT_WINDOW_PX = 22;

interface Live { plan: PlannedCustomer; slot: number; sprite: Phaser.GameObjects.Container; bar: Phaser.GameObjects.Rectangle; arrivedAt: number; state: 'waiting' | 'leaving' }

/** Café shift: pour-over prep (timing mini-game), then serve walk-up customers at the van window. */
export class BusinessScene extends Phaser.Scene {
  private plan!: ShiftPlan;
  private phase: 'prep' | 'service' | 'summary' = 'prep';
  private prepQueue: PrepLine[] = [];
  private line: PrepLine = 'cup';
  private elapsed = 0;
  // prep
  private kettleAngle = 0;
  private targetAngle = 0;
  private pours = 0;
  private hits = 0;
  private perfects = 0;
  private cups = 0;
  private bowls = 0;
  private quality: Record<PrepLine, number> = { cup: 1, bowl: 1 };
  private shelf: Record<string, number> = {};
  // noodle cut
  private knifeX = 0;
  private knifeDir = 1;
  private cutTarget = 0;
  private knife!: Phaser.GameObjects.Image;
  private cutMarks!: Phaser.GameObjects.Graphics;
  private prepLayer!: Phaser.GameObjects.Container;
  private kettle!: Phaser.GameObjects.Image;
  private ring!: Phaser.GameObjects.Graphics;
  private prepText!: Phaser.GameObjects.Text;
  // service
  private live: Live[] = [];
  private nextIdx = 0;
  private outcomes: ServeOutcome[] = [];
  private selected: Live | null = null;
  private serviceLayer!: Phaser.GameObjects.Container;
  private stockText: Record<string, Phaser.GameObjects.Text> = {};
  private clockBar!: Phaser.GameObjects.Rectangle;
  private earned = 0;
  private earnedText!: Phaser.GameObjects.Text;
  private selRing!: Phaser.GameObjects.Ellipse;

  constructor() { super('Business'); }

  init(data: { plan: ShiftPlan }) {
    this.plan = data.plan;
  }

  create() {
    this.phase = 'prep'; this.elapsed = 0; this.pours = 0; this.hits = 0; this.perfects = 0; this.cups = 0; this.bowls = 0;
    this.quality = { cup: 1, bowl: 1 };
    this.live = []; this.nextIdx = 0; this.outcomes = []; this.selected = null; this.earned = 0; this.stockText = {};
    this.shelf = { ...this.plan.shelf };
    this.prepQueue = [...this.plan.prep];
    this.kettleAngle = 0; this.targetAngle = 180;
    const snowy = isSnowy(season(store.state).season);
    art(this, 0, 0, snowy ? 'bg_mountains_winter' : 'bg_mountains_green', 0, 0).setDisplaySize(WIDTH, 470);
    art(this, 0, 400, snowy ? 'ground_winter' : 'ground_green', 0, 0).setDisplaySize(WIDTH, 300);
    art(this, 0, 460, this.plan.archetype === 'soba' ? 'biz_counter_soba' : 'biz_counter', 0, 0);
    this.add.rectangle(0, 0, WIDTH, 60, hex(PAL.cedarDark)).setOrigin(0);
    label(this, 24, 12, `${archetypeDef(CONTENT, this.plan.archetype).name} · open for business`, 26, PAL.snow, '900');
    this.earnedText = label(this, WIDTH - 24, 16, '', 22, PAL.lantern, '900').setOrigin(1, 0);

    this.nextPrep();
    this.input.keyboard!.on('keydown-SPACE', () => this.prepHit());
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (this.phase === 'service' && n >= 1 && n <= this.plan.menu.length) this.serve(this.plan.menu[n - 1]);
    });
    paperGrain(this);
  }

  // ---- prep: pour timing ------------------------------------------------------

  /** Timing window for the current prep line (degrees for pours, pixels for noodle cuts). */
  private window(): number {
    const m = mod(store.state, 'rhythmWindow') * mod(store.state, 'prepSpeed');
    return (this.line === 'cup' ? WINDOW_DEG : CUT_WINDOW_PX) * m;
  }

  /** Run the next prep mini-game, or open the hatch when all lines are stocked. */
  private nextPrep() {
    this.prepLayer?.destroy();
    const next = this.prepQueue.shift();
    if (!next) { this.startService(); return; }
    this.line = next; this.pours = 0; this.hits = 0; this.perfects = 0;
    if (next === 'cup') this.buildPrep(); else this.buildCut();
  }

  private prepHit() {
    if (this.phase !== 'prep') return;
    if (this.line === 'cup') this.pour(); else this.cut();
  }

  private buildCut() {
    this.prepLayer = this.add.container(0, 0);
    const panel = paperPanel(this, 340, 90, 600, 360, PAL.snow);
    const board = art(this, BOARD.x - 20, BOARD.y, 'soba_board', 0, 0).setScale(0.5 * (BOARD.w + 40) / 520);
    this.cutMarks = this.add.graphics();
    this.knife = art(this, BOARD.x, BOARD.y + 108, 'soba_knife', 0.5, 0.5).setScale(0.45);
    this.prepText = label(this, 640, 108, '', 20, PAL.ink).setOrigin(0.5, 0).setAlign('center');
    const cutBtn = button(this, 640, 410, 240, 56, 'Cut  (Space)', () => this.cut(), PAL.lantern, 22);
    this.prepLayer.add([panel, board, this.cutMarks, this.knife, this.prepText, cutBtn.container]);
    this.knifeX = 0; this.knifeDir = 1;
    this.cutTarget = 140 + Math.random() * 240;
    this.updateCutText();
  }

  private updateCutText() {
    const b = CONTENT.business.shift;
    this.prepText.setText(`Cut when the knife is over the green line · cut ${Math.min(this.pours + 1, b.cuts)}/${b.cuts}
Bowls ready: ${this.bowls}`);
  }

  private cut() {
    if (this.phase !== 'prep' || this.line !== 'bowl' || this.pours >= CONTENT.business.shift.cuts) return;
    const off = this.pourOffset();
    const b = CONTENT.business.shift;
    const hit = off <= this.window();
    const perfect = off <= this.window() / 3;
    this.pours++;
    if (hit) this.hits++;
    if (perfect) this.perfects++;
    this.bowls = 0; // recomputed from the running tally so the solar bonus is applied once
    this.bowls = prepYield('bowl', this.hits, this.perfects, this.pours, this.plan) - (this.pours < b.cuts ? this.plan.stockBonus : 0);
    const t = label(this, BOARD.x + this.knifeX, BOARD.y + 30, perfect ? 'Perfect strands!' : hit ? 'Clean cut' : 'A bit thick…', 24, hit ? PAL.cedar : PAL.noren, '900').setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    this.cutTarget = 60 + ((this.cutTarget + 130 + Math.random() * 160) % (BOARD.w - 120));
    this.updateCutText();
    if (this.pours >= b.cuts) {
      this.quality.bowl = prepQuality(this.hits, b.cuts);
      this.time.delayedCall(700, () => this.nextPrep());
    }
  }

  private buildPrep() {
    this.prepLayer = this.add.container(0, 0);
    const panel = paperPanel(this, 340, 90, 600, 360, PAL.snow);
    const dripper = art(this, DRIPPER.x, DRIPPER.y + 40, 'dripper', 0.5, 0.5).setScale(0.75);
    this.ring = this.add.graphics();
    this.kettle = art(this, 0, 0, 'kettle', 0.9, 0.3).setScale(0.55);
    this.prepText = label(this, 640, 108, '', 20, PAL.ink).setOrigin(0.5, 0).setAlign('center');
    const pourBtn = button(this, 640, 410, 240, 56, 'Pour  (Space)', () => this.pour(), PAL.lantern, 22);
    this.prepLayer.add([panel, dripper, this.ring, this.kettle, this.prepText, pourBtn.container]);
    this.updatePrepText();
  }

  private updatePrepText() {
    this.prepText.setText(`Pour when the kettle is over the green arc · pour ${Math.min(this.pours + 1, CONTENT.business.shift.pours)}/${CONTENT.business.shift.pours}\nCups ready: ${this.cups}`);
  }

  /** Distance to the sweet spot: degrees (kettle) or pixels (knife). */
  pourOffset(): number {
    if (this.line === 'bowl') return Math.abs(this.knifeX - this.cutTarget);
    const d = Math.abs(((this.kettleAngle - this.targetAngle) % 360 + 540) % 360 - 180);
    return d;
  }

  private pour() {
    if (this.phase !== 'prep' || this.line !== 'cup' || this.pours >= CONTENT.business.shift.pours) return;
    const off = this.pourOffset();
    const b = CONTENT.business.shift;
    const hit = off <= this.window();
    const perfect = off <= this.window() / 3;
    this.pours++;
    if (hit) this.hits++;
    if (perfect) this.perfects++;
    this.cups = prepYield('cup', this.hits, this.perfects, this.pours, this.plan) - (this.pours < b.pours ? this.plan.stockBonus : 0);
    const t = label(this, DRIPPER.x, DRIPPER.y - 150, perfect ? 'Perfect bloom!' : hit ? 'Nice pour' : 'A bit splashy…', 24, hit ? PAL.cedar : PAL.noren, '900').setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 800, onComplete: () => t.destroy() });
    this.targetAngle = (this.targetAngle + 110 + Math.random() * 100) % 360;
    this.updatePrepText();
    if (this.pours >= b.pours) {
      this.quality.cup = prepQuality(this.hits, b.pours);
      this.time.delayedCall(700, () => this.nextPrep());
    }
  }

  // ---- service ----------------------------------------------------------------

  private startService() {
    this.phase = 'service';
    this.elapsed = 0;
    this.prepLayer?.destroy();
    this.serviceLayer = this.add.container(0, 0);
    this.selRing = this.add.ellipse(0, CUSTOMER_Y + 4, 120, 26, hex(PAL.lantern), 0.6).setVisible(false);
    this.serviceLayer.add(this.selRing);
    const clockBg = this.add.rectangle(340, 76, 600, 12, hex(PAL.snowShadow)).setOrigin(0, 0.5);
    this.clockBar = this.add.rectangle(340, 76, 600, 12, hex(PAL.teal)).setOrigin(0, 0.5);
    const clockLbl = label(this, 330, 66, 'Shift', 16, PAL.ink).setOrigin(1, 0);
    this.serviceLayer.add([clockBg, this.clockBar, clockLbl]);
    const q = label(this, 960, 66, this.plan.prep.map((l) => `${l === 'cup' ? 'Brew' : 'Noodles'} ${starsText(this.quality[l])}`).join('  '), 16, PAL.ink);
    this.serviceLayer.add(q);
    this.plan.menu.forEach((pid, i) => {
      const x = 380 + i * 260;
      const b = button(this, x, 620, 230, 110, '', () => this.serve(pid), PAL.snow, 16);
      const icon = art(this, -70, 0, `prod_${pid}`, 0.5, 0.5).setScale(0.5);
      const name = label(this, -24, -30, `${i + 1}  ${productDef(CONTENT, pid).name}`, 17, PAL.ink);
      const price = label(this, -24, -4, `¥${productDef(CONTENT, pid).price}`, 15, PAL.twilight, '500');
      this.stockText[pid] = label(this, -24, 18, '', 15, PAL.cedar, '700');
      b.container.add([icon, name, price, this.stockText[pid]]);
      this.serviceLayer.add(b.container);
    });
    this.refreshStock();
  }

  private stockFor(pid: string): number {
    const line = productDef(CONTENT, pid).line;
    return line === 'shelf' ? this.shelf[pid] ?? 0 : line === 'cup' ? this.cups : this.bowls;
  }

  private refreshStock() {
    for (const pid of this.plan.menu) this.stockText[pid]?.setText(`stock ${this.stockFor(pid)}`);
    this.earnedText.setText(this.earned ? `¥ +${this.earned.toLocaleString('en-US')}` : '');
  }

  private spawn(c: PlannedCustomer) {
    const used = new Set(this.live.filter((l) => l.state === 'waiting').map((l) => l.slot));
    const slot = [0, 1, 2, 3].find((s) => !used.has(s));
    if (slot === undefined) return false;
    const x = SLOTS[slot];
    const body = art(this, 0, 0, `char_${c.type}`).setScale(0.8);
    const bubble = paperPanel(this, -44, -248, 88, 80, PAL.snow);
    const icon = art(this, 0, -208, `prod_${c.wants}`, 0.5, 0.5).setScale(0.55);
    const barBg = this.add.rectangle(-40, -158, 80, 8, hex(PAL.snowShadow)).setOrigin(0, 0.5);
    const bar = this.add.rectangle(-40, -158, 80, 8, hex(PAL.fresh)).setOrigin(0, 0.5);
    const zone = this.add.zone(-55, -250, 110, 250).setOrigin(0).setInteractive({ useHandCursor: true });
    const sprite = this.add.container(x + 300, CUSTOMER_Y, [body, bubble, icon, barBg, bar, zone]);
    this.tweens.add({ targets: sprite, x, duration: 500, ease: 'Sine.easeOut' });
    const l: Live = { plan: c, slot, sprite, bar, arrivedAt: this.elapsed, state: 'waiting' };
    zone.on('pointerdown', () => { if (l.state === 'waiting') this.select(l); });
    this.serviceLayer.add(sprite);
    this.live.push(l);
    return true;
  }

  private select(l: Live | null) {
    this.selected = l;
    this.selRing.setVisible(!!l);
    if (l) this.selRing.setX(SLOTS[l.slot]);
  }

  private oldestWaiting(): Live | null {
    return this.live.filter((l) => l.state === 'waiting').sort((a, b) => a.arrivedAt - b.arrivedAt)[0] ?? null;
  }

  /** Serve the selected (or oldest) customer with a product. */
  serve(pid: string) {
    if (this.phase !== 'service') return;
    const target = this.selected?.state === 'waiting' ? this.selected : this.oldestWaiting();
    if (!target || this.stockFor(pid) <= 0) return;
    const line = productDef(CONTENT, pid).line;
    if (line === 'shelf') this.shelf[pid]--; else if (line === 'cup') this.cups--; else this.bowls--;
    const waitedFrac = (this.elapsed - target.arrivedAt) / target.plan.patience;
    const stars = line === 'shelf' ? 2 : this.quality[line];
    const o: ServeOutcome = { idx: target.plan.idx, item: pid, stars, waitedFrac };
    this.outcomes.push(o);
    const r = priceFor(this.plan, target.plan, o);
    this.earned += r.yen + r.tip;
    const msg = r.happy ? `♥ ¥${r.yen}${r.tip ? ` +${r.tip} tip` : ''}` : `¥${r.yen} · not quite what I wanted`;
    const t = label(this, SLOTS[target.slot], CUSTOMER_Y - 270, msg, 18, r.happy ? PAL.cedar : PAL.noren, '900').setOrigin(0.5).setStroke(PAL.snow, 5);
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, delay: 500, duration: 700, onComplete: () => t.destroy() });
    this.leave(target);
    this.refreshStock();
  }

  private leave(l: Live) {
    l.state = 'leaving';
    if (this.selected === l) this.select(null);
    this.tweens.add({ targets: l.sprite, x: -200, alpha: 0.4, duration: 700, ease: 'Sine.easeIn', onComplete: () => l.sprite.destroy() });
  }

  update(_t: number, dtMs: number) {
    const dt = Math.min(dtMs, 50) / 1000;
    if (this.phase === 'prep' && this.line === 'bowl') {
      if (!this.knife) return;
      this.knifeX += this.knifeDir * 300 * dt;
      if (this.knifeX > BOARD.w) { this.knifeX = BOARD.w; this.knifeDir = -1; }
      if (this.knifeX < 0) { this.knifeX = 0; this.knifeDir = 1; }
      this.knife.setX(BOARD.x + this.knifeX);
      const w = this.window();
      this.cutMarks.clear().fillStyle(hex(PAL.fresh), 0.55).fillRect(BOARD.x + this.cutTarget - w, BOARD.y + 52, w * 2, 110);
      this.cutMarks.lineStyle(4, hex(PAL.cedar), 1).lineBetween(BOARD.x + this.cutTarget, BOARD.y + 48, BOARD.x + this.cutTarget, BOARD.y + 166);
      return;
    }
    if (this.phase === 'prep') {
      if (!this.kettle?.active) return;
      this.kettleAngle = (this.kettleAngle + 150 * dt) % 360;
      const a = Phaser.Math.DegToRad(this.kettleAngle - 90);
      this.kettle.setPosition(DRIPPER.x + Math.cos(a) * ORBIT_R, DRIPPER.y + Math.sin(a) * ORBIT_R * 0.45);
      this.ring.clear();
      this.ring.lineStyle(10, hex(PAL.snowShadow), 1).strokeEllipse(DRIPPER.x, DRIPPER.y, ORBIT_R * 2, ORBIT_R * 0.9);
      const w = this.window();
      this.ring.lineStyle(12, hex(PAL.fresh), 1).beginPath();
      for (let d = -w; d <= w; d += 2) {
        const r = Phaser.Math.DegToRad(this.targetAngle + d - 90);
        const px = DRIPPER.x + Math.cos(r) * ORBIT_R, py = DRIPPER.y + Math.sin(r) * ORBIT_R * 0.45;
        if (d === -w) this.ring.moveTo(px, py); else this.ring.lineTo(px, py);
      }
      this.ring.strokePath();
      return;
    }
    if (this.phase !== 'service') return;
    this.elapsed += dt;
    this.clockBar.width = 600 * Math.max(0, 1 - this.elapsed / this.plan.durationSec);
    while (this.nextIdx < this.plan.customers.length && this.plan.customers[this.nextIdx].arriveAt <= this.elapsed) {
      if (!this.spawn(this.plan.customers[this.nextIdx])) break; // window full: they wait off-screen
      this.nextIdx++;
    }
    for (const l of this.live) {
      if (l.state !== 'waiting') continue;
      const frac = (this.elapsed - l.arrivedAt) / l.plan.patience;
      l.bar.width = 80 * Math.max(0, 1 - frac);
      l.bar.setFillStyle(hex(frac < 0.5 ? PAL.fresh : frac < 0.8 ? PAL.lantern : PAL.noren));
      if (frac >= 1) {
        this.outcomes.push({ idx: l.plan.idx, item: null, stars: 0, waitedFrac: 1 });
        const t = label(this, SLOTS[l.slot], CUSTOMER_Y - 270, 'Too long a wait…', 16, PAL.twilight, '700').setOrigin(0.5).setStroke(PAL.snow, 5);
        this.tweens.add({ targets: t, alpha: 0, delay: 600, duration: 600, onComplete: () => t.destroy() });
        this.leave(l);
      }
    }
    const allArrived = this.nextIdx >= this.plan.customers.length;
    const anyWaiting = this.live.some((l) => l.state === 'waiting');
    const outOfStock = this.plan.menu.every((p) => this.stockFor(p) <= 0);
    if ((allArrived && !anyWaiting) || this.elapsed >= this.plan.durationSec + 20 || (outOfStock && !anyWaiting && this.elapsed > 5)) this.finish();
  }

  private finish() {
    this.phase = 'summary';
    let sum!: ReturnType<typeof settleShift>;
    store.update('shift', (s) => { sum = settleShift(s, this.plan, this.outcomes); });
    this.live.forEach((l) => l.sprite.destroy());
    const p = paperPanel(this, 390, 140, 500, 330, PAL.snow);
    const t = label(this, 640, 166, 'Shift report', 32, PAL.ink, '900').setOrigin(0.5, 0);
    const rows = [
      `Customers served   ${sum.served}`,
      `Walked away        ${sum.missed}`,
      ...(sum.soldOut ? [`Sold out, missed   ${sum.soldOut}`] : []),
      `Sales              ¥${sum.yen.toLocaleString('en-US')}`,
      `Tips               ¥${sum.tips.toLocaleString('en-US')}`,
      `Reputation         ${sum.reputation >= 0 ? '+' : ''}${sum.reputation}`,
    ];
    const r = label(this, 440, 224, rows.join('\n'), 20, PAL.ink, '500').setLineSpacing(10);
    const b = button(this, 640, 430, 220, 52, 'Close the hatch', () => closeOverlay(this), PAL.lantern, 20);
    this.add.container(0, 0, [p, t, r, b.container]).setDepth(100);
  }

  /** Debug/e2e helpers. */
  debugState() {
    return {
      phase: this.phase, line: this.line, offset: this.pourOffset(), window: this.window(), cups: this.cups, bowls: this.bowls, shelf: { ...this.shelf },
      waiting: this.live.filter((l) => l.state === 'waiting').map((l) => ({ idx: l.plan.idx, wants: l.plan.wants })),
      remaining: this.plan.customers.length - this.nextIdx,
    };
  }
}
