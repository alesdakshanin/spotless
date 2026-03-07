## Why

Testing the scan → triage → replace → remove flow requires unplayable tracks in the user's library. Currently there's no reliable way to populate a playlist with unplayable tracks on demand, making repeated end-to-end testing tedious and dependent on chance.

## What Changes

- Add a standalone TypeScript script (`scripts/seed-unplayable.ts`) runnable via `npx tsx`
- The script authenticates using a Spotify access token provided via environment variable
- It creates (or reuses) a "Spotless Test" playlist on the user's account
- It carries a curated list of Spotify track URIs known to be region-locked (Japanese exclusives, pulled tracks, regional releases)
- Before adding, it verifies each track's playability via `GET /tracks` with `market=from_token`
- Only confirmed-unplayable tracks are added to the playlist
- It reports results: which tracks were added, which were already playable, and which failed

## Capabilities

### New Capabilities
- `seed-unplayable`: Standalone dev script for populating a test playlist with verified unplayable tracks

### Modified Capabilities
<!-- None — this is an independent dev tool that doesn't change any existing app behavior -->

## Impact

- **New file:** `scripts/seed-unplayable.ts`
- **Dependencies:** `tsx` (already available via npx, no install needed)
- **APIs used:** Spotify Web API — `GET /me`, `GET /me/playlists`, `POST /users/{id}/playlists`, `GET /tracks`, `POST /playlists/{id}/tracks`
- **No changes** to existing app code, build, or tests
