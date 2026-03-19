## Why

Users currently have no control over which playlists get scanned — the app automatically scans Liked Songs and all owned playlists. For users with many playlists, this means long scan times for sources they may not care about. Letting users choose which sources to scan gives them control and makes the tool faster for targeted use.

## What Changes

- Add a playlist picker screen between authentication and scanning, showing all scannable sources (Liked Songs + owned playlists) with checkboxes and playlist cover images
- All sources are checked by default; users can uncheck sources to exclude them
- The "Scan Library" button is disabled when no sources are selected
- The scanner accepts a filtered list of sources instead of always scanning everything
- The `SpotifyPlaylist` type gains an `images` field to support displaying playlist covers
- Liked Songs uses a static image (`public/library.png`, copied from `~/Desktop/liked-songs.png`) since the Spotify API doesn't return an image for Liked Songs

## Capabilities

### New Capabilities
- `playlist-picker`: UI component that displays all scannable sources (Liked Songs + owned playlists) with checkboxes and cover images, allowing users to select which sources to scan

### Modified Capabilities
- `scan-ui`: The scan screen now includes the playlist picker before scanning begins; the scan button becomes disabled when nothing is selected
- `library-scanner`: The `scan()` function accepts an optional filter of selected sources instead of always scanning all owned playlists and Liked Songs

## Impact

- **Types**: `SpotifyPlaylist` needs an `images` field (`SpotifyImage[]`) to support cover art display
- **Scanner** (`src/scanner.ts`): `scan()` signature changes to accept selected source IDs; `fetchOwnedPlaylists` result is needed earlier (at picker time, not scan time)
- **Picker** (new `src/picker/`): Preact island component for the playlist picker, following the same pattern as `src/triage/`
- **Main** (`src/main.ts`): New screen state between `showScanScreen` and `startScan` — fetch playlists, show picker, then pass selection to scanner
- **Tests**: Scanner tests need updating for the new `scan()` signature; new tests for picker UI behavior
