// src/replacements.ts — Search for replacement candidates and score confidence

import { get } from "./api";
import type { ReplacementCandidate, SpotifyTrack, UnplayableTrack } from "./types";

interface SpotifySearchResponse {
	tracks: {
		items: SpotifyTrack[];
	};
}

/** Strip parenthetical suffixes and dash-separated suffixes, then lowercase and trim. */
export function normalizeTitle(name: string): string {
	return name
		.replace(/\s*\(.*?\)/g, "")
		.replace(/\s*\[.*?\]/g, "")
		.replace(/\s+-\s+.*/g, "")
		.replace(/\s*feat\..*/i, "")
		.replace(/\s*ft\..*/i, "")
		.toLowerCase()
		.trim();
}

/** Score a candidate against the original track. */
export function scoreConfidence(original: UnplayableTrack, candidate: SpotifyTrack): 1 | 2 | 3 {
	const origTitle = normalizeTitle(original.name);
	const candTitle = normalizeTitle(candidate.name);
	const origArtist = original.artists[0]?.toLowerCase() ?? "";
	const candArtist = candidate.artists[0]?.name.toLowerCase() ?? "";

	const artistMatch = origArtist === candArtist;

	if (artistMatch && origTitle === candTitle) return 3;
	if (artistMatch && (candTitle.includes(origTitle) || origTitle.includes(candTitle))) return 2;
	return 1;
}

/** Search Spotify for replacement candidates for an unplayable track. */
export async function searchReplacements(track: UnplayableTrack): Promise<ReplacementCandidate[]> {
	const title = normalizeTitle(track.name);
	const artist = track.artists[0] ?? "";
	const query = encodeURIComponent(`track:"${title}" artist:"${artist}"`);

	const url = `/search?q=${query}&type=track&limit=5&market=from_token`;
	console.log(`[replacements] Searching: ${decodeURIComponent(query)} → ${url}`);

	const response = await get<SpotifySearchResponse>(url);
	console.log(
		`[replacements] Results for "${track.name}":`,
		response.tracks.items.length,
		"items",
		response.tracks.items.map(
			(i) =>
				`${i.name} by ${i.artists.map((a) => a.name).join(", ")} [playable=${i.is_playable}, uri=${i.uri}]`,
		),
	);

	const candidates: ReplacementCandidate[] = [];

	for (const item of response.tracks.items) {
		// Filter out the original track
		if (item.uri === track.trackUri) continue;
		// Only include playable tracks
		if (item.is_playable === false) continue;

		const images = item.album.images;
		const thumbnail = images.length > 0 ? images[images.length - 1] : undefined;

		candidates.push({
			track: item,
			confidence: scoreConfidence(track, item),
			thumbnailUrl: thumbnail?.url,
			previewUrl: item.preview_url ?? undefined,
		});

		if (candidates.length >= 3) break;
	}

	// Sort by confidence descending
	candidates.sort((a, b) => b.confidence - a.confidence);

	return candidates;
}
