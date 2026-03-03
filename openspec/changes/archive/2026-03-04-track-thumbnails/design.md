## Context

Spotless scans a user's Spotify library for unplayable tracks. The results screen currently shows text-only rows: track name, artists, source, and restriction reason. The Spotify API already returns album data (including image URLs) in the `/me/tracks` and `/playlists/{id}/tracks` responses — we just don't capture it in our types.

## Goals / Non-Goals

**Goals:**
- Display album art thumbnails alongside tracks in the results list
- Keep the thumbnail small (≈40×40px) so it enhances rather than dominates the layout
- Gracefully handle missing album art (e.g., local files that slip through, deleted albums)

**Non-Goals:**
- Full-resolution album art or lightbox/zoom features
- Lazy loading or intersection observer optimization (track lists are small enough to render all at once)
- Caching or preloading images (browser handles this natively)

## Decisions

### 1. Extend `SpotifyTrack` to include album data

Add an `album` field with `name` and `images` to `SpotifyTrack`. The Spotify API already sends this — we just need to type it.

**Alternative considered**: Fetch album art separately via the Albums API. Rejected — unnecessary extra API calls when the data is already in the tracks response.

### 2. Add `thumbnailUrl` to `UnplayableTrack` as `string | undefined`

The domain type gets an optional `thumbnailUrl`. The scanner picks the smallest image from `album.images` (Spotify returns images in descending size order, so the last element is the smallest — typically 64×64). If no images exist, the field is `undefined`.

**Alternative considered**: Pass the full images array to the UI layer. Rejected — the UI only needs one URL, and image selection logic belongs in the data layer.

### 3. Render thumbnails with a CSS fallback

Each track row gets a 40×40 `<img>` with `object-cover` and rounded corners. When `thumbnailUrl` is undefined, render a placeholder `<div>` with a music note icon or neutral background.

**Alternative considered**: Use CSS `background-image`. Rejected — `<img>` is more semantic, provides native `alt` text for accessibility, and handles loading/error states natively.

## Risks / Trade-offs

- **Image load failures** → Use an `onerror` handler on `<img>` to swap in the placeholder. Album art URLs from Spotify are reliable but not guaranteed to stay valid forever.
- **Layout shift** → Fixed 40×40 dimensions prevent layout reflow as images load.
- **Bandwidth** → Spotify's smallest thumbnails are ~64×64 JPEG, roughly 2-5KB each. A scan with 50 unplayable tracks would add ~250KB. Acceptable for a utility app.
