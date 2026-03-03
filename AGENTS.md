# Spotless

Browser-based utility that scans a user's Spotify library and playlists for unplayable songs, helps find replacements via Spotify Search, and lets users remove dead tracks and add replacements.

## Tech Stack

- Vite + vanilla TypeScript (no framework)
- Biome for formatting and linting
- Tailwind CSS
- Vitest for testing
- Spotify Web API with Authorization Code + PKCE (no backend)
- GitHub Pages for hosting

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm test` — run tests
- `npm run test:watch` — tests in watch mode
- `npm run check` — run all checks (types + lint + format + tests)
- `npx @biomejs/biome check --write` — auto-fix lint and format issues

## Workflow

Use the OpenSpec workflow (`/opsx:new`, `/opsx:ff`, `/opsx:apply`, etc.) for new features, significant refactors, and non-trivial bug fixes. For small mechanical changes (typos, config tweaks, renaming), just do them directly. If unsure, suggest starting a change.

## Architecture

- Core logic (auth, API, scanner) as pure functions / async modules — easy to test
- Thin UI layer for DOM rendering
- No framework unless complexity demands it

## Conventions

- Always run `npm run check` after making changes to catch type errors, lint issues, and test failures
- TypeScript strict mode is on with `noUncheckedIndexedAccess` — always handle potential undefined from array/object indexing
- Biome handles all formatting — do not bikeshed style, just run the formatter
