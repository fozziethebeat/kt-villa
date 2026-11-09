import { store } from '../state/store';
import { PERSONALITIES, REGIONS, REGION_MAP, VAN_MODULES } from '../state/content';
import { Gender, InteractiveZone, PersonalityId, RegionId } from '../state/types';
import { OverworldScene } from '../scenes/OverworldScene';

export class UIController {
  private scene: OverworldScene;
  private selectedModuleToPlace: string = 'espresso_bar';
  private selectedGender: Gender = 'female';
  private selectedPersonality: PersonalityId = 'barista';

  // Puzzle state
  private pipeAngles: number[] = [90, 180, 90, 270];
  private stoveStep: number = 0;
  private routeAssignments: Record<string, string> = {
    shuttleA: 'unassigned',
    shuttleB: 'unassigned',
    shuttleC: 'unassigned',
  };

  // Tactile Service Mini-game state
  private serviceProgress = 0;
  private serviceMarkerPos = 50;
  private serviceMarkerDir = 1;
  private serviceHits = 0;
  private serviceAttempts = 0;
  private serviceAnimId: number | null = null;

  constructor(scene: OverworldScene) {
    this.scene = scene;
    this.scene.setZoneInteractHandler((zone) => this.handleZoneInteraction(zone));
    this.bindGlobalEvents();
    this.renderAll();

    store.subscribe(() => {
      this.renderAll();
    });

    // Open Character Selection modal on startup
    const charDialog = document.getElementById('dialog-char-select') as HTMLDialogElement | null;
    if (charDialog && !store.getState().started) {
      this.renderCharacterSelectModal();
      charDialog.showModal();
    }
  }

  private openModalSafely(id: string): void {
    const dlg = document.getElementById(id) as HTMLDialogElement | null;
    if (dlg && !dlg.open) {
      dlg.showModal();
    }
  }

  private closeModalSafely(id: string): void {
    const dlg = document.getElementById(id) as HTMLDialogElement | null;
    if (dlg && dlg.open) {
      dlg.close();
      dlg.returnValue = '';
    }
  }

  private bindGlobalEvents(): void {
    // Reset returnValue on all dialogs when closed (per modern-web-guidance dialog rule)
    document.querySelectorAll('dialog').forEach((dlg) => {
      dlg.addEventListener('close', () => {
        dlg.returnValue = '';
        if (dlg.id === 'dialog-service-minigame' && this.serviceAnimId !== null) {
          cancelAnimationFrame(this.serviceAnimId);
          this.serviceAnimId = null;
        }
      });
    });

    document.getElementById('btn-open-van')?.addEventListener('click', () => {
      this.renderVanInteriorModal();
      this.openModalSafely('dialog-van-interior');
    });

    document.getElementById('btn-open-atlas')?.addEventListener('click', () => {
      this.renderValleyAtlasModal();
      this.openModalSafely('dialog-valley-atlas');
    });

    document.getElementById('btn-open-steward')?.addEventListener('click', () => {
      this.renderStewardModal();
      this.openModalSafely('dialog-steward');
    });

    document.getElementById('btn-advance-day')?.addEventListener('click', () => {
      const res = store.advanceDay();
      if (res.seasonChanged || res.isPrepDay) {
        this.showToast(
          res.seasonChanged
            ? res.newSeason === 'green'
              ? '🌱 Green Season has begun! Check Regional Summer Pivots & Van Gear!'
              : '❄️ Winter Powder Season has arrived!'
            : '🌤️ Day 6 Shoulder Prep Day! Season shifts tomorrow—adapt your Van Grid!'
        );
      } else {
        this.showToast(`☀️ Rested in your cozy van! Welcome to Day ${store.getState().day}.`);
      }
    });
  }

  public handleZoneInteraction(zone: InteractiveZone): void {
    const st = store.getState();

    if (zone.type === 'forage') {
      const item = zone.itemReward || REGION_MAP[st.currentRegion].fetchItemName;
      const amt = store.collectForageItem(st.currentRegion, item);
      this.scene.markForageZoneCollected(zone.id);
      const woke = store.checkStewardWakeUp(st.currentRegion);
      this.showToast(
        woke
          ? `✨ Collected +${amt} ${item} & WOKE UP ${REGION_MAP[st.currentRegion].name}!`
          : `🌿 Foraged +${amt} ${item}!`
      );
      return;
    }

    if (zone.type === 'steward' || zone.type === 'hearth') {
      this.renderStewardModal();
      this.openModalSafely('dialog-steward');
      return;
    }

    if (zone.type === 'puzzle') {
      this.renderPuzzleModal();
      this.openModalSafely('dialog-puzzle');
      return;
    }

    if (zone.type === 'parking') {
      this.renderVanInteriorModal();
      this.openModalSafely('dialog-van-interior');
      return;
    }

    if (zone.type === 'pivot') {
      const res = store.buildGreenPivot(st.currentRegion);
      this.showToast(res.message);
      return;
    }

    if (zone.type === 'portal' && zone.targetRegion) {
      const res = store.travelToRegion(zone.targetRegion);
      if (!res.ok && res.reason) {
        this.showToast(`🔒 ${res.reason}`);
      } else {
        this.showToast(`🚐 Drove to ${REGION_MAP[zone.targetRegion].name}!`);
      }
    }
  }

  public showToast(msg: string): void {
    const toast = document.getElementById('cozy-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    window.clearTimeout((toast as unknown as { _timer?: number })._timer);
    (toast as unknown as { _timer?: number })._timer = window.setTimeout(() => {
      toast.classList.remove('visible');
    }, 3600);
  }

  public renderAll(): void {
    const st = store.getState();
    const regDef = REGION_MAP[st.currentRegion];
    const regProg = st.regions[st.currentRegion];
    const pDef = PERSONALITIES.find((p) => p.id === st.personality)!;

    // Update CSS Custom Property for seasonal theme
    document.documentElement.style.setProperty('--season-accent', st.season === 'winter' ? '#38bdf8' : '#10b981');

    // Top HUD
    const seasonBadge = document.getElementById('hud-season-badge');
    if (seasonBadge) {
      seasonBadge.textContent =
        st.season === 'winter'
          ? `❄️ WINTER SEASON • Day ${st.dayInCycle}/6${st.isPrepDay ? ' (PREP DAY!)' : ''}`
          : `🌱 GREEN SEASON • Day ${st.dayInCycle}/6${st.isPrepDay ? ' (PREP DAY!)' : ''}`;
      seasonBadge.className = `season-pill ${st.season} ${st.isPrepDay ? 'prep-pulse' : ''}`;
    }

    const regionTitle = document.getElementById('hud-region-title');
    if (regionTitle) {
      regionTitle.textContent = `${regDef.number}. ${regDef.name} (${regDef.japaneseName})`;
    }

    const wakeStatus = document.getElementById('hud-wake-status');
    if (wakeStatus) {
      wakeStatus.textContent = regProg.stewardHelped ? '✨ Awakened & Vibrant' : '🌫️ Sleepy / Unrestored';
      wakeStatus.className = `wake-pill ${regProg.stewardHelped ? 'awake' : 'sleepy'}`;
    }

    const vitalityEl = document.getElementById('hud-vitality');
    if (vitalityEl) {
      const currentVit = st.season === 'winter' ? regProg.vitalityWinter : regProg.vitalityGreen;
      vitalityEl.textContent = `❄️ Winter ${regProg.vitalityWinter}% | 🌱 Green ${regProg.vitalityGreen}% (Active: ${currentVit}%)`;
    }

    const yenEl = document.getElementById('hud-yen');
    if (yenEl) yenEl.textContent = `¥${st.yen.toLocaleString()}`;

    const cozyEl = document.getElementById('hud-cozy');
    if (cozyEl) cozyEl.textContent = `🏠 Cozy +${st.cozyRating} • ⚡ ${st.stamina}/${st.maxStamina}`;

    const playerEl = document.getElementById('hud-player');
    if (playerEl) playerEl.textContent = `${pDef.icon} ${st.playerName} (${pDef.subtitle})`;

    // Quest & Log Sidebar
    const questBox = document.getElementById('hud-quest-summary');
    if (questBox) {
      const fetchDone = regProg.fetchCollected >= regDef.fetchItemRequired;
      const puzzleDone = regProg.puzzleSolved;
      questBox.innerHTML = `
        <div class="quest-header">
          <span><strong>${regDef.stewardName}:</strong> ${regDef.questTitle}</span>
          <span class="tag">${regProg.stewardHelped ? '✓ Complete' : 'In Progress'}</span>
        </div>
        <div class="quest-steps">
          <span class="${fetchDone ? 'step-done' : ''}">${fetchDone ? '✅' : '⬜'} Forage ${regDef.fetchItemName}: <strong>${regProg.fetchCollected}/${regDef.fetchItemRequired}</strong></span>
          <span class="${puzzleDone ? 'step-done' : ''}">${puzzleDone ? '✅' : '⬜'} Puzzle: <strong>${regDef.puzzleTitle}</strong></span>
          <span class="${regProg.greenPivotBuilt ? 'step-done' : ''}">${regProg.greenPivotBuilt ? '✅' : '🌱'} Green Pivot: <strong>${regDef.greenPivotTitle}</strong> ${regProg.greenPivotBuilt ? '(Built!)' : `(¥${regDef.greenPivotCost})`}</span>
        </div>
      `;
    }

    const logEl = document.getElementById('hud-log-feed');
    if (logEl) {
      logEl.innerHTML = st.log.slice(0, 3).map((item) => `<div class="log-line">• ${item}</div>`).join('');
    }
  }

  public renderCharacterSelectModal(): void {
    const container = document.getElementById('char-select-body');
    if (!container) return;

    container.innerHTML = `
      <div class="char-form-row">
        <label for="input-player-name"><strong>Protagonist Name:</strong></label>
        <input id="input-player-name" type="text" value="${store.getState().playerName}" maxlength="18" autocomplete="given-name" />
        <div class="gender-group" role="group" aria-label="Select Gender">
          <button type="button" class="chip-btn ${this.selectedGender === 'female' ? 'active' : ''}" data-gender="female">👩 Female (Default)</button>
          <button type="button" class="chip-btn ${this.selectedGender === 'male' ? 'active' : ''}" data-gender="male">👨 Male</button>
          <button type="button" class="chip-btn ${this.selectedGender === 'nonbinary' ? 'active' : ''}" data-gender="nonbinary">🧑 Non-Binary</button>
        </div>
      </div>
      <p class="section-hint">Choose your <strong>Tokyo Past Personality</strong> — subtly shapes your Van Business bonuses and village restoration perks:</p>
      <div class="personality-grid">
        ${PERSONALITIES.map(
          (p) => `
          <button type="button" class="personality-card ${this.selectedPersonality === p.id ? 'selected' : ''}" data-personality="${p.id}">
            <div class="p-card-top">
              <span class="p-icon">${p.icon}</span>
              <div>
                <h3>${p.name}</h3>
                <span class="p-sub">${p.subtitle}</span>
              </div>
            </div>
            <p class="p-story">${p.backstory}</p>
            <div class="p-perk">✨ <strong>${p.perkTitle}</strong><br/>${p.perkDesc}</div>
          </button>
        `
        ).join('')}
      </div>
      <div class="modal-footer-actions">
        <button type="button" id="btn-confirm-start" class="primary-cta-btn" autofocus>🚐 Arrive at Hakuba Station & Start Van Life</button>
      </div>
    `;

    container.querySelectorAll('[data-gender]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nameInput = document.getElementById('input-player-name') as HTMLInputElement | null;
        if (nameInput) store.getState().playerName = nameInput.value;
        this.selectedGender = (btn as HTMLElement).dataset.gender as Gender;
        this.renderCharacterSelectModal();
      });
    });

    container.querySelectorAll('[data-personality]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nameInput = document.getElementById('input-player-name') as HTMLInputElement | null;
        if (nameInput) store.getState().playerName = nameInput.value;
        this.selectedPersonality = (btn as HTMLElement).dataset.personality as PersonalityId;
        this.renderCharacterSelectModal();
      });
    });

    document.getElementById('btn-confirm-start')?.addEventListener('click', () => {
      const nameInput = document.getElementById('input-player-name') as HTMLInputElement | null;
      const name = nameInput?.value || 'Yuki';
      store.startNewJourney(name, this.selectedGender, this.selectedPersonality);
      this.closeModalSafely('dialog-char-select');
      this.showToast(`Welcome to Hakuba, ${name}! Walk with WASD/Click or press [Space] by your Van.`);
    });
  }

  public renderVanInteriorModal(): void {
    const container = document.getElementById('van-interior-body');
    if (!container) return;
    const st = store.getState();
    const est = store.calculatePopUpShiftEstimate();

    // Build grid occupancy lookup
    const cellMap: Record<string, { placedId: string; moduleId: string; isOrigin: boolean; width: number }> = {};
    for (const placed of st.placedModules) {
      const def = VAN_MODULES.find((m) => m.id === placed.moduleId)!;
      for (let gx = placed.gridX; gx < placed.gridX + def.width; gx++) {
        for (let gy = placed.gridY; gy < placed.gridY + def.height; gy++) {
          cellMap[`${gx},${gy}`] = {
            placedId: placed.instanceId,
            moduleId: placed.moduleId,
            isOrigin: gx === placed.gridX && gy === placed.gridY,
            width: def.width,
          };
        }
      }
    }

    let gridCellsHtml = '';
    for (let y = 0; y < st.gridRows; y++) {
      for (let x = 0; x < st.gridCols; x++) {
        const occ = cellMap[`${x},${y}`];
        if (occ) {
          if (!occ.isOrigin) continue; // Covered by grid-column: span 2!
          const def = VAN_MODULES.find((m) => m.id === occ.moduleId)!;
          const seasonBadge = def.seasonTag === 'winter' ? '❄️ Winter' : def.seasonTag === 'green' ? '🌱 Green' : '🔄 All-Season';
          gridCellsHtml += `
            <div class="van-grid-cell occupied" style="--mod-color: ${def.color}; grid-column: span ${def.width};" data-gx="${x}" data-gy="${y}">
              <div class="cell-top">
                <span class="cell-icon">${def.icon} <strong>${def.name}</strong></span>
                <span class="cell-season">${seasonBadge}</span>
              </div>
              <div class="cell-purpose">${def.purposeLabel} • Base ¥${def.baseRevenue}</div>
              <div class="cell-bottom-row">
                <span class="cell-coords">Grid Slot (${x + 1}..${x + def.width}, ${y + 1})</span>
                <button type="button" class="cell-remove-btn" data-remove-x="${x}" data-remove-y="${y}" aria-label="Remove ${def.name}">✕ Unplug</button>
              </div>
            </div>
          `;
        } else {
          const slotZoneLabel = y === 0 ? 'Service Window Counter' : y === 1 ? 'Mid Utility Floor' : 'Cozy Living Floor';
          gridCellsHtml += `
            <button type="button" class="van-grid-cell empty" data-place-x="${x}" data-place-y="${y}">
              <span class="slot-coord">Slot (${x + 1}, ${y + 1})</span>
              <span class="slot-zone-type">${slotZoneLabel}</span>
              <span class="slot-cta">+ Install Selected</span>
            </button>
          `;
        }
      }
    }

    container.innerHTML = `
      <div class="van-cutaway-layout">
        <div class="van-left-column">
          <div class="van-chassis-banner">
            <div>
              <strong>${st.vanTier === 1 ? '🚐 Tier 1 Kei Micro-Camper (4x3 Grid)' : '🚐 Tier 2 Retro 4WD Overland (6x3 Grid + Roof Tent)'}</strong>
              <div class="sub-note">Parked at: ${REGION_MAP[st.currentRegion].name} • Season: ${st.season === 'winter' ? '❄️ Winter' : '🌱 Green Season'}</div>
            </div>
            ${
              st.vanTier === 1
                ? `<button type="button" id="btn-upgrade-chassis" class="secondary-btn">⬆️ Upgrade to Tier 2 4WD Van (¥${
                    st.personality === 'tinkerer' ? 680 : 800
                  })</button>`
                : `<span class="badge-max">✓ Max Tier 2 Chassis</span>`
            }
          </div>

          <div class="van-interior-grid" style="--grid-cols: ${st.gridCols}">
            ${gridCellsHtml}
          </div>

          ${est.seasonMatchWarning ? `<div class="season-warning-banner">${est.seasonMatchWarning}</div>` : ''}

          <div class="van-service-launch-bar">
            <div>
              <strong>Pop-Up Shop Forecast:</strong> ~${est.expectedCustomers} Customers • Est. <strong>¥${
      est.expectedCustomers * est.revenuePerCustomer
    }</strong> per shift (Region Vitality: ${est.regionalVitality}%)
            </div>
            <button type="button" id="btn-start-popup-shift" class="primary-cta-btn">🛎️ Open Service Window & Run Pop-Up Shift!</button>
          </div>
        </div>

        <div class="van-catalog-column">
          <h3>📦 Mix & Match Module Catalog</h3>
          <p class="sub-note">1. Select a module below → 2. Click any Van Grid slot on the left to install or swap:</p>
          <div class="module-catalog-list">
            ${VAN_MODULES.map((m) => {
              const owned = st.ownedModules.includes(m.id);
              const cost = owned ? 0 : st.personality === 'tinkerer' ? Math.round(m.cost * 0.85) : m.cost;
              const isSelected = this.selectedModuleToPlace === m.id;
              return `
                <button type="button" class="catalog-item ${isSelected ? 'selected' : ''}" data-select-mod="${m.id}">
                  <div class="cat-row-top">
                    <span><strong>${m.icon} ${m.name}</strong></span>
                    <span class="cat-cost ${owned ? 'owned' : ''}">${owned ? '✓ Owned (Free Swap)' : `¥${cost}`}</span>
                  </div>
                  <div class="cat-purpose">${m.purposeLabel} • Base ¥${m.baseRevenue}</div>
                  <div class="cat-desc">${m.description}</div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('[data-select-mod]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.selectedModuleToPlace = (btn as HTMLElement).dataset.selectMod!;
        this.renderVanInteriorModal();
      });
    });

    container.querySelectorAll('[data-place-x]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gx = Number((btn as HTMLElement).dataset.placeX);
        const gy = Number((btn as HTMLElement).dataset.placeY);
        const res = store.buyOrPlaceVanModule(this.selectedModuleToPlace, gx, gy);
        this.showToast(res.message);
        this.renderVanInteriorModal();
      });
    });

    container.querySelectorAll('[data-remove-x]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const gx = Number((btn as HTMLElement).dataset.removeX);
        const gy = Number((btn as HTMLElement).dataset.removeY);
        store.removeVanModuleAt(gx, gy);
        this.renderVanInteriorModal();
      });
    });

    document.getElementById('btn-upgrade-chassis')?.addEventListener('click', () => {
      const res = store.upgradeVanChassis();
      this.showToast(res.message);
      this.renderVanInteriorModal();
    });

    document.getElementById('btn-start-popup-shift')?.addEventListener('click', () => {
      this.closeModalSafely('dialog-van-interior');
      this.startTactileServiceMiniGame();
    });
  }

  private startTactileServiceMiniGame(): void {
    this.serviceProgress = 0;
    this.serviceHits = 0;
    this.serviceAttempts = 0;
    this.serviceMarkerPos = 15;
    this.serviceMarkerDir = 1;

    const st = store.getState();
    const pDef = PERSONALITIES.find((p) => p.id === st.personality)!;
    // Barista gets a wider sweet spot (30% vs 22%)
    const sweetSpotStart = 38;
    const sweetSpotWidth = st.personality === 'barista' ? 28 : 22;

    const body = document.getElementById('service-minigame-body');
    if (!body) return;

    body.innerHTML = `
      <div class="minigame-stage">
        <p class="sub-note">
          Customers are lining up outside your van in <strong>${REGION_MAP[st.currentRegion].name}</strong>!
          Click <strong>"Serve Order!"</strong> (or press Space) when the indicator is inside the Golden Sweet Spot (3 orders total).
        </p>
        <div class="order-tickets">
          <span class="ticket">☕ Nagano Pour-Over</span>
          <span class="ticket">${st.season === 'winter' ? '🎿 Hot Powder Wax' : '🚵 Trail Bike Tune'}</span>
          <span class="ticket">${st.season === 'winter' ? '🥟 Steamed Oyaki' : '🍨 Highland Gelato'}</span>
        </div>
        <div class="timing-bar-track">
          <div class="timing-sweet-spot" style="left: ${sweetSpotStart}%; width: ${sweetSpotWidth}%">
            <span>★ GOLDEN CREMA / WAX ZONE ★</span>
          </div>
          <div id="timing-marker" class="timing-marker" style="left: 15%">▼</div>
        </div>
        <div id="service-score-readout" class="service-readout">
          Orders Completed: <strong>0 / 3</strong> (${pDef.name} Bonus Active)
        </div>
        <div class="modal-footer-actions">
          <button type="button" id="btn-hit-serve" class="primary-cta-btn" autofocus>🛎️ Serve Order Now!</button>
          <button type="button" id="btn-quick-auto-serve" class="secondary-btn">⚡ Quick Auto-Complete Shift</button>
        </div>
      </div>
    `;

    this.openModalSafely('dialog-service-minigame');

    const markerEl = document.getElementById('timing-marker');
    const readoutEl = document.getElementById('service-score-readout');

    const stepAnim = () => {
      this.serviceMarkerPos += this.serviceMarkerDir * 1.45;
      if (this.serviceMarkerPos >= 96) this.serviceMarkerDir = -1;
      if (this.serviceMarkerPos <= 4) this.serviceMarkerDir = 1;
      if (markerEl) {
        markerEl.style.left = `${this.serviceMarkerPos}%`;
      }
      this.serviceAnimId = requestAnimationFrame(stepAnim);
    };
    this.serviceAnimId = requestAnimationFrame(stepAnim);

    const finishShift = (multiplier: number) => {
      if (this.serviceAnimId !== null) {
        cancelAnimationFrame(this.serviceAnimId);
        this.serviceAnimId = null;
      }
      const res = store.recordServiceMiniGameResult(multiplier);
      this.closeModalSafely('dialog-service-minigame');
      this.showToast(`🎉 Served ${res.customersServed} visitors and earned ¥${res.earnedYen}!`);
    };

    document.getElementById('btn-hit-serve')?.addEventListener('click', () => {
      this.serviceAttempts++;
      const inSweetSpot =
        this.serviceMarkerPos >= sweetSpotStart && this.serviceMarkerPos <= sweetSpotStart + sweetSpotWidth;
      if (inSweetSpot) {
        this.serviceHits++;
      }
      if (readoutEl) {
        readoutEl.innerHTML = `Orders Completed: <strong>${this.serviceAttempts} / 3</strong> — ${
          inSweetSpot ? '✨ PERFECT GOLDEN CRAFT!' : '👍 Good Service!'
        }`;
      }
      if (this.serviceAttempts >= 3) {
        const mult = 1.0 + this.serviceHits * 0.2;
        window.setTimeout(() => finishShift(mult), 350);
      }
    });

    document.getElementById('btn-quick-auto-serve')?.addEventListener('click', () => {
      finishShift(1.35);
    });
  }

  public renderStewardModal(): void {
    const body = document.getElementById('steward-modal-body');
    if (!body) return;
    const st = store.getState();
    const regDef = REGION_MAP[st.currentRegion];
    const regProg = st.regions[st.currentRegion];

    const canWake = regProg.fetchCollected >= regDef.fetchItemRequired && regProg.puzzleSolved && !regProg.stewardHelped;

    body.innerHTML = `
      <div class="steward-card">
        <div class="steward-header" style="--steward-color: ${regDef.stewardPortraitColor}">
          <div class="steward-avatar">${regDef.zones[0]?.icon || '🧑‍🌾'}</div>
          <div>
            <h3>${regDef.stewardName} — <small>${regDef.stewardTitle}</small></h3>
            <div class="sub-note">${regDef.name} (${regDef.japaneseName})</div>
          </div>
        </div>

        <blockquote class="steward-dialogue">
          ${
            regProg.stewardHelped
              ? `"Thank you, ${st.playerName}! Look how warm and colorful ${regDef.name} has become! ${
                  regProg.greenPivotBuilt
                    ? 'Our Green Season Pivot is thriving too—visitors come in both snow and summer now!'
                    : `When Green Season arrives, ski tourists drop off sharply—let's build the ${regDef.greenPivotTitle} so we thrive year-round!`
                }"`
              : `"Welcome to ${regDef.name}, ${st.playerName}. Ever since the old days, this area has fallen quiet and grey. ${regDef.questDescription}"`
          }
        </blockquote>

        <div class="steward-checklist">
          <div class="check-row ${regProg.fetchCollected >= regDef.fetchItemRequired ? 'done' : ''}">
            <span>1. Forage <strong>${regDef.fetchItemName}</strong> around ${regDef.name}</span>
            <strong>${regProg.fetchCollected} / ${regDef.fetchItemRequired}</strong>
          </div>
          <div class="check-row ${regProg.puzzleSolved ? 'done' : ''}">
            <span>2. Complete Restoration Puzzle: <strong>${regDef.puzzleTitle}</strong></span>
            <strong>${regProg.puzzleSolved ? '✓ Solved' : 'Incomplete'}</strong>
          </div>
          <div class="check-row ${regProg.greenPivotBuilt ? 'done' : ''}">
            <span>3. 🌱 Green Season Pivot: <strong>${regDef.greenPivotTitle}</strong></span>
            <strong>${regProg.greenPivotBuilt ? '✓ Active (+Summer Vitality!)' : `¥${regDef.greenPivotCost}`}</strong>
          </div>
        </div>

        <div class="modal-footer-actions">
          ${
            !regProg.puzzleSolved
              ? `<button type="button" id="btn-steward-open-puzzle" class="primary-cta-btn">⚙️ Open ${regDef.puzzleTitle}</button>`
              : ''
          }
          ${
            canWake
              ? `<button type="button" id="btn-steward-wake-now" class="primary-cta-btn">✨ Ignite Hearth & Wake Up ${regDef.name}!</button>`
              : ''
          }
          ${
            regProg.stewardHelped && !regProg.greenPivotBuilt
              ? `<button type="button" id="btn-steward-build-pivot" class="primary-cta-btn">🌱 Build ${regDef.greenPivotTitle} (¥${
                  st.personality === 'tinkerer' ? Math.round(regDef.greenPivotCost * 0.85) : regDef.greenPivotCost
                })</button>`
              : ''
          }
        </div>
      </div>
    `;

    document.getElementById('btn-steward-open-puzzle')?.addEventListener('click', () => {
      this.closeModalSafely('dialog-steward');
      this.renderPuzzleModal();
      this.openModalSafely('dialog-puzzle');
    });

    document.getElementById('btn-steward-wake-now')?.addEventListener('click', () => {
      store.checkStewardWakeUp(st.currentRegion);
      this.renderStewardModal();
    });

    document.getElementById('btn-steward-build-pivot')?.addEventListener('click', () => {
      const res = store.buildGreenPivot(st.currentRegion);
      this.showToast(res.message);
      this.renderStewardModal();
    });
  }

  public renderPuzzleModal(): void {
    const body = document.getElementById('puzzle-modal-body');
    if (!body) return;
    const st = store.getState();
    const regDef = REGION_MAP[st.currentRegion];
    const regProg = st.regions[st.currentRegion];

    if (regProg.puzzleSolved) {
      body.innerHTML = `
        <div class="puzzle-solved-card">
          <h3>✅ ${regDef.puzzleTitle} — Restored!</h3>
          <p>The mechanism is humming warmly. Make sure you also collect ${regDef.fetchItemRequired} ${regDef.fetchItemName} to complete ${regDef.stewardName}'s regional restoration!</p>
        </div>
      `;
      return;
    }

    if (regDef.puzzleType === 'pipes') {
      const allAligned = this.pipeAngles.every((a) => a % 180 === 0);
      body.innerHTML = `
        <div class="puzzle-container">
          <h3>♨️ ${regDef.puzzleTitle}</h3>
          <p class="sub-note">Rotate each thermal spring valve until all 4 conduits align horizontally (<code>━</code>) to feed hot mineral water into the Hakuba Station Footbath!</p>
          <div class="pipe-grid">
            ${this.pipeAngles
              .map(
                (angle, idx) => `
              <button type="button" class="pipe-tile ${angle % 180 === 0 ? 'aligned' : ''}" data-pipe-idx="${idx}">
                <span class="pipe-symbol" style="transform: rotate(${angle}deg)">━</span>
                <span class="pipe-label">Valve #${idx + 1} (${angle % 180 === 0 ? 'Aligned ✓' : 'Blocked'})</span>
              </button>
            `
              )
              .join('')}
          </div>
          <div class="modal-footer-actions">
            <button type="button" id="btn-instant-solve-puzzle" class="secondary-btn">✨ Cozy Hint: Align All Valves</button>
          </div>
        </div>
      `;

      body.querySelectorAll('[data-pipe-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number((btn as HTMLElement).dataset.pipeIdx);
          this.pipeAngles[idx] = (this.pipeAngles[idx] + 90) % 360;
          if (this.pipeAngles.every((a) => a % 180 === 0)) {
            store.completeRegionPuzzle(st.currentRegion);
            this.closeModalSafely('dialog-puzzle');
            this.showToast(`♨️ Thermal pipes aligned! The station footbath is steaming!`);
          } else {
            this.renderPuzzleModal();
          }
        });
      });
    } else if (regDef.puzzleType === 'stove') {
      const steps = [
        '1. Place Heavy Stainless Base Plate',
        '2. Unfold Hexagonal Titanium Firebox Cone',
        '3. Stack Seasoned Hakuba White Birch Logs',
        '4. Strike Flint & Ignite the Community Takibi Hearth!',
      ];
      body.innerHTML = `
        <div class="puzzle-container">
          <h3>🔥 ${regDef.puzzleTitle}</h3>
          <p class="sub-note">Assemble Aoi's modular Takibi firepit in sequence (${this.stoveStep} / 4 steps complete):</p>
          <div class="stove-steps-list">
            ${steps
              .map(
                (label, idx) => `
              <button type="button" class="stove-step-btn ${idx < this.stoveStep ? 'done' : idx === this.stoveStep ? 'next' : ''}" data-stove-idx="${idx}" ${
                  idx !== this.stoveStep ? 'disabled' : ''
                }>
                ${idx < this.stoveStep ? '✅' : idx === this.stoveStep ? '👉' : '🔒'} ${label}
              </button>
            `
              )
              .join('')}
          </div>
          <div class="modal-footer-actions">
            <button type="button" id="btn-instant-solve-puzzle" class="secondary-btn">✨ Complete Takibi Assembly</button>
          </div>
        </div>
      `;

      body.querySelectorAll('[data-stove-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.stoveStep++;
          if (this.stoveStep >= 4) {
            store.completeRegionPuzzle(st.currentRegion);
            this.closeModalSafely('dialog-puzzle');
            this.showToast(`🔥 Takibi Hearth assembled! Golden warmth radiates across Snow Peak lawn.`);
          } else {
            this.renderPuzzleModal();
          }
        });
      });
    } else {
      // Routes puzzle for Happo-One Bus Terminal
      body.innerHTML = `
        <div class="puzzle-container">
          <h3>🗺️ ${regDef.puzzleTitle}</h3>
          <p class="sub-note">Connect the 3 Alpine Shuttle bays so skiers and summer hikers can reach every corner of the valley:</p>
          <div class="route-puzzle-rows">
            <div class="route-row">
              <span>🚌 <strong>Bay 1 (Express Gondola Line):</strong></span>
              <button type="button" class="chip-btn ${this.routeAssignments.shuttleA === 'matched' ? 'active' : ''}" data-route="shuttleA">
                ${this.routeAssignments.shuttleA === 'matched' ? '✓ Routed to Happo Usagidaira Gondola' : 'Click to Connect → Happo Gondola'}
              </button>
            </div>
            <div class="route-row">
              <span>🚌 <strong>Bay 2 (Night & Cafe Loop):</strong></span>
              <button type="button" class="chip-btn ${this.routeAssignments.shuttleB === 'matched' ? 'active' : ''}" data-route="shuttleB">
                ${this.routeAssignments.shuttleB === 'matched' ? '✓ Routed to Echoland & Iwatake' : 'Click to Connect → Echoland & Iwatake'}
              </button>
            </div>
            <div class="route-row">
              <span>🚌 <strong>Bay 3 (South Valley & Lake Line):</strong></span>
              <button type="button" class="chip-btn ${this.routeAssignments.shuttleC === 'matched' ? 'active' : ''}" data-route="shuttleC">
                ${this.routeAssignments.shuttleC === 'matched' ? '✓ Routed to Goryu, Hakuba 47 & Aokiko' : 'Click to Connect → Goryu, 47 & Lake Aokiko'}
              </button>
            </div>
          </div>
          <div class="modal-footer-actions">
            <button type="button" id="btn-instant-solve-puzzle" class="secondary-btn">✨ Dispatch All Shuttles</button>
          </div>
        </div>
      `;

      body.querySelectorAll('[data-route]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = (btn as HTMLElement).dataset.route!;
          this.routeAssignments[key] = 'matched';
          if (Object.values(this.routeAssignments).every((v) => v === 'matched')) {
            store.completeRegionPuzzle(st.currentRegion);
            this.closeModalSafely('dialog-puzzle');
            this.showToast(`🚌 All Valley Shuttle Lines connected! Happo Terminal is bustling!`);
          } else {
            this.renderPuzzleModal();
          }
        });
      });
    }

    document.getElementById('btn-instant-solve-puzzle')?.addEventListener('click', () => {
      store.completeRegionPuzzle(st.currentRegion);
      this.closeModalSafely('dialog-puzzle');
      this.showToast(`✨ Solved ${regDef.puzzleTitle}!`);
    });
  }

  public renderValleyAtlasModal(): void {
    const body = document.getElementById('valley-atlas-body');
    if (!body) return;
    const st = store.getState();

    body.innerHTML = `
      <p class="sub-note">
        <strong>Hakuba Valley 10-Region Restoration Roadmap:</strong> Help the Steward in each sub-region to unlock connected hubs and build Green Season Pivots for year-round vitality.
      </p>
      <div class="atlas-grid">
        ${REGIONS.map((r) => {
          const prog = st.regions[r.id];
          const isCurrent = st.currentRegion === r.id;
          return `
            <div class="atlas-card ${prog.unlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}">
              <div class="atlas-card-top">
                <span class="atlas-num">#${r.number} ${r.name}</span>
                <span class="atlas-status">
                  ${
                    !r.unlockedInPhase1
                      ? '🔒 Phase 2/3'
                      : prog.stewardHelped
                      ? '✨ Awakened'
                      : prog.unlocked
                      ? '🟢 Open'
                      : '🔒 Locked'
                  }
                </span>
              </div>
              <div class="atlas-jp">${r.japaneseName} • Steward: ${r.stewardName}</div>
              <p class="atlas-desc">${r.tagline}</p>
              <div class="atlas-vitality-bars">
                <span>❄️ Winter: <strong>${prog.vitalityWinter}%</strong></span>
                <span>🌱 Green: <strong>${prog.vitalityGreen}%</strong> ${prog.greenPivotBuilt ? '(Pivot ✓)' : ''}</span>
              </div>
              ${
                r.unlockedInPhase1 && prog.unlocked
                  ? `<button type="button" class="primary-cta-btn atlas-drive-btn" data-drive-to="${r.id}" ${
                      isCurrent ? 'disabled' : ''
                    }>${isCurrent ? '🚐 Currently Parked Here' : `🚐 Drive Van to ${r.name}`}</button>`
                  : `<div class="atlas-lock-note">${
                      r.unlockedInPhase1 ? 'Wake up previous region to unlock road' : `Planned Expansion: ${r.greenPivotTitle}`
                    }</div>`
              }
            </div>
          `;
        }).join('')}
      </div>
    `;

    body.querySelectorAll('[data-drive-to]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = (btn as HTMLElement).dataset.driveTo as RegionId;
        const res = store.travelToRegion(target);
        if (res.ok) {
          this.closeModalSafely('dialog-valley-atlas');
          this.showToast(`🚐 Drove your camper van to ${REGION_MAP[target].name}!`);
        }
      });
    });
  }
}
