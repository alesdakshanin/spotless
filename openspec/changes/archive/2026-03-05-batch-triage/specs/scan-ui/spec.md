## MODIFIED Requirements

### Requirement: Results display
After scanning, the system SHALL display results. If unplayable tracks were found, the system SHALL mount the triage view (Preact island) which displays all unplayable tracks in a flat triage list with batch operation controls. If no unplayable tracks were found, the system SHALL show a success message ("Your library is spotless!") and the total scanned count. The system SHALL also show a summary line with total tracks scanned and total unplayable found.

#### Scenario: Unplayable tracks found
- **WHEN** scanning completes with 5 unplayable tracks
- **THEN** the system mounts the Preact triage view with all 5 tracks displayed in the triage list

#### Scenario: No unplayable tracks
- **WHEN** scanning completes with 0 unplayable tracks
- **THEN** the UI shows a success message (e.g., "Your library is spotless!") and the total scanned

### Requirement: Scan again
After viewing results, the system SHALL offer a way to run the scan again. Triggering a re-scan SHALL unmount the triage view and return to the scanning flow.

#### Scenario: Re-scan from triage view
- **WHEN** user clicks "Scan Again" on the triage view
- **THEN** the Preact triage view is unmounted and the app returns to scanning with fresh progress

## REMOVED Requirements

### Requirement: Candidate row display
**Reason**: Candidate display is now handled by the triage-ui spec's row expansion panel, which uses radio-style selection instead of per-candidate action buttons.
**Migration**: Candidate rendering moves to `triage-ui` spec under "Row expansion for candidate selection".

### Requirement: Action state feedback
**Reason**: Per-track immediate action feedback is replaced by the batch triage workflow. Tracks are staged, reviewed, and committed in bulk. Post-apply feedback is handled by dimming applied tracks.
**Migration**: Action feedback moves to `triage-ui` spec (apply progress view and post-apply dimming) and `batch-apply` spec (execution and failure handling).
