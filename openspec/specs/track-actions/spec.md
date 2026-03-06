## Requirements

### Requirement: Add track to Liked Songs
The system SHALL add a candidate track to the user's Liked Songs library via `PUT /me/tracks` when the user clicks "Add" on a candidate whose original source is Liked Songs.

#### Scenario: Add replacement to Liked Songs
- **WHEN** user clicks "Add" on a candidate for a track sourced from Liked Songs
- **THEN** the system calls `PUT /me/tracks` with the candidate's track ID and the button transitions to "✓ Added"

#### Scenario: Add fails
- **WHEN** the API call to add a track fails (network error or non-2xx response)
- **THEN** the button remains in its original state and an error indication is shown

### Requirement: Add track to playlist
The system SHALL add a candidate track to a specific playlist via `POST /playlists/{id}/tracks` when the user clicks "Add" on a candidate whose original source is a playlist. The playlist ID SHALL be the `sourceId` from the unplayable track.

#### Scenario: Add replacement to playlist
- **WHEN** user clicks "Add" on a candidate for a track sourced from playlist "Road Trip" (ID: abc123)
- **THEN** the system calls `POST /playlists/abc123/tracks` with the candidate's track URI and the button transitions to "✓ Added"

### Requirement: Remove track from Liked Songs
The system SHALL remove an unplayable track from the user's Liked Songs library via `DELETE /me/tracks` when the user clicks "Remove original" on a track sourced from Liked Songs.

#### Scenario: Remove from Liked Songs
- **WHEN** user clicks "Remove original" on a track sourced from Liked Songs
- **THEN** the system calls `DELETE /me/tracks` with the track's ID and the button transitions to "✓ Removed"

#### Scenario: Remove fails
- **WHEN** the API call to remove a track fails
- **THEN** the button remains in its original state and an error indication is shown

### Requirement: Remove track from playlist
The system SHALL remove an unplayable track from a playlist via `DELETE /playlists/{id}/tracks` when the user clicks "Remove original" on a track sourced from a playlist. The playlist ID SHALL be the `sourceId` from the unplayable track.

#### Scenario: Remove from playlist
- **WHEN** user clicks "Remove original" on a track sourced from playlist "Road Trip" (ID: abc123)
- **THEN** the system calls `DELETE /playlists/abc123/tracks` with the track's URI and the button transitions to "✓ Removed"

### Requirement: Coupled action state
The "Add" and "Remove" actions for a given track SHALL be coupled through the batch execution model. For each track in the batch, the ADD operation SHALL execute before the REMOVE operation. If the ADD fails, the REMOVE for that track SHALL be skipped. Actions are no longer triggered independently by individual button clicks — they are staged via triage state and committed together in a batch.

#### Scenario: Batch replaces independent actions
- **WHEN** user confirms batch apply with 3 tracks staged
- **THEN** each track's add and remove operations execute sequentially as a pair, not as independent user-triggered actions

#### Scenario: Add failure skips remove
- **WHEN** the add operation for a track fails during batch apply
- **THEN** the remove operation for that track is skipped to preserve the original
