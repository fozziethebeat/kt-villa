import Phaser from 'phaser';
import { store } from '../gameStore';
import { CONTENT } from '../sim/content';
import { createNewGame } from '../sim/game';
import type { PlayerProfile } from '../sim/types';
import { art, label, paperGrain, paperPanel } from '../ui/art';
import { button, type Button } from '../ui/widgets';
import { FONT, PAL, WIDTH, hex } from '../theme';

/** Name, pronouns and personality. Appearance variants arrive in M5 (default protagonist for now). */
export class CharacterSelectScene extends Phaser.Scene {
  private profile: PlayerProfile = { name: 'Aoi', pronouns: 'she', personality: 'outdoorsy' };
  private nameText!: Phaser.GameObjects.Text;
  private caret!: Phaser.GameObjects.Rectangle;
  private pronounButtons: Record<string, Button> = {};
  private cards: { id: string; box: Phaser.GameObjects.Container; ring: Phaser.GameObjects.Rectangle }[] = [];
  private summary!: Phaser.GameObjects.Text;

  constructor() { super('CharacterSelect'); }

  create() {
    this.profile = { name: 'Aoi', pronouns: 'she', personality: 'outdoorsy' };
    this.cards = [];
    const { height } = this.scale;
    art(this, 0, 0, 'bg_mountains_winter', 0, 0).setDisplaySize(WIDTH, 460).setAlpha(0.55);
    this.add.rectangle(0, 0, WIDTH, height, hex(PAL.paper), 0.55).setOrigin(0);
    label(this, 40, 26, 'Who is moving to Hakuba?', 36, PAL.ink, '900');
    label(this, 40, 76, 'Leaving Tokyo behind. Pick a name and a personality; each gives a small, playful edge.', 18, PAL.twilight, '500');

    // Portrait
    paperPanel(this, 40, 120, 300, 440, PAL.snow);
    this.add.ellipse(190, 512, 130, 18, hex(PAL.ink), 0.12);
    art(this, 190, 516, 'char_aoi').setScale(1.1);
    label(this, 190, 528, 'Appearance options arrive later', 14, PAL.twilight, '500').setOrigin(0.5, 0);

    // Name
    label(this, 60, 136, 'Name', 18, PAL.cedar);
    paperPanel(this, 60, 164, 260, 52, PAL.paper);
    this.nameText = label(this, 76, 176, this.profile.name, 26);
    this.caret = this.add.rectangle(0, 178, 3, 28, hex(PAL.ink)).setOrigin(0, 0);
    this.tweens.add({ targets: this.caret, alpha: 0, duration: 500, yoyo: true, repeat: -1 });
    // Native listener: Phaser's keydown event can replay earlier letters when Shift combos follow them.
    const onKey = (e: KeyboardEvent) => this.onKey(e);
    window.addEventListener('keydown', onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('keydown', onKey));

    // Pronouns
    label(this, 60, 232, 'Pronouns', 18, PAL.cedar);
    (['she', 'he', 'they'] as const).forEach((p, i) => {
      this.pronounButtons[p] = button(this, 100 + i * 90, 286, 80, 42, p === 'she' ? 'she/her' : p === 'he' ? 'he/him' : 'they', () => this.setPronouns(p), PAL.snow, 15);
    });

    // Personalities
    label(this, 380, 120, 'Personality', 22, PAL.cedar);
    CONTENT.personalities.forEach((p, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 380 + col * 290, y = 156 + row * 190;
      const ring = this.add.rectangle(-6, -6, 282, 182, hex(PAL.lantern)).setOrigin(0).setVisible(false);
      const panel = paperPanel(this, 0, 0, 270, 170, PAL.snow);
      const name = this.add.text(18, 14, p.name, { fontFamily: FONT, fontSize: '22px', color: PAL.ink, fontStyle: '700' });
      const blurb = this.add.text(18, 48, p.blurb, { fontFamily: FONT, fontSize: '15px', color: PAL.twilight, fontStyle: '500', wordWrap: { width: 236 } });
      const sum = this.add.text(18, 104, p.summary, { fontFamily: FONT, fontSize: '14px', color: PAL.cedar, fontStyle: '500', wordWrap: { width: 236 }, lineSpacing: 2 });
      // Explicit hit zone: a container's own hit area is centred on it, which misaligns with top-left layout.
      const hit = this.add.zone(0, 0, 270, 170).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.setPersonality(p.id));
      const box = this.add.container(x, y, [ring, panel, name, blurb, sum, hit]);
      this.cards.push({ id: p.id, box, ring });
    });

    this.summary = label(this, 380 + 290 * 2 - 10 + 20, 360, '', 16, PAL.ink, '500').setWordWrapWidth(250);
    button(this, 1080, 620, 280, 64, 'Drive to Hakuba  ▶', () => this.begin(), PAL.lantern, 24);
    label(this, 40, 640, 'Type to edit your name · Enter to begin', 15, PAL.twilight, '500');

    this.setPronouns('she');
    this.setPersonality('outdoorsy');
    this.refreshName();
    paperGrain(this);
  }

  private onKey(e: KeyboardEvent) {
    if (!this.scene.isActive()) return;
    if (e.key === 'Enter') { this.begin(); return; }
    if (e.key === 'Backspace') this.profile.name = this.profile.name.slice(0, -1);
    else if (e.key.length === 1 && /[\p{L}\p{N} '\-]/u.test(e.key) && this.profile.name.length < 12) this.profile.name += e.key;
    this.refreshName();
  }

  private refreshName() {
    this.nameText.setText(this.profile.name || ' ');
    this.caret.x = this.nameText.x + (this.profile.name ? this.nameText.width : 0) + 2;
  }

  private setPronouns(p: PlayerProfile['pronouns']) {
    this.profile.pronouns = p;
    for (const [k, b] of Object.entries(this.pronounButtons)) b.container.setAlpha(k === p ? 1 : 0.55);
  }

  private setPersonality(id: string) {
    this.profile.personality = id;
    for (const c of this.cards) { c.ring.setVisible(c.id === id); c.box.setScale(c.id === id ? 1.02 : 1); }
    const p = CONTENT.personalities.find((x) => x.id === id)!;
    this.summary.setText(`${p.name}\n${p.summary}`);
  }

  private begin() {
    const name = this.profile.name.trim() || 'Aoi';
    store.replace(createNewGame({ seed: (Date.now() & 0x7fffffff) >>> 0, player: { ...this.profile, name } }), 'new-game');
    this.cameras.main.fadeOut(300, 251, 250, 246);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Station'));
  }
}
