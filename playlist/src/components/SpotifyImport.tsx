'use client';

import { useState, useEffect } from 'react';
import {
  previewSpotifyPlaylist,
  importSpotifyPlaylist,
  hasSpotifyToken,
  type SpotifyImportResult,
} from '@/app/actions/spotify';
import type { SpotifyTrack } from '@/lib/spotify';
import { Music, Download, Eye, ExternalLink, Check, AlertCircle, Disc3 } from 'lucide-react';

export function SpotifyImport() {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [previewTracks, setPreviewTracks] = useState<SpotifyTrack[] | null>(null);
  const [playlistName, setPlaylistName] = useState<string | null>(null);
  const [result, setResult] = useState<SpotifyImportResult | null>(null);

  // Check if Spotify is connected on mount
  useEffect(() => {
    hasSpotifyToken().then(setConnected);
  }, []);

  const handlePreview = async () => {
    if (!playlistUrl.trim()) return;
    setLoading(true);
    setResult(null);
    setPreviewTracks(null);

    const res = await previewSpotifyPlaylist(playlistUrl.trim());

    if (res.message === 'SPOTIFY_NOT_CONNECTED') {
      setConnected(false);
      setLoading(false);
      return;
    }

    if (res.success && res.tracks) {
      setPreviewTracks(res.tracks);
      setPlaylistName(res.playlistName ?? null);
    }
    setResult(res);
    setLoading(false);
  };

  const handleImport = async () => {
    if (!playlistUrl.trim()) return;
    setLoading(true);

    const res = await importSpotifyPlaylist(playlistUrl.trim());

    if (res.message === 'SPOTIFY_NOT_CONNECTED') {
      setConnected(false);
      setLoading(false);
      return;
    }

    setResult(res);
    setPreviewTracks(null);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Connection status + connect button */}
      {connected === false && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            Connect your Spotify account to import playlists.
          </p>
          <a
            href="/api/spotify/authorize"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1DB954] text-white font-medium text-xs px-4 py-2 hover:bg-[#1DB954]/90 transition-colors flex-shrink-0"
          >
            <Disc3 className="h-3.5 w-3.5" />
            Connect Spotify
          </a>
        </div>
      )}

      {connected === true && (
        <div className="flex items-center gap-2 text-xs text-green-700">
          <Check className="h-3.5 w-3.5" />
          <span>Spotify connected</span>
        </div>
      )}

      {/* Playlist URL input + actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="spotify-playlist-url"
          type="url"
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
          placeholder="https://open.spotify.com/playlist/..."
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-wine/30 focus:border-brand-wine transition-colors"
        />
        <div className="flex gap-2">
          <button
            onClick={handlePreview}
            disabled={loading || !playlistUrl.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-wine/20 text-brand-wine font-medium text-sm px-4 py-2.5 hover:bg-brand-wine-light disabled:opacity-50 transition-colors"
          >
            <Eye className="h-4 w-4" />
            {loading && !previewTracks ? 'Loading...' : 'Preview'}
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !playlistUrl.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-wine text-white font-medium text-sm px-4 py-2.5 hover:bg-brand-wine/90 disabled:opacity-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            {loading && previewTracks ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>

      {/* Result message */}
      {result && !previewTracks && (
        <div
          className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
            result.success
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {result.success ? (
            <Check className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {result.message}
        </div>
      )}

      {/* Preview list */}
      {previewTracks && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-brand-deep">
              {playlistName && (
                <span className="text-brand-warm-gray font-normal">
                  From &ldquo;{playlistName}&rdquo; &middot;{' '}
                </span>
              )}
              {previewTracks.length} tracks
            </p>
            <button
              onClick={() => {
                setPreviewTracks(null);
                setResult(null);
              }}
              className="text-xs text-brand-warm-gray hover:text-brand-deep transition-colors"
            >
              Clear preview
            </button>
          </div>

          <div className="rounded-xl border border-border overflow-hidden max-h-80 overflow-y-auto">
            {previewTracks.map((track, i) => (
              <div
                key={`${track.title}-${track.artist}-${i}`}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-brand-cream/30 transition-colors"
              >
                {/* Album art */}
                {track.albumArt ? (
                  <img
                    src={track.albumArt}
                    alt=""
                    className="w-9 h-9 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded bg-brand-cream flex items-center justify-center flex-shrink-0">
                    <Music className="h-4 w-4 text-brand-warm-gray" />
                  </div>
                )}

                {/* Track number */}
                <span className="text-xs text-brand-warm-gray w-6 text-right flex-shrink-0">
                  {i + 1}
                </span>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-deep truncate">
                    {track.title}
                  </p>
                  <p className="text-xs text-brand-warm-gray truncate">
                    {track.artist}
                  </p>
                </div>

                {/* Spotify link */}
                <a
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-warm-gray hover:text-brand-wine transition-colors flex-shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
