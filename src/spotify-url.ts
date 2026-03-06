// src/spotify-url.ts — Helpers for constructing Spotify web URLs

const BASE = "https://open.spotify.com";

/** Build a Spotify web URL from a resource type and ID. */
export function spotifyUrl(type: "track" | "artist" | "album", id: string): string {
	return `${BASE}/${type}/${id}`;
}

/** Extract a Spotify web URL from a URI like `spotify:track:XXXXX`. */
export function spotifyUrlFromUri(uri: string): string | undefined {
	const parts = uri.split(":");
	if (parts.length !== 3) return undefined;
	const [, type, id] = parts as [string, string, string];
	return `${BASE}/${type}/${id}`;
}
