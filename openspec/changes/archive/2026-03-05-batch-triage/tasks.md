## 1. Setup & Dependencies

- [x] 1.1 Install Preact, @preact/preset-vite, and @preact/signals (`npm install preact @preact/preset-vite @preact/signals`)
- [x] 1.2 Configure Vite with Preact plugin (update `vite.config.ts` with `preact()` plugin, configure JSX)
- [x] 1.3 Update TypeScript config for Preact JSX (`jsxImportSource: "preact"`, add `src/triage/` path)
- [x] 1.4 Create `src/triage/` directory structure: `state.ts`, `TriageView.tsx`, `TrackRow.tsx`, `TrackExpansion.tsx`, `FilterBar.tsx`, `ApplyBar.tsx`, `ReviewModal.tsx`
- [x] 1.5 Verify Preact renders a hello-world component in the app, then remove it

## 2. Triage State & Background Search

- [x] 2.1 Define TypeScript types: `TriageTrack`, `Filter`, `FilterCounts`, `PendingOp`, `SearchProgress` in `src/triage/state.ts`
- [x] 2.2 Implement `createTriageStore()` — signals for `tracks`, `filter`, `searchProgress`; computed for `filteredTracks`, `counts`, `pendingOps`, `selectAllState`
- [x] 2.3 Implement store actions: `toggleCheck`, `selectCandidate`, `toggleRemoveOriginal`, `setFilter`, `selectAllVisible`, `deselectAllVisible`
- [x] 2.4 Implement `searchAllReplacements()` — async function that iterates tracks, calls existing `searchReplacements()` sequentially, updates store progressively with candidates and auto-proposals for ★★★ matches
- [x] 2.5 Write tests for triage store: state initialization, toggleCheck auto-selects best candidate, uncheck clears selection, auto-proposal logic, filter counts, select-all behavior
- [x] 2.6 Write tests for `searchAllReplacements()`: progress tracking, candidate storage, auto-proposal triggering

## 3. Triage List UI

- [x] 3.1 Implement `TriageView.tsx` — top-level component that renders search progress bar, filter bar, select-all, track list, and apply bar
- [x] 3.2 Implement `TrackRow.tsx` — single row: checkbox, thumbnail, track name/artist, source tag, restriction badge, confidence indicator, candidate preview text
- [x] 3.3 Implement source grouping — group tracks by source with header labels (Liked Songs first, playlists alphabetical)
- [x] 3.4 Implement visual states: auto-proposed row accent, pending search shimmer, no-match disabled state, post-apply dimmed state
- [x] 3.5 Implement `TrackExpansion.tsx` — accordion panel: candidate sub-rows with radio selection, star rating, "Recommended" badge, remove-original toggle; empty state for no candidates

## 4. Filter Bar & Select All

- [x] 4.1 Implement `FilterBar.tsx` — filter chips (All, ★★★ Auto-proposed, ★★ Needs review, No match) with counts, mutually exclusive selection, selected-tracks count on right
- [x] 4.2 Implement select-all control — tri-state checkbox (unchecked/partial/full), operates on visible subset, skips no-candidate tracks
- [x] 4.3 Wire filter changes: collapse expanded rows on filter switch, update select-all scope

## 5. Apply Bar & Review Modal

- [x] 5.1 Implement `ApplyBar.tsx` — fixed bottom bar, slide up/down animation, dynamic summary counts ("N replacements + N removals"), "Apply Changes" button
- [x] 5.2 Implement `ReviewModal.tsx` review state — modal overlay with scrollable operation list (ADD/REMOVE badges, track names, sources, confidence), Cancel and "Apply N changes" buttons
- [x] 5.3 Implement `ReviewModal.tsx` progress state — spinner, "Applying... X/Y" text, progress bar
- [x] 5.4 Implement `ReviewModal.tsx` completion state — checkmark, success message, operation count, "Done" button; partial failure variant with failed items list and "Retry" button

## 6. Batch Execution

- [x] 6.1 Implement `executeBatch()` — takes pending ops, executes sequentially using existing `addTrack`/`removeTrack`, ADD before REMOVE per track, skip REMOVE if ADD fails, report progress callback
- [x] 6.2 Implement partial failure collection and retry logic — collect failed ops, "Retry" re-executes only failures
- [x] 6.3 Write tests for `executeBatch()`: sequential execution order, add-before-remove, skip-remove-on-add-failure, progress reporting, partial failure collection

## 7. Integration & Wiring

- [x] 7.1 Update `main.ts` post-scan flow: after scan completes, create triage store from unplayable tracks, mount `<TriageView>` via Preact `render()`, trigger `searchAllReplacements()`
- [x] 7.2 Wire "Scan Again" — unmount Preact triage view (`render(null, el)`), re-run scan flow
- [x] 7.3 Wire "Done" after apply — dim applied tracks in triage list
- [x] 7.4 Remove old results rendering code from `ui.ts` (`renderResults` and related accordion/expansion logic)
- [x] 7.5 Run `npm run check` — fix any type errors, lint issues, test failures
