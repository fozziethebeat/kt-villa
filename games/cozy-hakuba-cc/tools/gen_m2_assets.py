"""Generate M2 washi-papercraft SVG assets (Snow Peak, soba line, roof modules, puzzles) + manifest entries."""
import json, os
A = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')
M = os.path.join(os.path.dirname(__file__), '..', 'content', 'asset-manifest.json')
INK = '#3b3a4a'
S = f'stroke="{INK}" stroke-width="3" stroke-linejoin="round"'
S2 = f'stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"'
assets = []

def svg(id, w, h, role, purpose, body, comment):
    with open(os.path.join(A, f'{id}.svg'), 'w') as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">\n  <!-- {comment} -->\n{body}\n</svg>\n')
    assets.append({'id': id, 'file': f'{id}.svg', 'w': w, 'h': h, 'role': role, 'purpose': purpose})

shadow = lambda d: f'  <g transform="translate(6 7)" opacity="0.28" fill="{INK}"><path d="{d}"/></g>'

# --- Snow Peak buildings -------------------------------------------------------
svg('bldg_snowpeak', 440, 300, 'landmark', 'Outdoor gear shop + campfield office; long glass front, tent icon sign = camping', f'''{shadow("M10 120 L220 40 L430 120 V292 H10Z")}
  <rect x="20" y="120" width="400" height="172" rx="4" fill="#d9c7a3" {S}/>
  <path d="M6 124 L220 36 L434 124 L408 130 L220 60 L32 130Z" fill="#5a5f6e" {S}/>
  <g fill="#a8754b"><rect x="20" y="130" width="400" height="10"/></g>
  <g stroke="#a8754b" stroke-width="5">{''.join(f'<line x1="{x}" y1="140" x2="{x}" y2="292"/>' for x in range(50, 420, 40))}</g>
  <rect x="60" y="170" width="250" height="100" fill="#cfe0ee" {S}/>
  <g stroke="{INK}" stroke-width="2.5">{''.join(f'<line x1="{x}" y1="170" x2="{x}" y2="270"/>' for x in (122, 185, 248))}</g>
  <g fill="#f2a541" opacity="0.55"><rect x="64" y="236" width="56" height="30"/><rect x="190" y="236" width="56" height="30"/></g>
  <rect x="330" y="190" width="64" height="102" fill="#7a4b3a" {S}/><circle cx="382" cy="244" r="4" fill="#f2a541"/>
  <rect x="130" y="80" width="180" height="40" rx="6" fill="#2d4f3b" {S}/>
  <path d="M150 112 L166 90 L182 112Z" fill="#f2a541" stroke="#fbfaf6" stroke-width="2"/>
  <text x="246" y="107" font-family="sans-serif" font-size="18" font-weight="700" fill="#fbfaf6" text-anchor="middle">CAMP · 道具</text>''', 'Snow Peak Land Station: gear shop + campfield office')

svg('bldg_garage', 280, 230, 'landmark', 'Takumi\'s garage; roll-up door + wrench sign = van upgrades happen here', f'''{shadow("M10 70 L140 20 L270 70 V222 H10Z")}
  <rect x="18" y="70" width="244" height="152" rx="4" fill="#b8c2cc" {S}/>
  <path d="M6 74 L140 18 L274 74 L250 80 L140 38 L30 80Z" fill="#7a4b3a" {S}/>
  <rect x="44" y="104" width="160" height="118" fill="#8a96a8" {S}/>
  <g stroke="{INK}" stroke-width="2" opacity="0.7">{''.join(f'<line x1="44" y1="{y}" x2="204" y2="{y}"/>' for y in range(118, 222, 14))}</g>
  <rect x="216" y="112" width="34" height="34" rx="4" fill="#cfe0ee" {S2}/>
  <circle cx="140" cy="58" r="16" fill="#f2a541" {S2}/>
  <path d="M132 66 L146 52 M144 50 a5 5 0 1 1 6 6" stroke="{INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>''', 'Garage with roll-up door')

svg('deco_workbench_out', 130, 100, 'interactable', 'Outdoor workbench by the garage: where your first module is built', f'''  <ellipse cx="65" cy="96" rx="58" ry="5" fill="{INK}" opacity="0.18"/>
  <rect x="10" y="40" width="110" height="14" rx="3" fill="#a8754b" {S}/>
  <rect x="18" y="54" width="10" height="40" fill="#7a4b3a" {S2}/><rect x="102" y="54" width="10" height="40" fill="#7a4b3a" {S2}/>
  <rect x="24" y="74" width="82" height="8" fill="#7a4b3a"/>
  <rect x="30" y="22" width="44" height="18" rx="2" fill="#dfe6ee" {S2}/><path d="M36 28 h32 M36 34 h24" stroke="#4f8f8a" stroke-width="2"/>
  <path d="M86 38 l16 -24" stroke="{INK}" stroke-width="5" stroke-linecap="round"/><rect x="96" y="6" width="14" height="10" rx="2" fill="#c8553d" {S2}/>''', 'Outdoor workbench')

# --- Takumi ----------------------------------------------------------------------
svg('char_takumi', 56, 88, 'key-person', 'Snow Peak key person; orange cap + teal overalls + wrench = the mechanic', f'''  <ellipse cx="28" cy="84" rx="16" ry="4" fill="{INK}" opacity="0.2"/>
  <path d="M15 82 V58 H41 V82Z" fill="#4f8f8a" {S2}/>
  <line x1="28" y1="62" x2="28" y2="82" stroke="{INK}" stroke-width="2"/>
  <path d="M13 62 Q12 40 28 38 Q44 40 43 62Z" fill="#dfe6ee" {S2}/>
  <path d="M19 40 V60 M37 40 V60" stroke="#4f8f8a" stroke-width="5"/>
  <path d="M44 56 l8 -14" stroke="{INK}" stroke-width="4" stroke-linecap="round"/><circle cx="52" cy="41" r="4" fill="none" stroke="{INK}" stroke-width="2.5"/>
  <circle cx="28" cy="26" r="13" fill="#e8c4a4" stroke="{INK}" stroke-width="2.5"/>
  <path d="M14 22 Q15 10 28 10 Q41 10 42 22Z" fill="#f2a541" {S2}/><path d="M38 21 h12" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>
  <g fill="{INK}"><circle cx="23" cy="27" r="1.8"/><circle cx="33" cy="27" r="1.8"/></g>
  <path d="M23 33 Q28 36 33 33" stroke="{INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M18 31 l3 1 M38 31 l-3 1" stroke="#5a596a" stroke-width="1.4"/>''', 'Key person: Takumi, gear-shop mechanic')

# --- Tent props ------------------------------------------------------------------
svg('tent_flat', 180, 70, 'interactable', 'Collapsed demo tent: the puzzle quest is here', f'''  <ellipse cx="90" cy="64" rx="84" ry="6" fill="{INK}" opacity="0.18"/>
  <path d="M12 60 Q40 34 70 46 Q96 28 124 44 Q150 36 170 60Z" fill="#f2a541" {S}/>
  <path d="M40 52 Q70 44 96 50 M110 50 Q130 46 150 54" stroke="#c8553d" stroke-width="2.5" fill="none"/>
  <path d="M120 22 l30 -10 M128 30 l26 -2" stroke="#7a4b3a" stroke-width="4" stroke-linecap="round"/>''', 'Collapsed tent')

svg('tent_pitched', 200, 140, 'landmark', 'Pitched demo tent with taut guy lines: Snow Peak is waking up', f'''  <ellipse cx="100" cy="134" rx="94" ry="6" fill="{INK}" opacity="0.18"/>
  <g stroke="{INK}" stroke-width="1.8"><line x1="100" y1="14" x2="6" y2="130"/><line x1="100" y1="14" x2="194" y2="130"/></g>
  <path d="M30 130 L100 14 L170 130Z" fill="#f2a541" {S}/>
  <path d="M100 14 L100 130" stroke="#c8553d" stroke-width="3"/>
  <path d="M78 130 L100 70 L122 130Z" fill="#7a4b3a" {S2}/>
  <g fill="#7a4b3a"><rect x="3" y="124" width="6" height="10"/><rect x="191" y="124" width="6" height="10"/></g>''', 'Pitched tent')

svg('tent_top', 144, 144, 'puzzle', 'Tent seen from above (3x3 cells); orange = fabric, corner rings = guy-line anchors', f'''  <rect x="10" y="10" width="124" height="124" rx="12" fill="#f2a541" {S}/>
  <path d="M10 10 L134 134 M134 10 L10 134" stroke="#c8553d" stroke-width="3"/>
  <circle cx="72" cy="72" r="10" fill="#7a4b3a" {S2}/>
  <g fill="#fbfaf6" {S2}><circle cx="24" cy="24" r="7"/><circle cx="120" cy="24" r="7"/><circle cx="24" cy="120" r="7"/><circle cx="120" cy="120" r="7"/></g>''', 'Tent top-down')

svg('peg', 28, 28, 'puzzle', 'Tent peg: where a guy line is staked', f'''  <circle cx="14" cy="14" r="10" fill="#7a4b3a" {S2}/><circle cx="14" cy="14" r="4" fill="#d9c7a3"/>''', 'Tent peg')

svg('rock', 44, 44, 'puzzle', 'Rock: can\'t peg here', f'''  <path d="M6 32 Q4 14 18 8 Q32 4 38 16 Q44 30 34 38 Q18 44 6 32Z" fill="#9aa1ab" {S2}/>
  <path d="M14 18 Q20 14 26 16" stroke="#dfe6ee" stroke-width="3" fill="none" stroke-linecap="round"/>''', 'Rock')

svg('item_van_part', 52, 44, 'fetch-item', 'Salvageable van part (glinting pile): fetch quest item', f'''  <ellipse cx="26" cy="40" rx="22" ry="4" fill="{INK}" opacity="0.2"/>
  <path d="M6 38 Q10 22 26 20 Q42 22 46 38Z" fill="#a8754b" {S2}/>
  <circle cx="20" cy="22" r="8" fill="#b8c2cc" {S2}/><circle cx="20" cy="22" r="3" fill="#a8754b"/>
  <path d="M30 20 l12 -12" stroke="{INK}" stroke-width="4" stroke-linecap="round"/><circle cx="43" cy="7" r="4" fill="none" stroke="{INK}" stroke-width="2.5"/>
  <path d="M40 26 l4 -4 M44 30 l5 -1" stroke="#f2a541" stroke-width="2.5" stroke-linecap="round"/>''', 'Van part pile')

# --- Modules -----------------------------------------------------------------------
svg('mod_soba_kitchen', 320, 130, 'module', 'Soba Kitchen module: induction pot + cutting board (production: soba, onigiri)', f'''  <rect x="16" y="56" width="288" height="66" rx="8" fill="#8a96a8" {S}/>
  <rect x="34" y="40" width="100" height="18" rx="4" fill="{INK}"/>
  <path d="M44 40 V18 Q84 8 124 18 V40Z" fill="#dfe6ee" {S}/>
  <path d="M64 12 q4 -8 0 -12 M84 10 q4 -8 0 -12 M104 12 q4 -8 0 -12" stroke="#b7b3ad" stroke-width="3" fill="none"/>
  <rect x="160" y="34" width="124" height="24" rx="4" fill="#d9b88f" {S2}/>
  <g stroke="#7a4b3a" stroke-width="2">{''.join(f'<line x1="{x}" y1="38" x2="{x}" y2="54"/>' for x in range(172, 280, 10))}</g>
  <rect x="0" y="122" width="320" height="8" fill="#8a96a8"/>''', 'Soba kitchen module')

svg('mod_oyaki_griddle', 160, 130, 'module', 'Oyaki Griddle module: round dumplings on a hot plate (production: oyaki)', f'''  <rect x="24" y="60" width="112" height="60" rx="8" fill="#5a596a" {S}/>
  <ellipse cx="80" cy="56" rx="56" ry="14" fill="{INK}"/>
  <g fill="#e2c48a" {S2}><ellipse cx="56" cy="50" rx="16" ry="9"/><ellipse cx="96" cy="50" rx="16" ry="9"/><ellipse cx="76" cy="40" rx="16" ry="9"/></g>
  <g fill="#7a4b3a"><circle cx="52" cy="48" r="2"/><circle cx="92" cy="48" r="2"/><circle cx="72" cy="38" r="2"/></g>
  <rect x="0" y="122" width="160" height="8" fill="#8a96a8"/>''', 'Oyaki griddle module')

svg('mod_solar_panel', 160, 80, 'roof-module', 'Solar Panel (roof): +2 stock each shift', f'''  <path d="M20 60 L40 14 H140 L120 60Z" fill="#3e5f8a" {S}/>
  <g stroke="#9fd3e6" stroke-width="2"><line x1="73" y1="14" x2="53" y2="60"/><line x1="106" y1="14" x2="86" y2="60"/><line x1="30" y1="37" x2="130" y2="37"/></g>
  <rect x="50" y="60" width="8" height="14" fill="{INK}"/><rect x="102" y="60" width="8" height="14" fill="{INK}"/>
  <circle cx="146" cy="12" r="8" fill="#f2a541" {S2}/>''', 'Solar panel roof module')

svg('mod_ski_box', 160, 80, 'roof-module', 'Ski Box (roof): skiers spot you, +20% winter customers', f'''  <path d="M12 62 Q12 22 50 20 H120 Q150 22 150 54 Q150 64 140 64 H20 Q12 64 12 62Z" fill="#c8553d" {S}/>
  <path d="M30 40 H130" stroke="#fbfaf6" stroke-width="3" stroke-linecap="round"/>
  <g stroke="{INK}" stroke-width="3" stroke-linecap="round"><line x1="40" y1="64" x2="40" y2="76"/><line x1="120" y1="64" x2="120" y2="76"/></g>
  <path d="M60 10 l40 0 M66 4 l28 12" stroke="#6c7fa3" stroke-width="3" stroke-linecap="round"/>''', 'Ski box roof module')

svg('mod_roof_planter', 160, 80, 'roof-module', 'Roof Planter (roof): herbs + flowers, +20% green-season customers, comfort +1', f'''  <rect x="16" y="44" width="128" height="26" rx="4" fill="#a8754b" {S}/>
  <g fill="#3f6b4f" {S2}><path d="M30 46 Q26 20 40 14 Q44 30 40 46Z"/><path d="M62 46 Q60 24 74 18 Q78 34 72 46Z"/><path d="M100 46 Q96 22 110 16 Q114 32 108 46Z"/></g>
  <g {S2}><circle cx="52" cy="30" r="6" fill="#e89fb0"/><circle cx="88" cy="26" r="6" fill="#f2a541"/><circle cx="126" cy="30" r="6" fill="#e89fb0"/></g>''', 'Roof planter module')

# --- Products ----------------------------------------------------------------------
svg('prod_kake_soba', 64, 64, 'product', 'Product icon: kake soba (hot noodle bowl)', f'''  <path d="M8 30 H56 Q54 56 32 56 Q10 56 8 30Z" fill="#c8553d" {S}/>
  <ellipse cx="32" cy="30" rx="24" ry="6" fill="#8b5a3c" {S2}/>
  <path d="M16 30 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0" stroke="#d9c7a3" stroke-width="2.5" fill="none"/>
  <path d="M40 22 L58 6 M44 24 L62 10" stroke="#a8754b" stroke-width="3" stroke-linecap="round"/>
  <path d="M22 18 q4 -6 0 -12" stroke="#b7b3ad" stroke-width="3" fill="none" stroke-linecap="round"/>''', 'kake_soba')

svg('prod_onigiri', 64, 64, 'product', 'Product icon: onigiri (rice ball with nori)', f'''  <path d="M32 6 Q40 6 50 26 Q60 46 52 54 Q44 60 32 60 Q20 60 12 54 Q4 46 14 26 Q24 6 32 6Z" fill="#fbfaf6" {S}/>
  <path d="M20 40 H44 V60 Q32 61 20 60Z" fill="#2d4f3b" {S2}/>
  <circle cx="32" cy="28" r="4" fill="#c8553d"/>''', 'onigiri')

svg('prod_nozawana_oyaki', 64, 64, 'product', 'Product icon: nozawana oyaki (grilled dumpling)', f'''  <ellipse cx="32" cy="38" rx="26" ry="18" fill="#e2c48a" {S}/>
  <path d="M14 40 Q32 30 50 40" stroke="#a8754b" stroke-width="2.5" fill="none"/>
  <g fill="#7a4b3a"><circle cx="24" cy="32" r="2.5"/><circle cx="40" cy="30" r="2.5"/><circle cx="34" cy="44" r="2.5"/></g>
  <path d="M30 22 Q34 12 44 12" stroke="#3f6b4f" stroke-width="4" fill="none" stroke-linecap="round"/>''', 'nozawana_oyaki')

# --- Van with Tier-1 kit ----------------------------------------------------------
svg('van_kit_t1', 240, 150, 'van', 'Tier 1 overlay: chunky snow tires + roof rack (drawn over van_kei)', f'''  <g stroke="{INK}" stroke-width="3"><circle cx="66" cy="128" r="20" fill="{INK}"/><circle cx="186" cy="128" r="20" fill="{INK}"/></g>
  <g stroke="#cfc8bd" stroke-width="3" stroke-dasharray="4 4" fill="none"><circle cx="66" cy="128" r="15"/><circle cx="186" cy="128" r="15"/></g>
  <g fill="#cfc8bd"><circle cx="66" cy="128" r="7"/><circle cx="186" cy="128" r="7"/></g>
  <rect x="38" y="16" width="140" height="8" rx="3" fill="#5a596a" {S2}/>
  <g stroke="{INK}" stroke-width="3"><line x1="52" y1="24" x2="52" y2="32"/><line x1="164" y1="24" x2="164" y2="32"/></g>''', 'Tier 1 van kit overlay')

# --- Noodle cut mini-game -------------------------------------------------------
svg('soba_board', 520, 220, 'minigame', 'Noodle-cut board: a folded sheet of soba dough on a wooden board', f'''  <rect x="6" y="20" width="508" height="190" rx="14" fill="#d9b88f" {S}/>
  <g stroke="#a8754b" stroke-width="2" opacity="0.6"><path d="M20 60 Q260 50 500 70"/><path d="M20 150 Q260 160 500 140"/></g>
  <rect x="60" y="56" width="400" height="118" rx="10" fill="#b8a07a" {S}/>
  <path d="M60 92 H460" stroke="#9c8562" stroke-width="2"/><path d="M60 128 H460" stroke="#9c8562" stroke-width="2"/>''', 'Soba board')

svg('soba_knife', 90, 150, 'minigame', 'Soba-kiri knife (tall square blade)', f'''  <rect x="8" y="30" width="74" height="104" rx="4" fill="#dfe6ee" {S}/>
  <path d="M8 120 H82" stroke="#9aa1ab" stroke-width="4"/>
  <rect x="20" y="4" width="50" height="28" rx="6" fill="#7a4b3a" {S}/>''', 'Soba knife')

# write manifest
m = json.load(open(M))
have = {a['id'] for a in m['assets']}
for a in assets:
    if a['id'] in have:
        m['assets'] = [a if x['id'] == a['id'] else x for x in m['assets']]
    else:
        m['assets'].append(a)
json.dump(m, open(M, 'w'), indent=2, ensure_ascii=False)
open(M, 'a').write('\n')
print(len(assets), 'assets;', len(m['assets']), 'in manifest')
