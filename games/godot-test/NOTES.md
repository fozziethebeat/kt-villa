# Hakuba RPG — Project Notes & Roadmap

A 2D top-down Japanese Role-Playing Game (JRPG) centered around exploring the
scenic mountain village of **Hakuba**, Japan.

---

## 🏔️ Concept & Setting
- **Theme**: Mountain village exploration, cozy Japanese aesthetic, alpine/snow atmosphere.
- **Genre**: 2D Top-Down Exploration JRPG.
- **Engine**: Godot 4.x (`4.7.2`).

---

## 🎯 Phase 1: Core Exploration Prototype (Completed ✅)

### 1. Project & Map Foundation
- [x] Initialize Godot 4 project configuration (`project.godot` with pixel-perfect 2D settings & input map).
- [x] Implement Hakuba terrain (snow fields, stone paths, ski trails, onsen pool).
- [x] Place sample Japanese village structures (Elder's Lodge, Hakuba Ski Lodge, Tea Pavilion, pine forest).
- [x] Configure static collision layers for obstacles (buildings, water, trees, map perimeter).
- [x] Modernize map architecture to native **Godot 4.3+ `TileMapLayer`** and unified `TileSet` resource (`hakuba_tileset.tres`), replacing ~1,800 procedural `Sprite2D` nodes with batched, hardware-accelerated tile layers.
- [x] Interactive **Visual Sprite Catalog tool** (`tools/sprite_catalog.html`) for 1-click tile picking, zoom preview, and GDScript code copying across all Kenney packs.

### 2. Player Character
- [x] Player scene (`CharacterBody2D`) with collision shape tuned for top-down depth.
- [x] Animated 2D sprite with walk and idle cycles.
- [x] Smooth keyboard navigation (`W/A/S/D` and Arrow Keys) + Sprint (`Shift`).
- [x] Follow camera (`Camera2D`) with smoothing enabled.

### 3. Collectibles & Interactive Items
- [x] Base pickable item scene (`Area2D`) with hover float & bounce-fade pickup effect.
- [x] Item sprites: Nagano Apples 🍎, Ski Pass 🎿, Onsen Tea 🍵, Lucky Charm ⛩️.
- [x] Real-time HUD inventory counter.

### 4. Non-Playable Characters (NPCs)
- **Friendly NPCs (2 types)**:
  - [x] **Elder Kenzo** (Village Elder with welcome dialogue).
  - [x] **Yuki** (Ski Instructor with slope advice).
  - [x] `💬 [E] Talk` prompt bubble & styled dialogue panel.
- **Enemy NPCs (2 types)**:
  - [x] **Wild Hakuba Snow Monkey** (patrols near hot springs).
  - [x] **Mountain Forest Boar** (wanders outer pine forest).
  - [x] Proximity detection zone with real-time distance calculation.
  - [x] Dynamic HUD caution alert ("⚠️ CAUTION: [Enemy Name] is nearby!").

---

### 5. Turn-Based Side-View Battle System (Classic Final Fantasy Style) ✅
- [x] **Side-View Arena**: Classic side-view layout with snowy mountain backdrop, pine silhouettes, and snowfall particle system.
- [x] **Active Time Battle (ATB)**: Action meters for player and wild animals with agility/speed-based filling and turn triggers.
- [x] **Courage Meter**: Replaces traditional HP. Player loses Courage from wild animal roars and snowballs; restores courage with Onsen Tea, jokes, and charms. If Courage falters (0), player safely retreats.
- [x] **Non-Violent Action System**:
  - **Spook (Startle)**: Wave Arms, Flash Lantern, Pots & Pans, Alpine Yodel. Reduces wild composure until the animal is spooked away into the mountains.
  - **Charm / Jokes (Magic Alternative)**: Winter dad jokes pool, Funny Penguin Dance, Alpine Flute, Polite Bow. Fills pacification until the animal is befriended.
  - **Battle Items**: Nagano Apples (feed treat for huge charm), Onsen Tea (courage restoration), Lucky Shrine Charm (spiritual pacification).
  - **Step Back**: Safe retreat option.
- [x] **Encounter Initiation**: Animals in the village feature `[E] Approach` interaction zones. Approaching opens an encounter prompt where players can accept or decline the fight instead of being forced into it.
- [x] **Multi-Enemy Support**: Wild Snow Monkey, Mountain Forest Yeti (animated 3-frame beast), Wild Mountain Boar, and Hakuba Snow Wolf.

---

## 🚀 Next Phases (Backlog)
- **Phase 2: Dialogue & Quest System** (Multi-branch dialogue, quests e.g. "Collect 3 Nagano Apples for Elder Kenzo", onsen towel delivery).
- **Phase 4: Village Expansion & Audio** (Day/night or snowfall weather cycle, authentic lofi/traditional Japanese BGM & sound effects).

## Additional References

https://github.com/kavex/gamedev-resources
https://gameidea.org/category/godot-tutorials/page/5/

## Learning Resources

* https://schellgames.com/art-of-game-design
* https://www.amazon.com/Advanced-Game-Design-Systems-Approach/dp/0134667603
* https://www.youtube.com/@DesignDoc
* https://www.routledge.com/Character-Development-and-Storytelling-for-Games/Sheldon/p/book/9780367248987
* https://www.youtube.com/@sora_sakurai_en
* https://www.youtube.com/@extracredits/playlists

## Design questions


## Gameplay Systems & Mechanics

Define two systems that overlay with each other that both introduces two
helpful game loops that reinforce each other.  Both need to be fun and the
simpler loop needs to help build up towards the larger harder game loop.  Both
ultimately build towards fitting in with the village and making the village a
better place to live in and visit.

Things we have to figure out:
1.  what is the progression system? - A courage system
2.  What are workable but easy status effect mechanics? - jokes & tricks
3.  What is the battle mechanic?
  *  For pests, ways of scaring them off or distracting them
  *  For beasts, Items you gain, Joke to learn, or other friendly behaviors.

### Restoring Tourism

The local economy is dependent on tourism and as a new resident its in your
benefit to help boost that economy, but things are getting harder because pests
are showing up and scaring off tourists and making bad PR.

1. Wander the village and the surrounding area to find and fend off pests
2. Battling pests both reduces bad PR, brings more visitors, gives you spending
   money, and builds your courage
3. Your in game currency is funded by clearing pests and by tourists visiting
   your local shop.
4. The more the economy grows, the more you can buy tricks and items to handle
   pests

### Restoring Village Life

The village has gotten oddly quiet these days and no one knows why.  The head
shinto priest vanished.  The coffee shop owner vanished.  The joke master
vanished.  Where did they go? They got bored with the village and became forest
spirits.  They too wander the village and surrounding area but in a beast form
and seem like pests but truly they're transformed villagers.

1. Wander the village and the surrounding area to find and simmer down these
   beasts
2. Repeatedly contend with these beasts to calm then down to their true form
   with with snacks, jokes, and other gimmicks.  But you can't take on a beast
until you have enough courage.  Until then they seem like pests.
3. helping these beasts recover back into villages restores the village's
   normal mode of operating.  Shops open back up which both lets you buy new
items or discover new details.  Further, it helps boost tourism
4. The more the economy grows, the more you can buy tricks and items to handle
   pests and beasts


## Different Pairs of Game Mechanics

### Puzzle Games

Each area of the game or each villager that needs to be restored has a
different type of puzzle game associated with them that you have to level up in
to improve that part of the village.

Examples

1.  The ski instructors need help tourists to line up and sit on the ski chairs
    more effectively (based on Is this Seat Taken?)
2.  The restaurant owners need help sourcing vegetables, can be a candy crush
    like food matching game.
3.  The farmers need help planting their vegetables with a shape bin packing
    type game.

Generally can look for standard puzzle types and pair them with fun elements in
the world.

---

## 🎨 Art Direction & Character Roster (Locked & Saved Options)

### Chosen Art Style: **Cozy Storybook Illustrated 2.5D**
- **Visual Look**: Hand-painted watercolor & gouache 2D billboard sprites with warm rim-lighting, expressive proportions, and painterly foliage that feels like a living storybook or Studio Ghibli background, paired with Octopath-style 2.5D depth, atmospheric snowfall/steam particles, and warm lantern lighting.
- **Seasonal Motifs**:
  - **Green Season**: Emerald rice paddies mirroring the snow-streaked Northern Japan Alps (Hakuba Sanzan), glacial turquoise streams, wooden wetland boardwalks, and cedar lodges.
  - **Winter Season ("Japow")**: Deep powder pillows on *kominka* and chalet roofs, steaming outdoor rock *onsen*, snow-laden cedar forests, and glowing amber *izakaya* lanterns against twilight blue peaks.

### Saved Main Player Character Candidates (Male & Female | Winter & Green Seasons)
1. **Option 1: The Ex-Tokyo Corporate Burnout (*"Datsusara"* Newcomer)**
   - **Winter (Male & Female)**: Crisp white office button-down/blouse and loosened tie underneath an olive fleece vest and mustard-yellow winter puffer coat, rolled chinos/trousers, chunky snow boots, round wire-rim glasses, leather work messenger bag with laptop, hot coffee thermos, and *"Beginner's Guide to Hakuba"*.
   - **Green Season (Male & Female)**: Rolled-sleeve white office shirt/blouse with loosened tie under a lightweight olive linen/utility vest, cropped trousers, trail sneakers, sun hat on neck, leather messenger bag with iced coffee tumbler.
2. **Option 2: The Half-Japanese American Roots-Seeker**
   - **Winter (Male & Female)**: Wavy dark-brown hair under a maroon knit beanie, red/black plaid flannel under a tan sherpa-lined canvas jacket and navy down vest, cuffed denim jeans, hiking boots, vintage 35mm camera across chest, canvas daypack with US/Japan pins and strapped snowboard.
   - **Green Season (Male & Female)**: Lightweight unbuttoned plaid overshirt over white tee, hiking shorts/rolled denim with crew socks and hiking boots, sun hat/cap, 35mm camera across chest, canvas daypack with trekking poles.
3. **Option 3: The Remote Indie Creative / Working-Holiday Powder-Hound**
   - **Winter (Male & Female)**: Oversized oatmeal cable-knit sweater under a teal waterproof mountain shell, fleece joggers tucked into insulated slip-on snow moccasins, wireless over-ear headphones around neck (plus earmuffs/headband), waterproof roll-top backpack with hot coffee tumbler and binoculars.
   - **Green Season (Male & Female)**: Breathable oatmeal waffle-knit short-sleeve top with lightweight teal windbreaker draped over shoulders/waist, relaxed cargo joggers, trail moccasin sneakers, wireless headphones, roll-top pack with iced matcha/coffee tumbler.

### Saved Village NPC Candidates
1. **Elder Kenzo** *(The Village Anchor & Historian)*
   - **Option 1A (Traditional Kominka Elder)**: Charcoal-grey wool *haori* jacket with snow-crest emblems, woven straw snow-cape (*mino*) over shoulders, gnarled hinoki staff, long white beard.
   - **Option 1B (Retired Olympic Ski Pioneer)**: Spry 75-year-old grandpa in a vintage mountain-crest wool sweater, round spectacles, warm trapper hat, holding a steaming ceramic mug of *amazake*.
2. **Yuki** *(The Ski Instructor — Chairlift Seating Puzzle Host)*
   - **Option 2A (Bright Alpine Patrol Pro)**: Crimson-and-white Hakuba Ski Patrol jacket, mirrored blue goggles on forehead, clipboard & whistle in hand.
   - **Option 2B (Freestyle Snowboarder Coach)**: Baggy sage-green snowbibs, knit ear-flap hat, holding a custom snowboard with a snow-monkey graphic.
3. **Restored Villagers** *(Unlocked when calming their Forest Spirit Beast forms)*
   - **Kannushi Sato (Vanished Head Shinto Priest)**: Crisp white *jōe* robe, turquoise hakama, tall black *eboshi* cap, wooden purification wand (*haraegushi*)—with pine needles still stuck in his sleeves from his time as a forest beast.
   - **Barista Haru (Vanished Coffee & Roastery Owner)**: Denim roaster's apron over flannel shirt, round glasses, holding a copper gooseneck pour-over kettle with fragrant steam.
   - **Master Rakugo "Warai" (Vanished Joke Master & Izakaya Host)**: Patterned kimono with folded paper fan (*sensu*) and hand towel (*tenugui*), mischievous grin and rosy cheeks.
   - **Chef/Farmer Momo (Soba & Vegetable Master — Harvest Puzzle Host)**: Indigo *samue* work clothes, polka-dot head kerchief, carrying a bamboo basket overflowing with Shinshu radishes, Nagano apples, and fresh buckwheat.

### Saved Enemy Animal Candidates (Pests vs. Transformed Villager Spirits)

#### Tier A: Common Alpine Pests (Early Loop — Scaring Tourists)
1. **Jigokudani Hot-Spring Macaque (*Wild Snow Monkey*)**: Fluffy brownish-grey winter coat, bright red face, wearing a stolen **rolled-up white onsen towel on its head** and lobbing packed snowballs.
2. **Shinshu Apple-Thief Boar (*Uribo / Wild Mountain Boar*)**: Round, bristly brown mountain boar with snow-frosted tusks and a **stolen red Nagano apple** skewered on one tusk.
3. **Mischievous Alpine Tanuki / Red Fox (*Kitsune*)**: Plump Japanese raccoon-dog or fluffy red fox rummaging through ski-lodge bins, holding a **stolen tourist ski pass or mitten** in its mouth.

#### Tier B: Transformed Villager Beasts (Core Loop — "Villagers Gone Wild")
Each Beast is a native Nagano animal infused with Shinto forest-spirit energy, retaining a visual clue of which vanished villager they actually are:
1. **Head Shinto Priest → Sacred Japanese Serow (*Kamoshika*)**: Majestic, shaggy white-and-slate horned goat-antelope with glowing golden eyes, wearing a **miniature braided Shinto rope (*shimenawa*) with white paper *shide* zig-zags** around its neck. *(Calmed by Polite Mountain Bow, Alpine Flute, Lucky Shrine Charms).*
2. **The Joke Master → Giant Laughing Snow Macaque / Yeti (*Oozaru Spirit*)**: Towering, ultra-fluffy silver-white Yeti-Monkey carrying a **giant cedar folding fan (*sensu*)** and red izakaya headband, drumming its belly with booming laughter. *(High resistance to Spook; takes 2× Pacification from Dad Jokes & Funny Penguin Dance).*
3. **The Coffee Shop Owner → Caffeine-Deprived Moon Bear (*Tsukinowaguma*)**: Massive, sleepy-eyed Japanese Asiatic Black Bear with a **steaming golden crescent-moon latte art mark** on its chest, clutching a giant wooden coffee tamper like a club and yawning frost clouds. *(Craves Hot Onsen Tea / Warm Brews and cozy music).*
4. **The Farmer / Chef → Moss-Backed Giant Boar God (*Inoshishi Spirit*)**: Hefty, moss-and-snow-covered tusked boar spirit wearing a **twisted farmer's *hachimaki* headband** with sprouted Shinshu turnips and buckwheat growing right out of the fur on its back. *(Obsessed with Nagano Apples and food jokes).*
5. **The Ski Shop / Lift Mechanic → Silver Hakuba Wolf (*Okami Spirit*)**: Sleek silver-and-ice-blue alpine wolf with **vintage brass ski goggles** resting on its forehead and a frost-covered tail shaped like a powder rooster-tail. *(Loves high-energy tricks, yodels, and ski jokes).*

