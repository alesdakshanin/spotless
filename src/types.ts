// --- Spotify API response shapes (subset we use) ---

export interface SpotifyImage {
	url: string;
	height: number | null;
	width: number | null;
}

export interface SpotifyArtist {
	id: string;
	name: string;
}

export interface SpotifyTrack {
	id: string;
	name: string;
	artists: SpotifyArtist[];
	is_playable?: boolean;
	is_local?: boolean;
	restrictions?: { reason: string };
}

export interface SpotifySavedTrack {
	track: SpotifyTrack;
}

export interface SpotifyPlaylistTrack {
	track: SpotifyTrack | null; // null for deleted tracks
	is_local: boolean;
}

export interface SpotifyPaginatedResponse<T> {
	items: T[];
	total: number;
	limit: number;
	offset: number;
	next: string | null;
}

export interface SpotifyPlaylist {
	id: string;
	name: string;
	owner: { id: string };
	tracks: { total: number };
}

export interface SpotifyUser {
	id: string;
	display_name: string | null;
	images: SpotifyImage[];
}

// --- App domain types ---

export interface UnplayableTrack {
	name: string;
	artists: string[];
	source: string;
	reason: string;
}

export type ScanEvent =
	| { type: "progress"; source: string; scanned: number; total: number }
	| { type: "found"; track: UnplayableTrack }
	| { type: "done"; summary: ScanSummary };

export interface ScanSummary {
	totalScanned: number;
	unplayable: UnplayableTrack[];
}
