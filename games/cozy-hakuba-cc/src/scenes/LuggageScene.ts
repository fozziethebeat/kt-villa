import Phaser from 'phaser';
import { store } from '../gameStore';
import { generate, isSolved, place, rotate, type GeneratedPuzzle, type Placed } from '../sim/puzzles/gridPacking';
import { recordResult } from '../sim/quests';
import { label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop, starsText } from '../ui/widgets';
import { PAL, hex } from '../theme';

export const SHELF = { x: 90, y: 200, cell: 96, w: 5, h: 3 };
const TRAY = { x: 650, y: 110, w: 600, h: 470 };
const COLORS = [0x4f8f8a, 0xc8553d, 0xf2a541, 0x6c7fa3, 0x8cc084, 0xe89fb0, 0xa8754b, 0x7a5ea8];

/** Lost-luggage sort: a grid-packing puzzle. Pack every suitcase onto the shelf with no gaps. */
export class LuggageScene extends Phaser.Scene {
  private puzzle!: GeneratedPuzzle;
  private placed: Placed[] = [];
  private trayRot: Record<string, number> = {};
  private layer!: Phaser.GameObjects.Container;
  private ghost!: Phaser.GameObjects.Graphics;
  private drag: { id: string; rot: number; g: Phaser.GameObjects.Container; grabDX: number; grabDY: number } | null = null;
  private hints = 0;
  private hintText!: Phaser.GameObjects.Text;
  private solved = false;
  private trayPos: Record<string, { x: number; y: number; cell: number; rot: number }> = {};

  constructor() { super('Luggage'); }

  create() {
    this.placed = []; this.trayRot = {}; this.drag = null; this.hints = 0; this.solved = false;
    const seed = (store.state.seed ^ 0x51ab) >>> 0;
    this.puzzle = generate(SHELF.w, SHELF.h, seed, { minSize: 2, maxSize: 4 });
    for (const p of this.puzzle.pieces) this.trayRot[p.id] = 0;

    overlayBackdrop(this, 'Lost-Luggage Room', 'Drag suitcases onto the shelf · R / right-click rotates');
    paperPanel(this, SHELF.x - 30, SHELF.y - 60, SHELF.w * SHELF.cell + 60, SHELF.h * SHELF.cell + 110, '#d9b88f');
    label(this, SHELF.x - 10, SHELF.y - 46, 'Shelf: every cell must be filled', 16, PAL.ink, '500');
    const g = this.add.graphics();
    for (let x = 0; x < SHELF.w; x++) for (let y = 0; y < SHELF.h; y++) {
      g.fillStyle(hex('#efe3c2'), 1).fillRoundedRect(SHELF.x + x * SHELF.cell + 3, SHELF.y + y * SHELF.cell + 3, SHELF.cell - 6, SHELF.cell - 6, 8);
    }
    g.fillStyle(hex(PAL.wood), 1);
    for (let y = 1; y <= SHELF.h; y++) g.fillRect(SHELF.x - 10, SHELF.y + y * SHELF.cell - 3, SHELF.w * SHELF.cell + 20, 6);
    paperPanel(this, TRAY.x, TRAY.y, TRAY.w, TRAY.h, PAL.snow);
    label(this, TRAY.x + 18, TRAY.y + 10, 'Unsorted bags (right-click to rotate)', 16, PAL.twilight, '500');

    this.layer = this.add.container(0, 0);
    this.ghost = this.add.graphics().setDepth(40);

    button(this, 200, 640, 180, 54, 'Hint', () => this.hint(), PAL.paper, 20);
    button(this, 400, 640, 180, 54, 'Reset', () => { this.placed = []; this.render(); }, PAL.paper, 20);
    button(this, 1140, 640, 200, 54, 'Leave for now', () => closeOverlay(this), PAL.snow, 18);
    this.hintText = label(this, 520, 626, '', 16, PAL.twilight, '500');

    this.input.mouse?.disableContextMenu();
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onDrop(p));
    this.input.keyboard!.on('keydown-R', () => this.rotateDrag());
    this.render();
    paperGrain(this);
  }

  private freeHints(): number {
    return store.state.player.personality === 'planner' ? 1 : 0;
  }

  private stars(): number {
    return Math.max(1, 3 - Math.max(0, this.hints - this.freeHints()));
  }

  private suitcase(id: string, rot: number, cell: number): Phaser.GameObjects.Container {
    const idx = this.puzzle.pieces.findIndex((p) => p.id === id);
    const color = COLORS[idx % COLORS.length];
    const cells = rotate(this.puzzle.pieces[idx].shape, rot);
    const g = this.add.graphics();
    const pad = cell * 0.06;
    g.fillStyle(0x3b3a4a, 0.25);
    for (const [x, y] of cells) g.fillRoundedRect(x * cell + pad + 4, y * cell + pad + 5, cell - pad * 2, cell - pad * 2, cell * 0.14);
    g.fillStyle(color, 1).lineStyle(3, 0x3b3a4a, 1);
    for (const [x, y] of cells) g.fillRoundedRect(x * cell + pad, y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.14);
    // Bridges between neighbouring cells make one bag, not separate boxes.
    for (const [x, y] of cells) {
      if (cells.some(([a, b]) => a === x + 1 && b === y)) g.fillRect(x * cell + cell - pad - 2, y * cell + pad + 6, pad * 2 + 4, cell - pad * 2 - 12);
      if (cells.some(([a, b]) => a === x && b === y + 1)) g.fillRect(x * cell + pad + 6, y * cell + cell - pad - 2, cell - pad * 2 - 12, pad * 2 + 4);
    }
    for (const [x, y] of cells) g.strokeRoundedRect(x * cell + pad, y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.14);
    // Handle + strap on the first cell, so it reads as luggage.
    const [hx, hy] = cells[0];
    g.lineStyle(4, 0x3b3a4a, 1).strokeRoundedRect(hx * cell + cell * 0.32, hy * cell + cell * 0.18, cell * 0.36, cell * 0.16, 5);
    g.fillStyle(0xfbfaf6, 0.7);
    for (const [x, y] of cells) g.fillRect(x * cell + cell * 0.46, y * cell + cell * 0.4, cell * 0.08, cell * 0.46);
    const fw = (Math.max(...cells.map((c) => c[0])) + 1) * cell;
    const fh = (Math.max(...cells.map((c) => c[1])) + 1) * cell;
    return this.add.container(0, 0, [g]).setSize(fw, fh).setData('fw', fw).setData('fh', fh);
  }

  private render() {
    this.layer.removeAll(true);
    for (const p of this.placed) {
      const c = this.suitcase(p.id, p.rot, SHELF.cell).setPosition(SHELF.x + p.x * SHELF.cell, SHELF.y + p.y * SHELF.cell);
      this.hit(c, p.id, p.rot, SHELF.cell);
      this.layer.add(c);
    }
    const unplaced = this.puzzle.pieces.filter((pc) => !this.placed.some((p) => p.id === pc.id));
    const tc = 52;
    unplaced.forEach((pc, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const c = this.suitcase(pc.id, this.trayRot[pc.id], tc).setPosition(TRAY.x + 40 + col * 190, TRAY.y + 50 + row * 140);
      this.trayPos[pc.id] = { x: c.x, y: c.y, cell: tc, rot: this.trayRot[pc.id] };
      this.hit(c, pc.id, this.trayRot[pc.id], tc);
      this.layer.add(c);
    });
    this.hintText.setText(this.hints ? `Hints used: ${this.hints}  (${starsText(this.stars())})` : '');
    if (!this.solved && isSolved(this.puzzle.board, this.puzzle.pieces, this.placed)) this.win();
  }

  private hit(c: Phaser.GameObjects.Container, id: string, rot: number, cell: number) {
    const zone = this.add.zone(0, 0, c.getData('fw'), c.getData('fh')).setOrigin(0).setInteractive({ useHandCursor: true });
    c.add(zone);
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.solved || this.drag) return;
      if (p.rightButtonDown()) {
        if (!this.placed.some((x) => x.id === id)) { this.trayRot[id] = (this.trayRot[id] + 1) % 4; this.render(); }
        return;
      }
      // Grab offset in shelf-cell units so the bag doesn't jump under the cursor.
      const gx = Math.floor((p.x - c.x) / cell), gy = Math.floor((p.y - c.y) / cell);
      this.placed = this.placed.filter((x) => x.id !== id);
      const g = this.suitcase(id, rot, SHELF.cell).setAlpha(0.9).setDepth(50);
      this.drag = { id, rot, g, grabDX: (gx + 0.5) * SHELF.cell, grabDY: (gy + 0.5) * SHELF.cell };
      this.render();
      this.onMove(p);
    });
  }

  private rotateDrag() {
    if (!this.drag) return;
    this.drag.g.destroy();
    this.drag.rot = (this.drag.rot + 1) % 4;
    this.drag.g = this.suitcase(this.drag.id, this.drag.rot, SHELF.cell).setAlpha(0.9).setDepth(50);
    this.drag.grabDX = SHELF.cell / 2; this.drag.grabDY = SHELF.cell / 2;
    this.onMove(this.input.activePointer);
  }

  private cellFor(p: Phaser.Input.Pointer) {
    if (!this.drag) return null;
    const x = Math.round((p.x - this.drag.grabDX - SHELF.x) / SHELF.cell);
    const y = Math.round((p.y - this.drag.grabDY - SHELF.y) / SHELF.cell);
    return { x, y };
  }

  private onMove(p: Phaser.Input.Pointer) {
    if (!this.drag) return;
    this.drag.g.setPosition(p.x - this.drag.grabDX, p.y - this.drag.grabDY);
    this.ghost.clear();
    const cell = this.cellFor(p)!;
    const piece = this.puzzle.pieces.find((pc) => pc.id === this.drag!.id)!;
    const ok = !!place(this.puzzle.board, this.puzzle.pieces, this.placed, { id: piece.id, x: cell.x, y: cell.y, rot: this.drag.rot });
    const cells = rotate(piece.shape, this.drag.rot).map(([a, b]) => [a + cell.x, b + cell.y]);
    if (!cells.some(([a, b]) => a >= 0 && b >= 0 && a < SHELF.w && b < SHELF.h)) return;
    this.ghost.fillStyle(ok ? 0x8cc084 : 0xc8553d, 0.4);
    for (const [a, b] of cells) this.ghost.fillRoundedRect(SHELF.x + a * SHELF.cell + 3, SHELF.y + b * SHELF.cell + 3, SHELF.cell - 6, SHELF.cell - 6, 8);
  }

  private onDrop(p: Phaser.Input.Pointer) {
    if (!this.drag) return;
    const { id, rot, g } = this.drag;
    const cell = this.cellFor(p)!;
    g.destroy(); this.ghost.clear(); this.drag = null;
    const next = place(this.puzzle.board, this.puzzle.pieces, this.placed, { id, x: cell.x, y: cell.y, rot });
    if (next) this.placed = next; else this.trayRot[id] = rot;
    this.render();
  }

  private hint() {
    if (this.solved) return;
    const next = this.puzzle.solution.find((s) => !this.placed.some((p) => p.id === s.id && p.x === s.x && p.y === s.y && p.rot === s.rot));
    if (!next) return;
    this.hints++;
    // Clear anything in the way, then place the hinted bag.
    const cells = new Set(rotate(this.puzzle.pieces.find((pc) => pc.id === next.id)!.shape, next.rot).map(([a, b]) => `${a + next.x},${b + next.y}`));
    this.placed = this.placed.filter((p) => {
      if (p.id === next.id) return false;
      const pc = this.puzzle.pieces.find((x) => x.id === p.id)!;
      return !rotate(pc.shape, p.rot).some(([a, b]) => cells.has(`${a + p.x},${b + p.y}`));
    });
    this.placed.push(next);
    this.render();
  }

  private win() {
    this.solved = true;
    const stars = this.stars();
    store.update('puzzle', (s) => recordResult(s, 'luggage', stars, 'luggage_solved'));
    const fx = this.add.graphics().setDepth(90);
    fx.fillStyle(0xfff3c4, 0.5).fillRoundedRect(SHELF.x - 10, SHELF.y - 10, SHELF.w * SHELF.cell + 20, SHELF.h * SHELF.cell + 20, 14);
    this.tweens.add({ targets: fx, alpha: 0, duration: 900 });
    paperPanel(this, 700, 220, 500, 230, PAL.snow).setDepth(100);
    label(this, 950, 250, `All sorted!\n${starsText(stars)}`, 34, PAL.ink, '900').setOrigin(0.5, 0).setAlign('center').setDepth(101);
    label(this, 950, 350, 'Tell Mrs. Kobayashi the room is tidy.', 18, PAL.twilight, '500').setOrigin(0.5, 0).setDepth(101);
    button(this, 950, 410, 200, 50, 'Done', () => closeOverlay(this), PAL.lantern).container.setDepth(102);
  }

  /** Debug/e2e: the solution, in shelf-cell coordinates. */
  solution(): Placed[] { return this.puzzle.solution.map((s) => ({ ...s })); }
  /** Debug/e2e: tray position/rotation of an unplaced piece, plus its first filled cell at that rotation. */
  trayInfo(id: string) {
    const t = this.trayPos[id];
    const shape = this.puzzle.pieces.find((p) => p.id === id)!.shape;
    return { ...t, first: rotate(shape, t.rot)[0], shelf: SHELF };
  }
  isPlaced(id: string) { return this.placed.some((p) => p.id === id); }
}
