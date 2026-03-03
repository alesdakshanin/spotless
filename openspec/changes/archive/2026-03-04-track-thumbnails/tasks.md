## 1. Types

- [x] 1.1 Add `album` field (with `name: string` and `images: SpotifyImage[]`) to `SpotifyTrack` in `src/types.ts`
- [x] 1.2 Add optional `thumbnailUrl` field (`string | undefined`) to `UnplayableTrack` in `src/types.ts`

## 2. Scanner

- [x] 2.1 Update scanner to extract the smallest album image URL and populate `thumbnailUrl` when building `UnplayableTrack` entries
- [x] 2.2 Update scanner tests — add album data to track fixtures and verify `thumbnailUrl` is set correctly (present and absent cases)

## 3. UI

- [x] 3.1 Update `renderTrackList` in `src/ui.ts` to render a 40×40 album art thumbnail (or placeholder) to the left of each track row
- [x] 3.2 Add `onerror` handler on `<img>` to swap in the placeholder when an image fails to load
