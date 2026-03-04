## Context

Spotless currently scans a user's Spotify library and playlists for unplayable tracks, displaying results in a flat read-only list. The app uses vanilla TypeScript with no framework, a thin DOM rendering layer (`h()` helper), and Tailwind CSS. The scan results screen in `src/ui.ts` renders each unplayable track as a row with thumbnail, name, artist, source, and reason.

The Spotify Web API provides a Search endpoint (`GET /search`) that can find tracks by name and artist, and mutation endpoints for adding/removing tracks from libraries and playlists. The current OAuth scopes are read-only.

## Goals / Non-Goals

**Goals:**
- Let users find replacement candidates for unplayable tracks without leaving the app
- Let users independently add replacements and remove originals from their library/playlists
- Keep the architecture consistent: pure logic modules + thin UI layer
- Maintain mobile-friendliness with the accordion pattern

**Non-Goals:**
- Manual search (typing a custom query) — deferred to a future change
- Batch actions ("replace all high-confidence matches") — deferred
- Spotify embedded player iframes — too heavy, use `preview_url` + fallback instead
- Fuzzy string matching libraries — simple normalization is sufficient for v1

## Decisions

### 1. New modules: `src/replacements.ts` and `src/actions.ts`

**Decision**: Create two new pure-logic modules separate from UI.

- `src/replacements.ts` — search for candidates and score confidence
- `src/actions.ts` — add/remove tracks via Spotify API

**Why**: Follows existing pattern (auth, api, scanner are all separate modules). Keeps logic testable without DOM. The UI layer just calls these and renders results.

**Alternative considered**: Putting search + actions in `src/api.ts`. Rejected because `api.ts` is a low-level HTTP wrapper — business logic (confidence scoring, source-aware add/remove) belongs in dedicated modules.

### 2. Confidence scoring: normalized string matching

**Decision**: Score candidates by comparing normalized artist and track names:
- Normalize: lowercase, strip parenthetical suffixes (Remaster, Deluxe, feat., etc.), trim
- ★★★ (3): Normalized artist match AND normalized title match
- ★★ (2): Normalized artist match AND one title contains the other (or vice versa)
- ★ (1): Everything else returned by search

**Why**: Simple, predictable, no dependencies. Users can see the stars and make their own judgment. Avoids false confidence — if we're not sure, we show ★ rather than overstating.

**Alternative considered**: Levenshtein distance or other fuzzy matching. Rejected — adds a dependency and the scoring would be opaque to users. Duration-based matching also considered and explicitly rejected for v1 simplicity.

### 3. Search query strategy

**Decision**: Use Spotify's field-filtered search: `track:"<name>" artist:"<artist>"` with `type=track&limit=3`. Strip parenthetical suffixes from the track name before searching. Filter out results with the same track URI as the original.

**Why**: Field filters give more relevant results than a plain text query. Limit of 3 keeps the UI compact and API usage low. Stripping "(Remaster)" etc. from the query broadens the match.

### 4. Accordion pattern for expandable rows

**Decision**: Each unplayable track row toggles open/closed on click. Only one row expanded at a time (closing the previous). Candidates are fetched on first expand and cached in a `Map<string, CandidateResult>`.

**Why**: Simple DOM manipulation, no framework needed. Single-open avoids vertical sprawl. Caching prevents re-fetching on collapse/re-expand. The `h()` helper already handles element creation.

**Alternative considered**: Side panel layout. Rejected — requires responsive breakpoint handling and is more complex for a frameworkless app. Accordion works well on both mobile and desktop.

### 5. Preview playback: hybrid approach

**Decision**: Each candidate row has a play button. If `preview_url` is available, play a 30-second clip via an HTML `<audio>` element. If not, the button opens the track in Spotify (web player URL). Visually distinguish the two (▶ for inline, ↗ for external).

**Why**: `preview_url` availability has been declining on Spotify's API — many tracks don't have one. The fallback ensures every candidate is auditable. A single shared `<audio>` element avoids multiple simultaneous playback.

### 6. Independent Add and Remove actions

**Decision**: "Add" and "Remove" are separate buttons with independent state. "Add" inserts the candidate into the same source as the original (playlist ID or Liked Songs). "Remove" deletes the original from that source. Each button transitions to a confirmation label after success.

**Why**: Users are protective of their libraries. Atomic "replace" (add + remove in one click) feels risky. Independent actions let users add without removing, remove without replacing, or do both. Mirrors how users think about the operations.

### 7. Extended UnplayableTrack type

**Decision**: Add `sourceId: string | null` (playlist ID, null for Liked Songs) and `trackUri: string` to the `UnplayableTrack` type. The scanner populates these during scan.

**Why**: The action endpoints need playlist IDs and track URIs. Carrying them on the track object avoids reverse-lookups or maintaining a separate mapping. `null` for Liked Songs is a clean sentinel since there's no playlist ID.

## Risks / Trade-offs

- **Re-auth required**: Adding write scopes forces existing users through Spotify's permission screen again → Unavoidable, but the app handles re-auth gracefully already via the token refresh → login redirect flow
- **`preview_url` increasingly unavailable**: Many tracks return `null` for preview → Mitigated by Spotify web player fallback link. UI makes it clear which type of preview is available
- **Rate limiting on search**: If a user has many unplayable tracks and rapidly expands rows → Mitigated by lazy loading (one search per expand) and caching (no re-fetch). The existing `api.ts` retry-after handling covers rate limit responses
- **Confidence scoring is approximate**: String matching won't catch all cases (e.g., transliterated artist names) → Acceptable for v1. The ★ rating sets expectations. Users make the final call
