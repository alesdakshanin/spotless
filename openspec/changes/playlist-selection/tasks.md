## 1. Types & Static Assets

- [ ] 1.1 Add `images` field (`SpotifyImage[]`) to `SpotifyPlaylist` interface in `src/types.ts`
- [ ] 1.2 Copy `~/Desktop/liked-songs.png` to `public/library.png`

## 2. Scanner API Change

- [ ] 2.1 Change `scan()` to accept `{ includeLikedSongs: boolean; playlists: SpotifyPlaylist[] }` parameter — skip Liked Songs scan when `includeLikedSongs` is false, scan only provided playlists instead of fetching them internally
- [ ] 2.2 Export `fetchOwnedPlaylists` so it can be called from `main.ts` at scan-screen time
- [ ] 2.3 Update scanner tests to pass the new scan config parameter

## 3. Playlist Picker Component

- [ ] 3.1 Create `src/picker/PlaylistPicker.tsx` — Preact component with checkbox list (Liked Songs + playlists), cover images, and scan button that disables when nothing is selected
- [ ] 3.2 Create `src/picker/mount.ts` — mount/unmount functions following the triage island pattern
- [ ] 3.3 Add tests for picker: default all-checked state, uncheck/recheck toggles, button disabled when all unchecked

## 4. Screen Integration

- [ ] 4.1 Update `showScanScreen()` in `main.ts` to fetch playlists in parallel with user profile, then mount the picker island
- [ ] 4.2 Wire picker's onScan callback to pass selected sources to `startScan()` → `scan()`
- [ ] 4.3 Update "Scan Again" flow to return to scan screen with picker (re-fetch playlists)

## 5. Verify

- [ ] 5.1 Run `npm run check` — all types, lint, format, and tests pass
- [ ] 5.2 Manual smoke test: login → picker shows playlists with images → uncheck some → scan runs only selected sources
