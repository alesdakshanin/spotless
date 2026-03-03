## Context

Spotless is a fresh Vite + TypeScript project with no functionality. This is the foundational change — everything else builds on the ability to authenticate with Spotify and scan for unplayable tracks.

The app runs entirely in the browser (GitHub Pages), so there's no backend to hold secrets or proxy API calls. This constrains us to the PKCE OAuth flow and client-side token management.

## Goals / Non-Goals

**Goals:**
- Authenticate with Spotify using PKCE (no backend)
- Scan all saved tracks and user-owned playlists for unplayable tracks
- Show live progress during scanning
- Display results with track details and restriction reasons

**Non-Goals:**
- Removing or replacing tracks (future change)
- Scanning saved albums or followed playlists
- Offline support or caching scan results
- Server-side components

## Decisions

### 1. Module structure

```
src/
├── auth.ts          # OAuth PKCE flow, token management
├── api.ts           # Spotify API client (fetch wrapper with auth)
├── scanner.ts       # Scanning logic, pagination, unplayable detection
├── ui.ts            # DOM rendering for all screens
├── types.ts         # Shared TypeScript types
└── main.ts          # App entry point, routing between screens
```

**Why**: Flat module structure matches the project's "no framework" convention. Each module is a clear responsibility boundary. `scanner.ts` is pure async logic that's easy to test; `ui.ts` is the thin DOM layer.

**Alternative**: Single file or feature-based folders. Too early for folders — we don't have enough code to warrant the indirection.

### 2. OAuth PKCE flow

Use the Authorization Code with PKCE flow directly against Spotify's auth endpoints. No library.

- Generate `code_verifier` (random 128 chars) and `code_challenge` (SHA-256 + base64url)
- Store verifier in `sessionStorage` during the redirect
- On callback, exchange code for tokens
- Store access token + refresh token + expiry in `sessionStorage`
- Refresh token before API calls when expired

**Why no library**: The PKCE flow is ~50 lines of code. A library adds a dependency for something we fully control. The Web Crypto API handles SHA-256 natively.

### 3. API client design

A thin wrapper around `fetch` that:
- Attaches the Bearer token
- Auto-refreshes on 401
- Handles rate limiting (429) with `Retry-After` header
- Provides typed responses

**Why**: Keeps API concerns in one place. The scanner just calls `api.get('/me/tracks?...')` without worrying about auth or retries.

### 4. Scanner as async generator

The scanner yields progress events as it paginates:

```typescript
type ScanEvent =
  | { type: 'progress'; source: string; scanned: number; total: number }
  | { type: 'found'; track: UnplayableTrack }
  | { type: 'done'; summary: ScanSummary }
```

The UI subscribes to these events and updates the DOM.

**Why async generator**: Natural fit for paginated scanning with progress. The UI can render each event as it arrives. Easy to test — just collect events into an array.

**Alternative**: Callbacks or EventEmitter. Async generators are simpler and composable.

### 5. Client ID via Vite env var

`VITE_SPOTIFY_CLIENT_ID` injected at build time. For local dev, use `.env` file. For GitHub Pages, set in the build workflow.

**Why**: Standard Vite pattern. The client ID isn't secret (it's in the browser bundle regardless), but keeping it out of source makes it easy to swap between dev and prod Spotify apps.

### 6. Token storage in sessionStorage

- Access token, refresh token, and expiry timestamp stored in `sessionStorage`
- Survives page refresh (needed for OAuth redirect)
- Cleared on tab close
- Explicit logout clears storage

**Why not localStorage**: Session-scoped is more appropriate for auth tokens. User expectation: closing the tab logs you out.

## Risks / Trade-offs

- **[Rate limiting]** → Spotify rate limits are undocumented but real. Mitigation: respect `Retry-After` headers, add small delay between paginated requests if needed.
- **[Large libraries]** → Users with 10k+ liked songs will trigger 200+ API calls. Mitigation: async generator streams progress in real-time so the UI stays responsive. We can add batching later if needed.
- **[Token expiry during scan]** → Long scans may outlast the 1-hour token. Mitigation: API client auto-refreshes on 401, which is transparent to the scanner.
- **[No PKCE library]** → Rolling our own auth code. Mitigation: The flow is well-documented, small, and testable. We'll write tests for the critical crypto parts.
