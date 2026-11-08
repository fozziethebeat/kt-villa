import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT, regionDef } from '../sim/content';
import { endDay, phase, season, staminaLeft } from '../sim/game';
import type { GameState } from '../sim/types';
import { art, label, paperGrain, paperPanel } from '../ui/art';
import { PAL, WIDTH, hex } from '../theme';

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
    for (let i = 0; i < CONTENT.tuning.baseStamina; i++) this.pips.push(art(this, 200 + (i % 6) * 22, 66 + Math.floor(i / 6) * 22, 'icon_stamina', 0.5, 0.5).setScale(0.36));

    // Wallet card
    paperPanel(this, WIDTH - 236, 14, 220, 92);
    this.yenText = label(this, WIDTH - 218, 24, '', 24);
    this.kizunaText = label(this, WIDTH - 218, 58, '', 20, PAL.noren);
    this.bagText = label(this, WIDTH - 30, 62, '', 16, PAL.teal, '500').setOrigin(1, 0);

    // Region card (bottom-left)
    paperPanel(this, 16, 640, 330, 66);
    this.regionText = label(this, 34, 650, '', 20);
    this.vitalityText = label(this, 34, 678, '', 16, PAL.cedar, '500');
    for (let i = 0; i < 4; i++) this.vitalityDots.push(this.add.circle(240 + i * 24, 687, 8, hex(PAL.snowShadow)).setStrokeStyle(2, hex(PAL.ink)));

    // Day / season banner
    const bp = paperPanel(this, -260, -46, 520, 92, PAL.snow);
    this.bannerText = label(this, 0, 0, '', 30).setOrigin(0.5).setAlign('center');
    this.banner = this.add.container(WIDTH / 2, 220, [bp, this.bannerText]).setAlpha(0).setDepth(9000);

    paperGrain(this);

    this.game.events.on('endDay', this.onEndDay, this);
    this.unsub = store.subscribe((s) => this.refresh(s));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.unsub?.(); this.game.events.off('endDay', this.onEndDay, this); });
    this.refresh(store.state);
    this.showBanner(`Day ${store.state.day} · ${season(store.state).label}`);
  }

  private onEndDay() {
    let newSeason: ReturnType<typeof endDay>['newSeason'] = null;
    store.update('endDay', (s) => { newSeason = endDay(s).newSeason; });
    const s = store.state;
    const ns = newSeason as ReturnType<typeof endDay>['newSeason'];
    this.showBanner(ns ? `${ns.label} begins\nDay ${s.day}` : `Good morning · Day ${s.day}`);
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
    this.kizunaText.setText(`絆 ${s.kizuna}`);
    const bag = s.inventory.brochure ?? 0;
    this.bagText.setText(bag ? `brochures ${bag}` : '');
    const r = regionDef(CONTENT, s.currentRegion);
    const v = s.regions[r.id].vitality;
    this.regionText.setText(`${r.name}  ${r.nameJa}`);
    this.vitalityText.setText(VITALITY_NAMES[v]);
    this.vitalityDots.forEach((d, i) => d.setFillStyle(hex(i <= v && v > 0 ? PAL.lantern : PAL.snowShadow)));
  }
}
