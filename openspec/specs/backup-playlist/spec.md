## Requirements

### Requirement: Find or create backup playlist
The system SHALL search the current user's playlists for one named "Spotless Backup". If found, it SHALL reuse that playlist. If not found, it SHALL create a new private playlist named "Spotless Backup" with description "Tracks removed by Spotless — your safety net." owned by the current user. The system SHALL return the playlist ID for subsequent operations. Playlist search SHALL paginate through all user playlists (via `GET /me/playlists`) to avoid missing a playlist beyond the first page.

#### Scenario: Backup playlist exists
- **WHEN** the user has a playlist named "Spotless Backup"
- **THEN** the system returns its ID without creating a new playlist

#### Scenario: Backup playlist does not exist
- **WHEN** the user has no playlist named "Spotless Backup"
- **THEN** the system creates a private playlist named "Spotless Backup" via `POST /users/{user_id}/playlists` and returns the new playlist's ID

#### Scenario: Backup playlist on later page
- **WHEN** the user has 120 playlists and "Spotless Backup" is on the third page
- **THEN** the system paginates through all pages and finds the playlist

#### Scenario: Playlist creation failure
- **WHEN** the API call to create the backup playlist fails
- **THEN** the system throws an error that prevents batch execution from proceeding

### Requirement: Add tracks to backup playlist
The system SHALL add tracks to the backup playlist via `POST /playlists/{id}/tracks`. When more than 100 tracks need to be backed up, the system SHALL split them into batches of 100 or fewer (Spotify's per-request limit). Tracks SHALL NOT be deduplicated — if a track was backed up in a previous session and is being removed again, it SHALL be added again.

#### Scenario: Back up 3 tracks
- **WHEN** 3 tracks are queued for backup
- **THEN** the system makes one `POST /playlists/{id}/tracks` call with 3 URIs

#### Scenario: Back up 150 tracks
- **WHEN** 150 tracks are queued for backup
- **THEN** the system makes two API calls: first with 100 URIs, second with 50 URIs

#### Scenario: Backup add failure
- **WHEN** the API call to add tracks to the backup playlist fails
- **THEN** the system throws an error that prevents batch execution from proceeding

#### Scenario: Duplicate tracks across sessions
- **WHEN** a track was backed up in a previous session and is being removed again
- **THEN** the track is added to the backup playlist again (duplicates are allowed)
