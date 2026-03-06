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
	uri: string;
	name: string;
	artists: SpotifyArtist[];
	album: { id: string; name: string; images: SpotifyImage[] };
	is_playable?: boolean;
	is_local?: boolean;
	restrictions?: { reason: string };
	preview_url?: string | null;
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
	sourceId: string | null;
	trackUri: string;
	reason: string;
	thumbnailUrl?: string;
}

export interface ReplacementCandidate {
	track: SpotifyTrack;
	confidence: 1 | 2 | 3;
	thumbnailUrl?: string;
	previewUrl?: string;
}

export type ScanEvent =
	| { type: "sources"; names: string[] }
	| { type: "progress"; source: string; scanned: number; total: number }
	| { type: "found"; track: UnplayableTrack }
	| { type: "done"; summary: ScanSummary };

export interface ScanSummary {
	totalScanned: number;
	unplayable: UnplayableTrack[];
}
