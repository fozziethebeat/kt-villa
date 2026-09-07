import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const parts = params.path;
  if (!parts || parts.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Base assets directory: games/godot-test/assets
  const baseAssetsDir = path.resolve(process.cwd(), "..", "..", "assets");
  
  // Sanitize path: remove any ".." or "." and strip leading "assets" if present
  const sanitized = parts.filter((p) => p !== ".." && p !== ".");
  const cleanParts = sanitized[0] === "assets" ? sanitized.slice(1) : sanitized;
  const filePath = path.join(baseAssetsDir, ...cleanParts);

  // Security check: ensure filePath is within baseAssetsDir
  if (!filePath.startsWith(baseAssetsDir)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    console.warn(`[SpriteAPI] Not found: ${filePath} (from parts: ${parts.join("/")})`);
    return new NextResponse("Image Not Found: " + parts.join("/"), { status: 404 });
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    return new NextResponse("Not a file", { status: 400 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
