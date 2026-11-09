import Phaser from 'phaser';
import { store } from '../gameStore';
import { take } from '../sim/game';
import { recordResult } from '../sim/quests';
import { art, label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, overlayBackdrop, starsText, type Button } from '../ui/widgets';
import { PAL, hex } from '../theme';

const MAP = { x: 60, y: 110, w: 760, h: 460 };
/** Correct sticker positions in map coordinates (geography-inspired: mountains west, lake south, river east). */
export const MAP_SLOTS: Record<string, [number, number]> = {
  mountains: [170, 120],
  gondola: [290, 210],
  station: [430, 300],
  onsen: [560, 180],
  lake: [300, 390],
};
const SNAP = 45;
const NOTES = [
  "Mrs. Kobayashi's notes:",
  '· The Hakuba Sanzan peaks rise in the far northwest.',
  '· The gondola climbs toward them, between the peaks and the village.',
  '· The station sits at the crossroads where the road meets the river.',
  '· The onsen steams beside the river, upstream to the north.',
  '· Lake Aoki lies south, at the end of the road.',
];

/** Creation quest: place landmark stickers on the blank valley map. Quality = how many land in the right spot. */
export class MapCraftScene extends Phaser.Scene {
  private stickers: { id: string; img: Phaser.GameObjects.Image; home: [number, number]; onMap: boolean }[] = [];
  private done!: Button;

  constructor() { super('MapCraft'); }

  create() {
    this.stickers = [];
    overlayBackdrop(this, 'Workbench · A Map for Visitors', 'Drag each sticker onto the map');
    art(this, MAP.x, MAP.y, 'map_blank', 0, 0);
    const g = this.add.graphics();
    for (const [x, y] of Object.values(MAP_SLOTS)) {
      g.lineStyle(3, hex('#b7a98e'), 0.9);
      for (let a = 0; a < 360; a += 30) g.beginPath().arc(MAP.x + x, MAP.y + y, 40, Phaser.Math.DegToRad(a), Phaser.Math.DegToRad(a + 16)).strokePath();
    }

    paperPanel(this, 850, 110, 400, 300, PAL.snow);
    label(this, 870, 126, NOTES.join('\n'), 16, PAL.ink, '500').setWordWrapWidth(360).setLineSpacing(8);

    paperPanel(this, 60, 600, 760, 100, PAL.snow);
    Object.keys(MAP_SLOTS).forEach((id, i) => {
      const home: [number, number] = [130 + i * 150, 650];
      const img = art(this, home[0], home[1], `stk_${id}`, 0.5, 0.5).setScale(0.4).setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(img);
      this.stickers.push({ id, img, home, onMap: false });
    });
    this.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, x: number, y: number) => { obj.setPosition(x, y).setScale(0.48).setDepth(10); });
    this.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => this.drop(obj));

    this.done = button(this, 1050, 470, 300, 60, 'Finish the map', () => this.finish(), PAL.lantern, 22);
    button(this, 1050, 550, 300, 50, 'Put it aside (keep stamina spent)', () => closeOverlay(this), PAL.paper, 15);
    this.refresh();
    paperGrain(this);
  }

  private drop(obj: Phaser.GameObjects.Image) {
    const st = this.stickers.find((s) => s.img === obj)!;
    obj.setDepth(1);
    const inMap = obj.x > MAP.x && obj.x < MAP.x + MAP.w && obj.y > MAP.y && obj.y < MAP.y + MAP.h;
    if (!inMap) { obj.setPosition(...st.home).setScale(0.4); st.onMap = false; this.refresh(); return; }
    st.onMap = true;
    // Snap neatly into the nearest dashed slot if close (any slot; correctness is judged at the end).
    let best: [number, number] | null = null; let bestD = SNAP;
    for (const [x, y] of Object.values(MAP_SLOTS)) {
      const d = Phaser.Math.Distance.Between(obj.x, obj.y, MAP.x + x, MAP.y + y);
      if (d < bestD) { bestD = d; best = [MAP.x + x, MAP.y + y]; }
    }
    if (best) obj.setPosition(...best);
    obj.setScale(0.5);
    this.refresh();
  }

  private refresh() {
    this.done.setEnabled(this.stickers.every((s) => s.onMap));
  }

  /** Stars: 5 correct → 3★, 3-4 → 2★, else 1★. */
  score(): { correct: number; stars: number } {
    const correct = this.stickers.filter((s) => {
      const [x, y] = MAP_SLOTS[s.id];
      return Phaser.Math.Distance.Between(s.img.x, s.img.y, MAP.x + x, MAP.y + y) < SNAP;
    }).length;
    return { correct, stars: correct === 5 ? 3 : correct >= 3 ? 2 : 1 };
  }

  private finish() {
    const { correct, stars } = this.score();
    store.update('craft', (s) => { take(s, 'blank_map', 1); recordResult(s, 'valley_map', stars, 'valley_map'); });
    this.children.list.filter((o) => o.input).forEach((o) => o.disableInteractive());
    const p = paperPanel(this, 340, 220, 600, 240, PAL.snow).setDepth(100);
    const t = label(this, 640, 270, `Valley map finished!\n${starsText(stars)}`, 34, PAL.ink, '900').setOrigin(0.5, 0).setAlign('center').setDepth(101);
    const d = label(this, 640, 370, `${correct}/5 landmarks in the right place. Bring it to Mrs. Kobayashi.`, 18, PAL.twilight, '500').setOrigin(0.5, 0).setDepth(101);
    const b = button(this, 640, 430, 220, 50, 'Done', () => closeOverlay(this), PAL.lantern);
    b.container.setDepth(102);
    void p; void t; void d;
  }

  /** Debug/e2e: drop a sticker at a map coordinate as if dragged. */
  dropSticker(id: string, mapX: number, mapY: number) {
    const st = this.stickers.find((s) => s.id === id)!;
    st.img.setPosition(MAP.x + mapX, MAP.y + mapY);
    this.drop(st.img);
  }
}
