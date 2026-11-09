import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT } from '../sim/content';
import { mod } from '../sim/game';
import { bench, checkConstraint, describe, generateSeating, isSolved, type Assignment, type Guest, type SeatingPuzzle } from '../sim/puzzles/seating';
import { recordResult } from '../sim/quests';
import { label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop, resultPanel, type Button, type QuestGameData } from '../ui/widgets';
import { PAL, hex } from '../theme';

const COLORS = ['#c8553d', '#4f8f8a', '#f2a541', '#6c7fa3', '#7a5ea8', '#8cc084'];

/** Constraint seating overlay: click a guest, then click a seat. Every wish on the right must turn ✓. */
export class SeatingScene extends Phaser.Scene {
  private data0!: QuestGameData;
  private puzzle!: SeatingPuzzle;
  private seat: Assignment = [];
  private selected: string | null = null;
  private hints = 0;
  private done = false;
  private layer!: Phaser.GameObjects.Container;
  private wishes!: Phaser.GameObjects.Text;
  private finishBtn!: Button;
  private title = '';

  constructor() { super('Seating'); }

  init(data: QuestGameData) { this.data0 = data; }

  create() {
    const mg = CONTENT.minigames[this.data0.config] as unknown as { title: string; layout: 'counter' | 'cabin'; guests: Guest[] };
    this.title = mg.title;
    this.puzzle = generateSeating((store.state.seed ^ (mg.layout === 'cabin' ? 0x6a01 : 0x5ea7)) >>> 0, mg.layout, mg.guests);
    this.seat = Array(this.puzzle.seats).fill(null); this.selected = null; this.hints = 0; this.done = false;
    overlayBackdrop(this, mg.title, 'Click a guest, then a seat · every wish must be kept');
    paperPanel(this, 40, 96, 720, 470, mg.layout === 'cabin' ? '#dfe6ee' : '#e9d8bf');
    if (mg.layout === 'counter') {
      this.add.rectangle(90, 200, 620, 40, hex(PAL.wood)).setOrigin(0).setStrokeStyle(3, hex(PAL.ink));
      label(this, 400, 130, 'Counter  (seat 1 is by the door)', 18, PAL.ink, '700').setOrigin(0.5, 0);
    } else {
      label(this, 64, 190, 'Uphill\nbench', 17, PAL.ink, '700').setLineSpacing(2);
      label(this, 64, 330, 'Downhill\nbench', 17, PAL.ink, '700').setLineSpacing(2);
    }
    label(this, 60, 404, 'Waiting by the door', 15, PAL.twilight, '700');
    this.layer = this.add.container(0, 0);
    paperPanel(this, 790, 96, 460, 470, PAL.snow);
    this.wishes = label(this, 810, 112, '', 16, PAL.ink, '500').setWordWrapWidth(420).setLineSpacing(8);
    button(this, 900, 610, 180, 50, 'Hint', () => this.hint(), PAL.paper, 17);
    button(this, 1100, 610, 180, 50, 'Clear', () => { this.seat.fill(null); this.selected = null; this.redraw(); }, PAL.paper, 17);
    this.finishBtn = button(this, 560, 660, 300, 56, 'Everyone’s seated', () => this.finish(), PAL.lantern, 20);
    button(this, 180, 660, 200, 46, 'Leave for now', () => closeOverlay(this), PAL.snow, 15);
    this.input.keyboard!.on('keydown-ESC', () => closeOverlay(this));
    this.redraw();
    paperGrain(this);
  }

  /** Screen position of seat i. */
  seatPos(i: number): [number, number] {
    const p = this.puzzle;
    if (p.layout === 'counter') return [140 + i * 104, 290];
    const half = p.seats / 2;
    return bench(p.layout, p.seats, i) === 0 ? [280 + i * 150, 190] : [280 + (i - half) * 150, 330];
  }

  /** Screen position of a waiting (unseated) guest. */
  guestPos(id: string): [number, number] | null {
    const waiting = this.puzzle.guests.filter((g) => !this.seat.includes(g.id));
    const k = waiting.findIndex((g) => g.id === id);
    return k < 0 ? null : [110 + (k % 6) * 112, 494];
  }

  private token(g: Guest, x: number, y: number) {
    const i = this.puzzle.guests.indexOf(g);
    const sel = this.selected === g.id;
    const c = this.add.circle(x, y - 14, sel ? 30 : 26, hex(COLORS[i % COLORS.length])).setStrokeStyle(sel ? 5 : 3, hex(sel ? PAL.lantern : PAL.ink));
    const ini = label(this, x, y - 14, g.name[0], 22, PAL.snow, '900').setOrigin(0.5);
    const nm = label(this, x, y + 18, g.name.replace(/ \(.*\)/, ''), 13, PAL.ink, '700').setOrigin(0.5, 0);
    const wt = this.puzzle.layout === 'cabin' ? label(this, x + 22, y - 44, `${g.weight}`, 13, PAL.ink, '900').setOrigin(0.5) : null;
    const z = this.add.zone(x - 36, y - 46, 72, 90).setOrigin(0).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => { if (!this.done) { this.selected = this.selected === g.id ? null : g.id; this.redraw(); } });
    this.layer.add([c, ini, nm, z, ...(wt ? [wt] : [])]);
  }

  private redraw() {
    this.layer.removeAll(true);
    const p = this.puzzle;
    for (let i = 0; i < p.seats; i++) {
      const [x, y] = this.seatPos(i);
      const stool = this.add.rectangle(x, y + 46, 70, 14, hex(p.layout === 'cabin' ? '#8a96a8' : PAL.wood)).setStrokeStyle(2, hex(PAL.ink));
      const num = label(this, x, y + 58, `${i + 1}`, 13, PAL.twilight, '700').setOrigin(0.5, 0);
      const z = this.add.zone(x - 46, y - 50, 92, 110).setOrigin(0).setInteractive({ useHandCursor: true });
      z.on('pointerdown', () => this.clickSeat(i));
      this.layer.add([stool, num, z]);
      const id = this.seat[i];
      if (id) this.token(p.guests.find((g) => g.id === id)!, x, y);
    }
    for (const g of p.guests) { const pos = this.guestPos(g.id); if (pos) this.token(g, pos[0], pos[1]); }
    const lines = p.constraints.map((c) => { const st = checkConstraint(p, c, this.seat); return `${st === 'ok' ? '✓' : st === 'bad' ? '✗' : '·'}  ${describe(c, p.guests)}`; });
    if (p.layout === 'cabin') {
      const side = [0, 0];
      this.seat.forEach((id, i) => { if (id) side[bench(p.layout, p.seats, i)] += p.guests.find((g) => g.id === id)!.weight; });
      lines.push('', `Weights: uphill ${side[0]} · downhill ${side[1]}`);
    }
    this.wishes.setText(['Wishes', ...lines, '', isSolved(p, this.seat) ? `Everyone is happy!  ${'★'.repeat(this.stars())}` : ''].join('\n'));
    this.finishBtn.setEnabled(isSolved(p, this.seat) && !this.done);
  }

  clickSeat(i: number) {
    if (this.done) return;
    if (!this.selected) { const id = this.seat[i]; if (id) { this.selected = id; this.redraw(); } return; }
    const from = this.seat.indexOf(this.selected);
    const prev = this.seat[i];
    if (from >= 0) this.seat[from] = prev; // swap seats
    this.seat[i] = this.selected;
    this.selected = null;
    this.redraw();
  }

  private freeHints() { return mod(store.state, 'freeHints', 0); }
  stars() { return Math.max(1, 3 - Math.max(0, this.hints - this.freeHints())); }

  private hint() {
    if (this.done) return;
    const i = this.puzzle.solution.findIndex((id, k) => this.seat[k] !== id);
    if (i < 0) return;
    this.hints++;
    const id = this.puzzle.solution[i];
    const from = this.seat.indexOf(id);
    if (from >= 0) this.seat[from] = this.seat[i];
    this.seat[i] = id;
    this.selected = null;
    this.redraw();
  }

  private finish() {
    if (!isSolved(this.puzzle, this.seat) || this.done) return;
    this.done = true;
    const stars = this.stars();
    store.update('minigame', (s) => recordResult(s, this.data0.stepId, stars, this.data0.item));
    resultPanel(this, this.puzzle.layout === 'cabin' ? 'Balanced and happy!' : 'A full, happy counter!', stars, `${this.title}: every wish kept.`);
  }

  /** Debug/e2e. */
  solution() { return this.puzzle.solution; }
}
