import Phaser from 'phaser';
import { store } from '../gameStore';
import { evaluate, failPoint, generateCairn, type CairnPuzzle, type Placed } from '../sim/puzzles/cairn';
import { recordResult } from '../sim/quests';
import { label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop, resultPanel, type Button, type QuestGameData } from '../ui/widgets';
import { PAL, hex } from '../theme';

export const CAIRN = { x0: 420, ground: 600 };
const STONE_COLORS = [0x9aa1ab, 0x8a8f99, 0xa8a29a, 0x7f8794, 0xb3aea4, 0x949ba6];

/** Cairn balance overlay: drag stones onto the stack. It must stand, and the top stone must point at the trail. */
export class CairnScene extends Phaser.Scene {
  private data0!: QuestGameData;
  private puzzle!: CairnPuzzle;
  private stack: Placed[] = [];
  private topples = 0;
  private done = false;
  private layer!: Phaser.GameObjects.Container;
  private status!: Phaser.GameObjects.Text;
  private finishBtn!: Button;
  private drag: { id: string; img: Phaser.GameObjects.Rectangle } | null = null;

  constructor() { super('Cairn'); }

  init(data: QuestGameData) { this.data0 = data; }

  create() {
    this.puzzle = generateCairn((store.state.seed ^ 0xca17) >>> 0);
    this.stack = []; this.topples = 0; this.done = false; this.drag = null;
    overlayBackdrop(this, 'Trail Cairn', 'Drag stones onto the base · the top stone must lean over the trail marker');
    const sky = this.add.graphics();
    sky.fillStyle(hex('#dfe9f0'), 1).fillRect(30, 90, 760, 540);
    sky.fillStyle(hex('#b9c7a8'), 1).fillRect(30, CAIRN.ground, 760, 30);
    const { x0, ground } = CAIRN;
    this.add.rectangle(x0, ground - 14, this.puzzle.baseW, 28, 0x6f7480).setStrokeStyle(3, hex(PAL.ink));
    // Trail marker.
    const tx = x0 + this.puzzle.target;
    const g = this.add.graphics();
    g.lineStyle(2, hex(PAL.noren), 0.6);
    for (let y = 110; y < ground - 30; y += 16) g.lineBetween(tx, y, tx, y + 8);
    g.fillStyle(hex(PAL.noren), 0.25).fillRect(tx - this.puzzle.tolerance, 110, this.puzzle.tolerance * 2, ground - 140);
    this.add.rectangle(tx + 180, ground - 40, 6, 80, hex(PAL.wood));
    this.add.triangle(tx + 200, ground - 70, 0, 0, 40, 12, 0, 24, hex(PAL.noren)).setStrokeStyle(2, hex(PAL.ink));
    label(this, tx + 200, ground - 30, 'to the pond →', 14, PAL.ink, '700').setOrigin(0.5, 0);

    paperPanel(this, 820, 90, 430, 540, PAL.snow);
    // Stones (stack + pile) draw above the panels.
    this.layer = this.add.container(0, 0).setDepth(5);
    label(this, 840, 104, 'Stone pile', 18, PAL.twilight, '700');
    this.status = label(this, 840, 440, '', 17, PAL.ink, '700').setWordWrapWidth(390).setLineSpacing(6);
    button(this, 940, 600, 200, 46, 'Lift top stone', () => { this.stack.pop(); this.redraw(); }, PAL.paper, 15);
    button(this, 1150, 600, 160, 46, 'Start over', () => { this.stack = []; this.redraw(); }, PAL.paper, 15);
    this.finishBtn = button(this, 520, 670, 300, 52, 'It stands!', () => this.finish(), PAL.lantern, 20);
    button(this, 160, 670, 200, 44, 'Leave for now', () => closeOverlay(this), PAL.snow, 15);

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (this.drag) this.drag.img.setPosition(p.x, p.y); });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.drop(p));
    this.input.keyboard!.on('keydown-ESC', () => closeOverlay(this));
    this.redraw();
    paperGrain(this);
  }

  private stone(id: string) { return this.puzzle.stones.find((s) => s.id === id)!; }
  private color(id: string) { return STONE_COLORS[this.puzzle.stones.findIndex((s) => s.id === id) % STONE_COLORS.length]; }

  /** Where a stone in the pile sits (screen centre). */
  pilePos(id: string): [number, number] | null {
    const pile = this.puzzle.stones.filter((s) => !this.stack.some((p) => p.id === s.id));
    const k = pile.findIndex((s) => s.id === id);
    return k < 0 ? null : [1035, 160 + k * 56];
  }

  private stackTopY(): number {
    return CAIRN.ground - 28 - this.stack.reduce((a, p) => a + this.stone(p.id).h, 0);
  }

  private redraw() {
    this.layer.removeAll(true);
    let y = CAIRN.ground - 28;
    for (const p of this.stack) {
      const s = this.stone(p.id);
      const r = this.add.rectangle(CAIRN.x0 + p.x, y - s.h / 2, s.w, s.h, this.color(s.id)).setStrokeStyle(3, hex(PAL.ink));
      r.setRounded?.(10);
      this.layer.add(r);
      y -= s.h;
    }
    for (const s of this.puzzle.stones) {
      const pos = this.pilePos(s.id);
      if (!pos) continue;
      const r = this.add.rectangle(pos[0], pos[1], s.w, s.h, this.color(s.id)).setStrokeStyle(3, hex(PAL.ink)).setInteractive({ useHandCursor: true });
      r.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
        if (this.done) return;
        const img = this.add.rectangle(ptr.x, ptr.y, s.w, s.h, this.color(s.id), 0.85).setStrokeStyle(3, hex(PAL.ink)).setDepth(50);
        this.drag = { id: s.id, img };
      });
      this.layer.add(r);
    }
    const e = evaluate(this.puzzle, this.stack);
    this.status.setText([
      `Stones stacked ${this.stack.length}/${this.puzzle.stones.length}`,
      e.pointing ? 'Top stone points at the trail ✓' : 'Top stone must sit over the red marker',
      `Topples: ${this.topples}`,
      e.solved ? `A fine cairn!  ${'★'.repeat(this.stars())}` : '',
    ].join('\n'));
    this.finishBtn.setEnabled(e.solved && !this.done);
  }

  stars() { return this.topples === 0 ? 3 : this.topples <= 2 ? 2 : 1; }

  private drop(p: Phaser.Input.Pointer) {
    if (!this.drag) return;
    const { id, img } = this.drag;
    img.destroy();
    this.drag = null;
    if (p.x > 790 || p.y < 90 || p.y > CAIRN.ground) return; // back to the pile
    this.place(id, Math.round(p.x - CAIRN.x0));
  }

  /** Put a stone on top of the stack at offset x (screen x − base centre). Topples are animated and counted. */
  place(id: string, x: number) {
    if (this.stack.some((s) => s.id === id)) return;
    const y = this.stackTopY();
    this.stack.push({ id, x });
    const fail = failPoint(this.puzzle, this.stack);
    if (fail !== null) {
      this.topples++;
      const fallen = this.stack.splice(fail + 1);
      const s = this.stone(id);
      const ghost = this.add.rectangle(CAIRN.x0 + x, y - s.h / 2, s.w, s.h, this.color(id)).setStrokeStyle(3, hex(PAL.ink)).setDepth(40);
      this.tweens.add({ targets: ghost, x: ghost.x + (x >= 0 ? 120 : -120), y: CAIRN.ground, angle: x >= 0 ? 80 : -80, alpha: 0, duration: 650, ease: 'Quad.easeIn', onComplete: () => ghost.destroy() });
      this.cameras.main.shake(180, 0.004);
      void fallen;
    }
    this.redraw();
  }

  private finish() {
    if (!evaluate(this.puzzle, this.stack).solved || this.done) return;
    this.done = true;
    const stars = this.stars();
    store.update('minigame', (s) => recordResult(s, this.data0.stepId, stars, this.data0.item));
    resultPanel(this, 'The cairn stands!', stars, 'Its top stone points down the trail. Tell Daichi!');
  }

  /** Debug/e2e. */
  solution() { return this.puzzle.solution; }
}
