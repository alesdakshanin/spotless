## Why

When users see replacement candidates for unplayable tracks, they have no way to listen before choosing. They must blindly trust the confidence stars or open Spotify manually. Adding inline preview playback lets users hear candidates before committing, making the replacement decision faster and more confident.

## What Changes

- Add a play/preview button to each candidate row in the triage UI
- If the candidate has a `preview_url`, clicking plays a 30-second audio clip inline via an HTML `<audio>` element
- If no `preview_url` is available, clicking opens the track in Spotify's web player in a new tab
- Visually distinguish inline preview (▶ / ⏸) from external link (↗)
- Only one preview plays at a time — starting a new one stops the current one
- Show playback progress on the active preview button

## Capabilities

### New Capabilities

_(none — this is implementing an existing spec requirement)_

### Modified Capabilities

- `replacement-search`: The "Candidate preview playback" requirement (already spec'd) needs to be implemented. No spec changes required — the requirement is already defined.
- `scan-ui`: The "Candidate row display" requirement mentions a preview/play button but the UI doesn't render one yet. No spec changes required.

## Impact

- **UI**: `src/triage/TrackExpansion.tsx` — add play button to `CandidateRow`
- **Audio**: New audio playback module to manage a shared `<audio>` element (play, pause, stop, singleton behavior)
- **Data**: `previewUrl` already flows through `ReplacementCandidate` — no type changes needed
- **Dependencies**: None — uses native HTML `<audio>` element
- **Testing**: New tests for audio playback logic; UI tests for button states
