import Phaser from 'phaser';
import { store } from '../gameStore';
import { startShift } from '../sim/business';
import { CONTENT, moduleDef } from '../sim/content';
import { spendAction, staminaLeft } from '../sim/game';
import { rotate } from '../sim/puzzles/gridPacking';
import { currentStep } from '../sim/quests';
import { buyModule, canPlaceModule, comfort, comfortStaminaBonus, isPlaced, placeModule, removeModule } from '../sim/van';
import type { ModuleDef } from '../sim/types';
import { art, label, paperGrain, paperPanel } from '../ui/art';
import { button, closeOverlay, openOverlay, overlayBackdrop, type Button } from '../ui/widgets';
import { PAL, hex } from '../theme';

export const VAN = { x: 40, y: 120, gridX: 100, gridY: 190, cellW: 160, cellH: 130 };
const TRAY = { x: 40, y: 540, w: 760, h: 160 };
const CATEGORY_COLOR: Record<ModuleDef['category'], string> = { living: PAL.wood, production: '#8a96a8', service: PAL.noren, roof: '#9fd3e6', utility: PAL.teal };

interface Drag { moduleId: string; rot: number; sprite: Phaser.GameObjects.Container }

/** Spiritfarer-style cutaway: place modules on the van grid, then craft, open the café, shop or sleep. */
export class VanInteriorScene extends Phaser.Scene {
  private world!: Phaser.GameObjects.Container;
  private ghost!: Phaser.GameObjects.Graphics;
  private drag: Drag | null = null;
  private info!: Phaser.GameObjects.Text;
  private comfortText!: Phaser.GameObjects.Text;
  private msg!: Phaser.GameObjects.Text;
  private actions: Record<string, Button> = {};
  private shopOpen = false;
  private shopLayer!: Phaser.GameObjects.Container;

  constructor() { super('VanInterior'); }

  create() {
    this.drag = null; this.shopOpen = false; this.actions = {};
    overlayBackdrop(this, 'Your Kei Van', 'Drag modules · R / right-click rotates');
    art(this, VAN.x, VAN.y, 'van_interior', 0, 0);
    // Grid guide
    const g = this.add.graphics();
    const { w, h } = store.state.van.grid;
    g.lineStyle(2, hex(PAL.ink), 0.18);
    for (let cx = 0; cx < w; cx++) for (let cy = 0; cy < h; cy++) g.strokeRoundedRect(VAN.gridX + cx * VAN.cellW + 4, VAN.gridY + cy * VAN.cellH + 4, VAN.cellW - 8, VAN.cellH - 8, 10);
    paperPanel(this, TRAY.x, TRAY.y, TRAY.w, TRAY.h, PAL.snow);
    label(this, TRAY.x + 18, TRAY.y + 10, 'Stored modules (drag into the van)', 16, PAL.twilight, '500');

    this.world = this.add.container(0, 0);
    this.ghost = this.add.graphics().setDepth(50);

    // Right panel
    paperPanel(this, 830, 96, 420, 604, PAL.snow);
    this.comfortText = label(this, 852, 112, '', 20, PAL.ink).setLineSpacing(4);
    this.actions.craft = button(this, 1040, 220, 370, 52, '', () => this.craftMap(), PAL.lantern, 18);
    this.actions.cafe = button(this, 1040, 284, 370, 52, 'Open the café  (3 stamina)', () => this.openCafe(), PAL.lantern, 18);
    this.actions.shop = button(this, 1040, 348, 370, 52, 'Module shop', () => this.toggleShop(), PAL.paper, 18);
    this.actions.sleep = button(this, 1040, 412, 370, 52, 'Sleep (end the day)', () => this.sleep(), '#c9d3e6', 18);
    this.actions.out = button(this, 1040, 476, 370, 52, 'Step outside', () => closeOverlay(this), PAL.paper, 18);
    this.msg = label(this, 852, 516, '', 16, PAL.noren, '700').setWordWrapWidth(380);
    this.info = label(this, 852, 600, 'Hover a module to see what it does.', 15, PAL.twilight, '500').setWordWrapWidth(380).setLineSpacing(3);
    this.shopLayer = this.add.container(0, 0).setDepth(80);

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onMove(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onDrop(p));
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (p.rightButtonDown() && this.drag) this.rotateDrag(); });
    this.input.mouse?.disableContextMenu();
    this.input.keyboard!.on('keydown-R', () => this.rotateDrag());
    this.input.keyboard!.on('keydown-ESC', () => { if (!this.drag) closeOverlay(this); });

    const unsub = store.subscribe(() => this.refresh());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsub);
    this.events.on(Phaser.Scenes.Events.RESUME, () => this.refresh());
    this.refresh();
    paperGrain(this);
  }

  // ---- rendering ----------------------------------------------------------

  private moduleSprite(def: ModuleDef, rot: number, scale = 1): Phaser.GameObjects.Container {
    const cells = rotate(def.shape, rot);
    const fw = (Math.max(...cells.map((c) => c[0])) + 1) * VAN.cellW;
    const fh = (Math.max(...cells.map((c) => c[1])) + 1) * VAN.cellH;
    const img = art(this, 0, 0, `mod_${def.id}`, 0.5, 0.5);
    img.setRotation((rot % 2) * (Math.PI / 2));
    const iw = rot % 2 ? img.displayHeight : img.displayWidth;
    const ih = rot % 2 ? img.displayWidth : img.displayHeight;
    img.setScale(0.5 * Math.min(1, fw / iw, fh / ih));
    const band = this.add.rectangle(0, fh / 2 - 6, fw - 16, 6, hex(CATEGORY_COLOR[def.category])).setAlpha(0.9);
    const c = this.add.container(0, 0, [img, band]).setSize(fw, fh).setScale(scale);
    c.setData('fw', fw).setData('fh', fh);
    return c;
  }

  private refresh() {
    this.world.removeAll(true);
    const s = store.state;
    for (const p of s.van.placed) {
      const def = moduleDef(CONTENT, p.moduleId);
      const c = this.moduleSprite(def, p.rot);
      c.setPosition(VAN.gridX + p.x * VAN.cellW + c.getData('fw') / 2, VAN.gridY + p.y * VAN.cellH + c.getData('fh') / 2);
      this.makeDraggable(c, def, p.rot);
      this.world.add(c);
    }
    const stored = s.van.owned.filter((id) => !isPlaced(s, id));
    stored.forEach((id, i) => {
      const def = moduleDef(CONTENT, id);
      const c = this.moduleSprite(def, 0, 0.55);
      c.setPosition(TRAY.x + 110 + i * 190, TRAY.y + 92);
      this.makeDraggable(c, def, 0);
      this.world.add(c);
    });
    if (!stored.length) this.world.add(label(this, TRAY.x + 18, TRAY.y + 70, 'Everything you own is placed. Buy more in the shop.', 16, PAL.twilight, '500'));

    const c = comfort(s);
    this.comfortText.setText(`Comfort ♥ ${c}  →  +${comfortStaminaBonus(s)} stamina tomorrow\n¥ ${s.yen.toLocaleString('en-US')}   ·   stamina left ${staminaLeft(s)}`);

    const step = currentStep(s, 'station');
    const mapNeeded = step?.id === 'valley_map';
    this.actions.craft.setLabel(mapNeeded ? 'Workbench: draw the valley map (1 stamina)' : 'Workbench: nothing to make yet');
    this.actions.craft.setEnabled(mapNeeded && (s.inventory.blank_map ?? 0) > 0 && (s.inventory.valley_map ?? 0) === 0);
    const coffee = s.unlocks.includes('business:coffee');
    this.actions.cafe.setLabel(coffee ? 'Open the café  (3 stamina)' : 'Café: locked (help Mrs. Kobayashi)');
    this.actions.cafe.setEnabled(coffee);
    if (this.shopOpen) this.renderShop();
  }

  private makeDraggable(c: Phaser.GameObjects.Container, def: ModuleDef, rot: number) {
    c.setInteractive({ useHandCursor: true, draggable: false });
    c.on('pointerover', () => this.info.setText(`${def.name} · ${def.category}${def.comfort ? ` · comfort +${def.comfort}` : ''}\n${def.blurb}`));
    c.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown() || this.drag) return;
      this.startDrag(def, rot, p);
    });
  }

  // ---- drag & drop ----------------------------------------------------------

  private startDrag(def: ModuleDef, rot: number, p: Phaser.Input.Pointer) {
    store.update('van', (s) => removeModule(s, def.id));
    const sprite = this.moduleSprite(def, rot).setAlpha(0.85).setDepth(60);
    this.drag = { moduleId: def.id, rot, sprite };
    this.onMove(p);
  }

  private rotateDrag() {
    if (!this.drag) return;
    const def = moduleDef(CONTENT, this.drag.moduleId);
    const p = this.input.activePointer;
    this.drag.sprite.destroy();
    this.drag.rot = (this.drag.rot + 1) % 4;
    this.drag.sprite = this.moduleSprite(def, this.drag.rot).setAlpha(0.85).setDepth(60);
    this.onMove(p);
  }

  /** Grid cell for the dragged module's top-left, given the pointer at the module centre. */
  private cellFor(p: Phaser.Input.Pointer): { x: number; y: number } | null {
    if (!this.drag) return null;
    const fw = this.drag.sprite.getData('fw'), fh = this.drag.sprite.getData('fh');
    const x = Math.round((p.x - fw / 2 - VAN.gridX) / VAN.cellW);
    const y = Math.round((p.y - fh / 2 - VAN.gridY) / VAN.cellH);
    const { w, h } = store.state.van.grid;
    if (x < -1 || y < -1 || x > w || y > h) return null;
    return { x, y };
  }

  private onMove(p: Phaser.Input.Pointer) {
    if (!this.drag) return;
    this.drag.sprite.setPosition(p.x, p.y);
    this.ghost.clear();
    const cell = this.cellFor(p);
    if (!cell) return;
    const ok = canPlaceModule(store.state, this.drag.moduleId, cell.x, cell.y, this.drag.rot);
    const def = moduleDef(CONTENT, this.drag.moduleId);
    this.ghost.fillStyle(ok ? 0x8cc084 : 0xc8553d, 0.35);
    for (const [cx, cy] of rotate(def.shape, this.drag.rot)) {
      this.ghost.fillRoundedRect(VAN.gridX + (cell.x + cx) * VAN.cellW + 4, VAN.gridY + (cell.y + cy) * VAN.cellH + 4, VAN.cellW - 8, VAN.cellH - 8, 10);
    }
  }

  private onDrop(p: Phaser.Input.Pointer) {
    if (!this.drag) return;
    const { moduleId, rot, sprite } = this.drag;
    const cell = this.cellFor(p);
    sprite.destroy();
    this.ghost.clear();
    this.drag = null;
    let placed = false;
    if (cell) store.update('van', (s) => { placed = placeModule(s, moduleId, cell.x, cell.y, rot); });
    if (!placed) this.refresh(); // dropped outside / blocked → it stays stored
    this.msg.setText(placed ? '' : cell ? "That spot's taken. Try another, or rotate with R." : '');
  }

  /** Debug/e2e: place a module directly (same rules as drag & drop). */
  place(moduleId: string, x: number, y: number, rot = 0): boolean {
    let ok = false;
    store.update('van', (s) => { removeModule(s, moduleId); ok = placeModule(s, moduleId, x, y, rot); });
    return ok;
  }

  // ---- actions --------------------------------------------------------------

  private craftMap() {
    const s = store.state;
    if (!isPlaced(s, 'workbench')) { this.msg.setText('Place the workbench in your van first.'); return; }
    let ok = false;
    store.update('craft', (st) => { ok = spendAction(st, 'craft').ok; });
    if (!ok) { this.msg.setText('Too tired to craft. Sleep first.'); return; }
    this.msg.setText('');
    openOverlay(this, 'MapCraft');
  }

  private openCafe() {
    const s = store.state;
    if (!isPlaced(s, 'pour_bar')) { this.msg.setText('Place the pour-over bar in your van first.'); return; }
    let r!: ReturnType<typeof startShift>;
    store.update('shift', (st) => { r = startShift(st); });
    if (!r.ok) { this.msg.setText(r.reason === 'tired' ? 'Not enough stamina for a café shift (needs 3).' : 'Nothing to sell yet.'); return; }
    this.msg.setText('');
    openOverlay(this, 'Business', { plan: r.plan });
  }

  private toggleShop() {
    this.shopOpen = !this.shopOpen;
    this.shopLayer.removeAll(true);
    if (this.shopOpen) this.renderShop();
  }

  private renderShop() {
    this.shopLayer.removeAll(true);
    const panel = paperPanel(this, 230, 150, 560, 380, PAL.paper);
    const title = label(this, 254, 166, 'Module shop', 24, PAL.ink, '900');
    this.shopLayer.add([panel, title]);
    const s = store.state;
    CONTENT.modules.filter((m) => m.price > 0).forEach((m, i) => {
      const y = 214 + i * 92;
      const icon = art(this, 300, y + 40, `mod_${m.id}`, 0.5, 0.5).setScale(0.5 * (m.shape.length > 1 ? 0.32 : 0.5));
      const t = label(this, 360, y + 6, `${m.name}  ·  ¥${m.price.toLocaleString('en-US')}`, 18, PAL.ink);
      const d = label(this, 360, y + 34, m.blurb, 15, PAL.twilight, '500').setWordWrapWidth(260);
      const owned = s.van.owned.includes(m.id);
      const b = button(this, 710, y + 34, 120, 44, owned ? 'Owned' : 'Buy', () => {
        let r!: ReturnType<typeof buyModule>;
        store.update('shop', (st) => { r = buyModule(st, m.id); });
        this.msg.setText(r.ok ? `Bought the ${m.name}. Drag it into the van.` : r.reason === 'yen' ? 'Not enough yen yet. Run the café!' : '');
      }, owned ? PAL.snow : PAL.lantern, 18);
      b.setEnabled(!owned && s.yen >= m.price);
      this.shopLayer.add([icon, t, d, b.container]);
    });
    const close = button(this, 510, 500, 180, 44, 'Close shop', () => this.toggleShop(), PAL.snow, 16);
    this.shopLayer.add(close.container);
  }

  private sleep() {
    closeOverlay(this);
    this.game.events.emit('endDay');
  }
}
