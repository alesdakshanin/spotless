## Requirements

### Requirement: Script reads token from environment
The script SHALL read the Spotify access token from the `SPOTIFY_TOKEN` environment variable. If the variable is not set or is empty, the script SHALL exit with a non-zero code and print a message explaining how to obtain and set the token.

#### Scenario: Token provided
- **WHEN** `SPOTIFY_TOKEN` is set to a valid Spotify access token
- **THEN** the script uses it for all Spotify API requests via `Authorization: Bearer <token>` header

#### Scenario: Token missing
- **WHEN** `SPOTIFY_TOKEN` is not set or is empty
- **THEN** the script exits with code 1 and prints instructions for obtaining a token

### Requirement: Script creates or reuses test playlist
The script SHALL look for an existing playlist named "Spotless Test" owned by the current user. If found, it SHALL reuse it. If not found, it SHALL create a new public playlist with that name and a description indicating it is for testing.

#### Scenario: Playlist does not exist
- **WHEN** the user has no playlist named "Spotless Test"
- **THEN** the script creates a new playlist named "Spotless Test" via `POST /users/{user_id}/playlists`
- **AND** prints that a new playlist was created

#### Scenario: Playlist already exists
- **WHEN** the user already has a playlist named "Spotless Test"
- **THEN** the script reuses it without creating a duplicate
- **AND** prints that an existing playlist was found

### Requirement: Script verifies track playability before adding
The script SHALL verify each curated track URI by calling `GET /tracks?ids=...&market=from_token`. Only tracks where `is_playable === false` SHALL be added to the playlist.

#### Scenario: Track is unplayable
- **WHEN** a curated track has `is_playable` equal to `false`
- **THEN** the track is included in the set to be added to the playlist

#### Scenario: Track is playable
- **WHEN** a curated track has `is_playable` equal to `true` or is not `false`
- **THEN** the track is excluded and reported as "playable in your region"

#### Scenario: Track ID is invalid or not found
- **WHEN** a curated track ID returns `null` from the tracks endpoint
- **THEN** the track is excluded and reported as "not found (possibly deleted)"

### Requirement: Script adds only unplayable tracks to playlist
The script SHALL add verified unplayable tracks to the "Spotless Test" playlist via `POST /playlists/{id}/tracks`. It SHALL NOT add tracks that are playable or not found.

#### Scenario: Unplayable tracks found
- **WHEN** at least one curated track is verified as unplayable
- **THEN** the script adds those tracks to the playlist and prints how many were added

#### Scenario: No unplayable tracks found
- **WHEN** all curated tracks are playable in the user's region
- **THEN** the script prints that no unplayable tracks were found and suggests trying from a different region or updating the curated list

### Requirement: Script prints a summary report
The script SHALL print a final summary showing the total number of curated tracks checked, how many were unplayable (added), how many were playable (skipped), and how many were not found.

#### Scenario: Mixed results
- **WHEN** the script finishes processing and some tracks are unplayable and some are playable
- **THEN** it prints a summary like: "Checked 25 tracks: 8 unplayable (added), 15 playable (skipped), 2 not found"

### Requirement: Script handles rate limiting
The script SHALL retry on HTTP 429 responses, waiting for the duration specified in the `Retry-After` header before retrying.

#### Scenario: Rate limited by Spotify
- **WHEN** a Spotify API call returns HTTP 429
- **THEN** the script waits for the `Retry-After` duration and retries the request

### Requirement: Script maintains a curated track list
The script SHALL contain a hardcoded list of Spotify track URIs (at least 15) that are known to be region-locked in many Western markets. The list SHALL include tracks from multiple categories: Japanese exclusives, regional K-Pop, re-uploaded tracks, and regional Indian releases.

#### Scenario: Curated list contents
- **WHEN** the script is examined
- **THEN** it contains at least 15 Spotify track URIs spanning multiple region-lock categories
