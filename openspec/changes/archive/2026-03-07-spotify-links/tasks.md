## 1. Data Layer

- [x] 1.1 Add `id: string` to the album shape in `SpotifyTrack` interface (`src/types.ts`)
- [x] 1.2 Add `spotifyUrl(type, id)` and `spotifyUrlFromUri(uri)` helper functions
- [x] 1.3 Refactor `NowPlayingTrack` in `src/audio.ts` to store `artists: Array<{ name: string; uri: string }>` and `albumUri?: string` instead of pre-joined artist string

## 2. Candidate Row Links

- [x] 2.1 Wrap candidate track name in an anchor linking to `open.spotify.com/track/{id}` with `target="_blank"` and `stopPropagation`
- [x] 2.2 Render each artist as an individual anchor linking to `open.spotify.com/artist/{id}` with comma separators
- [x] 2.3 Wrap album art thumbnail in an anchor linking to `open.spotify.com/album/{id}` with `stopPropagation`

## 3. Mini Player Links

- [x] 3.1 Update `MiniPlayer.tsx` to parse track ID from `state.uri` and wrap track name in an anchor
- [x] 3.2 Render each artist from the structured array as an individual anchor with comma separators
- [x] 3.3 Wrap album art in an anchor linking to the album page (parse album ID from `albumUri`)

## 4. Verification

- [x] 4.1 Run `npm run check` and fix any type errors, lint issues, or test failures
