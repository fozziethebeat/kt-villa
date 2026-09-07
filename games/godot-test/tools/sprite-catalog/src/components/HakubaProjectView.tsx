"use client";

import React from "react";
import { TileItem } from "@/lib/types";
import { TileCard } from "./TileCard";

interface HakubaProjectViewProps {
  items: TileItem[];
  selectedItem: TileItem | null;
  onSelectItem: (item: TileItem) => void;
  zoom: "sm" | "md" | "lg";
}

interface SubSectionDef {
  id: string;
  title: string;
  icon: string;
  desc: string;
  filter: (item: TileItem) => boolean;
}

export const HakubaProjectView: React.FC<HakubaProjectViewProps> = ({
  items,
  selectedItem,
  onSelectItem,
  zoom,
}) => {
  const sections: SubSectionDef[] = [
    {
      id: "characters",
      title: "Animated Character Sets",
      icon: "🎬",
      desc: "Living characters & enemies in Hakuba village with movement frames",
      filter: (item) => Boolean(item.isEntity && item.tags.includes("godot-test")),
    },
    {
      id: "items",
      title: "Collectible Items & Consumables",
      icon: "🍎",
      desc: "World pick-up items: Nagano Apple, Hakuba Ski Pass, Onsen Tea, Lucky Charm",
      filter: (item) =>
        item.tags.includes("item") || item.tags.includes("food") || item.categoryPill?.includes("Apple") || item.categoryPill?.includes("Tea") || item.categoryPill?.includes("Pass") || item.categoryPill?.includes("Charm") || false,
    },
    {
      id: "terrain",
      title: "Terrain & Ground Layers",
      icon: "❄️",
      desc: "Base ground surfaces: Plain snow, packed ski trail, village cobblestone, hot spring water",
      filter: (item) =>
        item.tags.includes("terrain") || item.categoryPill?.includes("Ground") || item.categoryPill?.includes("Path") || item.categoryPill?.includes("Water") || false,
    },
    {
      id: "structures",
      title: "Village Architecture & Buildings",
      icon: "🏡",
      desc: "Modular building blocks: Wooden roofs, timber walls, doorways, rustic fencing",
      filter: (item) =>
        item.tags.includes("structure") || item.categoryPill?.includes("Roof") || item.categoryPill?.includes("Wall") || item.categoryPill?.includes("Fence") || false,
    },
    {
      id: "nature",
      title: "Alpine Nature & Pine Trees",
      icon: "🌲",
      desc: "Winter pine trees (snow-dusted alpine pines and green mountain foothills)",
      filter: (item) =>
        item.tags.includes("nature") || item.categoryPill?.includes("Pine") || false,
    },
    {
      id: "presets",
      title: "Candidate Character Presets",
      icon: "✨",
      desc: "Pre-configured animated characters from other Kenney asset packs",
      filter: (item) => Boolean(item.isEntity && item.tags.includes("preset")),
    },
  ];

  const gridColsClass = {
    sm: "grid-cols-[repeat(auto-fill,minmax(80px,1fr))]",
    md: "grid-cols-[repeat(auto-fill,minmax(105px,1fr))]",
    lg: "grid-cols-[repeat(auto-fill,minmax(140px,1fr))]",
  }[zoom];

  return (
    <div className="p-5 flex flex-col gap-8">
      {sections.map((sec) => {
        const matchingItems = items.filter(sec.filter);
        if (matchingItems.length === 0) return null;

        return (
          <section key={sec.id} className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.08)] pb-2 gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{sec.icon}</span>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {sec.title}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-slate-400">
                  {matchingItems.length}
                </span>
              </div>
              <p className="text-xs text-slate-400">{sec.desc}</p>
            </div>

            <div className={`grid ${gridColsClass} gap-2.5`}>
              {matchingItems.map((item) => (
                <TileCard
                  key={item.key}
                  item={item}
                  isSelected={selectedItem?.key === item.key}
                  onSelect={onSelectItem}
                  zoom={zoom}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
