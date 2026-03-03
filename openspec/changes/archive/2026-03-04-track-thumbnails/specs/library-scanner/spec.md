## MODIFIED Requirements

### Requirement: Report scan results
The system SHALL produce a final result containing all unplayable tracks found. Each entry SHALL include: track name, artist name(s), the source (Liked Songs or playlist name), the restriction reason, and a thumbnail URL for the track's album art. The thumbnail URL SHALL be the smallest image from the track's album images array. If the track has no album images, the thumbnail URL SHALL be omitted. The system SHALL also report the total tracks scanned and total unplayable tracks found.

#### Scenario: Scan with unplayable tracks
- **WHEN** scanning completes with 5 unplayable tracks
- **THEN** the result contains all 5 unplayable track entries with their details including thumbnail URLs, and a summary of total scanned / 5 unplayable

#### Scenario: Clean library
- **WHEN** scanning completes and no unplayable tracks were found
- **THEN** the result contains an empty list and a summary of total scanned / 0 unplayable

#### Scenario: Track with album art
- **WHEN** an unplayable track has an album with images [640×640, 300×300, 64×64]
- **THEN** the unplayable track entry includes the 64×64 image URL as the thumbnail

#### Scenario: Track without album art
- **WHEN** an unplayable track has no album images
- **THEN** the unplayable track entry has no thumbnail URL
