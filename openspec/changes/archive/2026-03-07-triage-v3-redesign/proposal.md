## Why

The current triage view mixes tracks with swap candidates and tracks with no matches into a single list grouped by source (playlist). This makes it hard to process tracks efficiently at scale — users can't quickly act on all no-match tracks or bulk-review only high-confidence swaps. No-match tracks currently have their checkbox disabled, offering no action path. The v3 redesign splits the triage view into two intent-based sections with independent controls, enabling a power-user workflow that handles 20–50 tracks efficiently.

## What Changes

- Split the triage list into two sections: "Tracks with swap candidates" and "No swap found," each with its own select-all control
- Add a "No swap found" section where users can mark no-match tracks for removal (red checkboxes, strikethrough styling)
- Add summary counters at the top: "N swapping · N removing · N no match"
- Change track grouping from by-source to by-intent (has candidates vs no match)
- Add per-section select-all with contextual labels ("Select all with candidates" / "Select all for removal")
- Color-differentiate checkboxes: green/accent for swaps, red/destructive for removals
- Redesign the review modal: use SWAP/RMV badges, group SWAPs first and RMVs at the bottom
- Update progress text from "Finding replacements" to "Finding swaps"
- Add `markedForRemoval` state field for no-match tracks, separate from `removeOriginal`

## Capabilities

### New Capabilities

_None — all changes modify existing capabilities._

### Modified Capabilities

- `triage-ui`: Restructure into two intent-based sections, add summary counters, per-section select-all, no-match removal with red checkboxes and strikethrough, color-differentiated checkboxes, and updated progress text
- `batch-apply`: Review modal uses SWAP/RMV badges grouped by type; completion summary uses swap/removal counts

## Impact

- `src/triage/TriageView.tsx` — restructure layout from source-grouped to section-based
- `src/triage/TrackRow.tsx` — color-differentiated checkboxes, strikethrough for no-match removals
- `src/triage/FilterBar.tsx` — summary counters, per-section select-all controls
- `src/triage/ReviewModal.tsx` — SWAP/RMV badges, grouped display
- `src/triage/ApplyBar.tsx` — already uses swap/addition/removal terminology (done)
- `src/triage/summarizeOps.tsx` — already uses track-level intent grouping (done)
- `src/triage/state.ts` — add `markedForRemoval` field, update `pendingOps` computation, new section-aware select-all actions
- `src/triage/state.test.ts` — update tests for new state model and actions
