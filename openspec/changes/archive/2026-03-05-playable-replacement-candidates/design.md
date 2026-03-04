## Context

The triage UI displays replacement candidates for unplayable tracks. Each `CandidateRow` shows thumbnail, track name, artist, confidence stars, and a radio button for selection. Users need to hear candidates before choosing a replacement.

Initially implemented with HTML `<audio>` and Spotify's `preview_url` (30-second clips), but Spotify has largely deprecated `preview_url` — most tracks return `null`. The implementation was pivoted to the Spotify Web Playback SDK for full-track playback.

## Goals / Non-Goals

**Goals:**
- Let users play full candidate tracks directly in the browser via Spotify Web Playback SDK
- Show a persistent mini player bar with album art, track info, and play/pause controls
- Provide a fallback (open in Spotify) when the SDK is not connected or user lacks Premium
- Keep the audio module testable and decoupled from the UI

**Non-Goals:**
- Playback progress bar or seek controls (play/pause toggle is sufficient for quick previewing)
- Previous/next track controls (users skim by clicking play on different candidates)
- Persisting playback state across screen transitions

## Decisions

### 1. Spotify Web Playback SDK for playback

**Decision**: Use the Web Playback SDK (`https://sdk.scdn.co/spotify-player.js`) to create a virtual playback device in the browser. Play tracks via `PUT /me/player/play?device_id=<id>` with `{ uris: [trackUri] }`. Requires OAuth scopes `streaming` and `user-modify-playback-state`.

**Rationale**: Spotify has deprecated `preview_url` for most tracks, making the HTML `<audio>` approach unreliable. The SDK provides full-track playback with bidirectional sync — if the user controls playback from the real Spotify app, the UI updates automatically via the `player_state_changed` event.

**Trade-off**: Requires Spotify Premium. Free-tier users see the external link fallback.

### 2. Two-signal reactive state

**Decision**: Use two Preact signals — `playingUri` (null when paused/stopped, holds URI when actively playing) and `nowPlaying` (full track metadata including paused state, persists until dismissed). Components read `playingUri` for button state (▶/⏸) and `nowPlaying` for the mini player display.

**Rationale**: `playingUri` drives the candidate row buttons (simple: playing or not). `nowPlaying` drives the mini player which needs to stay visible when paused so the user can resume. Both are updated reactively from the SDK's `player_state_changed` event — no manual state tracking.

### 3. SDK not connected → open Spotify web player

**Decision**: When `sdkReady` signal is false, the play button becomes an external link (`https://open.spotify.com/track/{id}`) opening in a new tab with a distinct icon (↗).

**Rationale**: The SDK takes 2-3 seconds to connect after mount. During that window (and for non-Premium users), the external link provides a graceful fallback. The `sdkReady` signal acts as a progressive enhancement gate.

### 4. Mini player bar stacked above ApplyBar

**Decision**: A `MiniPlayer` component renders in a fixed bottom wrapper alongside the existing `ApplyBar`. The wrapper uses `flex-col` so MiniPlayer stacks above ApplyBar. Both bars are independently conditional — MiniPlayer shows when `nowPlaying` is set, ApplyBar shows when there are pending operations.

**Rationale**: The stacked approach avoids merging unrelated concerns (playback vs. apply actions) into one bar. Bottom padding (`pb-36`) on the main content ensures nothing is hidden behind the bars.

### 5. Button placement in CandidateRow

**Decision**: Place the play button between the thumbnail and the track info, as a small icon button. Clicking the play button does NOT select the candidate (uses `e.stopPropagation()`).

**Rationale**: Keeps the interaction target distinct from the radio selection. Minimum 32×32 touch target with visible background (`bg-white/[0.06]`) ensures discoverability.

## Risks / Trade-offs

- **Spotify Premium required**: The SDK only works with Premium accounts. → Mitigation: `sdkReady` signal gates the UI; non-Premium users get the external link fallback.
- **SDK connection latency**: Takes 2-3 seconds to connect. → Mitigation: SDK connects in parallel with replacement search, and `sdkReady` provides progressive enhancement.
- **Re-authorization required**: Adding new OAuth scopes means existing users must re-authorize. → Mitigation: On next login, Spotify prompts for the new permissions automatically.
- **Audio autoplay restrictions**: Browsers may block audio playback without user gesture. → Mitigation: Playback is always triggered by an explicit button click.
