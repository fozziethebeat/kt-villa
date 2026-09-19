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

## 🚀 Next Phases (Backlog)
- **Phase 2: Dialogue & Quest System** (Multi-branch dialogue, quests e.g. "Collect 3 Nagano Apples for Elder Kenzo", onsen towel delivery).
- **Phase 3: Turn-Based Combat / Encounters** (Mini-battle screen when interacting or colliding with enemy NPCs).
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
