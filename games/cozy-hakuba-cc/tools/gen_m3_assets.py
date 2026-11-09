"""Generate M3 north-arm washi SVG assets + manifest entries (people, landmarks, fetch items, stations)."""
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
svg('char_hana', 56, 88, 'key-person', 'Bus Terminal key person; navy dispatcher uniform + cap + clipboard',
    person(28, '#3e4f7a', '#2f2a2a', extra=f'<rect x="36" y="44" width="12" height="16" rx="2" fill="#fbfaf6" {S2}/><path d="M38 49 h8 M38 53 h6" stroke="#4f8f8a" stroke-width="1.6"/>',
           hat=f'<path d="M14 20 Q15 9 28 9 Q41 9 42 20Z" fill="#3e4f7a" {S2}/><path d="M38 19 h10" stroke="{INK}" stroke-width="3" stroke-linecap="round"/><circle cx="28" cy="14" r="2.5" fill="#f2a541"/>'),
    'Key person: Hana, bus dispatcher')
svg('char_kenji_mai', 100, 88, 'key-person', 'Echoland key people; izakaya couple: headband + indigo happi, red apron',
    person(28, '#3e4f7a', '#2f2a2a', extra='<path d="M20 42 L28 62 L36 42" fill="none" stroke="#fbfaf6" stroke-width="3"/>', hat=f'<path d="M15 19 H41" stroke="#fbfaf6" stroke-width="5"/><path d="M15 19 H41" stroke="{INK}" stroke-width="1"/>')
    + person(72, '#c8553d', '#4a3530', extra=f'<rect x="20" y="46" width="16" height="16" rx="2" fill="#fbfaf6" {S2}/>', hat='<circle cx="28" cy="9" r="6" fill="#4a3530"/>'),
    'Key people: Kenji & Mai, izakaya owners')
svg('char_daichi', 56, 88, 'key-person', 'Happo Pond key person; hut keeper with beard, green fleece, big pack',
    f'  <rect x="30" y="36" width="22" height="34" rx="6" fill="#a8754b" {S2}/>' + person(28, '#3f6b4f', '#5a4636', extra='', hat=f'<path d="M17 30 Q28 46 39 30 Q34 38 28 38 Q22 38 17 30Z" fill="#5a4636"/>'),
    'Key person: Daichi, mountain-hut keeper')
svg('char_sora', 56, 88, 'key-person', 'Iwatake key person; gondola operator in a bright red jacket + radio',
    person(28, '#c8553d', '#2f2a2a', extra=f'<rect x="38" y="44" width="8" height="14" rx="2" fill="{INK}"/><path d="M42 44 V36" stroke="{INK}" stroke-width="2"/><path d="M13 52 H43" stroke="#fbfaf6" stroke-width="3"/>',
           hat=f'<path d="M15 21 Q16 12 28 12 Q40 12 41 21" fill="none" stroke="#f2a541" stroke-width="5"/>'),
    'Key person: Sora, gondola operator')

# --- landmarks ----------------------------------------------------------------------
svg('bldg_bus_terminal', 440, 300, 'landmark', 'Happo-One Bus Terminal; long glass waiting hall + bus-stop sign', f'''{shadow("M10 130 H430 V292 H10Z")}
  <rect x="20" y="130" width="400" height="162" rx="4" fill="#dfe6ee" {S}/>
  <path d="M6 134 L40 96 H400 L434 134Z" fill="#3e4f7a" {S}/>
  <rect x="40" y="160" width="300" height="110" fill="#cfe0ee" {S}/>
  <g stroke="{INK}" stroke-width="2.5">{''.join(f'<line x1="{x}" y1="160" x2="{x}" y2="270"/>' for x in (100, 160, 220, 280))}</g>
  <rect x="356" y="190" width="48" height="102" fill="#6c7fa3" {S}/>
  <rect x="120" y="104" width="200" height="26" rx="5" fill="#fbfaf6" {S2}/>
  <text x="220" y="123" font-family="sans-serif" font-size="16" font-weight="700" fill="#3e4f7a" text-anchor="middle">八方 BUS TERMINAL</text>
  <g fill="#f2a541" opacity="0.5"><rect x="44" y="240" width="52" height="26"/><rect x="224" y="240" width="52" height="26"/></g>''', 'Bus terminal')
svg('deco_bus', 240, 120, 'landmark', 'Valley shuttle bus (scenery)', f'''  <ellipse cx="120" cy="114" rx="110" ry="6" fill="{INK}" opacity="0.18"/>
  <rect x="10" y="20" width="220" height="80" rx="14" fill="#f2a541" {S}/>
  <rect x="10" y="64" width="220" height="10" fill="#c8553d"/>
  <g fill="#cfe0ee" {S2}>{''.join(f'<rect x="{x}" y="30" width="34" height="26" rx="4"/>' for x in (24, 66, 108, 150))}<rect x="192" y="30" width="28" height="40" rx="4"/></g>
  <g {S2} fill="{INK}"><circle cx="54" cy="100" r="13"/><circle cx="186" cy="100" r="13"/></g>''', 'Shuttle bus')
svg('deco_route_board', 120, 130, 'interactable', 'Route board: shuttle routes puzzle + timetable happen here', f'''  <rect x="54" y="80" width="12" height="48" fill="#7a4b3a"/>
  <rect x="8" y="6" width="104" height="80" rx="8" fill="#fbfaf6" {S}/>
  <path d="M22 26 Q50 60 98 30" stroke="#c8553d" stroke-width="4" fill="none"/><path d="M22 66 Q60 30 98 64" stroke="#4f8f8a" stroke-width="4" fill="none"/>
  <g {S2}><circle cx="22" cy="26" r="6" fill="#c8553d"/><circle cx="98" cy="30" r="6" fill="#c8553d"/><circle cx="22" cy="66" r="6" fill="#4f8f8a"/><circle cx="98" cy="64" r="6" fill="#4f8f8a"/></g>''', 'Route board')
svg('bldg_izakaya', 420, 300, 'landmark', 'Echoland izakaya; noren over the door + red lanterns = food and evenings', f'''{shadow("M14 110 L210 50 L406 110 V292 H14Z")}
  <rect x="24" y="110" width="372" height="182" rx="4" fill="#a8754b" {S}/>
  <path d="M8 114 L210 46 L412 114 L386 120 L210 66 L34 120Z" fill="#3b3a4a" {S}/>
  <g stroke="#7a4b3a" stroke-width="4">{''.join(f'<line x1="{x}" y1="124" x2="{x}" y2="292"/>' for x in range(44, 400, 22))}</g>
  <rect x="150" y="186" width="120" height="106" fill="#3b3a4a" {S}/>
  <g fill="#3e4f7a" {S2}><rect x="150" y="186" width="38" height="46"/><rect x="191" y="186" width="38" height="46"/><rect x="232" y="186" width="38" height="46"/></g>
  <text x="210" y="216" font-family="sans-serif" font-size="18" font-weight="700" fill="#fbfaf6" text-anchor="middle">居酒屋</text>
  <rect x="44" y="170" width="84" height="64" fill="#f2d49b" {S}/><rect x="292" y="170" width="84" height="64" fill="#f2d49b" {S}/>
  <g {S2}><ellipse cx="128" cy="150" rx="14" ry="20" fill="#c8553d"/><ellipse cx="292" cy="150" rx="14" ry="20" fill="#c8553d"/></g>''', 'Izakaya building')
svg('deco_grill', 110, 90, 'interactable', 'Charcoal yakitori grill: the cooking quest happens here', f'''  <ellipse cx="55" cy="86" rx="48" ry="4" fill="{INK}" opacity="0.2"/>
  <rect x="10" y="34" width="90" height="26" rx="4" fill="{INK}"/>
  <rect x="14" y="30" width="82" height="8" fill="#c8553d"/>
  <g stroke="#a8754b" stroke-width="3" stroke-linecap="round">{''.join(f'<line x1="{x}" y1="22" x2="{x+8}" y2="40"/>' for x in (22, 40, 58, 76))}</g>
  <g fill="#8b5a3c">{''.join(f'<circle cx="{x+4}" cy="30" r="4"/>' for x in (22, 40, 58, 76))}</g>
  <rect x="20" y="60" width="8" height="26" fill="#5a596a"/><rect x="82" y="60" width="8" height="26" fill="#5a596a"/>
  <path d="M40 18 q4 -8 0 -14 M70 18 q4 -8 0 -14" stroke="#b7b3ad" stroke-width="3" fill="none"/>''', 'Yakitori grill')
svg('bldg_hut', 400, 300, 'landmark', 'Happo Pond mountain hut; stone base, steep roof, smoke = shelter + supplies', f'''{shadow("M20 124 L200 26 L380 124 H360 V292 H40 V124Z")}
  <rect x="40" y="200" width="320" height="92" fill="#9aa1ab" {S}/>
  <g fill="#7f8794">{''.join(f'<ellipse cx="{x}" cy="{y}" rx="16" ry="9"/>' for x, y in ((70,230),(120,262),(180,226),(240,258),(300,230),(330,270)))}</g>
  <rect x="60" y="120" width="280" height="84" fill="#a8754b" {S}/>
  <path d="M20 124 L200 26 L380 124 L350 128 L200 50 L50 128Z" fill="#c8553d" {S}/>
  <rect x="170" y="150" width="60" height="142" fill="#7a4b3a" {S}/>
  <rect x="84" y="140" width="56" height="40" fill="#f2d49b" {S2}/><rect x="260" y="140" width="56" height="40" fill="#f2d49b" {S2}/>
  <rect x="280" y="50" width="22" height="50" fill="#5a596a" {S2}/>
  <path d="M292 44 q10 -16 0 -28 q-10 -12 4 -24" stroke="#dfe6ee" stroke-width="6" fill="none" stroke-linecap="round"/>''', 'Mountain hut')
svg('deco_pond', 420, 110, 'landmark', 'Happo Pond with the peaks mirrored in it (the green-season draw)', f'''  <ellipse cx="210" cy="60" rx="204" ry="46" fill="#4fa3a5" {S}/>
  <path d="M80 50 L130 80 L170 56 L220 90 L270 58 L320 80 L350 52" fill="none" stroke="#dfe6ee" stroke-width="4" opacity="0.8"/>
  <path d="M110 46 L150 66 L190 48" fill="none" stroke="#fbfaf6" stroke-width="3" opacity="0.6"/>
  <ellipse cx="300" cy="40" rx="40" ry="6" fill="#fbfaf6" opacity="0.4"/>''', 'Pond')
svg('deco_cairn_fallen', 120, 70, 'interactable', 'Collapsed trail cairn + trail sign: the balance puzzle is here', f'''  <ellipse cx="60" cy="64" rx="54" ry="5" fill="{INK}" opacity="0.18"/>
  <g {S2}><ellipse cx="34" cy="54" rx="24" ry="10" fill="#9aa1ab"/><ellipse cx="74" cy="56" rx="20" ry="9" fill="#8a8f99"/><ellipse cx="52" cy="40" rx="16" ry="8" fill="#b3aea4"/></g>
  <rect x="96" y="10" width="6" height="50" fill="#7a4b3a"/><path d="M98 12 h20 l-6 8 l6 8 h-20Z" fill="#c8553d" {S2}/>''', 'Fallen cairn')
svg('deco_gondola_stop', 160, 180, 'landmark', 'Gondola top station: ride down to your van (the van cannot drive up here)', f'''  <ellipse cx="80" cy="174" rx="70" ry="6" fill="{INK}" opacity="0.18"/>
  <rect x="20" y="60" width="120" height="114" fill="#dfe6ee" {S}/>
  <path d="M10 62 L80 26 L150 62Z" fill="#3e4f7a" {S}/>
  <path d="M0 10 L160 40" stroke="{INK}" stroke-width="3"/>
  <rect x="58" y="100" width="44" height="50" rx="8" fill="#c8553d" {S}/><rect x="64" y="108" width="32" height="20" fill="#cfe0ee"/>
  <path d="M80 100 V30" stroke="{INK}" stroke-width="3"/>''', 'Gondola stop')
svg('bldg_gondola_station', 420, 300, 'landmark', 'Iwatake gondola station: cable + red cabins = the lift to the summit terrace', f'''{shadow("M20 120 H400 V292 H20Z")}
  <path d="M0 40 L420 110" stroke="{INK}" stroke-width="3"/>
  <g {S2}><rect x="70" y="56" width="40" height="34" rx="8" fill="#c8553d"/><rect x="290" y="92" width="40" height="34" rx="8" fill="#c8553d"/></g>
  <g stroke="{INK}" stroke-width="2.5"><line x1="90" y1="46" x2="90" y2="56"/><line x1="310" y1="84" x2="310" y2="92"/></g>
  <rect x="30" y="140" width="360" height="152" fill="#efe3c2" {S}/>
  <path d="M14 144 H406 L380 116 H40Z" fill="#5a5f6e" {S}/>
  <rect x="140" y="170" width="140" height="122" fill="#6c7fa3" {S}/>
  <rect x="150" y="180" width="120" height="70" fill="#cfe0ee"/>
  <rect x="140" y="124" width="140" height="22" rx="4" fill="#fbfaf6" {S2}/>
  <text x="210" y="141" font-family="sans-serif" font-size="14" font-weight="700" fill="#c8553d" text-anchor="middle">岩岳 GONDOLA</text>''', 'Gondola station')
svg('deco_terrace', 300, 150, 'landmark', 'Summit terrace deck + railing facing the peaks', f'''  <path d="M10 110 L40 80 H290 L290 110Z" fill="#a8754b" {S}/>
  <g stroke="#7a4b3a" stroke-width="2">{''.join(f'<line x1="{x}" y1="84" x2="{x-14}" y2="110"/>' for x in range(70, 290, 30))}</g>
  <path d="M40 80 V44 H290 V80" fill="none" stroke="{INK}" stroke-width="4"/>
  <g stroke="{INK}" stroke-width="3">{''.join(f'<line x1="{x}" y1="44" x2="{x}" y2="80"/>' for x in range(70, 290, 40))}</g>
  <rect x="20" y="110" width="12" height="36" fill="#7a4b3a"/><rect x="270" y="110" width="12" height="36" fill="#7a4b3a"/>''', 'Terrace deck')
svg('deco_cabin', 110, 130, 'interactable', 'Gondola cabin waiting at the platform: the seating-balance puzzle', f'''  <path d="M55 0 V24" stroke="{INK}" stroke-width="3"/>
  <rect x="10" y="24" width="90" height="96" rx="18" fill="#c8553d" {S}/>
  <rect x="22" y="38" width="66" height="40" rx="8" fill="#cfe0ee" {S2}/>
  <path d="M55 38 V78" stroke="{INK}" stroke-width="2"/>
  <rect x="20" y="88" width="70" height="8" fill="#fbfaf6"/>''', 'Gondola cabin')

# --- fetch items ---------------------------------------------------------------------
svg('item_ic_card', 44, 34, 'fetch-item', 'Lost IC transit card (fetch item)', f'''  <ellipse cx="22" cy="31" rx="18" ry="3" fill="{INK}" opacity="0.2"/>
  <rect x="4" y="4" width="36" height="24" rx="4" fill="#8cc084" {S2}/>
  <rect x="9" y="10" width="10" height="8" rx="1.5" fill="#f2a541"/><path d="M24 12 h10 M24 18 h8" stroke="#fbfaf6" stroke-width="2.5"/>''', 'IC card')
svg('item_lantern', 36, 54, 'fetch-item', 'Paper lantern (fetch item for Echoland)', f'''  <ellipse cx="18" cy="51" rx="12" ry="3" fill="{INK}" opacity="0.2"/>
  <rect x="12" y="4" width="12" height="6" fill="{INK}"/>
  <ellipse cx="18" cy="28" rx="14" ry="19" fill="#c8553d" {S2}/>
  <path d="M6 22 H30 M5 30 H31 M6 38 H30" stroke="#a03f2c" stroke-width="2"/>
  <rect x="12" y="44" width="12" height="5" fill="{INK}"/>''', 'Lantern')
svg('item_supplies', 54, 46, 'fetch-item', 'Canvas supply bundle for the hut (fetch item, 1 stamina to carry)', f'''  <ellipse cx="27" cy="43" rx="22" ry="3" fill="{INK}" opacity="0.2"/>
  <path d="M6 40 Q4 16 27 12 Q50 16 48 40Z" fill="#d9c7a3" {S2}/>
  <path d="M16 14 Q27 4 38 14" fill="none" stroke="#7a4b3a" stroke-width="3"/>
  <path d="M10 28 H44" stroke="#a8754b" stroke-width="3"/>''', 'Supply bundle')
svg('item_seeds', 40, 48, 'fetch-item', 'Wildflower seed packet (fetch item for Iwatake)', f'''  <ellipse cx="20" cy="45" rx="15" ry="3" fill="{INK}" opacity="0.2"/>
  <rect x="6" y="4" width="28" height="38" rx="3" fill="#fbfaf6" {S2}/>
  <g {S2}><circle cx="15" cy="18" r="5" fill="#e89fb0"/><circle cx="26" cy="22" r="5" fill="#f2a541"/></g>
  <path d="M15 23 V34 M26 27 V34" stroke="#3f6b4f" stroke-width="2.5"/>''', 'Seed packet')

m = json.load(open(M))
have = {a['id'] for a in m['assets']}
for a in assets:
    if a['id'] in have: m['assets'] = [a if x['id'] == a['id'] else x for x in m['assets']]
    else: m['assets'].append(a)
json.dump(m, open(M, 'w'), indent=2, ensure_ascii=False)
open(M, 'a').write('\n')
print(len(assets), 'assets;', len(m['assets']), 'in manifest')
