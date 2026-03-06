## MODIFIED Requirements

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

## ADDED Requirements

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
