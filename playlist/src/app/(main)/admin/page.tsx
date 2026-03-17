import { Header } from '@/components/Header';
import prisma from '@/lib/prisma';
import { SongForm } from '@/components/SongForm';
import { SongAdminCard } from '@/components/SongAdminCard';
import { Music, Plus } from 'lucide-react';

const links = [{ url: '/', label: 'Playlist' }];

export default async function AdminPage() {
  const songs = await prisma.song.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { journeyEntry: true },
  });

  return (
    <>
      <Header links={links} target="Manage Songs" />
      <div className="container mx-auto py-6 sm:py-10 px-4 md:px-8 space-y-8 max-w-4xl">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-brand-deep">
            Manage Songs
          </h1>
          <p className="text-brand-warm-gray mt-2 text-sm sm:text-base">
            Add songs to the playlist and write journey memories for each one.
          </p>
        </div>

        {/* Add Song Form */}
        <div className="bg-card rounded-xl border border-border p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-brand-wine/10 flex items-center justify-center">
              <Plus className="h-4 w-4 text-brand-wine" />
            </div>
            <h2 className="text-lg font-semibold text-brand-deep font-serif">Add a Song</h2>
          </div>
          <SongForm />
        </div>

        {/* Songs List */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Music className="h-5 w-5 text-brand-wine" />
            <h2 className="text-xl font-semibold tracking-tight text-brand-deep font-serif">
              Playlist ({songs.length})
            </h2>
          </div>

          {songs.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-brand-wine/20 bg-brand-cream/50 p-10 text-center">
              <Music className="h-10 w-10 text-brand-wine/20 mx-auto mb-3" />
              <p className="text-sm text-brand-warm-gray">
                No songs yet. Add the first song to start building the playlist!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {songs.map((song, index) => (
                <SongAdminCard
                  key={song.id}
                  song={song}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
