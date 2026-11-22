import Phaser from 'phaser';
import { store } from '../gameStore';
import { prepQuality } from '../sim/business';
import { CONTENT } from '../sim/content';
import { mod } from '../sim/game';
import { recordResult } from '../sim/quests';
import { label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop, resultPanel, type QuestGameData } from '../ui/widgets';
import { PAL, hex } from '../theme';
import { sfx } from '../audio';

const BAR = { x: 300, y: 330, w: 680 };

/** Cook (timing) overlay for creation quests: a marker sweeps the bar; tap in the green for each step. */
export class CookScene extends Phaser.Scene {
  private data0!: QuestGameData;
  private steps: string[] = [];
  private speed = 250;
  private baseWindow = 26;
  private k = 0;
  private hits = 0;
  private pos = 0;
  private dir = 1;
  private target = 0;
  private done = false;
  private g!: Phaser.GameObjects.Graphics;
  private text!: Phaser.GameObjects.Text;
  private title = '';

  constructor() { super('Cook'); }

  init(data: QuestGameData) { this.data0 = data; }

  create() {
    const mg = CONTENT.minigames[this.data0.config] as unknown as { title: string; subtitle: string; steps: string[]; speed: number; window: number };
    this.steps = mg.steps; this.speed = mg.speed; this.baseWindow = mg.window; this.title = mg.title;
    this.k = 0; this.hits = 0; this.pos = 0; this.dir = 1; this.done = false;
    this.target = 120 + Math.random() * (BAR.w - 240);
    overlayBackdrop(this, mg.title, mg.subtitle);
    paperPanel(this, 240, 150, 800, 340, PAL.snow);
    this.text = label(this, 640, 180, '', 24, PAL.ink, '900').setOrigin(0.5, 0).setAlign('center').setLineSpacing(8);
    this.g = this.add.graphics();
    button(this, 640, 560, 260, 60, 'Now!  (Space)', () => this.tap(), PAL.lantern, 22);
    button(this, 180, 660, 200, 44, 'Leave for now', () => closeOverlay(this), PAL.snow, 15);
    this.input.keyboard!.on('keydown-SPACE', () => this.tap());
    this.input.keyboard!.on('keydown-ESC', () => closeOverlay(this));
    this.refresh();
    paperGrain(this);
  }

  window() { return this.baseWindow * mod(store.state, 'rhythmWindow') * mod(store.state, 'prepSpeed'); }
  offset() { return Math.abs(this.pos - this.target); }

  private refresh() {
    const step = this.steps[Math.min(this.k, this.steps.length - 1)];
    this.text.setText(`${step}\nstep ${Math.min(this.k + 1, this.steps.length)}/${this.steps.length}  ·  ${'●'.repeat(this.hits)}${'○'.repeat(this.k - this.hits)}`);
  }

  private tap() {
    if (this.done || this.k >= this.steps.length) return;
    const hit = this.offset() <= this.window();
    if (hit) this.hits++;
    sfx(hit ? 'hit' : 'oops');
    const t = label(this, BAR.x + this.pos, BAR.y - 60, hit ? (this.offset() <= this.window() / 3 ? 'Perfect!' : 'Nice!') : 'Oops…', 22, hit ? PAL.cedar : PAL.noren, '900').setOrigin(0.5).setDepth(10);
    this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 700, onComplete: () => t.destroy() });
    this.k++;
    this.target = 80 + ((this.target + 200 + Math.random() * 200) % (BAR.w - 160));
    this.refresh();
    if (this.k >= this.steps.length) this.time.delayedCall(500, () => this.finish());
  }

  update(_t: number, dtMs: number) {
    if (this.done || this.k >= this.steps.length) return;
    this.pos += this.dir * this.speed * Math.min(dtMs, 50) / 1000;
    if (this.pos > BAR.w) { this.pos = BAR.w; this.dir = -1; }
    if (this.pos < 0) { this.pos = 0; this.dir = 1; }
    const w = this.window();
    const g = this.g.clear();
    g.fillStyle(hex(PAL.snowShadow), 1).fillRoundedRect(BAR.x, BAR.y - 18, BAR.w, 36, 18);
    g.fillStyle(hex(PAL.fresh), 1).fillRect(BAR.x + this.target - w, BAR.y - 18, w * 2, 36);
    g.lineStyle(3, hex(PAL.ink), 1).strokeRoundedRect(BAR.x, BAR.y - 18, BAR.w, 36, 18);
    g.fillStyle(hex(PAL.noren), 1).fillTriangle(BAR.x + this.pos, BAR.y - 26, BAR.x + this.pos - 12, BAR.y - 48, BAR.x + this.pos + 12, BAR.y - 48);
    g.fillStyle(hex(PAL.ink), 1).fillRect(BAR.x + this.pos - 2, BAR.y - 22, 4, 44);
  }

  private finish() {
    this.done = true;
    const stars = prepQuality(this.hits, this.steps.length);
    store.update('craft', (s) => recordResult(s, this.data0.stepId, stars, this.data0.item));
    resultPanel(this, `${this.title} ready!`, stars, `${this.hits}/${this.steps.length} steps timed just right. Bring it over!`);
  }

  /** Debug/e2e. */
  debugState() { return { offset: this.offset(), window: this.window(), k: this.k, done: this.done }; }
}
