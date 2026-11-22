import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT } from '../sim/content';
import { clampFrame, describeRule, evaluate, solveCompose, type ComposePuzzle } from '../sim/puzzles/compose';
import { recordResult } from '../sim/quests';
import { label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop, resultPanel, type Button, type QuestGameData } from '../ui/widgets';
import { PAL, hex } from '../theme';
import { sfx } from '../audio';

export const PANO = { x: 60, y: 96, scale: 1160 / 1400 };

/** Composition overlay: drag the camera frame over the panorama until every framing rule is met. */
export class ComposeScene extends Phaser.Scene {
  private data0!: QuestGameData;
  private p!: ComposePuzzle;
  private fx = 0;
  private fy = 0;
  private hints = 0;
  private done = false;
  private frame!: Phaser.GameObjects.Graphics;
  private rulesText!: Phaser.GameObjects.Text;
  private shoot!: Button;
  private dragging: { dx: number; dy: number } | null = null;

  constructor() { super('Compose'); }

  init(data: QuestGameData) { this.data0 = data; }

  create() {
    const mg = CONTENT.minigames[this.data0.config] as unknown as ComposePuzzle & { title: string };
    this.p = { W: mg.W, H: mg.H, frame: mg.frame, subjects: mg.subjects, rules: mg.rules };
    [this.fx, this.fy] = clampFrame(this.p, 0, this.p.H - this.p.frame.h);
    this.hints = 0; this.done = false; this.dragging = null;
    overlayBackdrop(this, mg.title, 'Drag the camera frame · meet every framing note');
    this.drawPanorama();
    this.frame = this.add.graphics().setDepth(10);
    paperPanel(this, 60, 510, 760, 190, PAL.snow);
    this.rulesText = label(this, 84, 524, '', 18, PAL.ink, '700').setLineSpacing(8);
    button(this, 950, 560, 200, 50, 'Hint', () => this.hint(), PAL.paper, 17);
    this.shoot = button(this, 1060, 640, 300, 60, 'Take the photo', () => this.finish(), PAL.lantern, 22);
    button(this, 1160, 560, 180, 50, 'Leave', () => closeOverlay(this), PAL.snow, 16);
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (this.done) return;
      const [px, py] = this.toPano(ptr.x, ptr.y);
      if (px < 0 || py < 0 || px > this.p.W || py > this.p.H) return;
      const inFrame = px >= this.fx && px <= this.fx + this.p.frame.w && py >= this.fy && py <= this.fy + this.p.frame.h;
      this.dragging = inFrame ? { dx: px - this.fx, dy: py - this.fy } : { dx: this.p.frame.w / 2, dy: this.p.frame.h / 2 };
      this.moveTo(px, py);
    });
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => { if (this.dragging && ptr.isDown) this.moveTo(...this.toPano(ptr.x, ptr.y)); });
    this.input.on('pointerup', () => { this.dragging = null; });
    this.input.keyboard!.on('keydown-ESC', () => closeOverlay(this));
    this.redraw();
    paperGrain(this);
  }

  private toPano(x: number, y: number): [number, number] { return [(x - PANO.x) / PANO.scale, (y - PANO.y) / PANO.scale]; }
  private toScreen(x: number, y: number): [number, number] { return [PANO.x + x * PANO.scale, PANO.y + y * PANO.scale]; }

  private moveTo(px: number, py: number) {
    if (!this.dragging) return;
    [this.fx, this.fy] = clampFrame(this.p, px - this.dragging.dx, py - this.dragging.dy);
    this.redraw();
  }

  private drawPanorama() {
    const k = PANO.scale, g = this.add.graphics();
    const S = (x: number, y: number) => this.toScreen(x, y);
    g.fillStyle(hex('#cfe3f2'), 1).fillRect(PANO.x, PANO.y, this.p.W * k, this.p.H * k);
    // Peaks (the Sanzan) and far ridges.
    g.fillStyle(hex('#8fa3bd'), 1).beginPath();
    g.moveTo(...S(0, 260));
    for (const [x, y] of [[180, 170], [300, 140], [420, 110], [560, 160], [700, 120], [860, 200], [1050, 170], [1250, 220], [1400, 200], [1400, 260]] as const) g.lineTo(...S(x, y));
    g.closePath().fillPath();
    g.fillStyle(hex(PAL.snow), 1).fillTriangle(...S(420, 110), ...S(392, 150), ...S(450, 148));
    g.fillStyle(hex(PAL.snow), 1).fillTriangle(...S(700, 120), ...S(676, 150), ...S(726, 152));
    // Lake.
    g.fillStyle(hex(PAL.lake), 1).fillRect(PANO.x, S(0, 260)[1], this.p.W * k, 220 * k);
    g.fillStyle(hex('#9fd3e6'), 0.6).fillRect(PANO.x, S(0, 262)[1], this.p.W * k, 10 * k);
    for (const s of this.p.subjects) {
      const [x, y] = S(s.x, s.y);
      if (s.id === 'sun') g.fillStyle(hex(PAL.lantern), 1).fillCircle(x, y, 26);
      if (s.id === 'sup') { g.fillStyle(hex(PAL.noren), 1).fillEllipse(x, y + 8, 60, 10); g.fillStyle(hex(PAL.ink), 1).fillRect(x - 3, y - 26, 6, 30); g.fillCircle(x, y - 32, 7); g.lineStyle(3, hex(PAL.wood)).lineBetween(x + 6, y - 24, x + 22, y + 6); }
      if (s.id === 'trash') { g.fillStyle(hex('#8a7a6a'), 1).fillEllipse(x, y, 54, 22); g.fillStyle(hex('#cfe0ee'), 1).fillRect(x - 6, y - 18, 10, 18); g.fillStyle(hex(PAL.noren), 1).fillRect(x + 10, y - 10, 12, 10); }
      if (s.id === 'peaks') label(this, x, y - 34, 'Sanzan', 14, PAL.ink, '900').setOrigin(0.5);
    }
  }

  private redraw() {
    const g = this.frame.clear();
    const [x0, y0] = this.toScreen(this.fx, this.fy);
    const w = this.p.frame.w * PANO.scale, h = this.p.frame.h * PANO.scale;
    const [W, H] = [this.p.W * PANO.scale, this.p.H * PANO.scale];
    // Dim everything outside the frame.
    g.fillStyle(0x000000, 0.35);
    g.fillRect(PANO.x, PANO.y, W, y0 - PANO.y);
    g.fillRect(PANO.x, y0 + h, W, PANO.y + H - (y0 + h));
    g.fillRect(PANO.x, y0, x0 - PANO.x, h);
    g.fillRect(x0 + w, y0, PANO.x + W - (x0 + w), h);
    g.lineStyle(1.5, 0xffffff, 0.8);
    for (const t of [1, 2]) { g.lineBetween(x0 + (w * t) / 3, y0, x0 + (w * t) / 3, y0 + h); g.lineBetween(x0, y0 + (h * t) / 3, x0 + w, y0 + (h * t) / 3); }
    g.lineStyle(5, hex(PAL.lantern), 1).strokeRect(x0, y0, w, h);
    const e = evaluate(this.p, this.fx, this.fy);
    this.rulesText.setText(['Framing notes', ...e.rules.map((r) => `${r.ok ? '✓' : '·'}  ${describeRule(this.p, r.rule)}`)].join('\n'));
    this.shoot.setEnabled(e.solved && !this.done);
  }

  stars() { return Math.max(1, 3 - this.hints); }

  private hint() {
    const sol = solveCompose(this.p);
    if (!sol || this.done) return;
    this.hints++;
    [this.fx, this.fy] = sol;
    this.redraw();
  }

  private finish() {
    if (!evaluate(this.p, this.fx, this.fy).solved || this.done) return;
    this.done = true;
    this.cameras.main.flash(250, 255, 255, 255);
    sfx('shutter');
    const stars = this.stars();
    store.update('minigame', (s) => recordResult(s, this.data0.stepId, stars, this.data0.item));
    resultPanel(this, 'Click!', stars, 'That photo will bring people to Lake Aoki. Show Ren!');
  }

  /** Debug/e2e: a solving frame position and the panorama geometry. */
  solution() { return solveCompose(this.p); }
  geom() { return { ...PANO, frame: this.p.frame, fx: this.fx, fy: this.fy }; }
}
