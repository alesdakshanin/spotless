## Context

Spotless currently handles track remediation one at a time: user expands a track, waits for search, picks a candidate, clicks add/remove. This works for 2–5 tracks but becomes tedious at 20+. The batch-triage change replaces the post-scan flow with a spreadsheet-like triage view backed by Preact, where the system pre-searches all tracks and proposes high-confidence matches, the user triages in bulk, and commits all changes in a single batch.

The existing codebase is vanilla TypeScript with direct DOM manipulation. Core logic modules (`scanner.ts`, `replacements.ts`, `actions.ts`, `api.ts`, `auth.ts`) are pure functions that remain untouched. The change is confined to the UI/orchestration layer.

## Goals / Non-Goals

**Goals:**
- Replace per-track interaction with batch triage workflow
- Automatic background search with progress visibility
- Auto-proposal of high-confidence (★★★) matches
- Filter + select-all for power-user fast path
- Explicit review-before-commit with confirmation modal
- Introduce Preact + signals for triage UI only (island architecture)

**Non-Goals:**
- Undo/rollback after batch apply (Spotify mutations are not reversible; confirmation modal is the safety net)
- Rewriting login, scan prompt, or progress screens in Preact (they stay vanilla)
- "Remove without replace" — tracks must have a selected candidate to be checked
- Keyboard navigation / shortcuts (future enhancement)
- Drag-and-drop reordering of tracks

## Decisions

### 1. Preact island architecture

**Decision:** Use Preact + `@preact/signals` only for the triage view. Existing vanilla screens (login, scan, progress) remain unchanged.

**Why:** The triage view has complex derived state (filter counts, select-all tri-state, apply bar visibility) that would require a hand-rolled reactivity system in vanilla TS. Preact adds ~4 KB gzipped. Signals add ~1.5 KB and provide fine-grained reactivity ideal for the "many independent rows with shared aggregates" pattern.

**Alternative considered:** Full Preact migration of all screens — rejected because existing screens are simple and stable, migration would be unnecessary churn.

**Alternative considered:** Stay vanilla — rejected because the triage state complexity (N tracks × {checked, selectedCandidate, removeOriginal, candidates, searchStatus} + filter + counts) would result in fragile manual DOM sync code.

**Integration point:** `main.ts` calls `render(<TriageView />, appElement)` where it currently calls `renderResults()`. To switch back to vanilla screens (scan again), unmount with `render(null, appElement)` before calling vanilla render functions.

### 2. Signal-based state with a single store

**Decision:** One `TriageStore` object holding all state as signals/computed values, passed to components via props (no context provider needed at this scale).

```
TriageStore {
  tracks: Signal<TriageTrack[]>         // all unplayable tracks with triage state
  filter: Signal<Filter>                // current active filter

  // Computed
  filteredTracks: Computed<TriageTrack[]>
  counts: Computed<FilterCounts>         // { all, autoProposed, needsReview, noMatch }
  pendingOps: Computed<PendingOp[]>      // derived from checked tracks
  selectAllState: Computed<"none" | "some" | "all">
}
```

**Why:** Signals give fine-grained reactivity — updating one track's `checked` state only re-renders that row + the computed aggregates (filter counts, apply bar). No virtual DOM diffing for the full list on every checkbox click.

**Alternative considered:** `useReducer` with immutable state updates — rejected because it would re-render the entire list on every state change. Preact's diffing would handle it fine at 50 tracks, but signals are a cleaner fit for the data flow pattern.

### 3. Background search orchestration

**Decision:** A `searchAllReplacements()` async function that runs after scan completes. It iterates through all unplayable tracks, calls the existing `searchReplacements()` for each, and updates the store progressively. Concurrency: sequential (one at a time) to respect Spotify rate limits, since the API client's 429 handling already retries but sequential avoids hammering.

**Why sequential:** The API client handles 429s with `Retry-After` backoff, but firing 50 parallel searches would trigger rate limits immediately. Sequential execution with the existing API client is simple and reliable.

**Progress:** A `searchProgress` signal `{ completed: number, total: number }` drives the progress indicator in the UI.

### 4. Triage component structure

```
src/triage/
  state.ts          — TriageStore creation and actions (toggleCheck, selectAll, setFilter, etc.)
  TriageView.tsx     — top-level component: filter bar + track list + apply bar
  TrackRow.tsx       — single track row with checkbox, metadata, candidate preview
  TrackExpansion.tsx — expanded panel with candidate list and selection
  FilterBar.tsx      — filter chips + selection count
  ApplyBar.tsx       — fixed bottom bar with counts + apply button
  ReviewModal.tsx    — confirmation modal with operation list + progress + completion
```

**Why this split:** Each component maps to a distinct visual region and state slice. `state.ts` is framework-agnostic (just signals + functions), making it testable without rendering.

### 5. Batch apply execution model

**Decision:** Operations execute sequentially: for each checked track, add replacement first, then remove original. One API call at a time.

**Why add-before-remove:** If the add fails, the user doesn't lose the original track. The original is only removed after its replacement is confirmed added.

**Failure handling:** Individual failures don't abort the batch. Failed operations are collected and shown in the completion summary with a retry option. The retry re-runs only the failed operations.

### 6. Post-apply track state

**Decision:** Applied tracks are dimmed (reduced opacity, non-interactive) but remain visible in the list. This preserves context so the user can see what was processed.

**Why not remove from list:** Removing tracks shifts the list layout, which is disorienting. Dimming communicates "done" without disrupting spatial memory.

## Risks / Trade-offs

**[Risk] Spotify rate limiting during background search for large libraries**
→ Sequential search + existing 429/Retry-After handling mitigates this. Worst case: search takes longer, but the user can start triaging tracks that already have results.

**[Risk] Preact + vanilla DOM coexistence**
→ Mitigated by clean mount/unmount boundaries. `render(<TriageView />, el)` owns the DOM subtree; vanilla code owns everything else. No shared DOM manipulation.

**[Risk] Large batch apply taking too long or timing out**
→ Sequential execution with per-operation progress keeps the user informed. 50 tracks × 2 ops = ~100 API calls at ~200ms each ≈ 20 seconds. The progress UI makes this tolerable. If individual calls fail, the batch continues.

**[Trade-off] No undo after apply**
→ Accepted. Spotify API mutations aren't trivially reversible. The confirmation modal with full operation review is the safety mechanism. Post-apply summary shows what was done for the user's records.

**[Trade-off] Sequential search is slower than parallel**
→ Accepted. 50 tracks × ~300ms/search ≈ 15 seconds sequential. Parallel would be faster but would hammer rate limits. The UX handles this by letting users triage tracks as results trickle in.
