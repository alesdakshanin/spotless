## ADDED Requirements

### Requirement: PKCE authorization flow
The system SHALL authenticate users via Spotify's Authorization Code with PKCE flow. The system SHALL generate a cryptographically random `code_verifier` and derive a `code_challenge` using SHA-256. The system SHALL redirect to Spotify's `/authorize` endpoint with the required parameters: `client_id`, `response_type=code`, `redirect_uri`, `code_challenge`, `code_challenge_method=S256`, and `scope`. On callback, the system SHALL exchange the authorization code for an access token and refresh token.

#### Scenario: Successful login
- **WHEN** user clicks "Log in with Spotify"
- **THEN** the system redirects to Spotify's authorization page with PKCE parameters and requested scopes `user-library-read` and `playlist-read-private`

#### Scenario: Successful callback
- **WHEN** Spotify redirects back with an authorization code
- **THEN** the system exchanges the code for an access token and refresh token, stores them, and shows the authenticated UI

#### Scenario: Authorization denied
- **WHEN** Spotify redirects back with an error (user denied access)
- **THEN** the system shows the login screen with a message that access was denied

### Requirement: Token storage
The system SHALL store the access token, refresh token, and token expiry timestamp in `sessionStorage`. The system SHALL clear all stored tokens when the user logs out or closes the browser tab.

#### Scenario: Token persists across page refresh
- **WHEN** user refreshes the page after logging in
- **THEN** the system restores the session from `sessionStorage` without requiring re-authentication

#### Scenario: Logout clears tokens
- **WHEN** user logs out
- **THEN** all tokens and auth state are removed from `sessionStorage`

### Requirement: Token refresh
The system SHALL automatically refresh the access token using the refresh token when the current token is expired or a 401 response is received from the Spotify API.

#### Scenario: Expired token auto-refresh
- **WHEN** the access token has expired and an API call is made
- **THEN** the system uses the refresh token to obtain a new access token before retrying the request

#### Scenario: Refresh token invalid
- **WHEN** the refresh token is rejected by Spotify
- **THEN** the system clears stored tokens and returns the user to the login screen

### Requirement: Client ID configuration
The system SHALL read the Spotify Client ID from the `VITE_SPOTIFY_CLIENT_ID` environment variable at build time. The redirect URI SHALL be derived from the current page URL.

#### Scenario: Missing client ID
- **WHEN** the app loads without a configured client ID
- **THEN** the system displays an error indicating the app is misconfigured

### Requirement: Environment-agnostic redirect URI
The system SHALL derive the OAuth redirect URI from `window.location.origin` at runtime rather than hardcoding it. This ensures the same code works across local development (`http://localhost:5173`), preview deployments, and production (GitHub Pages).

#### Scenario: Local development
- **WHEN** the app is running on `http://localhost:5173`
- **THEN** the OAuth redirect URI is `http://localhost:5173/` and the full login flow works against the real Spotify API

#### Scenario: Production deployment
- **WHEN** the app is running on the GitHub Pages URL
- **THEN** the OAuth redirect URI matches the production origin and the login flow works
