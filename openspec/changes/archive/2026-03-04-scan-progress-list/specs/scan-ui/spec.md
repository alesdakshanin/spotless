## MODIFIED Requirements

### Requirement: Live scan progress
While scanning, the system SHALL display an accumulating list of all scan sources. Before scanning begins, the system SHALL show all sources in a pending state. As each source is scanned, its row SHALL transition to an active state showing live progress (tracks scanned / total). When a source completes, its row SHALL transition to a completed state showing a checkmark and the final track count. The system SHALL also display a running count of unplayable tracks found so far.

#### Scenario: All sources shown upfront
- **WHEN** the scan starts and the user has Liked Songs and 3 owned playlists ("Road Trip", "Chill Vibes", "Workout")
- **THEN** the UI shows a list with all 4 sources in a pending/dimmed state before any scanning begins

#### Scenario: Active source shows progress
- **WHEN** the scanner is processing "Liked Songs" and has checked 200 of 800 tracks
- **THEN** the "Liked Songs" row shows an active indicator with "200 / 800", and all other sources remain in the pending state

#### Scenario: Completed source shows checkmark
- **WHEN** "Liked Songs" finishes scanning with 800 tracks
- **THEN** the "Liked Songs" row shows a checkmark and "800 tracks", and the next source transitions to active

#### Scenario: Scanning a playlist
- **WHEN** the scanner moves to a playlist named "Road Trip"
- **THEN** the "Road Trip" row transitions to active showing its progress, while "Liked Songs" above shows as completed

#### Scenario: Unplayable count updates
- **WHEN** an unplayable track is found during scanning
- **THEN** the running unplayable count updates regardless of which source is active
