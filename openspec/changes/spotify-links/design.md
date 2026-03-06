## Context

Replacement candidate rows and the mini player display track name, artist names, and album art as plain text/images. Users cannot click through to Spotify to investigate tracks before selecting them as replacements. Spotify URIs and IDs are already available in the data but not surfaced as links.

## Goals / Non-Goals

**Goals:**
- Make track names, artist names, and album art clickable links to Spotify web pages in both candidate rows and the mini player
- Keep existing selection/play interactions intact — links must not conflict with radio selection or play buttons

**Non-Goals:**
- Linking the original unplayable track info (those tracks are broken anyway)
- Adding external link icons or visual chrome beyond normal anchor styling
- Changing the data fetched from Spotify API (we already get what we need)

## Decisions

### 1. Construct URLs from IDs/URIs rather than storing `external_urls`

**Choice:** Parse Spotify URIs (`spotify:type:id`) and use existing `id` fields to build `open.spotify.com/{type}/{id}` URLs.

**Why not `external_urls`?** The Spotify API returns an `external_urls.spotify` field, but:
- We'd need to widen every type (`SpotifyTrack`, `SpotifyArtist`, album shape) and ensure all API call sites pass it through
- The Web Playback SDK doesn't include `external_urls` at all — only `uri`
- The URL pattern is stable and trivially derivable: `https://open.spotify.com/{type}/{id}`

A small helper `spotifyUrl(type, id)` and `spotifyUrlFromUri(uri)` keeps this DRY.

### 2. Add `id` to album shape in `SpotifyTrack`

The album inline type currently has `{ name: string; images: SpotifyImage[] }`. Spotify's Search API response includes `album.id` — we just discard it. Adding `id: string` lets us link album art to the album page. No API changes needed; we just capture what's already returned.

### 3. Refactor `NowPlayingTrack` to store structured data

**Current:** `{ uri: string; name: string; artists: string; albumArtUrl?: string; paused: boolean }`
**New:** Replace `artists: string` with `artists: Array<{ name: string; uri: string }>` and add `albumUri?: string`.

This lets the mini player render individual artist links and an album art link. The SDK provides `uri` on both artists and album in the player state.

### 4. Links open in new tabs and don't interfere with selection

All Spotify links use `target="_blank" rel="noopener noreferrer"` and `onClick={e => e.stopPropagation()}` to prevent the click from bubbling up to the radio-select `<label>` in candidate rows.

### 5. Link styling: subtle, not distracting

Track/artist names become anchor tags with `hover:underline` — they look like normal text until hovered. Album art thumbnails become clickable with no visible link treatment (the cursor change is enough). This keeps the UI clean.

## Risks / Trade-offs

**[Risk] Link clicks may conflict with candidate row `<label>` selection** → Mitigated by `e.stopPropagation()` on all anchor tags within the label. The existing Spotify external link (↗ button) already uses this pattern successfully.

**[Trade-off] URI parsing vs stored URLs** → If Spotify ever changes their URL scheme, links break. This is extremely unlikely for `open.spotify.com` and the simplicity win is worth it.

**[Trade-off] `NowPlayingTrack` becomes slightly more complex** → The interface gains structured artist data, but the mini player rendering stays simple. Any existing consumers of `nowPlaying.value.artists` as a string will need updating (only `MiniPlayer.tsx`).
