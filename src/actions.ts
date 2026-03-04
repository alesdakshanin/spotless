// src/actions.ts — Add/remove tracks from Spotify library and playlists

import { del, post, put } from "./api";

export type TrackSource = { type: "liked" } | { type: "playlist"; id: string };

function sourceFromUnplayable(sourceId: string | null): TrackSource {
	return sourceId === null ? { type: "liked" } : { type: "playlist", id: sourceId };
}

export { sourceFromUnplayable };

/** Extract the track ID from a Spotify URI (spotify:track:XXXXX → XXXXX). */
function trackIdFromUri(uri: string): string {
	const parts = uri.split(":");
	const id = parts[2];
	if (!id) throw new Error(`Invalid track URI: ${uri}`);
	return id;
}

/** Add a track to Liked Songs or a specific playlist. */
export async function addTrack(trackUri: string, source: TrackSource): Promise<void> {
	if (source.type === "liked") {
		await put("/me/tracks", { ids: [trackIdFromUri(trackUri)] });
	} else {
		await post(`/playlists/${source.id}/tracks`, { uris: [trackUri] });
	}
}

/** Remove a track from Liked Songs or a specific playlist. */
export async function removeTrack(trackUri: string, source: TrackSource): Promise<void> {
	if (source.type === "liked") {
		await del("/me/tracks", { ids: [trackIdFromUri(trackUri)] });
	} else {
		await del(`/playlists/${source.id}/tracks`, { tracks: [{ uri: trackUri }] });
	}
}
