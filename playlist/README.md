# 🎵 Playlist Journey

A birthday present app — a curated playlist of songs, each paired with a personal journey entry (memory, story, mood).

## What It Does

- **Admin** adds songs and writes journey memories for each one
- **Wife** sees a beautiful, mobile-friendly scrollable playlist with track numbers, mood badges, and stories
- **Auth** via email magic link; new users need an invitation code

## Tech Stack

Next.js 16 · Prisma + PostgreSQL · Better Auth (magic link) · Tailwind CSS 4 + DaisyUI · Apollo GraphQL

## Getting Started

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Go to `http://localhost:3000/signin` and click **Login as Admin** (dev only).

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run dbreset` | Reset DB + seed users |
| `npx prisma studio` | Browse database |

## Project Structure

```
src/
├── app/(auth)/          # Sign-in, sign-up pages
├── app/(main)/          # Public playlist view
├── app/(main)/admin/    # Song + journey entry management
├── app/actions/         # Server actions (CRUD)
├── app/api/auth/        # Auth routes + dev login
├── components/          # SongForm, SongAdminCard, etc.
├── graphql/             # Schema + resolvers
└── lib/                 # Auth, Prisma, utilities
```

## Next Steps

[ ] Optimizing the journey writing experience
[ ] Auto-populating the play list entries given links from Spotify, either one song at a atime or from an entire playlist that's already available
[ ] Ensuring we can go to a read only page dedicated to each song and its journey entry
[ ] ensuring that we can see the song album cover and if possible lyrics
