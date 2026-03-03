## Context

The scan progress UI currently uses a single `<p>` element that gets overwritten on each progress event. The scanner emits `progress` events per-page within each source, but the UI has no awareness of the full list of sources. Small playlists complete in one API call (~200ms), making their progress invisible.

## Goals / Non-Goals

**Goals:**
- Users see all scan sources (Liked Songs + owned playlists) listed upfront before scanning begins
- Each source visually transitions through pending → active → completed states
- The active source shows live track count progress
- Completed sources show a checkmark and final track count

**Non-Goals:**
- Cancelling a scan mid-progress
- Reordering or filtering the source list
- Showing individual track names during scan

## Decisions

### 1. Prefetch playlists before scanning

The scanner currently fetches playlists lazily during the scan loop. To show all sources upfront, we'll fetch the owned playlist list first and emit a new `sources` event before any scanning begins.

**Why**: The UI needs the full source list to render the pending state. Prefetching adds one extra pagination pass over `/me/playlists`, but this data is already being fetched — we're just moving it earlier.

**Alternative**: Render sources incrementally as discovered. Rejected because it defeats the purpose of showing total scope upfront.

### 2. New `sources` ScanEvent variant

Add a `{ type: "sources"; names: string[] }` event emitted once at the start. This keeps the async generator pattern intact — the UI subscribes to the same event stream, just handles one more event type.

**Why**: Minimal change to the existing architecture. No new channels or callbacks needed.

### 3. UI as a stateful source list

Replace the three `<p>` elements with a `<div>` containing one row per source. Each row has an icon area, source name, and status text. The UI maintains a reference to each row element and updates them as progress/done events arrive for that source.

**Why**: Vanilla DOM manipulation with element references is the established pattern in `ui.ts`. No need for a framework — we're managing a flat list of ~10-20 items.

## Risks / Trade-offs

- **Extra API pass for playlists**: Negligible cost — `/me/playlists` is lightweight and already paginated at 50 per page. Most users have <50 playlists, so it's a single request.
- **Source name collisions**: Two playlists could have the same name. We track by position in the list, not by name, so this is fine for rendering. The scanner already uses playlist name as the `source` field in unplayable track results — this is an existing limitation, not introduced by this change.
