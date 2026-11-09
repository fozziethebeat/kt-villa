import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT } from '../sim/content';
import { mod } from '../sim/game';
import { connected, generateFlow, isSolved, type Cell, type FlowPuzzle, type Paths } from '../sim/puzzles/flow';
import { recordResult } from '../sim/quests';
import { label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop, resultPanel, type Button, type QuestGameData } from '../ui/widgets';
import { PAL, hex } from '../theme';

export const FLOW_GRID = { x: 90, y: 120, cell: 84 };
type PairCfg = { id: string; label: string; color: string };

/** Flow / path-connect overlay: drag from a stop to its twin without crossing other routes. */
export class FlowScene extends Phaser.Scene {
  private data0!: QuestGameData;
  private puzzle!: FlowPuzzle;
  private cfg!: PairCfg[];
  private paths: Paths = {};
  private drawing: string | null = null;
  private hints = 0;
  private done = false;
  private g!: Phaser.GameObjects.Graphics;
  private legend!: Phaser.GameObjects.Text;
  private finishBtn!: Button;

  constructor() { super('Flow'); }

  init(data: QuestGameData) { this.data0 = data; }

  create() {
    const mg = CONTENT.minigames[this.data0.config] as unknown as { title: string; w: number; h: number; pairs: PairCfg[] };
    this.cfg = mg.pairs;
    this.puzzle = generateFlow((store.state.seed ^ 0x5f10) >>> 0, mg.w, mg.h, mg.pairs.length, mg.pairs.map((p) => p.id));
    this.paths = {}; this.drawing = null; this.hints = 0; this.done = false;
    overlayBackdrop(this, mg.title, 'Drag from a stop to its matching stop · routes may not cross');
    const G = FLOW_GRID;
    paperPanel(this, G.x - 18, G.y - 18, mg.w * G.cell + 36, mg.h * G.cell + 36, '#e8efe0');
    const bg = this.add.graphics();
    for (let x = 0; x < mg.w; x++) for (let y = 0; y < mg.h; y++) bg.fillStyle(hex(PAL.snow), 1).fillRoundedRect(G.x + x * G.cell + 3, G.y + y * G.cell + 3, G.cell - 6, G.cell - 6, 10);
    this.g = this.add.graphics();
    for (const pair of this.puzzle.pairs) {
      const c = this.color(pair.id);
      for (const e of [pair.a, pair.b]) {
        const [px, py] = this.center(e);
        this.add.circle(px, py, 26, c).setStrokeStyle(3, hex(PAL.ink)).setDepth(5);
        label(this, px, py, this.cfg.find((x) => x.id === pair.id)!.label.slice(0, 2), 16, PAL.snow, '900').setOrigin(0.5).setDepth(6);
      }
    }
    paperPanel(this, 640, 100, 610, 470, PAL.snow);
    this.legend = label(this, 664, 120, '', 19, PAL.ink, '700').setLineSpacing(12);
    button(this, 770, 520, 200, 50, 'Hint', () => this.hint(), PAL.paper, 18);
    button(this, 1000, 520, 200, 50, 'Clear', () => { this.paths = {}; this.redraw(); }, PAL.paper, 18);
    this.finishBtn = button(this, 945, 640, 300, 60, 'Publish the routes', () => this.finish(), PAL.lantern, 22);
    button(this, 220, 660, 220, 46, 'Leave for now', () => closeOverlay(this), PAL.snow, 15);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onDown(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (this.drawing && p.isDown) this.onDrag(p); });
    this.input.on('pointerup', () => { this.drawing = null; this.redraw(); });
    this.input.keyboard!.on('keydown-ESC', () => closeOverlay(this));
    this.redraw();
    paperGrain(this);
  }

  private color(id: string): number { return hex(this.cfg.find((c) => c.id === id)!.color); }
  private center(c: Cell): [number, number] { return [FLOW_GRID.x + (c[0] + 0.5) * FLOW_GRID.cell, FLOW_GRID.y + (c[1] + 0.5) * FLOW_GRID.cell]; }
  private cellAt(px: number, py: number): Cell | null {
    const x = Math.floor((px - FLOW_GRID.x) / FLOW_GRID.cell), y = Math.floor((py - FLOW_GRID.y) / FLOW_GRID.cell);
    return x < 0 || y < 0 || x >= this.puzzle.w || y >= this.puzzle.h ? null : [x, y];
  }
  private same(a: Cell, b: Cell) { return a[0] === b[0] && a[1] === b[1]; }
  private endpointOf(c: Cell) { return this.puzzle.pairs.find((p) => this.same(p.a, c) || this.same(p.b, c)) ?? null; }

  private onDown(p: Phaser.Input.Pointer) {
    if (this.done) return;
    const c = this.cellAt(p.x, p.y);
    if (!c) return;
    const ep = this.endpointOf(c);
    if (ep) { this.drawing = ep.id; this.paths[ep.id] = [c]; this.redraw(); return; }
    // Continue an existing route from its loose end.
    for (const [id, path] of Object.entries(this.paths)) if (path.length && this.same(path[path.length - 1], c)) { this.drawing = id; return; }
  }

  private onDrag(p: Phaser.Input.Pointer) {
    const c = this.cellAt(p.x, p.y);
    const id = this.drawing!;
    const path = this.paths[id];
    if (!c || !path?.length) return;
    const last = path[path.length - 1];
    if (this.same(last, c)) return;
    if (Math.abs(last[0] - c[0]) + Math.abs(last[1] - c[1]) !== 1) return;
    if (path.length > 1 && this.same(path[path.length - 2], c)) { path.pop(); this.redraw(); return; } // backtrack
    if (path.some((q) => this.same(q, c))) return;
    const pair = this.puzzle.pairs.find((x) => x.id === id)!;
    const ep = this.endpointOf(c);
    if (ep && ep.id !== id) return;
    if (connected(this.puzzle, this.paths).includes(id)) return; // already joined
    // Cut through any other route occupying this cell.
    for (const [oid, op] of Object.entries(this.paths)) {
      if (oid === id) continue;
      const k = op.findIndex((q) => this.same(q, c));
      if (k >= 0) this.paths[oid] = op.slice(0, k);
    }
    path.push(c);
    if (this.same(c, pair.a) || this.same(c, pair.b)) this.drawing = null;
    this.redraw();
  }

  private freeHints() { return mod(store.state, 'freeHints', 0); }
  stars() { return Math.max(1, 3 - Math.max(0, this.hints - this.freeHints())); }

  private hint() {
    if (this.done) return;
    const ok = connected(this.puzzle, this.paths);
    const pair = this.puzzle.pairs.find((p) => !ok.includes(p.id));
    if (!pair) return;
    this.hints++;
    const sol = this.puzzle.solution[pair.id];
    for (const [oid, op] of Object.entries(this.paths)) {
      if (oid === pair.id) continue;
      const k = op.findIndex((q) => sol.some((s) => this.same(s, q)));
      if (k >= 0) this.paths[oid] = op.slice(0, k);
    }
    this.paths[pair.id] = sol.map((c) => [...c] as Cell);
    this.redraw();
  }

  private redraw() {
    const g = this.g.clear();
    for (const [id, path] of Object.entries(this.paths)) {
      if (path.length < 2) continue;
      g.lineStyle(22, this.color(id), 0.85);
      for (let i = 1; i < path.length; i++) {
        const [ax, ay] = this.center(path[i - 1]), [bx, by] = this.center(path[i]);
        g.lineBetween(ax, ay, bx, by);
      }
      for (const c of path) { const [x, y] = this.center(c); g.fillStyle(this.color(id), 0.85).fillCircle(x, y, 11); }
    }
    const ok = connected(this.puzzle, this.paths);
    const lines = this.cfg.map((c) => `${ok.includes(c.id) ? '✓' : '·'}  ${c.label}`);
    this.legend.setText(['Routes', ...lines, '', isSolved(this.puzzle, this.paths) ? `All connected!  ${'★'.repeat(this.stars())}` : `${ok.length}/${this.puzzle.pairs.length} connected`].join('\n'));
    this.finishBtn.setEnabled(isSolved(this.puzzle, this.paths) && !this.done);
  }

  private finish() {
    if (!isSolved(this.puzzle, this.paths) || this.done) return;
    this.done = true;
    const stars = this.stars();
    store.update('minigame', (s) => recordResult(s, this.data0.stepId, stars, this.data0.item));
    const who = CONTENT.layouts[store.state.currentRegion]?.keyPerson.name ?? 'them';
    resultPanel(this, 'Routes untangled!', stars, `Every line runs clean. Tell ${who}!`);
  }

  /** Debug/e2e. */
  solution() { return this.puzzle.solution; }
  geom() { return { ...FLOW_GRID, w: this.puzzle.w, h: this.puzzle.h }; }
}
