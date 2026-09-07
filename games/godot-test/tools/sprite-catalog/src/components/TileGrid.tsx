"use client";

import React from "react";
import { TileItem } from "@/lib/types";
import { TileCard } from "./TileCard";

interface TileGridProps {
  tiles: TileItem[];
  selectedItem: TileItem | null;
  onSelectItem: (item: TileItem) => void;
  zoom: "sm" | "md" | "lg";
}

export const TileGrid: React.FC<TileGridProps> = ({
  tiles,
  selectedItem,
  onSelectItem,
  zoom,
}) => {
  if (tiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500 text-sm">
        <p>No sprites found matching the current query or filter.</p>
      </div>
    );
  }

  const gridColsClass = {
    sm: "grid-cols-[repeat(auto-fill,minmax(80px,1fr))]",
    md: "grid-cols-[repeat(auto-fill,minmax(105px,1fr))]",
    lg: "grid-cols-[repeat(auto-fill,minmax(140px,1fr))]",
  }[zoom];

  return (
    <div className={`grid ${gridColsClass} gap-2.5 p-4`}>
      {tiles.map((tile) => (
        <TileCard
          key={tile.key}
          item={tile}
          isSelected={selectedItem?.key === tile.key}
          onSelect={onSelectItem}
          zoom={zoom}
        />
      ))}
    </div>
  );
};
