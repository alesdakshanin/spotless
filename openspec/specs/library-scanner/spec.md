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
The system SHALL accept a scan configuration specifying whether to include Liked Songs and which playlists to scan. The scanner SHALL only scan the sources included in the configuration. The system SHALL emit a sources event listing only the selected scan sources before any track scanning occurs. Playlist fetching is no longer performed inside the scanner — the caller provides the playlist objects.

#### Scenario: Sources event emitted before scanning
- **WHEN** the scan configuration includes Liked Songs and 2 playlists ("Road Trip", "Chill Vibes")
- **THEN** the scanner emits a sources event with ["Liked Songs", "Road Trip", "Chill Vibes"] before any track scanning begins

#### Scenario: Liked Songs excluded
- **WHEN** the scan configuration has includeLikedSongs=false and 2 playlists
- **THEN** the scanner does not fetch or scan Liked Songs, and the sources event lists only the 2 playlists

#### Scenario: No playlists selected
- **WHEN** the scan configuration has includeLikedSongs=true and an empty playlists array
- **THEN** the scanner scans only Liked Songs and the sources event lists ["Liked Songs"]

#### Scenario: Scan playlist with many tracks
- **WHEN** a selected playlist contains 300 tracks
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
The system SHALL produce a final result containing all unplayable tracks found. Each entry SHALL include: track name, artist name(s), the source (Liked Songs or playlist name), the source ID (playlist ID for playlist sources, or null for Liked Songs), the track's Spotify URI, the restriction reason, and a thumbnail URL for the track's album art. The thumbnail URL SHALL be the smallest image from the track's album images array. If the track has no album images, the thumbnail URL SHALL be omitted. The system SHALL also report the total tracks scanned and total unplayable tracks found.

#### Scenario: Scan with unplayable tracks
- **WHEN** scanning completes with 5 unplayable tracks
- **THEN** the result contains all 5 unplayable track entries with their details including thumbnail URLs, source IDs, and track URIs, and a summary of total scanned / 5 unplayable

#### Scenario: Clean library
- **WHEN** scanning completes and no unplayable tracks were found
- **THEN** the result contains an empty list and a summary of total scanned / 0 unplayable

#### Scenario: Track with album art
- **WHEN** an unplayable track has an album with images [640×640, 300×300, 64×64]
- **THEN** the unplayable track entry includes the 64×64 image URL as the thumbnail

#### Scenario: Track without album art
- **WHEN** an unplayable track has no album images
- **THEN** the unplayable track entry has no thumbnail URL

#### Scenario: Unplayable track from Liked Songs
- **WHEN** an unplayable track is found in Liked Songs
- **THEN** the entry has sourceId `null` and includes the track's Spotify URI

#### Scenario: Unplayable track from a playlist
- **WHEN** an unplayable track is found in playlist "Road Trip" with ID "abc123"
- **THEN** the entry has sourceId "abc123" and includes the track's Spotify URI
