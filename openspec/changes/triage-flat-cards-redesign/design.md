## Context

The triage view is a Preact island (`src/triage/`) that mounts after a scan completes. It currently uses 10 components: `TriageView`, `TrackRow`, `TrackExpansion`, `SwapSection`, `NoMatchSection`, `FilterBar`, `SummaryCounters`, `ApplyBar`, `ReviewModal`, `MiniPlayer`. State is managed via `@preact/signals` in `state.ts`, with `batch.ts` handling API execution. The prototype (`demo-triage-final.html`, "Unified rows" tab) establishes the target interaction model.

## Goals / Non-Goals

**Goals:**
- Single interaction model: click a row to select, click again to deselect — for both candidates and removal
- Every option visible at once — no hidden state behind accordions
- Two intents only: Replace (add + remove) and Remove (remove only). No "addition" path.
- Remove-only available for all tracks, including those with candidates
- Maintain auto-proposal behavior for high-confidence matches (just without visible confidence indicators)

**Non-Goals:**
- Changing the batch execution logic (`batch.ts`) — it already handles add/remove ops independently
- Changing the replacement search algorithm or confidence scoring
- Changing the mini player or audio playback
- Mobile-specific layout — current responsive approach (hiding source tag on small screens) is sufficient
- Spotify link integration on candidate rows (can be added later; prototype omits them for simplicity)

## Decisions

### 1. Flat card component replaces 5 existing components

**Decision**: Replace `TrackRow`, `TrackExpansion`, `SwapSection`, `NoMatchSection`, and `SummaryCounters` with a single `TrackCard` component.

**Rationale**: The card is self-contained — it renders the unplayable track header and all action rows (candidates + remove). No need for section wrappers when there's no section grouping. One component is easier to reason about and test.

**Alternative considered**: Keep separate components for "with candidates" vs "no candidates" cards. Rejected because the card structure is identical — the only difference is whether candidate rows are present above the remove row.

### 2. State model: replace `removeOriginal` + `checked` with `intent` enum

**Decision**: Replace the current `{ checked, selectedCandidateId, removeOriginal }` triplet with `{ intent: 'skip' | 'replace' | 'remove', selectedCandidateId }`.

**Rationale**: The current three booleans create 8 possible states, most of which are invalid. An intent enum has exactly 3 valid states, which maps 1:1 to the UI. `selectedCandidateId` is only meaningful when `intent === 'replace'`.

**Alternative considered**: Keep `checked` + `selectedCandidateId` and derive intent from them. Rejected because it preserves the ambiguity that caused the original UX confusion.

### 3. Click-to-select with toggle-off on re-click

**Decision**: Clicking a candidate row sets `intent: 'replace'` with that candidate. Clicking the same row again sets `intent: 'skip'`. Clicking the remove row toggles between `intent: 'remove'` and `intent: 'skip'`. Selecting any option automatically deselects the previous one (radio behavior).

**Rationale**: This matches the prototype interaction model that was validated. No separate checkbox needed — the row IS the control.

### 4. Remove row is a visual peer to candidate rows

**Decision**: The "Remove from {source}" option is rendered as a full clickable row with the same layout as candidate rows: an icon placeholder (red ✕ on tinted background), text label, and checkmark when selected. When selected, it highlights with a red border (vs green for candidates).

**Rationale**: Making remove a peer option (same visual weight, same interaction) solves the original problem of not being able to remove tracks that have candidates. It also eliminates the need for separate no-match section styling.

### 5. Remove filter bar and summary counters

**Decision**: Remove `FilterBar` and `SummaryCounters` entirely. The apply bar at the bottom is the only summary of pending actions.

**Rationale**: With flat cards, every decision is visible on screen — there's nothing to filter to. The apply bar already shows "Replacing N, removing N" which is the only count users need. Confirmed during prototype evaluation.

### 6. Confidence drives sort order and auto-selection, not UI display

**Decision**: Keep the confidence scoring system internally. High-confidence (3) tracks get auto-selected on load. Candidates within a card are sorted by confidence descending. But no stars, badges, or confidence indicators are rendered.

**Rationale**: Users don't need to understand what ★★☆ means. They see the best option listed first and pre-selected. The algorithm's confidence is an implementation detail.

### 7. pendingOps computation simplification

**Decision**: When `intent === 'replace'`: emit both an `add` op (with `candidateUri`) and a `remove` op. When `intent === 'remove'`: emit only a `remove` op. When `intent === 'skip'`: emit nothing. No more conditional `removeOriginal` check.

**Rationale**: This eliminates the "addition" path entirely. The `summarizeOps` function simplifies to counting tracks with both ops (replacing) vs remove-only (removing).

### 8. Keep `TriageView` as the top-level orchestrator

**Decision**: `TriageView` remains but is simplified — it renders the progress bar, the flat list of `TrackCard` components, the apply bar, and the review modal. No section wrappers, no filter bar.

**Rationale**: The orchestrator pattern is still useful for managing modal state and the apply flow. Just with fewer children.

## Risks / Trade-offs

**Long page with many tracks** → With 20+ unplayable tracks at 2-3 candidates each, the page becomes long. Mitigated by: cards are compact (each candidate row is ~40px), and most users won't have huge numbers of unplayable tracks. Can add virtual scrolling later if needed.

**No bulk actions** → Removing select-all controls means users must interact with each card individually. Mitigated by: auto-proposal handles the common case (high-confidence matches are pre-selected). For the remaining tracks, individual decisions are the right UX — bulk actions on uncertain matches are dangerous.

**No filtering** → Users can't filter to "needs review" tracks. Mitigated by: with flat cards, you can visually scan for cards without a green-highlighted row. If this becomes a pain point, we can add a simple "Show only unresolved" toggle later.

**Losing the "addition" operation** → Power users who want to keep the dead track AND add a replacement lose this option. Mitigated by: this use case contradicts the app's purpose (cleaning up dead tracks). Users can manually add tracks in Spotify if needed.
