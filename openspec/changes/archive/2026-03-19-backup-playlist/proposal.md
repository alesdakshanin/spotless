## Why

When users remove tracks (either as standalone removals or as part of a replace operation), there is no way to recover them. If a removal was accidental or a replacement turns out to be wrong, the user must manually find and re-add the original track. A backup playlist provides a safety net so users can always recover what was removed.

## What Changes

- Before executing any remove operations in a batch, automatically create (or reuse) a Spotify playlist named "Spotless Backup" owned by the current user
- Add all tracks that are about to be removed to the backup playlist before actually removing them
- Show a notice in the review confirmation modal explaining that removed tracks will be backed up to "Spotless Backup"
- If the backup playlist already exists from a previous session, reuse it (append, don't overwrite)

## Capabilities

### New Capabilities
- `backup-playlist`: Creating, finding, and populating a "Spotless Backup" playlist on Spotify before track removal. Covers playlist lookup, creation, and batch-adding tracks to it.

### Modified Capabilities
- `batch-apply`: Batch execution must back up tracks to the backup playlist before executing remove operations. If the backup step fails, the entire batch should abort rather than removing tracks without a safety net.
- `triage-ui`: The review confirmation modal must include a notice explaining that removed tracks will be saved to a "Spotless Backup" playlist.

## Impact

- **API**: New calls to `GET /me/playlists`, `POST /users/{user_id}/playlists`, and `POST /playlists/{id}/tracks` for backup playlist management. Requires the current user's ID (available from `/me`).
- **Auth scopes**: No new scopes needed — `playlist-modify-public` or `playlist-modify-private` (already required for existing playlist track removal) covers playlist creation and adding tracks.
- **Code**: New backup module, changes to `batch.ts` execution flow, changes to `ReviewModal.tsx` confirmation UI.
- **UX**: Minimal friction — backup is automatic and explained in the confirmation screen. No new user decisions required.
