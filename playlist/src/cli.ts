import * as dotenv from "dotenv";
dotenv.config();

import { Command } from "commander";

import { fetchPlaylistTracks, getClientCredentialsToken } from "@/lib/spotify";
import prisma from "@/lib/prisma";

const program = new Command();

// Configure the CLI
program
  .name("playlist-cli")
  .description("CLI tools for the Playlist Journey app")
  .version("1.0.0");

program
  .command("generate-image")
  .description("Generate an image from prompt")
  .option("-p, --prompt <str>", "The text prompt")
  .option("-n, --name <str>", "The image name")
  .action(async (options) => {
    // Lazy-import to avoid crashing when GCS env vars aren't set
    const sharp = (await import("sharp")).default;
    const { imageGenerator } = await import("@/lib/generate");
    const url = await imageGenerator.generateImage(
      options.name,
      options.prompt
    );
    console.log(url);
  });

program
  .command("upload-image")
  .description("Upload an image to storage")
  .option("-i, --image <path>", "The path to a png image to upload")
  .option("-n, --name <string>", "The name of the image file")
  .action(async (options) => {
    // Lazy-import to avoid crashing when GCS env vars aren't set
    const sharp = (await import("sharp")).default;
    const { imageSaver } = await import("@/lib/storage");
    const buffer = await sharp(options.image).toFormat("png").toBuffer();
    const url = await imageSaver.uploadImage(buffer, options.name, "image/png");
    console.log(url);
  });

program
  .command("import-playlist")
  .description("Import songs from a Spotify playlist URL into the database (public playlists only)")
  .argument("<playlist-url>", "Spotify playlist URL, URI, or ID")
  .option("--dry-run", "Preview tracks without inserting into the database")
  .option("--skip-duplicates", "Skip songs that already exist (matched by title + artist)", true)
  .action(async (playlistUrl: string, options: { dryRun?: boolean; skipDuplicates?: boolean }) => {
    try {
      console.log("🎵 Fetching playlist from Spotify...\n");

      const token = await getClientCredentialsToken();
      const { name, tracks } = await fetchPlaylistTracks(playlistUrl, token);
      console.log(`📋 Playlist: "${name}"`);
      console.log(`   Found ${tracks.length} tracks\n`);

      if (tracks.length === 0) {
        console.log("No tracks found. Exiting.");
        return;
      }

      // Preview mode
      if (options.dryRun) {
        console.log("🔍 DRY RUN — tracks that would be imported:\n");
        tracks.forEach((track, i) => {
          console.log(`  ${String(i + 1).padStart(2)}. "${track.title}" — ${track.artist}`);
          if (track.albumArt) console.log(`      🖼️  ${track.albumArt}`);
          console.log(`      🔗 ${track.spotifyUrl}`);
        });
        console.log(`\nRun again without --dry-run to import.`);
        return;
      }

      // Get current max sort order
      const maxOrder = await prisma.song.aggregate({
        _max: { sortOrder: true },
      });
      let nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

      let created = 0;
      let skipped = 0;

      for (const track of tracks) {
        // Check for duplicates
        if (options.skipDuplicates) {
          const existing = await prisma.song.findFirst({
            where: {
              title: track.title,
              artist: track.artist,
            },
          });
          if (existing) {
            console.log(`  ⏭️  Skipped (exists): "${track.title}" — ${track.artist}`);
            skipped++;
            continue;
          }
        }

        await prisma.song.create({
          data: {
            title: track.title,
            artist: track.artist,
            albumArt: track.albumArt,
            spotifyUrl: track.spotifyUrl,
            sortOrder: nextOrder++,
          },
        });
        console.log(`  ✅ Added: "${track.title}" — ${track.artist}`);
        created++;
      }

      console.log(`\n✨ Import complete!`);
      console.log(`   ${created} songs added, ${skipped} skipped`);
    } catch (error) {
      console.error("\n❌ Error:", (error as Error).message);
      process.exit(1);
    }
  });

program.parse();
