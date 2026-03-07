## MODIFIED Requirements

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
