import Phaser from 'phaser';
import { store } from '../gameStore';
import { mod, season } from '../sim/game';
import { checkPeg, evaluate, generateTent, lineLength, netForce, solve, type Cell, type Corner, type Pegs, type TentPuzzle } from '../sim/puzzles/tentBalance';
import { recordResult } from '../sim/quests';
import { isSnowy } from '../sim/seasons';
import { art, label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop, starsText, type Button } from '../ui/widgets';
import { PAL, hex } from '../theme';
import { sfx } from '../audio';

export const TENT_GRID = { x: 80, y: 104, cell: 52 };
const CORNER_COLOR: Record<Corner['id'], number> = { nw: 0x4f8f8a, ne: 0xc8553d, sw: 0x6c7fa3, se: 0x7a5ea8 };
const REASON: Record<string, string> = {
  outside: '', axis: "Guy lines can't run straight along the tent's own row or column.", tent: "That's under the tent.",
  rock: "A rock. The peg won't go in.", short: 'Too close: the line would go slack.', long: "Too far: the line won't reach.",
};

/** Snow Peak step 1: pitch the demo tent (balance / placement engine). Click a cell to peg that quadrant's guy line. */
export class TentScene extends Phaser.Scene {
  private puzzle!: TentPuzzle;
  private pegs: Pegs = {};
  private hints = 0;
  private solvedShown = false;
  private lines!: Phaser.GameObjects.Graphics;
  private hover!: Phaser.GameObjects.Graphics;
  private tent!: Phaser.GameObjects.Image;
  private pegImgs: Phaser.GameObjects.Image[] = [];
  private status!: Phaser.GameObjects.Text;
  private msg!: Phaser.GameObjects.Text;
  private done!: Button;

  constructor() { super('Tent'); }

  create() {
    this.pegs = {}; this.hints = 0; this.solvedShown = false; this.pegImgs = [];
    this.puzzle = generateTent((store.state.seed ^ 0x7e47) >>> 0);
    const { w, h, center } = this.puzzle;
    const G = TENT_GRID;
    overlayBackdrop(this, 'Pitch the Demo Tent', 'Click a spot to peg the guy line for that corner');
    const snowy = isSnowy(season(store.state).season);
    paperPanel(this, G.x - 16, G.y - 16, w * G.cell + 32, h * G.cell + 32, snowy ? '#e9eef3' : '#cfe3bf');
    const g = this.add.graphics();
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
      const axis = x === center[0] || y === center[1];
      g.fillStyle(hex(snowy ? '#fbfaf6' : '#a8cf8f'), axis ? 0.35 : 1).fillRoundedRect(G.x + x * G.cell + 2, G.y + y * G.cell + 2, G.cell - 4, G.cell - 4, 8);
    }
    for (const [x, y] of this.puzzle.rocks) art(this, G.x + (x + 0.5) * G.cell, G.y + (y + 0.5) * G.cell, 'rock', 0.5, 0.5).setScale(0.55);
    this.lines = this.add.graphics().setDepth(5);
    this.tent = art(this, G.x + (center[0] + 0.5) * G.cell, G.y + (center[1] + 0.5) * G.cell, 'tent_top', 0.5, 0.5).setScale(0.5 * (3 * G.cell) / 144).setDepth(6);
    this.hover = this.add.graphics().setDepth(4);

    // Right panel: what to do + the lean meter.
    paperPanel(this, 700, 104, 550, 476, PAL.snow);
    label(this, 724, 120, 'Each corner pulls its guy line like a spring.\nLonger line = stronger pull. Peg all four so the\npulls cancel out and the tent stands straight.\nRocks block pegs; lines must be 2–4 cells long.', 17, PAL.ink, '500').setLineSpacing(6);
    this.status = label(this, 724, 270, '', 22, PAL.ink, '900').setLineSpacing(6);
    this.msg = label(this, 724, 360, '', 16, PAL.noren, '700').setWordWrapWidth(500);
    button(this, 820, 520, 200, 52, 'Hint', () => this.hint(), PAL.paper, 18);
    button(this, 1050, 520, 200, 52, 'Reset', () => { this.pegs = {}; this.redraw(); }, PAL.paper, 18);
    this.done = button(this, 935, 640, 300, 60, 'Tie it off', () => this.finish(), PAL.lantern, 22);
    button(this, 200, 660, 240, 50, 'Leave for now', () => closeOverlay(this), PAL.snow, 16);

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onHover(p));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { const c = this.cellAt(p.x, p.y); if (c) this.clickCell(c); });
    this.input.keyboard!.on('keydown-ESC', () => closeOverlay(this));
    this.redraw();
    paperGrain(this);
  }

  private cellAt(px: number, py: number): Cell | null {
    const G = TENT_GRID;
    const x = Math.floor((px - G.x) / G.cell), y = Math.floor((py - G.y) / G.cell);
    if (x < 0 || y < 0 || x >= this.puzzle.w || y >= this.puzzle.h) return null;
    return [x, y];
  }

  private center(c: Cell): [number, number] {
    return [TENT_GRID.x + (c[0] + 0.5) * TENT_GRID.cell, TENT_GRID.y + (c[1] + 0.5) * TENT_GRID.cell];
  }

  private onHover(p: Phaser.Input.Pointer) {
    this.hover.clear();
    const c = this.cellAt(p.x, p.y);
    if (!c || this.solvedShown) return;
    const r = checkPeg(this.puzzle, c);
    const G = TENT_GRID;
    this.hover.fillStyle(r.ok ? CORNER_COLOR[r.corner.id] : 0xc8553d, r.ok ? 0.35 : 0.18).fillRoundedRect(G.x + c[0] * G.cell + 2, G.y + c[1] * G.cell + 2, G.cell - 4, G.cell - 4, 8);
  }

  clickCell(c: Cell) {
    if (this.solvedShown) return;
    const r = checkPeg(this.puzzle, c);
    if (!r.ok) { this.msg.setText(REASON[r.reason]); return; }
    this.msg.setText('');
    sfx('hit');
    this.pegs = { ...this.pegs, [r.corner.id]: c };
    this.redraw();
  }

  private freeHints() { return mod(store.state, 'freeHints', 0); }

  stars(): number {
    const e = evaluate(this.puzzle, this.pegs);
    const base = e.perfect ? 3 : e.solved ? 2 : 1;
    return Math.max(1, base - Math.max(0, this.hints - this.freeHints()));
  }

  private hint() {
    if (this.solvedShown) return;
    const sol = solve(this.puzzle, this.keptPegs());
    if (!sol) return;
    const wrong = this.puzzle.corners.find((c) => { const p = this.pegs[c.id]; return !p || p[0] !== sol[c.id]![0] || p[1] !== sol[c.id]![1]; });
    if (!wrong) return;
    this.hints++;
    this.pegs = { ...this.pegs, [wrong.id]: sol[wrong.id]! };
    this.msg.setText(this.hints <= this.freeHints() ? 'Planner tip: that corner goes there (free hint).' : 'Takumi points: "Try that corner there." (hint costs a star)');
    this.redraw();
  }

  /** Keep the player's pegs when a perfect solution still exists with them; otherwise solve from scratch. */
  private keptPegs(): Pegs {
    return Object.fromEntries(Object.entries(this.pegs).filter(([, c]) => c && checkPeg(this.puzzle, c).ok)) as Pegs;
  }

  private redraw() {
    const P = this.puzzle;
    const g = this.lines.clear();
    const [fx, fy] = netForce(P, this.pegs);
    const e = evaluate(P, this.pegs);
    // The tent visibly leans with the net pull.
    const [tcx, tcy] = this.center(P.center);
    this.tent.setPosition(tcx + Phaser.Math.Clamp(fx, -4, 4) * 4, tcy + Phaser.Math.Clamp(fy, -4, 4) * 4).setRotation(Phaser.Math.Clamp(fx, -4, 4) * 0.025);
    this.pegImgs.forEach((i) => i.destroy());
    this.pegImgs = [];
    for (const c of P.corners) {
      const [ax, ay] = this.center(c.at);
      const peg = this.pegs[c.id];
      if (!peg) { g.fillStyle(CORNER_COLOR[c.id], 1).fillCircle(ax + c.dir[0] * 14, ay + c.dir[1] * 14, 6); continue; }
      const [px, py] = this.center(peg);
      const len = lineLength(c.at, peg);
      g.lineStyle(2 + len, CORNER_COLOR[c.id], 0.95).lineBetween(ax + c.dir[0] * 14, ay + c.dir[1] * 14, px, py);
      this.pegImgs.push(art(this, px, py, 'peg', 0.5, 0.5).setScale(0.55).setDepth(7).setTint(CORNER_COLOR[c.id]));
    }
    // Lean arrow from the tent centre.
    if (Math.hypot(fx, fy) > 0) {
      const col = e.solved ? 0x8cc084 : 0xc8553d;
      const ex = tcx + fx * 16, ey = tcy + fy * 16;
      g.lineStyle(6, col, 1).lineBetween(tcx, tcy, ex, ey);
      const a = Math.atan2(fy, fx);
      g.fillStyle(col, 1).fillTriangle(ex + Math.cos(a) * 14, ey + Math.sin(a) * 14, ex + Math.cos(a + 2.4) * 12, ey + Math.sin(a + 2.4) * 12, ex + Math.cos(a - 2.4) * 12, ey + Math.sin(a - 2.4) * 12);
    }
    g.setDepth(8);
    const pegged = P.corners.filter((c) => this.pegs[c.id]).length;
    const lean = e.lean === 0 ? 'standing straight!' : `leaning ${Math.round(e.lean * 10) / 10} cells`;
    this.status.setText(`Lines pegged ${pegged}/4\nTent ${pegged ? lean : 'flat on the ground'}\n${e.solved ? `Good enough to tie off  ${starsText(this.stars())}` : ''}`);
    this.status.setColor(e.solved ? PAL.cedar : PAL.ink);
    this.done.setEnabled(e.solved);
  }

  private finish() {
    const e = evaluate(this.puzzle, this.pegs);
    if (!e.solved || this.solvedShown) return;
    this.solvedShown = true;
    const stars = this.stars();
    store.update('minigame', (s) => recordResult(s, 'tent', stars, 'tent_pitched'));
    this.hover.clear();
    const p = paperPanel(this, 340, 220, 600, 240, PAL.snow).setDepth(100);
    const t = label(this, 640, 262, `The tent is up!\n${starsText(stars)}`, 34, PAL.ink, '900').setOrigin(0.5, 0).setAlign('center').setDepth(101);
    const d = label(this, 640, 364, e.perfect ? 'Perfectly balanced. Tell Takumi!' : 'A tiny lean, but it holds. Tell Takumi!', 18, PAL.twilight, '500').setOrigin(0.5, 0).setDepth(101);
    const b = button(this, 640, 420, 220, 50, 'Done', () => closeOverlay(this), PAL.lantern);
    b.container.setDepth(102);
    void p; void t; void d;
  }

  /** Debug/e2e: a perfect solution and the grid geometry, for clicking real cells. */
  solution(): Pegs { return solve(this.puzzle)!; }
  geom() { return { ...TENT_GRID, w: this.puzzle.w, h: this.puzzle.h }; }
}
