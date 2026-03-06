## MODIFIED Requirements

### Requirement: Search for replacement candidates
The system SHALL search the Spotify API for replacement candidates automatically for every unplayable track after scan completes (background search). The search query SHALL use Spotify's field-filtered format: `track:"<normalized name>" artist:"<first artist>"` with `type=track`, `limit=3`, and `market=from_token` (to ensure `is_playable` is populated for the user's region). The track name SHALL be normalized by stripping parenthetical suffixes (text in parentheses or after " - " dashes, such as "Remaster", "Deluxe Edition", "feat. X"). The system SHALL filter out any result whose track URI matches the original unplayable track's URI. Searches SHALL execute sequentially (one track at a time) to avoid Spotify API rate limit bursts.

#### Scenario: Background search after scan
- **WHEN** scan completes with 20 unplayable tracks
- **THEN** the system automatically begins searching for replacements for all 20 tracks sequentially without user action

#### Scenario: Search for a remastered track
- **WHEN** the system searches for "Bohemian Rhapsody (2011 Remaster)" by "Queen"
- **THEN** the system searches Spotify with `track:"Bohemian Rhapsody" artist:"Queen"` and returns up to 3 playable candidates

#### Scenario: Search filters out the original
- **WHEN** search results include a track with the same URI as the original unplayable track
- **THEN** that result is excluded from the candidates shown

#### Scenario: No candidates found
- **WHEN** the Spotify search returns no results (or all results are filtered out)
- **THEN** the system reports zero candidates for that track

### Requirement: Cache candidate results
The system SHALL cache search results per unplayable track so that the results persist for the lifetime of the triage view. Cached results SHALL be used to populate auto-proposals and candidate selection without additional API calls.

#### Scenario: Cached results used for triage
- **WHEN** background search completes for a track
- **THEN** the cached candidates are immediately available for display and auto-proposal without re-fetching

## ADDED Requirements

### Requirement: Search progress tracking
The system SHALL track and expose the progress of the background replacement search: how many tracks have been searched (completed) and total tracks to search. This progress SHALL update after each individual track search completes.

#### Scenario: Progress updates incrementally
- **WHEN** 12 of 28 tracks have been searched
- **THEN** search progress reports completed=12, total=28

#### Scenario: Search complete
- **WHEN** all 28 tracks have been searched
- **THEN** search progress reports completed=28, total=28
