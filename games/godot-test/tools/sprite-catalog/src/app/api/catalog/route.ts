import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { TileItem, PackData, TileUsage, Entity } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const gameDir = path.resolve(process.cwd(), "..", "..");
    const toolsDir = path.join(gameDir, "tools");
    const kenneyDir = path.join(gameDir, "assets", "kenney");
    const usagePath = path.join(toolsDir, "sprite_usage.json");

    let usageData: { projects?: any; entities?: Entity[]; usages?: TileUsage[] } = {};
    if (fs.existsSync(usagePath)) {
      usageData = JSON.parse(fs.readFileSync(usagePath, "utf-8"));
    }

    const usagesByTile: Record<string, TileUsage[]> = {};
    for (const u of usageData.usages || []) {
      const key = `${u.pack}/${u.tile_name}`;
      if (!usagesByTile[key]) usagesByTile[key] = [];
      usagesByTile[key].push(u);
    }

    const packs: Record<string, PackData> = {};

    // Helper to add standard tile folder
    function addStandardPack(
      packId: string,
      packName: string,
      icon: string,
      desc: string,
      folderPath: string,
      resPrefix: string,
      apiPrefix: string
    ) {
      if (!fs.existsSync(folderPath)) return;
      const files = fs.readdirSync(folderPath)
        .filter((f) => f.endsWith(".png"))
        .sort();

      const tiles: TileItem[] = files.map((f, idx) => {
        const tileName = path.basename(f, ".png");
        const usageKey = `${packId}/${tileName}`;
        const usages = usagesByTile[usageKey] || [];
        const tags = [packId, tileName];
        for (const u of usages) {
          tags.push(u.project, u.entity_type, u.role || "", "used_in_project");
        }

        return {
          key: `${packId}_${tileName}`,
          name: tileName,
          pack: packId,
          packName,
          col: idx % 12,
          row: Math.floor(idx / 12),
          imgSrc: `/api/sprite/${apiPrefix}/${f}`,
          resPath: `${resPrefix}/${f}`,
          tags,
          usages,
        };
      });

      packs[packId] = {
        id: packId,
        name: packName,
        icon,
        desc,
        tiles,
      };
    }

    // 1. Tiny Ski
    addStandardPack("tiny-ski", "Tiny Ski", "🎿", "Winter terrain, skiers, snowmobiles, pine trees (16×16)",
      path.join(kenneyDir, "tiny-ski", "Tiles"),
      "res://assets/kenney/tiny-ski/Tiles",
      "kenney/tiny-ski/Tiles"
    );

    // 2. Tiny Town
    addStandardPack("tiny-town", "Tiny Town", "🏡", "Town roofs, cobblestone, timber walls, fences, apples (16×16)",
      path.join(kenneyDir, "tiny-town", "Tiles"),
      "res://assets/kenney/tiny-town/Tiles",
      "kenney/tiny-town/Tiles"
    );

    // 3. Tiny Dungeon
    addStandardPack("tiny-dungeon", "Tiny Dungeon", "🏰", "Dungeon tiles, knights, skeletons, slimes, chests (16×16)",
      path.join(kenneyDir, "tiny-dungeon", "Tiles"),
      "res://assets/kenney/tiny-dungeon/Tiles",
      "kenney/tiny-dungeon/Tiles"
    );

    // 4. Tiny Battle
    addStandardPack("tiny-battle", "Tiny Battle", "⚔️", "Military combat tiles, units, ski passes, flags (16×16)",
      path.join(kenneyDir, "tiny-battle", "Tiles"),
      "res://assets/kenney/tiny-battle/Tiles",
      "kenney/tiny-battle/Tiles"
    );

    // 5. RPG Urban Pack
    addStandardPack("rpg-urban-pack", "RPG Urban", "🏙️", "Modern city buildings, roads, pavements, interiors (16×16)",
      path.join(kenneyDir, "rpg-urban-pack", "Tiles"),
      "res://assets/kenney/rpg-urban-pack/Tiles",
      "kenney/rpg-urban-pack/Tiles"
    );

    // 6. Monochrome RPG
    addStandardPack("monochrome-rpg", "Monochrome RPG", "🏁", "Game Boy / 1-bit retro RPG exploration tiles (16×16)",
      path.join(kenneyDir, "monochrome-rpg", "Tiles"),
      "res://assets/kenney/monochrome-rpg/Tiles",
      "kenney/monochrome-rpg/Tiles"
    );

    // 7. Monochrome Pirates
    addStandardPack("monochrome-pirates", "Monochrome Pirates", "🏴‍☠️", "1-bit seafaring, pirate ships, islands (16×16)",
      path.join(kenneyDir, "monochrome-pirates", "Tiles"),
      "res://assets/kenney/monochrome-pirates/Tiles",
      "kenney/monochrome-pirates/Tiles"
    );

    // 8. Desert Shooter
    const dsDir = path.join(kenneyDir, "desert-shooter-pack", "PNG");
    if (fs.existsSync(dsDir)) {
      const dsTiles: TileItem[] = [];
      const subdirs = ["Players/Tiles", "Tiles/Tiles", "Interface/Tiles"];
      let idx = 0;
      for (const sub of subdirs) {
        const p = path.join(dsDir, sub);
        if (!fs.existsSync(p)) continue;
        const files = fs.readdirSync(p).filter((f) => f.endsWith(".png")).sort();
        for (const f of files) {
          const tileName = path.basename(f, ".png");
          const usageKey = `desert-shooter/${tileName}`;
          const usages = usagesByTile[usageKey] || [];
          const tags = ["desert-shooter", sub.split("/")[0].toLowerCase(), tileName];
          for (const u of usages) tags.push(u.project, u.entity_type, u.role || "", "used_in_project");

          dsTiles.push({
            key: `ds_${sub.replace(/\//g, "_")}_${tileName}`,
            name: `${sub.split("/")[0]}/${tileName}`,
            pack: "desert-shooter",
            packName: "Desert Shooter",
            col: idx % 12,
            row: Math.floor(idx / 12),
            imgSrc: `/api/sprite/kenney/desert-shooter-pack/PNG/${sub}/${f}`,
            resPath: `res://assets/kenney/desert-shooter-pack/PNG/${sub}/${f}`,
            tags,
            usages,
          });
          idx++;
        }
      }
      packs["desert-shooter"] = {
        id: "desert-shooter",
        name: "Desert Shooter",
        icon: "🏜️",
        desc: "High-def desert warfare, soldiers, vehicles (24×24)",
        tiles: dsTiles,
      };
    }

    // 9. Generic Items
    const itemsDir = path.join(kenneyDir, "generic-items", "PNG", "Colored");
    if (fs.existsSync(itemsDir)) {
      const files = fs.readdirSync(itemsDir).filter((f) => f.endsWith(".png")).sort();
      const tiles: TileItem[] = files.map((f, idx) => {
        const tileName = path.basename(f, ".png");
        const usageKey = `generic-items/${tileName}`;
        const usages = usagesByTile[usageKey] || [];
        const tags = ["generic-items", "item", "consumable", tileName];
        for (const u of usages) tags.push(u.project, u.entity_type, u.role || "", "used_in_project");

        return {
          key: `generic_${tileName}`,
          name: tileName,
          pack: "generic-items",
          packName: "Generic Items",
          col: idx % 12,
          row: Math.floor(idx / 12),
          imgSrc: `/api/sprite/kenney/generic-items/PNG/Colored/${f}`,
          resPath: `res://assets/kenney/generic-items/PNG/Colored/${f}`,
          tags,
          usages,
        };
      });
      packs["generic-items"] = {
        id: "generic-items",
        name: "Generic Items",
        icon: "🎒",
        desc: "Universal RPG equipment, foods, potions, talismans",
        tiles,
      };
    }

    // 10. Map Pack
    const mapDir = path.join(kenneyDir, "map-pack", "PNG", "Retina");
    if (fs.existsSync(mapDir)) {
      const files = fs.readdirSync(mapDir).filter((f) => f.endsWith(".png")).sort();
      const tiles: TileItem[] = files.map((f, idx) => {
        const tileName = path.basename(f, ".png");
        const usageKey = `map-pack/${tileName}`;
        const usages = usagesByTile[usageKey] || [];
        const tags = ["map-pack", "worldmap", "hex", tileName];
        for (const u of usages) tags.push(u.project, u.entity_type, u.role || "", "used_in_project");

        return {
          key: `map_${tileName}`,
          name: tileName,
          pack: "map-pack",
          packName: "Map Pack",
          col: idx % 12,
          row: Math.floor(idx / 12),
          imgSrc: `/api/sprite/kenney/map-pack/PNG/Retina/${f}`,
          resPath: `res://assets/kenney/map-pack/PNG/Retina/${f}`,
          tags,
          usages,
        };
      });
      packs["map-pack"] = {
        id: "map-pack",
        name: "Map Pack",
        icon: "🗺️",
        desc: "Overworld map icons, terrain features, settlements",
        tiles,
      };
    }

    // 11. UI Pack Adventure
    const uiDir = path.join(kenneyDir, "ui-pack-adventure", "PNG", "Default", "stone");
    if (fs.existsSync(uiDir)) {
      const files = fs.readdirSync(uiDir).filter((f) => f.endsWith(".png")).sort();
      const tiles: TileItem[] = files.map((f, idx) => {
        const tileName = path.basename(f, ".png");
        const usageKey = `ui-adventure/${tileName}`;
        const usages = usagesByTile[usageKey] || [];
        const tags = ["ui-adventure", "ui", "button", "frame", tileName];
        for (const u of usages) tags.push(u.project, u.entity_type, u.role || "", "used_in_project");

        return {
          key: `ui_${tileName}`,
          name: tileName,
          pack: "ui-adventure",
          packName: "UI Adventure",
          col: idx % 12,
          row: Math.floor(idx / 12),
          imgSrc: `/api/sprite/kenney/ui-pack-adventure/PNG/Default/stone/${f}`,
          resPath: `res://assets/kenney/ui-pack-adventure/PNG/Default/stone/${f}`,
          tags,
          usages,
        };
      });
      packs["ui-adventure"] = {
        id: "ui-adventure",
        name: "UI Adventure",
        icon: "🎛️",
        desc: "RPG HUD dialogue frames, quest boxes, badges",
        tiles,
      };
    }

    // 12. Roguelike Characters (Atlas Slices 54 cols x 12 rows)
    const charTiles: TileItem[] = [];
    for (let r = 0; r < 12; r++) {
      for (let c = 0; c < 54; c++) {
        const tileName = `char_r${String(r).padStart(2, "0")}_c${String(c).padStart(2, "0")}`;
        const usages = usagesByTile[`roguelike-chars/${tileName}`] || [];
        const tags = ["roguelike-chars", "character", "modular", "composite"];
        for (const u of usages) tags.push(u.project, u.entity_type, u.role || "", "used_in_project");

        charTiles.push({
          key: `char_${r}_${c}`,
          name: tileName,
          pack: "roguelike-chars",
          packName: "Roguelike Characters",
          col: c,
          row: r,
          w: 16,
          h: 16,
          sx: c * 17,
          sy: r * 17,
          imgSrc: `/api/sprite/kenney/roguelike-characters/Spritesheet/roguelikeChar_transparent.png`,
          resPath: `res://assets/kenney/roguelike-characters/Spritesheet/roguelikeChar_transparent.png`,
          isAtlasSlice: true,
          tags,
          usages,
        });
      }
    }
    packs["roguelike-chars"] = {
      id: "roguelike-chars",
      name: "Roguelike Characters",
      icon: "🧙",
      desc: "Modular character pieces (bodies, hair, beards, clothes, weapons) 54×12",
      tiles: charTiles,
    };

    // 13. Roguelike RPG (Atlas Slices 57 cols x 31 rows)
    const rpgTiles: TileItem[] = [];
    for (let r = 0; r < 31; r++) {
      for (let c = 0; c < 57; c++) {
        const tileName = `rpg_r${String(r).padStart(2, "0")}_c${String(c).padStart(2, "0")}`;
        const usages = usagesByTile[`roguelike-rpg/${tileName}`] || [];
        const tags = ["roguelike-rpg"];
        if (r < 5) tags.push("terrain", "dungeon", "wall");
        else if (r < 12) tags.push("nature", "tree", "plant", "rock");
        else if (r < 20) tags.push("item", "potion", "scroll", "chest", "key");
        else tags.push("equipment", "armor", "weapon");
        for (const u of usages) tags.push(u.project, u.entity_type, u.role || "", "used_in_project");

        rpgTiles.push({
          key: `rpg_${r}_${c}`,
          name: tileName,
          pack: "roguelike-rpg",
          packName: "Roguelike RPG",
          col: c,
          row: r,
          w: 16,
          h: 16,
          sx: c * 17,
          sy: r * 17,
          imgSrc: `/api/sprite/kenney/roguelike-rpg/Spritesheet/roguelikeSheet_transparent.png`,
          resPath: `res://assets/kenney/roguelike-rpg/Spritesheet/roguelikeSheet_transparent.png`,
          isAtlasSlice: true,
          tags,
          usages,
        });
      }
    }
    packs["roguelike-rpg"] = {
      id: "roguelike-rpg",
      name: "Roguelike RPG",
      icon: "🗡️",
      desc: "RPG Tiles, Dungeon & Items (57×31)",
      tiles: rpgTiles,
    };

    return NextResponse.json({
      packs,
      usages: usageData.usages || [],
      entities: usageData.entities || [],
      projects: usageData.projects || {},
    });
  } catch (error: any) {
    console.error("Error loading catalog:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
