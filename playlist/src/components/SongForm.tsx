'use client';

import { useState } from 'react';
import { createSong } from '@/app/actions/songs';
import { Music } from 'lucide-react';

export function SongForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const result = await createSong(formData);
    setMessage(result.message);
    setLoading(false);

    if (result.success) {
      form.reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="song-title" className="text-sm font-medium text-brand-deep">
            Song Title *
          </label>
          <input
            id="song-title"
            name="title"
            type="text"
            required
            placeholder="e.g. Love Story"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-wine/30 focus:border-brand-wine transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="song-artist" className="text-sm font-medium text-brand-deep">
            Artist *
          </label>
          <input
            id="song-artist"
            name="artist"
            type="text"
            required
            placeholder="e.g. Taylor Swift"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-wine/30 focus:border-brand-wine transition-colors"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="song-albumart" className="text-sm font-medium text-brand-deep">
            Album Art URL
          </label>
          <input
            id="song-albumart"
            name="albumArt"
            type="url"
            placeholder="https://..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-wine/30 focus:border-brand-wine transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="song-spotify" className="text-sm font-medium text-brand-deep">
            Spotify URL
          </label>
          <input
            id="song-spotify"
            name="spotifyUrl"
            type="url"
            placeholder="https://open.spotify.com/..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-wine/30 focus:border-brand-wine transition-colors"
          />
        </div>
      </div>

      {message && (
        <p className="text-sm text-brand-wine">{message}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-wine text-white font-medium text-sm px-5 py-2.5 hover:bg-brand-wine/90 disabled:opacity-50 transition-colors w-full sm:w-auto"
      >
        <Music className="h-4 w-4" />
        {loading ? 'Adding...' : 'Add Song'}
      </button>
    </form>
  );
}
