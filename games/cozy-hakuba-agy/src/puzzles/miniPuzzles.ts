import { PersonalityId, Season, VanBuildSummary } from '../state/types';

export interface PuzzleCallbacks {
  onSolved: (bonusYen?: number, message?: string) => void;
  onToast: (msg: string) => void;
}

/* ============================================================================
 * PUZZLE 1 (Hakuba Station): 4x4 Thermal Hot-Spring Conduit Flow Puzzle
 * Features live BFS water propagation, rotating SVG ceramic pipe tiles,
 * fixed river stones, and a bonus mineral valve for extra yen!
 * ========================================================================== */

type PipeKind = 'straight' | 'elbow' | 'tee' | 'stone' | 'source' | 'bath';

interface PipeCell {
  kind: PipeKind;
  rot: number; // 0, 90, 180, 270
  locked?: boolean;
  bonus?: boolean;
}

// Base openings at rot=0: [Top, Right, Bottom, Left]
const BASE_OPENINGS: Record<PipeKind, [boolean, boolean, boolean, boolean]> = {
  straight: [false, true, false, true], // Left-Right
  elbow: [false, true, true, false],    // Right-Bottom
  tee: [false, true, true, true],       // Right-Bottom-Left
  stone: [false, false, false, false],
  source: [false, true, true, false],   // Outputs Right & Bottom
  bath: [true, false, false, true],     // Accepts Top & Left
};

function getOpenings(kind: PipeKind, rot: number): [boolean, boolean, boolean, boolean] {
  const base = BASE_OPENINGS[kind];
  const steps = ((rot / 90) % 4 + 4) % 4;
  const out: [boolean, boolean, boolean, boolean] = [false, false, false, false];
  for (let i = 0; i < 4; i++) {
    out[(i + steps) % 4] = base[i];
  }
  return out;
}

function createInitialPipeBoard(): PipeCell[] {
  // 4x4 grid (indices 0..15). Solvable via direct bottom route OR scenic top route through the ✨ Mineral Valve at (2,1)!
  return [
    { kind: 'source', rot: 0, locked: true },     // 0 (0,0) outputs R, B
    { kind: 'elbow', rot: 0 },                    // 1 (1,0) needs 90 (L, B)
    { kind: 'straight', rot: 90 },                // 2 (2,0)
    { kind: 'stone', rot: 0, locked: true },      // 3 (3,0)

    { kind: 'elbow', rot: 180 },                  // 4 (0,1)
    { kind: 'tee', rot: 180 },                    // 5 (1,1) needs 270 (T, R, B)
    { kind: 'elbow', rot: 0, bonus: true },       // 6 (2,1) ✨ Mineral Valve! needs 90 (L, B)
    { kind: 'elbow', rot: 270 },                  // 7 (3,1)

    { kind: 'stone', rot: 0, locked: true },      // 8 (0,2)
    { kind: 'elbow', rot: 90 },                   // 9 (1,2)
    { kind: 'tee', rot: 0 },                      // 10 (2,2) needs 270 (T, R, B)
    { kind: 'elbow', rot: 270 },                  // 11 (3,2) needs 90 (L, B)

    { kind: 'elbow', rot: 0 },                    // 12 (0,3)
    { kind: 'straight', rot: 90 },                // 13 (1,3)
    { kind: 'elbow', rot: 180 },                  // 14 (2,3)
    { kind: 'bath', rot: 0, locked: true },       // 15 (3,3) accepts T, L
  ];
}

function computeWetCells(board: PipeCell[]): Set<number> {
  const wet = new Set<number>([0]);
  const queue: number[] = [0];
  const dirs = [
    { dr: -1, dc: 0, outIdx: 0, inIdx: 2 }, // Top
    { dr: 0, dc: 1, outIdx: 1, inIdx: 3 },  // Right
    { dr: 1, dc: 0, outIdx: 2, inIdx: 0 },  // Bottom
    { dr: 0, dc: -1, outIdx: 3, inIdx: 1 }, // Left
  ];

  while (queue.length > 0) {
    const idx = queue.shift()!;
    const r = Math.floor(idx / 4);
    const c = idx % 4;
    const cell = board[idx];
    const open = getOpenings(cell.kind, cell.rot);

    for (const d of dirs) {
      if (!open[d.outIdx]) continue;
      const nr = r + d.dr;
      const nc = c + d.dc;
      if (nr < 0 || nr >= 4 || nc < 0 || nc >= 4) continue;
      const nIdx = nr * 4 + nc;
      if (wet.has(nIdx)) continue;
      const nCell = board[nIdx];
      const nOpen = getOpenings(nCell.kind, nCell.rot);
      if (nOpen[d.inIdx]) {
        wet.add(nIdx);
        queue.push(nIdx);
      }
    }
  }
  return wet;
}

function renderPipeSvg(cell: PipeCell, isWet: boolean): string {
  const pipeOuter = '#4A3B32';
  const pipeFill = isWet ? '#5EB5BA' : '#D9CBB5';
  const innerHighlight = isWet ? '#B8ECEF' : '#EDE4D5';

  if (cell.kind === 'stone') {
    return `
      <svg viewBox="0 0 64 64" width="54" height="54" aria-hidden="true">
        <ellipse cx="32" cy="40" rx="22" ry="14" fill="#9E968D" stroke="#4A3B32" stroke-width="2.2"/>
        <ellipse cx="26" cy="34" rx="12" ry="8" fill="#B8B0A6"/>
        <path d="M22 24 Q26 16 32 22 Q38 15 42 24" fill="#5D8C6A" stroke="#4A3B32" stroke-width="1.6"/>
      </svg>
    `;
  }

  if (cell.kind === 'source') {
    return `
      <svg viewBox="0 0 64 64" width="54" height="54" aria-hidden="true">
        <path d="M32 32 H64 M32 32 V64" stroke="${pipeOuter}" stroke-width="18" stroke-linecap="round"/>
        <path d="M32 32 H64 M32 32 V64" stroke="#5EB5BA" stroke-width="12" stroke-linecap="round"/>
        <circle cx="30" cy="30" r="19" fill="#5EB5BA" stroke="#4A3B32" stroke-width="2.5"/>
        <text x="30" y="36" text-anchor="middle" font-size="18">♨️</text>
      </svg>
    `;
  }

  if (cell.kind === 'bath') {
    return `
      <svg viewBox="0 0 64 64" width="54" height="54" aria-hidden="true">
        <path d="M0 32 H32 M32 0 V32" stroke="${pipeOuter}" stroke-width="18" stroke-linecap="round"/>
        <path d="M0 32 H32 M32 0 V32" stroke="${pipeFill}" stroke-width="12" stroke-linecap="round"/>
        <rect x="12" y="14" width="42" height="38" rx="10" fill="#A67249" stroke="#4A3B32" stroke-width="2.5"/>
        <rect x="17" y="19" width="32" height="28" rx="7" fill="${isWet ? '#5EB5BA' : '#D9CBB5'}"/>
        <text x="33" y="38" text-anchor="middle" font-size="16">${isWet ? '✨' : '🛁'}</text>
      </svg>
    `;
  }

  let pathD = '';
  if (cell.kind === 'straight') pathD = 'M0 32 H64';
  if (cell.kind === 'elbow') pathD = 'M64 32 Q32 32 32 64';
  if (cell.kind === 'tee') pathD = 'M0 32 H64 M32 32 V64';

  return `
    <svg viewBox="0 0 64 64" width="54" height="54" style="transform: rotate(${cell.rot}deg); transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);" aria-hidden="true">
      <path d="${pathD}" fill="none" stroke="${pipeOuter}" stroke-width="18" stroke-linecap="butt" stroke-linejoin="round"/>
      <path d="${pathD}" fill="none" stroke="${pipeFill}" stroke-width="12" stroke-linecap="butt" stroke-linejoin="round"/>
      <path d="${pathD}" fill="none" stroke="${innerHighlight}" stroke-width="3.5" stroke-dasharray="${isWet ? '6 6' : 'none'}" opacity="0.75"/>
      ${cell.bonus ? '<circle cx="32" cy="32" r="8" fill="#E6A23C" stroke="#4A3B32" stroke-width="2"/>' : ''}
    </svg>
  `;
}

export function mountOnsenPipePuzzle(
  container: HTMLElement,
  personality: PersonalityId,
  callbacks: PuzzleCallbacks
): void {
  const board = createInitialPipeBoard();
  let moves = 0;
  let solved = false;

  const render = () => {
    const wet = computeWetCells(board);
    const bathReached = wet.has(15);
    const bonusReached = wet.has(6);

    container.innerHTML = `
      <div class="puzzle-shell">
        <div class="puzzle-top-info">
          <p class="sub-note">
            Rotate the ceramic pipes to carry hot spring water from <strong>♨️ Source</strong> to the <strong>🛁 Ashiyu Footbath</strong>.
            Route through the golden <strong>✨ Mineral Valve</strong> for a +¥80 bonus!
          </p>
          <div class="puzzle-status-pills">
            <span class="chip-btn ${bonusReached ? 'active' : ''}">✨ Mineral Valve ${bonusReached ? 'Connected!' : 'Optional'}</span>
            <span class="chip-btn">Turns: ${moves}</span>
          </div>
        </div>

        <div class="onsen-pipe-grid">
          ${board
            .map((cell, idx) => {
              const isWet = wet.has(idx);
              const tinkerHint = personality === 'tinkerer' && idx === 6 && !isWet;
              return `
                <button
                  type="button"
                  class="onsen-tile ${isWet ? 'wet' : ''} ${cell.locked ? 'locked' : ''} ${tinkerHint ? 'hint-glow' : ''}"
                  data-idx="${idx}"
                  ${cell.locked || solved ? 'disabled' : ''}
                  aria-label="Pipe tile ${idx + 1}${isWet ? ', filled with hot water' : ''}"
                >
                  ${renderPipeSvg(cell, isWet)}
                  ${cell.bonus ? '<span class="tile-mini-tag">✨</span>' : ''}
                </button>
              `;
            })
            .join('')}
        </div>

        <div class="modal-footer-actions">
          <button type="button" id="btn-reset-pipes" class="secondary-btn">↺ Reset Pipes</button>
          <button type="button" id="btn-instant-solve-puzzle" class="secondary-btn">✨ Cozy Hint (Auto-Connect)</button>
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLButtonElement>('[data-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (solved) return;
        const idx = Number(btn.dataset.idx);
        board[idx].rot = (board[idx].rot + 90) % 360;
        moves++;
        const nextWet = computeWetCells(board);
        render();
        if (nextWet.has(15)) {
          solved = true;
          const gotBonus = nextWet.has(6);
          const bonusYen = gotBonus ? 80 : 0;
          callbacks.onToast(
            gotBonus
              ? '♨️ Steaming perfection! Connected the Mineral Valve (+¥80 bonus)!'
              : '♨️ Warm spring water reached the Hakuba Station Footbath!'
          );
          window.setTimeout(() => callbacks.onSolved(bonusYen), 650);
        }
      });
    });

    container.querySelector('#btn-reset-pipes')?.addEventListener('click', () => {
      const fresh = createInitialPipeBoard();
      board.splice(0, board.length, ...fresh);
      moves = 0;
      render();
    });

    container.querySelector('#btn-instant-solve-puzzle')?.addEventListener('click', () => {
      if (solved) return;
      // Clean scenic path through the ✨ Mineral Valve!
      board[1].rot = 90;  // L, B
      board[5].rot = 270; // T, R, B
      board[6].rot = 90;  // L, B (Mineral Valve)
      board[10].rot = 270; // T, R, B
      board[11].rot = 90; // L, B -> Bath
      solved = true;
      render();
      window.setTimeout(() => callbacks.onSolved(80), 600);
    });
  };

  render();
}

/* ============================================================================
 * PUZZLE 2 (Snow Peak Land Station): Takibi Campfire Stacking & Bamboo Blowpipe
 * Stage 1: Stack 4 firewood layers in proper airy Igeta order (Base -> Cross -> Kindling -> Birch Bark)
 * Stage 2: Hold & release the Bamboo Blowpipe to keep embers in the Golden Flame Zone!
 * ========================================================================== */

interface WoodPiece {
  id: string;
  label: string;
  layerRequired: number; // 0 = bottom, 1 = mid, 2 = kindling, 3 = tinder
  icon: string;
  hint: string;
}

const WOOD_PIECES: WoodPiece[] = [
  { id: 'tinder', label: 'White Birch Bark', layerRequired: 3, icon: '🌿', hint: 'Birch bark catches sparks best right on top of dry kindling!' },
  { id: 'base_cedar', label: 'Thick Cedar Base Logs', layerRequired: 0, icon: '🪵', hint: 'Heavy cedar logs form the sturdy bottom airflow base!' },
  { id: 'pine_cones', label: 'Dry Pine Kindling', layerRequired: 2, icon: '🌲', hint: 'Pine twigs go above the cross-logs to catch the flame.' },
  { id: 'birch_cross', label: 'Crisscross Birch Logs', layerRequired: 1, icon: '✖️', hint: 'Crisscross logs stack on top of the base to create an airy chimney.' },
];

export function mountTakibiFirepitPuzzle(
  container: HTMLElement,
  _personality: PersonalityId,
  callbacks: PuzzleCallbacks
): void {
  let placedLayers: WoodPiece[] = [];
  let stage: 'stack' | 'blow' | 'done' = 'stack';
  let feedbackMsg = 'Build an airy Igeta (log-cabin) campfire from bottom to top!';

  // Stage 2 blowpipe state
  let heat = 22; // 0..100
  let goldenCharge = 0; // 0..100 (need 100 to ignite!)
  let isBlowing = false;
  let animId: number | null = null;

  const stopLoop = () => {
    if (animId !== null) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  };

  // Cleanup when dialog closes
  const dialog = container.closest('dialog');
  const onDialogClose = () => stopLoop();
  dialog?.addEventListener('close', onDialogClose, { once: true });

  const render = () => {
    if (stage === 'stack') {
      container.innerHTML = `
        <div class="puzzle-shell">
          <p class="sub-note">${feedbackMsg}</p>

          <div class="takibi-layout">
            <div class="takibi-pit-visual">
              <div class="takibi-stage-tag">Step 1/2 · Stack Firewood (${placedLayers.length}/4)</div>
              <svg viewBox="0 0 220 170" width="210" height="162" aria-hidden="true">
                <!-- Titanium Hex Firepit Stand -->
                <polygon points="35,148 185,148 168,118 52,118" fill="#B8B0A6" stroke="#4A3B32" stroke-width="2.5"/>
                <polygon points="52,118 168,118 192,88 28,88" fill="#D4CCC2" stroke="#4A3B32" stroke-width="2.5"/>
                <!-- Layer 0: Base Cedar Logs -->
                ${
                  placedLayers.length >= 1
                    ? '<rect x="52" y="96" width="116" height="16" rx="7" fill="#8C5E3C" stroke="#4A3B32" stroke-width="2.2"/><rect x="64" y="102" width="92" height="12" rx="5" fill="#70492C" stroke="#4A3B32" stroke-width="1.8"/>'
                    : '<rect x="56" y="98" width="108" height="14" rx="6" fill="none" stroke="#8C7B6E" stroke-width="1.5" stroke-dasharray="5 4"/>'
                }
                <!-- Layer 1: Crisscross Birch -->
                ${
                  placedLayers.length >= 2
                    ? '<rect x="66" y="76" width="88" height="14" rx="6" fill="#FAF5EB" stroke="#4A3B32" stroke-width="2.2" transform="rotate(-10 110 83)"/><rect x="66" y="76" width="88" height="14" rx="6" fill="#F2EAD9" stroke="#4A3B32" stroke-width="2.2" transform="rotate(10 110 83)"/>'
                    : ''
                }
                <!-- Layer 2: Pine Kindling -->
                ${
                  placedLayers.length >= 3
                    ? '<polygon points="110,42 78,80 142,80" fill="#5D8C6A" stroke="#4A3B32" stroke-width="2.2"/>'
                    : ''
                }
                <!-- Layer 3: Birch Bark Tinder -->
                ${
                  placedLayers.length >= 4
                    ? '<ellipse cx="110" cy="48" rx="18" ry="9" fill="#FAF5EB" stroke="#D86442" stroke-width="2.2"/>'
                    : ''
                }
              </svg>
            </div>

            <div class="takibi-tray">
              <strong>Choose Next Layer:</strong>
              ${WOOD_PIECES.map((wp) => {
                const used = placedLayers.some((p) => p.id === wp.id);
                return `
                  <button type="button" class="wood-card ${used ? 'used' : ''}" data-wood="${wp.id}" ${used ? 'disabled' : ''}>
                    <span class="wood-ico">${wp.icon}</span>
                    <span>${wp.label}</span>
                    <span class="wood-state">${used ? '✓ Stacked' : 'Place →'}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div class="modal-footer-actions">
            <button type="button" id="btn-instant-solve-puzzle" class="secondary-btn">✨ Quick Ignite</button>
          </div>
        </div>
      `;

      container.querySelectorAll<HTMLButtonElement>('[data-wood]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.wood!;
          const piece = WOOD_PIECES.find((w) => w.id === id)!;
          const expectedLayer = placedLayers.length;
          if (piece.layerRequired === expectedLayer) {
            placedLayers.push(piece);
            if (placedLayers.length === 4) {
              stage = 'blow';
              startBlowStage();
            } else {
              feedbackMsg = `✨ Nice! ${piece.label} fits snugly. What goes on layer ${placedLayers.length + 1}?`;
              render();
            }
          } else {
            feedbackMsg = `💡 Aoi's Tip: ${piece.hint}`;
            render();
          }
        });
      });

      container.querySelector('#btn-instant-solve-puzzle')?.addEventListener('click', () => {
        stage = 'done';
        callbacks.onSolved(0);
      });
    }
  };

  const startBlowStage = () => {
    container.innerHTML = `
      <div class="puzzle-shell">
        <p class="sub-note">
          <strong>Step 2/2 · Bamboo Blowpipe (Fuki-dake):</strong> Press &amp; Hold <strong>🌬️ Blow Gently</strong> to keep the ember heat inside the <strong>Warm Amber Zone (45%–78%)</strong> until the Takibi ignites!
        </p>

        <div class="blowpipe-stage">
          <div class="flame-preview">
            <div id="takibi-flame-icon" class="flame-icon">🔥</div>
            <div class="sub-note" id="takibi-heat-label">Ember Heat: 22%</div>
          </div>

          <div class="ember-meter-wrap">
            <div class="ember-bar-track">
              <div class="ember-golden-band" style="left: 45%; width: 33%">★ COZY FLAME ZONE ★</div>
              <div id="ember-heat-fill" class="ember-heat-fill" style="width: 22%"></div>
            </div>
            <div class="ignite-progress-row">
              <span>Ignition Progress:</span>
              <div class="ignite-bar-track">
                <div id="ignite-charge-fill" class="ignite-charge-fill" style="width: 0%"></div>
              </div>
              <strong id="ignite-pct">0%</strong>
            </div>
          </div>

          <div class="modal-footer-actions">
            <button type="button" id="btn-blow-embers" class="primary-cta-btn">🌬️ Hold to Blow Gently</button>
            <button type="button" id="btn-instant-solve-puzzle" class="secondary-btn">✨ Quick Ignite</button>
          </div>
        </div>
      </div>
    `;

    const blowBtn = container.querySelector('#btn-blow-embers') as HTMLButtonElement | null;
    const heatFill = container.querySelector('#ember-heat-fill') as HTMLElement | null;
    const heatLabel = container.querySelector('#takibi-heat-label') as HTMLElement | null;
    const chargeFill = container.querySelector('#ignite-charge-fill') as HTMLElement | null;
    const chargePct = container.querySelector('#ignite-pct') as HTMLElement | null;
    const flameIcon = container.querySelector('#takibi-flame-icon') as HTMLElement | null;

    blowBtn?.addEventListener('pointerdown', () => {
      isBlowing = true;
    });
    window.addEventListener('pointerup', () => {
      isBlowing = false;
    });
    blowBtn?.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') isBlowing = true;
    });
    blowBtn?.addEventListener('keyup', () => {
      isBlowing = false;
    });

    container.querySelector('#btn-instant-solve-puzzle')?.addEventListener('click', () => {
      stopLoop();
      stage = 'done';
      callbacks.onSolved(0);
    });

    const tick = () => {
      if (stage !== 'blow') return;
      heat += isBlowing ? 0.95 : -0.58;
      heat = Math.max(5, Math.min(98, heat));

      const inZone = heat >= 45 && heat <= 78;
      if (inZone) {
        goldenCharge = Math.min(100, goldenCharge + 0.85);
      } else if (heat > 84) {
        goldenCharge = Math.max(0, goldenCharge - 0.35);
      }

      if (heatFill) heatFill.style.width = `${heat}%`;
      if (heatLabel) {
        heatLabel.textContent = inZone
          ? `✨ Cozy Ember Glow (${Math.round(heat)}%)`
          : heat > 78
          ? `💨 Too strong! Release to let embers settle (${Math.round(heat)}%)`
          : `Ember Heat: ${Math.round(heat)}%`;
      }
      if (chargeFill) chargeFill.style.width = `${goldenCharge}%`;
      if (chargePct) chargePct.textContent = `${Math.round(goldenCharge)}%`;
      if (flameIcon) {
        const scale = 0.75 + (heat / 100) * 0.9;
        flameIcon.style.transform = `scale(${scale.toFixed(2)})`;
      }

      if (goldenCharge >= 100) {
        stopLoop();
        stage = 'done';
        callbacks.onToast('🔥 The Snow Peak Takibi Hearth is crackling warmly!');
        window.setTimeout(() => callbacks.onSolved(60), 450);
        return;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
  };

  render();
}

/* ============================================================================
 * PUZZLE 3 (Happo-One Bus Terminal): Alpine Shuttle Logic & Dispatch Board
 * Players deduce the matching Destination & Time for 3 iconic Hakuba shuttles
 * using 4 charming sticky-note clues from Dispatcher Hana!
 * ========================================================================== */

interface ShuttleSlot {
  id: 'blue' | 'terracotta' | 'sage';
  name: string;
  color: string;
  dest: string;
  time: string;
}

const DEST_OPTIONS = ['Happo Gondola', 'Echoland Cafe Strip', 'Goryu & Lake Aokiko'];
const TIME_OPTIONS = ['08:00', '09:30', '11:00'];

export function mountShuttleLogicPuzzle(
  container: HTMLElement,
  _personality: PersonalityId,
  callbacks: PuzzleCallbacks
): void {
  const shuttles: ShuttleSlot[] = [
    { id: 'blue', name: '🚌 Blue Powder Express', color: '#5A8FB8', dest: 'Echoland Cafe Strip', time: '09:30' },
    { id: 'terracotta', name: '🚐 Terracotta Cafe Van', color: '#D86442', dest: 'Goryu & Lake Aokiko', time: '11:00' },
    { id: 'sage', name: '🚎 Sage Alpine Coach', color: '#4D7C5B', dest: 'Happo Gondola', time: '08:00' },
  ];
  let checkedOnce = false;

  const evaluateClues = () => {
    const blue = shuttles[0];
    const terra = shuttles[1];
    const sage = shuttles[2];

    const allUniqueDests = new Set(shuttles.map((s) => s.dest)).size === 3;
    const allUniqueTimes = new Set(shuttles.map((s) => s.time)).size === 3;

    const c1 = shuttles.some((s) => s.time === '08:00' && s.dest === 'Happo Gondola');
    const c2 = terra.dest === 'Echoland Cafe Strip' && terra.time === '09:30';
    const c3 = sage.time === '11:00';
    const c4 = blue.dest !== 'Goryu & Lake Aokiko';

    return {
      clues: [
        { text: '1. The 08:00 First-Track shuttle always goes to Happo Gondola.', ok: c1 },
        { text: '2. The Terracotta Cafe Van leaves at 09:30 for Echoland Cafe Strip.', ok: c2 },
        { text: '3. The Sage Alpine Coach takes the leisurely 11:00 departure.', ok: c3 },
        { text: '4. Every shuttle must cover a unique route & time (Blue Express avoids Lake Aokiko).', ok: c4 && allUniqueDests && allUniqueTimes },
      ],
      allSolved: c1 && c2 && c3 && c4 && allUniqueDests && allUniqueTimes,
    };
  };

  const render = () => {
    const { clues } = evaluateClues();

    container.innerHTML = `
      <div class="puzzle-shell">
        <p class="sub-note">Click the wooden flip-board tiles below to match each Hakuba shuttle to Hana's 4 morning dispatch notes:</p>

        <div class="clue-notes-grid">
          ${clues
            .map(
              (c) => `
            <div class="clue-sticky ${c.ok ? 'satisfied' : checkedOnce ? 'needs-fix' : ''}">
              <span>${c.ok ? '✓' : '📌'}</span>
              <span>${c.text}</span>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="dispatch-board">
          ${shuttles
            .map(
              (s, idx) => `
            <div class="dispatch-row" style="--bus-color: ${s.color}">
              <strong class="bus-label">${s.name}</strong>
              <button type="button" class="flip-tile" data-cycle-time="${idx}">🕒 ${s.time}</button>
              <button type="button" class="flip-tile dest" data-cycle-dest="${idx}">📍 ${s.dest}</button>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="modal-footer-actions">
          <button type="button" id="btn-dispatch-check" class="primary-cta-btn">🚌 Dispatch Morning Shuttles</button>
          <button type="button" id="btn-instant-solve-puzzle" class="secondary-btn">✨ Quick Dispatch</button>
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLButtonElement>('[data-cycle-time]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.cycleTime);
        const cur = TIME_OPTIONS.indexOf(shuttles[idx].time);
        shuttles[idx].time = TIME_OPTIONS[(cur + 1) % TIME_OPTIONS.length];
        render();
      });
    });

    container.querySelectorAll<HTMLButtonElement>('[data-cycle-dest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.cycleDest);
        const cur = DEST_OPTIONS.indexOf(shuttles[idx].dest);
        shuttles[idx].dest = DEST_OPTIONS[(cur + 1) % DEST_OPTIONS.length];
        render();
      });
    });

    container.querySelector('#btn-dispatch-check')?.addEventListener('click', () => {
      checkedOnce = true;
      const res = evaluateClues();
      render();
      if (res.allSolved) {
        callbacks.onToast('🚌 All 3 Happo Valley Shuttles dispatched on time!');
        window.setTimeout(() => callbacks.onSolved(75), 500);
      } else {
        callbacks.onToast('📌 Check the highlighted dispatch note and adjust a route!');
      }
    });

    container.querySelector('#btn-instant-solve-puzzle')?.addEventListener('click', () => {
      shuttles[0].time = '08:00';
      shuttles[0].dest = 'Happo Gondola';
      shuttles[1].time = '09:30';
      shuttles[1].dest = 'Echoland Cafe Strip';
      shuttles[2].time = '11:00';
      shuttles[2].dest = 'Goryu & Lake Aokiko';
      render();
      window.setTimeout(() => callbacks.onSolved(75), 500);
    });
  };

  render();
}

/* ============================================================================
 * UPGRADED POP-UP WINDOW SERVICE MINI-GAME: Interactive Pour / Craft Counter!
 * Customers step up to the van window with specific cravings.
 * Hold & release (or click-stop) to fill the craft cup/gauge right into the
 * golden sweet spot!
 * ========================================================================== */

interface CustomerOrder {
  guestName: string;
  guestEmoji: string;
  itemName: string;
  itemIcon: string;
  actionVerb: string;
  basePayout: number;
  targetStart: number;
  targetWidth: number;
}

const WINTER_GUESTS = [
  { name: 'Mika (Snowboarder)', emoji: '🏂' },
  { name: 'Ken (Powder Skier)', emoji: '⛷️' },
  { name: 'Yuna (Oito Traveler)', emoji: '🧣' },
  { name: 'Riku (Backcountry)', emoji: '🎿' },
  { name: 'Hina (Onsen Guest)', emoji: '🧤' },
  { name: 'Sota (Local Guide)', emoji: '🏔️' },
];

const GREEN_GUESTS = [
  { name: 'Ren (MTB Rider)', emoji: '🚵' },
  { name: 'Saki (Alps Hiker)', emoji: '🥾' },
  { name: 'Haru (Photographer)', emoji: '📷' },
  { name: 'Mei (Camp Artist)', emoji: '🎨' },
  { name: 'Kaito (Kayaker)', emoji: '🛶' },
  { name: 'Aya (Tokyo Weekender)', emoji: '👒' },
];

export function mountPopUpServiceMiniGame(
  container: HTMLElement,
  season: Season,
  build: VanBuildSummary,
  onComplete: (earnedYen: number, customersServed: number) => void
): void {
  const guests = season === 'winter' ? WINTER_GUESTS : GREEN_GUESTS;
  const stations = build.activeStations;
  const totalOrders = Math.max(1, build.expectedCustomers);

  // Build actual customer orders directly from the stations installed in the player's van!
  const orders: CustomerOrder[] = Array.from({ length: totalOrders }, (_, idx) => {
    const guest = guests[idx % guests.length];
    const station = stations[idx % stations.length];
    // Vary targetStart gently while honoring build.sweetSpotWidth!
    const maxStart = Math.max(25, 86 - build.sweetSpotWidth);
    const targetStart = Math.min(maxStart, 42 + ((idx * 11) % 24));
    return {
      guestName: guest.name,
      guestEmoji: guest.emoji,
      itemName: station.itemName,
      itemIcon: station.itemIcon,
      actionVerb: station.actionVerb,
      basePayout: station.payout,
      targetStart,
      targetWidth: build.sweetSpotWidth,
    };
  });

  let orderIdx = 0;
  let fillLevel = 0;
  let isHolding = false;
  let totalEarnedYen = 0;
  let mochiSaveAvailable = build.mochiAutoSave;
  let lastReaction = `Press & Hold, then release inside the ${build.sweetSpotWidth}% Golden Zone!`;
  let animId: number | null = null;

  const stopLoop = () => {
    if (animId !== null) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  };

  const dialog = container.closest('dialog');
  dialog?.addEventListener('close', () => stopLoop(), { once: true });

  const renderOrder = () => {
    const cur = orders[orderIdx];
    const buffPillsHtml =
      build.activeBuffPills.length > 0
        ? build.activeBuffPills.map((b) => `<span class="buff-pill">${b}</span>`).join('')
        : '<span class="buff-pill">Base Van Setup (Add Cozy Modules for Buffs!)</span>';

    container.innerHTML = `
      <div class="service-counter-stage">
        <div class="active-buffs-strip">
          <span class="buffs-label">Active Van Build:</span>
          ${buffPillsHtml}
          ${mochiSaveAvailable ? '<span class="buff-pill mochi-ready">🐕 Free Perfect Ready</span>' : ''}
        </div>

        <div class="customer-window-scene">
          <div class="customer-avatar-pill">
            <span class="cust-emoji">${cur.guestEmoji}</span>
            <div>
              <strong>${cur.guestName}</strong>
              <div class="sub-note">Guest ${orderIdx + 1} of ${orders.length} · Earned so far: <strong>¥${totalEarnedYen}</strong></div>
            </div>
          </div>
          <div class="customer-speech-bubble">
            "${cur.itemIcon} One <strong>${cur.itemName}</strong>, please!"
            <span class="order-pay-tag">Base ¥${cur.basePayout}${build.passivePerGuest > 0 ? ` + ¥${build.passivePerGuest} bonus` : ''}</span>
          </div>
        </div>

        <div class="pour-meter-wrap">
          <div class="timing-bar-track">
            <div class="timing-sweet-spot" style="left: ${cur.targetStart}%; width: ${cur.targetWidth}%">
              <span>★ PERFECT (${cur.targetWidth}%) ★</span>
            </div>
            <div id="pour-fill-bar" class="pour-fill-bar" style="width: 0%"></div>
          </div>
          <div id="service-score-readout" class="sub-note">${lastReaction}</div>
        </div>

        <div class="modal-footer-actions">
          <button type="button" id="btn-hit-serve" class="primary-cta-btn" autofocus>${cur.itemIcon} ${cur.actionVerb}</button>
          <button type="button" id="btn-quick-auto-serve" class="secondary-btn">⚡ Quick Serve Shift</button>
        </div>
      </div>
    `;

    const holdBtn = container.querySelector('#btn-hit-serve') as HTMLButtonElement | null;
    const fillBar = container.querySelector('#pour-fill-bar') as HTMLElement | null;

    const finishRelease = () => {
      if (!isHolding) return;
      isHolding = false;
      stopLoop();

      let inSweet = fillLevel >= cur.targetStart && fillLevel <= cur.targetStart + cur.targetWidth;
      const close = fillLevel >= cur.targetStart - 12 && fillLevel <= cur.targetStart + cur.targetWidth + 12;
      let savedByMochi = false;

      if (!inSweet && mochiSaveAvailable) {
        mochiSaveAvailable = false;
        inSweet = true;
        savedByMochi = true;
      }

      const mult = inSweet ? build.perfectBonusMultiplier : close ? 1.1 : 0.85;
      const orderYen = Math.round(cur.basePayout * mult + build.passivePerGuest);
      totalEarnedYen += orderYen;

      if (savedByMochi) {
        lastReaction = `🐕 Mochi greeted ${cur.guestName} → Upgraded to ★ PERFECT! (+¥${orderYen})`;
      } else if (inSweet) {
        lastReaction = `✨ PERFECT ${cur.itemName}! +¥${orderYen} (${Math.round(mult * 100)}% tip!)`;
      } else if (close) {
        lastReaction = `👍 Tasty ${cur.itemName}! +¥${orderYen}`;
      } else {
        lastReaction = `😊 Served ${cur.itemName} (+¥${orderYen})`;
      }

      orderIdx++;
      fillLevel = 0;

      if (orderIdx >= orders.length) {
        window.setTimeout(() => onComplete(totalEarnedYen, orders.length), 350);
      } else {
        renderOrder();
      }
    };

    const startHold = () => {
      if (isHolding) return;
      isHolding = true;
      fillLevel = 0;
      window.addEventListener('pointerup', finishRelease, { once: true });
      const stepDelta = 1.6 * build.fillSpeedMultiplier;
      const step = () => {
        if (!isHolding) return;
        fillLevel = Math.min(100, fillLevel + stepDelta);
        if (fillBar) fillBar.style.width = `${fillLevel}%`;
        if (fillLevel >= 100) {
          finishRelease();
          return;
        }
        animId = requestAnimationFrame(step);
      };
      animId = requestAnimationFrame(step);
    };

    holdBtn?.addEventListener('pointerdown', startHold);
    holdBtn?.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        startHold();
      }
    });
    holdBtn?.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') finishRelease();
    });

    container.querySelector('#btn-quick-auto-serve')?.addEventListener('click', () => {
      stopLoop();
      // Auto-complete remaining orders at cozy 1.25x average quality
      for (let i = orderIdx; i < orders.length; i++) {
        totalEarnedYen += Math.round(orders[i].basePayout * 1.25 + build.passivePerGuest);
      }
      onComplete(totalEarnedYen, orders.length);
    });
  };

  renderOrder();
}
