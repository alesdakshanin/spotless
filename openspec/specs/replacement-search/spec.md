## Requirements

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
The system SHALL cache search results per unplayable track so that the results persist for the lifetime of the triage view. Cached results SHALL be used to populate auto-proposals and candidate selection without additional API calls.

#### Scenario: Cached results used for triage
- **WHEN** background search completes for a track
- **THEN** the cached candidates are immediately available for display and auto-proposal without re-fetching

### Requirement: Search progress tracking
The system SHALL track and expose the progress of the background replacement search: how many tracks have been searched (completed) and total tracks to search. This progress SHALL update after each individual track search completes.

#### Scenario: Progress updates incrementally
- **WHEN** 12 of 28 tracks have been searched
- **THEN** search progress reports completed=12, total=28

#### Scenario: Search complete
- **WHEN** all 28 tracks have been searched
- **THEN** search progress reports completed=28, total=28

### Requirement: Candidate playback via Spotify Web Playback SDK
Each candidate row SHALL include a play button that plays the full track using the Spotify Web Playback SDK. The SDK creates a virtual playback device in the browser, requiring OAuth scopes `streaming` and `user-modify-playback-state` (and a Spotify Premium account). When the SDK is connected, clicking the button SHALL start playback via `PUT /me/player/play` with the track's Spotify URI. When the SDK is not yet connected (or the user lacks Premium), the button SHALL fall back to an external link (↗) opening the track in Spotify's web player in a new tab. Only one track SHALL play at a time — starting a new track SHALL stop the current one.

A persistent mini player bar SHALL appear at the bottom of the triage view when a track is playing, showing album art, track name, artist, a play/pause toggle, and a dismiss button. The mini player SHALL remain visible when paused (allowing resume) and disappear when dismissed or when the triage view unmounts. The mini player stacks above the apply bar when both are visible.

Playback state is driven by the SDK's `player_state_changed` event, providing bidirectional sync — changes from the real Spotify app are reflected in the UI automatically.

#### Scenario: SDK connected — play a candidate
- **WHEN** the SDK is connected and the user clicks the play button on a candidate
- **THEN** the full track plays via the SDK device, the mini player appears, and any other currently playing track stops

#### Scenario: SDK not connected — fallback to Spotify link
- **WHEN** the SDK is not connected and the user clicks on a candidate
- **THEN** the track opens in Spotify's web player in a new browser tab (↗ icon)

#### Scenario: Toggle pause/resume from mini player
- **WHEN** a track is playing and the user clicks the pause button on the mini player
- **THEN** playback pauses but the mini player remains visible with a resume button

#### Scenario: Dismiss mini player
- **WHEN** the user clicks the dismiss button (✕) on the mini player
- **THEN** playback stops and the mini player disappears
