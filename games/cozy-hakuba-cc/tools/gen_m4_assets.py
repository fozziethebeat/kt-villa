"""Generate M4 washi SVG assets (south arm + Tsugaike, second trades, bigger vans) + manifest entries."""
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

def person(cx, body, hair, extra='', skin='#f3d6bd', legs='#5a596a', hat=''):
    """A 56x88 papercraft person centred at cx (same proportions as the M1 cast)."""
    x = cx - 28
    return f'''  <g transform="translate({x} 0)">
  <ellipse cx="28" cy="84" rx="16" ry="4" fill="{INK}" opacity="0.2"/>
  <path d="M16 82 V60 H40 V82Z" fill="{legs}" {S2}/>
  <path d="M13 62 Q12 40 28 38 Q44 40 43 62Z" fill="{body}" {S2}/>
  {extra}
  <circle cx="28" cy="26" r="13" fill="{skin}" stroke="{INK}" stroke-width="2.5"/>
  <path d="M15 24 Q16 11 28 11 Q40 11 41 24 Q36 17 28 17 Q20 17 15 24Z" fill="{hair}" {S2}/>
  {hat}
  <g fill="{INK}"><circle cx="23" cy="27" r="1.8"/><circle cx="33" cy="27" r="1.8"/></g>
  <path d="M23 33 Q28 36 33 33" stroke="{INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  </g>'''


# --- key people -------------------------------------------------------------------
svg('char_momo', 56, 88, 'key-person', 'Goryu key person; farmer in a straw hat + green apron with a trowel',
    person(28, '#8cc084', '#4a3530', extra=f'<rect x="18" y="44" width="20" height="18" rx="2" fill="#3f6b4f" {S2}/><path d="M44 58 l6 -12" stroke="{INK}" stroke-width="3"/>',
           hat=f'<ellipse cx="28" cy="15" rx="20" ry="5" fill="#e2c48a" {S2}/><path d="M18 15 Q20 4 28 4 Q36 4 38 15Z" fill="#e2c48a" {S2}/><path d="M18 14 H38" stroke="#c8553d" stroke-width="2.5"/>'),
    'Key person: Momo, farmer')
svg('char_yuki_kenta', 100, 88, 'key-person', 'Hakuba 47 key people; ski-tuning couple: helmet + bike jersey, beanie + wax apron',
    person(28, '#4f8f8a', '#2f2a2a', hat=f'<path d="M14 21 Q15 8 28 8 Q41 8 42 21Z" fill="#f2a541" {S2}/>', extra='<path d="M13 52 H43" stroke="#fbfaf6" stroke-width="3"/>')
    + person(72, '#6c7fa3', '#4a3530', hat=f'<path d="M15 20 Q16 9 28 9 Q40 9 41 20Z" fill="#c8553d" {S2}/><circle cx="28" cy="8" r="4" fill="#fbfaf6"/>', extra=f'<rect x="18" y="44" width="20" height="18" rx="2" fill="#a8754b" {S2}/>'),
    'Key people: Yuki & Kenta, tuning couple')
svg('char_chiyo', 56, 88, 'key-person', 'Tsugaike key person; elderly guide with a walking stick, sun hat and field notebook',
    person(28, '#a8754b', '#d8d4cc', skin='#efcfb3', extra=f'<path d="M46 40 V84" stroke="#7a4b3a" stroke-width="4" stroke-linecap="round"/><rect x="16" y="46" width="12" height="14" rx="1.5" fill="#fbfaf6" {S2}/>',
           hat=f'<ellipse cx="28" cy="16" rx="19" ry="5" fill="#8cc084" {S2}/><path d="M19 16 Q21 6 28 6 Q35 6 37 16Z" fill="#8cc084" {S2}/>'),
    'Key person: Grandma Chiyo, nature guide')
svg('char_ren', 56, 88, 'key-person', 'Aokiko key person; SUP renter in a wetsuit top + life vest, paddle',
    person(28, '#3e4f7a', '#2f2a2a', extra=f'<path d="M18 44 H38 V60 H18Z" fill="#f2a541" {S2}/><path d="M48 20 V84" stroke="#a8754b" stroke-width="4"/><ellipse cx="48" cy="18" rx="5" ry="10" fill="#a8754b" {S2}/>'),
    'Key person: Ren, SUP renter')

# --- landmarks ----------------------------------------------------------------------
svg('bldg_greenhouse', 420, 300, 'landmark', 'Goryu alpine-garden greenhouse; glass panes + flower boxes = gardening', f"""{shadow("M20 120 Q210 20 400 120 V292 H20Z")}
  <path d="M20 292 V120 Q210 20 400 120 V292Z" fill="#dfeee4" {S}/>
  <g stroke="{INK}" stroke-width="2.5" fill="none">{''.join(f'<line x1="{x}" y1="{60 if 120<x<300 else 100}" x2="{x}" y2="292"/>' for x in range(70, 400, 50))}<path d="M20 200 H400"/></g>
  <rect x="180" y="200" width="60" height="92" fill="#cfe0ee" {S2}/>
  <g {S2}><rect x="30" y="250" width="120" height="30" fill="#a8754b"/><rect x="270" y="250" width="120" height="30" fill="#a8754b"/></g>
  <g {S2}>{''.join(f'<circle cx="{x}" cy="246" r="8" fill="{c}"/>' for x, c in ((50,'#e89fb0'),(80,'#f2a541'),(110,'#e89fb0'),(140,'#fbfaf6'),(290,'#f2a541'),(320,'#e89fb0'),(350,'#7a5ea8'),(380,'#f2a541')))}</g>""", 'Greenhouse')
svg('deco_garden', 300, 110, 'landmark', 'Alpine garden beds (overgrown until restored)', f"""  <g {S2}><rect x="10" y="40" width="130" height="60" rx="6" fill="#7a4b3a"/><rect x="160" y="40" width="130" height="60" rx="6" fill="#7a4b3a"/></g>
  <g fill="#3f6b4f">{''.join(f'<path d="M{x} 44 q6 -26 12 0Z"/>' for x in range(20, 280, 22))}</g>
  <g {S2}>{''.join(f'<circle cx="{x}" cy="38" r="6" fill="{c}"/>' for x, c in ((40,'#e89fb0'),(100,'#f2a541'),(190,'#7a5ea8'),(250,'#e89fb0')))}</g>""", 'Garden beds')
svg('deco_potting_table', 120, 90, 'interactable', 'Potting table: garden-bed puzzle and farm crate are made here', f"""  <ellipse cx="60" cy="86" rx="54" ry="4" fill="{INK}" opacity="0.18"/>
  <rect x="8" y="40" width="104" height="12" rx="3" fill="#a8754b" {S}/>
  <rect x="16" y="52" width="8" height="34" fill="#7a4b3a"/><rect x="96" y="52" width="8" height="34" fill="#7a4b3a"/>
  <g {S2}><path d="M24 40 L28 22 H48 L52 40Z" fill="#c8553d"/><path d="M66 40 L70 26 H88 L92 40Z" fill="#c8553d"/></g>
  <path d="M36 22 q-6 -14 4 -18 M80 26 q4 -12 -4 -16" stroke="#3f6b4f" stroke-width="4" fill="none"/>""", 'Potting table')
svg('bldg_base_lodge', 420, 300, 'landmark', 'Hakuba 47 base lodge; big A-frame + bike rack = MTB park / ski base', f"""{shadow("M20 292 L210 40 L400 292Z")}
  <path d="M20 292 L210 40 L400 292Z" fill="#a8754b" {S}/>
  <path d="M70 292 L210 100 L350 292Z" fill="#cfe0ee" {S}/>
  <g stroke="{INK}" stroke-width="2.5"><line x1="210" y1="100" x2="210" y2="292"/><line x1="130" y1="210" x2="290" y2="210"/></g>
  <rect x="180" y="230" width="60" height="62" fill="#7a4b3a" {S2}/>
  <rect x="150" y="60" width="120" height="26" rx="5" fill="#2d4f3b" {S2}/>
  <text x="210" y="79" font-family="sans-serif" font-size="16" font-weight="700" fill="#fbfaf6" text-anchor="middle">白馬47 BASE</text>""", 'Base lodge')
svg('deco_trail_map', 140, 140, 'interactable', 'Trail map board: the MTB trail puzzle is here', f"""  <rect x="64" y="96" width="12" height="42" fill="#7a4b3a"/>
  <rect x="8" y="6" width="124" height="96" rx="8" fill="#e8efe0" {S}/>
  <path d="M20 90 L50 30 L80 70 L120 20" stroke="#c8553d" stroke-width="4" fill="none" stroke-dasharray="8 5"/>
  <path d="M20 40 Q70 90 120 80" stroke="#4f8f8a" stroke-width="4" fill="none"/>
  <path d="M40 20 L60 40 L80 30" stroke="#3b3a4a" stroke-width="2" fill="none"/>""", 'Trail map')
svg('deco_bike_stand', 120, 100, 'interactable', 'Bike workstand: the bike-tune timing game is here', f"""  <ellipse cx="60" cy="96" rx="54" ry="4" fill="{INK}" opacity="0.18"/>
  <path d="M60 94 V30" stroke="{INK}" stroke-width="5"/><path d="M40 94 H80" stroke="{INK}" stroke-width="5"/>
  <g fill="none" stroke="{INK}" stroke-width="3"><circle cx="26" cy="54" r="20"/><circle cx="94" cy="54" r="20"/><path d="M26 54 L52 30 H78 L94 54 M52 30 L60 54 H26"/></g>""", 'Bike stand')
svg('bldg_visitor_center', 420, 300, 'landmark', 'Tsugaike nature-park visitor center; wood + big field-guide sign', f"""{shadow("M20 130 L210 60 L400 130 V292 H20Z")}
  <rect x="30" y="130" width="360" height="162" fill="#d9c7a3" {S}/>
  <path d="M14 134 L210 56 L406 134 L380 140 L210 76 L40 140Z" fill="#3f6b4f" {S}/>
  <rect x="80" y="170" width="120" height="70" fill="#cfe0ee" {S2}/><rect x="250" y="190" width="70" height="102" fill="#7a4b3a" {S2}/>
  <rect x="120" y="100" width="180" height="26" rx="5" fill="#fbfaf6" {S2}/>
  <text x="210" y="119" font-family="sans-serif" font-size="15" font-weight="700" fill="#3f6b4f" text-anchor="middle">栂池 NATURE PARK</text>
  <g {S2}><ellipse cx="350" cy="250" rx="18" ry="10" fill="#fbfaf6"/><path d="M350 240 V222" stroke="#3f6b4f" stroke-width="3"/></g>""", 'Visitor center')
svg('deco_wetland', 420, 110, 'landmark', 'Wetland marsh with a boardwalk (broken until restored)', f"""  <ellipse cx="210" cy="60" rx="204" ry="44" fill="#8fbf9f" {S}/>
  <g fill="#4fa3a5" opacity="0.7"><ellipse cx="120" cy="60" rx="60" ry="14"/><ellipse cx="290" cy="66" rx="70" ry="16"/></g>
  <g stroke="#a8754b" stroke-width="10"><line x1="30" y1="70" x2="150" y2="50"/><line x1="200" y1="46" x2="380" y2="70"/></g>
  <g fill="#fbfaf6">{''.join(f'<circle cx="{x}" cy="{y}" r="4"/>' for x, y in ((60,40),(90,80),(250,40),(330,84),(170,86)))}</g>""", 'Wetland')
svg('deco_lake', 760, 140, 'landmark', 'Lake Aoki: clear blue water reaching across the scene', f"""  <path d="M0 40 Q380 -10 760 40 V140 H0Z" fill="#4fa3a5" {S}/>
  <path d="M60 70 H220 M300 90 H520 M560 64 H720" stroke="#bfe3ea" stroke-width="5" stroke-linecap="round"/>
  <path d="M0 40 Q380 -10 760 40" stroke="#dfe6ee" stroke-width="6" fill="none"/>""", 'Lake')
svg('bldg_boathouse', 360, 260, 'landmark', 'Aokiko boathouse; SUP boards leaning outside = rentals', f"""{shadow("M20 110 L180 40 L340 110 V252 H20Z")}
  <rect x="30" y="110" width="300" height="142" fill="#efe3c2" {S}/>
  <path d="M14 114 L180 36 L346 114 L320 120 L180 56 L40 120Z" fill="#4f8f8a" {S}/>
  <rect x="130" y="150" width="100" height="102" fill="#6c7fa3" {S2}/>
  <g {S2}><rect x="250" y="130" width="18" height="120" rx="9" fill="#c8553d"/><rect x="276" y="140" width="18" height="110" rx="9" fill="#f2a541"/><rect x="302" y="134" width="18" height="116" rx="9" fill="#8cc084"/></g>
  <text x="180" y="100" font-family="sans-serif" font-size="16" font-weight="700" fill="#fbfaf6" text-anchor="middle">青木湖 SUP</text>""", 'Boathouse')
svg('deco_jetty', 140, 90, 'interactable', 'Jetty with a camera on a tripod: the photo-framing puzzle', f"""  <rect x="0" y="60" width="140" height="16" fill="#a8754b" {S2}/>
  <g fill="#7a4b3a"><rect x="12" y="76" width="8" height="14"/><rect x="120" y="76" width="8" height="14"/></g>
  <g stroke="{INK}" stroke-width="3"><line x1="70" y1="60" x2="56" y2="30"/><line x1="70" y1="60" x2="84" y2="30"/><line x1="70" y1="60" x2="70" y2="30"/></g>
  <rect x="50" y="10" width="40" height="24" rx="4" fill="{INK}"/><circle cx="70" cy="22" r="7" fill="#9fd3e6"/>""", 'Jetty camera')

# --- fetch items ---------------------------------------------------------------------
svg('item_alpine_plant', 44, 48, 'fetch-item', 'Alpine plant tangled in weeds (fetch item, 1 stamina to rescue)', f"""  <ellipse cx="22" cy="45" rx="16" ry="3" fill="{INK}" opacity="0.2"/>
  <g fill="#6f8f5a">{''.join(f'<path d="M{x} 44 q4 -22 8 0Z"/>' for x in (4, 12, 26, 34))}</g>
  <path d="M22 44 V18" stroke="#3f6b4f" stroke-width="3"/><circle cx="22" cy="14" r="8" fill="#e89fb0" {S2}/>""", 'Alpine plant')
svg('item_trail_marker', 34, 56, 'fetch-item', 'Trail marker post (fetch item for Hakuba 47)', f"""  <ellipse cx="17" cy="53" rx="12" ry="3" fill="{INK}" opacity="0.2"/>
  <rect x="13" y="16" width="8" height="38" fill="#a8754b" {S2}/>
  <path d="M4 6 H28 L32 14 L28 22 H4Z" fill="#c8553d" {S2}/>""", 'Trail marker')
svg('item_marsh_plant', 40, 52, 'fetch-item', 'Marsh plant sample (cotton grass) for the field guide', f"""  <ellipse cx="20" cy="49" rx="14" ry="3" fill="{INK}" opacity="0.2"/>
  <path d="M12 48 Q14 26 16 14 M20 48 V10 M28 48 Q26 26 24 16" stroke="#3f6b4f" stroke-width="3" fill="none"/>
  <g fill="#fbfaf6" {S2}><circle cx="16" cy="12" r="6"/><circle cx="20" cy="8" r="6"/><circle cx="24" cy="13" r="6"/></g>""", 'Marsh plant')
svg('item_litter', 44, 34, 'fetch-item', 'Beach litter: bottle + wrapper (fetch item for Lake Aoki)', f"""  <ellipse cx="22" cy="31" rx="18" ry="3" fill="{INK}" opacity="0.2"/>
  <rect x="6" y="12" width="12" height="18" rx="3" fill="#9fd3e6" {S2}/><rect x="9" y="6" width="6" height="7" fill="#4f8f8a"/>
  <path d="M22 28 l6 -12 l12 4 l-4 10Z" fill="#c8553d" {S2}/>""", 'Litter')

# --- modules + products -------------------------------------------------------------
svg('mod_tent_sauna', 320, 130, 'module', 'Tent Sauna module: stove + tent + plunge tub (second trade: sauna sessions)', f"""  <path d="M30 122 L100 30 L170 122Z" fill="#a8754b" {S}/>
  <path d="M100 30 V122" stroke="{INK}" stroke-width="2.5"/><rect x="120" y="70" width="18" height="40" fill="{INK}"/>
  <path d="M129 66 q8 -14 0 -26 q-8 -10 2 -22" stroke="#dfe6ee" stroke-width="5" fill="none"/>
  <rect x="196" y="76" width="104" height="46" rx="10" fill="#9fd3e6" {S}/><path d="M206 92 h84" stroke="#fbfaf6" stroke-width="3"/>
  <rect x="0" y="122" width="320" height="8" fill="#8a96a8"/>""", 'Tent sauna')
svg('mod_tour_desk', 160, 130, 'module', 'Tour Desk module: map board + snowshoes (second trade: tours)', f"""  <rect x="22" y="70" width="116" height="52" rx="6" fill="#a8754b" {S}/>
  <rect x="34" y="18" width="70" height="50" rx="4" fill="#e8efe0" {S2}/><path d="M42 58 L60 30 L74 48 L96 26" stroke="#c8553d" stroke-width="3" fill="none"/>
  <g {S2}><ellipse cx="122" cy="48" rx="9" ry="20" fill="#6c7fa3"/><ellipse cx="136" cy="52" rx="9" ry="20" fill="#6c7fa3"/></g>
  <rect x="0" y="122" width="160" height="8" fill="#8a96a8"/>""", 'Tour desk')
svg('mod_loft_bed', 320, 130, 'module', 'Loft Bed (living): sleep up high, comfort +3', f"""  <rect x="20" y="20" width="280" height="46" rx="8" fill="#6c7fa3" {S}/>
  <rect x="34" y="10" width="70" height="20" rx="8" fill="#fbfaf6" {S2}/>
  <g stroke="{INK}" stroke-width="5"><line x1="30" y1="66" x2="30" y2="122"/><line x1="290" y1="66" x2="290" y2="122"/></g>
  <g stroke="#a8754b" stroke-width="4">{''.join(f'<line x1="252" y1="{y}" x2="282" y2="{y}"/>' for y in (80, 96, 112))}</g>
  <rect x="0" y="122" width="320" height="8" fill="#a8754b"/>""", 'Loft bed')
svg('prod_sauna_session', 64, 64, 'product', 'Product icon: sauna session (steam over hot stones)', f"""  <ellipse cx="32" cy="50" rx="24" ry="10" fill="#5a596a" {S}/>
  <g fill="#9aa1ab" {S2}><circle cx="22" cy="44" r="7"/><circle cx="36" cy="42" r="8"/><circle cx="44" cy="48" r="6"/></g>
  <path d="M20 30 q6 -8 0 -16 M32 28 q6 -8 0 -16 M44 30 q6 -8 0 -16" stroke="#b7b3ad" stroke-width="3" fill="none" stroke-linecap="round"/>""", 'sauna_session')
svg('prod_herbal_tea', 64, 64, 'product', 'Product icon: herbal tea (glass cup with a sprig)', f"""  <path d="M16 24 h32 l-4 30 q-1 6 -7 6 h-10 q-6 0 -7 -6Z" fill="#e2c48a" {S}/>
  <path d="M32 24 q4 -14 14 -16" stroke="#3f6b4f" stroke-width="3" fill="none"/><ellipse cx="44" cy="10" rx="6" ry="3" fill="#8cc084"/>""", 'herbal_tea')
svg('prod_guided_hike', 64, 64, 'product', 'Product icon: guided hike (boot + flag on a trail)', f"""  <path d="M6 54 Q30 40 58 50" stroke="#a8754b" stroke-width="4" fill="none" stroke-dasharray="6 4"/>
  <path d="M10 46 V26 h14 l2 12 h10 q6 0 6 8Z" fill="#7a4b3a" {S2}/>
  <path d="M46 44 V10" stroke="{INK}" stroke-width="3"/><path d="M46 10 h14 l-4 6 l4 6 h-14Z" fill="#c8553d" {S2}/>""", 'guided_hike')
svg('prod_snowshoe_tour', 64, 64, 'product', 'Product icon: snowshoe tour (pair of snowshoes)', f"""  <g {S2}><ellipse cx="22" cy="34" rx="12" ry="24" fill="#6c7fa3"/><ellipse cx="44" cy="30" rx="12" ry="24" fill="#6c7fa3"/></g>
  <g stroke="#fbfaf6" stroke-width="2">{''.join(f'<line x1="{x-8}" y1="{y}" x2="{x+8}" y2="{y}"/>' for x, y in ((22,26),(22,36),(22,46),(44,22),(44,32),(44,42)))}</g>""", 'snowshoe_tour')

# --- bigger vans --------------------------------------------------------------------
svg('van_box', 240, 150, 'van', 'Tier 2 Box Van 4WD: taller, longer, chunky tires', f"""  <ellipse cx="120" cy="140" rx="110" ry="8" fill="{INK}" opacity="0.18"/>
  <path d="M10 126 V34 Q10 18 26 18 H178 Q196 18 206 36 L226 80 Q232 90 232 104 V126Z" fill="#efe3c2" {S}/>
  <rect x="10" y="92" width="222" height="12" fill="#4f8f8a"/>
  <path d="M180 30 H188 Q198 30 204 44 L218 78 H180Z" fill="#cfe0ee" {S}/>
  <g fill="#cfe0ee" {S}><rect x="22" y="32" width="46" height="42" rx="6"/><rect x="76" y="32" width="46" height="42" rx="6"/><rect x="128" y="32" width="44" height="42" rx="6"/></g>
  <path d="M76 32 h96 v-6 h-96Z" fill="#c8553d"/>
  <g stroke="{INK}" stroke-width="3"><circle cx="54" cy="126" r="20" fill="{INK}"/><circle cx="190" cy="126" r="20" fill="{INK}"/></g>
  <g fill="#cfc8bd"><circle cx="54" cy="126" r="8"/><circle cx="190" cy="126" r="8"/></g>
  <rect x="30" y="8" width="160" height="8" rx="3" fill="#5a596a" {S2}/>""", 'Box van')
svg('van_camper', 240, 150, 'van', 'Tier 3 Overland Camper: pop-top roof, chains on the tires', f"""  <ellipse cx="120" cy="140" rx="112" ry="8" fill="{INK}" opacity="0.18"/>
  <path d="M30 34 L60 4 H170 L190 34Z" fill="#f2a541" {S}/>
  <path d="M8 126 V44 Q8 32 22 32 H182 Q198 32 208 48 L228 84 Q234 94 234 106 V126Z" fill="#efe3c2" {S}/>
  <rect x="8" y="94" width="226" height="12" fill="#3f6b4f"/>
  <path d="M184 44 H190 Q200 44 206 58 L220 86 H184Z" fill="#cfe0ee" {S}/>
  <g fill="#cfe0ee" {S}><rect x="20" y="46" width="70" height="36" rx="6"/><rect x="100" y="46" width="72" height="36" rx="6"/></g>
  <g stroke="{INK}" stroke-width="3"><circle cx="54" cy="126" r="21" fill="{INK}"/><circle cx="190" cy="126" r="21" fill="{INK}"/></g>
  <g stroke="#cfc8bd" stroke-width="3" fill="none"><circle cx="54" cy="126" r="16" stroke-dasharray="3 3"/><circle cx="190" cy="126" r="16" stroke-dasharray="3 3"/></g>""", 'Camper')

m = json.load(open(M))
have = {a['id'] for a in m['assets']}
for a in assets:
    if a['id'] in have: m['assets'] = [a if x['id'] == a['id'] else x for x in m['assets']]
    else: m['assets'].append(a)
json.dump(m, open(M, 'w'), indent=2, ensure_ascii=False)
open(M, 'a').write('\n')
print(len(assets), 'assets;', len(m['assets']), 'in manifest')
