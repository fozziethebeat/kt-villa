# Hakuba RPG — Visual Direction & Character Design Proposal

This document establishes the visual motifs of **Hakuba, Nagano** across its two signature seasons and proposes **three Octopath-inspired 2D / Flat-3D art styles**, followed by candidate designs for the **Main Player Character**, **Village NPCs**, and **Wild Spirit-Animal Enemies** (villagers who got bored and transformed into forest spirits).

---

## 🏔️ Part 1: Visual Motifs of Hakuba, Japan (Green vs. Winter Seasons)

Hakuba sits in a dramatic basin at the foot of the **Northern Japan Alps (Hakuba Sanzan)**—where jagged 3,000-meter peaks rise abruptly above traditional *kominka* farmhouses, cedar shrines, and modern mountain lodges.

````carousel
![Hakuba Green Season Reference](/Users/fozziethebeat/.gemini/antigravity/brain/04d7f3fa-3669-4cf1-bbd3-1c1059621170/hakuba_green_season_png_1792413429192.jpg)
<!-- slide -->
![Hakuba Winter Season Reference](/Users/fozziethebeat/.gemini/antigravity/brain/04d7f3fa-3669-4cf1-bbd3-1c1059621170/hakuba_winter_season_png_1792413451835.jpg)
````

### Key Palette & Environmental Motifs
| Season | Color Palette & Lighting | Signature Visual Elements |
| :--- | :--- | :--- |
| **Green Season (Summer / Spring)** | Crisp cobalt sky, emerald rice paddies, glacial turquoise snowmelt, dark weathered cedar, warm golden sunlight. | Mirror-like terraced rice fields reflecting the snow-streaked Alps, wooden boardwalks through alpine wetlands (*Tsugaike*), clear kayak lakes (*Lake Aoki*), wildflowers, Kengo Kuma-style modern cedar terraces. |
| **Winter Season ("Japow" Winter)** | Alpenglow twilight blues & violets, powdery white snow pillows, warm amber lantern glow, cedar bark, vermilion shrine accents. | 11-meter powder drifts blanketing steep *kominka* roofs, steaming outdoor rock *onsen* baths, snow-laden sugi (cedar) forests, ski lifts disappearing into misty peaks, glowing *izakaya* lanterns. |

---

## 🎨 Part 2: Three Proposed Art Styles (2D / Flat-3D "Octopath" Aesthetic)

To achieve the *Octopath Traveler* sense of depth, lighting, and tactile charm in Godot 4 while honoring Hakuba's Japanese alpine identity, here are three distinct visual directions:

````carousel
![Style 1: HD-2D Alpine Pixel](/Users/fozziethebeat/.gemini/antigravity/brain/04d7f3fa-3669-4cf1-bbd3-1c1059621170/style_1_hd2d_pixel_1792413432998.jpg)
<!-- slide -->
![Style 2: Woodblock & Washi Papercraft 2.5D](/Users/fozziethebeat/.gemini/antigravity/brain/04d7f3fa-3669-4cf1-bbd3-1c1059621170/style_2_ukiyoe_papercraft_1792413455118.jpg)
<!-- slide -->
![Style 3: Cozy Storybook Illustrated 2.5D](/Users/fozziethebeat/.gemini/antigravity/brain/04d7f3fa-3669-4cf1-bbd3-1c1059621170/style_3_storybook_cel_1792413474566.jpg)
````

### Style 1: **HD-2D Alpine Pixel** *(Classic Octopath Traveler Homage)*
* **Visual Look**: Crisp, expressive **32×32 or 48×48 pixel-art character sprites** with rich shading and dark pixel outlines, placed inside a multi-layered diorama with **tilt-shift depth-of-field blur**, dynamic point-light lanterns, normal-mapped snow/stone tiles, and glowing particle effects (snowflakes, onsen steam).
* **Why it fits Hakuba**: Captures nostalgia and classic JRPG charm while making the contrast between cold blue alpine snow and warm amber *izakaya* / *onsen* lights pop dramatically.
* **Godot Implementation**: Upgrade `TileMapLayer` and sprite sheets to 32×32/48×48 custom pixel art + `CanvasModulate` + `PointLight2D` with normal maps + camera vignette/tilt-shift shader.

### Style 2: **Ukiyo-e Woodblock & Washi Papercraft 2.5D** *(Traditional Folk-Art Diorama)*
* **Visual Look**: Characters, trees, and buildings look like **layered Japanese *washi* paper cutouts and *ukiyo-e* woodblock prints** (inspired by Hokusai/Hiroshige and *Paper Mario* / *Okami*). Uses bold *sumi-e* ink outlines, textured paper grain, mineral pigments, and crisp drop-shadows between Z-layers.
* **Why it fits Hakuba**: Immediately grounds the "villagers transforming into Shinto forest spirits" lore in authentic Japanese folklore and mountain woodblock art.
* **Godot Implementation**: High-res 2D cutout sprites (128×128 or 256×256) with drop-shadow shaders, parallax Z-planes, and a subtle washi-paper overlay texture.

### Style 3: **Cozy Ghibli-esque Storybook 2.5D** *(Hand-Painted Gouache & Watercolor)*
* **Visual Look**: Soft, vibrant **hand-painted watercolor/gouache sprites** with warm rim-lighting, expressive proportions, and painterly foliage that looks like a living children's storybook or Studio Ghibli background.
* **Why it fits Hakuba**: Emphasizes the cozy, non-violent, heartwarming humor of telling dad jokes to grumpy forest beasts, sipping hot onsen tea, and restoring tourism to a sleepy mountain town.
* **Godot Implementation**: High-res painted sprite sheets with smooth 4–6 frame frame-by-frame or puppet animations and soft atmospheric fog/bloom shaders.

---

## 🧣 Part 3: Grounded Modern-Day Candidates for the Main Player Character (Male & Female | Winter & Green Seasons)

To make the protagonist someone the player can genuinely project themselves onto—a real, modern person moving to the Japanese countryside rather than a fantasy archetype—players can choose their preferred **background archetype (Option 1, 2, or 3)** and **gender expression (Male / Female)**, with automatic **Winter Season** and **Green Season** outfits:

````carousel
![Male Candidates — Winter Season](/Users/fozziethebeat/.gemini/antigravity/brain/04d7f3fa-3669-4cf1-bbd3-1c1059621170/player_candidates_storybook_1792413883854.jpg)
<!-- slide -->
![Female Candidates — Winter Season](/Users/fozziethebeat/.gemini/antigravity/brain/04d7f3fa-3669-4cf1-bbd3-1c1059621170/player_female_winter_storybook_png_1792414101979.jpg)
<!-- slide -->
![Male Candidates — Green Season](/Users/fozziethebeat/.gemini/antigravity/brain/04d7f3fa-3669-4cf1-bbd3-1c1059621170/player_male_green_storybook_1792414107438.jpg)
<!-- slide -->
![Female Candidates — Green Season](/Users/fozziethebeat/.gemini/antigravity/brain/04d7f3fa-3669-4cf1-bbd3-1c1059621170/player_female_green_storybook_1792414130783.jpg)
````

### Option 1: **The Ex-Tokyo Corporate Burnout (*"Datsusara"* Newcomer)**
* **Backstory**: Just quit a grueling 80-hour-a-week corporate job in Tokyo to escape the concrete jungle, buy a shuttered little shop in Hakuba, and start a slower life in the mountains.
* **Winter Outfit (Male & Female)**: Crisp white office button-down/blouse and loosened tie *underneath* a newly bought olive fleece vest and mustard-yellow winter puffer coat, rolled-up chinos/trousers, brand-new chunky snow boots, round wire-rim glasses, and a leather work messenger bag stuffed with a laptop, a thermos of hot coffee, and a *"Beginner's Guide to Hakuba"* booklet.
* **Green Season Outfit (Male & Female)**: Rolled-sleeve white office shirt/blouse with loosened tie under a lightweight olive linen/utility vest, cropped trousers, new trail sneakers, a sun hat hanging around the neck, and the same trusty leather messenger bag now carrying an iced coffee tumbler.

### Option 2: **The Half-Japanese American Roots-Seeker**
* **Backstory**: Grew up in the US (e.g., Pacific Northwest or California) hearing stories about their grandparents' mountain village in Nagano, and finally moved to Hakuba to reconnect with their heritage and help revitalize the town.
* **Winter Outfit (Male & Female)**: Wavy dark-brown hair tucked under a maroon knit beanie, red-and-black plaid flannel shirt layered under a tan sherpa-lined canvas jacket and navy down vest, cuffed denim jeans, sturdy hiking boots, a vintage 35mm film camera slung across their chest, and a canvas daypack with US/Japan enamel pins and a strapped snowboard.
* **Green Season Outfit (Male & Female)**: Lightweight unbuttoned plaid overshirt over a white tee, hiking shorts/rolled denim with crew socks and hiking boots, woven sun hat or cap, vintage 35mm camera across the chest, and the canvas daypack equipped with trekking poles.

### Option 3: **The Remote Indie Creative / Working-Holiday Powder-Hound**
* **Backstory**: A modern digital nomad / UX designer / seasonal working-holiday maker who moved to Hakuba for the dream *"work from a cozy mountain cafe in the morning, ride fresh powder on lunch break"* lifestyle—only to realize all the village cafes and lifts have shut down because the owners turned into forest spirits!
* **Winter Outfit (Male & Female)**: Cozy oversized oatmeal cable-knit sweater under a teal waterproof mountain shell, fleece joggers tucked into insulated slip-on snow moccasins, wireless over-ear headphones around the neck (with knit headband/earmuffs), and a waterproof roll-top backpack with a reusable hot coffee tumbler and compact binoculars.
* **Green Season Outfit (Male & Female)**: Breathable oatmeal waffle-knit short-sleeve top with a lightweight teal windbreaker draped over the shoulders or waist, relaxed outdoor cargo joggers, trail moccasin sneakers, wireless headphones, and a roll-top pack with an iced matcha/coffee tumbler.

---

## 🏮 Part 4: Candidate Options for Village NPCs

In your game loop, some NPCs are **steadfast anchors** still trying to keep the village running, while others are the **restored human forms** of the vanished villagers who unlock shops and puzzle mini-games once calmed!

### 1. **Elder Kenzo** *(The Village Anchor & Historian)*
* **Option 1A (Traditional Kominka Elder)**: Wears a thick, charcoal-grey wool *haori* jacket with snow-crest family emblems, a woven straw snow-cape (*mino*) draped over his shoulders, holding a gnarled hinoki-wood staff and stroking a long white beard.
* **Option 1B (Retired Olympic Ski Pioneer)**: A spry 75-year-old grandpa wearing a vintage wool sweater with a mountain crest, round spectacles, a warm trapper hat, and holding a steaming ceramic mug of *amazake*.

### 2. **Yuki** *(The Ski Instructor — Chairlift Seating Puzzle Host)*
* **Option 2A (Bright Alpine Patrol Pro)**: Crimson-and-white Hakuba Ski Patrol jacket, mirrored blue goggles on her forehead, clipboard/whistle in hand, energetic pose ready to organize chaotic tourist lines.
* **Option 2B (Freestyle Snowboarder Coach)**: Baggy sage-green snowbibs, knit ear-flap hat, holding a custom painted snowboard with a snow-monkey graphic.

### 3. **Restored Villagers** *(Unlocked when you calm their Beast Spirit forms!)*
* **Kannushi Sato (The Vanished Head Shinto Priest)**: Crisp white robe (*jōe*), turquoise hakama trousers, tall black *eboshi* cap, carrying a wooden purification wand (*haraegushi*)—though slightly disheveled with pine needles still stuck in his sleeves from his time as a forest beast.
* **Barista Haru (The Vanished Coffee & Roastery Owner)**: Denim roaster's apron over a flannel shirt, round hipster glasses, holding a copper gooseneck pour-over kettle with fragrant steam rising.
* **Master Rakugo "Warai" (The Vanished Joke Master & Izakaya Host)**: Patterned kimono with a folded paper fan (*sensu*) and hand towel (*tenugui*), sporting a mischievous grin and rosy cheeks.
* **Chef/Farmer Momo (The Soba & Vegetable Master — Harvest Puzzle Host)**: Indigo *samue* work clothes, polka-dot head kerchief (*tenugui*), carrying a bamboo basket overflowing with giant Shinshu radishes, Nagano apples, and fresh buckwheat.

---

## 🦊 Part 5: Candidate Options for Enemy Animals (Pests vs. Transformed Villager Spirits)

Per [`NOTES.md`](file:///Users/fozziethebeat/devel/kt-villa/games/godot-test/NOTES.md#L115-L130), there is a crucial two-tier distinction:
1. **Common Pests**: Ordinary mischievous Hakuba wildlife scaring off tourists.
2. **Transformed Villager Beasts (Forest Spirits)**: Villagers who got bored and turned into legendary mountain beasts—visually hinted at by **carrying a subtle human item or wearing a signature accessory from their human job!**

### Tier A: Common Alpine Pests (Early Loop — Scaring Tourists)
1. **Jigokudani Hot-Spring Macaque (*Wild Snow Monkey*)**:
   * *Design*: Fluffy brownish-grey winter coat, bright crimson face, wearing a stolen **rolled-up white onsen towel on its head** and lobbing packed snowballs.
2. **Shinshu Apple-Thief Boar (*Uribo / Wild Mountain Boar*)**:
   * *Design*: Round, bristly brown mountain boar with snow-frosted tusks and a **stolen red Nagano apple** skewered on one tusk.
3. **Mischievous Alpine Tanuki / Red Fox (*Kitsune*)**:
   * *Design*: Plump Japanese raccoon-dog or fluffy red fox rummaging through ski-lodge bins, holding a stolen **tourist ski pass or mitten** in its mouth.

### Tier B: Transformed Villager Beasts (Core Loop — "Villagers Gone Wild")
Each Beast is a native Nagano animal infused with Shinto forest-spirit energy, retaining a hilarious visual clue of *which vanished villager they actually are*:

| Vanished Villager | Spirit Beast Form (Nagano Native Animal) | Visual Design & "Human Clue" | Favorite Pacification / Gimmick |
| :--- | :--- | :--- | :--- |
| **Head Shinto Priest** | **Sacred Japanese Serow (*Kamoshika*)** — *Japan's endemic goat-antelope mountain spirit* | A majestic, shaggy white-and-slate horned Serow with glowing golden eyes, wearing a **miniature braided Shinto rope (*shimenawa*) with white paper *shide* lightning zig-zags** around its neck. | Calmed by **Polite Mountain Bow**, **Alpine Flute**, and **Lucky Shrine Charms**. |
| **The Joke Master** | **Giant Laughing Snow Macaque / Yeti (*Oozaru Spirit*)** | A towering, ultra-fluffy silver-white Yeti-Monkey carrying a **giant cedar folding fan (*sensu*)** and wearing a red izakaya headband, drumming its belly and roaring with booming laughter. | Has the highest resistance to Spook, but takes **2× Pacification from Dad Jokes & Funny Penguin Dance**! |
| **The Coffee Shop Owner** | **Caffeine-Deprived Moon Bear (*Tsukinowaguma*)** | A massive, sleepy-eyed Japanese Asiatic Black Bear with a **steaming golden crescent-moon latte art mark** on its chest, clutching a giant wooden coffee tamper like a club and yawning frost clouds. | Craves **Hot Onsen Tea / Warm Brews**; grumpy until caffeinated or charmed with cozy music. |
| **The Farmer / Chef** | **Moss-Backed Giant Boar God (*Inoshishi Spirit*)** | A hefty, moss-and-snow-covered tusked boar spirit wearing a **twisted farmer's *hachimaki* headband** with sprouted Shinshu turnips and buckwheat growing right out of the fur on its back. | Obsessed with **Nagano Apples** and food-related jokes. |
| **The Ski Shop / Lift Mechanic** | **Silver Hakuba Wolf / Ptarmigan Griffin (*Okami Spirit*)** | A sleek silver-and-ice-blue alpine wolf with **vintage brass ski goggles** resting on its forehead and a frost-covered tail shaped like a powder rooster-tail. | Loves high-energy tricks, yodels, and ski jokes. |

---

## 💬 Next Steps & Questions for You

1. **Which of the 3 Art Styles** (Style 1: *HD-2D Alpine Pixel*, Style 2: *Ukiyo-e Washi Papercraft*, or Style 3: *Cozy Storybook Gouache*) resonates best with your vision for Hakuba?
2. **Which Main Player Character concept** (Option A: *Hanten Shopkeeper*, Option B: *Freeride Courier*, or Option C: *Folkloric Traveler*) would you like to roll with?
3. **Which NPCs and Spirit-Animal Enemies** should we generate and build into actual game-ready sprite sheets first?
