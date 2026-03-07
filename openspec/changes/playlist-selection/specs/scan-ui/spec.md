## MODIFIED Requirements

### Requirement: Scan screen
After authentication, the system SHALL fetch the user's profile and owned playlists, then display a scan screen. The screen SHALL show the logged-in user's Spotify display name, a logout option, the playlist picker with all scannable sources, and a "Scan Library" button. The button SHALL be disabled when no sources are selected in the picker.

#### Scenario: Authenticated landing
- **WHEN** user completes OAuth login
- **THEN** the app fetches the user's profile and owned playlists, then shows the display name, logout option, playlist picker with all sources checked, and an enabled "Scan Library" button

#### Scenario: Scan screen with no owned playlists
- **WHEN** user has no owned playlists
- **THEN** the scan screen shows the picker with only "Liked Songs" checked and the scan button enabled

### Requirement: Scan again
After viewing results, the system SHALL offer a way to run the scan again. Triggering a re-scan SHALL unmount the triage view and return to the scan screen with the playlist picker, allowing users to adjust their selection before scanning again.

#### Scenario: Re-scan from triage view
- **WHEN** user clicks "Scan Again" on the triage view
- **THEN** the Preact triage view is unmounted and the app returns to the scan screen with the playlist picker displayed
