## MODIFIED Requirements

### Requirement: Scan user-owned playlists
The system SHALL fetch the user's playlists via `GET /me/playlists` before scanning begins, filtering to only playlists owned by the current user. The system SHALL emit a sources event listing all scan sources (Liked Songs followed by owned playlist names) before any track scanning occurs. For each owned playlist, the system SHALL then fetch all tracks via `GET /playlists/{id}/tracks` with `market=from_token`, paginating as needed.

#### Scenario: Sources event emitted before scanning
- **WHEN** the user has 3 owned playlists ("Road Trip", "Chill Vibes", "Workout")
- **THEN** the scanner emits a sources event with ["Liked Songs", "Road Trip", "Chill Vibes", "Workout"] before any track scanning begins

#### Scenario: Scan owned playlists only
- **WHEN** user owns 3 playlists and follows 5 playlists they don't own
- **THEN** the system scans only the 3 owned playlists

#### Scenario: Scan playlist with many tracks
- **WHEN** a playlist contains 300 tracks
- **THEN** the system paginates through all 6 pages of results

### Requirement: Report scan progress
The system SHALL emit progress events during scanning, reporting the current source name (e.g., "Liked Songs" or playlist name), the number of tracks scanned so far, and the total track count for that source.

#### Scenario: Progress during liked songs scan
- **WHEN** scanning liked songs with 500 total tracks and 100 scanned so far
- **THEN** the system emits a progress event with source "Liked Songs", scanned 100, total 500
