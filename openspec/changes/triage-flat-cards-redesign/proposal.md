## Why

The current triage UX has too many interaction patterns competing for attention: checkboxes, accordion expand/collapse, radio buttons for candidates, a separate "remove original" toggle, confidence star ratings, filter chips, and summary counters. Users must understand three operation types (swap, addition, removal) and how checkbox behavior differs between sections. The "addition" concept (add replacement but keep dead track) contradicts the app's purpose. Tracks with candidates cannot be marked for removal-only — a functional gap. This redesign simplifies to a single interaction model: flat cards with click-to-select rows.

## What Changes

- **BREAKING**: Replace two-section accordion layout with a flat list of cards — each unplayable track is a card with all options visible inline (no expand/collapse)
- **BREAKING**: Replace checkbox + radio + toggle interaction model with click-to-select rows — click a candidate row to select it (green highlight + checkmark), click again to deselect
- **BREAKING**: Remove the "addition" operation type — selecting a replacement always removes the original ("replace" = add + remove as atomic pair)
- **BREAKING**: Remove the `removeOriginal` toggle — it no longer exists as a separate control
- **BREAKING**: Remove confidence star ratings and RECOMMENDED badges from UI — confidence is used only for sorting (highest first) and auto-selection logic
- **BREAKING**: Remove filter bar (All / Auto-proposed / Needs review / No match chips)
- **BREAKING**: Remove summary counters row ("N swapping · N removing · N no match")
- **BREAKING**: Remove per-section headers ("Tracks with swap candidates" / "No swap found") and select-all controls
- Add "Remove from {source}" as a clickable row inside each card — same visual treatment as candidate rows but with red highlight when selected, making remove-only possible for all tracks (including those with candidates)
- Simplify apply bar summary to "Replacing N, removing N" (two intents instead of three)
- Simplify review modal to show REPLACE and REMOVE operations (no more SWAP/ADD/RMV distinction)
- Auto-select best candidate for high-confidence (★★★) tracks on load (preserve existing auto-proposal behavior, just without visible stars)

## Capabilities

### New Capabilities

_(none — this is a redesign of existing capabilities)_

### Modified Capabilities

- `triage-ui`: Complete overhaul of layout (flat cards vs accordion), interaction model (click-to-select vs checkbox+radio+toggle), removal of filter bar, summary counters, section grouping, confidence indicators, and the removeOriginal toggle. Apply bar and review modal summary labels change.

## Impact

- **UI components**: All triage components rewritten — `TriageView`, `TrackRow`, `TrackExpansion`, `SwapSection`, `NoMatchSection`, `FilterBar`, `SummaryCounters` replaced with new `TrackCard` component. `ApplyBar` and `ReviewModal` updated for simplified operation types.
- **State**: `TriageTrack.removeOriginal` field removed — replace intent always implies removal. `selectedCandidateId` remains. Filter-related state (`filter`, `filteredTracks`, `counts`, `selectAllState`, `swapSelectAllState`, `noMatchSelectAllState`) removed. New "remove" intent support for tracks with candidates.
- **Operations**: `PendingOp` generation simplified — a "replace" always produces both add + remove ops. Standalone "remove" intent produces a remove-only op. The "addition" (add without remove) path is eliminated.
- **No API changes**: `batch.ts`, `track-actions`, `spotify-auth`, `replacement-search`, `library-scanner` are unaffected.
- **Tests**: Triage state tests updated for simplified state model. UI component tests rewritten.
