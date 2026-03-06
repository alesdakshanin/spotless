## Why

The current one-at-a-time flow (expand track → search → pick replacement → add/remove) breaks down when users have 20–50 unplayable tracks. Each track requires multiple clicks and a wait for search results. A batch workflow with background search, auto-proposals, and a single commit step lets users process their entire library efficiently while staying in full control.

## What Changes

- Background replacement search runs automatically after scan completes — no user action required
- New triage view replaces the accordion results screen: flat list with checkboxes, inline candidate preview, confidence indicators, and source grouping
- High-confidence (★★★) matches are auto-proposed: pre-checked with best candidate pre-selected
- Filter bar (All / ★★★ Auto-proposed / ★★ Needs review / No match) and select-all control for power-user fast path
- Row expansion (accordion) for overriding candidate selection on individual tracks
- Fixed apply bar appears when changes are staged, showing dynamic counts
- Confirmation modal shows full diff of pending mutations before any Spotify writes
- Batch apply executes operations sequentially with progress, handles partial failures
- Applied tracks are dimmed in the list after completion
- **Tech stack addition**: Preact + `@preact/signals` for the triage UI (island architecture — existing screens stay vanilla)

## Capabilities

### New Capabilities
- `triage-ui`: The triage view — flat track list with checkboxes, filter bar, select-all, auto-proposals, row expansion, apply bar, and confirmation/review modal
- `batch-apply`: Batch execution engine — stages pending operations, executes sequentially with progress reporting, handles partial failures

### Modified Capabilities
- `replacement-search`: Search triggering changes from on-demand (user expands row) to automatic background search for all tracks after scan. Adds progress tracking and per-track search status.
- `scan-ui`: Results display changes from accordion with per-track actions to the triage view entry point. Login, scan prompt, and progress screens are unchanged.
- `track-actions`: Actions change from immediate independent per-track mutations to batched operations staged via triage state and committed together.

## Impact

- **New dependencies**: `preact`, `@preact/preset-vite`, `@preact/signals`
- **Build config**: Vite config needs Preact plugin (JSX transform)
- **`src/ui.ts`**: Results rendering extracted/replaced by Preact triage components. Login, scan, and progress screens remain.
- **`src/main.ts`**: Post-scan orchestration changes — triggers background search, mounts Preact triage view instead of `renderResults()`
- **New files**: `src/triage/` directory with Preact components and signal-based state
- **`src/replacements.ts`**: May need a batch search orchestrator wrapper (core search function unchanged)
- **`src/actions.ts`**: May need a batch execution wrapper (core add/remove functions unchanged)
- **Tests**: New tests for triage state logic and batch execution; existing scanner/replacement/action tests unaffected
