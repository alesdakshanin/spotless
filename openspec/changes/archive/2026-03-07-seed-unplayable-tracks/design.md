## Context

Spotless needs unplayable tracks in the user's Spotify library for end-to-end testing. The app's existing auth and API modules (`src/auth.ts`, `src/api.ts`) are browser-only — they depend on `sessionStorage`, `import.meta.env`, and `window.location`. A standalone Node script cannot import them.

The script must be self-contained: its own fetch calls, its own token handling, no shared code with the app.

## Goals / Non-Goals

**Goals:**
- Provide a one-command way to populate a test playlist with verified unplayable tracks
- Work with a manually-provided Spotify access token (copy from browser devtools or Spotify developer dashboard)
- Verify playability before adding — don't add tracks that are playable in the user's region
- Be runnable without installing extra dependencies (`npx tsx`)

**Non-Goals:**
- Implementing a full OAuth flow in the script (too complex for a dev tool — just use a token)
- Sharing code with the app's `src/` modules (browser-only, not worth abstracting)
- Guaranteeing every curated URI is unplayable (region-dependent; the verify step handles this)
- Automated CI usage (this is a manual dev tool)

## Decisions

### 1. Token via environment variable `SPOTIFY_TOKEN`

**Choice:** Read the access token from `SPOTIFY_TOKEN` env var.

**Why:** Simplest approach. The user can grab a token from:
- Browser devtools (`sessionStorage.getItem("spotify_access_token")`) while the app is running
- The [Spotify Developer Dashboard](https://developer.spotify.com/documentation/web-api/tutorials/getting-started) token generator

**Alternative considered:** Implement PKCE flow with a local HTTP server to capture the redirect. Rejected — too much complexity for a dev helper that runs occasionally.

### 2. Self-contained fetch wrapper (no shared code with app)

**Choice:** Inline a minimal `spotifyGet` / `spotifyPost` using Node 18+ built-in `fetch`.

**Why:** The app's `api.ts` depends on browser globals (`sessionStorage` for token refresh, `import.meta.env` for client ID). Extracting a shared module would require abstracting token storage, which isn't worth it for a dev script.

**Alternative considered:** Refactoring `api.ts` to be environment-agnostic. Rejected — adds complexity to production code for a dev-only use case.

### 3. Curated track URI list with playability verification

**Choice:** Hardcode ~20-30 track URIs known to be region-locked. Before adding, call `GET /tracks?ids=...&market=from_token` (up to 50 IDs per request) and filter to only `is_playable === false`.

**Why:** Spotify's search API tends to return only playable results, so we can't discover unplayable tracks programmatically. A curated list with verification is the pragmatic approach.

The curated list will include:
- Japanese-exclusive releases (J-Pop, anime soundtracks)
- Region-locked K-Pop variants
- Tracks known to have been re-uploaded under new URIs
- Regional Bollywood/Indian releases

### 4. Create-or-reuse playlist named "Spotless Test"

**Choice:** Search the user's playlists for one named "Spotless Test". Create it if missing, reuse if found.

**Why:** Avoids creating duplicate playlists on repeated runs. The fixed name makes it easy to find and clean up.

### 5. Single file, no test coverage

**Choice:** One script file at `scripts/seed-unplayable.ts` with no unit tests.

**Why:** This is a manual dev utility with simple, linear logic. The real "test" is running it and seeing the output. Adding test infrastructure for a script that makes live API calls would require extensive mocking for minimal value.

## Risks / Trade-offs

- **Curated URIs become playable over time** → Mitigation: The verify step filters these out. Periodically refresh the list if too many pass.
- **Token expires mid-run** → Mitigation: The script makes only a few API calls (profile, playlists, tracks check, add). A fresh token lasts 1 hour — plenty of time. No refresh logic needed.
- **Rate limiting** → Mitigation: The script makes <10 API calls total. Not a concern. Add a simple retry on 429 just in case.
- **All curated tracks are playable in user's region** → Mitigation: Report clearly that 0 unplayable tracks were found and suggest the user check from a different region or update the list.
