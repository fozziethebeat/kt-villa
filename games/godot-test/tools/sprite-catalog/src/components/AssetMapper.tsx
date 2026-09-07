"use client";

import React, { useState } from "react";
import { TileItem, HakubaTarget } from "@/lib/types";
import { Sparkles, Check } from "lucide-react";

export const HAKUBA_TARGETS: HakubaTarget[] = [
  { id: "item_apple", name: "Nagano Apple (Food Snack)", type: "item", role: "Nagano Apple (Food Snack)", icon: "🍎", category: "Items" },
  { id: "item_skipass", name: "Hakuba Ski Pass (Key Item)", type: "item", role: "Hakuba Ski Pass (Key Item)", icon: "🎫", category: "Items" },
  { id: "item_tea", name: "Hot Onsen Tea (Thermal Beverage)", type: "item", role: "Hot Onsen Tea (Thermal Beverage)", icon: "🍵", category: "Items" },
  { id: "item_charm", name: "Lucky Shrine Charm (Talisman)", type: "item", role: "Lucky Shrine Charm (Talisman)", icon: "⛩️", category: "Items" },

  { id: "terrain_snow", name: "Plain Snow Ground (SRC_SKI 0,0)", type: "terrain", role: "Plain Snow Ground (SRC_SKI 0,0)", icon: "❄️", category: "Terrain", sourceId: 0 },
  { id: "terrain_trail", name: "Snow Ski Trail (SRC_SKI 1,1)", type: "terrain", role: "Snow Trail / Ski Path (SRC_SKI 1,1)", icon: "🎿", category: "Terrain", sourceId: 0 },
  { id: "terrain_stone", name: "Cobblestone Path (SRC_TOWN 1,0)", type: "terrain", role: "Cobblestone Path (SRC_TOWN 1,0)", icon: "🪨", category: "Terrain", sourceId: 1 },
  { id: "terrain_water", name: "Hot Spring Water (SRC_TOWN 3,1)", type: "terrain", role: "Hot Spring / Onsen Water (SRC_TOWN 3,1)", icon: "♨️", category: "Terrain", sourceId: 1 },

  { id: "struct_roof_l", name: "Wooden Roof Left (SRC_TOWN 0,2)", type: "structure", role: "Wooden Roof Left (SRC_TOWN 0,2)", icon: "🏠", category: "Buildings", sourceId: 1 },
  { id: "struct_roof_m", name: "Wooden Roof Center (SRC_TOWN 1,2)", type: "structure", role: "Wooden Roof Center (SRC_TOWN 1,2)", icon: "🏠", category: "Buildings", sourceId: 1 },
  { id: "struct_roof_r", name: "Wooden Roof Right (SRC_TOWN 2,2)", type: "structure", role: "Wooden Roof Right (SRC_TOWN 2,2)", icon: "🏠", category: "Buildings", sourceId: 1 },
  { id: "struct_wall_l", name: "Wooden Wall Left (SRC_TOWN 0,3)", type: "structure", role: "Wooden Wall Left (SRC_TOWN 0,3)", icon: "🪵", category: "Buildings", sourceId: 1 },
  { id: "struct_wall_d", name: "Wooden Wall Door (SRC_TOWN 1,3)", type: "structure", role: "Wooden Wall Door (SRC_TOWN 1,3)", icon: "🚪", category: "Buildings", sourceId: 1 },
  { id: "struct_wall_r", name: "Wooden Wall Right (SRC_TOWN 2,3)", type: "structure", role: "Wooden Wall Right (SRC_TOWN 2,3)", icon: "🪵", category: "Buildings", sourceId: 1 },
  { id: "struct_fence", name: "Wooden Fence (SRC_TOWN 0,5)", type: "structure", role: "Wooden Fence (SRC_TOWN 0,5)", icon: "🚧", category: "Buildings", sourceId: 1 },

  { id: "nature_snow_pine", name: "Snow Pine Tree (SRC_SKI 1,3)", type: "nature", role: "Snow Pine Tree (SRC_SKI 1,3)", icon: "🌲", category: "Nature", sourceId: 0 },
  { id: "nature_green_pine", name: "Green Pine Tree (SRC_TOWN 0,4)", type: "nature", role: "Green Pine Tree (SRC_TOWN 0,4)", icon: "🌳", category: "Nature", sourceId: 1 },

  { id: "char_player_idle", name: "Player Explorer (Idle)", type: "character", role: "Player Explorer (Idle)", icon: "🚶", category: "Characters" },
  { id: "char_player_walk", name: "Player Explorer (Walk)", type: "character", role: "Player Explorer (Walk)", icon: "🏃", category: "Characters" },
  { id: "char_yeti_0", name: "Yeti (Walk Left)", type: "character", role: "Mountain Forest Yeti (Walk Left)", icon: "🐾", category: "Characters" },
  { id: "char_yeti_1", name: "Yeti (Front Stance)", type: "character", role: "Mountain Forest Yeti (Front Stance)", icon: "🐾", category: "Characters" },
  { id: "char_yeti_2", name: "Yeti (Walk Right)", type: "character", role: "Mountain Forest Yeti (Walk Right)", icon: "🐾", category: "Characters" },
];

interface AssetMapperProps {
  selectedItem: TileItem;
  onMapToTarget: (item: TileItem, target: HakubaTarget) => void;
}

export const AssetMapper: React.FC<AssetMapperProps> = ({
  selectedItem,
  onMapToTarget,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>("item_apple");
  const [mappedSuccess, setMappedSuccess] = useState(false);

  const selectedTarget = HAKUBA_TARGETS.find((t) => t.id === selectedTargetId) || HAKUBA_TARGETS[0];

  const handleMapClick = () => {
    onMapToTarget(selectedItem, selectedTarget);
    setMappedSuccess(true);
    setTimeout(() => setMappedSuccess(false), 2000);
  };

  const categories = ["Items", "Terrain", "Buildings", "Nature", "Characters"];

  return (
    <div className="bg-[#181d28] border border-primary/30 rounded-xl p-3 flex flex-col gap-2.5 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Map to Hakuba RPG</span>
        </h4>
        <span className="text-[10px] text-slate-400 font-mono">1-Click Spot Fix</span>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Assign this tile (<b>{selectedItem.pack}/{selectedItem.name}</b>) to replace an active Hakuba game asset:
      </p>

      <div className="flex flex-col gap-2">
        <select
          value={selectedTargetId}
          onChange={(e) => setSelectedTargetId(e.target.value)}
          className="w-full bg-[#12161f] border border-[rgba(255,255,255,0.15)] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary font-medium"
        >
          {categories.map((cat) => (
            <optgroup key={cat} label={`── ${cat} ──`}>
              {HAKUBA_TARGETS.filter((t) => t.category === cat).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <button
          onClick={handleMapClick}
          className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
            mappedSuccess
              ? "bg-accent text-slate-950 shadow-accent/20"
              : "bg-primary hover:bg-primary/90 text-white shadow-primary/20 active:scale-98"
          }`}
        >
          {mappedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Mapped to {selectedTarget.name.split(" ")[0]}!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Map to {selectedTarget.name.split(" ")[0]}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
