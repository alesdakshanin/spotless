## Requirements

### Requirement: Login screen
The system SHALL display a login screen with a "Log in with Spotify" button when the user is not authenticated.

#### Scenario: Initial visit
- **WHEN** user opens the app with no active session
- **THEN** the app shows the Spotless name/heading and a "Log in with Spotify" button

#### Scenario: Session expired
- **WHEN** the refresh token is invalid and the session cannot be restored
- **THEN** the app returns to the login screen

### Requirement: Scan screen
After authentication, the system SHALL fetch the user's profile and owned playlists, then display a scan screen. The screen SHALL show the logged-in user's Spotify display name, a logout option, the playlist picker with all scannable sources, and a "Scan Library" button. The button SHALL be disabled when no sources are selected in the picker.

#### Scenario: Authenticated landing
- **WHEN** user completes OAuth login
- **THEN** the app fetches the user's profile and owned playlists, then shows the display name, logout option, playlist picker with all sources checked, and an enabled "Scan Library" button

#### Scenario: Scan screen with no owned playlists
- **WHEN** user has no owned playlists
- **THEN** the scan screen shows the picker with only "Liked Songs" checked and the scan button enabled

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
After scanning, the system SHALL display results. If unplayable tracks were found, the system SHALL mount the triage view (Preact island) which displays all unplayable tracks in a flat triage list with batch operation controls. If no unplayable tracks were found, the system SHALL show a success message ("Your library is spotless!") and the total scanned count. The system SHALL also show a summary line with total tracks scanned and total unplayable found.

#### Scenario: Unplayable tracks found
- **WHEN** scanning completes with 5 unplayable tracks
- **THEN** the system mounts the Preact triage view with all 5 tracks displayed in the triage list

#### Scenario: No unplayable tracks
- **WHEN** scanning completes with 0 unplayable tracks
- **THEN** the UI shows a success message (e.g., "Your library is spotless!") and the total scanned

### Requirement: Scan again
After viewing results, the system SHALL offer a way to run the scan again. Triggering a re-scan SHALL unmount the triage view and return to the scan screen with the playlist picker, allowing users to adjust their selection before scanning again.

#### Scenario: Re-scan from triage view
- **WHEN** user clicks "Scan Again" on the triage view
- **THEN** the Preact triage view is unmounted and the app returns to the scan screen with the playlist picker displayed
