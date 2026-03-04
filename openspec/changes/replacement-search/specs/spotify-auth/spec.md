## MODIFIED Requirements

### Requirement: PKCE authorization flow
The system SHALL authenticate users via Spotify's Authorization Code with PKCE flow. The system SHALL generate a cryptographically random `code_verifier` and derive a `code_challenge` using SHA-256. The system SHALL redirect to Spotify's `/authorize` endpoint with the required parameters: `client_id`, `response_type=code`, `redirect_uri`, `code_challenge`, `code_challenge_method=S256`, and `scope`. On callback, the system SHALL exchange the authorization code for an access token and refresh token.

#### Scenario: Successful login
- **WHEN** user clicks "Log in with Spotify"
- **THEN** the system redirects to Spotify's authorization page with PKCE parameters and requested scopes `user-library-read`, `playlist-read-private`, `user-library-modify`, `playlist-modify-public`, and `playlist-modify-private`

#### Scenario: Successful callback
- **WHEN** Spotify redirects back with an authorization code
- **THEN** the system exchanges the code for an access token and refresh token, stores them, and shows the authenticated UI

#### Scenario: Authorization denied
- **WHEN** Spotify redirects back with an error (user denied access)
- **THEN** the system shows the login screen with a message that access was denied
