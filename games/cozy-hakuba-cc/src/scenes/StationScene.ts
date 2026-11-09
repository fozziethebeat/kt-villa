import Phaser from 'phaser';
import { store } from '../gameStore';
import { addUnlock, grant, saturationFor, season, spendAction } from '../sim/game';
import { currentStep, findKodama, kodamaAvailable, talk } from '../sim/quests';
import { isSnowy } from '../sim/seasons';
import type { GameState, QuestType, Vitality } from '../sim/types';
import { art, label, paperPanel } from '../ui/art';
import { openOverlay } from '../ui/widgets';
import { GROUND_BOTTOM, GROUND_TOP, PAL, WIDTH, hex } from '../theme';

export const BROCHURE_SPOTS: [number, number][] = [[150, 560], [380, 660], [700, 690], [880, 630], [1180, 560]];
export const KODAMA_SPOTS: [number, number][] = [[92, 512], [846, 500], [1196, 690]];
export const SPOTS = { kobayashi: [610, 545], van: [1010, 640], luggageDoor: [372, 528], board: [250, 560] } as const;
const INTERACT_RANGE = 70;
const BADGE_FOR: Record<QuestType, string> = { fetch: 'badge_fetch', create: 'badge_create', puzzle: 'badge_puzzle' };
const VITALITY_NAMES = ['Dormant', 'Stirring', 'Awake', 'Thriving'];

type Interactable = { id: string; x: number; y: number; visible: () => boolean; prompt: () => string; act: () => void; promptLift?: number };

/**
 * Region 1: JR Hakuba Station. Full M1 arc: brochures (fetch) → valley map (create, at the van workbench)
 * → lost-luggage room (grid-packing puzzle). Restoration is shown by scenery saturation, crowds and lanterns.
 */
export class StationScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'e' | 'space', Phaser.Input.Keyboard.Key>;
  private bg!: Phaser.GameObjects.Image;
  private ground!: Phaser.GameObjects.Image;
  private snowCaps: Phaser.GameObjects.Image[] = [];
  private brochures: Phaser.GameObjects.Image[] = [];
  private kodama: Phaser.GameObjects.Image[] = [];
  private badge!: Phaser.GameObjects.Image;
  private door!: Phaser.GameObjects.Image;
  private board!: Phaser.GameObjects.Image;
  private lanterns!: Phaser.GameObjects.Image;
  private crowd: Phaser.GameObjects.Image[] = [];
  private prompt!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private dialog!: Phaser.GameObjects.Container;
  private dialogName!: Phaser.GameObjects.Text;
  private dialogText!: Phaser.GameObjects.Text;
  private dialogOpen = false;
  private interactables: Interactable[] = [];
  /** Scenery-only color filters. Interactive things (player, people, items, badges) stay in full color so they read clearly. */
  private sceneryFilters: { colorMatrix: Phaser.Display.ColorMatrix }[] = [];
  private backLayer!: Phaser.GameObjects.Layer;
  private frontLayer!: Phaser.GameObjects.Layer;
  private sat = { value: 0 };
  private lastSeason = '';
  private lastVitality = -1;

  constructor() { super('Station'); }

  create() {
    // Scene objects are recreated on every start; reset per-run arrays.
    this.snowCaps = []; this.brochures = []; this.kodama = []; this.crowd = []; this.interactables = []; this.sceneryFilters = [];
    this.lastSeason = ''; this.lastVitality = -1; this.dialogOpen = false;
    const s = store.state;
    s.currentRegion = 'station';

    this.backLayer = this.add.layer().setDepth(-10_000);
    this.frontLayer = this.add.layer().setDepth(4000);
    for (const l of [this.backLayer, this.frontLayer]) { l.enableFilters(); this.sceneryFilters.push(l.filters!.internal.addColorMatrix()); }
    this.bg = this.scenery(art(this, 0, 0, 'bg_mountains_winter', 0, 0).setDisplaySize(WIDTH, 480).setDepth(-1000));
    this.ground = this.scenery(art(this, 0, 440, 'ground_winter', 0, 0).setDisplaySize(WIDTH, 300).setDepth(-900));
    this.scenery(art(this, 470, 520, 'bldg_station').setDepth(520));
    for (const [x, y, sc] of [[70, 500, 1.15], [180, 488, 0.85], [800, 494, 0.95], [1230, 505, 1.2], [40, 690, 1.1], [1250, 700, 1.0]] as const) {
      const front = y > 600;
      this.scenery(art(this, x, y, 'tree_cedar').setScale(0.5 * sc).setDepth(y), front);
      this.snowCaps.push(this.scenery(art(this, x, y, 'tree_cedar_snow').setScale(0.5 * sc).setDepth(y + 0.1), front));
    }
    // Lanterns hang across the station front once Thriving (kept in color: they *are* the celebration).
    this.lanterns = art(this, 470, 300, 'deco_lanterns', 0.5, 0).setScale(0.62).setDepth(530).setVisible(false);

    // Lost-luggage door, Revival Board.
    this.door = art(this, SPOTS.luggageDoor[0], SPOTS.luggageDoor[1] - 2, 'deco_luggage_door').setScale(0.42).setDepth(521);
    this.board = art(this, SPOTS.board[0], SPOTS.board[1], 'deco_board').setScale(0.55).setDepth(SPOTS.board[1]);

    // Van.
    art(this, 1010, 600, 'van_kei').setDepth(600);

    // Key person + quest badge.
    const [kx, ky] = SPOTS.kobayashi;
    art(this, kx, ky, 'char_kobayashi').setDepth(ky);
    this.badge = art(this, kx, ky - 92, 'badge_fetch').setDepth(2000);
    this.tweens.add({ targets: this.badge, y: ky - 100, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Brochures (fetch step).
    BROCHURE_SPOTS.forEach(([x, y], i) => {
      const b = art(this, x, y, 'item_brochure').setDepth(y);
      this.tweens.add({ targets: b, y: y - 6, duration: 900 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.brochures.push(b);
    });

    // Kodama: one per vitality level.
    KODAMA_SPOTS.forEach(([x, y], i) => {
      const k = art(this, x, y, 'kodama').setDepth(y + 1).setVisible(false);
      this.tweens.add({ targets: k, y: y - 6, duration: 1400 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.kodama.push(k);
    });

    this.player = art(this, 760, 640, 'char_aoi');
    this.registerInteractables();

    this.prompt = this.makePrompt();
    this.dialog = this.makeDialog();

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys({ up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', w: 'W', a: 'A', s: 'S', d: 'D', e: 'E', space: 'SPACE' }) as typeof this.keys;
    this.keys.e.on('down', () => this.interact());
    this.keys.space.on('down', () => this.interact());

    this.sat.value = saturationFor(s.regions.station.vitality);
    this.applySaturation();

    this.scene.launch('Hud'); // config order keeps overlays (van, puzzles, café) drawn above the HUD
    const unsub = store.subscribe((st, reason) => this.sync(st, reason));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { unsub(); this.scene.stop('Hud'); });
    this.sync(s, 'init');
    this.cameras.main.fadeIn(350, 251, 250, 246);
  }

  private registerInteractables() {
    const s = () => store.state;
    const step = () => currentStep(s(), 'station');
    const [kx, ky] = SPOTS.kobayashi;
    this.interactables.push({ id: 'kobayashi', x: kx, y: ky, visible: () => true, prompt: () => 'E  Talk to Mrs. Kobayashi', act: () => this.talkKobayashi(), promptLift: 150 });
    this.interactables.push({ id: 'van', x: SPOTS.van[0], y: SPOTS.van[1], visible: () => true, prompt: () => 'E  Enter your van', act: () => this.enterVan(), promptLift: 215 });
    this.interactables.push({
      id: 'luggage', x: SPOTS.luggageDoor[0], y: SPOTS.luggageDoor[1] + 20, visible: () => step()?.id === 'luggage',
      prompt: () => 'E  Sort the lost-luggage room  (1 stamina)', act: () => this.enterLuggage(), promptLift: 110,
    });
    this.interactables.push({
      id: 'board', x: SPOTS.board[0], y: SPOTS.board[1], visible: () => s().unlocks.includes('revival_board'),
      prompt: () => 'E  Valley Revival Board', act: () => openOverlay(this, 'Board'), promptLift: 100,
    });
    BROCHURE_SPOTS.forEach(([x, y], i) => this.interactables.push({
      id: `brochure_${i}`, x, y, visible: () => this.brochureAvailable(i), prompt: () => 'E  Pick up brochure', act: () => this.pickBrochure(i),
    }));
    KODAMA_SPOTS.forEach(([x, y], i) => this.interactables.push({
      id: `kodama_${i}`, x, y, visible: () => this.kodamaVisible(i), prompt: () => 'E  Say hello to the kodama', act: () => this.greetKodama(i),
    }));
  }

  update(_t: number, dtMs: number) {
    const dt = Math.min(dtMs, 50) / 1000;
    if (!this.dialogOpen) {
      const k = this.keys;
      const vx = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
      const vy = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
      const len = Math.hypot(vx, vy) || 1;
      const speed = 260 * (store.state.player.personality === 'outdoorsy' ? 1.15 : 1);
      this.player.x = Phaser.Math.Clamp(this.player.x + (vx / len) * speed * dt, 30, WIDTH - 30);
      this.player.y = Phaser.Math.Clamp(this.player.y + (vy / len) * speed * 0.7 * dt, GROUND_TOP + 60, GROUND_BOTTOM);
      if (vx !== 0) this.player.setFlipX(vx < 0);
      this.player.rotation = vx || vy ? Math.sin(this.time.now / 90) * 0.05 : 0;
    }
    this.player.setDepth(this.player.y);
    this.updatePrompt();
  }

  // ---- interactions -------------------------------------------------------

  private brochureAvailable(i: number): boolean {
    const st = store.state;
    return st.regions.station.questStep === 0 && !st.unlocks.includes(`brochure:${i}`);
  }

  private kodamaVisible(i: number): boolean {
    const st = store.state;
    return i < kodamaAvailable(st, 'station') && !st.unlocks.includes(`kodama:station:${i}`);
  }

  private nearest(): Interactable | null {
    const radius = INTERACT_RANGE * (store.state.player.personality === 'outdoorsy' ? 1.25 : 1);
    let best: Interactable | null = null;
    let bestD = radius;
    for (const it of this.interactables) {
      if (!it.visible()) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, it.x, it.y);
      if (d < bestD) { bestD = d; best = it; }
    }
    return best;
  }

  private interact() {
    if (this.dialogOpen) { this.closeDialog(); return; }
    this.nearest()?.act();
  }

  private pickBrochure(i: number) {
    const b = this.brochures[i];
    this.tweens.killTweensOf(b);
    this.tweens.add({ targets: b, y: b.y - 40, alpha: 0, duration: 280, onComplete: () => b.setVisible(false) });
    store.update('pickup', (s) => { addUnlock(s, `brochure:${i}`); grant(s, 'brochure', 1); });
    this.toast(`Brochure ${store.state.inventory.brochure ?? 0}/5`);
  }

  private greetKodama(i: number) {
    const k = this.kodama[i];
    store.update('kodama', (s) => findKodama(s, 'station', i));
    this.tweens.killTweensOf(k);
    this.tweens.add({ targets: k, scale: 0.7, alpha: 0, y: k.y - 30, duration: 600, ease: 'Back.easeIn', onComplete: () => k.setVisible(false) });
    this.toast('A kodama giggles and vanishes into the cedars.  +1 絆');
  }

  private talkKobayashi() {
    let r!: ReturnType<typeof talk>;
    store.update('quest', (s) => { r = talk(s, 'station'); });
    this.openDialog('Mrs. Kobayashi', r.text);
    if (r.kind === 'complete') {
      const v = store.state.regions.station.vitality;
      this.game.events.emit('banner', `${r.step.title} complete!\nStation is ${VITALITY_NAMES[v]}  ·  +${r.kizuna} 絆`);
    }
  }

  private enterVan() {
    openOverlay(this, 'VanInterior');
  }

  private enterLuggage() {
    let ok = false;
    store.update('minigame', (s) => { ok = spendAction(s, 'miniGame').ok; });
    if (!ok) { this.openDialog(store.state.player.name, "I'm too tired to sort luggage today. Time to sleep in the van."); return; }
    openOverlay(this, 'Luggage');
  }

  private toast(text: string) {
    const t = label(this, this.player.x, this.player.y - 110, text, 18, PAL.ink).setOrigin(0.5).setDepth(7000).setStroke(PAL.snow, 6);
    this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, delay: 700, duration: 700, onComplete: () => t.destroy() });
  }

  // ---- state sync ----------------------------------------------------------

  private sync(s: GameState, reason: string) {
    const info = season(s);
    const snowy = isSnowy(info.season);
    if (info.season !== this.lastSeason) {
      this.lastSeason = info.season;
      this.bg.setTexture(snowy ? 'bg_mountains_winter' : 'bg_mountains_green');
      this.ground.setTexture(snowy ? 'ground_winter' : 'ground_green');
      this.snowCaps.forEach((c) => c.setVisible(snowy));
      this.rebuildCrowd(s);
    }
    const v = s.regions.station.vitality as Vitality;
    const target = saturationFor(v);
    if (Math.abs(target - this.sat.value) > 0.001) {
      if (reason === 'init' || reason === 'debug' || reason === 'load') { this.sat.value = target; this.applySaturation(); }
      else this.tweens.add({ targets: this.sat, value: target, duration: 1800, ease: 'Sine.easeInOut', onUpdate: () => this.applySaturation() });
      if (v > this.lastVitality && this.lastVitality >= 0 && reason === 'quest') this.cameras.main.flash(500, 255, 240, 200);
    }
    if (v !== this.lastVitality) { this.lastVitality = v; this.rebuildCrowd(s); }
    this.lanterns.setVisible(v >= 3);

    const step = currentStep(s, 'station');
    this.badge.setVisible(!!step);
    if (step) this.badge.setTexture(BADGE_FOR[step.type]);
    this.brochures.forEach((b, i) => { if (!this.brochureAvailable(i)) b.setVisible(false); else if (reason === 'debug' || reason === 'init' || reason === 'load') b.setVisible(true).setAlpha(1); });
    this.kodama.forEach((k, i) => { if (this.kodamaVisible(i)) { if (!k.visible) k.setVisible(true).setAlpha(1).setScale(0.5); } else if (reason !== 'kodama') k.setVisible(false); });
    this.door.setAlpha(step?.id === 'luggage' ? 1 : 0.0);
    this.board.setVisible(s.unlocks.includes('revival_board'));
  }

  /** A few wandering visitors: none when Dormant, more as the station wakes; skiers in winter, hikers in green. */
  private rebuildCrowd(s: GameState) {
    this.crowd.forEach((c) => { this.tweens.killTweensOf(c); c.destroy(); });
    this.crowd = [];
    const v = s.regions.station.vitality;
    const snowy = isSnowy(season(s).season);
    const n = [0, 1, 3, 5][v];
    const types = snowy ? ['char_skier', 'char_tourist', 'char_skier', 'char_local', 'char_tourist'] : ['char_hiker', 'char_tourist', 'char_hiker', 'char_local', 'char_hiker'];
    const lanes: [number, number, number][] = [[200, 600, 520], [560, 980, 690], [660, 860, 505], [400, 640, 700], [640, 900, 580]];
    for (let i = 0; i < n; i++) {
      const [x0, x1, y] = lanes[i];
      const c = art(this, x0, y, types[i]).setDepth(y).setAlpha(0.95);
      this.tweens.add({ targets: c, x: x1, duration: 6000 + i * 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 400, onYoyo: () => c.setFlipX(true), onRepeat: () => c.setFlipX(false) });
      this.crowd.push(c);
    }
  }

  private applySaturation() {
    for (const f of this.sceneryFilters) {
      const m = f.colorMatrix;
      m.reset();
      m.saturate(this.sat.value - 1);
      m.brightness(0.9 + 0.1 * this.sat.value, true);
    }
  }

  private scenery<T extends Phaser.GameObjects.Image>(obj: T, front = false): T {
    (front ? this.frontLayer : this.backLayer).add(obj);
    return obj;
  }

  // ---- UI widgets ----------------------------------------------------------

  private makePrompt() {
    const panel = paperPanel(this, -170, -22, 340, 44, PAL.snow);
    this.promptText = label(this, 0, 0, '', 18).setOrigin(0.5);
    return this.add.container(0, 0, [panel, this.promptText]).setDepth(5000).setVisible(false);
  }

  private updatePrompt() {
    const n = this.dialogOpen ? null : this.nearest();
    this.prompt.setVisible(!!n);
    if (n) {
      this.promptText.setText(n.prompt());
      this.prompt.setPosition(Phaser.Math.Clamp(n.x, 180, WIDTH - 180), n.y - (n.promptLift ?? 60));
    }
  }

  private makeDialog() {
    const panel = paperPanel(this, 0, 0, 880, 150, PAL.paper);
    this.dialogName = label(this, 28, 18, '', 22, PAL.noren);
    this.dialogText = label(this, 28, 54, '', 20, PAL.ink, '500').setWordWrapWidth(810).setLineSpacing(6);
    const hint = label(this, 852, 128, 'E ▸', 16, PAL.twilight).setOrigin(1, 1);
    const tab = this.add.rectangle(0, 0, 12, 150, hex(PAL.noren)).setOrigin(0);
    return this.add.container(370, 548, [panel, tab, this.dialogName, this.dialogText, hint]).setDepth(6000).setVisible(false);
  }

  private openDialog(who: string, text: string) {
    this.dialogName.setText(who);
    this.dialogText.setText(text);
    this.dialog.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.dialog, alpha: 1, y: { from: 566, to: 548 }, duration: 180 });
    this.dialogOpen = true;
  }

  private closeDialog() {
    this.dialog.setVisible(false);
    this.dialogOpen = false;
  }

  /** Debug-only: teleport the player. */
  warp(x: number, y: number) { this.player.setPosition(x, y); }
}
