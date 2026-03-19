## 1. State model redesign

- [ ] 1.1 Replace `TriageTrack` interface: remove `checked` and `removeOriginal` fields, add `intent: 'skip' | 'replace' | 'remove'` field
- [ ] 1.2 Rewrite `createTriageStore`: remove filter, counts, selectAllState, swapSelectAllState, noMatchSelectAllState, filteredTracks computed signals. Keep tracks, searchProgress, expandedTrackId (remove if unused), pendingOps, selectedCount
- [ ] 1.3 Rewrite `pendingOps` computed: replace → emit add + remove ops; remove → emit remove op only; skip → nothing. Eliminate the removeOriginal conditional and the no-match special case
- [ ] 1.4 Replace `toggleCheck` with `selectCandidate(store, trackId, candidateUri)` that sets intent to 'replace' (or toggles to 'skip' if same candidate re-clicked) and `toggleRemove(store, trackId)` that toggles between 'remove' and 'skip'
- [ ] 1.5 Remove actions: `toggleRemoveOriginal`, `selectAllVisible`, `deselectAllVisible`, `selectAllSwapSection`, `deselectAllSwapSection`, `selectAllNoMatchSection`, `deselectAllNoMatchSection`, `setFilter`
- [ ] 1.6 Update `searchAllReplacements`: auto-proposal sets `intent: 'replace'` and `selectedCandidateId` for confidence-3 tracks (no removeOriginal)
- [ ] 1.7 Update `state.test.ts`: rewrite tests for new intent-based state model, remove tests for removed features (filters, select-all, removeOriginal)

## 2. Operation summary

- [ ] 2.1 Update `summarizeOps.ts`: replace swap/addition/removal with replacing/removing counts. "Replacing N, removing N" format
- [ ] 2.2 Update `SectionCounts` type or remove it — replace with a simpler count derived from intent values

## 3. TrackCard component

- [ ] 3.1 Create `TrackCard.tsx`: card with header (album art 44×44, track name with conditional strikethrough, artist, source tag, restriction badge) and body (candidate rows + remove row)
- [ ] 3.2 Implement candidate rows: clickable, green border + checkmark when selected, click-to-toggle behavior. No confidence stars or RECOMMENDED badges
- [ ] 3.3 Implement remove row: red ✕ icon square, "Remove from {source}" label, red border + red checkmark when selected, click-to-toggle behavior
- [ ] 3.4 Implement radio behavior: selecting any row deselects the previously selected option within the same card
- [ ] 3.5 Implement no-candidates card variant: "No replacement candidates found." message + remove row only

## 4. TriageView simplification

- [ ] 4.1 Update `TriageView.tsx`: render flat list of TrackCard components (no section wrappers, no filter bar, no summary counters). Keep progress bar, apply bar, review modal, mini player
- [ ] 4.2 Remove imports and usage of `FilterBar`, `SummaryCounters`, `SwapSection`, `NoMatchSection`

## 5. ApplyBar and ReviewModal updates

- [ ] 5.1 Update `ApplyBar.tsx`: use new summarizeOps output ("Replacing N, removing N")
- [ ] 5.2 Update `ReviewModal.tsx`: replace SWAP/ADD/RMV grouping with REPLACE/REMOVE grouping. Update `groupOpsForReview` to identify replace (has both add + remove for same trackId) vs remove-only
- [ ] 5.3 Update review modal summary subtitle to match new format

## 6. Delete unused components

- [ ] 6.1 Delete `FilterBar.tsx`, `SummaryCounters.tsx`, `SwapSection.tsx`, `NoMatchSection.tsx`, `TrackRow.tsx`, `TrackExpansion.tsx`

## 7. Verify and clean up

- [ ] 7.1 Run `npx @biomejs/biome check --write` then `npm run check` — fix any type errors, lint issues, test failures
- [ ] 7.2 Manual smoke test: run `npm run dev`, scan library, verify flat card layout, click-to-select, remove row, apply bar, review modal
