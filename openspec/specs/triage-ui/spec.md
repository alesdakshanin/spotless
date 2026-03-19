## Requirements

### Requirement: Triage track list
After scan completes, the system SHALL display all unplayable tracks as a flat list of cards. Each card SHALL contain a header section displaying the unplayable track (album art 44×44, track name, artist name(s), source tag, restriction badge color-coded by type: region / tier / explicit), followed by a body section containing clickable action rows. Tracks whose search is still pending SHALL NOT appear until their search completes. Cards SHALL appear in scan order. There SHALL be no section grouping, section headers, or select-all controls.

#### Scenario: Display flat card list
- **WHEN** scan completes and background search finds 7 tracks with candidates and 3 with no match
- **THEN** 10 cards are displayed in a single flat list with no section headers or grouping

#### Scenario: Track with no thumbnail
- **WHEN** a track has no album art URL
- **THEN** the card header displays a neutral placeholder in the thumbnail position

#### Scenario: Pending tracks excluded from list
- **WHEN** background search has completed 15 of 20 tracks
- **THEN** only 15 cards are displayed; 5 tracks are not yet visible

### Requirement: Candidate action rows
For tracks with candidates, the card body SHALL display one clickable row per candidate, sorted by confidence descending (highest first). Each candidate row SHALL display: candidate album art (32×32), candidate track name, candidate artist name(s). There SHALL be no confidence star ratings, RECOMMENDED badges, or other confidence indicators visible to the user. Clicking a candidate row SHALL set the track's intent to "replace" with that candidate selected, highlighting the row with a green border and displaying a green checkmark. Clicking an already-selected candidate row SHALL deselect it, setting the track's intent to "skip" and removing the highlight. Only one option per card can be selected at a time (radio behavior across candidates and the remove row).

#### Scenario: Click candidate to select
- **WHEN** user clicks a candidate row that is not selected
- **THEN** the row highlights with a green border and checkmark, the track intent becomes "replace", and any previously selected option in that card is deselected

#### Scenario: Click selected candidate to deselect
- **WHEN** user clicks a candidate row that is already selected
- **THEN** the highlight and checkmark are removed, and the track intent becomes "skip"

#### Scenario: Switch between candidates
- **WHEN** user clicks a different candidate row while one is already selected
- **THEN** the previous candidate is deselected and the new one is selected

#### Scenario: Candidate sort order
- **WHEN** a track has candidates with confidence values 1, 3, and 2
- **THEN** the candidates are displayed in order: confidence 3 (first), confidence 2, confidence 1 (last)

### Requirement: Remove action row
Every card SHALL include a "Remove from {source}" clickable row as the last option in the card body. The remove row SHALL have the same visual layout as candidate rows: a red ✕ icon in a tinted square (same size as candidate album art), a text label "Remove from {source}", and a red checkmark when selected. Clicking the remove row SHALL set the track's intent to "remove", highlighting the row with a red border. Clicking an already-selected remove row SHALL deselect it, setting intent to "skip". Selecting the remove row SHALL deselect any previously selected candidate, and vice versa. When a track's intent is "remove", the track name in the card header SHALL display with strikethrough styling and muted color.

#### Scenario: Click remove row to select
- **WHEN** user clicks the remove row on a card
- **THEN** the row highlights with a red border and red checkmark, the track intent becomes "remove", and any selected candidate is deselected

#### Scenario: Click remove row to deselect
- **WHEN** user clicks an already-selected remove row
- **THEN** the highlight is removed and the track intent becomes "skip"

#### Scenario: Remove row deselects candidate
- **WHEN** a candidate is selected and user clicks the remove row
- **THEN** the candidate is deselected and the remove row becomes selected

#### Scenario: Candidate deselects remove row
- **WHEN** the remove row is selected and user clicks a candidate row
- **THEN** the remove row is deselected and the candidate becomes selected

#### Scenario: Remove row on card with no candidates
- **WHEN** a track has no candidates
- **THEN** the card body shows "No replacement candidates found." message followed by the remove row as the only action

#### Scenario: Strikethrough on remove intent
- **WHEN** a track's intent is "remove"
- **THEN** the track name in the card header displays with strikethrough and muted color

### Requirement: Auto-proposal for high-confidence matches
When a track has a confidence-3 candidate (the highest), the system SHALL auto-select it on load: the best candidate row SHALL be highlighted (green border + checkmark) and the track intent SHALL be "replace". Tracks with only confidence 1 or 2 candidates SHALL default to intent "skip" with no candidate selected. Tracks with no candidates SHALL default to intent "skip". There SHALL be no visible confidence indicators — auto-proposal is invisible to the user except for the pre-selected state.

#### Scenario: Track with confidence-3 candidate auto-selected
- **WHEN** background search finds a confidence-3 candidate for a track
- **THEN** the card loads with that candidate row highlighted and the track intent set to "replace"

#### Scenario: Track with only confidence-2 candidates
- **WHEN** the best candidate for a track has confidence 2
- **THEN** the card loads with no candidate selected and intent "skip"

#### Scenario: Track with no candidates
- **WHEN** background search finds no candidates for a track
- **THEN** the card loads with intent "skip" and only the remove row available

### Requirement: Triage track state
Each track SHALL maintain state as: `intent` (enum: "skip" | "replace" | "remove") and `selectedCandidateId` (string or null). When `intent` is "replace", `selectedCandidateId` SHALL reference the chosen candidate. When `intent` is "skip" or "remove", `selectedCandidateId` MAY retain a previous value to allow re-selection if the user re-activates the track. There SHALL be no `removeOriginal` field — a "replace" intent always implies removal of the original. There SHALL be no `checked` boolean — intent "skip" is equivalent to unchecked.

#### Scenario: Replace intent state
- **WHEN** user selects a candidate
- **THEN** state is `{ intent: 'replace', selectedCandidateId: '<uri>' }`

#### Scenario: Remove intent state
- **WHEN** user selects the remove row
- **THEN** state is `{ intent: 'remove', selectedCandidateId: null }` (or a previously retained value)

#### Scenario: Skip intent state
- **WHEN** user deselects any active option
- **THEN** state is `{ intent: 'skip' }` with `selectedCandidateId` optionally retained

#### Scenario: Re-selecting after skip retains previous candidate
- **WHEN** user selects candidate A, deselects (skip), then clicks the checkbox area or re-engages
- **THEN** candidate A can be re-selected without the system resetting to a different candidate

### Requirement: Pending operations generation
The system SHALL generate pending operations from track state as follows: when `intent` is "replace", generate both an `add` operation (with the selected candidate URI) and a `remove` operation (for the original track). When `intent` is "remove", generate only a `remove` operation. When `intent` is "skip", generate no operations. There SHALL be no "addition-only" path — every replace generates both add and remove.

#### Scenario: Replace intent generates add + remove
- **WHEN** a track has intent "replace" with a selected candidate
- **THEN** pendingOps includes one "add" op with the candidate URI and one "remove" op for the original track

#### Scenario: Remove intent generates remove only
- **WHEN** a track has intent "remove"
- **THEN** pendingOps includes one "remove" op for the original track and no "add" op

#### Scenario: Skip intent generates nothing
- **WHEN** a track has intent "skip"
- **THEN** pendingOps includes no operations for that track

### Requirement: Apply bar
A fixed bottom bar SHALL appear (slide up) whenever at least one track has intent "replace" or "remove". The bar SHALL display a summary using two categories: "Replacing N" (tracks with intent "replace") and "removing N" (tracks with intent "remove"), joined with ", ". The "Apply Changes" button SHALL be disabled while background search is in progress. The bar SHALL disappear (slide down) when no tracks have an active intent.

#### Scenario: Apply bar with replacements and removals
- **WHEN** 3 tracks have intent "replace" and 2 tracks have intent "remove"
- **THEN** the apply bar shows "Replacing 3, removing 2"

#### Scenario: Apply bar with only replacements
- **WHEN** 4 tracks have intent "replace" and none have intent "remove"
- **THEN** the apply bar shows "Replacing 4"

#### Scenario: Apply bar disabled during search
- **WHEN** background search is still running and tracks have active intents
- **THEN** the apply bar is visible but "Apply Changes" is disabled

#### Scenario: Apply bar disappears
- **WHEN** all tracks have intent "skip"
- **THEN** the apply bar slides down and disappears

### Requirement: Confirmation modal
Clicking "Apply Changes" SHALL open a modal titled "Review Changes" listing pending operations grouped as: **REPLACE items** (each showing a green REPLACE badge, the candidate name, and destination source) followed by **REMOVE items** (each showing a red REMOVE badge, the original track name, and source). The subtitle SHALL show the same summary as the apply bar. When the batch includes any REMOVE operations (standalone removals or removals from replacements), the modal SHALL display a backup checkbox between the subtitle and the operations list. The checkbox SHALL be **checked by default** with label: "Back up removed tracks to Spotless Backup playlist". The checkbox state SHALL be passed to the batch executor to control whether backup occurs. Footer SHALL contain "Cancel" and "Apply N changes" buttons.

#### Scenario: Review modal with backup checkbox
- **WHEN** user clicks "Apply Changes" with 3 replacements and 2 removals
- **THEN** modal shows 3 items with green REPLACE badge followed by 2 items with red REMOVE badge, subtitle "Replacing 3, removing 2", a checked backup checkbox labeled "Back up removed tracks to Spotless Backup playlist", and "Apply 8 changes" button (counting individual ops)

#### Scenario: User unchecks backup
- **WHEN** user unchecks the backup checkbox and clicks "Apply N changes"
- **THEN** the batch executes without backing up tracks to the backup playlist

#### Scenario: Backup checkbox default state
- **WHEN** the review modal opens with any remove operations
- **THEN** the backup checkbox is checked by default

#### Scenario: No remove operations hides checkbox
- **WHEN** the batch contains only ADD operations with no remove operations
- **THEN** the backup checkbox is not displayed

#### Scenario: Review modal with only replacements
- **WHEN** user clicks "Apply Changes" with 2 replacements and 0 standalone removals
- **THEN** modal shows the backup checkbox because replacements include implicit remove operations

#### Scenario: Cancel review
- **WHEN** user clicks "Cancel"
- **THEN** the modal closes with no changes

### Requirement: Background search progress indicator
While the background replacement search is running, the system SHALL display a persistent progress indicator at the top of the triage view showing "Finding swaps: X/Y" with animation. When complete, it SHALL show "Swap search complete — Y/Y tracks scanned" as static text.

#### Scenario: Search in progress
- **WHEN** background search has completed 12 of 28 tracks
- **THEN** the progress indicator shows "Finding swaps: 12/28" with animation

#### Scenario: Search complete
- **WHEN** all 28 tracks have been searched
- **THEN** the indicator shows "Swap search complete — 28/28 tracks scanned"

### Requirement: Apply progress view
After confirming in the review modal, the modal SHALL transition to a progress view with spinner, "Applying... X/Y", and progress bar. On completion, it SHALL show a checkmark, "All changes applied!", and a "Done" button. On partial failure, it SHALL show succeeded/failed counts, failed items, and a "Retry" option.

#### Scenario: Apply in progress
- **WHEN** 3 of 8 operations are complete
- **THEN** modal shows spinner, "Applying... 3/8", and progress bar

#### Scenario: Apply complete
- **WHEN** all operations succeed
- **THEN** modal shows checkmark, "All changes applied!", and "Done" button

#### Scenario: Partial failure
- **WHEN** 4 of 6 operations succeed and 2 fail
- **THEN** modal shows "4/6 changes applied. 2 failed." with failed items and "Retry"

#### Scenario: Done closes modal and dims applied tracks
- **WHEN** user clicks "Done"
- **THEN** modal closes and applied tracks are dimmed (reduced opacity, non-interactive)

### Requirement: Mini player Spotify links
The mini player SHALL display the currently playing track's name as a link to the track's Spotify page, each artist name as an individual link to the artist's Spotify page, and the album art as a link to the album's Spotify page. All links SHALL open in a new tab.

#### Scenario: Click track name in mini player
- **WHEN** user clicks the track name in the mini player
- **THEN** a new browser tab opens to `https://open.spotify.com/track/{trackId}`

#### Scenario: Click artist name in mini player
- **WHEN** the mini player shows "Artist A, Artist B" and user clicks "Artist B"
- **THEN** a new browser tab opens to `https://open.spotify.com/artist/{artistBId}`

#### Scenario: Click album art in mini player
- **WHEN** user clicks the album art in the mini player
- **THEN** a new browser tab opens to the album's Spotify page
