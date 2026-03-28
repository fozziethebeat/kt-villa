import { Header } from '@/components/Header';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Music, Heart, Disc3, Headphones, ExternalLink, ChevronRight } from 'lucide-react';

export default async function Home() {
  const songs = await prisma.song.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { journeyEntry: true },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-wine-light via-brand-cream to-brand-plum-light opacity-70" />
        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-brand-rose-gold-light/40 blur-3xl" />
        <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full bg-brand-plum-light/50 blur-3xl" />
        <div className="container relative mx-auto px-4 py-16 sm:py-24 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-brand-wine/20 bg-brand-cream/80 px-4 py-1.5 text-sm text-brand-wine mb-6 backdrop-blur-sm">
            <Music className="mr-2 h-3.5 w-3.5" />
            <span className="font-medium tracking-wide uppercase text-xs">A Birthday Playlist</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl text-brand-deep mb-4 leading-[1.1]">
            Our Playlist{' '}
            <span className="text-brand-wine italic">Journey</span>
          </h1>
          <p className="max-w-xl text-lg text-brand-warm-gray mb-8 leading-relaxed">
            Every song tells a story. Every memory makes the melody richer.
            Tap a song to discover the story behind it.
          </p>
          <div className="flex items-center gap-2 text-sm text-brand-warm-gray">
            <Disc3 className="h-4 w-4 text-brand-wine animate-spin" style={{ animationDuration: '3s' }} />
            <span>{songs.length} {songs.length === 1 ? 'song' : 'songs'} in the playlist</span>
          </div>
        </div>
      </section>

      {/* Song List */}
      <main className="flex-1 container mx-auto px-4 py-8 sm:py-16 max-w-3xl">
        {songs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-brand-wine/20 p-12 text-center bg-brand-cream/50">
            <Headphones className="mx-auto h-12 w-12 text-brand-wine/30 mb-4" />
            <h3 className="text-lg font-medium text-brand-deep font-serif">No songs yet</h3>
            <p className="text-brand-warm-gray mt-1">The playlist is being curated with love...</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {songs.map((song, index) => (
              <Link
                key={song.id}
                href={`/song/${song.id}`}
                className="animate-fade-in-up group block"
                style={{ animationDelay: `${index * 0.06}s` }}
                id={`song-${song.id}`}
              >
                <div className="relative rounded-xl border border-border bg-card shadow-sm hover:shadow-lg hover:border-brand-wine/25 transition-all duration-300 overflow-hidden">
                  {/* Left accent bar */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-wine via-brand-plum to-brand-rose-gold opacity-50 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-center gap-4 p-4 sm:p-5 pl-5 sm:pl-7">
                    {/* Album Art / Track Number */}
                    {song.albumArt ? (
                      <div className="flex-shrink-0 relative w-11 h-11 sm:w-13 sm:h-13 rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                        <img
                          src={song.albumArt}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {/* Track number overlay */}
                        <div className="absolute bottom-0 right-0 flex items-center justify-center w-5 h-5 rounded-tl-lg bg-brand-wine/85 text-white text-[10px] font-bold font-serif">
                          {index + 1}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-gradient-to-br from-brand-wine to-brand-plum text-white font-serif font-bold text-base sm:text-lg shadow-sm group-hover:scale-105 transition-transform">
                        {index + 1}
                      </div>
                    )}

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif font-semibold text-base sm:text-lg text-brand-deep group-hover:text-brand-wine transition-colors truncate">
                        {song.title}
                      </h3>
                      <p className="text-sm text-brand-warm-gray mt-0.5 truncate">{song.artist}</p>
                    </div>

                    {/* Right side: mood badge + chevron */}
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      {song.journeyEntry?.mood && (
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-brand-amber-light border border-brand-amber/20 px-2.5 py-0.5 text-xs font-medium text-brand-amber">
                          <Heart className="h-3 w-3" />
                          {song.journeyEntry.mood}
                        </span>
                      )}

                      {song.spotifyUrl && (
                        <span className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full border border-brand-wine/15 text-brand-wine/50">
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      )}

                      <ChevronRight className="h-4 w-4 text-brand-warm-gray/50 group-hover:text-brand-wine group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-10 border-t border-border text-center text-brand-warm-gray text-sm bg-brand-cream/50">
        <p className="font-serif italic text-brand-wine mb-1">🎵 Made with love</p>
        <p>Happy Birthday ♡</p>
      </footer>
    </div>
  );
}
