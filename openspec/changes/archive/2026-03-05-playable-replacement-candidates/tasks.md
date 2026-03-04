## 1. OAuth scopes and SDK types

- [x] 1.1 Add `streaming` and `user-modify-playback-state` scopes to `SCOPES` in `src/auth.ts`
- [x] 1.2 Create `src/spotify-sdk.d.ts` with TypeScript declarations for `Spotify.Player`, `WebPlaybackState`, `WebPlaybackInstance`, and event listener overloads

## 2. Audio playback module (Web Playback SDK)

- [x] 2.1 Rewrite `src/audio.ts` — load SDK script dynamically, create `Spotify.Player`, manage device connection lifecycle. Export signals: `playingUri`, `nowPlaying` (track metadata + paused state), `sdkReady`
- [x] 2.2 Implement `play(spotifyUri)` — play via `PUT /me/player/play?device_id=<id>`, pause if same track already playing
- [x] 2.3 Implement `togglePlay()`, `stop()`, `dismiss()` (stop + clear nowPlaying), `disconnect()` (cleanup)
- [x] 2.4 Wire `player_state_changed` listener to drive `playingUri` and `nowPlaying` signals reactively
- [x] 2.5 Write tests for `src/audio.ts` — mock `Spotify.Player` and `put` API, verify play/pause/toggle/dismiss/disconnect behavior

## 3. Play button in CandidateRow

- [x] 3.1 Update `CandidateRow` in `src/triage/TrackExpansion.tsx` — when `sdkReady`, show ▶/⏸ button that calls `play(candidate.track.uri)`. When SDK not ready, show ↗ link to Spotify. Use `e.stopPropagation()` to prevent radio selection.

## 4. Mini player bar

- [x] 4.1 Create `src/triage/MiniPlayer.tsx` — album art, track name/artist, play/pause toggle, dismiss (✕) button. Reads `nowPlaying` signal, hidden when null.
- [x] 4.2 Refactor `ApplyBar.tsx` — remove fixed positioning (moved to parent wrapper)
- [x] 4.3 Update `TriageView.tsx` — wrap MiniPlayer + ApplyBar in a `fixed bottom-0 z-50 flex-col` container. Increase content padding to `pb-36`.

## 5. Lifecycle

- [x] 5.1 Call `initPlayer()` in `mountTriageView` (fire-and-forget, connects in background alongside replacement search)
- [x] 5.2 Call `disconnect()` in `unmountTriageView` to release SDK resources

## 6. Verify

- [x] 6.1 Run `npm run check` — all types, lint, format, and 134 tests pass
