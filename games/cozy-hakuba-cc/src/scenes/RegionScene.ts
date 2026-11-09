import Phaser from 'phaser';
import { store } from '../gameStore';
import { mod, saturationFor, season } from '../sim/game';
import { currentStep, findKodama, kodamaAvailable, talk } from '../sim/quests';
import { isSnowy } from '../sim/seasons';
import type { GameState, QuestType, Vitality } from '../sim/types';
import { art, label, paperPanel } from '../ui/art';
import { openOverlay } from '../ui/widgets';
import { GROUND_BOTTOM, GROUND_TOP, PAL, WIDTH, hex } from '../theme';

export const INTERACT_RANGE = 70;
const BADGE_FOR: Record<QuestType, string> = { fetch: 'badge_fetch', create: 'badge_create', puzzle: 'badge_puzzle' };
export const VITALITY_NAMES = ['Dormant', 'Stirring', 'Awake', 'Thriving'];

export type Interactable = { id: string; x: number; y: number; visible: () => boolean; prompt: () => string; act: () => void; promptLift?: number };

/** Static layout for a walkable region. Everything region-specific beyond this lives in the subclass. */
export interface RegionLayout {
  region: string;
  keyPerson: { name: string; texture: string; at: readonly [number, number] };
  van: readonly [number, number];
  playerStart: [number, number];
  kodama: [number, number][];
  /** [x, y, scale]; trees below y=600 go in the front scenery layer. */
  trees: [number, number, number][];
  crowdLanes: [number, number, number][];
  crowd: { snowy: string[]; green: string[] };
}

/**
 * Shared base for walkable regions: walking, prompts, dialog, the key person's quest badge, kodama,
 * seasonal crowds, the parked van, and the restoration colour filter (scenery only).
 */
export abstract class RegionScene extends Phaser.Scene {
  protected abstract layout: RegionLayout;
  protected player!: Phaser.GameObjects.Image;
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'e' | 'space', Phaser.Input.Keyboard.Key>;
  private bg!: Phaser.GameObjects.Image;
  private ground!: Phaser.GameObjects.Image;
  private snowCaps: Phaser.GameObjects.Image[] = [];
  private kodama: Phaser.GameObjects.Image[] = [];
  private badge!: Phaser.GameObjects.Image;
  private crowd: Phaser.GameObjects.Image[] = [];
  private vanKit!: Phaser.GameObjects.Image;
  private vanRoof: Phaser.GameObjects.Image[] = [];
  private prompt!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private dialog!: Phaser.GameObjects.Container;
  private dialogName!: Phaser.GameObjects.Text;
  private dialogText!: Phaser.GameObjects.Text;
  protected dialogOpen = false;
  protected interactables: Interactable[] = [];
  private sceneryFilters: { colorMatrix: Phaser.Display.ColorMatrix }[] = [];
  private backLayer!: Phaser.GameObjects.Layer;
  private frontLayer!: Phaser.GameObjects.Layer;
  private sat = { value: 0 };
  private lastSeason = '';
  private lastVitality = -1;

  /** Add landmarks, items and region-specific interactables. Called during create(), before the first sync. */
  protected abstract build(): void;
  /** Region-specific state sync (item visibility etc.). */
  protected onSync(_s: GameState, _reason: string): void {}

  create() {
    // Scene objects are recreated on every start; reset per-run arrays.
    this.snowCaps = []; this.kodama = []; this.crowd = []; this.interactables = []; this.sceneryFilters = []; this.vanRoof = [];
    this.lastSeason = ''; this.lastVitality = -1; this.dialogOpen = false;
    const L = this.layout;
    const s = store.state;
    s.currentRegion = L.region;

    this.backLayer = this.add.layer().setDepth(-10_000);
    this.frontLayer = this.add.layer().setDepth(4000);
    for (const l of [this.backLayer, this.frontLayer]) { l.enableFilters(); this.sceneryFilters.push(l.filters!.internal.addColorMatrix()); }
    this.bg = this.scenery(art(this, 0, 0, 'bg_mountains_winter', 0, 0).setDisplaySize(WIDTH, 480).setDepth(-1000));
    this.ground = this.scenery(art(this, 0, 440, 'ground_winter', 0, 0).setDisplaySize(WIDTH, 300).setDepth(-900));
    for (const [x, y, sc] of L.trees) {
      const front = y > 600;
      this.scenery(art(this, x, y, 'tree_cedar').setScale(0.5 * sc).setDepth(y), front);
      this.snowCaps.push(this.scenery(art(this, x, y, 'tree_cedar_snow').setScale(0.5 * sc).setDepth(y + 0.1), front));
    }

    // Van (+ Tier 1 kit and roof modules once the garage has worked on it).
    const [vx, vy] = L.van;
    art(this, vx, vy - 40, 'van_kei').setDepth(vy - 40);
    this.vanKit = art(this, vx, vy - 40, 'van_kit_t1').setDepth(vy - 39.9).setVisible(false);

    // Key person + quest badge.
    const [kx, ky] = L.keyPerson.at;
    art(this, kx, ky, L.keyPerson.texture).setDepth(ky);
    this.badge = art(this, kx, ky - 92, 'badge_fetch').setDepth(2000);
    this.tweens.add({ targets: this.badge, y: ky - 100, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    L.kodama.forEach(([x, y], i) => {
      const k = art(this, x, y, 'kodama').setDepth(y + 1).setVisible(false);
      this.tweens.add({ targets: k, y: y - 6, duration: 1400 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.kodama.push(k);
    });

    this.player = art(this, L.playerStart[0], L.playerStart[1], 'char_aoi');

    this.interactables.push({ id: 'keyperson', x: kx, y: ky, visible: () => true, prompt: () => `E  Talk to ${L.keyPerson.name}`, act: () => this.talkKeyPerson(), promptLift: 150 });
    this.interactables.push({ id: 'van', x: vx, y: vy, visible: () => true, prompt: () => 'E  Enter your van', act: () => openOverlay(this, 'VanInterior'), promptLift: 215 });
    L.kodama.forEach(([x, y], i) => this.interactables.push({
      id: `kodama_${i}`, x, y, visible: () => this.kodamaVisible(i), prompt: () => 'E  Say hello to the kodama', act: () => this.greetKodama(i),
    }));
    this.build();

    this.prompt = this.makePrompt();
    this.dialog = this.makeDialog();

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys({ up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', w: 'W', a: 'A', s: 'S', d: 'D', e: 'E', space: 'SPACE' }) as typeof this.keys;
    this.keys.e.on('down', () => this.interact());
    this.keys.space.on('down', () => this.interact());

    this.sat.value = saturationFor(s.regions[L.region].vitality);
    this.applySaturation();

    this.scene.launch('Hud'); // config order keeps overlays (van, puzzles, café) drawn above the HUD
    const unsub = store.subscribe((st, reason) => this.sync(st, reason));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { unsub(); this.scene.stop('Hud'); });
    this.sync(s, 'init');
    this.cameras.main.fadeIn(350, 251, 250, 246);
  }

  update(_t: number, dtMs: number) {
    const dt = Math.min(dtMs, 50) / 1000;
    if (!this.dialogOpen) {
      const k = this.keys;
      const vx = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
      const vy = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
      const len = Math.hypot(vx, vy) || 1;
      const speed = 260 * mod(store.state, 'walkSpeed');
      this.player.x = Phaser.Math.Clamp(this.player.x + (vx / len) * speed * dt, 30, WIDTH - 30);
      this.player.y = Phaser.Math.Clamp(this.player.y + (vy / len) * speed * 0.7 * dt, GROUND_TOP + 60, GROUND_BOTTOM);
      if (vx !== 0) this.player.setFlipX(vx < 0);
      this.player.rotation = vx || vy ? Math.sin(this.time.now / 90) * 0.05 : 0;
    }
    this.player.setDepth(this.player.y);
    this.updatePrompt();
  }

  // ---- interactions -------------------------------------------------------

  private kodamaVisible(i: number): boolean {
    const st = store.state;
    return i < kodamaAvailable(st, this.layout.region) && !st.unlocks.includes(`kodama:${this.layout.region}:${i}`);
  }

  private nearest(): Interactable | null {
    const radius = INTERACT_RANGE * mod(store.state, 'pickupRadius');
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

  private greetKodama(i: number) {
    const k = this.kodama[i];
    store.update('kodama', (s) => findKodama(s, this.layout.region, i));
    this.tweens.killTweensOf(k);
    this.tweens.add({ targets: k, scale: 0.7, alpha: 0, y: k.y - 30, duration: 600, ease: 'Back.easeIn', onComplete: () => k.setVisible(false) });
    this.toast('A kodama giggles and vanishes into the cedars.  +1 絆');
  }

  protected talkKeyPerson() {
    let r!: ReturnType<typeof talk>;
    store.update('quest', (s) => { r = talk(s, this.layout.region); });
    this.openDialog(this.layout.keyPerson.name, r.text);
    if (r.kind === 'complete') {
      const v = store.state.regions[this.layout.region].vitality;
      this.game.events.emit('banner', `${r.step.title} complete!\n${VITALITY_NAMES[v]}  ·  +${r.kizuna} 絆`);
    }
  }

  protected toast(text: string) {
    const t = label(this, this.player.x, this.player.y - 110, text, 18, PAL.ink).setOrigin(0.5).setDepth(7000).setStroke(PAL.snow, 6);
    this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, delay: 700, duration: 700, onComplete: () => t.destroy() });
  }

  // ---- state sync ----------------------------------------------------------

  private sync(s: GameState, reason: string) {
    const region = this.layout.region;
    const info = season(s);
    const snowy = isSnowy(info.season);
    if (info.season !== this.lastSeason) {
      this.lastSeason = info.season;
      this.bg.setTexture(snowy ? 'bg_mountains_winter' : 'bg_mountains_green');
      this.ground.setTexture(snowy ? 'ground_winter' : 'ground_green');
      this.snowCaps.forEach((c) => c.setVisible(snowy));
      this.rebuildCrowd(s);
    }
    const v = s.regions[region].vitality as Vitality;
    const target = saturationFor(v);
    if (Math.abs(target - this.sat.value) > 0.001) {
      if (reason === 'init' || reason === 'debug' || reason === 'load') { this.sat.value = target; this.applySaturation(); }
      else this.tweens.add({ targets: this.sat, value: target, duration: 1800, ease: 'Sine.easeInOut', onUpdate: () => this.applySaturation() });
      if (v > this.lastVitality && this.lastVitality >= 0 && reason === 'quest') this.cameras.main.flash(500, 255, 240, 200);
    }
    if (v !== this.lastVitality) { this.lastVitality = v; this.rebuildCrowd(s); }

    const step = currentStep(s, region);
    this.badge.setVisible(!!step);
    if (step) this.badge.setTexture(BADGE_FOR[step.type]);
    this.kodama.forEach((k, i) => { if (this.kodamaVisible(i)) { if (!k.visible) k.setVisible(true).setAlpha(1).setScale(0.5); } else if (reason !== 'kodama') k.setVisible(false); });
    this.syncVan(s);
    this.onSync(s, reason);
  }

  private syncVan(s: GameState) {
    this.vanKit.setVisible(s.chassisTier >= 1);
    this.vanRoof.forEach((r) => r.destroy());
    this.vanRoof = s.van.roof.map((id, i) => art(this, this.layout.van[0] - 36 + i * 70, this.layout.van[1] - 40 - 128, `mod_${id}`).setScale(0.22).setDepth(this.layout.van[1] - 39));
  }

  /** A few wandering visitors: none when Dormant, more as the region wakes; skiers in winter, hikers in green. */
  private rebuildCrowd(s: GameState) {
    this.crowd.forEach((c) => { this.tweens.killTweensOf(c); c.destroy(); });
    this.crowd = [];
    const v = s.regions[this.layout.region].vitality;
    const snowy = isSnowy(season(s).season);
    const n = Math.min([0, 1, 3, 5][v], this.layout.crowdLanes.length);
    const types = snowy ? this.layout.crowd.snowy : this.layout.crowd.green;
    for (let i = 0; i < n; i++) {
      const [x0, x1, y] = this.layout.crowdLanes[i];
      const c = art(this, x0, y, types[i % types.length]).setDepth(y).setAlpha(0.95);
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

  /** Put an object in a colour-filtered scenery layer (it greys out while the region is dormant). */
  protected scenery<T extends Phaser.GameObjects.Image>(obj: T, front = false): T {
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

  protected openDialog(who: string, text: string) {
    this.dialogName.setText(who);
    this.dialogText.setText(text);
    this.dialog.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.dialog, alpha: 1, y: { from: 566, to: 548 }, duration: 180 });
    this.dialogOpen = true;
  }

  protected closeDialog() {
    this.dialog.setVisible(false);
    this.dialogOpen = false;
  }

  /** Debug-only: teleport the player. */
  warp(x: number, y: number) { this.player.setPosition(x, y); }
}
