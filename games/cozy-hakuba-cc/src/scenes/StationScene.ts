import Phaser from 'phaser';
import { store } from '../gameStore';
import { grant, saturationFor, season, setVitality } from '../sim/game';
import { isSnowy } from '../sim/seasons';
import type { GameState, Vitality } from '../sim/types';
import { art, label, paperPanel } from '../ui/art';
import { GROUND_BOTTOM, GROUND_TOP, PAL, WIDTH, hex } from '../theme';

const BROCHURE_SPOTS: [number, number][] = [[150, 560], [380, 660], [700, 690], [880, 630], [1180, 560]];
const BROCHURE_GOAL = BROCHURE_SPOTS.length;
const INTERACT_RANGE = 70;

type Interactable = { id: string; x: number; y: number; prompt: () => string; act: () => void };

/**
 * M0 sandbox of region 1 (JR Hakuba Station). Proves: seasonal art swap, depth-sorted walking,
 * interaction prompts, a mini fetch loop, and the dormant -> stirring restoration filter.
 */
export class StationScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'e', Phaser.Input.Keyboard.Key>;
  private bg!: Phaser.GameObjects.Image;
  private ground!: Phaser.GameObjects.Image;
  private snowCaps: Phaser.GameObjects.Image[] = [];
  private brochures: Phaser.GameObjects.Image[] = [];
  private badge!: Phaser.GameObjects.Image;
  private kodama!: Phaser.GameObjects.Image;
  private prompt!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private dialog!: Phaser.GameObjects.Container;
  private dialogText!: Phaser.GameObjects.Text;
  private dialogOpen = false;
  private interactables: Interactable[] = [];
  /** Scenery-only color filters. Interactive things (player, people, items, badges) stay in full color so they read clearly. */
  private sceneryFilters: { colorMatrix: Phaser.Display.ColorMatrix }[] = [];
  /** Scenery behind every actor (sky, ground, station, back trees). */
  private backLayer!: Phaser.GameObjects.Layer;
  /** Scenery always drawn in front of actors (foreground trees at the screen edges). */
  private frontLayer!: Phaser.GameObjects.Layer;
  private sat = { value: 0 };
  private unsub?: () => void;
  private lastSeason = '';

  constructor() { super('Station'); }

  create() {
    const s = store.state;
    this.backLayer = this.add.layer().setDepth(-10_000);
    this.frontLayer = this.add.layer().setDepth(4000);
    for (const l of [this.backLayer, this.frontLayer]) { l.enableFilters(); this.sceneryFilters.push(l.filters!.internal.addColorMatrix()); }
    this.bg = this.scenery(art(this, 0, 0, 'bg_mountains_winter', 0, 0).setDisplaySize(WIDTH, 480).setDepth(-1000));
    this.ground = this.scenery(art(this, 0, 440, 'ground_winter', 0, 0).setDisplaySize(WIDTH, 300).setDepth(-900));

    // Landmark + decor (depth = feet y, so things sort naturally).
    this.scenery(art(this, 470, 520, 'bldg_station').setDepth(520));
    for (const [x, y, sc] of [[70, 500, 1.15], [180, 488, 0.85], [800, 494, 0.95], [1230, 505, 1.2], [40, 690, 1.1], [1250, 700, 1.0]] as const) {
      const front = y > 600;
      this.scenery(art(this, x, y, 'tree_cedar').setScale(0.5 * sc).setDepth(y), front);
      this.snowCaps.push(this.scenery(art(this, x, y, 'tree_cedar_snow').setScale(0.5 * sc).setDepth(y + 0.1), front));
    }

    // Parked van = home + business + sleep.
    const van = art(this, 1010, 600, 'van_kei').setDepth(600);
    label(this, 1010, 606, 'your van', 14, PAL.ink, '500').setOrigin(0.5, 0).setDepth(601).setAlpha(0.7);
    this.interactables.push({ id: 'van', x: van.x, y: 640, prompt: () => 'E  Sleep in the van (end day)', act: () => this.sleep() });

    // Key person with a quest badge.
    const kx = 610, ky = 545;
    art(this, kx, ky, 'char_kobayashi').setDepth(ky);
    this.badge = art(this, kx, ky - 92, 'badge_fetch').setDepth(2000);
    this.tweens.add({ targets: this.badge, y: ky - 100, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.interactables.push({ id: 'kobayashi', x: kx, y: ky, prompt: () => 'E  Talk to Mrs. Kobayashi', act: () => this.talkKobayashi() });

    // Fetch items.
    BROCHURE_SPOTS.forEach(([x, y], i) => {
      const b = art(this, x, y, 'item_brochure').setDepth(y);
      this.tweens.add({ targets: b, y: y - 6, duration: 900 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.brochures.push(b);
      this.interactables.push({ id: `brochure_${i}`, x, y, prompt: () => 'E  Pick up brochure', act: () => this.pickBrochure(i) });
    });

    // Kodama: hidden until the station is Stirring.
    this.kodama = art(this, 92, 512, 'kodama').setDepth(513).setAlpha(0);
    this.tweens.add({ targets: this.kodama, y: 506, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.player = art(this, 760, 640, 'char_aoi');

    this.prompt = this.makePrompt();
    this.dialog = this.makeDialog();

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys({ up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT', w: 'W', a: 'A', s: 'S', d: 'D', e: 'E' }) as typeof this.keys;
    this.keys.e.on('down', () => this.interact());

    // Restoration filter: scenery saturation driven by region vitality.
    this.sat.value = saturationFor(s.regions.station.vitality);
    this.applySaturation();

    this.scene.launch('Hud');
    this.unsub = store.subscribe((st, reason) => this.sync(st, reason));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.unsub?.());
    this.sync(s, 'init');
    this.cameras.main.fadeIn(350, 251, 250, 246);
  }

  update(_t: number, dtMs: number) {
    const dt = dtMs / 1000;
    if (!this.dialogOpen) {
      const k = this.keys;
      const vx = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0);
      const vy = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0);
      const len = Math.hypot(vx, vy) || 1;
      const speed = 260 * (store.state.player.personality === 'outdoorsy' ? 1.15 : 1);
      this.player.x = Phaser.Math.Clamp(this.player.x + (vx / len) * speed * dt, 30, WIDTH - 30);
      this.player.y = Phaser.Math.Clamp(this.player.y + (vy / len) * speed * 0.7 * dt, GROUND_TOP + 60, GROUND_BOTTOM);
      if (vx !== 0) this.player.setFlipX(vx < 0);
      // Small walking bob for feel.
      this.player.rotation = vx || vy ? Math.sin(this.time.now / 90) * 0.05 : 0;
    }
    this.player.setDepth(this.player.y);
    this.updatePrompt();
  }

  // ---- interactions -------------------------------------------------------

  private nearest(): Interactable | null {
    let best: Interactable | null = null;
    let bestD = INTERACT_RANGE;
    for (const it of this.interactables) {
      if (it.id.startsWith('brochure_') && !this.brochures[Number(it.id.split('_')[1])].visible) continue;
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
    if (!b.visible) return;
    this.tweens.killTweensOf(b);
    this.tweens.add({ targets: b, y: b.y - 40, alpha: 0, scale: 0.7, duration: 280, onComplete: () => b.setVisible(false) });
    store.update('pickup', (s) => grant(s, 'brochure', 1));
  }

  private talkKobayashi() {
    const s = store.state;
    const have = s.inventory.brochure ?? 0;
    const v = s.regions.station.vitality;
    if (v >= 1) {
      this.openDialog('Mrs. Kobayashi', 'Look at that — people are actually reading the map! The station feels awake again. Next, the luggage room… but that can wait for another day.');
    } else if (have >= BROCHURE_GOAL) {
      store.update('quest', (st) => { st.inventory.brochure = 0; grant(st, 'kizuna', 3); setVitality(st, 'station', 1); st.log.push('Station is Stirring.'); });
      this.openDialog('Mrs. Kobayashi', `All ${BROCHURE_GOAL} brochures! Thank you, ${s.player.name}. Visitors will finally know where to go.  (+3 絆 Kizuna)`);
    } else {
      this.openDialog('Mrs. Kobayashi', `Oh! A new face. The wind scattered our valley brochures all over the plaza… Could you find them? (${have}/${BROCHURE_GOAL})`);
    }
  }

  private sleep() {
    this.cameras.main.fadeOut(400, 30, 32, 52);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.game.events.emit('endDay');
      this.cameras.main.fadeIn(500, 30, 32, 52);
    });
  }

  // ---- state sync ----------------------------------------------------------

  private sync(s: GameState, reason: string) {
    const info = season(s);
    if (info.season !== this.lastSeason) {
      this.lastSeason = info.season;
      const snowy = isSnowy(info.season);
      this.bg.setTexture(snowy ? 'bg_mountains_winter' : 'bg_mountains_green');
      this.ground.setTexture(snowy ? 'ground_winter' : 'ground_green');
      this.snowCaps.forEach((c) => c.setVisible(snowy));
    }
    const v = s.regions.station.vitality as Vitality;
    const target = saturationFor(v);
    if (Math.abs(target - this.sat.value) > 0.001) {
      if (reason === 'init' || reason === 'debug') { this.sat.value = target; this.applySaturation(); }
      else this.tweens.add({ targets: this.sat, value: target, duration: 1800, ease: 'Sine.easeInOut', onUpdate: () => this.applySaturation() });
      if (v >= 1 && reason !== 'init') this.cameras.main.flash(500, 255, 240, 200);
    }
    this.kodama.setAlpha(v >= 1 ? 1 : 0);
    const badgeTex = v >= 1 ? 'badge_puzzle' : 'badge_fetch';
    this.badge.setTexture(badgeTex);
    if (reason === 'debug' && v === 0) this.brochures.forEach((b) => b.setVisible(true).setAlpha(1).setScale(0.5));
  }

  private applySaturation() {
    // ColorMatrix.saturate: 0 = unchanged, -1 = greyscale. Also a slight cool dim when dormant.
    for (const f of this.sceneryFilters) {
      const m = f.colorMatrix;
      m.reset();
      m.saturate(this.sat.value - 1);
      m.brightness(0.9 + 0.1 * this.sat.value, true);
    }
  }

  /** Move a scenery object into a filtered layer (sorted by its own depth inside the layer). */
  private scenery<T extends Phaser.GameObjects.Image>(obj: T, front = false): T {
    (front ? this.frontLayer : this.backLayer).add(obj);
    return obj;
  }

  // ---- UI widgets ----------------------------------------------------------

  private makePrompt() {
    const panel = paperPanel(this, -150, -22, 300, 44, PAL.snow);
    this.promptText = label(this, 0, 0, '', 18).setOrigin(0.5);
    return this.add.container(0, 0, [panel, this.promptText]).setDepth(5000).setVisible(false);
  }

  private updatePrompt() {
    const n = this.dialogOpen ? null : this.nearest();
    this.prompt.setVisible(!!n);
    if (n) {
      this.promptText.setText(n.prompt());
      this.prompt.setPosition(Phaser.Math.Clamp(n.x, 160, WIDTH - 160), n.y - (n.id === 'van' ? 215 : n.id === 'kobayashi' ? 150 : 60));
    }
  }

  private makeDialog() {
    const panel = paperPanel(this, 0, 0, 880, 150, PAL.paper);
    const name = label(this, 28, 18, '', 22, PAL.noren).setName('name');
    this.dialogText = label(this, 28, 54, '', 20, PAL.ink, '500').setWordWrapWidth(810).setLineSpacing(6);
    const hint = label(this, 852, 128, 'E ▸', 16, PAL.twilight).setOrigin(1, 1);
    const tab = this.add.rectangle(0, 0, 12, 150, hex(PAL.noren)).setOrigin(0);
    return this.add.container(370, 548, [panel, tab, name, this.dialogText, hint]).setDepth(6000).setVisible(false);
  }

  private openDialog(who: string, text: string) {
    (this.dialog.getByName('name') as Phaser.GameObjects.Text).setText(who);
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
