# Spotless

Browser-based utility that scans your Spotify library and playlists for unplayable songs, helps find replacements via Spotify Search, and lets you remove dead tracks and add replacements.

Built with Vite, Preact, TypeScript, and Tailwind CSS. Runs entirely in the browser using Spotify's Authorization Code + PKCE flow (no backend required).

## Status

This project is in Spotify's [Development Mode](https://developer.spotify.com/documentation/web-api/concepts/quota-modes), which restricts API access to a small number of manually allowlisted users. The app cannot be used by the general public without Extended Quota Mode, which is only available to registered businesses with at least 250,000 monthly active users.

The hosted version at https://alesdakshanin.github.io/spotless/ is live but will only work for users explicitly added in the Spotify Developer Dashboard. To use Spotless with your own account, follow the local development setup below with your own Spotify app.

## Local development

1. Create a Spotify app in the [Developer Dashboard](https://developer.spotify.com/dashboard)
2. Add `http://127.0.0.1:5173/` as a Redirect URI
3. Copy the Client ID into a `.env` file:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_client_id_here
   ```
4. Add your Spotify account email under User Management in the dashboard
5. Run:
   ```
   npm install
   npm run dev
   ```

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run check` — run all checks (types + lint + format + tests)
