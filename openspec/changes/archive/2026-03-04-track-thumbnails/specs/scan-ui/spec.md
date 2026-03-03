## MODIFIED Requirements

### Requirement: Results display
After scanning, the system SHALL display results. If unplayable tracks were found, the system SHALL list each track showing: an album art thumbnail, track name, artist name(s), source (Liked Songs or playlist name), and the human-readable restriction reason. The thumbnail SHALL be rendered as a 40×40 pixel image with rounded corners. When a track has no thumbnail URL, the system SHALL display a placeholder element with a neutral background instead. If a thumbnail image fails to load, the system SHALL replace it with the placeholder. The system SHALL also show a summary line with total tracks scanned and total unplayable found.

#### Scenario: Unplayable tracks found with album art
- **WHEN** scanning completes with 5 unplayable tracks that have album art
- **THEN** the UI lists all 5 tracks with a 40×40 album thumbnail, name, artist, source, and reason, plus a summary

#### Scenario: Track without album art
- **WHEN** a track in the results has no thumbnail URL
- **THEN** the UI shows a neutral placeholder element in the thumbnail position

#### Scenario: Thumbnail fails to load
- **WHEN** a track's album art URL returns an error
- **THEN** the UI replaces the broken image with the placeholder element

#### Scenario: No unplayable tracks
- **WHEN** scanning completes with 0 unplayable tracks
- **THEN** the UI shows a success message (e.g., "Your library is spotless!") and the total scanned
