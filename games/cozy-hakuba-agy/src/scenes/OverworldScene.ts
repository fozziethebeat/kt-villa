import Phaser from 'phaser';
import { store } from '../state/store';
import { REGION_MAP } from '../state/content';
import { InteractiveZone, RegionId } from '../state/types';

export type ZoneActionCallback = (zone: InteractiveZone) => void;

interface ZoneVisual {
  zone: InteractiveZone;
  container: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Graphics;
  badgeText: Phaser.GameObjects.Text;
  collected: boolean;
}

export class OverworldScene extends Phaser.Scene {
  private playerX = 335;
  private playerY = 385;
  private targetX: number | null = null;
  private targetY: number | null = null;

  private bgGraphics!: Phaser.GameObjects.Graphics;
  private wakeGlowGraphics!: Phaser.GameObjects.Graphics;
  private roadGraphics!: Phaser.GameObjects.Graphics;
  private buildingContainer!: Phaser.GameObjects.Container;
  private zoneVisuals: ZoneVisual[] = [];
  private playerContainer!: Phaser.GameObjects.Container;
  private playerSpriteGraphics!: Phaser.GameObjects.Graphics;
  private vanContainer!: Phaser.GameObjects.Container;
  private promptBanner!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private weatherParticles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
  private weatherGraphics!: Phaser.GameObjects.Graphics;
  private tourists: { x: number; y: number; dir: number; speed: number; color: number; label: string }[] = [];
  private touristGraphics!: Phaser.GameObjects.Graphics;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; E: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key };

  private activeZone: InteractiveZone | null = null;
  private onZoneInteract?: ZoneActionCallback;
  private wakeRadius = 110;
  private targetWakeRadius = 110;
  private collectedZoneIds: Set<string> = new Set();

  constructor() {
    super({ key: 'OverworldScene' });
  }

  public setZoneInteractHandler(fn: ZoneActionCallback): void {
    this.onZoneInteract = fn;
  }

  create(): void {
    this.bgGraphics = this.add.graphics();
    this.wakeGlowGraphics = this.add.graphics();
    this.roadGraphics = this.add.graphics();
    this.buildingContainer = this.add.container(0, 0);
    this.touristGraphics = this.add.graphics();
    this.vanContainer = this.add.container(0, 0);
    this.playerContainer = this.add.container(this.playerX, this.playerY);
    this.weatherGraphics = this.add.graphics();

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

    // Click to walk & interact
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isAnyModalOpen()) return;
      this.targetX = Phaser.Math.Clamp(pointer.x, 60, 1020);
      this.targetY = Phaser.Math.Clamp(pointer.y, 200, 520);
    });

    // Initialize weather particles
    for (let i = 0; i < 55; i++) {
      this.weatherParticles.push({
        x: Math.random() * 1080,
        y: Math.random() * 560,
        vx: (Math.random() - 0.5) * 0.6,
        vy: 0.6 + Math.random() * 1.1,
        size: 2 + Math.random() * 3,
        alpha: 0.35 + Math.random() * 0.5,
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
    this.playerSpriteGraphics = this.add.graphics();
    const shadow = this.add.ellipse(0, 18, 28, 10, 0x0f172a, 0.35);
    const nameTag = this.add
      .text(0, -38, 'Yuki (You)', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fef3c7',
        backgroundColor: '#1e293b',
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5);

    this.playerContainer.add([shadow, this.playerSpriteGraphics, nameTag]);
    this.playerContainer.setDepth(30);
    this.redrawPlayerSprite();
  }

  private redrawPlayerSprite(): void {
    const st = store.getState();
    const g = this.playerSpriteGraphics;
    g.clear();

    // Coat color changes by season & personality
    const coatColor =
      st.season === 'winter'
        ? st.personality === 'barista'
          ? 0xea580c
          : st.personality === 'tinkerer'
          ? 0x2563eb
          : st.personality === 'photographer'
          ? 0x059669
          : 0xdb2777
        : 0x10b981;

    // Boots
    g.fillStyle(0x334155, 1);
    g.fillRoundedRect(-8, 8, 6, 10, 2);
    g.fillRoundedRect(2, 8, 6, 10, 2);

    // Cozy Parka / Trekking Tunic
    g.fillStyle(coatColor, 1);
    g.fillRoundedRect(-11, -10, 22, 20, 6);

    // Scarf in winter / Bandana in green
    g.fillStyle(st.season === 'winter' ? 0xfef08a : 0xfda4af, 1);
    g.fillRoundedRect(-9, -11, 18, 5, 2);

    // Head
    g.fillStyle(0xfde68a, 1);
    g.fillCircle(0, -19, 9);

    // Hair & Beanie / Sunhat
    g.fillStyle(0x1e293b, 1);
    if (st.gender === 'female') {
      g.fillCircle(-8, -16, 4);
      g.fillCircle(8, -16, 4);
    }
    g.fillStyle(st.season === 'winter' ? 0xf43f5e : 0xd97706, 1);
    g.fillRoundedRect(-10, -29, 20, 7, 3);

    const tag = this.playerContainer.list[2] as Phaser.GameObjects.Text;
    if (tag) {
      tag.setText(`${st.playerName} • ${st.season === 'winter' ? '❄️ Parka' : '🌱 Hiker'}`);
    }
  }

  private createPromptBanner(): void {
    this.promptBanner = this.add.container(540, 515);
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.92);
    bg.lineStyle(2, 0xfbbf24, 1);
    bg.fillRoundedRect(-250, -22, 500, 42, 12);
    bg.strokeRoundedRect(-250, -22, 500, 42, 12);

    this.promptText = this.add
      .text(0, -1, '', {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#fef3c7',
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

    this.redrawPlayerSprite();

    // Target wake radius: small clearing (155px) when unrestored, full canvas (980px) when Steward helped!
    this.targetWakeRadius = regProg.stewardHelped ? 980 : 175;

    this.drawAlpineBackdrop(st.currentRegion, st.season, regProg.stewardHelped);
    this.drawLandmarksAndArchitecture(st.currentRegion, st.season, regProg.stewardHelped, regProg.greenPivotBuilt);
    this.drawVanExterior(st.currentRegion, st.vanTier, st.season);
    this.buildInteractiveZones(regDef.zones, regProg.stewardHelped, regProg.greenPivotBuilt);
    this.spawnSeasonalTourists(st.season, regProg.stewardHelped ? (st.season === 'winter' ? regProg.vitalityWinter : regProg.vitalityGreen) : 20);
  }

  private drawAlpineBackdrop(regionId: RegionId, season: 'winter' | 'green', awakened: boolean): void {
    const g = this.bgGraphics;
    g.clear();

    // Sky gradient
    const skyTop = season === 'winter' ? (awakened ? 0x1e3a8a : 0x334155) : awakened ? 0x0284c7 : 0x475569;
    const skyBottom = season === 'winter' ? (awakened ? 0xbae6fd : 0x94a3b8) : awakened ? 0xe0f2fe : 0x94a3b8;

    g.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
    g.fillRect(0, 0, 1080, 215);

    // Iconic Hakuba Three Peaks (Shirouma, Shakushi, Yari) silhouette
    const mountainColor = awakened ? (season === 'winter' ? 0xf8fafc : 0x64748b) : 0x94a3b8;
    const mountainShadow = awakened ? (season === 'winter' ? 0xcbd5e1 : 0x475569) : 0x64748b;

    // Far peaks
    g.fillStyle(mountainShadow, 1);
    g.beginPath();
    g.moveTo(0, 215);
    g.lineTo(140, 85);
    g.lineTo(290, 165);
    g.lineTo(470, 58); // Mt. Shirouma (2,932m)
    g.lineTo(640, 150);
    g.lineTo(790, 75); // Mt. Shakushi
    g.lineTo(950, 95); // Mt. Shirouma Yari
    g.lineTo(1080, 190);
    g.lineTo(1080, 215);
    g.closePath();
    g.fillPath();

    // Snow caps / sunlit ridges on the Three Peaks
    g.fillStyle(mountainColor, 1);
    g.beginPath();
    g.moveTo(470, 58);
    g.lineTo(415, 120);
    g.lineTo(485, 115);
    g.closePath();
    g.fillPath();

    g.beginPath();
    g.moveTo(790, 75);
    g.lineTo(740, 130);
    g.lineTo(815, 125);
    g.closePath();
    g.fillPath();

    // Foothill cedar forest treeline
    const treeColor = awakened ? (season === 'winter' ? 0x1e3a2f : 0x15803d) : 0x475569;
    g.fillStyle(treeColor, 1);
    for (let x = 20; x < 1060; x += 38) {
      const h = 28 + (x % 3) * 10;
      g.fillTriangle(x, 215, x + 22, 215 - h, x + 44, 215);
    }

    // Ground plane (Muted slate when unrestored; crisp snow or vibrant meadow when awakened)
    const groundBase = !awakened
      ? season === 'winter'
        ? 0xcbd5e1
        : 0x64748b
      : season === 'winter'
      ? 0xf1f5f9
      : 0x4ade80;

    g.fillStyle(groundBase, 1);
    g.fillRect(0, 215, 1080, 345);

    // Paved or timber pathways
    const road = this.roadGraphics;
    road.clear();
    road.fillStyle(awakened ? 0x475569 : 0x64748b, 0.55);
    road.fillRoundedRect(70, 305, 940, 62, 18);
    road.lineStyle(2, 0xfef08a, awakened ? 0.6 : 0.2);
    for (let rx = 110; rx < 960; rx += 60) {
      road.strokeLineShape(new Phaser.Geom.Line(rx, 336, rx + 30, 336));
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

    const roofColor = awakened ? (regionId === 'snowpeak' ? 0x78350f : 0x991b1b) : 0x475569;
    const wallColor = awakened ? 0xfef3c7 : 0x94a3b8;
    const windowGlow = awakened ? 0xfbbf24 : 0x64748b;

    if (regionId === 'station') {
      // Hakuba Train Station Triangular Alpine Chalet Roof
      g.fillStyle(wallColor, 1);
      g.fillRoundedRect(380, 130, 260, 95, 6);
      g.fillStyle(roofColor, 1);
      g.fillTriangle(360, 135, 510, 65, 660, 135);
      if (season === 'winter') {
        g.fillStyle(0xffffff, 0.9);
        g.fillTriangle(372, 132, 510, 68, 648, 132);
      }
      // Warm Station Windows
      g.fillStyle(windowGlow, 1);
      for (let wx = 405; wx <= 595; wx += 45) {
        g.fillRoundedRect(wx, 155, 28, 36, 4);
      }
      const sign = this.add
        .text(510, 118, '🚉 HAKUBA STATION 白馬駅', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#ffffff',
          backgroundColor: '#1e293b',
          padding: { x: 8, y: 3 },
        })
        .setOrigin(0.5);
      this.buildingContainer.add([g, sign]);
    } else if (regionId === 'snowpeak') {
      // Kengo Kuma Wood-Lattice Architecture
      g.fillStyle(wallColor, 1);
      g.fillRoundedRect(390, 135, 300, 90, 8);
      g.fillStyle(roofColor, 1);
      g.fillTriangle(360, 140, 540, 75, 720, 140);
      // Iconic wooden crisscrossing rafters
      g.lineStyle(3, 0xd97706, awakened ? 0.9 : 0.35);
      for (let lx = 410; lx <= 670; lx += 32) {
        g.strokeLineShape(new Phaser.Geom.Line(lx, 135, lx + 20, 225));
        g.strokeLineShape(new Phaser.Geom.Line(lx + 20, 135, lx, 225));
      }
      const sign = this.add
        .text(540, 118, '⛺ SNOW PEAK LAND STATION', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#fef3c7',
          backgroundColor: '#065f46',
          padding: { x: 8, y: 3 },
        })
        .setOrigin(0.5);
      this.buildingContainer.add([g, sign]);
    } else if (regionId === 'happo') {
      // Happo-One Bus Terminal & Onsen Bathhouse
      g.fillStyle(wallColor, 1);
      g.fillRoundedRect(360, 130, 340, 95, 8);
      g.fillStyle(roofColor, 1);
      g.fillRoundedRect(345, 112, 370, 26, 6);
      g.fillStyle(windowGlow, 1);
      for (let wx = 385; wx <= 645; wx += 52) {
        g.fillRoundedRect(wx, 152, 36, 42, 4);
      }
      const sign = this.add
        .text(530, 122, '🚌 HAPPO-ONE TERMINAL & ONSEN 八方', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: '#fef3c7',
          backgroundColor: '#7c2d12',
          padding: { x: 8, y: 3 },
        })
        .setOrigin(0.5);
      this.buildingContainer.add([g, sign]);
    }

    // If Green Pivot is built, draw vibrant summer pavilion decorations!
    if (greenPivotBuilt) {
      const pg = this.add.graphics();
      pg.fillStyle(0x10b981, 0.28);
      pg.fillCircle(770, 265, 58);
      pg.lineStyle(3, 0xfbbf24, 0.95);
      pg.strokeCircle(770, 265, 58);
      const banner = this.add
        .text(770, 205, '🌱 GREEN PIVOT ACTIVE (+VITALITY!)', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#ecfdf5',
          backgroundColor: '#047857',
          padding: { x: 6, y: 2 },
        })
        .setOrigin(0.5);
      this.buildingContainer.add([pg, banner]);
    }
  }

  private drawVanExterior(regionId: RegionId, vanTier: 1 | 2, season: 'winter' | 'green'): void {
    this.vanContainer.removeAll(true);
    const regDef = REGION_MAP[regionId];
    const parkingZone = regDef.zones.find((z) => z.type === 'parking');
    if (!parkingZone) return;

    const vx = parkingZone.x;
    const vy = parkingZone.y;
    const g = this.add.graphics();

    // Warm Golden Awning Rug on the ground
    g.fillStyle(0xfbbf24, 0.22);
    g.fillRoundedRect(vx - 62, vy - 18, 124, 58, 14);
    g.lineStyle(2, 0xf59e0b, 0.8);
    g.strokeRoundedRect(vx - 62, vy - 18, 124, 58, 14);

    // Van Body (Tier 1 Kei Van vs Tier 2 Retro 4WD Overland with Roof Tent)
    const bodyWidth = vanTier === 1 ? 82 : 104;
    const bodyColor = vanTier === 1 ? 0xfef3c7 : 0xd97706;
    const stripeColor = season === 'winter' ? 0x0284c7 : 0x059669;

    // Wheels
    g.fillStyle(0x0f172a, 1);
    g.fillCircle(vx - bodyWidth / 3, vy + 18, 10);
    g.fillCircle(vx + bodyWidth / 3, vy + 18, 10);

    // Chassis
    g.fillStyle(bodyColor, 1);
    g.fillRoundedRect(vx - bodyWidth / 2, vy - 26, bodyWidth, 40, 10);
    g.fillStyle(stripeColor, 1);
    g.fillRect(vx - bodyWidth / 2 + 4, vy - 4, bodyWidth - 8, 8);

    // Serving Window (Glowing Warmly)
    g.fillStyle(0xfef08a, 1);
    g.fillRoundedRect(vx - 20, vy - 20, 38, 15, 4);

    // Pop-up Roof Tent if Tier 2
    if (vanTier === 2) {
      g.fillStyle(0x10b981, 1);
      g.fillTriangle(vx - 36, vy - 26, vx, vy - 48, vx + 36, vy - 26);
    }

    const label = this.add
      .text(
        vx,
        vy - (vanTier === 2 ? 56 : 38),
        vanTier === 1 ? '🚐 Tier 1 Kei Van [4x3]' : '🚐 Tier 2 4WD Overland [6x3]',
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#fef3c7',
          backgroundColor: '#1e293b',
          padding: { x: 6, y: 2 },
        }
      )
      .setOrigin(0.5);

    this.vanContainer.add([g, label]);
    this.vanContainer.setDepth(18);
  }

  private buildInteractiveZones(zones: InteractiveZone[], stewardHelped: boolean, greenPivotBuilt: boolean): void {
    for (const zv of this.zoneVisuals) {
      zv.container.destroy();
    }
    this.zoneVisuals = [];

    for (const zone of zones) {
      const container = this.add.container(zone.x, zone.y);
      const ring = this.add.graphics();
      const isCollected = this.collectedZoneIds.has(zone.id);

      // Color-coded diegetic ring explaining purpose & usability at a glance
      const ringColor =
        zone.type === 'steward'
          ? 0xfbbf24
          : zone.type === 'puzzle'
          ? 0x38bdf8
          : zone.type === 'forage'
          ? 0x4ade80
          : zone.type === 'parking'
          ? 0xf97316
          : zone.type === 'pivot'
          ? 0x10b981
          : zone.type === 'portal'
          ? 0xa855f7
          : 0xf43f5e;

      ring.fillStyle(0x0f172a, 0.78);
      ring.lineStyle(2.5, ringColor, isCollected ? 0.35 : 0.95);
      ring.fillRoundedRect(-68, -28, 136, 54, 12);
      ring.strokeRoundedRect(-68, -28, 136, 54, 12);

      const seasonBadge = zone.seasonTag === 'winter' ? ' ❄️' : zone.seasonTag === 'green' ? ' 🌱' : '';
      const titleText = this.add
        .text(0, -10, `${zone.icon} ${zone.label}${seasonBadge}`, {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          color: isCollected ? '#94a3b8' : '#f8fafc',
        })
        .setOrigin(0.5);

      let subTextStr = zone.sublabel;
      if (zone.type === 'forage' && isCollected) subTextStr = '✓ Collected Today';
      if (zone.type === 'puzzle' && store.getState().regions[store.getState().currentRegion].puzzleSolved) {
        subTextStr = '✓ Restored!';
      }
      if (zone.type === 'pivot' && greenPivotBuilt) {
        subTextStr = '✓ Active Summer Pivot!';
      }

      const badgeText = this.add
        .text(0, 10, subTextStr, {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '11px',
          color: isCollected ? '#64748b' : '#fde68a',
        })
        .setOrigin(0.5);

      container.add([ring, titleText, badgeText]);
      container.setDepth(20);

      // Make zone directly clickable as well for intuitive play!
      container.setSize(136, 54);
      container.setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => {
        if (this.isAnyModalOpen()) return;
        this.playerX = zone.x;
        this.playerY = Math.min(500, zone.y + 32);
        this.targetX = null;
        this.targetY = null;
        if (this.onZoneInteract) {
          this.onZoneInteract(zone);
        }
      });

      this.zoneVisuals.push({
        zone,
        container,
        ring,
        badgeText,
        collected: isCollected,
      });
    }
  }

  public markForageZoneCollected(zoneId: string): void {
    this.collectedZoneIds.add(zoneId);
    this.rebuildRegionScene();
  }

  private spawnSeasonalTourists(season: 'winter' | 'green', vitality: number): void {
    const count = Math.max(2, Math.round(vitality / 14));
    this.tourists = [];
    for (let i = 0; i < count; i++) {
      this.tourists.push({
        x: 140 + ((i * 135) % 800),
        y: 315 + (i % 3) * 22,
        dir: i % 2 === 0 ? 1 : -1,
        speed: 0.35 + (i % 3) * 0.15,
        color: season === 'winter' ? (i % 2 === 0 ? 0x38bdf8 : 0xf43f5e) : i % 2 === 0 ? 0x10b981 : 0xf59e0b,
        label: season === 'winter' ? '⛷️' : '🥾',
      });
    }
  }

  update(_time: number, delta: number): void {
    if (!this.playerContainer) return;

    // Smooth Cozy Grove Color-Wake radial expansion animation
    this.wakeRadius = Phaser.Math.Linear(this.wakeRadius, this.targetWakeRadius, 0.05);
    this.drawWakeRadialHearth();

    if (!this.isAnyModalOpen()) {
      const speed = 0.24 * delta;
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
        }
      }

      this.playerX = Phaser.Math.Clamp(this.playerX, 55, 1025);
      this.playerY = Phaser.Math.Clamp(this.playerY, 210, 510);
      this.playerContainer.setPosition(this.playerX, this.playerY);
    }

    // Check proximity to interactive zones
    let closest: InteractiveZone | null = null;
    let minDist = 88;
    for (const zv of this.zoneVisuals) {
      const d = Phaser.Math.Distance.Between(this.playerX, this.playerY, zv.zone.x, zv.zone.y);
      if (d < minDist) {
        minDist = d;
        closest = zv.zone;
      }
    }

    this.activeZone = closest;
    if (closest) {
      this.promptBanner.setVisible(true);
      const keyHint = closest.type === 'parking' ? '[Space] or [E] Open Van Cutaway & Pop-Up Shop' : `[E] or Click: ${closest.label} — ${closest.sublabel}`;
      this.promptText.setText(keyHint);
    } else {
      this.promptBanner.setVisible(false);
    }

    this.updateTouristsAndWeather();
  }

  private drawWakeRadialHearth(): void {
    const st = store.getState();
    const regDef = REGION_MAP[st.currentRegion];
    const hearth = regDef.zones.find((z) => z.type === 'hearth') || { x: 540, y: 270 };
    const g = this.wakeGlowGraphics;
    g.clear();

    // Warm golden-amber restoration ring radiating from the Regional Hearth
    g.fillStyle(st.season === 'winter' ? 0xfbbf24 : 0x34d399, 0.14);
    g.fillCircle(hearth.x, hearth.y, this.wakeRadius);
    g.lineStyle(3, 0xfbbf24, 0.65);
    g.strokeCircle(hearth.x, hearth.y, this.wakeRadius);
  }

  private updateTouristsAndWeather(): void {
    const st = store.getState();

    // Draw bustling tourists along the village promenade
    const tg = this.touristGraphics;
    tg.clear();
    for (const t of this.tourists) {
      t.x += t.dir * t.speed;
      if (t.x > 940) t.dir = -1;
      if (t.x < 140) t.dir = 1;

      tg.fillStyle(0x0f172a, 0.25);
      tg.fillEllipse(t.x, t.y + 10, 14, 5);
      tg.fillStyle(t.color, 0.9);
      tg.fillRoundedRect(t.x - 6, t.y - 8, 12, 16, 4);
      tg.fillStyle(0xfde68a, 1);
      tg.fillCircle(t.x, t.y - 13, 5);
    }

    // Draw gentle snowfall in Winter or floating dandelion/firefly motes in Green Season
    const wg = this.weatherGraphics;
    wg.clear();
    for (const p of this.weatherParticles) {
      p.x += p.vx;
      p.y += st.season === 'winter' ? p.vy : -p.vy * 0.4;
      if (p.y > 560) p.y = 0;
      if (p.y < 0) p.y = 560;
      if (p.x > 1080) p.x = 0;
      if (p.x < 0) p.x = 1080;

      wg.fillStyle(st.season === 'winter' ? 0xffffff : 0xfef08a, p.alpha);
      wg.fillCircle(p.x, p.y, p.size);
    }
  }
}
