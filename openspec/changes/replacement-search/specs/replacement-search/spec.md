## ADDED Requirements

### Requirement: Search for replacement candidates
The system SHALL search the Spotify API for replacement candidates when a user expands an unplayable track row. The search query SHALL use Spotify's field-filtered format: `track:"<normalized name>" artist:"<first artist>"` with `type=track` and `limit=3`. The track name SHALL be normalized by stripping parenthetical suffixes (text in parentheses or after " - " dashes, such as "Remaster", "Deluxe Edition", "feat. X"). The system SHALL filter out any result whose track URI matches the original unplayable track's URI.

#### Scenario: Search for a remastered track
- **WHEN** the user expands a row for "Bohemian Rhapsody (2011 Remaster)" by "Queen"
- **THEN** the system searches Spotify with `track:"Bohemian Rhapsody" artist:"Queen"` and returns up to 3 playable candidates

#### Scenario: Search filters out the original
- **WHEN** search results include a track with the same URI as the original unplayable track
- **THEN** that result is excluded from the candidates shown

#### Scenario: No candidates found
- **WHEN** the Spotify search returns no results (or all results are filtered out)
- **THEN** the system reports zero candidates for that track

### Requirement: Score candidate confidence
The system SHALL assign a confidence score (1, 2, or 3) to each candidate based on normalized string comparison with the original track. Normalization SHALL lowercase the string and strip parenthetical suffixes. Scoring rules:
- **3 (high)**: Normalized artist matches exactly AND normalized title matches exactly
- **2 (medium)**: Normalized artist matches exactly AND one normalized title contains the other
- **1 (low)**: All other candidates returned by search

#### Scenario: Exact match after normalization
- **WHEN** original is "Song Title (Remaster)" by "Artist" and candidate is "Song Title (Deluxe)" by "Artist"
- **THEN** the candidate receives confidence score 3 (both normalize to "Song Title" / "Artist")

#### Scenario: Partial title match
- **WHEN** original is "Song Title" by "Artist" and candidate is "Song Title - Live at Wembley" by "Artist"
- **THEN** the candidate receives confidence score 2 (artist matches, candidate title contains original title)

#### Scenario: Different artist
- **WHEN** original is "Song Title" by "Artist A" and candidate is "Song Title" by "Artist B"
- **THEN** the candidate receives confidence score 1 (artist does not match)

### Requirement: Cache candidate results
The system SHALL cache search results per unplayable track so that collapsing and re-expanding a row does not trigger a new API call. The cache SHALL persist for the lifetime of the results screen.

#### Scenario: Re-expand a previously searched track
- **WHEN** user collapses and re-expands a track that was previously searched
- **THEN** the cached candidates are displayed immediately without a new API call

### Requirement: Candidate preview playback
Each candidate row SHALL include a play/preview button. If the candidate track has a `preview_url`, clicking the button SHALL play the 30-second audio clip using an HTML `<audio>` element. If the candidate has no `preview_url`, clicking the button SHALL open the track in Spotify's web player in a new tab. The system SHALL visually distinguish between inline preview (▶) and external link (↗). Only one preview SHALL play at a time — starting a new preview SHALL stop any currently playing one.

#### Scenario: Preview available
- **WHEN** user clicks the play button on a candidate that has a `preview_url`
- **THEN** a 30-second audio clip plays inline, and any other currently playing preview stops

#### Scenario: No preview available
- **WHEN** user clicks the play button on a candidate that has no `preview_url`
- **THEN** the track opens in Spotify's web player in a new browser tab

#### Scenario: Stop current preview when starting another
- **WHEN** a preview is playing and the user clicks play on a different candidate
- **THEN** the first preview stops and the new one begins
