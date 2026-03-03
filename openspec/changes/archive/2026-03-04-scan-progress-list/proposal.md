## Why

During scanning, the progress UI overwrites a single line per source. With small playlists that scan in one API round-trip, users only see the Liked Songs progress — playlist scans flash by too fast to notice. Users can't tell which playlists were scanned or how many remain.

## What Changes

- Replace the single-line progress display with an accumulating list of all scan sources
- Show all upcoming sources (dimmed) before scanning begins, so users see the full scope upfront
- Each source transitions through states: pending → in-progress (with live count) → completed (with checkmark and final count)
- Add a new scanner event to emit the full list of sources before scanning begins
- Restructure the scan flow to fetch the playlist list first, then scan sequentially

## Capabilities

### New Capabilities

_None_ — this change modifies existing capabilities.

### Modified Capabilities

- `scan-ui`: The live scan progress requirement changes from a single overwritten line to an accumulating source list with pending/active/done states
- `library-scanner`: The scanner needs to emit a new event with the full source list before scanning begins, requiring playlist prefetch

## Impact

- `src/scanner.ts` — restructure to prefetch playlists, emit new `sources` event, then scan
- `src/ui.ts` — rewrite progress rendering from single-line to accumulating list
- `src/main.ts` — handle the new `sources` event
- `src/types.ts` — add new `ScanEvent` variant for the source list
