import Phaser from 'phaser';
import { store } from '../gameStore';
import { finishBuild } from '../sim/archetype';
import { CONTENT, archetypeDef, moduleDef } from '../sim/content';
import { mod } from '../sim/game';
import { resample, scoreTrace, type Pt } from '../sim/puzzles/trace';
import { art, label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop, starsText, type Button } from '../ui/widgets';
import { PAL, hex } from '../theme';

const BASE_TOL = 14;
/** Two cuts per build, drawn on the blueprint panel (screen coordinates). */
export const CUTS: { title: string; path: Pt[] }[] = [
  { title: 'Cut the counter panel', path: [[170, 230], [560, 230], [560, 300], [640, 300], [640, 470], [170, 470], [170, 230]] },
  { title: 'Shape the support bracket', path: resample([[200, 480], [200, 260], [260, 220], [340, 220], [400, 270], [470, 330], [560, 330], [620, 290], [640, 230]], 30) },
];

/** Snow Peak step 3, part 2: build the archetype's signature module by tracing the blueprint cuts. */
export class BuildScene extends Phaser.Scene {
  private cut = 0;
  private strokes: Pt[][] = [];
  private drawing = false;
  private results: number[] = [];
  private stroke!: Phaser.GameObjects.Graphics;
  private guide!: Phaser.GameObjects.Graphics;
  private status!: Phaser.GameObjects.Text;
  private next!: Button;
  private finished = false;

  constructor() { super('Build'); }

  create() {
    this.cut = 0; this.strokes = []; this.drawing = false; this.results = []; this.finished = false;
    const arch = archetypeDef(CONTENT, store.state.primaryArchetype ?? 'coffee');
    const m = moduleDef(CONTENT, arch.builds);
    overlayBackdrop(this, `Building: ${m.name}`, 'Hold the mouse button and saw along the dashed line');
    paperPanel(this, 100, 120, 620, 440, '#dbe7f0');
    const grid = this.add.graphics().lineStyle(1, hex('#b9cfe0'), 1);
    for (let x = 120; x < 720; x += 30) grid.lineBetween(x, 130, x, 550);
    for (let y = 140; y < 560; y += 30) grid.lineBetween(110, y, 710, y);
    this.guide = this.add.graphics();
    this.stroke = this.add.graphics();

    paperPanel(this, 760, 120, 480, 440, PAL.snow);
    art(this, 1000, 230, `mod_${m.id}`, 0.5, 0.5).setScale(0.45);
    label(this, 784, 300, `${m.name}\n${m.blurb}`, 17, PAL.ink, '500').setWordWrapWidth(430).setLineSpacing(4);
    label(this, 784, 370, 'Uses: 4 salvaged van parts', 15, PAL.twilight, '500');
    this.status = label(this, 784, 404, '', 20, PAL.ink, '900').setLineSpacing(6);
    this.next = button(this, 1000, 640, 320, 60, 'Next cut', () => this.advance(), PAL.lantern, 22);
    button(this, 470, 640, 200, 50, 'Start over', () => { this.strokes = []; this.redraw(); }, PAL.paper, 16);
    button(this, 200, 660, 200, 46, 'Leave for now', () => closeOverlay(this), PAL.snow, 15);

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (this.inPanel(p) && !this.finished) { this.drawing = true; this.strokes.push([]); this.addPoint(p); } });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (this.drawing && p.isDown) this.addPoint(p); });
    this.input.on('pointerup', () => { this.drawing = false; this.redraw(); });
    this.redraw();
    paperGrain(this);
  }

  private tol() { return BASE_TOL * mod(store.state, 'craftQuality'); }
  private inPanel(p: Phaser.Input.Pointer) { return p.x > 100 && p.x < 720 && p.y > 120 && p.y < 560; }

  private addPoint(p: Phaser.Input.Pointer) {
    const cur = this.strokes[this.strokes.length - 1];
    const last = cur[cur.length - 1];
    if (last && Math.hypot(last[0] - p.x, last[1] - p.y) < 3) return;
    cur.push([p.x, p.y]);
    if (last) this.stroke.lineStyle(5, hex(PAL.wood), 1).lineBetween(last[0], last[1], p.x, p.y);
  }

  score() { return scoreTrace(CUTS[this.cut].path, this.strokes, this.tol()); }

  private redraw() {
    const path = CUTS[this.cut].path;
    const g = this.guide.clear();
    g.lineStyle(3, hex(PAL.twilight), 1);
    const dense = resample(path, 12);
    for (let i = 0; i < dense.length - 1; i += 2) g.lineBetween(dense[i][0], dense[i][1], dense[i + 1][0], dense[i + 1][1]);
    g.fillStyle(hex(PAL.fresh), 1).fillCircle(path[0][0], path[0][1], 9);
    const s = this.stroke.clear();
    s.lineStyle(5, hex(PAL.wood), 1);
    for (const st of this.strokes) for (let i = 1; i < st.length; i++) s.lineBetween(st[i - 1][0], st[i - 1][1], st[i][0], st[i][1]);
    const r = this.score();
    this.status.setText(`Cut ${this.cut + 1}/${CUTS.length}: ${CUTS[this.cut].title}\nTraced ${Math.round(r.coverage * 100)}%  ·  on the line ${Math.round(r.accuracy * 100)}%\n${this.strokes.length ? starsText(r.stars) : ''}`);
    this.next.setLabel(this.cut === CUTS.length - 1 ? 'Assemble the module' : 'Next cut');
    this.next.setEnabled(r.coverage >= 0.6);
  }

  private advance() {
    const r = this.score();
    if (r.coverage < 0.6 || this.finished) return;
    this.results.push(r.stars);
    if (this.cut < CUTS.length - 1) { this.cut++; this.strokes = []; this.redraw(); return; }
    this.finished = true;
    const stars = Math.max(1, Math.round(this.results.reduce((a, b) => a + b, 0) / this.results.length));
    let res!: ReturnType<typeof finishBuild>;
    store.update('craft', (s) => { res = finishBuild(s, stars); });
    const m = moduleDef(CONTENT, res.moduleId);
    const p = paperPanel(this, 320, 200, 640, 280, PAL.snow).setDepth(100);
    const t = label(this, 640, 236, `${m.name} built!\n${starsText(stars)}`, 34, PAL.ink, '900').setOrigin(0.5, 0).setAlign('center').setDepth(101);
    const d = label(this, 640, 340, res.refund ? `You already owned one, so Takumi buys the spare for ¥${res.refund}.\nShow Takumi your work!` : "It's in your van's storage. Place it, then show Takumi!", 18, PAL.twilight, '500').setOrigin(0.5, 0).setAlign('center').setDepth(101);
    const b = button(this, 640, 430, 220, 50, 'Done', () => closeOverlay(this), PAL.lantern);
    b.container.setDepth(102);
    void p; void t; void d;
  }
}
