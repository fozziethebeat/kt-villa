import { ActiveStationOrder, GameState, Gender, PersonalityId, RegionId, RegionProgress, Season, VanBuildSummary } from './types';
import { PERSONALITIES, REGIONS, REGION_MAP, VAN_MODULES } from './content';

type Listener = (state: GameState) => void;

function createInitialRegions(): Record<RegionId, RegionProgress> {
  const out = {} as Record<RegionId, RegionProgress>;
  for (const r of REGIONS) {
    out[r.id] = {
      unlocked: r.defaultUnlocked,
      fetchCollected: 0,
      puzzleSolved: false,
      stewardHelped: false,
      greenPivotBuilt: false,
      vitalityWinter: r.defaultUnlocked ? 35 : 0,
      vitalityGreen: r.defaultUnlocked ? 15 : 0,
    };
  }
  return out;
}

class GameStore {
  private state: GameState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = {
      started: false,
      playerName: 'Yuki',
      gender: 'female',
      personality: 'barista',
      day: 1,
      dayInCycle: 1,
      season: 'winter',
      isPrepDay: false,
      yen: 520,
      stamina: 100,
      maxStamina: 125,
      cozyRating: 34,
      reputation: 10,
      currentRegion: 'station',
      vanParkedAndOpen: false,
      vanTier: 1,
      gridCols: 4,
      gridRows: 3,
      ownedModules: ['espresso_bar', 'ski_wax_bench', 'futon_bunk'],
      placedModules: [
        { instanceId: 'mod_1', moduleId: 'espresso_bar', gridX: 0, gridY: 0 },
        { instanceId: 'mod_2', moduleId: 'ski_wax_bench', gridX: 2, gridY: 0 },
        { instanceId: 'mod_3', moduleId: 'futon_bunk', gridX: 0, gridY: 2 },
      ],
      inventory: {
        'Cedar Branch': 0,
        'Birch Bark': 0,
        'Route Plaque': 0,
      },
      regions: createInitialRegions(),
      customersServedTotal: 0,
      customersServedToday: 0,
      log: ['Arrived at Hakuba Station in your Kei Camper Van! Help Stationmaster Kenji wake up the plaza.'],
    };
    this.recalculateVanStats();
  }

  public getState(): GameState {
    return this.state;
  }

  public subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    this.recalculateVanStats();
    for (const fn of this.listeners) {
      fn(this.state);
    }
  }

  public addLog(msg: string): void {
    this.state.log = [msg, ...this.state.log.slice(0, 14)];
  }

  public startNewJourney(name: string, gender: Gender, personality: PersonalityId): void {
    this.state.playerName = name.trim() || 'Yuki';
    this.state.gender = gender;
    this.state.personality = personality;
    this.state.started = true;

    const pDef = PERSONALITIES.find((p) => p.id === personality)!;
    this.state.inventory[pDef.startingItem] = 1;
    this.addLog(`Welcome to Hakuba, ${this.state.playerName} (${pDef.name})! Starting perk active: ${pDef.perkTitle}.`);
    this.emit();
  }

  public recalculateVanStats(): void {
    let cozy = 0;
    for (const placed of this.state.placedModules) {
      const def = VAN_MODULES.find((m) => m.id === placed.moduleId);
      if (!def) continue;
      let bonus = def.cozyBonus;
      if (def.seasonTag === this.state.season) bonus = Math.round(bonus * 1.25);
      if (this.state.personality === 'curator' && def.category === 'living') {
        bonus = Math.round(bonus * 1.25);
      }
      cozy += bonus;
    }
    this.state.cozyRating = cozy;
    this.state.maxStamina = 100 + cozy;
    if (this.state.stamina > this.state.maxStamina) {
      this.state.stamina = this.state.maxStamina;
    }

    // Recompute regional seasonal vitalities
    for (const r of REGIONS) {
      const prog = this.state.regions[r.id];
      if (!prog.unlocked) {
        prog.vitalityWinter = 0;
        prog.vitalityGreen = 0;
        continue;
      }
      prog.vitalityWinter = prog.stewardHelped ? Math.min(100, r.winterTrafficBase + 20) : 35;
      if (!prog.stewardHelped) {
        prog.vitalityGreen = 15;
      } else if (prog.greenPivotBuilt) {
        prog.vitalityGreen = r.greenTrafficPivoted;
      } else {
        prog.vitalityGreen = r.greenTrafficBase;
      }
    }
  }

  public travelToRegion(regionId: RegionId): { ok: boolean; reason?: string } {
    const def = REGION_MAP[regionId];
    const prog = this.state.regions[regionId];
    if (!def.isPlayable) {
      return { ok: false, reason: `${def.name} arrives in Phase 3 (High Alpine Sanctuary)!` };
    }
    if (!prog.unlocked) {
      return { ok: false, reason: `Help the Steward in the previous region to wake up the road to ${def.name}!` };
    }
    if (def.requiresTier2Van && this.state.vanTier < 2) {
      return {
        ok: false,
        reason: `🏔️ Steep mountain road! Upgrade to the Tier 2 4WD Overland Van in Van Studio to drive up to ${def.name}.`,
      };
    }
    this.state.currentRegion = regionId;
    this.state.vanParkedAndOpen = false;
    this.addLog(`Drove your camper van to ${def.name} (${def.japaneseName}).`);
    this.emit();
    return { ok: true };
  }

  public collectForageItem(regionId: RegionId, itemName: string): number {
    const prog = this.state.regions[regionId];
    const def = REGION_MAP[regionId];
    const amount = this.state.personality === 'photographer' ? 2 : 1;
    this.state.inventory[itemName] = (this.state.inventory[itemName] || 0) + amount;
    if (itemName === def.fetchItemName) {
      prog.fetchCollected = Math.min(def.fetchItemRequired, prog.fetchCollected + amount);
    }
    this.addLog(`Foraged +${amount} ${itemName} in ${def.name} (${prog.fetchCollected}/${def.fetchItemRequired}).`);
    this.emit();
    return amount;
  }

  public completeRegionPuzzle(regionId: RegionId): void {
    const prog = this.state.regions[regionId];
    const def = REGION_MAP[regionId];
    prog.puzzleSolved = true;
    this.state.yen += 150;
    this.addLog(`Solved ${def.puzzleTitle}! Earned ¥150 restoration bonus.`);
    this.checkStewardWakeUp(regionId);
    this.emit();
  }

  public checkStewardWakeUp(regionId: RegionId): boolean {
    const prog = this.state.regions[regionId];
    const def = REGION_MAP[regionId];
    if (!prog.stewardHelped && prog.fetchCollected >= def.fetchItemRequired && prog.puzzleSolved) {
      prog.stewardHelped = true;
      this.state.reputation += 25;
      this.state.yen += 300;
      this.addLog(`✨ ${def.name} WOKE UP IN FULL COLOR! ${def.stewardName} lit the Regional Hearth (+¥300)!`);

      // Unlock next connected region(s) across Phase 1 & Phase 2
      if (regionId === 'station') {
        this.state.regions.snowpeak.unlocked = true;
        this.addLog(`🛣️ New Sub-Region Unlocked: Snow Peak Land Station!`);
      } else if (regionId === 'snowpeak') {
        this.state.regions.happo.unlocked = true;
        this.addLog(`🛣️ New Sub-Region Unlocked: Happo-One Bus Terminal!`);
      } else if (regionId === 'happo') {
        this.state.regions.echoland.unlocked = true;
        this.addLog(`🛣️ New Sub-Region Unlocked: Echoland Street!`);
      } else if (regionId === 'echoland') {
        this.state.regions.iwatake.unlocked = true;
        this.state.regions.goryu.unlocked = true;
        this.addLog(`⛰️ Mountain Resorts Unlocked: Hakuba Iwatake & Hakuba Goryu! (Tier 2 4WD Van required to climb!)`);
      } else if (regionId === 'goryu') {
        this.state.regions.hakuba47.unlocked = true;
        this.addLog(`🏂 New Sub-Region Unlocked: Hakuba 47 River Base!`);
      } else if (regionId === 'hakuba47') {
        this.addLog(`🎉 Mid-Valley Restoration Complete! All 7 Phase 1–2 Hakuba regions are thriving!`);
      }
      this.emit();
      return true;
    }
    return false;
  }

  public buildGreenPivot(regionId: RegionId): { ok: boolean; message: string } {
    const prog = this.state.regions[regionId];
    const def = REGION_MAP[regionId];
    if (!prog.stewardHelped) {
      return { ok: false, message: `Wake up ${def.name} with ${def.stewardName} first before building the Green Season Pivot!` };
    }
    if (prog.greenPivotBuilt) {
      return { ok: false, message: `${def.greenPivotTitle} is already active and thriving!` };
    }
    const cost = this.state.personality === 'tinkerer' ? Math.round(def.greenPivotCost * 0.85) : def.greenPivotCost;
    if (this.state.yen < cost) {
      return { ok: false, message: `Need ¥${cost} to build ${def.greenPivotTitle} (You have ¥${this.state.yen}). Open your Van Shop to earn more!` };
    }
    this.state.yen -= cost;
    prog.greenPivotBuilt = true;
    this.state.reputation += 30;
    this.addLog(`🌱 Built Green Season Pivot: ${def.greenPivotTitle} in ${def.name}! Summer tourist vitality surged to ${def.greenTrafficPivoted}%!`);
    this.emit();
    return { ok: true, message: `Built ${def.greenPivotTitle}!` };
  }

  public buyOrPlaceVanModule(moduleId: string, gridX: number, gridY: number): { ok: boolean; message: string } {
    const def = VAN_MODULES.find((m) => m.id === moduleId);
    if (!def) return { ok: false, message: 'Unknown module' };

    const isOwned = this.state.ownedModules.includes(moduleId);
    const cost = isOwned
      ? 0
      : this.state.personality === 'tinkerer'
      ? Math.round(def.cost * 0.85)
      : def.cost;

    if (!isOwned && this.state.yen < cost) {
      return { ok: false, message: `Need ¥${cost} to purchase ${def.name}.` };
    }

    // Check bounds
    if (gridX < 0 || gridY < 0 || gridX + def.width > this.state.gridCols || gridY + def.height > this.state.gridRows) {
      return { ok: false, message: `${def.name} (${def.width}x${def.height}) doesn't fit at slot (${gridX + 1}, ${gridY + 1}).` };
    }

    // Remove any overlapping modules so swapping is effortless and cozy!
    this.state.placedModules = this.state.placedModules.filter((placed) => {
      const pDef = VAN_MODULES.find((m) => m.id === placed.moduleId)!;
      const overlapX = gridX < placed.gridX + pDef.width && gridX + def.width > placed.gridX;
      const overlapY = gridY < placed.gridY + pDef.height && gridY + def.height > placed.gridY;
      return !(overlapX && overlapY);
    });

    if (!isOwned) {
      this.state.yen -= cost;
      this.state.ownedModules.push(moduleId);
    }

    this.state.placedModules.push({
      instanceId: `mod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      moduleId,
      gridX,
      gridY,
    });

    this.addLog(`Installed ${def.icon} ${def.name} at Van Grid (${gridX + 1}, ${gridY + 1}).`);
    this.emit();
    return { ok: true, message: `Installed ${def.name}!` };
  }

  public removeVanModuleAt(gridX: number, gridY: number): void {
    this.state.placedModules = this.state.placedModules.filter((placed) => {
      const pDef = VAN_MODULES.find((m) => m.id === placed.moduleId)!;
      const hit = gridX >= placed.gridX && gridX < placed.gridX + pDef.width && gridY >= placed.gridY && gridY < placed.gridY + pDef.height;
      return !hit;
    });
    this.emit();
  }

  public upgradeVanChassis(): { ok: boolean; message: string } {
    if (this.state.vanTier >= 2) {
      return { ok: false, message: 'Already driving the Tier 2 Retro 4WD Delica/HiAce Overland Van!' };
    }
    const cost = this.state.personality === 'tinkerer' ? 680 : 800;
    if (this.state.yen < cost) {
      return { ok: false, message: `Need ¥${cost} to upgrade to Tier 2 4WD Overland Van (6x3 Grid + Roof Tent).` };
    }
    this.state.yen -= cost;
    this.state.vanTier = 2;
    this.state.gridCols = 6;
    this.state.gridRows = 3;
    this.addLog(`🚐 UPGRADED VAN CHASSIS to Tier 2 Retro 4WD Overland! Interior grid expanded to 6x3!`);
    this.emit();
    return { ok: true, message: 'Upgraded to Tier 2 Retro 4WD Overland Van!' };
  }

  public computeVanBuildSummary(): VanBuildSummary {
    const regDef = REGION_MAP[this.state.currentRegion];
    const regProg = this.state.regions[this.state.currentRegion];
    const vitality = this.state.season === 'winter' ? regProg.vitalityWinter : regProg.vitalityGreen;
    const pDef = PERSONALITIES.find((p) => p.id === this.state.personality)!;

    const activeStations: ActiveStationOrder[] = [];
    const idleModuleNames: string[] = [];
    const activeBuffPills: string[] = [];
    const installedIds = new Set(this.state.placedModules.map((p) => p.moduleId));

    let guestBonus = 0;
    let sweetSpotWidth = 18 + (this.state.personality === 'barista' ? 8 : 0);
    let fillSpeedMultiplier = 1.0;
    let passivePerGuest = 0;
    let perfectBonusMultiplier = 1.4;
    let mochiAutoSave = false;

    if (this.state.personality === 'barista') {
      activeBuffPills.push('☕ Barista +8% Zone');
    }

    for (const placed of this.state.placedModules) {
      const mDef = VAN_MODULES.find((m) => m.id === placed.moduleId);
      if (!mDef) continue;

      const isOffSeason = mDef.seasonTag !== 'both' && mDef.seasonTag !== this.state.season;
      const isGearIdle = mDef.category === 'gear' && isOffSeason;

      if (isGearIdle) {
        idleModuleNames.push(mDef.name);
        continue;
      }

      // Living & Craft Passive Buffs
      if (!isOffSeason || mDef.seasonTag === 'both') {
        guestBonus += mDef.guestBonus;
        sweetSpotWidth += mDef.sweetSpotBonus;
        fillSpeedMultiplier += mDef.speedModifier;
        passivePerGuest += mDef.passivePerGuest;
      } else {
        // Off-season non-gear modules still work at half guest/passive strength
        guestBonus += Math.floor(mDef.guestBonus / 2);
      }

      if (mDef.id === 'futon_bunk') {
        activeBuffPills.push('🛏️ +8% Perfect Zone');
      }
      if (mDef.id === 'mini_wood_stove' && this.state.season === 'winter') {
        activeBuffPills.push('🔥 +2 Guests · -15% Speed');
      }
      if (mDef.id === 'botanical_charm' && this.state.season === 'green') {
        activeBuffPills.push('🌿 -20% Speed · +¥80/guest');
      }
      if (mDef.id === 'woodblock_postcard') {
        activeBuffPills.push('🖼️ +¥90/guest Postcards');
      }
      if (mDef.id === 'shiba_pet_mat') {
        mochiAutoSave = true;
        perfectBonusMultiplier += 0.25;
        activeBuffPills.push('🐕 Mochi Free Perfect + 25% Tips');
      }
      if (mDef.id === 'vinyl_lounge') {
        activeBuffPills.push('🎵 Vinyl Lounge (+10% Zone · -10% Speed)');
      }

      // Business Station Orders
      if (mDef.serviceOrderName && mDef.serviceVerb) {
        let payout = mDef.baseRevenue;
        if (mDef.seasonTag === this.state.season) {
          payout = Math.round(payout * 1.25);
        } else if (isOffSeason) {
          payout = Math.round(payout * 0.45);
          idleModuleNames.push(`${mDef.name} (Low Demand)`);
        }
        if (mDef.category === pDef.bonusCategory) {
          payout = Math.round(payout * 1.2);
        }
        activeStations.push({
          moduleId: mDef.id,
          itemName: mDef.serviceOrderName,
          itemIcon: mDef.icon,
          actionVerb: mDef.serviceVerb,
          payout,
        });
      }
    }

    // Synergy Combos
    if (installedIds.has('espresso_bar') && installedIds.has('oyaki_steamer')) {
      passivePerGuest += 100;
      activeBuffPills.push('☕+🥟 Morning Combo (+¥100/guest)');
    }
    if (installedIds.has('espresso_bar') && installedIds.has('croissant_case')) {
      passivePerGuest += 90;
      activeBuffPills.push('☕+🥐 Summit Bakery Combo (+¥90/guest)');
    }

    fillSpeedMultiplier = Math.max(0.55, Number(fillSpeedMultiplier.toFixed(2)));
    sweetSpotWidth = Math.min(48, sweetSpotWidth);

    const baseGuests = Math.max(1, Math.round(vitality / 35));
    const expectedCustomers = activeStations.length === 0 ? 0 : Math.min(6, Math.max(2, baseGuests + guestBonus));

    const avgOrderPay =
      activeStations.length > 0
        ? Math.round(activeStations.reduce((acc, s) => acc + s.payout, 0) / activeStations.length)
        : 0;
    const estimatedTotalYen = expectedCustomers * (avgOrderPay + passivePerGuest);

    let warning: string | null = null;
    if (activeStations.length === 0) {
      warning = '⚠️ Install at least 1 Cafe, Gear, or Craft station inside your van to open the Service Window!';
    } else if (this.state.season === 'green' && !regProg.greenPivotBuilt) {
      warning = `⚠️ Green Season Slump in ${regDef.name} (Vitality ${vitality}%). Build "${regDef.greenPivotTitle}" for more summer guests!`;
    } else if (idleModuleNames.length > 0) {
      warning = `💤 Seasonal Tip: ${idleModuleNames[0]} is off-season in ${
        this.state.season === 'winter' ? 'Winter' : 'Green Season'
      }. Swap in ${this.state.season === 'winter' ? '❄️ Winter' : '🌱 Green'} gear!`;
    }

    return {
      activeStations,
      idleModuleNames,
      expectedCustomers,
      sweetSpotWidth,
      fillSpeedMultiplier,
      perfectBonusMultiplier,
      passivePerGuest,
      mochiAutoSave,
      estimatedTotalYen,
      regionalVitality: vitality,
      activeBuffPills,
      seasonMatchWarning: warning,
    };
  }

  public recordServiceMiniGameResult(earnedYenOverride: number, customersServedOverride?: number): {
    earnedYen: number;
    customersServed: number;
  } {
    const summary = this.computeVanBuildSummary();
    const served = customersServedOverride ?? summary.expectedCustomers;
    const earnedYen = Math.max(0, Math.round(earnedYenOverride));
    this.state.yen += earnedYen;
    this.state.customersServedToday += served;
    this.state.customersServedTotal += served;
    this.state.stamina = Math.max(0, this.state.stamina - 20);
    this.state.reputation += Math.round(served * (this.state.personality === 'curator' ? 2 : 1));

    this.addLog(
      `🚐 Served ${served} happy visitors in ${REGION_MAP[this.state.currentRegion].name} (+¥${earnedYen})!`
    );
    this.emit();
    return { earnedYen, customersServed: served };
  }

  public advanceDay(): { seasonChanged: boolean; newSeason: Season; isPrepDay: boolean } {
    this.state.day += 1;
    this.state.dayInCycle += 1;
    this.state.customersServedToday = 0;
    this.state.stamina = this.state.maxStamina;

    let seasonChanged = false;
    if (this.state.dayInCycle === 6) {
      this.state.isPrepDay = true;
      const nextSeason = this.state.season === 'winter' ? 'Green Season 🌱' : 'Winter Powder Season ❄️';
      this.addLog(`🌤️ Day ${this.state.day} (Shoulder Prep Day): Tomorrow the valley transitions to ${nextSeason}! Check your Van Grid & Regional Pivots.`);
    } else if (this.state.dayInCycle > 6) {
      this.state.dayInCycle = 1;
      this.state.isPrepDay = false;
      this.state.season = this.state.season === 'winter' ? 'green' : 'winter';
      seasonChanged = true;
      this.addLog(
        this.state.season === 'green'
          ? `🌱 GREEN SEASON HAS ARRIVED! The snow has melted into lush alpine meadows. Regions with Summer Pivots will thrive!`
          : `❄️ WINTER SEASON HAS ARRIVED! Fresh Hakuba powder blankets the roofs and ski lifts spin to life!`
      );
    } else {
      this.state.isPrepDay = false;
      this.addLog(`☀️ Good morning! Day ${this.state.day} (${this.state.season === 'winter' ? '❄️ Winter' : '🌱 Green'} Day ${this.state.dayInCycle}/6). Stamina restored to ${this.state.stamina}.`);
    }

    this.emit();
    return {
      seasonChanged,
      newSeason: this.state.season,
      isPrepDay: this.state.isPrepDay,
    };
  }
}

export const store = new GameStore();
