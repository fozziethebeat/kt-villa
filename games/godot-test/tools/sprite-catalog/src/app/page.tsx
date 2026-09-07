"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { CatalogData, TileItem, HakubaTarget, TileUsage, Entity } from "@/lib/types";
import { Header } from "@/components/Header";
import { TabNav } from "@/components/TabNav";
import { TileGrid } from "@/components/TileGrid";
import { HakubaProjectView } from "@/components/HakubaProjectView";
import { InspectorSidebar } from "@/components/InspectorSidebar";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [catalog, setCatalog] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("hakuba-rpg");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyUsed, setOnlyUsed] = useState(false);
  const [zoom, setZoom] = useState<"sm" | "md" | "lg">("md");
  const [selectedItem, setSelectedItem] = useState<TileItem | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch catalog on boot
  useEffect(() => {
    fetch("/api/catalog")
      .then((res) => res.json())
      .then((data: CatalogData) => {
        setCatalog(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load catalog:", err);
        setLoading(false);
        showToast("Error loading sprite catalog: " + err.message);
      });
  }, []);

  // Keyboard shortcuts (Cmd/Ctrl + S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [catalog]);

function formatSpriteUrl(raw?: string): string {
  if (!raw) return "";
  if (raw.startsWith("/api/sprite/")) return raw;
  let clean = raw.replace(/^(\.\.\/)+/, "").replace(/^res:\/\//, "");
  if (clean.startsWith("assets/")) clean = clean.substring(7);
  return `/api/sprite/${clean}`;
}

  // Construct synthetic Hakuba RPG items list
  const hakubaItems = useMemo<TileItem[]>(() => {
    if (!catalog) return [];
    const items: TileItem[] = [];

    // 1. Entities (Characters)
    for (const ent of catalog.entities) {
      const isHakuba = ent.project === "godot-test";
      const previewSrc = formatSpriteUrl(ent.preview_img) || formatSpriteUrl(ent.frames?.[0]?.imgSrc);

      const frames = (ent.frames || []).map((f) => ({
        ...f,
        imgSrc: formatSpriteUrl(f.imgSrc),
      }));

      items.push({
        key: `ent_${ent.id}`,
        name: ent.name,
        pack: ent.project === "preset" ? "preset" : "hakuba-rpg",
        packName: isHakuba ? "Hakuba RPG Entity" : "Candidate Preset",
        imgSrc: previewSrc || frames[0]?.imgSrc || "",
        resPath: ent.frames?.[0]?.resPath || previewSrc,
        isEntity: true,
        fps: ent.fps || 4,
        frames,
        components: ent.components,
        tags: [ent.project, ent.entity_type, ent.name.toLowerCase(), "character"],
        usages: [
          {
            pack: "godot-test",
            tile_name: ent.id,
            project: ent.project,
            entity_type: ent.entity_type,
            role: ent.name,
            notes: ent.notes,
          },
        ],
      });
    }

    // 2. Usages (Items, Terrain, Structures, Nature)
    for (const u of catalog.usages) {
      if (u.project !== "godot-test") continue;
      if (u.entity_type === "character") continue;

      const packObj = catalog.packs[u.pack];
      const matchingTile = packObj?.tiles.find((t) => t.name === u.tile_name);

      let imgSrc = matchingTile?.imgSrc || "";
      let resPath = matchingTile?.resPath || "";
      let isAtlas = matchingTile?.isAtlasSlice;
      let sx = matchingTile?.sx;
      let sy = matchingTile?.sy;
      let col = matchingTile?.col;
      let row = matchingTile?.row;

      // Extract coords from role e.g. (SRC_SKI 1,3)
      const coordMatch = u.role?.match(/\(SRC_[A-Z]+\s+(\d+),(\d+)\)/);
      if (coordMatch) {
        col = parseInt(coordMatch[1], 10);
        row = parseInt(coordMatch[2], 10);
      }
      let sourceId = u.role?.includes("SRC_SKI") ? 0 : 1;

      items.push({
        key: `hakuba_${u.pack}_${u.tile_name}`,
        name: u.role || u.tile_name,
        pack: "hakuba-rpg",
        packName: "Hakuba RPG",
        col,
        row,
        sx,
        sy,
        sourceId,
        sourcePack: u.pack,
        sourceTile: u.tile_name,
        imgSrc: imgSrc || `/api/sprite/kenney/${u.pack}/Tiles/${u.tile_name}.png`,
        resPath: resPath || `res://assets/kenney/${u.pack}/Tiles/${u.tile_name}.png`,
        isAtlasSlice: isAtlas,
        categoryPill: u.role?.split("(")[0].trim(),
        tags: ["godot-test", u.entity_type, u.role || "", u.pack, u.tile_name],
        usages: [u],
      });
    }

    return items;
  }, [catalog]);

  // Set default selected item
  useEffect(() => {
    if (!selectedItem && hakubaItems.length > 0) {
      setSelectedItem(hakubaItems[0]);
    }
  }, [hakubaItems, selectedItem]);

  // Handle direct save
  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!catalog) return false;
    setSaveStatus("saving");
    try {
      const payload = {
        projects: catalog.projects,
        entities: catalog.entities,
        usages: catalog.usages,
      };

      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("HTTP " + res.status);
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      setSaveStatus("saved");
      showToast("💾 Saved directly to tools/sprite_usage.json and synced assets!");
      setTimeout(() => setSaveStatus("idle"), 2500);
      return true;
    } catch (err: any) {
      console.error("Save error:", err);
      setSaveStatus("error");
      showToast("⚠️ Save failed: " + err.message);
      setTimeout(() => setSaveStatus("idle"), 3000);
      return false;
    }
  }, [catalog]);

  // Handle visual re-mapping
  const handleMapToTarget = useCallback(
    (item: TileItem, target: HakubaTarget) => {
      if (!catalog) return;

      const updatedUsages = [...catalog.usages];

      // If target matches an existing item/terrain/structure usage
      const existingIdx = updatedUsages.findIndex((u) => {
        if (target.type === "item") {
          const targetKey = target.name.toLowerCase().split(" ")[0];
          return u.entity_type === "item" && u.role?.toLowerCase().includes(targetKey);
        }
        return u.role === target.role;
      });

      const newUsage: TileUsage = {
        pack: item.pack,
        tile_name: item.name,
        project: "godot-test",
        entity_type: target.type,
        role: target.role,
        notes: target.notes || `Mapped to ${target.name}`,
      };

      if (existingIdx !== -1) {
        updatedUsages[existingIdx] = newUsage;
      } else {
        updatedUsages.push(newUsage);
      }

      const updatedCatalog = {
        ...catalog,
        usages: updatedUsages,
      };

      setCatalog(updatedCatalog);
      showToast(`🎉 Mapped ${item.pack}/${item.name} to ${target.name}!`);

      // Automatically trigger direct save in background
      setTimeout(() => {
        handleSave();
      }, 100);
    },
    [catalog, handleSave]
  );

  // Jump to source pack & tile
  const handleJumpToSource = (pack: string, tileName: string) => {
    if (!catalog?.packs[pack]) return;
    setCurrentTab(pack);
    const targetTile = catalog.packs[pack].tiles.find((t) => t.name === tileName);
    if (targetTile) {
      setSelectedItem(targetTile);
    }
  };

  // Export JSON file download
  const handleExport = () => {
    if (!catalog) return;
    const payload = {
      projects: catalog.projects,
      entities: catalog.entities,
      usages: catalog.usages,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sprite_usage.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Downloaded updated sprite_usage.json!");
  };

  // Copy JSON to clipboard
  const handleCopy = () => {
    if (!catalog) return;
    const payload = {
      projects: catalog.projects,
      entities: catalog.entities,
      usages: catalog.usages,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    showToast("Copied sprite_usage.json to clipboard!");
  };

  // Active items based on current tab & filters
  const visibleItems = useMemo<TileItem[]>(() => {
    if (!catalog) return [];
    let items: TileItem[] = [];

    if (currentTab === "hakuba-rpg") {
      items = hakubaItems;
    } else {
      items = catalog.packs[currentTab]?.tiles || [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (it) =>
          it.name.toLowerCase().includes(q) ||
          it.pack.toLowerCase().includes(q) ||
          it.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (onlyUsed) {
      items = items.filter(
        (it) =>
          (it.usages && it.usages.length > 0) ||
          (it.isEntity && it.tags.includes("godot-test"))
      );
    }

    return items;
  }, [catalog, currentTab, hakubaItems, searchQuery, onlyUsed]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0c0e14] text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-slate-400 font-mono">Loading Sprite Catalog & Assets...</p>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0c0e14] text-white gap-3">
        <p className="text-sm text-red-400">Failed to load catalog.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0c0e14]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#151d29] border border-accent/40 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Toolbar */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onlyUsed={onlyUsed}
        onToggleOnlyUsed={() => setOnlyUsed(!onlyUsed)}
        zoom={zoom}
        onZoomChange={setZoom}
        onSave={handleSave}
        onExport={handleExport}
        onCopy={handleCopy}
        saveStatus={saveStatus}
      />

      {/* Navigation Tabs */}
      <TabNav
        packs={catalog.packs}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        hakubaItemCount={hakubaItems.length}
      />

      {/* Main Content Area + Inspector */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {currentTab === "hakuba-rpg" && !searchQuery.trim() && !onlyUsed ? (
            <HakubaProjectView
              items={visibleItems}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
              zoom={zoom}
            />
          ) : (
            <TileGrid
              tiles={visibleItems}
              selectedItem={selectedItem}
              onSelectItem={setSelectedItem}
              zoom={zoom}
            />
          )}
        </main>

        {/* Right Sidebar Inspector */}
        <InspectorSidebar
          item={selectedItem}
          onMapToTarget={handleMapToTarget}
          onJumpToSource={handleJumpToSource}
        />
      </div>
    </div>
  );
}
