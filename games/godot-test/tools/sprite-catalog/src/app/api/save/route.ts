import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const gameDir = path.resolve(process.cwd(), "..", "..");
    const usagePath = path.join(gameDir, "tools", "sprite_usage.json");
    const syncScript = path.join(gameDir, "tools", "sync_game_assets.py");

    // Write to sprite_usage.json
    fs.writeFileSync(usagePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`[Next.js Save API] Wrote updated data to ${usagePath}`);

    // Trigger sync_game_assets.py to copy sprites for Godot
    let syncOutput = "";
    if (fs.existsSync(syncScript)) {
      try {
        const { stdout } = await execPromise(`python3 "${syncScript}"`, { cwd: gameDir });
        syncOutput = stdout;
        console.log(`[Next.js Save API] Sync Output:\n${syncOutput.trim()}`);
      } catch (err: any) {
        console.warn(`[Next.js Save API] Asset sync script error:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully saved to tools/sprite_usage.json and synced game assets!",
      details: syncOutput.trim(),
    });
  } catch (error: any) {
    console.error("[Next.js Save API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
