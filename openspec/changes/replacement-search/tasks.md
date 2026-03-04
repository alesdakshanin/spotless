## 1. Auth & Type Foundation

- [x] 1.1 Add write scopes (`user-library-modify`, `playlist-modify-public`, `playlist-modify-private`) to the OAuth scope list in `src/auth.ts`
- [x] 1.2 Extend `UnplayableTrack` type in `src/types.ts` with `sourceId: string | null` and `trackUri: string`
- [x] 1.3 Update the scanner in `src/scanner.ts` to populate `sourceId` and `trackUri` when creating `UnplayableTrack` entries

## 2. Replacement Search Module

- [x] 2.1 Create `src/replacements.ts` with a `searchReplacements(track: UnplayableTrack): Promise<Candidate[]>` function that queries `GET /search` with field-filtered query, filters out the original URI, and returns up to 3 candidates
- [x] 2.2 Implement the `normalizeTitle(name: string): string` helper that strips parenthetical suffixes and lowercases
- [x] 2.3 Implement the `scoreConfidence(original: UnplayableTrack, candidate: SpotifyTrack): 1 | 2 | 3` function using normalized string comparison
- [x] 2.4 Add tests for `normalizeTitle` — covers parentheticals, dashes, "feat." variants, edge cases
- [x] 2.5 Add tests for `scoreConfidence` — covers exact match, partial match, different artist cases
- [x] 2.6 Add tests for `searchReplacements` — mock API responses, verify filtering and scoring

## 3. Track Actions Module

- [x] 3.1 Create `src/actions.ts` with `addTrack(trackUri: string, source: { type: 'liked' } | { type: 'playlist'; id: string }): Promise<void>` that calls the appropriate Spotify API endpoint
- [x] 3.2 Add `removeTrack(trackUri: string, source: { type: 'liked' } | { type: 'playlist'; id: string }): Promise<void>` to `src/actions.ts`
- [x] 3.3 Add tests for `addTrack` — mock API calls for both Liked Songs and playlist targets
- [x] 3.4 Add tests for `removeTrack` — mock API calls for both Liked Songs and playlist targets

## 4. Accordion UI

- [x] 4.1 Refactor the results row in `src/ui.ts` to be clickable and toggle an expansion panel (collapsed by default, only one open at a time)
- [x] 4.2 On first expand, call `searchReplacements` and show a loading state; render candidates on completion (or "No replacements found" if empty)
- [x] 4.3 Implement candidate result caching in a `Map` so re-expanding a row uses cached results
- [x] 4.4 Render each candidate row with: thumbnail, name, artist, confidence stars (★★★/★★/★), preview button, and "Add" button
- [x] 4.5 Add "Remove original" button in the expanded section, independent of candidate actions

## 5. Preview Playback

- [x] 5.1 Add a shared `<audio>` element managed at the results screen level for inline preview playback
- [x] 5.2 Wire the preview button: if `preview_url` exists, play/pause the clip (▶ icon); if not, open Spotify web player URL in a new tab (↗ icon)
- [x] 5.3 Ensure starting a new preview stops any currently playing one

## 6. Action Wiring & State Feedback

- [x] 6.1 Wire "Add" button to call `addTrack` with the candidate's URI and the original track's source; transition button to "✓ Added" on success
- [x] 6.2 Wire "Remove original" button to call `removeTrack` with the original track's URI and source; transition button to "✓ Removed" on success
- [x] 6.3 Show error indication on the button if an action fails (button stays interactive for retry)
- [x] 6.4 When collapsing a resolved track (both added and removed), show resolution badges ("✓ Replaced", "✓ Removed") in the collapsed row instead of the restriction reason

## 7. Integration & Polish

- [x] 7.1 Run `npm run check` — fix any type errors, lint issues, or test failures
- [ ] 7.2 Manual testing: end-to-end flow with real Spotify account — expand, preview, add, remove
