# Spotless

Browser-based utility that scans a user's Spotify library and playlists for unplayable songs, helps find replacements via Spotify Search, and lets users remove dead tracks and add replacements.

> `CLAUDE.md` is a symlink to `AGENTS.md`. The canonical file is `AGENTS.md` — always edit and `git add` that one.

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
- Run `npx @biomejs/biome check --write` before `npm run check` to auto-fix formatting — avoids iterative fix-and-recheck cycles
- TypeScript strict mode is on with `noUncheckedIndexedAccess` — always handle potential undefined from array/object indexing
- `noPropertyAccessFromIndexSignature` is enabled — when accessing dynamic/index-signature properties, declare them as explicit interface fields instead of using bracket notation (which conflicts with Biome's `useLiteralKeys` rule)
- Biome handles all formatting — do not bikeshed style, just run the formatter

## Testing

- Vitest with jsdom environment (configured in `vitest.config.ts`)
- `src/vite-env.d.ts` declares typed env vars on `ImportMetaEnv` — add new `VITE_*` vars there
- Use `vi.stubEnv()` / `vi.unstubAllEnvs()` to mock Vite env vars in tests
- Use `vi.stubGlobal()` for browser globals like `fetch`
