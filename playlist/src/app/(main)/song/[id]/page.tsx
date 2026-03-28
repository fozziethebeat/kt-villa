import { Header } from '@/components/Header';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Heart, ExternalLink, ArrowLeft, ArrowRight, Music, Disc3, Quote } from 'lucide-react';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const song = await prisma.song.findUnique({
    where: { id },
  });

  if (!song) {
    return { title: 'Song Not Found' };
  }

  return {
    title: `${song.title} — Our Playlist Journey`,
    description: `The story behind "${song.title}" by ${song.artist}`,
  };
}

export default async function SongPage({ params }: PageProps) {
  const { id } = await params;

  const song = await prisma.song.findUnique({
    where: { id },
    include: { journeyEntry: true },
  });

  if (!song) {
    notFound();
  }

  // Get all songs for navigation (prev/next)
  const allSongs = await prisma.song.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { id: true, title: true, sortOrder: true },
  });

  const currentIndex = allSongs.findIndex((s) => s.id === song.id);
  const prevSong = currentIndex > 0 ? allSongs[currentIndex - 1] : null;
  const nextSong = currentIndex < allSongs.length - 1 ? allSongs[currentIndex + 1] : null;
  const trackNumber = currentIndex + 1;

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        links={[{ label: 'Playlist', url: '/' }]}
        target={song.title}
      />

      {/* Hero / Song Identity */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-wine-light via-brand-cream to-brand-plum-light opacity-60" />
        {/* Decorative blurs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-brand-rose-gold-light/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-brand-plum-light/40 blur-3xl" />

        <div className="container relative mx-auto px-4 py-12 sm:py-20 max-w-2xl">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-brand-warm-gray hover:text-brand-wine transition-colors mb-8 group"
            id="back-to-playlist"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Playlist
          </Link>

          <div className="flex flex-col items-center text-center">
            {/* Album art or track number badge */}
            {song.albumArt ? (
              <div className="relative mb-6 group/art">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5">
                  <img
                    src={song.albumArt}
                    alt={`Album art for ${song.title}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Track number overlay */}
                <div className="absolute -bottom-2 -right-2 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-brand-wine to-brand-plum text-white font-serif font-bold text-base sm:text-lg shadow-lg ring-2 ring-white">
                  {trackNumber}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-brand-wine to-brand-plum text-white font-serif font-bold text-2xl sm:text-3xl shadow-lg mb-6">
                {trackNumber}
              </div>
            )}

            {/* Song title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-brand-deep leading-[1.1] mb-2">
              {song.title}
            </h1>

            {/* Artist */}
            <p className="text-lg sm:text-xl text-brand-warm-gray mb-6">
              {song.artist}
            </p>

            {/* Meta row: mood + spotify */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {song.journeyEntry?.mood && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-amber-light/80 border border-brand-amber/20 px-3.5 py-1 text-sm font-medium text-brand-amber backdrop-blur-sm">
                  <Heart className="h-3.5 w-3.5" />
                  {song.journeyEntry.mood}
                </span>
              )}

              {song.spotifyUrl && (
                <a
                  href={song.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-brand-wine/20 bg-brand-cream/80 px-3.5 py-1 text-sm font-medium text-brand-wine hover:bg-brand-wine hover:text-white transition-all backdrop-blur-sm"
                  id="spotify-link"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Listen on Spotify
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Story / Journey Entry */}
      <main className="flex-1 container mx-auto px-4 py-10 sm:py-16 max-w-2xl">
        {song.journeyEntry ? (
          <div className="animate-fade-in-up">
            {/* Story card */}
            <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              {/* Accent bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-wine via-brand-plum to-brand-rose-gold" />

              <div className="p-6 sm:p-10">
                {/* Quote icon */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-wine-light">
                    <Quote className="h-5 w-5 text-brand-wine" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-brand-deep">The Story</h2>
                    <p className="text-xs text-brand-warm-gray">A memory behind the music</p>
                  </div>
                </div>

                {/* Memory text */}
                <div className="relative pl-5 border-l-2 border-brand-rose-gold/40">
                  <p className="text-base sm:text-lg text-brand-deep/85 leading-relaxed sm:leading-loose whitespace-pre-line font-light">
                    {song.journeyEntry.memory}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-brand-wine/15 p-12 text-center bg-brand-cream/40">
            <Music className="mx-auto h-10 w-10 text-brand-wine/25 mb-3" />
            <h3 className="font-serif text-lg font-medium text-brand-deep">No story yet</h3>
            <p className="text-sm text-brand-warm-gray mt-1">
              The story behind this song is still being written...
            </p>
          </div>
        )}



        {/* Navigation — prev / next */}
        <nav className="mt-12 sm:mt-16 grid grid-cols-2 gap-4" id="song-navigation">
          {prevSong ? (
            <Link
              href={`/song/${prevSong.id}`}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-brand-wine/30 transition-all"
              id="prev-song"
            >
              <ArrowLeft className="h-4 w-4 text-brand-warm-gray group-hover:text-brand-wine group-hover:-translate-x-0.5 transition-all flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs text-brand-warm-gray">Previous</span>
                <p className="text-sm font-medium text-brand-deep truncate">{prevSong.title}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextSong ? (
            <Link
              href={`/song/${nextSong.id}`}
              className="group flex items-center justify-end gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-brand-wine/30 transition-all text-right"
              id="next-song"
            >
              <div className="min-w-0">
                <span className="text-xs text-brand-warm-gray">Next</span>
                <p className="text-sm font-medium text-brand-deep truncate">{nextSong.title}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-brand-warm-gray group-hover:text-brand-wine group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-border text-center text-brand-warm-gray text-sm bg-brand-cream/50">
        <p className="font-serif italic text-brand-wine mb-1">🎵 Made with love</p>
        <p>Happy Birthday ♡</p>
      </footer>
    </div>
  );
}
