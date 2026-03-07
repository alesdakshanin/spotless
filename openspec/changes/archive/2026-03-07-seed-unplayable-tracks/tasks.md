## 1. Script scaffold and token handling

- [x] 1.1 Create `scripts/seed-unplayable.ts` with main entry point, read `SPOTIFY_TOKEN` from env, exit with instructions if missing
- [x] 1.2 Implement `spotifyGet` and `spotifyPost` helper functions using Node built-in `fetch` with Bearer auth and 429 retry

## 2. Playlist management

- [x] 2.1 Fetch user profile via `GET /me` to get user ID
- [x] 2.2 Search user's playlists for existing "Spotless Test" playlist (paginate through `GET /me/playlists`)
- [x] 2.3 Create "Spotless Test" playlist via `POST /users/{id}/playlists` if not found, or reuse existing

## 3. Track verification and seeding

- [x] 3.1 Add curated list of 15+ region-locked track URIs (Japanese exclusives, K-Pop, re-uploaded, Indian releases)
- [x] 3.2 Verify playability via `GET /tracks?ids=...&market=from_token`, categorize as unplayable / playable / not found
- [x] 3.3 Add verified unplayable tracks to the playlist via `POST /playlists/{id}/tracks`

## 4. Reporting

- [x] 4.1 Print summary report: total checked, unplayable (added), playable (skipped), not found
- [x] 4.2 Handle zero-unplayable case with helpful message suggesting different region or list update
