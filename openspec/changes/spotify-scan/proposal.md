## Why

Spotless has no functionality yet — it's a blank scaffold. The foundational capability is connecting to Spotify and scanning the user's library for unplayable tracks. Without this, nothing else (replacements, removals) can be built.

## What Changes

- Add Spotify OAuth authentication using Authorization Code + PKCE flow (no backend)
- Implement scanning of Liked Songs and user-owned playlists via Spotify Web API
- Detect unplayable tracks using `is_playable` field (requires `market=from_token`)
- Display scan results: unplayable tracks grouped by source (Liked Songs / playlist name) with restriction reasons (market, product, explicit)
- Show live scan progress so the user knows things are working
- Skip local files (`is_local: true`) silently

## Capabilities

### New Capabilities
- `spotify-auth`: Spotify OAuth with PKCE — login, token storage (sessionStorage), token refresh, logout
- `library-scanner`: Paginated scanning of Liked Songs and user-owned playlists, detecting unplayable tracks via `is_playable` with market context
- `scan-ui`: UI for the full user flow — login screen, scan trigger, live progress, results display with unplayable track details and restriction reasons

### Modified Capabilities
<!-- None — this is the first feature -->

## Impact

- **New files**: Auth module, Spotify API client, scanner logic, UI rendering
- **Dependencies**: None beyond Spotify Web API (no new npm packages)
- **APIs**: Spotify Web API — `/me/tracks`, `/me/playlists`, `/playlists/{id}/tracks`
- **Config**: Spotify Client ID bundled at build time via Vite env var; redirect URI for OAuth callback
- **Scopes needed**: `user-library-read`, `playlist-read-private`
