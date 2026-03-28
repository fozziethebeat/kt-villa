import { PrismaClient, Prisma } from "../src/lib/generated/prisma";

const prisma = new PrismaClient();

const users: Prisma.UserCreateInput[] = [
  {
    name: "Keith",
    email: process.env.ADMIN_EMAIL || "",
    roles: "admin",
  },
  {
    name: "Taiyou",
    email: process.env.TEST_USER_EMAIL || "",
  },
];

const magicCodes: Prisma.MagicCodeCreateInput[] = [
  {
    id: "testcode",
  },
];

interface SongSeed {
  title: string;
  artist: string;
  albumArt?: string;
  spotifyUrl?: string;
  sortOrder: number;
  journeyEntry?: {
    memory: string;
    mood?: string;
  };
}

const songs: SongSeed[] = [
  {
    title: "First Day of My Life",
    artist: "Bright Eyes",
    spotifyUrl: "https://open.spotify.com/track/1TOCeLCH0dWkbmFSbkPsLi",
    sortOrder: 1,
    journeyEntry: {
      memory:
        "I remember the first time we danced to this in the kitchen, barefoot on the tile floor. The pasta was boiling over and neither of us cared.",
      mood: "tender",
    },
  },
  {
    title: "Lover",
    artist: "Taylor Swift",
    spotifyUrl: "https://open.spotify.com/track/1dGr1c8CrMLDpV6mPbImSI",
    sortOrder: 2,
    journeyEntry: {
      memory:
        "This was playing on the radio during our road trip to the coast. You sang every word while I tried to keep my eyes on the road.",
      mood: "joyful",
    },
  },
  {
    title: "Sunday Morning",
    artist: "Maroon 5",
    spotifyUrl: "https://open.spotify.com/track/0SFJQqnU0k42MoSBbYmnOy",
    sortOrder: 3,
    journeyEntry: {
      memory:
        "Our lazy Sunday mornings together — coffee, sunlight through the window, nowhere to be. This song always brings me back to those quiet moments.",
      mood: "warm",
    },
  },
  {
    title: "Put Your Records On",
    artist: "Corinne Bailey Rae",
    spotifyUrl: "https://open.spotify.com/track/2nGFzvICaeAhisjnPMqEgD",
    sortOrder: 4,
    journeyEntry: {
      memory:
        "You always hummed this while getting ready. The way you tilted your head putting on earrings — I could watch that forever.",
      mood: "nostalgic",
    },
  },
  {
    title: "Better Together",
    artist: "Jack Johnson",
    spotifyUrl: "https://open.spotify.com/track/2KoHxhBiSKhjvSsVzTAuaN",
    sortOrder: 5,
    journeyEntry: {
      memory:
        "Our unofficial theme song. Every summer BBQ, every beach day, every moment where the world felt simple and perfect.",
      mood: "happy",
    },
  },
  {
    title: "XO",
    artist: "Beyoncé",
    spotifyUrl: "https://open.spotify.com/track/3mEiU2bVBcMpPqOJM4FGfz",
    sortOrder: 6,
  },
  {
    title: "Everywhere",
    artist: "Fleetwood Mac",
    spotifyUrl: "https://open.spotify.com/track/65KXHX7UR5HGAGiSOE5yX5",
    sortOrder: 7,
  },
  {
    title: "Lucky",
    artist: "Jason Mraz & Colbie Caillat",
    spotifyUrl: "https://open.spotify.com/track/4bLMDMimhdPWqnpQm1ECGR",
    sortOrder: 8,
  },
];

// ─── Spotify helpers for fetching album art during seed ────────

/**
 * Get a Spotify access token using Client Credentials flow.
 * This doesn't require user auth — just SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.
 */
async function getClientCredentialsToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log(
      "  ⚠️  SPOTIFY_CLIENT_ID/SECRET not set — skipping album art fetch"
    );
    return null;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!response.ok) {
    console.log(
      "  ⚠️  Failed to get Spotify client token — skipping album art fetch"
    );
    return null;
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetch album art for a track from the Spotify API.
 * Returns the ~300px image URL or null.
 */
async function fetchAlbumArt(
  spotifyUrl: string,
  accessToken: string
): Promise<string | null> {
  const match = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
  if (!match) return null;

  const trackId = match[1];
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return null;

  const track = await response.json();
  const images = track.album?.images ?? [];
  return (
    images.find((img: any) => img.height === 300)?.url ?? images[0]?.url ?? null
  );
}

// ─── Main seed function ────────────────────────────────────────

export async function main() {
  console.log("🌱 Seeding database...");

  // Create users
  for (const data of users) {
    const user = await prisma.user.create({ data });
    console.log(`  ✅ Created user: ${user.name} (${user.email})`);
  }

  // Create magic codes
  for (const data of magicCodes) {
    await prisma.magicCode.create({ data });
    console.log(`  ✅ Created magic code: ${data.id}`);
  }

  console.log("\n✨ Seeding complete!");
}

main();
