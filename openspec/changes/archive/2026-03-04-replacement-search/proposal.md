## Why

The app currently detects unplayable tracks but offers no way to fix them. Users must manually search Spotify for replacements and manage their library — defeating the purpose of a utility called "Spotless." Adding replacement search and track management closes the loop from detection to remediation.

## What Changes

- Each unplayable track row becomes an expandable accordion that lazy-loads up to 3 replacement candidates from Spotify Search
- Candidates display a confidence score (★★★ / ★★ / ★) based on artist and title similarity to the original
- Each candidate has a preview button (inline `preview_url` playback, or open-in-Spotify fallback) and an independent "Add" action
- Each unplayable track has an independent "Remove original" action
- Add targets the same source as the original (Liked Songs or specific playlist)
- Post-action state: buttons become "✓ Added" / "✓ Removed" confirmations
- Collapsed rows show resolution status when actions have been taken
- OAuth scopes expanded to allow library and playlist modification
- `UnplayableTrack` type extended with `sourceId` and `trackUri` fields

## Capabilities

### New Capabilities
- `replacement-search`: Search Spotify for replacement candidates, score confidence, and present results in an expandable accordion UI with preview playback
- `track-actions`: Add replacement tracks to and remove unplayable tracks from the user's library or playlists via Spotify API

### Modified Capabilities
- `spotify-auth`: Add `user-library-modify`, `playlist-modify-public`, and `playlist-modify-private` scopes
- `library-scanner`: Extend `UnplayableTrack` to include `sourceId` (playlist ID or null for Liked Songs) and `trackUri` (Spotify URI of the original track)
- `scan-ui`: Transform results rows into expandable accordions with candidate display, action buttons, and resolution state

## Impact

- **Auth**: Existing users will see Spotify's permission screen again due to new scopes
- **Types**: `UnplayableTrack` in `src/types.ts` gains two new fields — scanner must populate them
- **API**: New Spotify endpoints: `GET /search`, `PUT /me/tracks`, `DELETE /me/tracks`, `POST /playlists/{id}/tracks`, `DELETE /playlists/{id}/tracks`
- **UI**: Results screen in `src/ui.ts` substantially reworked — accordion expansion, candidate rows, action buttons, audio playback
- **New modules**: Replacement search logic and track action logic as separate modules
