## Context

The triage view currently renders all unplayable tracks in a single flat list grouped by source (playlist). All tracks share one select-all control. Tracks with no candidates have their checkbox disabled — the user has no action path for them. The v3 spec introduces a two-section layout that splits tracks by intent: those with swap candidates and those without.

The state model currently has three per-track fields: `checked`, `selectedCandidateId`, and `removeOriginal`. No-match tracks cannot be checked at all. The redesign needs a way for no-match tracks to be independently marked for removal.

## Goals / Non-Goals

**Goals:**
- Split the triage view into two sections with independent select-all controls
- Enable removal of no-match tracks as a first-class action
- Add summary counters for at-a-glance status
- Visually distinguish swap actions (green) from removal actions (red)
- Update the review modal to group operations by type (SWAP then RMV)

**Non-Goals:**
- Changing the scan or background search logic
- Changing how batch execution works (ADD/REMOVE ops stay the same)
- Adding keyboard shortcuts or drag-and-drop reordering
- Changing the filter chip categories (they stay the same)

## Decisions

### 1. Unified `checked` + `removeOriginal` instead of new `markedForRemoval`

The spec proposes a separate `markedForRemoval` boolean for no-match tracks. Instead, we'll reuse the existing `checked` boolean for no-match tracks and interpret it as "marked for removal." When a no-match track is checked, a REMOVE op is generated. This avoids a parallel state field and keeps the state model simpler.

**How it works:**
- Track with candidates: `checked` = include in batch, `selectedCandidateId` = which candidate, `removeOriginal` = also remove dead track
- Track without candidates: `checked` = mark for removal. `selectedCandidateId` stays null, `removeOriginal` is irrelevant.

The `pendingOps` computed signal already handles both paths — it just needs to also generate a REMOVE op when a no-match track is `checked`.

**Alternative considered:** Adding `markedForRemoval` as the spec suggests. Rejected because it creates two booleans that both mean "include this track in the batch" with unclear interaction rules. The `checked` field already serves that purpose.

### 2. Section-based layout with component decomposition

Replace the current source-based grouping (`groupBySource`) with two section components:

- `SwapSection` — renders tracks where `candidates.length > 0`, with its own select-all ("Select all with candidates")
- `NoMatchSection` — renders tracks where `searchStatus === "done" && candidates.length === 0`, with its own select-all ("Select all for removal")

Each section component receives filtered tracks and renders its own select-all + track list. The filter bar still operates globally and may hide entire sections (e.g., filtering to "No match" hides the swap section).

**Alternative considered:** Keeping a single list with visual separators. Rejected because independent select-all controls per section require distinct component boundaries for clean state management.

### 3. Summary counters derived from existing signals

Add a `sectionCounts` computed signal to the store:

```
{
  swapping: number,   // checked tracks with candidates
  removing: number,   // checked no-match tracks + checked tracks with removeOriginal
  noMatch: number     // total no-match tracks
}
```

These are purely derived from `tracks` — no new state needed.

### 4. Review modal: SWAP/RMV badges with grouped display

The review modal currently shows individual ADD/REMOVE ops in track order. The redesign groups them:

- **SWAP group** (first): Each swap item shows the candidate being added and its destination. The implicit removal of the original is not shown as a separate line — the SWAP badge covers both operations.
- **RMV group** (below, with separator): Each removal shows the track being removed and from which source.

This is a UI-only change — the underlying `PendingOp` model and batch execution remain the same (still ADD + REMOVE ops). The modal just presents them differently.

### 5. Checkbox color differentiation via section context

Rather than adding a color prop to every checkbox, each section determines the checked-state color:
- `SwapSection` uses accent/green for checked state
- `NoMatchSection` uses red/destructive for checked state

This is achieved by passing a `variant` prop to TrackRow: `"swap" | "removal"`.

## Risks / Trade-offs

**[Filter interaction with sections]** → When a filter like "★★★ Auto-proposed" is active, the NoMatchSection should be hidden entirely. When "No match" is active, the SwapSection should be hidden. The "All" filter shows both. Need to handle section visibility correctly in each filter state.

**[Select-all scope change]** → Currently there's one global select-all. Moving to per-section select-all means the filter bar's select-all is removed. The select-all controls live inside each section header. This is a UX change users of the existing version might notice.

**[No-match tracks during search]** → While the background search is still running, a track has no candidates yet but might get some. These tracks should NOT appear in the "No swap found" section until their search completes. They should remain in a pending state, not in either section.
