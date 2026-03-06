## Why

Track names, artist names, and album art in the replacement candidates list and mini player are plain text. Users can't click through to Spotify to preview a full album, check an artist's catalog, or view a track page before deciding on a replacement.

## What Changes

- Make track names, artist names, and album art clickable links to their corresponding Spotify web pages (`open.spotify.com/track/…`, `open.spotify.com/artist/…`, `open.spotify.com/album/…`)
- Apply this to both the replacement candidate rows and the mini player
- Extend data types to capture album IDs (from Search API) and structured artist data (from Playback SDK) needed for link construction

## Capabilities

### New Capabilities

_None — this enhances existing UI capabilities._

### Modified Capabilities

- `triage-ui`: Replacement candidate rows and mini player gain clickable Spotify links on track name, artist name, and album art

## Impact

- `src/types.ts` — add `id` to album shape in `SpotifyTrack`
- `src/audio.ts` — refactor `NowPlayingTrack` to store structured artist/album data instead of pre-joined strings
- `src/triage/TrackExpansion.tsx` — wrap track name, artists, album art in anchor tags
- `src/triage/MiniPlayer.tsx` — same link treatment, parse Spotify URIs to construct URLs
- `src/spotify-sdk.d.ts` — no changes needed (already has `uri` on artists and album)
