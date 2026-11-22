import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT, regionDef } from '../sim/content';
import { endDay, phase, season, staminaLeft } from '../sim/game';
import type { GameState } from '../sim/types';
import { art, label, paperGrain, paperPanel } from '../ui/art';
import { PAL, WIDTH, hex } from '../theme';
import { saveGame } from '../persist';
import { openOverlay } from '../ui/widgets';
import { REGION_SCENES } from './regions';
import { rankDef } from '../sim/progression';
import { audio, sfx } from '../audio';

const VITALITY_NAMES = ['Dormant', 'Stirring', 'Awake', 'Thriving'];
const PHASE_GLYPH: Record<string, string> = { morning: '☀', afternoon: '◐', evening: '☾', night: '★' };

/** Overlay scene: never affected by the world's restoration color filter. */
export class HudScene extends Phaser.Scene {
  private dayText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private pips: Phaser.GameObjects.Image[] = [];
  private yenText!: Phaser.GameObjects.Text;
  private kizunaText!: Phaser.GameObjects.Text;
  private bagText!: Phaser.GameObjects.Text;
  private regionText!: Phaser.GameObjects.Text;
  private vitalityDots: Phaser.GameObjects.Arc[] = [];
  private vitalityText!: Phaser.GameObjects.Text;
  private banner!: Phaser.GameObjects.Container;
  private bannerText!: Phaser.GameObjects.Text;
  private unsub?: () => void;

  constructor() { super('Hud'); }

  create() {
    // Calendar card
    paperPanel(this, 16, 14, 330, 92);
    this.dayText = label(this, 34, 24, '', 24);
    this.phaseText = label(this, 34, 58, '', 18, PAL.twilight, '500');
    const maxPips = CONTENT.tuning.baseStamina + CONTENT.business.comfortStaminaCap;
    this.pips = [];
    for (let i = 0; i < maxPips; i++) this.pips.push(art(this, 188 + (i % 8) * 19, 64 + Math.floor(i / 8) * 22, 'icon_stamina', 0.5, 0.5).setScale(0.33));

    // Wallet card
    paperPanel(this, WIDTH - 236, 14, 220, 92);
    this.yenText = label(this, WIDTH - 218, 24, '', 24);
    this.kizunaText = label(this, WIDTH - 218, 58, '', 20, PAL.noren);
    this.bagText = label(this, WIDTH - 26, 112, '', 15, PAL.ink, '700').setOrigin(1, 0).setStroke(PAL.snow, 5);

    // Sound toggle (also the M key) and the pause menu (Esc).
    paperPanel(this, WIDTH - 300, 14, 52, 44, PAL.snow);
    const mute = label(this, WIDTH - 274, 36, audio.settings.muted ? '🔇' : '♪', 22, PAL.ink, '900').setOrigin(0.5);
    const toggle = () => { mute.setText(audio.toggleMute() ? '🔇' : '♪'); };
    this.add.zone(WIDTH - 300, 14, 52, 44).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', toggle);
    paperPanel(this, WIDTH - 300, 62, 52, 44, PAL.snow);
    label(this, WIDTH - 274, 84, '☰', 22, PAL.ink, '900').setOrigin(0.5);
    this.add.zone(WIDTH - 300, 62, 52, 44).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.openPause());
    this.input.keyboard!.on('keydown-M', toggle);

    // Region card (bottom-left)
    paperPanel(this, 16, 640, 400, 66);
    this.regionText = label(this, 34, 650, '', 20);
    this.vitalityText = label(this, 34, 678, '', 15, PAL.cedar, '500');
    this.vitalityDots = [];
    for (let i = 0; i < 4; i++) this.vitalityDots.push(this.add.circle(320 + i * 22, 662, 8, hex(PAL.snowShadow)).setStrokeStyle(2, hex(PAL.ink)));

    // Day / season banner
    const bp = paperPanel(this, -260, -46, 520, 92, PAL.snow);
    this.bannerText = label(this, 0, 0, '', 30).setOrigin(0.5).setAlign('center');
    this.banner = this.add.container(WIDTH / 2, 220, [bp, this.bannerText]).setAlpha(0).setDepth(9000);

    paperGrain(this);

    this.game.events.on('endDay', this.onEndDay, this);
    this.game.events.on('banner', this.showBanner, this);
    this.unsub = store.subscribe((s) => this.refresh(s));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.unsub?.(); this.game.events.off('endDay', this.onEndDay, this); this.game.events.off('banner', this.showBanner, this); });
    this.refresh(store.state);
    this.showBanner(`Day ${store.state.day} · ${season(store.state).label}`);
  }

  private onEndDay() {
    let r!: ReturnType<typeof endDay>;
    store.update('endDay', (s) => { r = endDay(s); });
    const s = store.state;
    const saved = saveGame(s);
    sfx(r.newSeason ? 'season' : 'sleep');
    this.showBanner(r.newSeason ? `${r.newSeason.label} begins\nDay ${s.day}` : `Good morning · Day ${s.day}${saved ? '  ·  saved' : ''}`);
    if (r.report) {
      const report = r.report;
      // Open the report over the region once the van overlay has closed.
      this.time.delayedCall(900, () => {
        const region = this.scene.get(REGION_SCENES[s.currentRegion]);
        const ending = r.ending;
        if (region?.sys.isActive()) openOverlay(region, 'SeasonReport', { report }, () => { if (ending) openOverlay(region, 'Festival'); });
      });
    }
  }

  /** Esc / ☰: pause menu over the current region (save, load, settings, title). */
  openPause() {
    const region = this.scene.get(REGION_SCENES[store.state.currentRegion]);
    if (region?.sys.isActive()) openOverlay(region, 'Pause');
  }

  showBanner(text: string) {
    this.bannerText.setText(text);
    this.tweens.killTweensOf(this.banner);
    this.banner.setAlpha(0).setY(200);
    this.tweens.chain({ targets: this.banner, tweens: [
      { alpha: 1, y: 220, duration: 300, ease: 'Back.easeOut' },
      { alpha: 1, duration: 1400 },
      { alpha: 0, y: 210, duration: 400 },
    ] });
  }

  private refresh(s: GameState) {
    const info = season(s);
    this.dayText.setText(`Day ${s.day} · ${info.label}`);
    const ph = phase(s);
    const phLabel = CONTENT.tuning.dayPhases.find((p) => p.id === ph)!.label;
    this.phaseText.setText(`${PHASE_GLYPH[ph]} ${phLabel}${info.scored ? `  ${info.dayInSeason}/${info.seasonLength}` : ''}`);
    const left = staminaLeft(s);
    this.pips.forEach((p, i) => { p.setVisible(i < s.staminaMax).setAlpha(i < left ? 1 : 0.18); });
    this.yenText.setText(`¥ ${s.yen.toLocaleString('en-US')}`);
    this.kizunaText.setText(`絆 ${s.kizuna}  ·  Rank ${rankDef(s).rank}`);
    const bagItems = Object.entries(s.inventory).filter(([, n]) => n > 0).map(([k, n]) => `${k.replace(/_/g, ' ')} ${n}`);
    this.bagText.setText(bagItems.join(' · '));
    const r = regionDef(CONTENT, s.currentRegion);
    const v = s.regions[r.id].vitality;
    this.regionText.setText(r.name);
    this.vitalityText.setText(`${VITALITY_NAMES[v]}  ·  ${r.nameJa}`);
    this.vitalityDots.forEach((d, i) => d.setFillStyle(hex(i <= v && v > 0 ? PAL.lantern : PAL.snowShadow)));
  }
}
