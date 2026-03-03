// src/scanner.ts — Library scanner using async generator

import { get } from "./api";
import type {
	ScanEvent,
	ScanSummary,
	SpotifyPaginatedResponse,
	SpotifyPlaylist,
	SpotifyPlaylistTrack,
	SpotifySavedTrack,
	SpotifyTrack,
	SpotifyUser,
	UnplayableTrack,
} from "./types";

const PAGE_SIZE = 50;

const RESTRICTION_MESSAGES: Record<string, string> = {
	market: "Not available in your country",
	product: "Not available on your subscription",
	explicit: "Blocked by explicit content filter",
};

export function getRestrictionReason(track: SpotifyTrack): string {
	const raw = track.restrictions?.reason;
	if (!raw) return "Unavailable";
	return RESTRICTION_MESSAGES[raw] ?? `Unavailable (${raw})`;
}

export function isUnplayable(track: SpotifyTrack): boolean {
	return track.is_playable === false;
}

export function isLocalTrack(item: SpotifySavedTrack | SpotifyPlaylistTrack): boolean {
	if ("is_local" in item && typeof item.is_local === "boolean") {
		return item.is_local;
	}
	return item.track?.is_local === true;
}

async function* scanSource<T extends SpotifySavedTrack | SpotifyPlaylistTrack>(
	path: string,
	sourceName: string,
): AsyncGenerator<ScanEvent> {
	let offset = 0;
	let total = 0;
	let scanned = 0;

	do {
		const page = await get<SpotifyPaginatedResponse<T>>(
			`${path}${path.includes("?") ? "&" : "?"}limit=${PAGE_SIZE}&offset=${offset}&market=from_token`,
		);
		total = page.total;

		for (const item of page.items) {
			if (isLocalTrack(item)) continue;

			const track = item.track;
			if (!track) continue;

			scanned++;

			if (isUnplayable(track)) {
				yield {
					type: "found",
					track: {
						name: track.name,
						artists: track.artists.map((a) => a.name),
						source: sourceName,
						reason: getRestrictionReason(track),
					},
				};
			}
		}

		yield { type: "progress", source: sourceName, scanned, total };
		offset += PAGE_SIZE;
	} while (offset < total);
}

export async function* scan(): AsyncGenerator<ScanEvent> {
	const unplayable: UnplayableTrack[] = [];
	let totalScanned = 0;
	let likedSongsScanned = 0;

	// Scan Liked Songs
	for await (const event of scanSource<SpotifySavedTrack>("/me/tracks", "Liked Songs")) {
		if (event.type === "found") {
			unplayable.push(event.track);
		}
		if (event.type === "progress") {
			likedSongsScanned = event.scanned;
		}
		yield event;
	}
	totalScanned += likedSongsScanned;

	// Get user ID for ownership check
	const user = await get<SpotifyUser>("/me");

	// Fetch playlists
	let playlistOffset = 0;
	let hasMorePlaylists = true;
	const ownedPlaylists: SpotifyPlaylist[] = [];

	while (hasMorePlaylists) {
		const page = await get<SpotifyPaginatedResponse<SpotifyPlaylist>>(
			`/me/playlists?limit=${PAGE_SIZE}&offset=${playlistOffset}`,
		);

		for (const playlist of page.items) {
			if (playlist.owner.id === user.id) {
				ownedPlaylists.push(playlist);
			}
		}

		hasMorePlaylists = page.next !== null;
		playlistOffset += PAGE_SIZE;
	}

	// Scan each owned playlist
	for (const playlist of ownedPlaylists) {
		let playlistScanned = 0;

		for await (const event of scanSource<SpotifyPlaylistTrack>(
			`/playlists/${playlist.id}/tracks`,
			playlist.name,
		)) {
			if (event.type === "found") {
				unplayable.push(event.track);
			}
			if (event.type === "progress") {
				playlistScanned = event.scanned;
			}
			yield event;
		}

		totalScanned += playlistScanned;
	}

	const summary: ScanSummary = { totalScanned, unplayable };
	yield { type: "done", summary };
}
