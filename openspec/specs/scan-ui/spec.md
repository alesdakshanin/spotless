## ADDED Requirements

### Requirement: Login screen
The system SHALL display a login screen with a "Log in with Spotify" button when the user is not authenticated.

#### Scenario: Initial visit
- **WHEN** user opens the app with no active session
- **THEN** the app shows the Spotless name/heading and a "Log in with Spotify" button

#### Scenario: Session expired
- **WHEN** the refresh token is invalid and the session cannot be restored
- **THEN** the app returns to the login screen

### Requirement: Scan screen
After authentication, the system SHALL display a scan screen with a "Scan Library" button. The screen SHALL show the logged-in user's Spotify display name and a logout option.

#### Scenario: Authenticated landing
- **WHEN** user completes OAuth login
- **THEN** the app shows a "Scan Library" button, the user's display name, and a logout option

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

### Requirement: Scan again
After viewing results, the system SHALL offer a way to run the scan again.

#### Scenario: Re-scan
- **WHEN** user clicks "Scan Again" on the results screen
- **THEN** the app returns to scanning with fresh progress
