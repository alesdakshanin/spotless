## 0. Tooling Setup

- [x] 0.1 Install and configure Biome — add `biome.json`, add format/lint scripts to `package.json`
- [x] 0.2 Install and configure Tailwind CSS — `@tailwindcss/vite` plugin, update `src/style.css` with Tailwind import
- [x] 0.3 Tighten `tsconfig.json` — add `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`
- [x] 0.4 Add `npm run check` script — `tsc --noEmit && biome check && vitest run`

## 1. Project Setup

- [x] 1.1 Create `src/types.ts` with shared types: `UnplayableTrack`, `ScanEvent`, `ScanSummary`, Spotify API response types
- [x] 1.2 Add `.env.example` with `VITE_SPOTIFY_CLIENT_ID` placeholder and update `.gitignore` for `.env`
- [x] 1.3 Add `DEVELOPMENT.md` — document Spotify app setup: creating a Spotify app in the developer dashboard, configuring redirect URIs for both `http://localhost:5173/` and the production GitHub Pages URL, copying the client ID into `.env`

## 2. Spotify Auth

- [x] 2.1 Implement `src/auth.ts` — PKCE helpers (code verifier, code challenge via Web Crypto), login redirect, callback handler, token exchange
- [x] 2.2 Add token storage in sessionStorage — save/load/clear access token, refresh token, expiry
- [x] 2.3 Add token refresh logic — detect expiry, call Spotify token endpoint with refresh token, update storage
- [x] 2.4 Write tests for auth module — PKCE generation, token storage, callback parsing

## 3. Spotify API Client

- [ ] 3.1 Implement `src/api.ts` — fetch wrapper that attaches Bearer token, auto-refreshes on 401, handles 429 rate limiting with Retry-After
- [ ] 3.2 Write tests for API client — token attachment, 401 refresh retry, 429 backoff

## 4. Library Scanner

- [ ] 4.1 Implement `src/scanner.ts` — async generator that scans Liked Songs (paginated, market=from_token), yields progress and found events
- [ ] 4.2 Add playlist scanning — fetch user's playlists, filter to owned, scan each playlist's tracks with pagination
- [ ] 4.3 Add unplayable detection — check `is_playable`, map `restrictions.reason` to human-readable messages, skip `is_local` tracks
- [ ] 4.4 Write tests for scanner — unplayable detection logic, local file skipping, progress event emission

## 5. UI

- [ ] 5.1 Implement `src/ui.ts` — login screen with "Log in with Spotify" button
- [ ] 5.2 Add scan screen — display user name, logout button, "Scan Library" button
- [ ] 5.3 Add progress display — live "Scanning [source]... X / Y" with running unplayable count
- [ ] 5.4 Add results display — list unplayable tracks (name, artist, source, reason), summary stats, "Scan Again" button
- [ ] 5.5 Add "Your library is spotless!" happy path for clean results

## 6. Integration

- [ ] 6.1 Wire up `src/main.ts` — app entry point, screen routing (login → scan → progress → results), OAuth callback handling
- [ ] 6.2 Style the app with Tailwind utility classes
- [ ] 6.3 Manual end-to-end test with a real Spotify account
