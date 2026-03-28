# Playlist Journey — Design Document

## Goals
A birthday present app for displaying a curated playlist of songs paired with written journey entries (memories, stories, moods). The app is a love letter through music.

## Core Features
1. **Authentication**:
   - Admin (you) and wife log in via email magic link
   - New users need an invitation code to sign up
   - Dev-only instant login for testing (via `/api/auth/dev-login`)
2. **Admin View** (`/admin`):
   - Add songs with title, artist, album art URL, and Spotify link
   - Write journey entries (memories/stories + mood tags) for each song
   - Delete songs and entries
3. **Wife's View** (`/`):
   - Beautiful scrollable list of songs with track numbers
   - Each song shows its journey entry with mood badge
   - Spotify link for each song
   - Animated cards with micro-interactions
4. **Mobile-First Design**:
   - Optimized for phone browsing (in the car listening to the playlist)
   - Touch-friendly cards and forms
   - Responsive layout with sensible breakpoints

## User Roles
- **Admin**: Can manage songs and journey entries
- **General**: Can view the playlist and entries (wife's view)

## Data Model

### Song
- `id`: UUID
- `title`: String
- `artist`: String
- `albumArt`: String? (URL to album artwork)
- `spotifyUrl`: String? (link to Spotify track)
- `sortOrder`: Int (controls playlist order)
- One-to-one relation to JourneyEntry

### JourneyEntry
- `id`: UUID
- `songId`: Unique relation to Song
- `memory`: String (the story/memory text)
- `mood`: String? (e.g., "Nostalgic", "Joyful", "Bittersweet")

## Visual Style
- **Target Audience**: Your wife — warm, intimate, romantic
- **Theme**: Intimate, premium, music-inspired — think vinyl record liner notes meets love letter
- **Colors**: Deep wine/burgundy, soft plum, warm amber, rose gold, warm cream backgrounds
- **Typography**: Playfair Display (serif) for headings, Inter (sans-serif) for body text
- **Aesthetics**: Warm gradients, glassmorphism cards, subtle animations (fade-in-up), accent borders with wine-to-plum gradients

## Page Structure

### Auth
- `/signin`: Magic link sign-in with dev login buttons
- `/signup`: Sign-up with invitation code

### Public Views
- `/`: Hero section + clean scrollable song list (compact cards linking to detail pages)
- `/song/[id]`: Individual song detail page with full story, mood, album art, Spotify link, and prev/next navigation

### Admin Views
- `/admin`: Song management dashboard with add form + expandable card list

## Tech Stack
- Next.js 16 (Turbopack)
- Prisma + PostgreSQL
- Better Auth (magic link)
- Apollo Server (GraphQL)
- Tailwind CSS 4 + DaisyUI
- Lucide React icons
