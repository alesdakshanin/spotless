## Requirements

### Requirement: Triage track list
After scan completes, the system SHALL display all unplayable tracks in a flat list with one row per track. Each row SHALL display: a checkbox, album art thumbnail (40×40), track name, artist name(s), source tag (playlist name or "Liked Songs"), restriction badge (color-coded by type: region / tier / explicit), confidence indicator for the best available candidate, and a truncated preview of the best candidate name. Rows SHALL be grouped by source, with Liked Songs first, then playlists alphabetically. Each group SHALL have a small header label.

#### Scenario: Display triage list after scan
- **WHEN** scan completes with 10 unplayable tracks across Liked Songs and 2 playlists
- **THEN** the system displays a flat list of 10 rows grouped by source with headers, each showing checkbox, thumbnail, track info, source tag, restriction badge, and candidate preview

#### Scenario: Track with no thumbnail
- **WHEN** a track has no album art URL
- **THEN** the row displays a neutral placeholder in the thumbnail position

#### Scenario: Source grouping order
- **WHEN** unplayable tracks are found in "Liked Songs", "Workout", and "Chill"
- **THEN** groups appear in order: Liked Songs, Chill, Workout (Liked Songs first, playlists alphabetical)

### Requirement: Auto-proposal for high-confidence matches
When a track has a ★★★ (confidence 3) candidate, the system SHALL auto-propose it: the checkbox SHALL be pre-checked, the best candidate SHALL be pre-selected, and "remove original" SHALL be pre-enabled. The row SHALL have a subtle visual distinction (e.g., tinted background or left border accent) to signal it is pre-handled. Tracks with only ★★ or ★ candidates SHALL have the checkbox unchecked and no candidate pre-selected. Tracks with no candidates SHALL have the checkbox unchecked and disabled.

#### Scenario: Track with 3-star candidate
- **WHEN** background search finds a ★★★ candidate for a track
- **THEN** the row is pre-checked with the best candidate selected, remove-original enabled, and a visual accent indicating auto-proposal

#### Scenario: Track with only 2-star candidates
- **WHEN** the best candidate for a track is ★★
- **THEN** the row checkbox is unchecked, no candidate is pre-selected, and the row appears neutral

#### Scenario: Track with no candidates
- **WHEN** background search finds no candidates for a track
- **THEN** the row checkbox is unchecked and disabled, confidence shows empty/dash, and inline text shows "no match" in muted style

### Requirement: Row expansion for candidate selection
Clicking a track row SHALL expand an inline panel below it (accordion style — only one expanded at a time). The expansion panel SHALL display a section header ("Candidates for {track name}"), each candidate as a sub-row with: album art (36×36) linked to the album's Spotify page, candidate name linked to the track's Spotify page + artist name(s) each individually linked to their Spotify artist page, star rating, a "Recommended" badge on ★★★ candidates, and a radio-style selection indicator. Below the candidates SHALL be a "Remove original from {source}" toggle. Clicking a candidate SHALL select it and check the parent row. If a track has no candidates, the expansion panel SHALL show "No replacement candidates found for this track." All Spotify links SHALL open in a new tab and SHALL NOT interfere with candidate radio-selection behavior.

#### Scenario: Expand a track with candidates
- **WHEN** user clicks a track row that has 3 candidates
- **THEN** an inline panel expands below showing all 3 candidates with selection controls and a remove-original toggle

#### Scenario: Select a candidate from expansion
- **WHEN** user clicks a candidate in the expansion panel
- **THEN** that candidate becomes selected (radio behavior), and the parent row's checkbox becomes checked

#### Scenario: Only one row expanded at a time
- **WHEN** user clicks a different track row while one is already expanded
- **THEN** the previously expanded row collapses and the clicked row expands

#### Scenario: Expand track with no candidates
- **WHEN** user expands a track that has no replacement candidates
- **THEN** the expansion panel shows "No replacement candidates found for this track."

#### Scenario: Click candidate track name link
- **WHEN** user clicks the candidate track name in an expansion panel
- **THEN** a new browser tab opens to `https://open.spotify.com/track/{trackId}` and the candidate radio selection is NOT triggered

#### Scenario: Click candidate artist name link
- **WHEN** user clicks an individual artist name in a candidate row
- **THEN** a new browser tab opens to `https://open.spotify.com/artist/{artistId}` and the candidate radio selection is NOT triggered

#### Scenario: Click candidate album art link
- **WHEN** user clicks the album art thumbnail in a candidate row
- **THEN** a new browser tab opens to `https://open.spotify.com/album/{albumId}` and the candidate radio selection is NOT triggered

### Requirement: Filter bar
Above the track list, the system SHALL display a horizontal bar of filter chips: "All (N)", "★★★ Auto-proposed (N)", "★★ Needs review (N)", and "No match (N)" where N is the count of tracks in each category. Filters SHALL be mutually exclusive (radio behavior). Selecting a filter SHALL instantly filter the visible list, collapse any expanded row, and update the select-all control to operate on the visible subset. The filter bar SHALL also show a running count of total selected (checked) tracks on the right side.

#### Scenario: Filter to auto-proposed
- **WHEN** user clicks the "★★★ Auto-proposed" filter chip
- **THEN** only tracks with a ★★★ best candidate are shown, any expanded row collapses, and counts update

#### Scenario: Filter counts reflect search results
- **WHEN** background search completes with 15 tracks: 8 with ★★★, 4 with ★★, 3 with no match
- **THEN** filter chips show: All (15), ★★★ Auto-proposed (8), ★★ Needs review (4), No match (3)

#### Scenario: Selected count in filter bar
- **WHEN** 5 tracks are checked across all categories
- **THEN** the filter bar right side shows "5 selected"

### Requirement: Select all control
Above the track rows, the system SHALL display a "select all visible with candidates" checkbox. The checkbox SHALL show tri-state: unchecked (none selected), partial (some selected), fully checked (all visible with candidates selected). Toggling it on SHALL check each visible track that has candidates and select its best candidate. Toggling it off SHALL uncheck all visible tracks and clear selections.

#### Scenario: Select all on auto-proposed filter
- **WHEN** user filters to "★★★ Auto-proposed" and clicks select-all
- **THEN** all visible tracks become checked with their best candidate selected

#### Scenario: Select all off
- **WHEN** user clicks select-all when some or all are selected
- **THEN** all visible tracks become unchecked and candidate selections are cleared

#### Scenario: Tri-state partial
- **WHEN** 3 of 8 visible tracks are checked
- **THEN** the select-all checkbox shows a partial/indeterminate state

#### Scenario: Select all skips no-candidate tracks
- **WHEN** user clicks select-all and some visible tracks have no candidates
- **THEN** only tracks with candidates become checked; no-candidate tracks remain unchecked and disabled

### Requirement: Background search progress indicator
While the background replacement search is running, the system SHALL display a persistent progress indicator at the top of the triage view showing "Finding replacements: X/Y" with a subtle animated indicator. When the search completes, it SHALL show "Replacement search complete — Y/Y tracks scanned" as a static indicator. Tracks whose search is still pending SHALL show a loading/shimmer state on the confidence indicator.

#### Scenario: Search in progress
- **WHEN** background search has completed 12 of 28 tracks
- **THEN** the progress indicator shows "Finding replacements: 12/28" with animation

#### Scenario: Search complete
- **WHEN** all 28 tracks have been searched
- **THEN** the progress indicator shows "Replacement search complete — 28/28 tracks scanned" without animation

#### Scenario: Pending track loading state
- **WHEN** a track's search has not yet completed
- **THEN** the track row shows a subtle shimmer/loading state on the confidence indicator and candidate preview area

### Requirement: Apply bar
A fixed bottom bar SHALL appear (slide up) whenever at least one track is checked with a selected candidate. The bar SHALL display a summary ("N replacements + N removals") and an "Apply Changes" primary action button. The bar SHALL disappear (slide down) when no changes are pending.

#### Scenario: Apply bar appears
- **WHEN** user checks a track with a selected candidate
- **THEN** a fixed bottom bar slides up showing "1 replacement + 1 removal" and an "Apply Changes" button

#### Scenario: Apply bar updates counts
- **WHEN** 3 tracks are checked with candidates and remove-original enabled on all
- **THEN** the apply bar shows "3 replacements + 3 removals"

#### Scenario: Apply bar disappears
- **WHEN** user unchecks all tracks
- **THEN** the apply bar slides down and disappears

### Requirement: Confirmation modal
Clicking "Apply Changes" SHALL open a modal overlay titled "Review Changes" with a subtitle showing operation counts and a warning that changes will modify the Spotify library. The modal SHALL contain a scrollable list of all pending operations, each showing: action type badge (ADD / REMOVE), track or candidate name, target source, and confidence stars. Footer SHALL contain "Cancel" (closes modal) and "Apply N changes" (triggers batch execution).

#### Scenario: Review modal content
- **WHEN** user clicks "Apply Changes" with 3 replacements and 3 removals staged
- **THEN** a modal shows "Review Changes", lists 6 operations with badges and details, and has Cancel + "Apply 6 changes" buttons

#### Scenario: Cancel review
- **WHEN** user clicks "Cancel" in the review modal
- **THEN** the modal closes and the triage view is unchanged

### Requirement: Apply progress view
After confirming in the review modal, the modal content SHALL transition to a progress view showing a centered spinner, progress text ("Applying... X/Y"), and a progress bar. Operations SHALL execute sequentially. When all operations complete, the view SHALL transition to a success state showing a checkmark, "All changes applied!", operation count, and a "Done" button.

#### Scenario: Apply in progress
- **WHEN** batch apply is executing and 3 of 6 operations are complete
- **THEN** the modal shows a spinner, "Applying... 3/6", and a half-filled progress bar

#### Scenario: Apply complete
- **WHEN** all 6 operations complete successfully
- **THEN** the modal shows a checkmark, "All changes applied!", "6 changes applied", and a "Done" button

#### Scenario: Partial failure
- **WHEN** 4 of 6 operations succeed and 2 fail
- **THEN** the modal shows "4/6 changes applied. 2 failed." with the failed items listed and a "Retry" option

#### Scenario: Done closes modal and dims applied tracks
- **WHEN** user clicks "Done" after apply completes
- **THEN** the modal closes and applied tracks are dimmed (reduced opacity, non-interactive) in the triage list

### Requirement: Triage track state
Each track SHALL maintain independent state: `checked` (boolean, included in batch), `selectedCandidateId` (string or null), and `removeOriginal` (boolean). Checking a track SHALL auto-select the best candidate if none is selected. Unchecking SHALL clear the candidate selection. The `removeOriginal` flag defaults to true for auto-proposed (★★★) tracks and false otherwise.

#### Scenario: Check a track auto-selects best candidate
- **WHEN** user checks a track that has candidates but none selected
- **THEN** the best (highest confidence) candidate is automatically selected

#### Scenario: Uncheck clears selection
- **WHEN** user unchecks a checked track
- **THEN** the selected candidate is cleared (set to null)

#### Scenario: Auto-proposal defaults
- **WHEN** background search finds a ★★★ candidate
- **THEN** the track state is initialized with checked=true, selectedCandidateId=best candidate, removeOriginal=true

### Requirement: Mini player Spotify links
The mini player SHALL display the currently playing track's name as a link to the track's Spotify page, each artist name as an individual link to the artist's Spotify page, and the album art as a link to the album's Spotify page. All links SHALL open in a new tab.

#### Scenario: Click track name in mini player
- **WHEN** user clicks the track name in the mini player
- **THEN** a new browser tab opens to `https://open.spotify.com/track/{trackId}`

#### Scenario: Click artist name in mini player
- **WHEN** the mini player shows "Artist A, Artist B" and user clicks "Artist B"
- **THEN** a new browser tab opens to `https://open.spotify.com/artist/{artistBId}` (only that artist)

#### Scenario: Click album art in mini player
- **WHEN** user clicks the album art in the mini player
- **THEN** a new browser tab opens to the album's Spotify page
