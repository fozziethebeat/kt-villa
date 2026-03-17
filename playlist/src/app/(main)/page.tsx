import { Header } from '@/components/Header';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { Music, Heart, Disc3, Headphones, ExternalLink } from 'lucide-react';

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

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
            Scroll through our musical journey together.
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
          <div className="space-y-6 sm:space-y-8">
            {songs.map((song, index) => (
              <div
                key={song.id}
                className="animate-fade-in-up group"
                style={{ animationDelay: `${index * 0.1}s` }}
                id={`song-${song.id}`}
              >
                {/* Song Card */}
                <div className="relative rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                  {/* Track number accent */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-wine via-brand-plum to-brand-rose-gold opacity-60" />

                  <div className="p-5 sm:p-6 pl-6 sm:pl-8">
                    {/* Song Header */}
                    <div className="flex items-start gap-4">
                      {/* Track Number */}
                      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-brand-wine to-brand-plum text-white font-serif font-bold text-lg sm:text-xl shadow-sm">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-serif font-semibold text-lg sm:text-xl text-brand-deep group-hover:text-brand-wine transition-colors truncate">
                              {song.title}
                            </h3>
                            <p className="text-sm text-brand-warm-gray mt-0.5">{song.artist}</p>
                          </div>
                          {song.spotifyUrl && (
                            <a
                              href={song.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 flex items-center gap-1 text-xs text-brand-wine/70 hover:text-brand-wine transition-colors mt-1 px-2 py-1 rounded-full border border-brand-wine/20 hover:border-brand-wine/40 hover:bg-brand-wine-light"
                              id={`spotify-link-${song.id}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span className="hidden sm:inline">Listen</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Journey Entry */}
                    {song.journeyEntry && (
                      <div className="mt-4 sm:mt-5 ml-14 sm:ml-16">
                        <div className="relative pl-4 border-l-2 border-brand-rose-gold/30">
                          {song.journeyEntry.mood && (
                            <div className="inline-flex items-center gap-1 rounded-full bg-brand-amber-light border border-brand-amber/20 px-2.5 py-0.5 text-xs font-medium text-brand-amber mb-2">
                              <Heart className="h-3 w-3" />
                              {song.journeyEntry.mood}
                            </div>
                          )}
                          <p className="text-sm sm:text-base text-brand-deep/80 leading-relaxed whitespace-pre-line">
                            {song.journeyEntry.memory}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
