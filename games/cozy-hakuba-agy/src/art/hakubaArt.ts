import Phaser from 'phaser';
import { Gender, PersonalityId, RegionId, Season } from '../state/types';

/**
 * Generates crisp, warm gouache/editorial SVG illustrations for HTML UI
 * (portraits, van modules, tickets, and icons).
 */
export function getProtagonistPortraitSvg(gender: Gender, personality: PersonalityId, season: Season): string {
  const coat =
    personality === 'barista'
      ? '#D86442'
      : personality === 'tinkerer'
      ? '#5A8FB8'
      : personality === 'photographer'
      ? '#4D7C5B'
      : '#C96D7D';
  const hatColor = season === 'winter' ? '#E6A23C' : '#E5CFA8';
  const hairBack =
    gender === 'female'
      ? '<path d="M26 36 C22 52 24 64 30 68 L66 68 C72 64 74 52 70 36 Z" fill="#3B2F2B"/>'
      : gender === 'nonbinary'
      ? '<path d="M27 36 C25 48 27 56 32 58 L64 58 C69 56 71 48 69 36 Z" fill="#3B2F2B"/>'
      : '';

  const accessory =
    personality === 'barista'
      ? '<circle cx="72" cy="68" r="9" fill="#FAF5EB" stroke="#4A3B32" stroke-width="2"/><path d="M68 65 h8 v7 a4 4 0 0 1 -8 0 z" fill="#8C5E3C"/>'
      : personality === 'tinkerer'
      ? '<circle cx="72" cy="68" r="9" fill="#FAF5EB" stroke="#4A3B32" stroke-width="2"/><path d="M68 72 l8 -8" stroke="#5A8FB8" stroke-width="3" stroke-linecap="round"/>'
      : personality === 'photographer'
      ? '<rect x="63" y="62" width="16" height="12" rx="3" fill="#3B2F2B" stroke="#FAF5EB" stroke-width="1.5"/><circle cx="71" cy="68" r="3.5" fill="#93C5FD"/>'
      : '<circle cx="72" cy="68" r="8" fill="#E6A23C" stroke="#4A3B32" stroke-width="2"/><path d="M72 62 v12 M68 68 h8" stroke="#FAF5EB" stroke-width="1.8"/>';

  return `
    <svg viewBox="0 0 96 96" width="76" height="76" aria-hidden="true">
      <circle cx="48" cy="48" r="45" fill="#F3EBDD" stroke="#DCCEB8" stroke-width="2.5"/>
      ${hairBack}
      <!-- Coat & Scarf -->
      <path d="M24 84 C26 64 36 58 48 58 C60 58 70 64 72 84 Z" fill="${coat}" stroke="#4A3B32" stroke-width="2.2"/>
      <path d="M35 58 Q48 66 61 58 L59 66 Q48 72 37 66 Z" fill="#FAF5EB" stroke="#4A3B32" stroke-width="1.8"/>
      <!-- Face -->
      <circle cx="48" cy="41" r="16" fill="#FCE5CD" stroke="#4A3B32" stroke-width="2.2"/>
      <!-- Rosy Cheeks -->
      <ellipse cx="38" cy="45" rx="3.2" ry="2" fill="#F4A29E" opacity="0.7"/>
      <ellipse cx="58" cy="45" rx="3.2" ry="2" fill="#F4A29E" opacity="0.7"/>
      <!-- Eyes & Cozy Smile -->
      <circle cx="42" cy="40" r="2.1" fill="#3B2F2B"/>
      <circle cx="54" cy="40" r="2.1" fill="#3B2F2B"/>
      <path d="M44 46 Q48 49.5 52 46" fill="none" stroke="#4A3B32" stroke-width="2" stroke-linecap="round"/>
      <!-- Bangs & Beanie/Sunhat -->
      <path d="M32 36 Q40 28 48 34 Q56 28 64 36 Q56 24 48 24 Q40 24 32 36 Z" fill="#3B2F2B"/>
      ${
        season === 'winter'
          ? `<path d="M31 32 C31 18 65 18 65 32 Z" fill="${hatColor}" stroke="#4A3B32" stroke-width="2.2"/><circle cx="48" cy="17" r="4.5" fill="#FAF5EB" stroke="#4A3B32" stroke-width="1.8"/>`
          : `<ellipse cx="48" cy="28" rx="24" ry="6" fill="${hatColor}" stroke="#4A3B32" stroke-width="2"/><path d="M35 27 C36 17 60 17 61 27 Z" fill="${hatColor}" stroke="#4A3B32" stroke-width="2"/>`
      }
      ${accessory}
    </svg>
  `;
}

export function getModuleIllustrationSvg(moduleId: string): string {
  const icons: Record<string, string> = {
    espresso_bar: `
      <svg viewBox="0 0 80 64" width="58" height="46" aria-hidden="true">
        <rect x="12" y="18" width="44" height="36" rx="6" fill="#C97B42" stroke="#4A3B32" stroke-width="2.2"/>
        <rect x="18" y="24" width="32" height="12" rx="3" fill="#FAF5EB" stroke="#4A3B32" stroke-width="1.6"/>
        <rect x="24" y="40" width="16" height="10" rx="2" fill="#FAF5EB" stroke="#4A3B32" stroke-width="1.6"/>
        <path d="M27 14 Q29 9 27 5 M36 14 Q38 9 36 5" fill="none" stroke="#8C5E3C" stroke-width="2" stroke-linecap="round"/>
        <circle cx="62" cy="44" r="9" fill="#FAF5EB" stroke="#4A3B32" stroke-width="2"/>
        <circle cx="62" cy="44" r="5" fill="#6F4E37"/>
      </svg>`,
    oyaki_steamer: `
      <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
        <ellipse cx="32" cy="44" rx="20" ry="7" fill="#D9B382" stroke="#4A3B32" stroke-width="2"/>
        <rect x="12" y="28" width="40" height="16" fill="#E6C99E" stroke="#4A3B32" stroke-width="2"/>
        <ellipse cx="32" cy="28" rx="20" ry="7" fill="#F3EBDD" stroke="#4A3B32" stroke-width="2"/>
        <circle cx="26" cy="27" r="5.5" fill="#FAF5EB" stroke="#4A3B32" stroke-width="1.6"/>
        <circle cx="38" cy="28" r="5.5" fill="#FAF5EB" stroke="#4A3B32" stroke-width="1.6"/>
        <path d="M26 16 Q29 10 26 6 M38 15 Q41 9 38 5" fill="none" stroke="#8C5E3C" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
    gelato_coldbrew: `
      <svg viewBox="0 0 80 64" width="58" height="46" aria-hidden="true">
        <rect x="12" y="20" width="38" height="34" rx="6" fill="#7FB3B5" stroke="#4A3B32" stroke-width="2.2"/>
        <circle cx="24" cy="34" r="6" fill="#FAF5EB" stroke="#4A3B32" stroke-width="1.6"/>
        <circle cx="38" cy="34" r="6" fill="#F4A29E" stroke="#4A3B32" stroke-width="1.6"/>
        <path d="M56 36 L68 36 L64 54 L60 54 Z" fill="#E6C99E" stroke="#4A3B32" stroke-width="2"/>
        <circle cx="62" cy="30" r="7" fill="#FAF5EB" stroke="#4A3B32" stroke-width="1.8"/>
        <circle cx="62" cy="22" r="5" fill="#8CC098" stroke="#4A3B32" stroke-width="1.8"/>
      </svg>`,
    ski_wax_bench: `
      <svg viewBox="0 0 80 64" width="58" height="46" aria-hidden="true">
        <line x1="16" y1="36" x2="16" y2="54" stroke="#4A3B32" stroke-width="3" stroke-linecap="round"/>
        <line x1="64" y1="36" x2="64" y2="54" stroke="#4A3B32" stroke-width="3" stroke-linecap="round"/>
        <rect x="8" y="30" width="64" height="8" rx="4" fill="#5A8FB8" stroke="#4A3B32" stroke-width="2"/>
        <rect x="28" y="16" width="22" height="12" rx="4" fill="#D86442" stroke="#4A3B32" stroke-width="2"/>
        <path d="M50 20 Q58 14 62 18" fill="none" stroke="#4A3B32" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
    mtb_repair_stand: `
      <svg viewBox="0 0 80 64" width="58" height="46" aria-hidden="true">
        <circle cx="22" cy="40" r="12" fill="none" stroke="#4D7C5B" stroke-width="3.5"/>
        <circle cx="58" cy="40" r="12" fill="none" stroke="#4D7C5B" stroke-width="3.5"/>
        <path d="M22 40 L38 24 L52 24 L58 40 L38 40 Z" fill="none" stroke="#4A3B32" stroke-width="2.5" stroke-linejoin="round"/>
        <line x1="38" y1="24" x2="36" y2="16" stroke="#4A3B32" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`,
    woodblock_postcard: `
      <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
        <rect x="10" y="14" width="44" height="34" rx="4" fill="#FAF5EB" stroke="#4A3B32" stroke-width="2.2"/>
        <path d="M14 42 L26 24 L36 36 L44 26 L50 42 Z" fill="#8AAEC9" stroke="#4A3B32" stroke-width="1.6"/>
        <circle cx="44" cy="22" r="4" fill="#E6A23C"/>
      </svg>`,
    botanical_charm: `
      <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
        <rect x="16" y="10" width="32" height="44" rx="5" fill="#F3EBDD" stroke="#4A3B32" stroke-width="2"/>
        <path d="M32 44 V20 M32 34 Q22 28 24 22 M32 28 Q42 22 40 16" fill="none" stroke="#4D7C5B" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="32" cy="18" r="4" fill="#9D8DF1"/>
      </svg>`,
    futon_bunk: `
      <svg viewBox="0 0 80 64" width="58" height="46" aria-hidden="true">
        <rect x="8" y="28" width="64" height="22" rx="6" fill="#C97B42" stroke="#4A3B32" stroke-width="2.2"/>
        <rect x="12" y="22" width="56" height="16" rx="6" fill="#FAF5EB" stroke="#4A3B32" stroke-width="2"/>
        <rect x="30" y="22" width="38" height="16" rx="5" fill="#E0938B" stroke="#4A3B32" stroke-width="2"/>
        <rect x="14" y="18" width="14" height="8" rx="4" fill="#FAF5EB" stroke="#4A3B32" stroke-width="1.8"/>
      </svg>`,
    mini_wood_stove: `
      <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
        <rect x="28" y="6" width="8" height="14" fill="#59504A" stroke="#4A3B32" stroke-width="2"/>
        <rect x="16" y="20" width="32" height="30" rx="5" fill="#4A3B32"/>
        <rect x="22" y="27" width="20" height="14" rx="3" fill="#E6A23C"/>
        <path d="M32 39 Q27 33 32 28 Q37 33 32 39 Z" fill="#D86442"/>
        <line x1="20" y1="50" x2="18" y2="56" stroke="#4A3B32" stroke-width="3" stroke-linecap="round"/>
        <line x1="44" y1="50" x2="46" y2="56" stroke="#4A3B32" stroke-width="3" stroke-linecap="round"/>
      </svg>`,
    shiba_pet_mat: `
      <svg viewBox="0 0 64 64" width="48" height="48" aria-hidden="true">
        <ellipse cx="32" cy="46" rx="22" ry="8" fill="#8CC098" stroke="#4A3B32" stroke-width="2"/>
        <circle cx="32" cy="32" r="13" fill="#E5A952" stroke="#4A3B32" stroke-width="2"/>
        <polygon points="21,24 24,13 29,21" fill="#E5A952" stroke="#4A3B32" stroke-width="2"/>
        <polygon points="43,24 40,13 35,21" fill="#E5A952" stroke="#4A3B32" stroke-width="2"/>
        <ellipse cx="32" cy="36" rx="9" ry="7" fill="#FAF5EB"/>
        <circle cx="27" cy="31" r="1.8" fill="#3B2F2B"/>
        <circle cx="37" cy="31" r="1.8" fill="#3B2F2B"/>
        <circle cx="32" cy="35" r="2" fill="#3B2F2B"/>
      </svg>`,
  };
  return icons[moduleId] || '';
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

function registerCanvasTexture(scene: Phaser.Scene, key: string, canvas: HTMLCanvasElement): void {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }
  scene.textures.addCanvas(key, canvas);
}

/**
 * Registers charming gouache/storybook Canvas2D textures into Phaser for characters,
 * camper vans, landmarks, forage props, and tourists.
 */
export function registerHakubaTextures(scene: Phaser.Scene, gender: Gender, personality: PersonalityId, season: Season): void {
  // 1. Protagonist Sprite
  {
    const [c, ctx] = makeCanvas(72, 92);
    const coat =
      season === 'winter'
        ? personality === 'barista'
          ? '#D86442'
          : personality === 'tinkerer'
          ? '#5A8FB8'
          : personality === 'photographer'
          ? '#4D7C5B'
          : '#C96D7D'
        : '#6EA37A';

    // Shadow
    ctx.fillStyle = 'rgba(59, 47, 43, 0.22)';
    ctx.beginPath();
    ctx.ellipse(36, 82, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boots
    ctx.fillStyle = '#5C4332';
    ctx.strokeStyle = '#3B2F2B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(24, 68, 9, 13, 4);
    ctx.roundRect(39, 68, 9, 13, 4);
    ctx.fill();
    ctx.stroke();

    // Coat / Puffer
    ctx.fillStyle = coat;
    ctx.beginPath();
    ctx.roundRect(20, 42, 32, 30, 10);
    ctx.fill();
    ctx.stroke();

    // Cream Scarf
    ctx.fillStyle = '#FAF5EB';
    ctx.beginPath();
    ctx.roundRect(23, 39, 26, 8, 4);
    ctx.fill();
    ctx.stroke();

    // Back hair for female/NB
    if (gender === 'female') {
      ctx.fillStyle = '#3B2F2B';
      ctx.beginPath();
      ctx.arc(23, 31, 6, 0, Math.PI * 2);
      ctx.arc(49, 31, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head
    ctx.fillStyle = '#FCE5CD';
    ctx.beginPath();
    ctx.arc(36, 28, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rosy cheeks & cute eyes
    ctx.fillStyle = 'rgba(244, 162, 158, 0.65)';
    ctx.beginPath();
    ctx.ellipse(28, 31, 3, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(44, 31, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3B2F2B';
    ctx.beginPath();
    ctx.arc(31, 27, 1.8, 0, Math.PI * 2);
    ctx.arc(41, 27, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Beanie or Straw Sunhat
    ctx.fillStyle = season === 'winter' ? '#E6A23C' : '#E5CFA8';
    if (season === 'winter') {
      ctx.beginPath();
      ctx.arc(36, 20, 14, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FAF5EB';
      ctx.beginPath();
      ctx.arc(36, 6, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(36, 19, 20, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(36, 17, 11, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
    }

    registerCanvasTexture(scene, 'player_sprite', c);
  }

  // 2. Retro Cream & Sage Kei Camper Van (Tier 1 & Tier 2)
  for (const tier of [1, 2] as const) {
    const [c, ctx] = makeCanvas(180, 128);
    const bodyW = tier === 1 ? 116 : 138;
    const startX = (180 - bodyW) / 2;

    // Warm shadow under van & awning rug
    ctx.fillStyle = 'rgba(230, 162, 60, 0.16)';
    ctx.beginPath();
    ctx.roundRect(startX - 14, 72, bodyW + 28, 42, 16);
    ctx.fill();

    // Striped Canvas Awning
    ctx.fillStyle = '#D86442';
    ctx.strokeStyle = '#4A3B32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX + 18, 46);
    ctx.lineTo(startX + bodyW - 14, 46);
    ctx.lineTo(startX + bodyW - 4, 62);
    ctx.lineTo(startX + 12, 62);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // White awning stripes
    ctx.fillStyle = '#FAF5EB';
    for (let sx = startX + 24; sx < startX + bodyW - 22; sx += 22) {
      ctx.fillRect(sx, 48, 10, 12);
    }

    // Roof rack / Pop-up tent
    if (tier === 2) {
      ctx.fillStyle = '#4D7C5B';
      ctx.beginPath();
      ctx.moveTo(startX + 14, 38);
      ctx.lineTo(startX + 34, 16);
      ctx.lineTo(startX + bodyW - 16, 16);
      ctx.lineTo(startX + bodyW - 10, 38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#6E5B4E';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(startX + 20, 28, bodyW - 42, 10, 4);
      ctx.stroke();
    }

    // Van Lower Body (Sage Green) + Upper Body (Warm Cream)
    ctx.fillStyle = '#FAF5EB';
    ctx.strokeStyle = '#4A3B32';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(startX, 36, bodyW, 56, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = tier === 1 ? '#7FA68A' : '#D86442';
    ctx.beginPath();
    ctx.roundRect(startX + 1, 64, bodyW - 2, 28, [0, 0, 13, 13]);
    ctx.fill();

    // Glowing Serving Window
    ctx.fillStyle = '#FCE694';
    ctx.beginPath();
    ctx.roundRect(startX + 22, 44, 48, 22, 5);
    ctx.fill();
    ctx.stroke();

    // Front Windshield
    ctx.fillStyle = '#B8D4E8';
    ctx.beginPath();
    ctx.roundRect(startX + bodyW - 32, 43, 24, 21, 5);
    ctx.fill();
    ctx.stroke();

    // Cute Wheels
    ctx.fillStyle = '#3B2F2B';
    ctx.beginPath();
    ctx.arc(startX + 26, 94, 11, 0, Math.PI * 2);
    ctx.arc(startX + bodyW - 26, 94, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FAF5EB';
    ctx.beginPath();
    ctx.arc(startX + 26, 94, 5, 0, Math.PI * 2);
    ctx.arc(startX + bodyW - 26, 94, 5, 0, Math.PI * 2);
    ctx.fill();

    // Cute Wooden A-frame Menu Board beside van
    ctx.fillStyle = '#8C5E3C';
    ctx.beginPath();
    ctx.roundRect(startX - 18, 74, 16, 22, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FAF5EB';
    ctx.fillRect(startX - 15, 78, 10, 12);

    registerCanvasTexture(scene, `van_tier_${tier}`, c);
  }

  // 3. Steward NPCs (Kenji, Aoi, Hana)
  const stewards: { key: string; coat: string; hat: string; prop: 'cap' | 'beanie' | 'headband' }[] = [
    { key: 'steward_station', coat: '#3B5978', hat: '#25384B', prop: 'cap' },
    { key: 'steward_snowpeak', coat: '#4D7C5B', hat: '#D86442', prop: 'beanie' },
    { key: 'steward_happo', coat: '#C96D7D', hat: '#FAF5EB', prop: 'headband' },
  ];
  for (const s of stewards) {
    const [c, ctx] = makeCanvas(64, 86);
    ctx.fillStyle = 'rgba(59, 47, 43, 0.22)';
    ctx.beginPath();
    ctx.ellipse(32, 78, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = s.coat;
    ctx.strokeStyle = '#3B2F2B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(18, 40, 28, 34, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FCE5CD';
    ctx.beginPath();
    ctx.arc(32, 27, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3B2F2B';
    ctx.beginPath();
    ctx.arc(27.5, 26, 1.7, 0, Math.PI * 2);
    ctx.arc(36.5, 26, 1.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = s.hat;
    if (s.prop === 'cap') {
      ctx.beginPath();
      ctx.roundRect(19, 12, 26, 9, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#E6A23C';
      ctx.fillRect(22, 18, 20, 3);
    } else if (s.prop === 'beanie') {
      ctx.beginPath();
      ctx.arc(32, 20, 13, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.roundRect(19, 16, 26, 6, 3);
      ctx.fill();
      ctx.stroke();
    }

    registerCanvasTexture(scene, s.key, c);
  }

  // 4. Forage Props (Cedar Branch, Birch Bark, Route Plaque)
  {
    const [c, ctx] = makeCanvas(56, 52);
    ctx.fillStyle = 'rgba(59, 47, 43, 0.18)';
    ctx.beginPath();
    ctx.ellipse(28, 42, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8C5E3C';
    ctx.strokeStyle = '#3B2F2B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(10, 24, 36, 10, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4D7C5B';
    ctx.beginPath();
    ctx.arc(16, 22, 7, 0, Math.PI * 2);
    ctx.arc(26, 19, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#E6A23C';
    ctx.fillRect(28, 22, 4, 14);
    registerCanvasTexture(scene, 'prop_cedar', c);
  }
  {
    const [c, ctx] = makeCanvas(56, 52);
    ctx.fillStyle = 'rgba(59, 47, 43, 0.18)';
    ctx.beginPath();
    ctx.ellipse(28, 42, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FAF5EB';
    ctx.strokeStyle = '#4A3B32';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(12, 20, 32, 18, 6);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#8C7B6E';
    ctx.beginPath();
    ctx.moveTo(18, 26);
    ctx.lineTo(27, 26);
    ctx.moveTo(29, 32);
    ctx.lineTo(39, 32);
    ctx.stroke();
    registerCanvasTexture(scene, 'prop_birch', c);
  }
  {
    const [c, ctx] = makeCanvas(56, 52);
    ctx.fillStyle = '#8C5E3C';
    ctx.strokeStyle = '#3B2F2B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(10, 16, 36, 22, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FAF5EB';
    ctx.fillRect(14, 20, 28, 14);
    ctx.fillStyle = '#D86442';
    ctx.fillRect(18, 24, 18, 5);
    registerCanvasTexture(scene, 'prop_plaque', c);
  }

  // 5. Steaming Ashiyu Footbath / Onsen Prop AND Takibi Campfire Hearth Prop
  {
    const [c, ctx] = makeCanvas(104, 72);
    ctx.fillStyle = 'rgba(59, 47, 43, 0.2)';
    ctx.beginPath();
    ctx.ellipse(52, 54, 42, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cedar tub rim
    ctx.fillStyle = '#A67249';
    ctx.strokeStyle = '#4A3B32';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(14, 24, 76, 34, 14);
    ctx.fill();
    ctx.stroke();
    // Warm Turquoise Hot Spring Water
    ctx.fillStyle = '#7FC4C7';
    ctx.beginPath();
    ctx.roundRect(21, 29, 62, 22, 10);
    ctx.fill();
    registerCanvasTexture(scene, 'prop_hearth', c);
  }
  {
    const [c, ctx] = makeCanvas(96, 72);
    // Warm firelight glow
    ctx.fillStyle = 'rgba(230, 162, 60, 0.28)';
    ctx.beginPath();
    ctx.ellipse(48, 50, 38, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // Stone ring & birch logs
    ctx.fillStyle = '#8C5E3C';
    ctx.strokeStyle = '#4A3B32';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(24, 42, 48, 12, 5);
    ctx.fill();
    ctx.stroke();
    // Cozy Takibi Flame
    ctx.fillStyle = '#D86442';
    ctx.beginPath();
    ctx.moveTo(48, 14);
    ctx.quadraticCurveTo(64, 34, 56, 46);
    ctx.lineTo(40, 46);
    ctx.quadraticCurveTo(32, 34, 48, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#F6C453';
    ctx.beginPath();
    ctx.moveTo(48, 24);
    ctx.quadraticCurveTo(56, 36, 52, 44);
    ctx.lineTo(44, 44);
    ctx.quadraticCurveTo(40, 36, 48, 24);
    ctx.fill();
    registerCanvasTexture(scene, 'prop_hearth_takibi', c);
  }

  // 6. Wooden Road Signpost (Portal)
  {
    const [c, ctx] = makeCanvas(76, 82);
    ctx.fillStyle = '#8C5E3C';
    ctx.strokeStyle = '#3B2F2B';
    ctx.lineWidth = 2;
    ctx.fillRect(34, 26, 8, 48);
    ctx.strokeRect(34, 26, 8, 48);
    ctx.fillStyle = '#E5CFA8';
    ctx.beginPath();
    ctx.moveTo(12, 18);
    ctx.lineTo(56, 18);
    ctx.lineTo(66, 28);
    ctx.lineTo(56, 38);
    ctx.lineTo(12, 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    registerCanvasTexture(scene, 'prop_signpost', c);
  }
}

export function getRegionStampSubtitle(id: RegionId): string {
  const map: Record<RegionId, string> = {
    station: 'Arrival Plaza & Ashiyu',
    snowpeak: 'Kengo Kuma Timber Camp',
    happo: 'Alpine Transit & Onsen',
    echoland: 'Acoustic Street',
    iwatake: '360° Summit Harbor',
    goryu: 'Botanical Night Slopes',
    hakuba47: 'Halfpipe & River Base',
    tsugaike: 'Highland Marshland',
    oide: 'Heritage Bridge',
    aokiko: 'Crystal Firefly Lake',
  };
  return map[id];
}
