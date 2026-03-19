## 1. API layer

- [x] 1.1 Add `postJson<T>(path, body)` function to `src/api.ts` that returns parsed JSON response (needed for playlist creation endpoint)

## 2. Backup module

- [x] 2.1 Create `src/backup.ts` with `ensureBackupPlaylist(userId: string): Promise<string>` — paginate `GET /me/playlists`, find "Spotless Backup" by name, or create via `POST /users/{user_id}/playlists` (private, with description). Return playlist ID.
- [x] 2.2 Add `backupTracks(playlistId: string, trackUris: string[]): Promise<void>` to `src/backup.ts` — add tracks via `POST /playlists/{id}/tracks`, chunking into batches of 100
- [x] 2.3 Write tests for `ensureBackupPlaylist` (found on first page, found on later page, not found → creates, API error propagates)
- [x] 2.4 Write tests for `backupTracks` (single batch ≤100, multi-batch >100, API error propagates)

## 3. Batch execution integration

- [x] 3.1 Update `executeBatch` signature in `src/triage/batch.ts` to accept `userId: string` and `backup: boolean` (default `true`)
- [x] 3.2 Add backup phase before op execution: collect unique track URIs from remove ops, call `ensureBackupPlaylist` + `backupTracks`, abort all ops on failure
- [x] 3.3 Skip backup phase when `backup` is `false` or no remove ops exist
- [x] 3.4 Update existing `executeBatch` tests and add new tests for backup phase (success, failure aborts, skip when disabled, skip when no removes, URI deduplication)

## 4. Thread user ID through UI

- [x] 4.1 Pass `user.id` from `main.ts` through `mountTriageView` into the triage island
- [x] 4.2 Ensure `ReviewModal` receives `userId` and passes it to `executeBatch`

## 5. Review modal backup checkbox

- [x] 5.1 Add backup checkbox state (default `true`) to `ReviewModal` component
- [x] 5.2 Render checkbox labeled "Back up removed tracks to Spotless Backup playlist" between subtitle and ops list, visible only when batch has remove ops
- [x] 5.3 Pass checkbox state as `backup` flag to `executeBatch` in `handleApply`

## 6. Verify

- [x] 6.1 Run `npm run check` — all types, lint, format, and tests pass
