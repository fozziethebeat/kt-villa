"use client";

import React, { useRef, useEffect } from "react";
import { TileItem } from "@/lib/types";

interface TileCardProps {
  item: TileItem;
  isSelected: boolean;
  onSelect: (item: TileItem) => void;
  zoom: "sm" | "md" | "lg";
}

export const TileCard: React.FC<TileCardProps> = ({
  item,
  isSelected,
  onSelect,
  zoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render atlas slice if applicable
  useEffect(() => {
    if (!item.isAtlasSlice || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = item.imgSrc;
    img.onload = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    };
  }, [item]);

  const sizeClasses = {
    sm: {
      wrap: "w-11 h-11",
      inner: "w-7 h-7",
      fontSize: "text-[10px]",
    },
    md: {
      wrap: "w-14 h-14",
      inner: "w-9 h-9",
      fontSize: "text-xs",
    },
    lg: {
      wrap: "w-20 h-20",
      inner: "w-14 h-14",
      fontSize: "text-xs",
    },
  }[zoom];

  const hasUsage = (item.usages && item.usages.length > 0) || (item.isEntity && item.tags.includes("godot-test"));
  const primaryUsage = item.usages?.[0];

  return (
    <div
      onClick={() => onSelect(item)}
      className={`relative group flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer transition-all border select-none ${
        isSelected
          ? "bg-[#182333] border-primary shadow-lg shadow-primary/20 scale-[1.02]"
          : "bg-[#141824] hover:bg-[#192030] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]"
      }`}
    >
      {/* Category or Usage Pill */}
      {item.categoryPill && (
        <span className="absolute top-1 left-1 bg-black/80 border border-accent/40 text-accent font-bold text-[9px] px-1.5 py-0.2 rounded font-mono pointer-events-none z-10">
          {item.categoryPill}
        </span>
      )}
      {item.isEntity ? (
        <span className="absolute top-1 right-1 bg-amber-950/80 border border-amber-400/40 text-amber-300 font-bold text-[9px] px-1.5 py-0.2 rounded font-mono pointer-events-none z-10 flex items-center gap-0.5">
          <span>🎬</span> ANIM
        </span>
      ) : (
        !item.categoryPill && hasUsage && (
          <span className="absolute top-1 right-1 bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 font-bold text-[9px] px-1.5 py-0.2 rounded font-mono pointer-events-none z-10">
            {primaryUsage?.entity_type || "USED"}
          </span>
        )
      )}

      {/* Image Preview Container */}
      <div
        className={`${sizeClasses.wrap} checkerboard rounded-lg flex items-center justify-center overflow-hidden border border-[rgba(255,255,255,0.06)] mb-1.5`}
      >
        {item.isAtlasSlice ? (
          <canvas
            ref={canvasRef}
            width={16}
            height={16}
            className={`${sizeClasses.inner} pixelated`}
          />
        ) : (
          <img
            src={item.imgSrc || item.frames?.[0]?.imgSrc || ""}
            alt={item.name}
            className={`${sizeClasses.inner} pixelated object-contain`}
            loading="lazy"
          />
        )}
      </div>

      {/* Tile ID / Name */}
      <div className="w-full text-center overflow-hidden px-1">
        <p
          className={`${sizeClasses.fontSize} font-bold text-slate-200 truncate group-hover:text-primary transition-colors`}
        >
          {item.name}
        </p>
        {item.col !== undefined && item.row !== undefined && (
          <p className="text-[10px] text-slate-500 font-mono">
            {item.col},{item.row}
          </p>
        )}
      </div>
    </div>
  );
};
