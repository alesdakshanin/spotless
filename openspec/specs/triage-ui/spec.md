## Requirements

### Requirement: Triage track list
After scan completes, the system SHALL display all unplayable tracks in a two-section layout based on candidate availability. **Section 1: "Tracks with swap candidates (N)"** SHALL contain tracks with at least one candidate. **Section 2: "No swap found (N)"** SHALL contain tracks where search completed with zero candidates. Each section SHALL have its own header and select-all control. Within each section, tracks SHALL be listed in scan order (no sub-grouping by source). Each row SHALL display: a checkbox, album art thumbnail (40×40), track name, artist name(s) with source shown inline, restriction badge (color-coded by type: region / tier / explicit), and section-specific trailing content. Tracks whose search is still pending SHALL NOT appear in either section until their search completes — they remain in a pending/shimmer state.

#### Scenario: Display two-section triage layout
- **WHEN** scan completes and background search finds 7 tracks with candidates and 3 with no match
- **THEN** Section 1 shows "Tracks with swap candidates (7)" with 7 rows, and Section 2 shows "No swap found (3)" with 3 rows

#### Scenario: Track with no thumbnail
- **WHEN** a track has no album art URL
- **THEN** the row displays a neutral placeholder in the thumbnail position

#### Scenario: Pending tracks excluded from sections
- **WHEN** background search has completed 15 of 20 tracks, with 10 having candidates and 5 having no match
- **THEN** Section 1 shows 10 tracks, Section 2 shows 5 tracks, and 5 tracks are not yet visible in either section

#### Scenario: All tracks have candidates
- **WHEN** every track has at least one candidate
- **THEN** Section 2 ("No swap found") is not rendered

#### Scenario: All tracks have no match
- **WHEN** every track has zero candidates
- **THEN** Section 1 ("Tracks with swap candidates") is not rendered, and Section 2 is displayed prominently

### Requirement: Summary counters
At the top of the triage view, the system SHALL display a row of live-updating summary counters: "N swapping" (tracks checked with candidates, styled green/positive), "N removing" (no-match tracks checked for removal, styled red/destructive), and "N no match" (total no-match tracks, neutral styling). Counters SHALL update immediately as the user interacts.

#### Scenario: Summary counters reflect selections
- **WHEN** 5 tracks with candidates are checked and 2 no-match tracks are checked for removal
- **THEN** counters show "5 swapping · 2 removing · 3 no match" (assuming 3 total no-match tracks)

#### Scenario: No selections
- **WHEN** no tracks are checked
- **THEN** counters show "0 swapping · 0 removing · N no match"

### Requirement: Auto-proposal for high-confidence matches
When a track has a ★★★ (confidence 3) candidate, the system SHALL auto-propose it: the checkbox SHALL be pre-checked, the best candidate SHALL be pre-selected, and "remove original" SHALL be pre-enabled. The row SHALL have a subtle visual distinction (e.g., tinted background or left border accent) to signal it is pre-handled. Tracks with only ★★ or ★ candidates SHALL have the checkbox unchecked and no candidate pre-selected. Tracks with no candidates SHALL have the checkbox unchecked (but enabled — they can be checked for removal in Section 2).

#### Scenario: Track with 3-star candidate
- **WHEN** background search finds a ★★★ candidate for a track
- **THEN** the row is pre-checked with the best candidate selected, remove-original enabled, and a visual accent indicating auto-proposal

#### Scenario: Track with only 2-star candidates
- **WHEN** the best candidate for a track is ★★
- **THEN** the row checkbox is unchecked, no candidate is pre-selected, and the row appears neutral

#### Scenario: Track with no candidates
- **WHEN** background search finds no candidates for a track
- **THEN** the track appears in Section 2 with checkbox unchecked and enabled, and inline text shows "No match found" in muted/italic style

### Requirement: No-match track removal
Tracks in Section 2 ("No swap found") SHALL have their checkbox enabled. Checking a no-match track SHALL mark it for removal. When checked, the row SHALL display a red/destructive checkbox color, a subtle destructive-tinted background, and strikethrough styling on the track name. Unchecking SHALL remove the removal mark and restore normal styling.

#### Scenario: Check no-match track for removal
- **WHEN** user checks a track in the "No swap found" section
- **THEN** the checkbox turns red, the row gets a destructive tint, and the track name shows strikethrough

#### Scenario: Uncheck no-match track
- **WHEN** user unchecks a previously checked no-match track
- **THEN** the checkbox, background, and track name revert to normal styling

### Requirement: Checkbox color differentiation
Checkboxes in Section 1 (swap candidates) SHALL use green/accent color when checked. Checkboxes in Section 2 (no swap found) SHALL use red/destructive color when checked. Unchecked checkboxes in both sections SHALL use the same neutral border style.

#### Scenario: Swap section checked checkbox
- **WHEN** a track with candidates is checked
- **THEN** the checkbox displays with green/accent fill

#### Scenario: Removal section checked checkbox
- **WHEN** a no-match track is checked for removal
- **THEN** the checkbox displays with red/destructive fill

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
Above the track list, the system SHALL display a horizontal bar of filter chips: "All (N)", "★★★ Auto-proposed (N)", "★★ Needs review (N)", and "No match (N)" where N is the count of tracks in each category. Filters SHALL be mutually exclusive (radio behavior). Selecting a filter SHALL instantly filter the visible list, collapse any expanded row, and hide entire sections when irrelevant (e.g., "No match" filter hides the swap section). The filter bar SHALL also show a running count of total selected (checked) tracks on the right side.

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
Each section SHALL have its own select-all control directly below the section header. Section 1's select-all SHALL be labeled "Select all with candidates" and SHALL check all tracks in Section 1, auto-selecting their best candidate. Section 2's select-all SHALL be labeled "Select all for removal" and SHALL check all tracks in Section 2 for removal. Both SHALL show tri-state behavior: unchecked (none), partial (some), fully checked (all). Toggling off SHALL uncheck all tracks in that section. The global select-all in the filter bar is removed.

#### Scenario: Select all in swap section
- **WHEN** user clicks "Select all with candidates" in Section 1
- **THEN** all tracks in Section 1 become checked with their best candidate selected

#### Scenario: Select all for removal
- **WHEN** user clicks "Select all for removal" in Section 2
- **THEN** all tracks in Section 2 become checked for removal with red checkboxes and strikethrough styling

#### Scenario: Deselect all in a section
- **WHEN** user clicks a fully-checked section select-all
- **THEN** all tracks in that section become unchecked

#### Scenario: Tri-state partial in section
- **WHEN** 3 of 8 tracks in Section 1 are checked
- **THEN** Section 1's select-all shows partial/indeterminate state

### Requirement: Background search progress indicator
While the background replacement search is running, the system SHALL display a persistent progress indicator at the top of the triage view showing "Finding swaps: X/Y" with a subtle animated indicator. When the search completes, it SHALL show "Swap search complete — Y/Y tracks scanned" as a static indicator. Tracks whose search is still pending SHALL show a loading/shimmer state on the confidence indicator.

#### Scenario: Search in progress
- **WHEN** background search has completed 12 of 28 tracks
- **THEN** the progress indicator shows "Finding swaps: 12/28" with animation

#### Scenario: Search complete
- **WHEN** all 28 tracks have been searched
- **THEN** the progress indicator shows "Swap search complete — 28/28 tracks scanned" without animation

#### Scenario: Pending track loading state
- **WHEN** a track's search has not yet completed
- **THEN** the track row shows a subtle shimmer/loading state on the confidence indicator and candidate preview area

### Requirement: Apply bar
A fixed bottom bar SHALL appear (slide up) whenever at least one action is pending — either a swap selection, an original removal, or a no-match removal. The bar SHALL display a summary using track-level intent labels — "N swaps" (replacement selected + remove original), "N additions" (replacement selected, keep original), "N removals" (remove only OR no-match marked for removal) — joined with " + ". An "Apply Changes" primary action button appears alongside. The "Apply Changes" button SHALL be disabled (visually muted, non-clickable) while the background swap search is still in progress, to prevent applying before all tracks have been searched. The bar SHALL disappear (slide down) when no changes are pending.

#### Scenario: Apply bar with swaps and removals
- **WHEN** 3 tracks are checked with candidates and remove-original on, and 2 no-match tracks are checked for removal
- **THEN** the apply bar shows "3 swaps + 2 removals"

#### Scenario: Apply bar with mixed actions
- **WHEN** 2 tracks have candidates with remove-original on (swaps), 1 track has candidate without remove-original (addition), and 3 no-match tracks are checked for removal
- **THEN** the apply bar shows "2 swaps + 1 addition + 3 removals"

#### Scenario: Apply button disabled during search
- **WHEN** the background swap search is still running and tracks are checked
- **THEN** the apply bar is visible with the summary, but "Apply Changes" is disabled (muted styling, not clickable)

#### Scenario: Apply button enabled after search
- **WHEN** the background swap search completes
- **THEN** the "Apply Changes" button becomes enabled

#### Scenario: Apply bar disappears
- **WHEN** user unchecks all tracks in both sections
- **THEN** the apply bar slides down and disappears

### Requirement: Confirmation modal
Clicking "Apply Changes" SHALL open a modal overlay titled "Review Changes" with a subtitle showing the summary (e.g., "3 swaps + 2 removals") and a warning that changes will modify the Spotify library. The modal SHALL contain a scrollable list of pending operations, grouped by type: **SWAP items first** (each showing a green SWAP badge, the candidate name, destination source, and confidence stars — representing both the add and removal of the original as one atomic item), followed by a separator, then **RMV items** (each showing a red RMV badge, the track name, and source). Footer SHALL contain "Cancel" (closes modal) and "Apply N changes" (triggers batch execution).

#### Scenario: Review modal with swaps and removals
- **WHEN** user clicks "Apply Changes" with 3 swaps and 2 removals
- **THEN** modal shows "Review Changes" with subtitle "3 swaps + 2 removals", lists 3 SWAP items (green badges) followed by 2 RMV items (red badges), and has Cancel + "Apply 5 changes" buttons

#### Scenario: Cancel review
- **WHEN** user clicks "Cancel" in the review modal
- **THEN** the modal closes and the triage view is unchanged

### Requirement: Triage track state
Each track SHALL maintain independent state: `checked` (boolean, included in batch — for swap OR removal depending on section), `selectedCandidateId` (string or null), and `removeOriginal` (boolean). For tracks with candidates: checking SHALL auto-select the best candidate if none is selected; unchecking SHALL clear the candidate selection; `removeOriginal` defaults to true for ★★★ tracks. For no-match tracks: `checked` means marked for removal; `selectedCandidateId` and `removeOriginal` are unused.

#### Scenario: Check a track with candidates auto-selects best candidate
- **WHEN** user checks a track in Section 1 that has candidates but none selected
- **THEN** the best (highest confidence) candidate is automatically selected

#### Scenario: Uncheck clears selection
- **WHEN** user unchecks a checked track in Section 1
- **THEN** the selected candidate is cleared (set to null)

#### Scenario: Auto-proposal defaults
- **WHEN** background search finds a ★★★ candidate
- **THEN** the track state is initialized with checked=true, selectedCandidateId=best candidate, removeOriginal=true

#### Scenario: Check no-match track
- **WHEN** user checks a track in Section 2 (no candidates)
- **THEN** the track is marked for removal; selectedCandidateId remains null

### Requirement: Apply progress view
After confirming in the review modal, the modal content SHALL transition to a progress view showing a centered spinner, progress text ("Applying... X/Y"), and a progress bar. Swap operations execute first (add candidate + remove original per track), then standalone removals. When all operations complete, the view SHALL transition to a completion state showing a checkmark, "All changes applied!", breakdown counts ("N swaps, N removals"), and a "Done" button.

#### Scenario: Apply in progress
- **WHEN** batch apply is executing and 3 of 8 operations are complete
- **THEN** the modal shows a spinner, "Applying... 3/8", and a progress bar

#### Scenario: Apply complete
- **WHEN** all operations complete successfully with 3 swaps and 2 removals
- **THEN** the modal shows a checkmark, "All changes applied!", "3 swaps, 2 removals", and a "Done" button

#### Scenario: Partial failure
- **WHEN** 4 of 6 operations succeed and 2 fail
- **THEN** the modal shows "4/6 changes applied. 2 failed." with the failed items listed and a "Retry" option

#### Scenario: Done closes modal and dims applied tracks
- **WHEN** user clicks "Done" after apply completes
- **THEN** the modal closes and applied tracks are dimmed (reduced opacity, non-interactive) in the triage list

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
