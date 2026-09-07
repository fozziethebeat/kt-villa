"use client";

import React, { useState } from "react";
import { Search, Save, Download, Copy, Check, Filter } from "lucide-react";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onlyUsed: boolean;
  onToggleOnlyUsed: () => void;
  zoom: "sm" | "md" | "lg";
  onZoomChange: (z: "sm" | "md" | "lg") => void;
  onSave: () => Promise<boolean>;
  onExport: () => void;
  onCopy: () => void;
  saveStatus: "idle" | "saving" | "saved" | "error";
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onlyUsed,
  onToggleOnlyUsed,
  zoom,
  onZoomChange,
  onSave,
  onExport,
  onCopy,
  saveStatus,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyClick = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-[#12161f] border-b border-[rgba(255,255,255,0.08)] px-4 py-3 flex flex-col gap-3 shrink-0">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl shadow-lg shadow-primary/20">
            🏔️
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Sprite Catalog & Asset Manager
              <span className="text-[10px] uppercase font-mono tracking-wider bg-accent/20 text-accent border border-accent/30 px-2 py-0.5 rounded-full font-semibold">
                Godot 4.7
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive sprite explorer & asset re-mapping tool for Hakuba RPG
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, tag (yeti, character), or project..."
              className="w-full bg-[#181d28] border border-[rgba(255,255,255,0.1)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <button
            onClick={onToggleOnlyUsed}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              onlyUsed
                ? "bg-accent/20 border-accent/40 text-accent shadow-sm shadow-accent/20"
                : "bg-[#181d28] border-[rgba(255,255,255,0.1)] text-slate-400 hover:text-white"
            }`}
            title="Toggle showing only assets actively tagged in game projects"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Used Only</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-[#181d28] p-1 rounded-lg border border-[rgba(255,255,255,0.08)]">
          <span className="text-[11px] text-slate-400 px-2 font-medium">Zoom:</span>
          {(["sm", "md", "lg"] as const).map((z) => (
            <button
              key={z}
              onClick={() => onZoomChange(z)}
              className={`px-2 py-0.5 rounded text-xs capitalize transition-all font-medium ${
                zoom === z
                  ? "bg-primary text-white shadow-sm shadow-primary/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {z === "sm" ? "Small" : z === "md" ? "Med" : "Large"}
            </button>
          ))}
        </div>

        {/* Primary Save & Fallback Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={saveStatus === "saving"}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 transition-all text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-md shadow-emerald-500/20 border border-emerald-400/40 disabled:opacity-50"
            title="Save changes directly to tools/sprite_usage.json and sync Godot runtime assets (Cmd+S)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                saveStatus === "saved"
                  ? "bg-emerald-300 animate-ping"
                  : saveStatus === "saving"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-emerald-200"
              }`}
            />
            <Save className="w-3.5 h-3.5" />
            <span>
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                ? "✓ Saved & Synced!"
                : "Save to Project"}
            </span>
          </button>

          <button
            onClick={onExport}
            className="bg-[#181d28] hover:bg-[#202736] text-slate-300 hover:text-white border border-[rgba(255,255,255,0.1)] px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Download full sprite_usage.json file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          <button
            onClick={handleCopyClick}
            className="bg-[#181d28] hover:bg-[#202736] text-slate-300 hover:text-white border border-[rgba(255,255,255,0.1)] px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Copy sprite_usage.json to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied!" : "Copy JSON"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
