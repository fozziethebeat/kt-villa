import Phaser from 'phaser';
import { store } from '../state/store';
import { REGION_MAP } from '../state/content';
import { InteractiveZone, RegionId } from '../state/types';
import { registerHakubaTextures } from '../art/hakubaArt';

export type ZoneActionCallback = (zone: InteractiveZone) => void;

interface ZoneProp {
  zone: InteractiveZone;
  container: Phaser.GameObjects.Container;
  glowRing: Phaser.GameObjects.Graphics;
  bubbleContainer?: Phaser.GameObjects.Container;
  sparklePhase: number;
  collected: boolean;
}

export class OverworldScene extends Phaser.Scene {
  private playerX = 305;
  private playerY = 395;
  private targetX: number | null = null;
  private targetY: number | null = null;
  private walkBobPhase = 0;

  private bgGraphics!: Phaser.GameObjects.Graphics;
  private mistVeilGraphics!: Phaser.GameObjects.Graphics;
  private wakeGlowGraphics!: Phaser.GameObjects.Graphics;
  private roadGraphics!: Phaser.GameObjects.Graphics;
  private buildingContainer!: Phaser.GameObjects.Container;
  private steamGraphics!: Phaser.GameObjects.Graphics;
  private zoneProps: ZoneProp[] = [];
  private playerContainer!: Phaser.GameObjects.Container;
  private playerSprite!: Phaser.GameObjects.Image;
  private vanContainer!: Phaser.GameObjects.Container;
  private promptBanner!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private weatherParticles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
  private weatherGraphics!: Phaser.GameObjects.Graphics;
  private tourists: { x: number; y: number; dir: number; speed: number; coat: number; hat: number }[] = [];
  private touristGraphics!: Phaser.GameObjects.Graphics;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
  };

  private activeZone: InteractiveZone | null = null;
  private hoveredZone: InteractiveZone | null = null;
  private onZoneInteract?: ZoneActionCallback;
  private wakeRadius = 150;
  private targetWakeRadius = 150;
  private collectedZoneIds: Set<string> = new Set();

  constructor() {
    super({ key: 'OverworldScene' });
  }

  public setZoneInteractHandler(fn: ZoneActionCallback): void {
    this.onZoneInteract = fn;
  }

  create(): void {
    this.bgGraphics = this.add.graphics();
    this.roadGraphics = this.add.graphics();
    this.buildingContainer = this.add.container(0, 0);
    this.mistVeilGraphics = this.add.graphics();
    this.wakeGlowGraphics = this.add.graphics();
    this.steamGraphics = this.add.graphics();
    this.touristGraphics = this.add.graphics();
    this.vanContainer = this.add.container(0, 0);
    this.playerContainer = this.add.container(this.playerX, this.playerY);
    this.weatherGraphics = this.add.graphics();

    const st = store.getState();
    registerHakubaTextures(this, st.gender, st.personality, st.season);

    this.createPlayerVisual();
    this.createPromptBanner();

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      };

      this.wasd.E.on('down', () => {
        if (this.isAnyModalOpen()) return;
        if (this.activeZone && this.onZoneInteract) {
          this.onZoneInteract(this.activeZone);
        }
      });

      this.wasd.SPACE.on('down', () => {
        if (this.isAnyModalOpen()) return;
        if (this.activeZone && this.activeZone.type === 'parking' && this.onZoneInteract) {
          this.onZoneInteract(this.activeZone);
        }
      });
    }

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isAnyModalOpen()) return;
      this.targetX = Phaser.Math.Clamp(pointer.x, 60, 1020);
      this.targetY = Phaser.Math.Clamp(pointer.y, 235, 515);
    });

    for (let i = 0; i < 42; i++) {
      this.weatherParticles.push({
        x: Math.random() * 1080,
        y: Math.random() * 560,
        vx: (Math.random() - 0.5) * 0.45,
        vy: 0.45 + Math.random() * 0.85,
        size: 1.8 + Math.random() * 2.6,
        alpha: 0.35 + Math.random() * 0.45,
      });
    }

    this.rebuildRegionScene();

    store.subscribe(() => {
      if (this.scene.isActive()) {
        this.rebuildRegionScene();
      }
    });
  }

  private isAnyModalOpen(): boolean {
    return document.querySelectorAll('dialog[open]').length > 0;
  }

  private createPlayerVisual(): void {
    this.playerSprite = this.add.image(0, -14, 'player_sprite').setScale(0.95);
    this.playerContainer.add(this.playerSprite);
    this.playerContainer.setDepth(30);
  }

  private createPromptBanner(): void {
    this.promptBanner = this.add.container(540, 520);
    const bg = this.add.graphics();
    bg.fillStyle(0xfaf5eb, 0.96);
    bg.lineStyle(2, 0xd86442, 0.95);
    bg.fillRoundedRect(-210, -20, 420, 38, 19);
    bg.strokeRoundedRect(-210, -20, 420, 38, 19);

    this.promptText = this.add
      .text(0, -1, '', {
        fontFamily: "'Hiragino Maru Gothic ProN', 'Yu Gothic', system-ui, sans-serif",
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#2e2723',
      })
      .setOrigin(0.5);

    this.promptBanner.add([bg, this.promptText]);
    this.promptBanner.setDepth(50);
    this.promptBanner.setVisible(false);
  }

  public rebuildRegionScene(): void {
    const st = store.getState();
    const regDef = REGION_MAP[st.currentRegion];
    const regProg = st.regions[st.currentRegion];

    registerHakubaTextures(this, st.gender, st.personality, st.season);
    this.playerSprite.setTexture('player_sprite');

    this.targetWakeRadius = regProg.stewardHelped ? 980 : 185;

    this.drawAlpineBackdrop(st.season, regProg.stewardHelped);
    this.drawLandmarksAndArchitecture(st.currentRegion, st.season, regProg.stewardHelped, regProg.greenPivotBuilt);
    this.drawVanExterior(st.currentRegion, st.vanTier);
    this.buildInteractiveProps(regDef.zones, regProg.stewardHelped, regProg.greenPivotBuilt);
    this.spawnSeasonalTourists(
      st.season,
      regProg.stewardHelped ? (st.season === 'winter' ? regProg.vitalityWinter : regProg.vitalityGreen) : 18
    );
  }

  private drawAlpineBackdrop(season: 'winter' | 'green', awakened: boolean): void {
    const g = this.bgGraphics;
    g.clear();

    // Soft editorial morning sky gradient (no dark SaaS navy!)
    const skyTop = season === 'winter' ? (awakened ? 0xc2d9ec : 0xd0d8e0) : awakened ? 0xb8e0e6 : 0xcdd6d8;
    const skyBottom = season === 'winter' ? (awakened ? 0xfbf3e4 : 0xebe6dd) : awakened ? 0xfaf3df : 0xe9e4da;

    g.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
    g.fillRect(0, 0, 1080, 225);

    // Warm morning sun halo
    g.fillStyle(awakened ? 0xfde8b8 : 0xf2ead9, 0.75);
    g.fillCircle(880, 66, 34);
    g.fillStyle(awakened ? 0xfcf4dc : 0xf5efe3, 0.3);
    g.fillCircle(880, 66, 56);

    // Hakuba Three Peaks (Mt. Shirouma, Shakushi, Shirouma-Yari) in layered gouache tones
    const backRidge = season === 'winter' ? (awakened ? 0x9bb2c9 : 0xaab4be) : awakened ? 0x7ea29c : 0x9aa8a4;
    const midRidge = season === 'winter' ? (awakened ? 0x7a95b0 : 0x939ea8) : awakened ? 0x5c8575 : 0x84918c;
    const snowCap = awakened ? 0xfcfaf5 : 0xeeeae2;

    // Distant hazy ridge
    g.fillStyle(backRidge, 0.85);
    g.beginPath();
    g.moveTo(0, 225);
    g.lineTo(130, 108);
    g.lineTo(280, 172);
    g.lineTo(475, 58);
    g.lineTo(655, 160);
    g.lineTo(805, 78);
    g.lineTo(955, 105);
    g.lineTo(1080, 185);
    g.lineTo(1080, 225);
    g.closePath();
    g.fillPath();

    // Crisp sunlit snow caps on the Three Peaks
    g.fillStyle(snowCap, 0.95);
    g.beginPath();
    g.moveTo(475, 58);
    g.lineTo(418, 122);
    g.lineTo(465, 114);
    g.lineTo(492, 126);
    g.lineTo(525, 105);
    g.closePath();
    g.fillPath();

    g.beginPath();
    g.moveTo(805, 78);
    g.lineTo(754, 132);
    g.lineTo(798, 124);
    g.lineTo(834, 136);
    g.closePath();
    g.fillPath();

    // Mid foothill ridge
    g.fillStyle(midRidge, 0.6);
    g.beginPath();
    g.moveTo(0, 225);
    g.lineTo(190, 155);
    g.lineTo(390, 198);
    g.lineTo(615, 148);
    g.lineTo(870, 186);
    g.lineTo(1080, 150);
    g.lineTo(1080, 225);
    g.closePath();
    g.fillPath();

    // Soft layered cedar forest along the horizon
    const pineBack = awakened ? (season === 'winter' ? 0x4b6a5f : 0x4d7c5b) : 0x7c8680;
    const pineFront = awakened ? (season === 'winter' ? 0x3b584e : 0x3f6b4c) : 0x6f7973;
    for (let x = 10; x < 1070; x += 34) {
      const h = 24 + ((x * 7) % 18);
      g.fillStyle(x % 68 === 10 ? pineBack : pineFront, 1);
      g.fillTriangle(x, 225, x + 19, 225 - h, x + 38, 225);
      if (season === 'winter') {
        g.fillStyle(0xf7f5ef, awakened ? 0.85 : 0.45);
        g.fillTriangle(x + 9, 225 - h + 12, x + 19, 225 - h, x + 29, 225 - h + 12);
      }
    }

    // Ground meadow / snowdrift wash
    const groundTop = !awakened
      ? 0xe8e2d5
      : season === 'winter'
      ? 0xf7f6f1
      : 0xcfe8c3;
    const groundBottom = !awakened
      ? 0xdcd5c7
      : season === 'winter'
      ? 0xe6edf4
      : 0xaed49e;

    g.fillGradientStyle(groundTop, groundTop, groundBottom, groundBottom, 1);
    g.fillRect(0, 225, 1080, 335);

    // Organic curved snow / wildflower patches
    if (awakened) {
      g.fillStyle(season === 'winter' ? 0xffffff : 0xfef3c7, 0.45);
      g.fillEllipse(200, 460, 260, 65);
      g.fillEllipse(840, 445, 290, 75);
      if (season === 'green') {
        // Tiny gouache wildflower dots
        const dotColors = [0xf4a29e, 0xf6d57a, 0xfaf5eb];
        for (let i = 0; i < 36; i++) {
          g.fillStyle(dotColors[i % dotColors.length], 0.85);
          g.fillCircle(80 + ((i * 79) % 930), 255 + ((i * 47) % 250), 2.8);
        }
      }
    }

    // Warm cobblestone / timber-edged village promenade
    const road = this.roadGraphics;
    road.clear();
    road.fillStyle(awakened ? 0xd9ccb8 : 0xcbc3b4, 0.9);
    road.fillRoundedRect(58, 326, 964, 58, 28);
    road.lineStyle(2, 0xa8967e, 0.6);
    road.strokeRoundedRect(58, 326, 964, 58, 28);
    // Subtle stepping stones along the path
    road.fillStyle(0xf3ebdd, 0.65);
    for (let sx = 95; sx < 975; sx += 52) {
      road.fillEllipse(sx, 355 + (sx % 2 === 0 ? -4 : 4), 24, 10);
    }
  }

  private drawLandmarksAndArchitecture(
    regionId: RegionId,
    season: 'winter' | 'green',
    awakened: boolean,
    greenPivotBuilt: boolean
  ): void {
    this.buildingContainer.removeAll(true);
    const g = this.add.graphics();

    const wallCream = awakened ? 0xfaf2e1 : 0xe3ddd1;
    const timber = awakened ? 0x8c5e3c : 0x7e756d;
    const roofWarm = awakened ? (regionId === 'snowpeak' ? 0x6f4e37 : 0xc85d3d) : 0x867e77;
    const winGlow = awakened ? 0xf8c96b : 0xa8a29c;

    if (regionId === 'station') {
      // Hakuba Station Alpine Chalet
      g.fillStyle(0x4a3b32, 0.14);
      g.fillEllipse(510, 232, 310, 26);

      g.fillStyle(wallCream, 1);
      g.lineStyle(2.5, 0x4a3b32, 0.7);
      g.fillRoundedRect(370, 125, 280, 102, 8);
      g.strokeRoundedRect(370, 125, 280, 102, 8);

      // Timber beams
      g.fillStyle(timber, 1);
      g.fillRect(370, 125, 10, 102);
      g.fillRect(640, 125, 10, 102);
      g.fillRect(370, 178, 280, 7);

      // Pitched Terracotta Roof + Winter Snow Cap
      g.fillStyle(roofWarm, 1);
      g.fillTriangle(345, 130, 510, 55, 675, 130);
      g.strokeTriangle(345, 130, 510, 55, 675, 130);
      if (season === 'winter') {
        g.fillStyle(0xfcfaf5, 0.94);
        g.fillTriangle(360, 126, 510, 59, 660, 126);
      }

      // Glowing Shoji Windows & Indigo Noren Curtain at doorway
      g.fillStyle(winGlow, 1);
      for (const wx of [400, 445, 550, 595]) {
        g.fillRoundedRect(wx, 144, 28, 30, 4);
        g.strokeRoundedRect(wx, 144, 28, 30, 4);
      }
      // Doorway + Japanese Noren Curtain
      g.fillStyle(0x5c4332, 1);
      g.fillRoundedRect(492, 165, 36, 62, 4);
      g.fillStyle(awakened ? 0x4c6e8c : 0x7c858e, 1);
      g.fillRect(492, 165, 17, 22);
      g.fillRect(511, 165, 17, 22);

      // Subtle wooden station plaque
      const sign = this.add
        .text(510, 110, '白馬駅  HAKUBA', {
          fontFamily: "'Hiragino Maru Gothic ProN', 'Georgia', serif",
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#2e2723',
          backgroundColor: '#faf5eb',
          padding: { x: 10, y: 3 },
        })
        .setOrigin(0.5);
      this.buildingContainer.add([g, sign]);
    } else if (regionId === 'snowpeak') {
      // Kengo Kuma Inspired Timber Lattice Pavilion
      g.fillStyle(0x4a3b32, 0.14);
      g.fillEllipse(540, 232, 340, 26);

      g.fillStyle(wallCream, 1);
      g.lineStyle(2.5, 0x4a3b32, 0.7);
      g.fillRoundedRect(375, 130, 330, 96, 8);
      g.strokeRoundedRect(375, 130, 330, 96, 8);

      g.fillStyle(roofWarm, 1);
      g.fillTriangle(350, 134, 540, 68, 730, 134);
      g.strokeTriangle(350, 134, 540, 68, 730, 134);

      // Iconic crisscrossing cedar rafters
      g.lineStyle(3, timber, awakened ? 0.9 : 0.4);
      for (let lx = 395; lx <= 675; lx += 32) {
        g.strokeLineShape(new Phaser.Geom.Line(lx, 132, lx + 22, 224));
        g.strokeLineShape(new Phaser.Geom.Line(lx + 22, 132, lx, 224));
      }

      const sign = this.add
        .text(540, 112, 'SNOW PEAK 白馬', {
          fontFamily: "'Hiragino Maru Gothic ProN', 'Georgia', serif",
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#2e2723',
          backgroundColor: '#faf5eb',
          padding: { x: 10, y: 3 },
        })
        .setOrigin(0.5);
      this.buildingContainer.add([g, sign]);
    } else if (regionId === 'happo') {
      // Happo-One Bus Terminal & Cedar Onsen Lodge
      g.fillStyle(0x4a3b32, 0.14);
      g.fillEllipse(530, 232, 360, 26);

      g.fillStyle(wallCream, 1);
      g.lineStyle(2.5, 0x4a3b32, 0.7);
      g.fillRoundedRect(350, 128, 360, 98, 8);
      g.strokeRoundedRect(350, 128, 360, 98, 8);

      g.fillStyle(roofWarm, 1);
      g.fillRoundedRect(336, 108, 388, 28, 8);
      g.strokeRoundedRect(336, 108, 388, 28, 8);

      g.fillStyle(winGlow, 1);
      for (let wx = 378; wx <= 638; wx += 52) {
        g.fillRoundedRect(wx, 148, 34, 42, 4);
        g.strokeRoundedRect(wx, 148, 34, 42, 4);
      }

      const sign = this.add
        .text(530, 118, '八方温泉・バスターミナル', {
          fontFamily: "'Hiragino Maru Gothic ProN', 'Georgia', serif",
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#2e2723',
          backgroundColor: '#faf5eb',
          padding: { x: 10, y: 3 },
        })
        .setOrigin(0.5);
      this.buildingContainer.add([g, sign]);
    } else if (regionId === 'echoland') {
      // Echoland Street: Vintage Cafe Row + Hanging Lantern String
      g.fillStyle(0x4a3b32, 0.14);
      g.fillEllipse(540, 232, 420, 26);
      // Left Cafe & Right Record Chalet
      g.fillStyle(wallCream, 1);
      g.lineStyle(2.4, 0x4a3b32, 0.75);
      g.fillRoundedRect(335, 134, 175, 92, 8);
      g.strokeRoundedRect(335, 134, 175, 92, 8);
      g.fillRoundedRect(545, 140, 185, 86, 8);
      g.strokeRoundedRect(545, 140, 185, 86, 8);
      // Warm awnings
      g.fillStyle(awakened ? 0x9b4d7a : 0x7e756d, 1);
      g.fillRoundedRect(326, 122, 193, 20, 6);
      g.fillStyle(awakened ? 0xd86442 : 0x867e77, 1);
      g.fillRoundedRect(536, 128, 203, 20, 6);
      // Hanging street lanterns between shops
      g.lineStyle(2, 0x4a3b32, 0.7);
      g.strokeLineShape(new Phaser.Geom.Line(370, 122, 700, 128));
      for (let lx = 410; lx <= 660; lx += 50) {
        g.fillStyle(awakened ? 0xf6c453 : 0xcbc3b4, 1);
        g.fillCircle(lx, 128, 7);
      }
      g.fillStyle(winGlow, 1);
      for (const wx of [360, 425, 575, 650]) {
        g.fillRoundedRect(wx, 158, 38, 34, 4);
        g.strokeRoundedRect(wx, 158, 38, 34, 4);
      }
      const sign = this.add
        .text(530, 102, 'エコーランド  ECHOLAND', {
          fontFamily: "'Hiragino Maru Gothic ProN', 'Georgia', serif",
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#2e2723',
          backgroundColor: '#faf5eb',
          padding: { x: 10, y: 3 },
        })
        .setOrigin(0.5);
      this.buildingContainer.add([g, sign]);
    } else if (regionId === 'iwatake') {
      // Hakuba Iwatake: Cantilevered Mountain Harbor Terrace + Gondola
      g.fillStyle(0x4a3b32, 0.14);
      g.fillEllipse(540, 232, 370, 26);
      // Timber Terrace Deck
      g.fillStyle(timber, 1);
      g.lineStyle(2.4, 0x4a3b32, 0.75);
      g.fillRoundedRect(350, 186, 380, 40, 6);
      g.strokeRoundedRect(350, 186, 380, 40, 6);
      // Panoramic Bakery Glass Pavilion
      g.fillStyle(wallCream, 1);
      g.fillRoundedRect(410, 118, 250, 72, 8);
      g.strokeRoundedRect(410, 118, 250, 72, 8);
      g.fillStyle(awakened ? 0x9ec2dd : 0xb8c0c7, 0.85);
      g.fillRoundedRect(425, 130, 220, 46, 5);
      g.strokeRoundedRect(425, 130, 220, 46, 5);
      // Gondola cable + cute cabin
      g.lineStyle(2, 0x4a3b32, 0.5);
      g.strokeLineShape(new Phaser.Geom.Line(120, 92, 410, 128));
      g.fillStyle(awakened ? 0x2e7d8c : 0x7e888c, 1);
      g.fillRoundedRect(245, 108, 34, 24, 6);
      g.strokeRoundedRect(245, 108, 34, 24, 6);
      const sign = this.add
        .text(535, 104, '白馬岩岳  MOUNTAIN HARBOR', {
          fontFamily: "'Hiragino Maru Gothic ProN', 'Georgia', serif",
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#2e2723',
          backgroundColor: '#faf5eb',
          padding: { x: 10, y: 3 },
        })
        .setOrigin(0.5);
      this.buildingContainer.add([g, sign]);
    } else if (regionId === 'goryu') {
      // Hakuba Goryu: Escal Plaza & Botanical Glass Conservatory
      g.fillStyle(0x4a3b32, 0.14);
      g.fillEllipse(540, 232, 370, 26);
      g.fillStyle(wallCream, 1);
      g.lineStyle(2.4, 0x4a3b32, 0.75);
      g.fillRoundedRect(365, 130, 210, 96, 8);
      g.strokeRoundedRect(365, 130, 210, 96, 8);
      g.fillStyle(awakened ? 0x6e5aa8 : 0x7c788a, 1);
      g.fillTriangle(350, 134, 470, 74, 590, 134);
      g.strokeTriangle(350, 134, 470, 74, 590, 134);
      // Botanical Glasshouse Dome
      g.fillStyle(awakened ? 0xd8f0e4 : 0xd0d6d2, 0.9);
      g.fillRoundedRect(585, 138, 125, 88, { tl: 48, tr: 48, bl: 4, br: 4 });
      g.strokeRoundedRect(585, 138, 125, 88, { tl: 48, tr: 48, bl: 4, br: 4 });
      g.fillStyle(winGlow, 1);
      for (const wx of [392, 448, 504]) {
        g.fillRoundedRect(wx, 152, 34, 38, 4);
        g.strokeRoundedRect(wx, 152, 34, 38, 4);
      }
      const sign = this.add
        .text(535, 108, '白馬五竜  ESCAL & BOTANICAL', {
          fontFamily: "'Hiragino Maru Gothic ProN', 'Georgia', serif",
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#2e2723',
          backgroundColor: '#faf5eb',
          padding: { x: 10, y: 3 },
        })
        .setOrigin(0.5);
      this.buildingContainer.add([g, sign]);
    } else if (regionId === 'hakuba47') {
      // Hakuba 47: Freestyle Base Lodge + Stone Pizza Chimney
      g.fillStyle(0x4a3b32, 0.14);
      g.fillEllipse(540, 232, 370, 26);
      g.fillStyle(wallCream, 1);
      g.lineStyle(2.4, 0x4a3b32, 0.75);
      g.fillRoundedRect(370, 130, 320, 96, 8);
      g.strokeRoundedRect(370, 130, 320, 96, 8);
      // Stone chimney
      g.fillStyle(0x8c7b6e, 1);
      g.fillRect(620, 74, 28, 60);
      g.strokeRect(620, 74, 28, 60);
      g.fillStyle(awakened ? 0xd86442 : 0x867e77, 1);
      g.fillTriangle(350, 134, 530, 72, 710, 134);
      g.strokeTriangle(350, 134, 530, 72, 710, 134);
      g.fillStyle(winGlow, 1);
      for (const wx of [400, 465, 530, 595]) {
        g.fillRoundedRect(wx, 152, 38, 38, 4);
        g.strokeRoundedRect(wx, 152, 38, 38, 4);
      }
      const sign = this.add
        .text(530, 110, '白馬47  RIVER & PARK BASE', {
          fontFamily: "'Hiragino Maru Gothic ProN', 'Georgia', serif",
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#2e2723',
          backgroundColor: '#faf5eb',
          padding: { x: 10, y: 3 },
        })
        .setOrigin(0.5);
      this.buildingContainer.add([g, sign]);
    }

    // Green Season Pivot Visual Illustration (Tarp tent / E-bike rack / Flower planter!)
    if (greenPivotBuilt) {
      const pg = this.add.graphics();
      pg.fillStyle(0x4d7c5b, 0.16);
      pg.fillEllipse(845, 268, 120, 48);
      // Cute canvas tarp canopy + bunting
      pg.fillStyle(0xfaf5eb, 1);
      pg.lineStyle(2, 0x4a3b32, 0.85);
      pg.fillTriangle(800, 260, 845, 218, 890, 260);
      pg.strokeTriangle(800, 260, 845, 218, 890, 260);
      pg.fillStyle(0x4d7c5b, 1);
      pg.fillRoundedRect(814, 260, 62, 10, 4);
      this.buildingContainer.add(pg);
    }
  }

  private drawVanExterior(regionId: RegionId, vanTier: 1 | 2): void {
    this.vanContainer.removeAll(true);
    const regDef = REGION_MAP[regionId];
    const parkingZone = regDef.zones.find((z) => z.type === 'parking');
    if (!parkingZone) return;

    const vanImg = this.add.image(parkingZone.x, parkingZone.y - 8, `van_tier_${vanTier}`);
    this.vanContainer.add(vanImg);
    this.vanContainer.setDepth(18);
  }

  private buildInteractiveProps(zones: InteractiveZone[], stewardHelped: boolean, greenPivotBuilt: boolean): void {
    for (const zp of this.zoneProps) {
      zp.container.destroy();
    }
    this.zoneProps = [];

    const st = store.getState();
    const regDef = REGION_MAP[st.currentRegion];
    const regProg = st.regions[st.currentRegion];

    for (const zone of zones) {
      const container = this.add.container(zone.x, zone.y);
      const glowRing = this.add.graphics();
      const isCollected = this.collectedZoneIds.has(zone.id);

      container.add(glowRing);

      // Render crisp illustrated prop — NO giant floating text boxes!
      if (zone.type === 'steward') {
        const texKey = `steward_${st.currentRegion}`;
        const npc = this.add.image(0, -14, this.textures.exists(texKey) ? texKey : 'steward_station');
        container.add(npc);

        // Tiny visual icon thought bubble (e.g. 🪵 1/3 or ✨!)
        const bubble = this.add.container(22, -62);
        const bg = this.add.graphics();
        bg.fillStyle(0xfaf5eb, 0.96);
        bg.lineStyle(1.8, 0xd86442, 0.9);
        bg.fillRoundedRect(-24, -14, 48, 24, 12);
        bg.strokeRoundedRect(-24, -14, 48, 24, 12);

        const iconStr = regProg.stewardHelped
          ? regProg.greenPivotBuilt
            ? '🌸'
            : '🌱'
          : regProg.fetchCollected >= regDef.fetchItemRequired && regProg.puzzleSolved
          ? '✨!'
          : `${regDef.zones.find((z) => z.type === 'forage')?.icon || '🪵'} ${regProg.fetchCollected}/${regDef.fetchItemRequired}`;

        const bTxt = this.add
          .text(0, -2, iconStr, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#2e2723',
          })
          .setOrigin(0.5);
        bubble.add([bg, bTxt]);
        container.add(bubble);
      } else if (zone.type === 'hearth') {
        const hearthKey =
          st.currentRegion === 'snowpeak' || st.currentRegion === 'echoland' || st.currentRegion === 'hakuba47'
            ? 'prop_hearth_takibi'
            : 'prop_hearth';
        const hearth = this.add.image(0, 0, hearthKey);
        container.add(hearth);
      } else if (zone.type === 'forage') {
        const propKey =
          zone.itemReward === 'Birch Bark'
            ? 'prop_birch'
            : zone.itemReward === 'Route Plaque'
            ? 'prop_plaque'
            : zone.itemReward === 'Lantern Bulb'
            ? 'prop_bulb'
            : zone.itemReward === 'Trail Marker'
            ? 'prop_marker'
            : zone.itemReward === 'Seed Packet'
            ? 'prop_seed'
            : zone.itemReward === 'River Stone'
            ? 'prop_stone'
            : 'prop_cedar';
        const prop = this.add.image(0, 0, propKey);
        if (isCollected) {
          prop.setAlpha(0.35);
        }
        container.add(prop);

        if (!isCollected) {
          const badge = this.add
            .text(16, -20, '✨', { fontSize: '14px' })
            .setOrigin(0.5);
          container.add(badge);
        }
      } else if (zone.type === 'puzzle') {
        const bg = this.add.graphics();
        bg.fillStyle(regProg.puzzleSolved ? 0x4d7c5b : 0xfaf5eb, 0.95);
        bg.lineStyle(2.2, 0x4a3b32, 0.85);
        bg.fillCircle(0, 0, 22);
        bg.strokeCircle(0, 0, 22);
        const ico = this.add
          .text(0, 0, regProg.puzzleSolved ? '✓' : zone.icon, {
            fontSize: '20px',
            color: regProg.puzzleSolved ? '#ffffff' : '#2e2723',
            fontStyle: 'bold',
          })
          .setOrigin(0.5);
        container.add([bg, ico]);
      } else if (zone.type === 'pivot') {
        if (!greenPivotBuilt) {
          const bg = this.add.graphics();
          bg.fillStyle(0xfaf5eb, 0.95);
          bg.lineStyle(2, 0x4d7c5b, 0.9);
          bg.fillRoundedRect(-22, -20, 44, 40, 10);
          bg.strokeRoundedRect(-22, -20, 44, 40, 10);
          const ico = this.add.text(0, -1, `${zone.icon}`, { fontSize: '20px' }).setOrigin(0.5);
          const tag = this.add
            .text(0, 24, '🌱', { fontSize: '12px' })
            .setOrigin(0.5);
          container.add([bg, ico, tag]);
        }
      } else if (zone.type === 'portal') {
        const post = this.add.image(0, -10, 'prop_signpost');
        const arrow = this.add
          .text(0, -24, zone.x < 500 ? '←' : '→', {
            fontSize: '15px',
            fontStyle: 'bold',
            color: '#2e2723',
          })
          .setOrigin(0.5);
        container.add([post, arrow]);
      } else if (zone.type === 'parking') {
        // Van image already drawn in vanContainer; just provide invisible hit area + subtle awning badge
        const tag = this.add
          .text(0, -64, '☕ Van Shop', {
            fontFamily: "'Hiragino Maru Gothic ProN', system-ui, sans-serif",
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#2e2723',
            backgroundColor: '#faf5eb',
            padding: { x: 8, y: 2 },
          })
          .setOrigin(0.5);
        container.add(tag);
      }

      container.setDepth(zone.type === 'parking' ? 19 : 21);
      container.setSize(96, 76);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        this.hoveredZone = zone;
      });
      container.on('pointerout', () => {
        if (this.hoveredZone?.id === zone.id) {
          this.hoveredZone = null;
        }
      });
      container.on('pointerdown', () => {
        if (this.isAnyModalOpen()) return;
        this.playerX = zone.x;
        this.playerY = Math.min(505, zone.y + 38);
        this.targetX = null;
        this.targetY = null;
        if (this.onZoneInteract) {
          this.onZoneInteract(zone);
        }
      });

      this.zoneProps.push({
        zone,
        container,
        glowRing,
        sparklePhase: Math.random() * Math.PI * 2,
        collected: isCollected,
      });
    }
  }

  public markForageZoneCollected(zoneId: string): void {
    this.collectedZoneIds.add(zoneId);
    this.rebuildRegionScene();
  }

  private spawnSeasonalTourists(season: 'winter' | 'green', vitality: number): void {
    const count = Math.max(2, Math.round(vitality / 15));
    const palette =
      season === 'winter'
        ? [0x5a8fb8, 0xd86442, 0xc96d7d, 0x4d7c5b]
        : [0x6ea37a, 0xe6a23c, 0x7fb3b5, 0xd86442];
    this.tourists = [];
    for (let i = 0; i < count; i++) {
      this.tourists.push({
        x: 130 + ((i * 145) % 820),
        y: 340 + (i % 3) * 14,
        dir: i % 2 === 0 ? 1 : -1,
        speed: 0.3 + (i % 3) * 0.12,
        coat: palette[i % palette.length],
        hat: season === 'winter' ? 0xfaf5eb : 0xe5cfa8,
      });
    }
  }

  update(time: number, delta: number): void {
    if (!this.playerContainer) return;

    this.wakeRadius = Phaser.Math.Linear(this.wakeRadius, this.targetWakeRadius, 0.05);
    this.drawMistAndWakeHearth(time);

    if (!this.isAnyModalOpen()) {
      const speed = 0.23 * delta;
      let moved = false;

      if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
        this.playerX -= speed;
        moved = true;
      }
      if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
        this.playerX += speed;
        moved = true;
      }
      if (this.cursors?.up.isDown || this.wasd?.W.isDown) {
        this.playerY -= speed;
        moved = true;
      }
      if (this.cursors?.down.isDown || this.wasd?.S.isDown) {
        this.playerY += speed;
        moved = true;
      }

      if (moved) {
        this.targetX = null;
        this.targetY = null;
      } else if (this.targetX !== null && this.targetY !== null) {
        const dx = this.targetX - this.playerX;
        const dy = this.targetY - this.playerY;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) {
          this.targetX = null;
          this.targetY = null;
        } else {
          this.playerX += (dx / dist) * speed;
          this.playerY += (dy / dist) * speed;
          moved = true;
        }
      }

      this.playerX = Phaser.Math.Clamp(this.playerX, 55, 1025);
      this.playerY = Phaser.Math.Clamp(this.playerY, 230, 510);

      if (moved) {
        this.walkBobPhase += delta * 0.015;
        this.playerSprite.setY(-14 + Math.abs(Math.sin(this.walkBobPhase)) * -4);
      } else {
        this.playerSprite.setY(-14);
      }
      this.playerContainer.setPosition(this.playerX, this.playerY);
    }

    // Highlight ONLY the single active/hovered zone
    let closest: InteractiveZone | null = this.hoveredZone;
    if (!closest) {
      let minDist = 78;
      for (const zp of this.zoneProps) {
        const d = Phaser.Math.Distance.Between(this.playerX, this.playerY, zp.zone.x, zp.zone.y);
        if (d < minDist) {
          minDist = d;
          closest = zp.zone;
        }
      }
    }

    this.activeZone = closest;

    for (const zp of this.zoneProps) {
      zp.glowRing.clear();
      if (closest && closest.id === zp.zone.id) {
        zp.glowRing.lineStyle(3, 0xe6a23c, 0.92);
        if (zp.zone.type === 'parking') {
          zp.glowRing.strokeRoundedRect(-72, -48, 144, 82, 20);
        } else {
          zp.glowRing.strokeCircle(0, 2, 34);
        }
      }
    }

    if (closest) {
      this.promptBanner.setVisible(true);
      const hint =
        closest.type === 'parking'
          ? '[Space] Open Van Studio & Pop-Up Window'
          : `[E] or Click · ${closest.label}`;
      this.promptText.setText(hint);
    } else {
      this.promptBanner.setVisible(false);
    }

    this.updateTouristsSteamAndWeather(time);
  }

  private drawMistAndWakeHearth(time: number): void {
    const st = store.getState();
    const regDef = REGION_MAP[st.currentRegion];
    const regProg = st.regions[st.currentRegion];
    const hearth = regDef.zones.find((z) => z.type === 'hearth') || { x: 540, y: 295 };

    const mg = this.mistVeilGraphics;
    mg.clear();
    if (!regProg.stewardHelped) {
      // Soft dreamy morning mist frame around unrestored edges
      mg.fillStyle(0xebe5d9, 0.28);
      mg.fillRect(0, 0, 1080, 560);
    }

    const g = this.wakeGlowGraphics;
    g.clear();
    const pulse = 4 * Math.sin(time * 0.0025);
    g.fillStyle(st.season === 'winter' ? 0xfbe5b0 : 0xbee6c7, regProg.stewardHelped ? 0.14 : 0.24);
    g.fillCircle(hearth.x, hearth.y, this.wakeRadius + pulse);
    if (!regProg.stewardHelped) {
      g.lineStyle(2.5, 0xe6a23c, 0.65);
      g.strokeCircle(hearth.x, hearth.y, this.wakeRadius + pulse);
    }
  }

  private updateTouristsSteamAndWeather(time: number): void {
    const st = store.getState();
    const regDef = REGION_MAP[st.currentRegion];
    const hearth = regDef.zones.find((z) => z.type === 'hearth');

    // Animated rising steam curls at the Ashiyu / Onsen / Takibi hearth
    const sg = this.steamGraphics;
    sg.clear();
    if (hearth) {
      for (let i = 0; i < 4; i++) {
        const phase = ((time * 0.001 + i * 0.25) % 1);
        const sx = hearth.x - 18 + i * 12 + Math.sin(time * 0.003 + i) * 4;
        const sy = hearth.y - 12 - phase * 26;
        sg.fillStyle(0xfaf5eb, (1 - phase) * 0.65);
        sg.fillCircle(sx, sy, 5 + phase * 4);
      }
    }

    // Strolling storybook tourists
    const tg = this.touristGraphics;
    tg.clear();
    for (const t of this.tourists) {
      t.x += t.dir * t.speed;
      if (t.x > 945) t.dir = -1;
      if (t.x < 135) t.dir = 1;

      tg.fillStyle(0x3b2f2b, 0.18);
      tg.fillEllipse(t.x, t.y + 11, 13, 4);
      tg.fillStyle(t.coat, 1);
      tg.fillRoundedRect(t.x - 6, t.y - 8, 12, 17, 5);
      tg.fillStyle(0xfce5cd, 1);
      tg.fillCircle(t.x, t.y - 13, 5.5);
      tg.fillStyle(t.hat, 1);
      tg.fillCircle(t.x, t.y - 17, 4.2);
    }

    // Gentle snow flakes or warm fireflies / sunlit pollen
    const wg = this.weatherGraphics;
    wg.clear();
    for (const p of this.weatherParticles) {
      p.x += p.vx;
      p.y += st.season === 'winter' ? p.vy : -p.vy * 0.35;
      if (p.y > 560) p.y = 0;
      if (p.y < 0) p.y = 560;
      if (p.x > 1080) p.x = 0;
      if (p.x < 0) p.x = 1080;

      wg.fillStyle(st.season === 'winter' ? 0xffffff : 0xfde68a, p.alpha);
      wg.fillCircle(p.x, p.y, p.size);
    }
  }
}
