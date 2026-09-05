# Hakuba RPG — Project Notes & Roadmap

A 2D top-down Japanese Role-Playing Game (JRPG) centered around exploring the scenic mountain village of **Hakuba**, Japan.

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
