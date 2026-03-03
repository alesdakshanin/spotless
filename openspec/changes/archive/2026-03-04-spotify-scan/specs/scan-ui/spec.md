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
While scanning, the system SHALL display live progress indicating: the current source being scanned (e.g., "Liked Songs", playlist name), the number of tracks scanned vs total for that source, and a running count of unplayable tracks found so far.

#### Scenario: Scanning liked songs
- **WHEN** the scanner is processing Liked Songs and has checked 200 of 800 tracks
- **THEN** the UI shows "Scanning Liked Songs... 200 / 800" and the count of unplayable tracks found so far

#### Scenario: Scanning a playlist
- **WHEN** the scanner moves to a playlist named "Road Trip"
- **THEN** the UI updates to show "Scanning Road Trip..." with that playlist's progress

### Requirement: Results display
After scanning, the system SHALL display results. If unplayable tracks were found, the system SHALL list each track showing: track name, artist name(s), source (Liked Songs or playlist name), and the human-readable restriction reason. The system SHALL also show a summary line with total tracks scanned and total unplayable found.

#### Scenario: Unplayable tracks found
- **WHEN** scanning completes with 5 unplayable tracks
- **THEN** the UI lists all 5 tracks with name, artist, source, and reason, plus a summary

#### Scenario: No unplayable tracks
- **WHEN** scanning completes with 0 unplayable tracks
- **THEN** the UI shows a success message (e.g., "Your library is spotless!") and the total scanned

### Requirement: Scan again
After viewing results, the system SHALL offer a way to run the scan again.

#### Scenario: Re-scan
- **WHEN** user clicks "Scan Again" on the results screen
- **THEN** the app returns to scanning with fresh progress
