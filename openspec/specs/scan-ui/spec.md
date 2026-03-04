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
After scanning, the system SHALL display results. If unplayable tracks were found, the system SHALL list each track as an expandable accordion row showing: an album art thumbnail, track name, artist name(s), source (Liked Songs or playlist name), and the human-readable restriction reason. The thumbnail SHALL be rendered as a 40×40 pixel image with rounded corners. When a track has no thumbnail URL, the system SHALL display a placeholder element with a neutral background instead. If a thumbnail image fails to load, the system SHALL replace it with the placeholder. The system SHALL also show a summary line with total tracks scanned and total unplayable found.

Clicking a collapsed row SHALL expand it to show replacement candidates (loaded lazily on first expand). Expanding a row SHALL collapse any other currently expanded row. The expanded section SHALL show a loading state while candidates are being fetched, then display up to 3 candidates with confidence indicators and action buttons, or a "No replacements found" message.

#### Scenario: Unplayable tracks found with album art
- **WHEN** scanning completes with 5 unplayable tracks that have album art
- **THEN** the UI lists all 5 tracks as collapsed accordion rows with a 40×40 album thumbnail, name, artist, source, and reason, plus a summary

#### Scenario: Track without album art
- **WHEN** a track in the results has no thumbnail URL
- **THEN** the UI shows a neutral placeholder element in the thumbnail position

#### Scenario: Thumbnail fails to load
- **WHEN** a track's album art URL returns an error
- **THEN** the UI replaces the broken image with the placeholder element

#### Scenario: No unplayable tracks
- **WHEN** scanning completes with 0 unplayable tracks
- **THEN** the UI shows a success message (e.g., "Your library is spotless!") and the total scanned

#### Scenario: Expand a track row
- **WHEN** user clicks on a collapsed unplayable track row
- **THEN** the row expands to show a loading indicator, fetches replacement candidates, and displays them with confidence scores and action buttons

#### Scenario: Collapse an expanded row
- **WHEN** user clicks on an expanded track row
- **THEN** the row collapses back to its summary view

#### Scenario: Only one row expanded at a time
- **WHEN** user clicks on a collapsed row while another row is expanded
- **THEN** the previously expanded row collapses and the clicked row expands

#### Scenario: No candidates found
- **WHEN** the replacement search returns zero candidates for an expanded track
- **THEN** the expanded section shows "No replacements found" and the "Remove original" button

### Requirement: Candidate row display
Each replacement candidate within an expanded accordion row SHALL display: an album art thumbnail, track name, artist name(s), a confidence indicator (★★★, ★★, or ★ corresponding to scores 3, 2, 1), a preview/play button, and an "Add" button. Candidates SHALL be ordered by confidence score descending.

#### Scenario: Three candidates with varying confidence
- **WHEN** three candidates are found with confidence scores 3, 1, and 2
- **THEN** they are displayed in order: ★★★, ★★, ★ (descending confidence)

#### Scenario: Candidate with album art
- **WHEN** a candidate track has album images
- **THEN** the candidate row shows the smallest album image as a thumbnail

### Requirement: Action state feedback
After a successful "Add" action, the add button SHALL transition to a "✓ Added" label and become non-interactive. After a successful "Remove original" action, the remove button SHALL transition to a "✓ Removed" label and become non-interactive. When a track row is collapsed after both actions have been taken, the collapsed row SHALL display resolution status indicators (e.g., "✓ Replaced" and "✓ Removed") in place of the restriction reason.

#### Scenario: Add completed
- **WHEN** user successfully adds a candidate
- **THEN** the "Add" button on that candidate becomes "✓ Added" and is disabled

#### Scenario: Remove completed
- **WHEN** user successfully removes the original track
- **THEN** the "Remove original" button becomes "✓ Removed" and is disabled

#### Scenario: Collapsed row shows resolution
- **WHEN** a track has had a replacement added and the original removed, and the row is collapsed
- **THEN** the collapsed row shows "✓ Replaced" and "✓ Removed" instead of the restriction reason

#### Scenario: Partial resolution
- **WHEN** a track has had a replacement added but the original not removed, and the row is collapsed
- **THEN** the collapsed row shows "✓ Replaced" alongside the restriction reason

### Requirement: Scan again
After viewing results, the system SHALL offer a way to run the scan again.

#### Scenario: Re-scan
- **WHEN** user clicks "Scan Again" on the results screen
- **THEN** the app returns to scanning with fresh progress
