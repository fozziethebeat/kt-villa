# Sprite Catalog & Asset Manager (Next.js)

A modern, full-stack 2D sprite catalog, animation previewer, and asset re-mapping tool for Godot projects.

---

## 🚀 Quick Start

From this directory:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ✨ Features

- **🏔️ Hakuba RPG Featured Project Tab**:
  - Organized sub-sections: *Animated Characters*, *Collectible Items*, *Terrain & Ground*, *Village Architecture*, *Alpine Nature*, and *Candidate Presets*.
  - Displays TileSet source IDs, atlas coordinates, and current project roles.
- **13 Kenney Asset Packs**:
  - Tiny Ski, Tiny Town, Tiny Dungeon, Tiny Battle, RPG Urban, Monochrome RPG, Monochrome Pirates, Desert Shooter, Generic Items, Map Pack, UI Adventure, Roguelike Characters (modular 54×12 atlas slices), Roguelike RPG (57×31 dungeon slices).
- **Interactive Asset Re-Mapper**:
  - Select any tile in any pack.
  - Choose a Hakuba RPG target from the dropdown.
  - Click **`✨ Map to Target`** to instantly assign the tile.
- **1-Click Direct Save (`Cmd/Ctrl + S`)**:
  - Saves directly to [`tools/sprite_usage.json`](../sprite_usage.json) via `/api/save`.
  - Automatically triggers asset syncing into `assets/sprites/` for Godot.
- **Inspector & Animation Player**:
  - 128×128 pixel-magnified preview canvas with crisp nearest-neighbor filtering.
  - Live animated motion cell with Play/Pause and variable speed slider (1 to 14 FPS).
  - Synchronized static frame timeline.
  - 1-click GDScript code generators: `preload(...)`, `Vector2i(...)`, `set_cell(...)`, and `Array[Texture2D]` frame sequences.

---

## 🛠️ Architecture

- **Framework**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **API Routes**:
  - `GET /api/catalog`: Dynamically reads Kenney packs and `tools/sprite_usage.json` into a unified index.
  - `POST /api/save`: Writes updated mappings directly to disk and invokes asset synchronization.
  - `GET /api/sprite/[...path]`: Streams sprite PNGs directly from `assets/kenney/` and `assets/sprites/`.
