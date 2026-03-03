## Why

The scan results currently show tracks as text-only rows (name, artist, source, reason). Adding album art thumbnails makes tracks instantly recognizable and gives the results screen a more polished, music-app feel.

## What Changes

- Add `album` data (name + images array) to the Spotify track types so the API response shape captures album art
- Add a `thumbnailUrl` field to the `UnplayableTrack` domain type, populated from the smallest available album image
- Render a small album art thumbnail next to each track in the results list
- Provide a placeholder/fallback when no album art is available

## Capabilities

### New Capabilities

_None — this is a visual enhancement to existing capabilities._

### Modified Capabilities

- `library-scanner`: The scanner must propagate album image data into `UnplayableTrack` results
- `scan-ui`: The results display must render album art thumbnails alongside track details

## Impact

- **Types**: `SpotifyTrack` gains an `album` field; `UnplayableTrack` gains `thumbnailUrl`
- **Scanner**: Must extract the thumbnail URL when building `UnplayableTrack` entries
- **UI**: `renderTrackList` must render an `<img>` element per track row
- **Tests**: Scanner tests need updated fixtures to include album data
- **No new dependencies or API endpoints** — album data is already included in existing Spotify API responses (`/me/tracks`, `/playlists/{id}/tracks`)
