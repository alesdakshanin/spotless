## 1. Scanner: Add sources event and prefetch playlists

- [x] 1.1 Add `ScanSourcesEvent` type (`{ type: "sources"; names: string[] }`) to `ScanEvent` union in `types.ts`
- [x] 1.2 Refactor `scan()` in `scanner.ts` to prefetch owned playlists before scanning, then emit a `sources` event with all source names (Liked Songs + playlist names)
- [x] 1.3 Add tests for the new sources event emission and prefetch behavior

## 2. UI: Accumulating source list progress display

- [x] 2.1 Replace single-line progress elements with a source list renderer in `ui.ts` — render all sources in pending state on `sources` event, update rows on `progress` events, mark completed with checkmark and track count
- [x] 2.2 Handle the new `sources` event in `main.ts` to initialize the source list UI
- [x] 2.3 Verify full flow manually: sources appear dimmed, active source shows progress, completed sources show checkmark
