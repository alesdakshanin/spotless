## Context

When users apply changes in the triage view, tracks are removed from their Spotify library/playlists with no recovery mechanism. The existing safety net — ADD-before-REMOVE ordering in `batch.ts` — only prevents removal when a replacement add fails. It doesn't help with pure removals or cases where the user later regrets a replacement.

The app already fetches the current user via `GET /me` at scan screen init (`main.ts:36`), so the user ID is available. The API module (`api.ts`) provides `get`, `post`, `put`, `del` helpers, but `post` returns `void` — creating a playlist requires the response body.

## Goals / Non-Goals

**Goals:**
- Automatically back up all tracks that will be removed to a "Spotless Backup" playlist
- Reuse the same backup playlist across sessions (find-or-create pattern)
- Abort batch execution if backup fails — never remove without a safety net
- Inform the user in the review modal that backup will happen

**Non-Goals:**
- Managing or cleaning up old backup playlists (users can do this in Spotify)
- Persisting the user's backup preference across sessions
- Restoring tracks from the backup playlist (users do this manually in Spotify)
- Deduplicating tracks already in the backup playlist

## Decisions

### 1. New `postJson<T>()` API helper

**Choice**: Add a `postJson<T>()` function to `api.ts` that returns the parsed response body.

**Why**: `POST /users/{user_id}/playlists` returns the created playlist object (we need the ID). The existing `post()` discards the response. Rather than changing `post()` (which would affect all callers), add a parallel function.

**Alternative considered**: Modify `post()` to optionally return JSON — rejected because it changes the return type for all existing callers and the generic overload would be awkward.

### 2. New `src/backup.ts` module

**Choice**: A standalone module exporting `ensureBackupPlaylist(userId: string)` and `backupTracks(playlistId: string, trackUris: string[])`.

**Why**: Follows the project convention of pure async modules for core logic. Keeps backup concerns out of `batch.ts` and `actions.ts`.

- `ensureBackupPlaylist`: Lists user's playlists (paginated `GET /me/playlists`), searches for one named "Spotless Backup". If found, returns its ID. If not, creates it via `POST /users/{user_id}/playlists` and returns the new ID.
- `backupTracks`: Adds tracks to the backup playlist via `POST /playlists/{id}/tracks`. Spotify's API accepts max 100 URIs per call, so this function batches if needed.

### 3. Integrate backup into `executeBatch()`

**Choice**: Add a backup phase at the start of `executeBatch()` — before any operations run, collect all unique track URIs from remove ops, back them up, then proceed.

**Why**: This is the single choke point for all removals. Doing it here guarantees every removed track is backed up regardless of how it was triaged (replace or pure remove).

**Flow change**:
1. Extract unique track URIs from all remove ops
2. If any exist, call `ensureBackupPlaylist()` then `backupTracks()`
3. If backup fails, abort the entire batch (return all ops as failed)
4. Otherwise proceed with existing ADD-then-REMOVE execution

`executeBatch()` will need the user ID passed in. The triage mount point in `main.ts` already has the user from `GET /me` — thread `user.id` through to the batch call.

**Alternative considered**: Backup inside `removeTrack()` in `actions.ts` — rejected because it would require each individual remove call to know about the backup playlist, and we'd create/find the playlist repeatedly.

### 4. UI: Backup checkbox in review modal

**Choice**: Add a checkbox in the `ReviewContent` component (between the subtitle and the ops list) labeled "Back up removed tracks to Spotless Backup playlist", checked by default. The checkbox state is passed as a `backup` boolean to `executeBatch()`.

**Why**: Gives users control without adding friction — backup is on by default, but power users can opt out for a specific batch. The checkbox only appears when the batch contains remove operations. The preference is not persisted — it resets to checked each time the modal opens, since the safe default is always to back up.

### 5. Backup playlist properties

**Choice**: Create as a **private** playlist with name "Spotless Backup" and description "Tracks removed by Spotless — your safety net."

**Why**: Private avoids cluttering the user's public profile. The fixed name makes it findable across sessions.

## Risks / Trade-offs

**[Risk] Playlist lookup adds API calls before every batch** → The extra `GET /me/playlists` call (and possible pagination) adds latency. Mitigated by: this only runs when the user clicks Apply, so it's not in a hot path. Typically 1-2 API calls.

**[Risk] User renames or deletes the backup playlist** → The app will create a new one on next batch. This is acceptable — it's the simplest behavior and the user made a deliberate choice.

**[Risk] Spotify API rate limiting on large batches** → The existing 429-retry logic in `api.ts` already handles this. Backup batching (100 URIs per call) matches Spotify's limits.

**[Trade-off] No deduplication** → If a user removes the same track in separate sessions, it'll appear in the backup playlist multiple times. This is harmless and keeps the logic simple.

**[Trade-off] Batch abort on backup failure** → If the backup step fails (e.g., API error creating playlist), no tracks are removed. This is intentionally conservative — better to fail safe than lose tracks.
