"use client";

import React, { useState, useEffect, useRef } from "react";
import { TileItem, HakubaTarget } from "@/lib/types";
import { AssetMapper } from "./AssetMapper";
import {
  Play,
  Pause,
  Copy,
  Check,
  ExternalLink,
  Code,
  Tag,
  Info,
} from "lucide-react";
import {
  getGdScriptPreload,
  getGdScriptVector,
  getGdScriptSetCell,
  getEntityAnimationCode,
} from "@/lib/godot-helpers";

interface InspectorSidebarProps {
  item: TileItem | null;
  onMapToTarget: (item: TileItem, target: HakubaTarget) => void;
  onJumpToSource: (pack: string, tileName: string) => void;
}

export const InspectorSidebar: React.FC<InspectorSidebarProps> = ({
  item,
  onMapToTarget,
  onJumpToSource,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [fps, setFps] = useState(item?.fps || 4);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Update FPS when selected item changes
  useEffect(() => {
    if (item?.fps) {
      setFps(item.fps);
    }
    setCurrentFrameIdx(0);
  }, [item]);

  // Magnifier Canvas rendering
  useEffect(() => {
    if (!item || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imgSrc = item.frames && item.frames.length > 0
      ? item.frames[currentFrameIdx]?.imgSrc || item.imgSrc
      : item.imgSrc;

    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (item.isAtlasSlice) {
        ctx.drawImage(
          img,
          item.sx || 0,
          item.sy || 0,
          item.w || 16,
          item.h || 16,
          0,
          0,
          canvas.width,
          canvas.height
        );
      } else {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
  }, [item, currentFrameIdx]);

  // Animation playback loop
  useEffect(() => {
    if (!item?.frames || item.frames.length <= 1 || !isPlaying) return;
    const intervalMs = 1000 / (fps || 4);
    const timer = setInterval(() => {
      setCurrentFrameIdx((prev) => (prev + 1) % item.frames!.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [item, isPlaying, fps]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  if (!item) {
    return (
      <aside className="w-80 bg-[#12161f] border-l border-[rgba(255,255,255,0.08)] p-6 flex flex-col items-center justify-center text-slate-500 text-xs shrink-0">
        <Info className="w-8 h-8 mb-2 opacity-50" />
        <p>Select any sprite or entity to inspect details</p>
      </aside>
    );
  }

  const isEntity = Boolean(item.isEntity || (item.frames && item.frames.length > 0));

  return (
    <aside className="w-96 bg-[#12161f] border-l border-[rgba(255,255,255,0.08)] flex flex-col h-full shrink-0 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[rgba(255,255,255,0.08)] bg-[#151a24]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono">
            {item.packName || item.pack}
          </span>
          {item.sourceId !== undefined && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-black/40 text-slate-300 font-mono">
              TileSet SRC: {item.sourceId}
            </span>
          )}
        </div>
        <h2 className="text-base font-bold text-white truncate mt-1">
          {item.name}
        </h2>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Large 128x128 Pixel Magnifier */}
        <div className="flex flex-col items-center justify-center p-4 bg-[#161b26] rounded-xl border border-[rgba(255,255,255,0.08)]">
          <div className="w-32 h-32 checkerboard rounded-lg flex items-center justify-center border border-[rgba(255,255,255,0.1)] shadow-inner overflow-hidden">
            <canvas
              ref={canvasRef}
              width={128}
              height={128}
              className="w-full h-full pixelated"
            />
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-2">
            128×128 (8× Pixel Scale)
          </p>
        </div>

        {/* Source Pack Jump Link */}
        {item.sourcePack && (
          <button
            onClick={() => onJumpToSource(item.sourcePack!, item.sourceTile || "")}
            className="w-full py-1.5 px-3 rounded-lg bg-[#181d28] hover:bg-[#202738] border border-[rgba(255,255,255,0.1)] text-xs text-primary font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Browse in {item.sourcePack}</span>
          </button>
        )}

        {/* Animation Sequence & Controls (If Entity) */}
        {isEntity && item.frames && item.frames.length > 0 && (
          <div className="flex flex-col gap-3 bg-[#161b26] p-3.5 rounded-xl border border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🎬 Animation Controls</span>
              </h4>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-2 py-1 rounded bg-[#181d28] hover:bg-[#222a3a] border border-[rgba(255,255,255,0.1)] text-[11px] font-bold text-slate-200 flex items-center gap-1"
              >
                {isPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>
            </div>

            {/* Speed Slider */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">Speed:</span>
              <input
                type="range"
                min="1"
                max="14"
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="flex-1 accent-primary h-1.5 bg-[#12161f] rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-accent w-10 text-right">
                {fps} FPS
              </span>
            </div>

            {/* Frame Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 scrollbar-none">
              {/* Dedicated Live Motion Cell */}
              <div
                className="flex flex-col items-center p-1.5 rounded-lg border border-primary/50 bg-primary/10 shrink-0 shadow-sm shadow-primary/20"
                title="Live Motion Preview"
              >
                <div className="w-9 h-9 checkerboard rounded flex items-center justify-center overflow-hidden border border-primary/30">
                  <img
                    src={item.frames[currentFrameIdx]?.imgSrc || item.imgSrc}
                    alt="Motion Preview"
                    className="w-7 h-7 pixelated object-contain"
                  />
                </div>
                <span className="text-[9px] font-mono text-primary font-bold mt-1">
                  Motion
                </span>
              </div>

              <div className="h-8 w-px bg-[rgba(255,255,255,0.1)] mx-0.5 shrink-0" />

              {/* Individual Stills with Stepping Highlight */}
              {item.frames.map((frame, idx) => {
                const isActive = currentFrameIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setCurrentFrameIdx(idx)}
                    className={`flex flex-col items-center p-1.5 rounded-lg border cursor-pointer transition-all shrink-0 ${
                      isActive
                        ? "bg-accent/20 border-accent shadow-sm shadow-accent/20 scale-105"
                        : "bg-[#12161f] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.2)]"
                    }`}
                    title={frame.name || `Frame ${idx + 1}`}
                  >
                    <div className="w-9 h-9 checkerboard rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={frame.imgSrc}
                        alt={frame.name}
                        className="w-7 h-7 pixelated object-contain"
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 mt-1">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Re-Mapping Tool for Non-Entity Tiles */}
        {!isEntity && (
          <AssetMapper
            selectedItem={item}
            onMapToTarget={onMapToTarget}
          />
        )}

        {/* Metadata Details */}
        <div className="flex flex-col gap-2 bg-[#161b26] p-3.5 rounded-xl border border-[rgba(255,255,255,0.08)]">
          <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-primary" />
            <span>Sprite Info</span>
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#12161f] p-2 rounded-lg border border-[rgba(255,255,255,0.04)]">
              <span className="text-[10px] text-slate-500 block">Atlas Coords</span>
              <span className="font-mono text-slate-200">
                {item.col !== undefined && item.row !== undefined ? `Vector2i(${item.col}, ${item.row})` : "Standalone"}
              </span>
            </div>
            <div className="bg-[#12161f] p-2 rounded-lg border border-[rgba(255,255,255,0.04)]">
              <span className="text-[10px] text-slate-500 block">Dimensions</span>
              <span className="font-mono text-slate-200">
                {item.w || 16}×{item.h || 16} px
              </span>
            </div>
          </div>

          <div className="bg-[#12161f] p-2 rounded-lg border border-[rgba(255,255,255,0.04)] text-xs">
            <span className="text-[10px] text-slate-500 block">Resource Path</span>
            <span className="font-mono text-[11px] text-slate-300 break-all select-all">
              {item.resPath}
            </span>
          </div>

          {item.usages && item.usages.length > 0 && (
            <div className="bg-[#12161f] p-2 rounded-lg border border-emerald-500/20 text-xs">
              <span className="text-[10px] text-emerald-400 font-bold block mb-1">
                Project Usages ({item.usages.length})
              </span>
              {item.usages.map((u, i) => (
                <div key={i} className="mb-1 last:mb-0">
                  <span className="font-semibold text-white">{u.role || u.entity_type}</span>
                  {u.notes && <p className="text-[10px] text-slate-400">{u.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 1-Click GDScript Code Generators */}
        <div className="flex flex-col gap-2 bg-[#161b26] p-3.5 rounded-xl border border-[rgba(255,255,255,0.08)]">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-accent" />
            <span>Godot 4 Code Generators</span>
          </h4>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => copyToClipboard(item.resPath, "resPath")}
              className="w-full py-1.5 px-2.5 rounded bg-[#12161f] hover:bg-[#1b2230] border border-[rgba(255,255,255,0.08)] text-left text-xs text-slate-300 flex items-center justify-between group"
            >
              <span className="truncate">📋 Copy Resource Path</span>
              {copiedKey === "resPath" ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />}
            </button>

            <button
              onClick={() => copyToClipboard(getGdScriptPreload(item), "preload")}
              className="w-full py-1.5 px-2.5 rounded bg-[#12161f] hover:bg-[#1b2230] border border-[rgba(255,255,255,0.08)] text-left text-xs text-slate-300 flex items-center justify-between group"
            >
              <span className="truncate">📋 Copy preload(...)</span>
              {copiedKey === "preload" ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />}
            </button>

            {item.col !== undefined && item.row !== undefined && (
              <>
                <button
                  onClick={() => copyToClipboard(getGdScriptVector(item), "vector")}
                  className="w-full py-1.5 px-2.5 rounded bg-[#12161f] hover:bg-[#1b2230] border border-[rgba(255,255,255,0.08)] text-left text-xs text-slate-300 flex items-center justify-between group"
                >
                  <span className="truncate">📋 Copy Vector2i({item.col}, {item.row})</span>
                  {copiedKey === "vector" ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />}
                </button>

                <button
                  onClick={() => copyToClipboard(getGdScriptSetCell(item), "setcell")}
                  className="w-full py-1.5 px-2.5 rounded bg-[#12161f] hover:bg-[#1b2230] border border-[rgba(255,255,255,0.08)] text-left text-xs text-slate-300 flex items-center justify-between group"
                >
                  <span className="truncate">📋 Copy set_cell(...)</span>
                  {copiedKey === "setcell" ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />}
                </button>
              </>
            )}

            {isEntity && (
              <button
                onClick={() => copyToClipboard(getEntityAnimationCode(item), "animCode")}
                className="w-full py-1.5 px-2.5 rounded bg-[#12161f] hover:bg-[#1b2230] border border-[rgba(255,255,255,0.08)] text-left text-xs text-slate-300 flex items-center justify-between group"
              >
                <span className="truncate">📋 Copy Frames Array</span>
                {copiedKey === "animCode" ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
