'use client';

import { useState } from 'react';
import { deleteSong, upsertJourneyEntry, deleteJourneyEntry } from '@/app/actions/songs';
import { Trash2, PenLine, ChevronDown, ChevronUp, Heart, Save, ExternalLink, X } from 'lucide-react';

interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt: string | null;
  spotifyUrl: string | null;
  sortOrder: number;
  journeyEntry: {
    id: string;
    songId: string;
    memory: string;
    mood: string | null;
  } | null;
}

export function SongAdminCard({ song, index }: { song: Song; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSaveJourney = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const result = await upsertJourneyEntry(song.id, formData);
    setMessage(result.message);
    setSaving(false);
  };

  const handleDeleteJourney = async () => {
    if (!confirm('Remove this journey entry?')) return;
    setSaving(true);
    const result = await deleteJourneyEntry(song.id);
    setMessage(result.message);
    setSaving(false);
  };

  const handleDeleteSong = async () => {
    if (!confirm(`Delete "${song.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await deleteSong(song.id);
  };

  return (
    <div
      className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
      id={`admin-song-${song.id}`}
    >
      {/* Song Header */}
      <div className="flex items-center gap-3 p-4 sm:p-5">
        {/* Album Art / Track Number */}
        {song.albumArt ? (
          <div className="flex-shrink-0 relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden shadow-sm">
            <img
              src={song.albumArt}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 right-0 flex items-center justify-center w-4.5 h-4.5 rounded-tl-md bg-brand-wine/85 text-white text-[9px] font-bold font-serif">
              {index + 1}
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-wine to-brand-plum text-white font-serif font-bold text-sm">
            {index + 1}
          </div>
        )}

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-brand-deep truncate">{song.title}</h3>
          <p className="text-xs text-brand-warm-gray">{song.artist}</p>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2">
          {song.journeyEntry && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-wine-light border border-brand-wine/20 px-2 py-0.5 text-xs font-medium text-brand-wine">
              <PenLine className="h-3 w-3" />
              <span className="hidden sm:inline">Has entry</span>
            </span>
          )}
          {song.spotifyUrl && (
            <a
              href={song.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-warm-gray hover:text-brand-wine transition-colors"
              title="Open in Spotify"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-brand-cream transition-colors text-brand-warm-gray"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded Section */}
      {expanded && (
        <div className="border-t border-border bg-brand-cream/30 p-4 sm:p-5 space-y-4">
          {/* Journey Entry Form */}
          <form onSubmit={handleSaveJourney} className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-brand-wine" />
              <span className="text-sm font-medium text-brand-deep">Journey Entry</span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`memory-${song.id}`} className="text-xs font-medium text-brand-warm-gray">
                Memory / Story
              </label>
              <textarea
                id={`memory-${song.id}`}
                name="memory"
                rows={4}
                defaultValue={song.journeyEntry?.memory || ''}
                placeholder="Write the memory or story behind this song..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-wine/30 focus:border-brand-wine transition-colors resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`mood-${song.id}`} className="text-xs font-medium text-brand-warm-gray">
                Mood / Feeling (optional)
              </label>
              <input
                id={`mood-${song.id}`}
                name="mood"
                type="text"
                defaultValue={song.journeyEntry?.mood || ''}
                placeholder="e.g. Nostalgic, Joyful, Bittersweet..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-wine/30 focus:border-brand-wine transition-colors"
              />
            </div>

            {message && (
              <p className="text-xs text-brand-wine">{message}</p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-wine text-white font-medium text-xs px-4 py-2 hover:bg-brand-wine/90 disabled:opacity-50 transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save Entry'}
              </button>

              {song.journeyEntry && (
                <button
                  type="button"
                  onClick={handleDeleteJourney}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-wine/20 text-brand-wine font-medium text-xs px-4 py-2 hover:bg-brand-wine-light disabled:opacity-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove Entry
                </button>
              )}
            </div>
          </form>

          {/* Delete Song */}
          <div className="pt-3 border-t border-border">
            <button
              onClick={handleDeleteSong}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Deleting...' : 'Delete Song'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
