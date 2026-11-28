import { store } from '../state/store';
import { PERSONALITIES, REGIONS, REGION_MAP, VAN_MODULES } from '../state/content';
import { Gender, InteractiveZone, PersonalityId, RegionId } from '../state/types';
import { OverworldScene } from '../scenes/OverworldScene';
import { getModuleIllustrationSvg, getProtagonistPortraitSvg, getRegionStampSubtitle } from '../art/hakubaArt';
import {
  mountOnsenPipePuzzle,
  mountPopUpServiceMiniGame,
  mountShuttleLogicPuzzle,
  mountTakibiFirepitPuzzle,
} from '../puzzles/miniPuzzles';
import {
  mountEcholandLanternPuzzle,
  mountGoryuBotanicalPuzzle,
  mountHakuba47PizzaPuzzle,
  mountIwatakeTrailPuzzle,
} from '../puzzles/phase2Puzzles';

export class UIController {
  private scene: OverworldScene;
  private selectedModuleToPlace: string = 'espresso_bar';
  private selectedGender: Gender = 'female';
  private selectedPersonality: PersonalityId = 'barista';

  constructor(scene: OverworldScene) {
    this.scene = scene;
    this.scene.setZoneInteractHandler((zone) => this.handleZoneInteraction(zone));
    this.bindGlobalEvents();
    this.renderAll();

    store.subscribe(() => {
      this.renderAll();
    });

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
    document.querySelectorAll('dialog').forEach((dlg) => {
      dlg.addEventListener('close', () => {
        dlg.returnValue = '';
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
              ? '🌱 Green Season arrived! Check Summer Pivots & Van Gear'
              : '❄️ Powder Winter arrived across Hakuba!'
            : '🌤️ Prep Day! Tomorrow the season shifts'
        );
      } else {
        this.showToast(`☀️ Good morning! Day ${store.getState().day}`);
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
          ? `✨ ${REGION_MAP[st.currentRegion].name} awakened in full color!`
          : `🌿 +${amt} ${item}`
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
        this.showToast(`🚐 Arrived at ${REGION_MAP[zone.targetRegion].name}`);
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
    }, 3400);
  }

  public renderAll(): void {
    const st = store.getState();
    const regDef = REGION_MAP[st.currentRegion];
    const regProg = st.regions[st.currentRegion];
    const pDef = PERSONALITIES.find((p) => p.id === st.personality)!;

    document.documentElement.style.setProperty('--season-accent', st.season === 'winter' ? '#5a8fb8' : '#4d7c5b');

    const dots = Array.from({ length: 6 }, (_, i) => (i < st.dayInCycle ? '●' : '○')).join('');
    const seasonBadge = document.getElementById('hud-season-badge');
    if (seasonBadge) {
      seasonBadge.textContent = `${st.season === 'winter' ? '❄️ Winter' : '🌱 Green'} · ${dots}`;
      seasonBadge.className = `season-pill ${st.season} ${st.isPrepDay ? 'prep-pulse' : ''}`;
    }

    const regionTitle = document.getElementById('hud-region-title');
    if (regionTitle) {
      regionTitle.textContent = `${regDef.number}. ${regDef.name}${regProg.stewardHelped ? ' ✨' : ''}`;
    }

    const vitalityEl = document.getElementById('hud-vitality');
    if (vitalityEl) {
      vitalityEl.textContent = `❄️ ${regProg.vitalityWinter}%  ·  🌱 ${regProg.vitalityGreen}%`;
    }

    const yenEl = document.getElementById('hud-yen');
    if (yenEl) yenEl.textContent = `¥${st.yen.toLocaleString()}`;

    const cozyEl = document.getElementById('hud-cozy');
    if (cozyEl) cozyEl.textContent = `☕ ${st.stamina}/${st.maxStamina}`;

    const playerEl = document.getElementById('hud-player');
    if (playerEl) playerEl.textContent = `${pDef.icon} ${st.playerName}`;

    // Visual Stamp Strip (3 compact interactive chips — zero text walls!)
    const questBox = document.getElementById('hud-quest-summary');
    if (questBox) {
      const fetchDone = regProg.fetchCollected >= regDef.fetchItemRequired;
      const puzzleDone = regProg.puzzleSolved;
      const forageIcon = regDef.zones.find((z) => z.type === 'forage')?.icon || '🪵';

      questBox.innerHTML = `
        <button type="button" class="stamp-chip ${fetchDone ? 'done' : ''}" id="chip-fetch">
          <span>${fetchDone ? '✓' : forageIcon}</span>
          <span>${regDef.fetchItemName} ${regProg.fetchCollected}/${regDef.fetchItemRequired}</span>
        </button>
        <button type="button" class="stamp-chip ${puzzleDone ? 'done' : ''}" id="chip-puzzle">
          <span>${puzzleDone ? '✓' : '⚙️'}</span>
          <span>${regDef.puzzleTitle}</span>
        </button>
        <button type="button" class="stamp-chip ${regProg.greenPivotBuilt ? 'done' : ''}" id="chip-pivot">
          <span>${regProg.greenPivotBuilt ? '✓' : '🌱'}</span>
          <span>${regProg.greenPivotBuilt ? 'Summer Pivot Active' : `Pivot (¥${regDef.greenPivotCost})`}</span>
        </button>
      `;

      document.getElementById('chip-fetch')?.addEventListener('click', () => {
        this.renderStewardModal();
        this.openModalSafely('dialog-steward');
      });
      document.getElementById('chip-puzzle')?.addEventListener('click', () => {
        this.renderPuzzleModal();
        this.openModalSafely('dialog-puzzle');
      });
      document.getElementById('chip-pivot')?.addEventListener('click', () => {
        this.renderStewardModal();
        this.openModalSafely('dialog-steward');
      });
    }
  }

  public renderCharacterSelectModal(): void {
    const container = document.getElementById('char-select-body');
    if (!container) return;

    const portraitSvg = getProtagonistPortraitSvg(this.selectedGender, this.selectedPersonality, 'winter');

    container.innerHTML = `
      <div class="ticket-top-row">
        <div class="ticket-avatar-box">${portraitSvg}</div>
        <div class="ticket-inputs">
          <div class="name-row">
            <label for="input-player-name"><strong>Traveler Name</strong></label>
            <input id="input-player-name" type="text" value="${store.getState().playerName}" maxlength="18" autocomplete="given-name" />
          </div>
          <div class="gender-group" role="group" aria-label="Select Gender">
            <button type="button" class="chip-btn ${this.selectedGender === 'female' ? 'active' : ''}" data-gender="female">Female</button>
            <button type="button" class="chip-btn ${this.selectedGender === 'male' ? 'active' : ''}" data-gender="male">Male</button>
            <button type="button" class="chip-btn ${this.selectedGender === 'nonbinary' ? 'active' : ''}" data-gender="nonbinary">Non-Binary</button>
          </div>
        </div>
      </div>

      <p class="sub-note">Pick your Tokyo vibe — each gives a gentle, cozy perk in Hakuba:</p>
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
            <div class="p-perk-pill">✨ ${p.perkTitle}</div>
          </button>
        `
        ).join('')}
      </div>

      <div class="modal-footer-actions">
        <button type="button" id="btn-confirm-start" class="primary-cta-btn" autofocus>🚐 Board Train to Hakuba</button>
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
      this.showToast(`Welcome to Hakuba, ${name}!`);
    });
  }

  public renderVanInteriorModal(): void {
    const container = document.getElementById('van-interior-body');
    if (!container) return;
    const prevCatalogScroll = container.querySelector('.module-catalog-list')?.scrollTop ?? 0;
    const prevDialogScroll = container.scrollTop;
    const st = store.getState();
    const build = store.computeVanBuildSummary();
    const selectedDef = VAN_MODULES.find((m) => m.id === this.selectedModuleToPlace) || VAN_MODULES[0];

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
          if (!occ.isOrigin) continue;
          const def = VAN_MODULES.find((m) => m.id === occ.moduleId)!;
          const isOffSeason = def.seasonTag !== 'both' && def.seasonTag !== st.season;
          const seasonBadge = isOffSeason ? '💤' : def.seasonTag === 'winter' ? '❄️' : def.seasonTag === 'green' ? '🌱' : '✦';
          const shortTitle = def.name.split('&')[0].trim();
          gridCellsHtml += `
            <div class="van-grid-cell occupied ${isOffSeason ? 'off-season' : ''}" style="--mod-color: ${def.color}; grid-column: span ${def.width};" data-gx="${x}" data-gy="${y}">
              <button type="button" class="cell-remove-btn" data-remove-x="${x}" data-remove-y="${y}" aria-label="Remove ${def.name}">✕</button>
              <span class="cell-badge">${seasonBadge}</span>
              <div class="cell-art">${getModuleIllustrationSvg(def.id)}</div>
              <div class="cell-title">${shortTitle}</div>
            </div>
          `;
        } else {
          const zoneLabel = y === 0 ? 'Counter' : y === 1 ? 'Work' : 'Cozy';
          gridCellsHtml += `
            <button type="button" class="van-grid-cell empty" data-place-x="${x}" data-place-y="${y}" aria-label="Install module at slot ${x + 1}, ${y + 1}">
              <span class="slot-plus">+</span>
              <span class="slot-zone-type">${zoneLabel}</span>
            </button>
          `;
        }
      }
    }

    const canServe = build.activeStations.length > 0;
    const speedPct = Math.round(build.fillSpeedMultiplier * 100);

    container.innerHTML = `
      <div class="van-cutaway-layout">
        <div class="van-left-column">
          <div class="van-chassis-banner">
            <div>
              <strong>${st.vanTier === 1 ? 'Kei Micro-Camper (4×3)' : 'Retro 4WD Overland (6×3)'}</strong>
              <div class="sub-note">${REGION_MAP[st.currentRegion].name} · ${st.season === 'winter' ? '❄️ Winter' : '🌱 Green'}</div>
            </div>
            ${
              st.vanTier === 1
                ? `<button type="button" id="btn-upgrade-chassis" class="secondary-btn">⬆️ Upgrade Van (¥${
                    st.personality === 'tinkerer' ? 680 : 800
                  })</button>`
                : `<span class="chip-btn active">✓ Tier 2 4WD</span>`
            }
          </div>

          <div class="van-cabin-shell">
            <div class="van-fairy-lights" aria-hidden="true">✦ ✦ ✦ ✦ ✦ ✦</div>
            <div class="van-interior-grid" style="--grid-cols: ${st.gridCols}">
              ${gridCellsHtml}
            </div>
          </div>

          <div class="van-build-stats-bar" aria-label="Service Window Build Impact">
            <div class="build-stat-box">
              <span class="bs-label">👥 Guests</span>
              <span class="bs-val">${build.expectedCustomers} / shift</span>
            </div>
            <div class="build-stat-box">
              <span class="bs-label">🎯 Perfect Zone</span>
              <span class="bs-val">${build.sweetSpotWidth}%</span>
            </div>
            <div class="build-stat-box">
              <span class="bs-label">🐢 Pour Speed</span>
              <span class="bs-val">${speedPct}%${speedPct < 100 ? ' (Easier!)' : ''}</span>
            </div>
            <div class="build-stat-box">
              <span class="bs-label">💰 Est. Shift</span>
              <span class="bs-val">¥${build.estimatedTotalYen}</span>
            </div>
          </div>

          ${
            build.activeBuffPills.length > 0
              ? `<div class="active-buffs-strip"><span class="buffs-label">Active Perks:</span>${build.activeBuffPills
                  .map((p) => `<span class="buff-pill">${p}</span>`)
                  .join('')}</div>`
              : ''
          }

          ${build.seasonMatchWarning ? `<div class="season-warning-banner">${build.seasonMatchWarning}</div>` : ''}

          <div class="van-service-launch-bar">
            <div>
              <strong>Menu:</strong> ${
                canServe
                  ? build.activeStations.map((s) => `${s.itemIcon} ¥${s.payout}`).join(' · ')
                  : 'No active stations installed'
              }
            </div>
            <button type="button" id="btn-start-popup-shift" class="primary-cta-btn" ${canServe ? '' : 'disabled'}>☕ Open Service Window</button>
          </div>
        </div>

        <div class="van-catalog-column">
          <h3>Gear &amp; Cozy Shelf</h3>
          <div id="selected-mod-banner" class="selected-mod-banner">
            Selected: <strong>${selectedDef.icon} ${selectedDef.name}</strong> (${selectedDef.width}×1) — tap any <strong>+</strong> slot
          </div>
          <div class="module-catalog-list">
            ${VAN_MODULES.map((m) => {
              const owned = st.ownedModules.includes(m.id);
              const cost = owned ? 0 : st.personality === 'tinkerer' ? Math.round(m.cost * 0.85) : m.cost;
              const isSelected = this.selectedModuleToPlace === m.id;
              const sIcon = m.seasonTag === 'winter' ? '❄️ Winter' : m.seasonTag === 'green' ? '🌱 Green' : '✦ All-Season';
              return `
                <button type="button" class="catalog-item ${isSelected ? 'selected' : ''}" data-select-mod="${m.id}">
                  <div class="cat-art">${getModuleIllustrationSvg(m.id)}</div>
                  <div class="cat-info">
                    <div class="cat-row-top">
                      <span>${m.name}</span>
                      <span class="cat-cost ${owned ? 'owned' : ''}">${owned ? 'Owned' : `¥${cost}`}</span>
                    </div>
                    <div class="cat-meta">${m.width}×1 · ${sIcon}</div>
                    <div class="cat-effect-badges">
                      ${m.effectBadges.map((b) => `<span class="effect-badge">${b}</span>`).join('')}
                    </div>
                  </div>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    // Restore scroll positions so installing/removing items never snaps the shelf back to top
    const newCatalogList = container.querySelector('.module-catalog-list');
    if (newCatalogList) newCatalogList.scrollTop = prevCatalogScroll;
    container.scrollTop = prevDialogScroll;

    // Update selection in-place without re-rendering DOM so scroll stays rock-steady!
    container.querySelectorAll<HTMLButtonElement>('[data-select-mod]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modId = btn.dataset.selectMod!;
        this.selectedModuleToPlace = modId;
        container.querySelectorAll('[data-select-mod]').forEach((el) => {
          el.classList.toggle('selected', (el as HTMLElement).dataset.selectMod === modId);
        });
        const modDef = VAN_MODULES.find((m) => m.id === modId);
        const banner = container.querySelector('#selected-mod-banner');
        if (banner && modDef) {
          banner.innerHTML = `Selected: <strong>${modDef.icon} ${modDef.name}</strong> (${modDef.width}×1) — tap any <strong>+</strong> slot`;
        }
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
    const st = store.getState();
    const build = store.computeVanBuildSummary();
    if (build.activeStations.length === 0) {
      this.showToast('⚠️ Install at least 1 Cafe, Gear, or Craft station in your van first!');
      return;
    }
    const body = document.getElementById('service-minigame-body');
    if (!body) return;

    this.openModalSafely('dialog-service-minigame');
    mountPopUpServiceMiniGame(body, st.season, build, (earnedYen, servedCount) => {
      const res = store.recordServiceMiniGameResult(earnedYen, servedCount);
      this.closeModalSafely('dialog-service-minigame');
      this.showToast(`☕ Served ${res.customersServed} visitors · +¥${res.earnedYen}!`);
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
        <div class="steward-header">
          <div class="steward-avatar">${regDef.zones[0]?.icon || '🏮'}</div>
          <div>
            <h3>${regDef.stewardName}</h3>
            <div class="sub-note">${regDef.stewardTitle} · ${regDef.japaneseName}</div>
          </div>
        </div>

        <blockquote class="steward-dialogue">
          ${
            regProg.stewardHelped
              ? `"Look how warm ${regDef.name} feels now, ${st.playerName}! ${
                  regProg.greenPivotBuilt
                    ? 'Summer and winter travelers both gather here!'
                    : `Let's build "${regDef.greenPivotTitle}" so summer travelers still visit when the snow melts."`
                }"`
              : `"Welcome, ${st.playerName}. ${regDef.questDescription}"`
          }
        </blockquote>

        <div class="steward-checklist">
          <div class="check-row ${regProg.fetchCollected >= regDef.fetchItemRequired ? 'done' : ''}">
            <span>Forage ${regDef.fetchItemName}</span>
            <strong>${regProg.fetchCollected} / ${regDef.fetchItemRequired}</strong>
          </div>
          <div class="check-row ${regProg.puzzleSolved ? 'done' : ''}">
            <span>${regDef.puzzleTitle}</span>
            <strong>${regProg.puzzleSolved ? '✓ Restored' : 'Pending'}</strong>
          </div>
          <div class="check-row ${regProg.greenPivotBuilt ? 'done' : ''}">
            <span>🌱 ${regDef.greenPivotTitle}</span>
            <strong>${regProg.greenPivotBuilt ? '✓ Active' : `¥${regDef.greenPivotCost}`}</strong>
          </div>
        </div>

        <div class="modal-footer-actions">
          ${
            !regProg.puzzleSolved
              ? `<button type="button" id="btn-steward-open-puzzle" class="primary-cta-btn">⚙️ Open Puzzle</button>`
              : ''
          }
          ${
            canWake
              ? `<button type="button" id="btn-steward-wake-now" class="primary-cta-btn">✨ Light Hearth &amp; Wake Region</button>`
              : ''
          }
          ${
            regProg.stewardHelped && !regProg.greenPivotBuilt
              ? `<button type="button" id="btn-steward-build-pivot" class="primary-cta-btn">🌱 Build Summer Pivot (¥${
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
        <div class="steward-dialogue">
          <strong>✅ ${regDef.puzzleTitle}</strong> is humming smoothly!
        </div>
      `;
      return;
    }

    const puzzleCallbacks = {
      onToast: (msg: string) => this.showToast(msg),
      onSolved: (bonusYen = 0) => {
        if (bonusYen > 0) {
          store.getState().yen += bonusYen;
        }
        store.completeRegionPuzzle(st.currentRegion);
        this.closeModalSafely('dialog-puzzle');
        this.showToast(`✨ ${regDef.puzzleTitle} restored${bonusYen > 0 ? ` (+¥${bonusYen} bonus!)` : '!'}`);
      },
    };

    if (regDef.puzzleType === 'pipes') {
      mountOnsenPipePuzzle(body, st.personality, puzzleCallbacks);
    } else if (regDef.puzzleType === 'stove') {
      mountTakibiFirepitPuzzle(body, st.personality, puzzleCallbacks);
    } else if (regDef.puzzleType === 'routes') {
      mountShuttleLogicPuzzle(body, st.personality, puzzleCallbacks);
    } else if (regDef.puzzleType === 'lanterns') {
      mountEcholandLanternPuzzle(body, st.personality, puzzleCallbacks);
    } else if (regDef.puzzleType === 'mtb_trail') {
      mountIwatakeTrailPuzzle(body, st.personality, puzzleCallbacks);
    } else if (regDef.puzzleType === 'botanical') {
      mountGoryuBotanicalPuzzle(body, st.personality, puzzleCallbacks);
    } else {
      mountHakuba47PizzaPuzzle(body, st.personality, puzzleCallbacks);
    }
  }

  public renderValleyAtlasModal(): void {
    const body = document.getElementById('valley-atlas-body');
    if (!body) return;
    const st = store.getState();

    body.innerHTML = `
      <p class="sub-note">Wake up each sub-region and build its Summer Pivot to bring year-round life to Hakuba. Mountain resorts (#5–#7) require the Tier 2 4WD Overland Van.</p>
      <div class="atlas-grid">
        ${REGIONS.map((r) => {
          const prog = st.regions[r.id];
          const isCurrent = st.currentRegion === r.id;
          const needsTier2 = Boolean(r.requiresTier2Van && st.vanTier < 2);
          return `
            <div class="atlas-card ${prog.unlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}">
              <div class="atlas-card-top">
                <span>#${r.number} ${r.name}</span>
                <span class="atlas-status">
                  ${
                    !r.isPlayable
                      ? 'Phase 3'
                      : prog.stewardHelped
                      ? '✨ Awake'
                      : prog.unlocked
                      ? needsTier2
                        ? '⛰️ Needs 4WD'
                        : 'Open'
                      : '🔒 Locked'
                  }
                </span>
              </div>
              <div class="atlas-jp">${r.japaneseName} · ${getRegionStampSubtitle(r.id)}</div>
              <div class="atlas-vitality-bars">
                <span>❄️ Winter ${prog.vitalityWinter}%</span>
                <span>🌱 Green ${prog.vitalityGreen}% ${prog.greenPivotBuilt ? '✓' : ''}</span>
              </div>
              ${
                r.isPlayable && prog.unlocked
                  ? `<button type="button" class="primary-cta-btn" data-drive-to="${r.id}" ${
                      isCurrent ? 'disabled' : ''
                    }>${
                      isCurrent
                        ? '🚐 Parked Here'
                        : needsTier2
                        ? '🏔️ Needs Tier 2 4WD Van'
                        : '🚐 Drive Here'
                    }</button>`
                  : `<div class="atlas-lock-note">${
                      r.isPlayable ? 'Wake previous region to unlock' : `Phase 3 Pivot: ${r.greenPivotTitle}`
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
          this.showToast(`🚐 Drove to ${REGION_MAP[target].name}`);
        } else if (res.reason) {
          this.showToast(res.reason);
        }
      });
    });
  }
}
