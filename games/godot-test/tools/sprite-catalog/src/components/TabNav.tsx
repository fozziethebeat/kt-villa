"use client";

import React from "react";
import { PackData } from "@/lib/types";

interface TabNavProps {
  packs: Record<string, PackData>;
  currentTab: string;
  onSelectTab: (id: string) => void;
  hakubaItemCount: number;
}

export const TabNav: React.FC<TabNavProps> = ({
  packs,
  currentTab,
  onSelectTab,
  hakubaItemCount,
}) => {
  return (
    <nav className="bg-[#12161f] border-b border-[rgba(255,255,255,0.08)] px-4 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none py-2">
      {/* Featured Primary Project Tab */}
      <button
        onClick={() => onSelectTab("hakuba-rpg")}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all border shrink-0 ${
          currentTab === "hakuba-rpg"
            ? "bg-emerald-950/80 border-accent text-accent shadow-md shadow-accent/20"
            : "bg-[#181d28] border-emerald-500/30 text-emerald-400 hover:border-accent hover:text-white"
        }`}
      >
        <span>🏔️ Hakuba RPG</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/40 text-emerald-300">
          {hakubaItemCount}
        </span>
      </button>

      <div className="w-px h-5 bg-[rgba(255,255,255,0.1)] mx-1 shrink-0" />

      {/* Individual Kenney Packs */}
      {Object.values(packs).map((pack) => {
        const isActive = currentTab === pack.id;
        return (
          <button
            key={pack.id}
            onClick={() => onSelectTab(pack.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all border shrink-0 ${
              isActive
                ? "bg-primary border-primary text-white shadow-sm shadow-primary/30"
                : "bg-[#181d28] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.15)]"
            }`}
          >
            <span>{pack.icon}</span>
            <span>{pack.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/30 text-slate-400">
              {pack.tiles.length}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
