import { PersonalityId } from '../state/types';
import { PuzzleCallbacks } from './miniPuzzles';

/* ============================================================================
 * PHASE 2 PUZZLE 4 (Echoland Street): 5-Lantern Acoustic Avenue Circuit
 * Clicking a paper lantern toggles itself and its immediate neighbors.
 * Starting state [false, true, false, true, false] is cleanly solvable in 3 clicks!
 * ========================================================================== */

const LANTERN_NAMES = ['Cafe', 'Vinyl', 'Stage', 'Ramen', 'Pine'];

export function mountEcholandLanternPuzzle(
  container: HTMLElement,
  _personality: PersonalityId,
  callbacks: PuzzleCallbacks
): void {
  let lit: boolean[] = [false, true, false, true, false];
  let moves = 0;
  let solved = false;

  const render = () => {
    const litCount = lit.filter(Boolean).length;
    container.innerHTML = `
      <div class="puzzle-shell">
        <div class="puzzle-top-info">
          <p class="sub-note">
            Tap any hanging paper lantern to toggle <strong>itself + its neighbors</strong>. Light all 5 lanterns along Echoland Street!
          </p>
          <div class="puzzle-status-pills">
            <span class="chip-btn ${litCount === 5 ? 'active' : ''}">🏮 Lit: ${litCount} / 5</span>
            <span class="chip-btn">Taps: ${moves}</span>
          </div>
        </div>

        <div class="lantern-avenue-wire">
          ${lit
            .map(
              (isOn, idx) => `
            <button type="button" class="lantern-btn ${isOn ? 'lit' : ''}" data-lantern="${idx}" ${solved ? 'disabled' : ''}>
              <span class="lantern-cord" aria-hidden="true"></span>
              <span class="lantern-globe">${isOn ? '🏮' : '⚪'}</span>
              <span class="lantern-label">${LANTERN_NAMES[idx]}</span>
            </button>
          `
            )
            .join('')}
        </div>

        <div class="modal-footer-actions">
          <button type="button" id="btn-reset-lanterns" class="secondary-btn">↺ Reset</button>
          <button type="button" id="btn-instant-solve-puzzle" class="secondary-btn">✨ Light All Lanterns</button>
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLButtonElement>('[data-lantern]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (solved) return;
        const idx = Number(btn.dataset.lantern);
        lit[idx] = !lit[idx];
        if (idx > 0) lit[idx - 1] = !lit[idx - 1];
        if (idx < lit.length - 1) lit[idx + 1] = !lit[idx + 1];
        moves++;

        if (lit.every(Boolean)) {
          solved = true;
          render();
          callbacks.onToast('🏮 All 5 Echoland paper lanterns are glowing warmly!');
          window.setTimeout(() => callbacks.onSolved(80), 550);
        } else {
          render();
        }
      });
    });

    container.querySelector('#btn-reset-lanterns')?.addEventListener('click', () => {
      lit = [false, true, false, true, false];
      moves = 0;
      render();
    });

    container.querySelector('#btn-instant-solve-puzzle')?.addEventListener('click', () => {
      if (solved) return;
      lit = [true, true, true, true, true];
      solved = true;
      render();
      window.setTimeout(() => callbacks.onSolved(80), 450);
    });
  };

  render();
}

/* ============================================================================
 * PHASE 2 PUZZLE 5 (Hakuba Iwatake): Summit Flow Trail Grading
 * Match the ideal trail feature to each of the 4 alpine elevation zones.
 * ========================================================================== */

interface TrailSegment {
  zone: string;
  terrain: string;
  correctFeature: string;
  selected: string;
}

const TRAIL_FEATURES = ['Panorama Deck', 'Banked Berms', 'Cedar Bridge', 'Flow Rollers'];

export function mountIwatakeTrailPuzzle(
  container: HTMLElement,
  _personality: PersonalityId,
  callbacks: PuzzleCallbacks
): void {
  const segments: TrailSegment[] = [
    { zone: '1. Summit Cliff (1,289m)', terrain: '360° Alpenglow Overlook', correctFeature: 'Panorama Deck', selected: 'Banked Berms' },
    { zone: '2. Steep Pine Slope', terrain: 'Fast Switchback Descent', correctFeature: 'Banked Berms', selected: 'Cedar Bridge' },
    { zone: '3. Snowmelt Creek', terrain: 'Rocky Stream Crossing', correctFeature: 'Cedar Bridge', selected: 'Flow Rollers' },
    { zone: '4. Meadow Finish', terrain: 'Gentle Rolling Base', correctFeature: 'Flow Rollers', selected: 'Panorama Deck' },
  ];
  let testedOnce = false;

  const render = () => {
    container.innerHTML = `
      <div class="puzzle-shell">
        <p class="sub-note">Tap each segment's blueprint card to choose the safest, smoothest feature for Sora's Iwatake Mountain Flow Trail:</p>

        <div class="trail-grade-grid">
          ${segments
            .map((seg, idx) => {
              const ok = seg.selected === seg.correctFeature;
              return `
              <div class="trail-seg-card ${testedOnce ? (ok ? 'ok' : 'warn') : ''}">
                <div class="trail-zone-title">${seg.zone}</div>
                <div class="sub-note">${seg.terrain}</div>
                <button type="button" class="flip-tile" data-cycle-seg="${idx}">
                  🛠️ ${seg.selected}
                </button>
                ${testedOnce ? `<span class="trail-check">${ok ? '✓ Smooth Flow!' : '💡 Try another feature'}</span>` : ''}
              </div>
            `;
            })
            .join('')}
        </div>

        <div class="modal-footer-actions">
          <button type="button" id="btn-test-trail" class="primary-cta-btn">🚵 Test Ride Flow Trail</button>
          <button type="button" id="btn-instant-solve-puzzle" class="secondary-btn">✨ Auto-Grade Trail</button>
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLButtonElement>('[data-cycle-seg]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.cycleSeg);
        const cur = TRAIL_FEATURES.indexOf(segments[idx].selected);
        segments[idx].selected = TRAIL_FEATURES[(cur + 1) % TRAIL_FEATURES.length];
        render();
      });
    });

    container.querySelector('#btn-test-trail')?.addEventListener('click', () => {
      testedOnce = true;
      const allOk = segments.every((s) => s.selected === s.correctFeature);
      render();
      if (allOk) {
        callbacks.onToast('🚵 Smooth flow all the way from Iwatake Mountain Harbor!');
        window.setTimeout(() => callbacks.onSolved(90), 500);
      } else {
        callbacks.onToast('💡 Almost! Adjust the highlighted trail segments.');
      }
    });

    container.querySelector('#btn-instant-solve-puzzle')?.addEventListener('click', () => {
      segments.forEach((s) => {
        s.selected = s.correctFeature;
      });
      testedOnce = true;
      render();
      window.setTimeout(() => callbacks.onSolved(90), 450);
    });
  };

  render();
}

/* ============================================================================
 * PHASE 2 PUZZLE 6 (Hakuba Goryu): Alpine Flora & Starlight Pair-Match (3x4)
 * ========================================================================== */

interface FloraCard {
  id: number;
  pairId: string;
  icon: string;
  label: string;
  flipped: boolean;
  matched: boolean;
}

const FLORA_PAIRS = [
  { pairId: 'komagusa', icon: '🌸', label: 'Komagusa' },
  { pairId: 'poppy', icon: '💠', label: 'Blue Poppy' },
  { pairId: 'star', icon: '❄️', label: 'Powder Star' },
  { pairId: 'light', icon: '💡', label: 'Night Light' },
  { pairId: 'gondola', icon: '🚡', label: 'Gondola' },
  { pairId: 'herb', icon: '🌿', label: 'Edelweiss' },
];

export function mountGoryuBotanicalPuzzle(
  container: HTMLElement,
  _personality: PersonalityId,
  callbacks: PuzzleCallbacks
): void {
  // Deterministic cozy shuffle so pairs aren't trivially adjacent
  const ordered = [
    FLORA_PAIRS[0], FLORA_PAIRS[2], FLORA_PAIRS[4], FLORA_PAIRS[1],
    FLORA_PAIRS[3], FLORA_PAIRS[0], FLORA_PAIRS[5], FLORA_PAIRS[2],
    FLORA_PAIRS[1], FLORA_PAIRS[5], FLORA_PAIRS[3], FLORA_PAIRS[4],
  ];
  const cards: FloraCard[] = ordered.map((p, idx) => ({
    id: idx,
    ...p,
    flipped: false,
    matched: false,
  }));

  let openIds: number[] = [];
  let locked = false;

  const render = () => {
    const matchedPairs = cards.filter((c) => c.matched).length / 2;
    container.innerHTML = `
      <div class="puzzle-shell">
        <div class="puzzle-top-info">
          <p class="sub-note">Flip Dr. Midori's botanical field cards to pair all 6 Hakuba Goryu specimens &amp; starlight icons:</p>
          <span class="chip-btn ${matchedPairs === 6 ? 'active' : ''}">🌺 Pairs: ${matchedPairs} / 6</span>
        </div>

        <div class="botanical-match-grid">
          ${cards
            .map(
              (c) => `
            <button
              type="button"
              class="flora-card ${c.flipped || c.matched ? 'revealed' : ''} ${c.matched ? 'matched' : ''}"
              data-card="${c.id}"
              ${c.flipped || c.matched || locked ? 'disabled' : ''}
            >
              ${c.flipped || c.matched ? `<span class="flora-ico">${c.icon}</span><span class="flora-name">${c.label}</span>` : '<span class="flora-back">🍃</span>'}
            </button>
          `
            )
            .join('')}
        </div>

        <div class="modal-footer-actions">
          <button type="button" id="btn-instant-solve-puzzle" class="secondary-btn">✨ Complete Archive</button>
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLButtonElement>('[data-card]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (locked) return;
        const id = Number(btn.dataset.card);
        const card = cards[id];
        if (card.flipped || card.matched) return;

        card.flipped = true;
        openIds.push(id);
        render();

        if (openIds.length === 2) {
          const [a, b] = [cards[openIds[0]], cards[openIds[1]]];
          if (a.pairId === b.pairId) {
            a.matched = true;
            b.matched = true;
            openIds = [];
            render();
            if (cards.every((c) => c.matched)) {
              callbacks.onToast('🌺 Dr. Midori’s Goryu Botanical Archive is complete!');
              window.setTimeout(() => callbacks.onSolved(100), 500);
            }
          } else {
            locked = true;
            window.setTimeout(() => {
              a.flipped = false;
              b.flipped = false;
              openIds = [];
              locked = false;
              render();
            }, 650);
          }
        }
      });
    });

    container.querySelector('#btn-instant-solve-puzzle')?.addEventListener('click', () => {
      cards.forEach((c) => {
        c.matched = true;
        c.flipped = true;
      });
      render();
      window.setTimeout(() => callbacks.onSolved(100), 450);
    });
  };

  render();
}

/* ============================================================================
 * PHASE 2 PUZZLE 7 (Hakuba 47): Wood-Fired Stone Oven Pizza Bake (2-Stage)
 * Stage 1: Pick the 3 requested Shinshu toppings onto the flatbread.
 * Stage 2: Watch the stone oven crispness rise and pull it out at Golden Crispy!
 * ========================================================================== */

const TOPPINGS = [
  { id: 'maitake', icon: '🍄', label: 'Wild Maitake', wanted: true },
  { id: 'apple', icon: '🍎', label: 'Shinshu Apple', wanted: true },
  { id: 'cheese', icon: '🧀', label: 'Nagano Mozzarella', wanted: true },
  { id: 'wasabi', icon: '🟢', label: 'Extra Wasabi', wanted: false },
];

export function mountHakuba47PizzaPuzzle(
  container: HTMLElement,
  _personality: PersonalityId,
  callbacks: PuzzleCallbacks
): void {
  const picked = new Set<string>();
  let stage: 'top' | 'bake' | 'done' = 'top';
  let crisp = 10;
  let animId: number | null = null;
  let tip = 'Tap the 3 requested Shinshu toppings for Taka’s Riverside Pizza: 🍄 Wild Maitake, 🍎 Shinshu Apple, 🧀 Nagano Mozzarella.';

  const stopLoop = () => {
    if (animId !== null) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  };
  container.closest('dialog')?.addEventListener('close', () => stopLoop(), { once: true });

  const renderTopStage = () => {
    container.innerHTML = `
      <div class="puzzle-shell">
        <p class="sub-note">${tip}</p>
        <div class="pizza-prep-row">
          <div class="pizza-dough-preview">
            <div class="pizza-circle">
              <span>🍕</span>
              <div class="pizza-toppings-shown">
                ${Array.from(picked)
                  .map((id) => TOPPINGS.find((t) => t.id === id)?.icon || '')
                  .join(' ')}
              </div>
            </div>
            <strong>Step 1/2 · Toppings (${picked.size}/3)</strong>
          </div>

          <div class="takibi-tray">
            ${TOPPINGS.map((t) => {
              const has = picked.has(t.id);
              return `
                <button type="button" class="wood-card ${has ? 'used' : ''}" data-topping="${t.id}" ${has ? 'disabled' : ''}>
                  <span class="wood-ico">${t.icon}</span>
                  <span>${t.label}</span>
                  <span class="wood-state">${has ? '✓ Added' : 'Add +'}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
        <div class="modal-footer-actions">
          <button type="button" id="btn-instant-solve-puzzle" class="secondary-btn">✨ Quick Bake</button>
        </div>
      </div>
    `;

    container.querySelectorAll<HTMLButtonElement>('[data-topping]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.topping!;
        const t = TOPPINGS.find((x) => x.id === id)!;
        if (!t.wanted) {
          tip = '😅 Taka laughs: "Save the wasabi for soba! Stick to Maitake, Shinshu Apple & Mozzarella."';
          renderTopStage();
          return;
        }
        picked.add(id);
        if (picked.size >= 3) {
          stage = 'bake';
          startBakeStage();
        } else {
          tip = `✨ Added ${t.icon} ${t.label}! (${picked.size}/3)`;
          renderTopStage();
        }
      });
    });

    container.querySelector('#btn-instant-solve-puzzle')?.addEventListener('click', () => {
      stage = 'done';
      callbacks.onSolved(110);
    });
  };

  const startBakeStage = () => {
    crisp = 10;
    container.innerHTML = `
      <div class="puzzle-shell">
        <p class="sub-note"><strong>Step 2/2 · Stone Oven Bake:</strong> Pull the pizza out right when the crust hits the <strong>Golden Crispy Zone (65%–88%)</strong>!</p>
        <div class="blowpipe-stage">
          <div class="ember-bar-track">
            <div class="ember-golden-band" style="left: 65%; width: 23%">★ GOLDEN CRISPY ★</div>
            <div id="pizza-crisp-fill" class="ember-heat-fill" style="width: 10%"></div>
          </div>
          <div class="modal-footer-actions">
            <button type="button" id="btn-pull-pizza" class="primary-cta-btn" autofocus>🍕 Pull Out of Oven!</button>
            <button type="button" id="btn-instant-solve-puzzle" class="secondary-btn">✨ Quick Bake</button>
          </div>
        </div>
      </div>
    `;

    const fillEl = container.querySelector('#pizza-crisp-fill') as HTMLElement | null;
    const step = () => {
      if (stage !== 'bake') return;
      crisp += 0.85;
      if (crisp >= 100) crisp = 10; // Loop gently if player waits
      if (fillEl) fillEl.style.width = `${crisp}%`;
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);

    container.querySelector('#btn-pull-pizza')?.addEventListener('click', () => {
      stopLoop();
      stage = 'done';
      const perfect = crisp >= 65 && crisp <= 88;
      callbacks.onToast(
        perfect
          ? '🍕 Crispy wood-fired perfection! Hakuba 47 River Base smells amazing (+¥110)!'
          : '🍕 Warm stone-oven pizza served! Taka gives a thumbs up!'
      );
      window.setTimeout(() => callbacks.onSolved(perfect ? 110 : 50), 450);
    });

    container.querySelector('#btn-instant-solve-puzzle')?.addEventListener('click', () => {
      stopLoop();
      stage = 'done';
      callbacks.onSolved(110);
    });
  };

  renderTopStage();
}
