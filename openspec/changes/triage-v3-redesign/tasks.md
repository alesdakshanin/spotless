## 1. State model updates

- [x] 1.1 Update `pendingOps` computed signal to generate REMOVE ops for checked no-match tracks (checked=true, candidates empty, searchStatus=done)
- [x] 1.2 Add `sectionCounts` computed signal to the store (swapping, removing, noMatch)
- [x] 1.3 Add per-section select-all actions: `selectAllSwapSection`, `deselectAllSwapSection`, `selectAllNoMatchSection`, `deselectAllNoMatchSection`
- [x] 1.4 Add per-section `selectAllState` computed signals (one for swap section, one for no-match section)
- [x] 1.5 Update `toggleCheck` to work for no-match tracks (enable checking instead of early-return)
- [x] 1.6 Write/update tests for new pendingOps behavior with no-match removals
- [x] 1.7 Write tests for section counts and per-section select-all actions

## 2. Two-section layout

- [x] 2.1 Create `SwapSection` component — section header + select-all + track rows for candidates > 0
- [x] 2.2 Create `NoMatchSection` component — section header + select-all + track rows for no-match tracks
- [x] 2.3 Update `TriageView` to render both sections instead of source-grouped list
- [x] 2.4 Handle section visibility: hide SwapSection when empty, hide NoMatchSection when empty
- [x] 2.5 Integrate filter bar with section visibility (e.g., "No match" filter hides SwapSection entirely)

## 3. Track row visual changes

- [x] 3.1 Add `variant` prop to TrackRow ("swap" | "removal") for checkbox color differentiation
- [x] 3.2 Implement red/destructive checkbox styling for removal variant
- [x] 3.3 Add strikethrough styling on track name when a no-match track is checked for removal
- [x] 3.4 Add destructive-tinted background for checked removal rows

## 4. Summary counters

- [x] 4.1 Create `SummaryCounters` component displaying "N swapping · N removing · N no match"
- [x] 4.2 Wire counters to `sectionCounts` signal and render above filter bar in TriageView

## 5. Progress text and apply bar updates

- [x] 5.1 Update progress indicator text from "Finding replacements" to "Finding swaps" and "Swap search complete"
- [x] 5.2 Disable "Apply Changes" button while background search is in progress (muted styling, non-clickable)
- [x] 5.3 Enable "Apply Changes" button once search completes

## 6. Review modal redesign

- [x] 6.1 Replace ADD/REMOVE badges with SWAP (green) and RMV (red) badges
- [x] 6.2 Group SWAP items first, then RMV items with a visual separator
- [x] 6.3 Show SWAP items as single atomic entries (candidate name + destination, no separate REMOVE line)
- [x] 6.4 Update modal subtitle to use summarizeOps output
- [x] 6.5 Update completion summary to show "N swaps, N removals" breakdown

## 7. Filter bar cleanup

- [x] 7.1 Remove the global select-all control from FilterBar (moved to per-section)
- [x] 7.2 Keep filter chips and selected count in FilterBar
