import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT } from '../sim/content';
import { take } from '../sim/game';
import { recordResult } from '../sim/quests';
import { art, label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop, starsText, type Button } from '../ui/widgets';
import { FONT, PAL, hex } from '../theme';

export const BOARD_AREA = { x: 60, y: 110, w: 760, h: 460 };
const SNAP = 45;

export interface ArrangeConfig {
  title: string;
  subtitle: string;
  /** Either a texture (e.g. the blank valley map) or a paper board with labelled rows. */
  board: { texture?: string; rows?: string[] };
  /** Correct position for each sticker, relative to the board's top-left. */
  slots: Record<string, [number, number]>;
  notes: string[];
  stickers: { id: string; texture?: string; text?: string }[];
}

export interface ArrangeData { stepId: string; item: string; config?: string; consume?: string; cfg?: ArrangeConfig; doneText?: string }

type Sticker = { id: string; obj: Phaser.GameObjects.Image | Phaser.GameObjects.Container; home: [number, number]; onMap: boolean; scale: number };

/** "Arrange" creation engine (§5.2): drag stickers onto a board following someone's notes. Stars = how many land right. */
export class ArrangeScene extends Phaser.Scene {
  protected data0!: ArrangeData;
  protected cfg!: ArrangeConfig;
  private stickers: Sticker[] = [];
  private done!: Button;

  constructor(key = 'Arrange') { super(key); }

  init(data: ArrangeData) {
    this.data0 = data;
    this.cfg = data.cfg ?? (CONTENT.minigames[data.config!] as unknown as ArrangeConfig);
  }

  create() {
    this.stickers = [];
    const B = BOARD_AREA;
    overlayBackdrop(this, this.cfg.title, this.cfg.subtitle);
    if (this.cfg.board.texture) art(this, B.x, B.y, this.cfg.board.texture, 0, 0);
    else {
      paperPanel(this, B.x, B.y, B.w, B.h, '#fdf6e6');
      (this.cfg.board.rows ?? []).forEach((r, i) => {
        const y = B.y + 90 + i * 100;
        label(this, B.x + 40, y - 14, r, 26, PAL.ink, '900');
        this.add.line(0, 0, B.x + 30, y + 40, B.x + B.w - 30, y + 40, hex(PAL.snowShadow)).setOrigin(0).setLineWidth(2);
      });
    }
    const g = this.add.graphics();
    for (const [x, y] of Object.values(this.cfg.slots)) {
      g.lineStyle(3, hex('#b7a98e'), 0.9);
      for (let a = 0; a < 360; a += 30) g.beginPath().arc(B.x + x, B.y + y, 40, Phaser.Math.DegToRad(a), Phaser.Math.DegToRad(a + 16)).strokePath();
    }

    paperPanel(this, 850, 110, 400, 300, PAL.snow);
    label(this, 870, 126, this.cfg.notes.join('\n'), 16, PAL.ink, '500').setWordWrapWidth(360).setLineSpacing(8);

    paperPanel(this, 60, 600, 760, 100, PAL.snow);
    this.cfg.stickers.forEach((st, i) => {
      const home: [number, number] = [130 + i * 150, 650];
      let obj: Sticker['obj'];
      let scale = 1;
      if (st.texture) { scale = 0.5; obj = art(this, home[0], home[1], st.texture, 0.5, 0.5).setScale(0.4); }
      else {
        const bg = this.add.rectangle(0, 0, 96, 52, hex(PAL.lantern)).setStrokeStyle(3, hex(PAL.ink));
        const t = this.add.text(0, 0, st.text ?? st.id, { fontFamily: FONT, fontSize: '24px', color: PAL.ink, fontStyle: '900' }).setOrigin(0.5);
        obj = this.add.container(home[0], home[1], [bg, t]).setSize(96, 52);
      }
      obj.setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(obj);
      this.stickers.push({ id: st.id, obj, home, onMap: false, scale });
    });
    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Sticker['obj'], x: number, y: number) => {
      const st = this.stickers.find((s) => s.obj === obj);
      obj.setPosition(x, y).setDepth(10);
      if (st?.scale !== 1) obj.setScale(0.48);
    });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Sticker['obj']) => this.drop(obj));

    this.done = button(this, 1050, 470, 300, 60, 'Finish', () => this.finish(), PAL.lantern, 22);
    button(this, 1050, 550, 300, 50, 'Put it aside (keep stamina spent)', () => closeOverlay(this), PAL.paper, 15);
    this.refresh();
    paperGrain(this);
  }

  private drop(obj: Sticker['obj']) {
    const B = BOARD_AREA;
    const st = this.stickers.find((s) => s.obj === obj)!;
    obj.setDepth(1);
    const inBoard = obj.x > B.x && obj.x < B.x + B.w && obj.y > B.y && obj.y < B.y + B.h;
    if (!inBoard) { obj.setPosition(...st.home); if (st.scale !== 1) obj.setScale(0.4); st.onMap = false; this.refresh(); return; }
    st.onMap = true;
    // Snap neatly into the nearest dashed slot if close (any slot; correctness is judged at the end).
    let best: [number, number] | null = null; let bestD = SNAP;
    for (const [x, y] of Object.values(this.cfg.slots)) {
      const d = Phaser.Math.Distance.Between(obj.x, obj.y, B.x + x, B.y + y);
      if (d < bestD) { bestD = d; best = [B.x + x, B.y + y]; }
    }
    if (best) obj.setPosition(...best);
    if (st.scale !== 1) obj.setScale(0.5);
    this.refresh();
  }

  private refresh() {
    this.done.setEnabled(this.stickers.every((s) => s.onMap));
  }

  /** Stars: all correct → 3★, at least 60% → 2★, else 1★. */
  score(): { correct: number; stars: number } {
    const B = BOARD_AREA;
    const correct = this.stickers.filter((s) => {
      const [x, y] = this.cfg.slots[s.id];
      return Phaser.Math.Distance.Between(s.obj.x, s.obj.y, B.x + x, B.y + y) < SNAP;
    }).length;
    const n = this.stickers.length;
    return { correct, stars: correct === n ? 3 : correct >= Math.ceil(n * 0.6) ? 2 : 1 };
  }

  private finish() {
    const { correct, stars } = this.score();
    const d = this.data0;
    store.update('craft', (s) => { if (d.consume) take(s, d.consume, 1); recordResult(s, d.stepId, stars, d.item); });
    this.children.list.filter((o) => o.input).forEach((o) => o.disableInteractive());
    const p = paperPanel(this, 340, 220, 600, 240, PAL.snow).setDepth(100);
    const t = label(this, 640, 270, `${this.cfg.title} finished!\n${starsText(stars)}`, 30, PAL.ink, '900').setOrigin(0.5, 0).setAlign('center').setDepth(101);
    const txt = label(this, 640, 370, `${correct}/${this.stickers.length} in the right place. ${d.doneText ?? 'Bring it over!'}`, 18, PAL.twilight, '500').setOrigin(0.5, 0).setDepth(101);
    const b = button(this, 640, 430, 220, 50, 'Done', () => closeOverlay(this), PAL.lantern);
    b.container.setDepth(102);
    void p; void t; void txt;
  }

  /** Debug/e2e: drop a sticker at a board coordinate as if dragged. */
  dropSticker(id: string, x: number, y: number) {
    const st = this.stickers.find((s) => s.id === id)!;
    st.obj.setPosition(BOARD_AREA.x + x, BOARD_AREA.y + y);
    this.drop(st.obj);
  }
}
