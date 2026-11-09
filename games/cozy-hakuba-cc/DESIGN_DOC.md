# Hakuba Wake-Up — Cozy Van-Life Game Design Doc (Proposal v0.1)

> **Pitch.** A burned-out Tokyo office worker buys a tired second-hand van and drives
> it to Hakuba. The valley is quiet: shutters are down, lifts are idle in summer,
> and the people who used to keep each corner alive have lost their spark. Park
> your van, help each district's key person with their problem, and grow a mobile
> business that becomes part of the valley's revival. You win when Hakuba is
> busy in **both** the snowy winter and the green summer, and your van business is
> known across the valley.

**Status:** v0.2. The core decisions are locked (see the Decision Log below),
and milestone M0 is in progress. Where a decision is still open, it's marked
**⚖️ Option A / B / C**, and the recommended option comes first and is labeled
★.

### Decision Log (2026-11-08)
| # | Question | Decision |
|---|---|---|
| D1 | 10th region | **Happo Pond (Happo-ike)**, the alpine pond above Happo-One |
| D2 | Magic layer | **Light kodama touch**: small tree spirits appear as regions wake; people stay human |
| D3 | Time model | **In-game days with an action budget** |
| D4 | Engine | **Phaser 4 + TypeScript + Vite** for working out the core mechanics in 2D. We may move to Godot later if we want an isometric layout. Keeping the rules in `src/sim` engine-agnostic makes that port cheaper. |
| D5 | Art style | **Washi papercraft flat vector** for test assets |
| D6 | Platform | **Desktop browser first** (mouse + keyboard; 1280×720 baseline, scales up). Touch and mobile aren't goals for now. |
| D7 | Vertical slice archetypes | **Coffee & Bakery + Soba & Oyaki Kitchen** |

---

## 0. Table of Contents
1. Genre research: what the cozy genre teaches us
2. Design pillars
3. Core loops (moment → day → season → game)
4. Expansion: waking the 10 sub-regions
5. Challenges: fetch, create, puzzle
6. The van and the business (progression and build system)
7. Character selection
8. Seasonality
9. Economy and tuning sketch
10. Narrative frame and tone
11. Technology: which engine, and how Claude playtests it
12. Visual design and the asset pipeline
13. Milestones
14. Open questions for you
15. Sources

---

## 1. Genre Research: What the Cozy Genre Teaches Us

### 1.1 The two reference games

**Cozy Grove (Spry Fox, 2021) and Cozy Grove: Camp Spirit (2025)**
- *Loop:* every day you help ghost bears with short quest chains. Each finished
  quest gives you **spirit logs**. You feed the logs to a campfire spirit
  (Flamey), and once Flamey has had enough, he burns brighter and pushes back the
  dark fog. That reveals a new area and a new ghost.
- *Restoration you can see:* areas start in grayscale, and color floods back
  in as you help each ghost. This is the genre's single most effective
  "you made progress" signal.
- *Daily gating:* quests are capped per real-world day. That gives you short,
  stress-free sessions. Reviewers liked the pacing but found the long day one
  (about 3× a normal day) and some hard-to-find items frustrating.
- *Side activities:* bug catching, fishing, mining, power-washing, decorating,
  and fashion. These fill your time without needing quests.
- **What we take:** grayscale-to-color restoration, a central resource you feed
  to unlock areas, short and finishable quest chains, and many small tactile
  verbs.
- **What we avoid:** strict real-time gating, which blocks fast playtesting and
  frustrates binge players. We also avoid vague fetch hints.

**Spiritfarer (Thunder Lotus, 2020)**
- *Loop:* you sail a boat that is both your home and your production base. You
  build modules on it (kitchen, garden, forge, loom), and each module is
  unlocked by a passenger you take care of.
- *Building is a spatial puzzle:* modules are placed, stacked, and moved on a
  side-view grid like Tetris blocks.
- *Passengers unlock new verbs:* each spirit teaches a skill or a building, so
  social progress drives mechanical progress.
- *Time of day matters:* some actions only happen at certain times, and you
  sleep to move to the next day.
- *Criticism:* about 25 hours of slow unlocks felt padded, and there was a lot
  of resource busywork.
- **What we take:** the van as home and workshop, built on a side-view cutaway
  grid. Helping people unlocks new van modules and new business verbs.
- **What we avoid:** long grinds and big ingredient chains. Our target is about
  8–12 hours to the ending.

### 1.2 Wider survey (other games worth borrowing from)

| Game | Core idea worth borrowing | How it maps to Hakuba |
|---|---|---|
| **Stardew Valley** | Season calendar, end-of-day shipping summary, a community-center bundle checklist that restores the town | A **Season Report** screen; a "Valley Revival board" that works like bundles |
| **Animal Crossing: NH** | Infrastructure upgrades bring in new residents; low-pressure daily routine | Restored villagers open shops and give you new parking spots |
| **A Short Hike** | Small handcrafted map; traversal upgrades (feathers) open new areas | Van chassis upgrades (snow tires, 4WD) gate the mountain roads |
| **Spirittea** | Running a bathhouse business is how you help people; Japanese setting; slice-of-life rural town | Your business *is* how you help; a "mobile sauna" business option |
| **Fruitbus** | A food truck you drive through biomes; foraging feeds the menu; no timers | Gathering ingredients by region feeds the van's menu |
| **Outbound** | Van as a modular home and workshop; building vertically on the roof | Rooftop modules (solar, deck, planters) as build slots |
| **Coffee Talk** | Drink mixing as a way into people's stories | Making a quest item can be a recipe the villager actually needs |
| **Unpacking** | Wordless spatial storytelling through placing objects | Van interior layout puzzle; luggage-sorting mini-game |
| **Wylde Flowers** | Gentle magical realism; a whole town reacts to your progress | Possible light magical layer (see §10 ⚖️) |
| **Dorfromantik** | Tile-placement puzzle with relaxed scoring | A "trail map" tile puzzle for Tsugaike |
| **Is This Seat Taken?** (from your NOTES.md) | Small constraint-satisfaction seating puzzles | Gondola, shuttle, and izakaya seating puzzles |
| **Tiny Town** (from your NOTES.md) | An action/time bar fills up and ends the day; skill levels | A soft daily **Stamina** bar (optional; see §3) |

### 1.3 Genre takeaways that drive this design
1. **Progress you can see beats progress you read about.** Restoration changes
   the color, sound, and crowds of each area.
2. **Short, finishable chains.** Each quest step takes 2–5 minutes, and you can
   always do something useful in a session.
3. **No failure states, only "less good."** A weak season gives fewer customers,
   not a game over.
4. **Social progress unlocks mechanical progress.** Every person you help adds a
   verb, a module, an ingredient, or a parking spot.
5. **Home doubles as engine.** The van is cozy (comfort) *and* productive
   (business). Upgrades usually serve both.

---

## 2. Design Pillars
1. **Wake the valley.** Every sub-region visibly goes from dormant to thriving.
2. **Your van, your way.** Your choice of chassis, layout, and business
   archetype gives a run its own character.
3. **Two seasons, one village.** Winter is easy and green season is the real
   test. Both have to thrive for the ending.
4. **Gentle challenge.** Fetch, create, and puzzle replace combat. Puzzles have
   hints and no fail penalty.
5. **Modern and grounded.** Real Hakuba places, today's Japan (IC cards,
   inbound tourists, remote workers, ski bums, kei vans). Any magic is light
   and optional.

---

## 3. Core Loops

| Scale | Loop |
|---|---|
| **Moment** (10–60 s) | Walk around a region → gather, chat, or pick up a task; or serve a customer at the van window |
| **Day** (8–12 min) | Morning: choose a parking spot → day: open the business, do region tasks, run a mini-game → evening: close up, cook or relax in the van → sleep (save, daily summary) |
| **Season** (7 in-game days by default, configurable) | Customer mix and attractions change → a **Season Report** scores how busy each region was → you're nudged toward weak spots |
| **Game** (8–12 h) | Wake 10 regions → grow the business from Rank 1 to Rank 5 → reach two thriving seasons in a row → Festival ending; play continues afterwards |

**Time model (decided, D3): in-game days with an action budget.**
- Each day starts with **Stamina** (default 12 action points, plus comfort
  bonuses). Meaningful actions spend points: a quest step costs 1–2, a business
  shift 3, a mini-game 1, foraging 1. Walking and talking are free.
- The clock moves forward with the points you spend: Morning → Afternoon →
  Evening → Night. Some content (night market, sunrise at Happo Pond) only
  happens at certain times.
- You can end the day early by sleeping in the van. When stamina runs out, the
  evening wind-down starts on its own; you're never kicked out mid-action.
- Why: playtesting can be deterministic (the debug API can jump straight to a
  given action), players who want to binge aren't blocked, and every choice
  feels a little meaningful without any stress.

---

## 4. Expansion: Waking the 10 Sub-Regions

### 4.1 How a region wakes up
Each region has a **Vitality** level from 0 to 3:

| Vitality | Visuals | Gameplay |
|---|---|---|
| 0 Dormant | Desaturated, shutters down, no crowds, muted ambient sound | You can visit and talk to the key person; one ingredient to forage |
| 1 Stirring | Partial color; one shop or building lights up | Parking spot unlocked; first customers |
| 2 Awake | Full color; NPC crowds; seasonal attraction opens | New shop or purchases; new mini-game you can replay |
| 3 Thriving | Festival touches (banners, lanterns, music); crowds that change with the season | Regional bonus to the business; connected roads open |

The key person's **3-step arc** moves a region from 0 to 3. Each step is one
challenge (fetch, create, or puzzle; §5). Finishing it gives **Kizuna 絆**,
the "bonds" currency that is the valley's equivalent of Flamey's spirit logs.
Spending Kizuna at the **Valley Revival Board** (at the station) opens roads to
the next regions. Steps beyond 3 (side quests, seasonal requests) keep a region
thriving in both seasons.

### 4.2 Valley map and unlock graph

```
                       [9 Tsugaike Kogen]  (north)
                              |
                       [6 Iwatake]
                              |
     [5 Happo Pond]--[3 Happo-One Bus Terminal]--[4 Echoland]
     (up the gondola)
                              |
                       [1 JR Hakuba Station]  ← start / Valley Revival Board
                              |
                       [2 Snow Peak Land Station]  ← van garage
                              |
                       [7 Hakuba Goryu]
                              |
                       [8 Hakuba 47]
                              |
                       [10 Aokiko / Lake Aoki]  (south)
```

The map is a hub with two arms. After region 2 (the garage), the player can
choose to go **north** (Happo → Iwatake → Tsugaike) or **south** (Goryu → 47 →
Aokiko). Some roads also need a chassis upgrade (§6.2), so van progress and
village progress depend on each other.

> **The 10th region (decided, D1): Happo Pond.** It's reached on foot from the
> top of the Happo-One lifts, so it needs no chassis upgrade, but it does need
> the bus terminal (3) restored and the lifts running. The van can't drive up
> there, so this region is about carrying a **pack-out kit** (a small subset of
> your menu) and making deliveries to the mountain hut. That's a different feel
> from the parked-van regions.

### 4.3 Region roster

The names are placeholders. Every key person is a fictional local, never a real
business owner.

| # | Region | Key person & their problem | 3-step arc (F = fetch, C = create, P = puzzle) | Unlocks | Winter draw | Green draw |
|---|---|---|---|---|---|---|
| 1 | **JR Hakuba Station** | **Mrs. Kobayashi**, who runs the tourist info desk. Visitors step off the train and don't know where to go. | F: collect 5 scattered brochures → C: draw a hand-made valley map (sticker placement) → P: **Lost-luggage sort** (grid packing) | Valley Revival Board, first parking spot, tutorial for your business | Ski arrivals | Hikers, cyclists |
| 2 | **Snow Peak Land Station** | **Takumi**, an outdoor-gear shop mechanic. His camping workshop has no customers and he's thinking of closing. | P: **Tent pitching** (tension / pin placement) → F: salvage van parts → C: **build your first van module** | **Van Garage** (chassis, modules), choose your **business archetype** | Gear rental | Camping, BBQ, the main campsite |
| 3 | **Happo-One Bus Terminal** | **Hana**, a bus dispatcher. Timetables are chaos and tourists miss connections. | P: **Shuttle routing** (connect stops, flow puzzle) → F: find 4 lost IC cards → C: make a cheerful timetable board | Valley shuttle (more customer traffic everywhere), roads north and west | Hub for buses from Tokyo | Gateway to the Happo Pond hike |
| 4 | **Echoland** | **Kenji & Mai**, who run an izakaya. Half the restaurants are dark, and the strip feels lonely at night. | C: **cook a signature dish** → P: **Izakaya seating** (constraint seating, *Is This Seat Taken?* style) → F: gather lanterns for the street | **Evening market** (night trading hours), the bar-street parking spot | Après-ski nightlife | Summer night market (this has to be built up) |
| 5 | **Happo Pond (Happo-ike)** | **Daichi**, a mountain hut keeper. Trail cairns have collapsed, the hut is half-stocked, and hikers turn back before the pond. | F: carry 5 hut supplies up from the gondola → P: **Cairn balance** (stack stones so the cairn stands; balance/placement engine) → C: make a **sunrise breakfast** set (pack-out cooking) | **Sunrise event** (a dawn-only gathering that boosts every region's buzz the next day), pack-out kit, hut delivery contracts | Snowshoe and backcountry tours from the ridge | **The iconic pond hike** with mountain reflections (a major green-season draw) |
| 6 | **Hakuba Iwatake** | **Sora**, a gondola operator. The summit terrace sits empty in summer. *(Requires snow tires.)* | P: **Gondola balance** (weight/seat constraint) → C: make terrace furniture → F: wildflower seeds | Mountain-top parking (premium tips), sky-terrace attraction | Family skiing | **Mountain terrace with views** (a key green-season draw) |
| 7 | **Hakuba Goryu** | **Momo**, a farmer and alpine-garden keeper. The garden is overgrown and nearby farms have no buyers. | F: weed and collect alpine plants → P: **Garden bed packing** (polyomino layout) → C: build a farm-stand crate | **Farm ingredients** (soba flour, vegetables, apples), roof-planter module | Night skiing | **Alpine garden** in bloom |
| 8 | **Hakuba 47** | **Yuki & Kenta**, a ski-tuning couple. They want an MTB park, but trails are washed out. *(Requires 4WD.)* | P: **Trail builder** (tile-path flow) → F: collect trail markers → C: tune a bike/board (wax rhythm mini-game) | Gear-service tools, MTB park attraction | Park and powder | **MTB bike park** |
| 9 | **Tsugaike Kogen** | **Grandma Chiyo**, a nature-park guide. The wetland boardwalk is broken and the guides have retired. *(Requires 4WD + chains.)* | F: find 6 marsh plants for the field guide → P: **Boardwalk repair** (Dorfromantik-like tiles) → C: make a guided-tour pack | **Guided tours** (a business add-on), rare ingredients | Big beginner slopes | **Nature park wetlands**, autumn leaves |
| 10 | **Aokiko (Lake Aoki)** | **Ren**, a lakeside SUP renter. Clear water, but no one knows it's here. | P: **Photo framing** (composition puzzle for a lake photo) → C: make a postcard set → F: clean up the beach | Lakeside parking spot, SUP add-on, **finale trigger** for green season | Quiet ice-and-snow view | **SUP, kayak, swimming** (the strongest green-season draw) |

**Pattern check:** every region uses each challenge type exactly once. Puzzle
mechanics repeat in families: grid packing in regions 1 and 7; constraint
seating in 4 and 6; flow/path in 3, 8, and 9; balance/placement in 2 and 5. That means we only build **about
6 puzzle engines** and reuse them with different content (§5.3).

---

## 5. Challenges

### 5.1 Fetch quests: "Find X in the village"
- *Template:* `{item, count, region(s), hint_level}`.
- Items are placed **visibly** with a gentle sparkle and a silhouette you can
  read. You can buy a hint (Kizuna or yen) that pings the nearest item.
- Variants: *scatter* (pick up items in one region), *trade chain* (A wants B,
  who wants C), *photo* (point the camera at a named landmark), and *season-only*
  (items only appear in green or winter season).
- **Rule:** never more than 6 items, and never in an area you can't reach.
  Reviewers called out frustrating searches in Cozy Grove.

### 5.2 Creation quests: "Make a thing for the villager's goal"
- Use the **van workbench / kitchen** with ingredients you've gathered.
- Each creation is a short **tactile mini-game** with a quality score (1–3
  stars). Any score finishes the quest; higher stars give more Kizuna.
  - *Cook*: timing taps (soba boil, oyaki fold)
  - *Craft*: trace a path (carving, sign painting)
  - *Arrange*: sticker placement onto a template (map, exhibit, timetable board)
- Creations reuse the **business production system**, so making a quest item is
  practice for the business.

### 5.3 Puzzle mini-games: about 6 reusable engines

| Engine | Used by | Difficulty knobs |
|---|---|---|
| **Grid Packing** (polyominoes) | Luggage sort (1), garden beds (7), van layout | Grid size, piece count, odd shapes |
| **Constraint Seating** | Izakaya (4), gondola (6), shuttle seats | Number of people, number of constraints, layout |
| **Flow / Path Connect** | Shuttle routes (3), MTB trails (8), boardwalk (9) | Grid size, required waypoints, crossings |
| **Timing / Rhythm** | Cooking (pour, noodle cut), wax tuning | Window width, tempo |
| **Balance / Placement** | Tent pitching (2), cairn balance (5) | Number of pins/stones, tolerance |
| **Composition** | Photo framing (10), postcards | Number of rules (rule of thirds, include X, exclude Y) |

Every puzzle has: **unlimited retries**, a **hint button** (graded hints),
**skip after 3 tries** (the quest finishes with 1 star), and a
**seeded generator**, so puzzles can be both handmade and generated for
replays.

---

## 6. The Van and the Business

### 6.1 The two layers
- **Van = hardware.** The chassis decides traversal and grid size. Modules
  decide comfort and production.
- **Business = software.** The archetype decides what you sell, who buys it,
  and which mini-games you play.

### 6.2 Chassis tiers (traversal gates)
Fictional, non-branded names, inspired by Japanese vans.

| Tier | Chassis | Interior grid | Roof | Unlocks |
|---|---|---|---|---|
| 0 | **Kei Van** (tiny, 2WD) | 4×2 | — | Regions 1–5 |
| 1 | + **Snow Tires & Roof Rack** | 4×2 | 2 slots | Iwatake (6), Goryu (7) |
| 2 | **Box Van 4WD** | 6×3 | 3 slots | Hakuba 47 (8), Aokiko (10) |
| 3 | **Overland Camper** (pop-top, chains) | 8×3 + loft | 4 slots | Tsugaike (9), finale road |

> **⚖️ Chassis choice.** ★ A: one linear upgrade path (simple and easy to
> balance). B: at Tier 2, choose between a **Long Van** (more interior, slow) and
> a **Lifted 4WD** (less interior, opens shortcuts). That adds build identity but
> doubles the balancing.

### 6.3 Van build system (Spiritfarer-style cutaway)
A side-view cutaway of the van interior, plus rooftop and awning slots. Modules
are polyominoes placed on the grid. **Placing modules is itself a light
packing puzzle.**

| Module type | Examples | Effect |
|---|---|---|
| **Living** | Futon, loft bed, mini stove, plant shelf, record player | **Comfort**: better sleep → more stamina / better morning buffs |
| **Production** | Espresso bar, induction cooktop, wax bench, sauna stove, print station | Unlocks recipes / services for the business |
| **Service** | Side window counter, awning + stools, chalkboard menu, lantern string | Customer capacity, appeal, tips |
| **Roof** | Solar panel, deck, planter boxes, ski box | Energy, a herb supply, gear storage |
| **Utility** | Water tank, battery, fridge | Daily production capacity |

**Comfort vs. Business tension:** every grid cell is either for living or for
work. A cozy van gives better personal buffs; a busy van makes more money. Over
the game you get more space, so this eases up, but it stays a meaningful
choice.

### 6.4 Business archetypes
You choose your **primary** archetype at Snow Peak Land Station (region 2). You
can add a **secondary** archetype at Rank 3.

| Archetype | Sells | Strong season | Signature mini-game | Synergies |
|---|---|---|---|---|
| ☕ **Alpine Coffee & Bakery** | Pour-over, matcha latte, apple pastry | Winter mornings, green-season hikers | Pour spiral (timing) | Goryu apples, Iwatake terrace |
| 🍜 **Soba & Oyaki Kitchen** | Soba, oyaki, oden, onigiri | Winter evenings | Noodle cut (rhythm) | Goryu flour, Echoland nights |
| 🎿 **Gear Tune & Rental** | Waxing, rentals, bike tune | Winter (skis), green (bikes) | Wax iron (trace) | Hakuba 47, Snow Peak |
| 🧖 **Mobile Sauna** | Tent sauna + cold plunge sessions | **Green season** (lakeside!) and winter | Löyly timing | Aokiko, Tsugaike |
| 🧭 **Guide & Tours** | Snowshoe tours, hiking, photo tours | **Green season** | Route planning (flow) | Tsugaike, Happo terminal |
| 🎨 **Crafts & Souvenirs** | Postcards, carved cups, charms | Both (modest) | Craft trace / composition | Happo Pond postcards, Aokiko photos |

Design intent: winter-strong archetypes (coffee, soba) are **easier at the
start**, and green-strong archetypes (sauna, tours) are **harder at the start
but help the green-season test later**. Choosing a secondary archetype that
covers your primary's weaker season is the main build-craft lesson.

### 6.5 Running the business (the day loop)
1. **Choose a parking spot.** Only restored regions are available. Each spot has
   a customer mix that changes by season and time of day (shown as icons:
   skier, hiker, family, inbound tourist, local, cyclist).
2. **Set the menu.** 3–6 items from your unlocked recipes, with a simple price
   tier (¥ / ¥¥ / ¥¥¥).
3. **Prep in batches.** Run a short mini-game to stock your counter (for example,
   one pour = 4 cups).
4. **Serve.** Customers walk up with thought bubbles. If you're out of stock
   they leave without fuss. Regulars remember you. **Tips** go up with quality,
   matching the season, and comfort.
5. **Close.** Daily summary: yen, reputation, regulars gained, and what sold out.

**Business Rank 1–5** depends on lifetime reputation and how many regions are
restored:

| Rank | Title | Unlocks |
|---|---|---|
| 1 | Side Hustle | 3 menu slots |
| 2 | Local Favorite | 5 slots, awning |
| 3 | Valley Regular | **Secondary archetype**; hire a restored villager as a helper (auto-preps 1 batch a day) |
| 4 | Hakuba Staple | Catering for the Happo Pond sunrise event; run two parking spots in one day |
| 5 | Valley Institution | Win condition (with seasons); custom van livery |

Helpers are borrowed from Spiritfarer's "residents automate actions" idea: each
restored villager can be invited to help, and each one automates or improves
one verb.

---

## 7. Character Selection
At the start, the player chooses a **name**, **pronouns/gender** (the default
protagonist is female; male and nonbinary options come later), an
**appearance** (a few presets to start), and a **personality**. Each
personality gives **small** modifiers (±10–15%), plus a few unique lines of
dialogue.

| Personality | Backstory | Bonus | Small cost | Flavor |
|---|---|---|---|---|
| 📋 **The Planner** | Ex-project manager | +1 hint level free on logic puzzles; menu sales forecasting | Rhythm windows 10% tighter | Talks in bullet points; makes spreadsheets of snow conditions |
| 🎨 **The Creative** | Ex-designer | +1 quality star chance on creation quests; craft archetype +10% | Fetch hints cost more | Notices colors; names every dish |
| 🏂 **The Outdoorsy** | Ex-ski-bum turned salaryman | +15% walk speed; bigger fetch pickup radius; gear/tour archetypes +10% | Kitchen prep 10% slower | Knows every trail |
| 💬 **The Social Butterfly** | Ex-sales | +15% reputation from regulars; villagers share bonus hints | Packing puzzles have one fewer free undo | Everyone's best friend in 5 minutes |
| 🔧 **The Tinkerer** | Ex-engineer | −15% van module cost; packing puzzles show ghost outlines | Tips −5% | Talks to the van |

> **⚖️ Personality system.** ★ A: a single choice at the start. B: a short
> Tokyo prologue quiz (3 questions) that suggests a personality, which the player
> can change. C: personality traits that drift as you play.

---

## 8. Seasonality

### 8.1 Calendar
`Winter (Dec–Mar) → Spring melt (short) → Green (May–Oct) → Autumn leaves (short) → Winter …`

- **Winter** and **Green** are the two **scored** seasons, 7 days each by
  default.
- **Shoulder seasons** (2–3 days each) are quiet, with few customers. They're
  for van upgrades, side quests, and planning. Business in Hakuba really does
  drop off in the "mud seasons," and it gives the player a breather.
- The game starts in **late autumn**, the first scored season is **winter**
  (the easy one), and then green season arrives as the real test.

### 8.2 What changes between seasons
| | Winter | Green |
|---|---|---|
| Base tourist demand | **High** (skiing) | **Low** unless attractions are restored |
| Main customers | Skiers, inbound tourists | Hikers, cyclists, families, campers, remote workers |
| Demand drivers | Lifts open (automatic) | Restored attractions: Iwatake terrace, Goryu garden, 47 MTB, Tsugaike wetland, Aokiko SUP, Happo Pond hike and sunrise event |
| Roads | Some passes need chains | All open; some regions have summer-only content |
| Best sellers | Hot drinks, soba, waxing | Cold drinks, sauna, tours, bike tunes |
| Visuals | Snow layer, lifts busy | Green palette, flowers, lake sparkle |

### 8.3 Season Report (the "test")
At the end of each scored season you get a Stardew-like summary:
- **Valley Buzz** per region (0–100): Vitality × seasonal attraction ×
  business presence.
- **Your business:** revenue, reputation, regulars, best seller.
- **Gentle tips:** for example, "Green-season hikers had no lunch at Tsugaike.
  A food archetype parked there would help."
- **No failure.** A weak season only lowers next season's starting demand a
  little and adds a "help needed" side quest.

### 8.4 Winning
**The ending is unlocked when:** all 10 regions are at Vitality 3, business is
Rank 5, and **one Winter plus the following Green season both score at or above
the "Thriving" Buzz threshold.** That triggers the **Hakuba Valley Festival**
finale, with a montage of every restored region in both seasons. Afterwards you
can keep playing.

---

## 9. Economy and Tuning Sketch
| Currency | Earned by | Spent on |
|---|---|---|
| **¥ Yen** | Business sales and tips | Ingredients, van modules, chassis, decor |
| **絆 Kizuna** | Quest steps, regulars, events | Opening roads on the Valley Revival Board, hints, inviting helpers |
| **Ingredients** | Foraging, farm stands, shops | Recipes and creations |

Target pacing (to tune during playtests):
- Day 1 must take **10 minutes or less**, which fixes the Cozy Grove complaint.
- One region per 1–2 in-game days early on, and 2–3 days late.
- Chassis Tier 1 by about day 6, Tier 2 by about day 14, Tier 3 by about day 22.
- The ending around in-game day 35–45 (about 8–12 hours).

All numbers live in data files (`content/*.json`), not in code, so the
balance can be tuned without touching logic.

---

## 10. Narrative Frame and Tone
- **Prologue (1 minute):** a cramped Tokyo apartment, an over-full train, a
  phone notification for a used-van listing, and a road trip montage. You
  arrive in late autumn at JR Hakuba Station.
- **Mentor:** Mrs. Kobayashi at the station is your first friend and guide to
  the Valley Revival Board.
- **Tone:** warm, a little funny, quietly hopeful. Real modern issues come
  through gently: depopulation, the summer slump, the pull between locals and
  tourists, remote-work newcomers.

> **Magic layer (decided, D2): a light kodama touch.** Small *kodama* (tree
> spirits) only show up once a region reaches Stirring. Each region has 3 to
> find, and they peek out at higher Vitality. Finding one gives a little Kizuna
> and fills a **Kodama Book**. People are just people, and nobody makes a fuss
> about the kodama; maybe only the protagonist notices them. Visually they're
> also a clear "this place is waking up" signal.

---

## 11. Technology: Which Engine, and How Claude Playtests It

### 11.1 Requirements
1. Claude implements the game.
2. **Claude can play the game itself**: launch it, click and type, take
   screenshots, read game state, and judge look and feel.
3. **You validate only after Claude has verified it.**
4. Fast iteration, and assets that can be swapped out later.

### 11.2 Options

| Option | Claude playtest loop | Pros | Cons |
|---|---|---|---|
| **★ Phaser 4 + TypeScript + Vite (browser)** | Dev server → the **built-in browser pane**: real clicks, screenshots, `javascript_tool` to read and set game state. **Playwright** for automated visual snapshots | Hot reload in under a second; fully text-based project; DOM UI for menus; huge example base; Phaser 4 is stable (v4.0 in April 2026, v4.1 since) | Less built-in editor tooling; 2D only (fine for us) |
| Godot 4 (existing `godot-test`) | Headless runs for logic; screenshots need a non-headless run or a **web export → browser**; third-party tools like PlayGodot or GdUnit4 | Great 2D editor; already installed; prior work exists | `.tscn` scene files are harder to author by hand; slower export→test loop; Claude can't easily "see" the editor |
| PixiJS / Excalibur + custom | Same as Phaser | Lightweight | We'd rebuild scenes, input, and tweens that Phaser already has |
| Unity | Weak for agent-driven playtesting | Industry standard | Heavy, GUI-centric, slow builds |

**Decision (D4): Phaser 4 + TypeScript + Vite.** The deciding factor is the
verification loop. A browser game runs in the same pane Claude can drive and
screenshot, its state can be read directly, and builds are instant. We'll work
out the core mechanics in 2D first. If we later want an isometric presentation,
we may port to Godot. The rules in `src/sim`, the JSON in `content/`, and the
asset manifest are deliberately engine-agnostic, so only the presentation layer
would need rewriting.

**Desktop target (D6):** a fixed 1280×720 logical canvas that scales to fit
(`Phaser.Scale.FIT`), controlled with mouse plus WASD/arrow keys, tested at
1280×720 and 1920×1080.

### 11.3 Architecture (as built in M0)
```
cozy-hakuba-cc/
  content/                 # JSON: tuning, regions, archetypes, personalities, asset-manifest
  src/sim/                 # Pure TypeScript game rules (no Phaser): state, day/season clock, travel gating, RNG, store
  src/scenes/              # Phaser scenes: Boot, Title, Station (M0 sandbox), Hud
  src/ui/                  # Papercraft helpers (art placement, panels, grain overlay)
  src/debug/api.ts         # window.__hakuba debug/playtest API
  src/catalog.ts           # Asset catalog page logic (catalog.html)
  public/assets/*.svg      # Washi placeholder art, authored as code; Phaser loads it at 2x for crisp scaling
  tests/unit/              # Vitest: sim rules, content graph, asset-manifest contract
  tests/e2e/               # Playwright: scripted playthrough + golden screenshots
  .claude/launch.json      # Dev server config for the in-app browser pane
```
Phaser rasterizes the SVGs at load time, so M0 has no separate asset build step.
If texture count or load time becomes a problem, a `tools/build-atlas` step
(resvg → packed atlas) can be added without changing asset ids.

**Separate the simulation from rendering.** All rules live in `src/sim` as
plain, deterministic TypeScript with a seeded RNG. That makes it unit-testable,
and it lets a **headless balance simulator** run a "bot player" through 40
in-game days in seconds to check pacing (§9).

### 11.4 Claude's verification protocol (before you see anything)
1. **Unit tests:** quest state machines, economy, season scoring, and every
   puzzle generator checked for solvability (`vitest`).
2. **Balance sim:** run a bot through a full game and assert the day targets in
   §9.
3. **Debug API:** `window.__hakuba` exposes `getState()`, `setSeason()`,
   `warpTo(region)`, `grant(item)`, `completeStep()`, `setTime()`, and
   `screenshotMode()`.
4. **Live play in the built-in browser:** play the new feature by hand (click
   and keyboard), screenshot every new screen in both seasons, and check
   readability and contrast at the desktop resolutions.
5. **Playwright snapshots:** a golden screenshot for every scene and season so
   visual regressions are caught.
6. **Handoff note:** what was tested, screenshots, known issues. Only then is
   it ready for your validation.

---

## 12. Visual Design and the Asset Pipeline

### 12.1 Camera and layout
- **Regions:** ¾ top-down view (like Cozy Grove) for walking, gathering, and
  meeting people.
- **Van interior:** **side-view cutaway** (like Spiritfarer) for building and
  for the business counter.
- **Valley map:** a hand-drawn, illustrated map with your van as a token.

### 12.2 Art direction options
| Option | Look | Pros | Cons |
|---|---|---|---|
| **★ A: Washi papercraft, flat vector** | Soft flat shapes, paper-grain texture overlay, rounded outlines; like a Japanese travel poster or picture book | **Claude can write it directly as SVG**, it scales to any resolution, it's easy to recolor for seasons, and it looks good early | Can look generic without care; needs a strong palette and texture |
| B: Cozy pixel art (32 px) | Retro, Stardew-adjacent | Lots of free packs (Kenney is already in `godot-test`); forgiving | Pixel art Claude generates is hard to keep consistent; low resolution limits expressive characters |
| C: Hand-painted / watercolor (later goal) | Spiritfarer- or Ghibli-like painterly look | The most beautiful | Needs an artist or careful AI-assisted generation; expensive to iterate |

**Decision (D5):** use **A (washi papercraft)** for test assets in the
prototype and vertical slice. Design every asset so it can later be **swapped by
ID** for C-quality paintings.

### 12.3 Palette and the restoration effect
- Separate palettes for **winter** (snow white, cedar green, lantern amber,
  twilight blue) and **green** (fresh green, lake teal, sky, wildflower pink).
- **Dormant → Thriving** uses a saturation/tint shader per region (Phaser
  ColorMatrix), with a smooth tween and particles when Vitality goes up. This is
  the main "you did it" moment, so it gets real effort.
- Seasons swap tile and decor variants (snow layer on or off), not whole maps.

### 12.4 "Self-explaining" placeholder assets
Each test asset must **show what it's for** before it looks beautiful:
- **Silhouette first:** you recognize the object from its shape alone (a van,
  a gondola, a soba bowl).
- **Role encoding:**
  - Interactive objects get a **warm amber outline** on hover or nearby.
  - Quest people get a **speech-bubble badge** with the challenge-type icon
    (🔍 fetch, 🛠 create, 🧩 puzzle).
  - Collectibles **sparkle**.
  - Locked things get a **padlock + requirement chip** (for example, "4WD").
- **State encoding:** Dormant / Stirring / Awake / Thriving is shown by
  saturation and lights, never by text alone.
- **Business clarity:** customers show a thought bubble with the item icon and
  a **customer-type icon** (skier or hiker), so seasonal demand is readable at a
  glance.
- **Module tiles:** show the footprint grid and a category color (living = warm
  wood, production = steel, service = red noren curtain, roof = sky blue).

### 12.5 Pipeline
1. **Stage 0 (now): SVGs authored as code.** Claude writes `assets/src/*.svg`
   from a shared palette. A build script (`resvg`/`sharp`) rasterizes them into
   atlases. An **asset manifest** (`id, size, anchor, role, season variants,
   placeholder: true`) is the contract every final asset must match.
2. **Asset catalog page:** an HTML page showing every asset with its role and
   state variants, for review at a glance (like `godot-test/tools/sprite_catalog.html`).
3. **Stage 1:** add CC0 packs (Kenney etc.) where they fit the papercraft style
   (UI icons, particles).
4. **Stage 2:** better assets (painted or AI-assisted, with a style guide and
   consistent prompts, or commissioned) replace placeholders **by ID**. No code
   changes needed.
5. **Fonts:** rounded Japanese and Latin pairing, e.g. *Zen Maru Gothic* or
   *M PLUS Rounded 1c* (open licenses).
6. **Audio (later):** ambient loops per season and Vitality level, and
   satisfying UI sounds (pour, sizzle, stamp). Reviews of Cozy Grove single out
   its satisfying sounds.

---

## 13. Milestones
| Milestone | Scope | Exit criteria (verified by Claude first) |
|---|---|---|
| **M0 Skeleton** ✅ | Vite + Phaser 4 + sim core + debug API + asset manifest/catalog + station sandbox (mini fetch loop, restoration filter, season swap, sleep) | Boots; 12 unit tests and the e2e playthrough with 3 golden snapshots pass |
| **M1 Vertical slice** ✅ | Character select (name, pronouns, 5 personalities), JR Hakuba Station 3-step arc (brochures → valley map sticker craft → lost-luggage grid packing), kodama, seasonal crowds and lanterns, Kei Van interior with drag-and-drop modules + shop + comfort→stamina, Coffee café (pour-timing prep + window service), Valley Revival Board, autosave on sleep + Continue | 25 unit tests; one e2e playthrough of the whole slice by real input in both seasons |
| **M2 Garage & build** | Snow Peak Land Station, module placement, archetype choice (coffee + soba), chassis Tier 1 | The build changes earnings in the balance sim |
| **M3 North arm** | Happo terminal, Echoland, Happo Pond, Iwatake, Tsugaike; seating, flow + balance engines | 6 regions playable; Season Report |
| **M4 South arm** | Goryu, 47, Aokiko; remaining archetypes; helpers; Ranks 1–5 | Full game reaches the ending in the balance sim |
| **M5 Polish** | All personalities, appearance options, audio, art Stage 2 replacements, save/load | Full manual playthrough by Claude, then your validation |

---

## 14. Open Questions
The first seven questions are resolved; see the Decision Log at the top.
Still open:
1. **Chassis branching** (§6.2): linear (proposed) or a fork at Tier 2?
2. **Personality onboarding** (§7): a single pick (proposed), a prologue quiz,
   or traits that drift?
3. **Save model:** autosave on sleep only (proposed), or manual save slots too?

---

## 15. Sources
- Cozy Grove: Camp Spirit reviews — [Pocket Gamer](https://www.pocketgamer.com/cozy-grove-camp-spirit/review), [Into Indie Games](https://intoindiegames.com/reviews/cozy-grove-camp-spirit-review/), [Siliconera](https://www.siliconera.com/review-cozy-grove-camp-spirit-offers-more-cozy-camping/), [Ladies Gamers](https://ladiesgamers.com/cozy-grove-camp-spirit-review/)
- Cozy Grove (original) — [TechRaptor](https://techraptor.net/gaming/reviews/cozy-grove-review), [Shacknews](https://shacknews.com/article/123979/cozy-grove-review-bearably-campy)
- Spiritfarer — [PC Gamer](https://pcgamer.com/spiritfarer-is-a-serene-boat-adventure-about-compassion-in-the-face-of-death), [Game Informer](https://www.gameinformer.com/review/spiritfarer/spiritfarer-review-the-long-way-home), [NME](https://www.nme.com/reviews/spiritfarer-review-a-beautiful-management-game-about-dying-too-mired-in-frustrating-busywork-2732038), [Super Jump / Medium](https://medium.com/super-jump/how-spiritfarer-leans-on-the-players-lived-experience-with-death-f812e187e189)
- Van & food-truck games — [Fruitbus on Steam](https://store.steampowered.com/app/2484130/Fruitbus/), [Steam Deck HQ Fruitbus review](https://steamdeckhq.com/game-reviews/fruitbus/), [GamesRadar on Outbound](https://www.gamesradar.com/this-cozy-camper-van-survival-game-takes-the-best-elements-of-the-sims-and-stardew-valley-and-puts-them-on-wheels)
- Engines — [Phaser v4 stable download](https://phaser.io/download/stable), [Phaser GitHub](https://github.com/phaserjs/phaser), [Godot Claude Skills / PlayGodot](https://github.com/Randroids-Dojo/Godot-Claude-Skills)
- Your own notes: `games/NOTES.md` (Spiritfarer, Tiny Town, Is This Seat Taken?), `games/godot-test/DESIGN_DOC.md` (prior spirit-guardian direction)
