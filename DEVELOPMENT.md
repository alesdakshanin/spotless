# Development Setup

## Spotify App Configuration

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app (or use an existing one)
3. In the app settings, add these **Redirect URIs**:
   - `http://localhost:5173/` (local development)
   - Your production GitHub Pages URL (e.g., `https://<username>.github.io/spotless/`)
4. Note your **Client ID** from the app overview page

## Environment Variables

1. Copy the example env file:
   ```sh
   cp .env.example .env
   ```
2. Paste your Spotify Client ID into `.env`:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_actual_client_id
   ```

## Running Locally

```sh
npm install
npm run dev
```

The app will be available at `http://localhost:5173/`. The OAuth redirect URI is derived from the current page URL at runtime, so no hardcoding is needed.
