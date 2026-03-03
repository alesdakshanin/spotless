## ADDED Requirements

### Requirement: Scan saved tracks
The system SHALL fetch all of the user's saved tracks (Liked Songs) from the Spotify API using `GET /me/tracks` with `market=from_token`. The system SHALL paginate through the full library using `limit=50` and `offset` parameters until all tracks are retrieved.

#### Scenario: Scan small library
- **WHEN** user has 30 saved tracks
- **THEN** the system fetches all tracks in a single API call

#### Scenario: Scan large library
- **WHEN** user has 2,500 saved tracks
- **THEN** the system paginates through 50 pages of results, fetching all tracks

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

### Requirement: Detect unplayable tracks
The system SHALL identify a track as unplayable when its `is_playable` field is `false`. The system SHALL capture the `restrictions.reason` field when present, mapping it to a human-readable explanation: `"market"` → region-restricted, `"product"` → subscription tier restriction, `"explicit"` → explicit content filter. Unknown restriction reasons SHALL be displayed as "unavailable" with the raw reason value.

#### Scenario: Track with market restriction
- **WHEN** a track has `is_playable: false` and `restrictions.reason: "market"`
- **THEN** the track is flagged as unplayable with reason "Not available in your country"

#### Scenario: Track with product restriction
- **WHEN** a track has `is_playable: false` and `restrictions.reason: "product"`
- **THEN** the track is flagged as unplayable with reason "Not available on your subscription"

#### Scenario: Track with explicit restriction
- **WHEN** a track has `is_playable: false` and `restrictions.reason: "explicit"`
- **THEN** the track is flagged as unplayable with reason "Blocked by explicit content filter"

#### Scenario: Track with unknown restriction
- **WHEN** a track has `is_playable: false` and `restrictions.reason` is an unrecognized value
- **THEN** the track is flagged as unplayable with a generic "Unavailable" label including the raw reason

### Requirement: Skip local files
The system SHALL silently skip any track where `is_local` is `true`. Local files SHALL NOT appear in scan results or be counted in totals.

#### Scenario: Playlist with local files
- **WHEN** a playlist contains 20 tracks, 3 of which are local files
- **THEN** the system evaluates 17 tracks and ignores the 3 local files

### Requirement: Report scan progress
The system SHALL emit progress events during scanning, reporting the current source name (e.g., "Liked Songs" or playlist name), the number of tracks scanned so far, and the total track count for that source.

#### Scenario: Progress during liked songs scan
- **WHEN** scanning liked songs with 500 total tracks and 100 scanned so far
- **THEN** the system emits a progress event with source "Liked Songs", scanned 100, total 500

### Requirement: Report scan results
The system SHALL produce a final result containing all unplayable tracks found. Each entry SHALL include: track name, artist name(s), the source (Liked Songs or playlist name), and the restriction reason. The system SHALL also report the total tracks scanned and total unplayable tracks found.

#### Scenario: Scan with unplayable tracks
- **WHEN** scanning completes and 5 unplayable tracks were found across 1,200 total tracks
- **THEN** the result contains all 5 unplayable track entries with their details and a summary of 1,200 scanned / 5 unplayable

#### Scenario: Clean library
- **WHEN** scanning completes and no unplayable tracks were found
- **THEN** the result contains an empty list and a summary of total scanned / 0 unplayable
