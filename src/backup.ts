// src/backup.ts — Backup playlist management

import { get, post, postJson } from "./api";
import type { SpotifyPaginatedResponse, SpotifyPlaylist } from "./types";

const BACKUP_PLAYLIST_NAME = "Spotless Backup";
const BACKUP_PLAYLIST_DESCRIPTION = "Tracks removed by Spotless \u2014 your safety net.";
const PAGE_SIZE = 50;
const MAX_TRACKS_PER_ADD = 100;

interface CreatedPlaylist {
	id: string;
}

/** Find the "Spotless Backup" playlist or create it if it doesn't exist. */
export async function ensureBackupPlaylist(userId: string): Promise<string> {
	let offset = 0;
	let total = 0;

	do {
		const page = await get<SpotifyPaginatedResponse<SpotifyPlaylist>>(
			`/me/playlists?limit=${PAGE_SIZE}&offset=${offset}`,
		);
		total = page.total;

		for (const playlist of page.items) {
			if (playlist.name === BACKUP_PLAYLIST_NAME) {
				return playlist.id;
			}
		}

		offset += page.items.length;
	} while (offset < total);

	const created = await postJson<CreatedPlaylist>(`/users/${userId}/playlists`, {
		name: BACKUP_PLAYLIST_NAME,
		description: BACKUP_PLAYLIST_DESCRIPTION,
		public: false,
	});

	return created.id;
}

/** Add tracks to the backup playlist, chunking into batches of 100. */
export async function backupTracks(playlistId: string, trackUris: string[]): Promise<void> {
	for (let i = 0; i < trackUris.length; i += MAX_TRACKS_PER_ADD) {
		const chunk = trackUris.slice(i, i + MAX_TRACKS_PER_ADD);
		await post(`/playlists/${playlistId}/tracks`, { uris: chunk });
	}
}
