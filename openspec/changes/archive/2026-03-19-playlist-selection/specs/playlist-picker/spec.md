## ADDED Requirements

### Requirement: Display scannable sources
The system SHALL display a list of all scannable sources after authentication, before scanning begins. The list SHALL include "Liked Songs" as the first entry followed by all user-owned playlists. Each entry SHALL display the source's cover image and name. Liked Songs SHALL use a static image (`/library.png`). Playlists SHALL use the smallest image from the playlist's Spotify `images` array; if no images exist, a generic placeholder SHALL be shown.

#### Scenario: User with playlists
- **WHEN** user is authenticated and owns 3 playlists ("Road Trip", "Chill Vibes", "Workout")
- **THEN** the picker displays 4 entries: "Liked Songs" (with library.png), "Road Trip", "Chill Vibes", "Workout" (each with their Spotify cover image)

#### Scenario: User with no playlists
- **WHEN** user is authenticated and owns no playlists
- **THEN** the picker displays only "Liked Songs" with the library.png image

#### Scenario: Playlist without cover image
- **WHEN** a playlist has no images in its Spotify data
- **THEN** the picker displays a generic placeholder image for that playlist

### Requirement: Source selection via checkboxes
Each source entry SHALL have a checkbox. All checkboxes SHALL be checked by default. Users SHALL be able to uncheck individual sources to exclude them from scanning.

#### Scenario: Default state
- **WHEN** the picker first renders with Liked Songs and 3 playlists
- **THEN** all 4 checkboxes are checked

#### Scenario: Uncheck a source
- **WHEN** user unchecks "Chill Vibes"
- **THEN** only "Chill Vibes" is unchecked; the other 3 sources remain checked

#### Scenario: Recheck a source
- **WHEN** user re-checks a previously unchecked source
- **THEN** the source is included again in the selection

### Requirement: Scan button state
The "Scan Library" button SHALL be disabled when no sources are selected. The button SHALL be enabled when at least one source is selected.

#### Scenario: All sources unchecked
- **WHEN** user unchecks all sources
- **THEN** the "Scan Library" button is disabled and visually indicates it cannot be clicked

#### Scenario: At least one source checked
- **WHEN** user has at least one source checked
- **THEN** the "Scan Library" button is enabled

#### Scenario: Re-enable after selecting
- **WHEN** all sources were unchecked and user checks one source
- **THEN** the "Scan Library" button becomes enabled again

### Requirement: Pass selection to scanner
When the user clicks "Scan Library", the system SHALL pass only the selected sources to the scanner. Unchecked sources SHALL NOT be scanned.

#### Scenario: Partial selection
- **WHEN** user has Liked Songs and "Road Trip" checked but "Chill Vibes" and "Workout" unchecked, then clicks scan
- **THEN** the scanner receives only Liked Songs and "Road Trip" as sources to scan

#### Scenario: Only playlists selected
- **WHEN** user unchecks Liked Songs but keeps playlists checked, then clicks scan
- **THEN** the scanner does not scan Liked Songs, only the selected playlists

#### Scenario: Only Liked Songs selected
- **WHEN** user unchecks all playlists but keeps Liked Songs checked, then clicks scan
- **THEN** the scanner scans only Liked Songs
