## Context

After OAuth login, the app currently shows a scan screen with a single "Scan Library" button. Clicking it invokes `scan()` which internally fetches the user profile, all owned playlists, and scans everything. Users have no way to exclude sources.

The scan screen flow is: `showScanScreen()` → `renderScanScreen()` → user clicks → `startScan()` → `scan()` generator yields events.

The app uses vanilla TypeScript for simple screens (login, scan button) and Preact "islands" for interactive components (triage view). The playlist picker has interactive checkbox state, making it a natural fit for the Preact island pattern.

## Goals / Non-Goals

**Goals:**
- Let users select which sources (Liked Songs + owned playlists) to scan before starting
- Display playlist cover images alongside names for easy identification
- Keep the UI simple: checkboxes, all checked by default, scan button disabled when none selected
- Minimal changes to the scanner's public API

**Non-Goals:**
- Persisting playlist selection across sessions (future enhancement)
- Showing non-owned/followed playlists (current behavior already filters to owned only)
- Search/filter within the playlist picker (not needed unless playlist count is very large)

## Decisions

### 1. Fetch playlists at scan-screen time, not scan time

**Choice**: Move playlist fetching into `showScanScreen()` so the picker can render before the user clicks scan.

**Alternative**: Fetch lazily on first render of picker. Rejected — adds loading state complexity. The scan screen already fetches `/me` for the display name; adding `/me/playlists` in parallel is straightforward.

**Rationale**: The user needs to see their playlists to make selections. Fetching upfront keeps the picker synchronous once rendered.

### 2. Preact island for the playlist picker

**Choice**: Implement the picker as a Preact component (`PlaylistPicker`), mounted as an island into the scan screen container — same pattern as the triage view in `src/triage/mount.ts`.

**Alternative**: Manual DOM with event listeners in `src/ui.ts`. Rejected — checkbox state management, button enable/disable, and list rendering are verbose in vanilla DOM. Preact is already a dependency and the island pattern is established.

**Rationale**: The picker has interactive state (N checkboxes driving a button's disabled state). Preact's `useState` handles this cleanly. Mounting/unmounting follows the existing `render(h(Component, props), container)` pattern.

### 3. Represent Liked Songs as a virtual source alongside playlists

**Choice**: Model the picker items as a union: `{ type: "liked-songs" }` or `{ type: "playlist", playlist: SpotifyPlaylist }`. The picker renders both uniformly. Liked Songs uses a static image (`/library.png`), playlists use their Spotify cover.

**Alternative**: Treat Liked Songs as a boolean flag separate from the playlist list. Rejected — it creates two parallel selection mechanisms for the same concept.

### 4. Pass selected sources to `scan()` as a parameter

**Choice**: Change `scan()` to accept `{ includeLikedSongs: boolean; playlists: SpotifyPlaylist[] }`. The caller (main.ts) filters based on picker state and passes only selected playlists.

**Alternative**: Pass source IDs and have the scanner re-fetch. Rejected — wasteful since we already have the playlist data from the picker fetch.

**Alternative**: Keep `scan()` unchanged and filter at the UI level. Rejected — the scanner would still make API calls for unchecked sources.

### 5. Playlist images: use smallest available from Spotify API

**Choice**: Display the smallest image from the playlist's `images` array (same pattern used for track thumbnails in the scanner). Fall back to a placeholder if no images exist.

**Rationale**: Consistent with existing thumbnail logic. Small images load fast and fit the checkbox-list layout.

### 6. Static image for Liked Songs

**Choice**: Copy `~/Desktop/liked-songs.png` to `public/library.png`. Reference as `/library.png` in code (Vite serves `public/` at root).

**Rationale**: Spotify doesn't return an image for Liked Songs since it's not a real playlist. A static asset is the simplest approach.

## Risks / Trade-offs

- **Extra API call on scan screen** → Mitigated: `/me/playlists` is lightweight and runs in parallel with `/me`. Users with many playlists may see a brief loading state.
- **Playlist list could be long** → Acceptable for now. Most users have <50 playlists. A "select all / deselect all" toggle handles bulk operations. Search/filter is a non-goal.
- **Scanner API change is breaking for tests** → Mitigated: straightforward to update — pass the full playlist list in existing tests to maintain current behavior.
