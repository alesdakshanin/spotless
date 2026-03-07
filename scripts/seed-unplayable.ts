/* eslint-disable */
// @ts-nocheck — standalone script run via `npx tsx`, not part of the app build

const SPOTIFY_TOKEN = process.env.SPOTIFY_TOKEN;

if (!SPOTIFY_TOKEN) {
	console.error(`Missing SPOTIFY_TOKEN environment variable.

To get a token:
  1. Open Spotless in your browser and log in
  2. Open devtools → Console
  3. Run: sessionStorage.getItem("spotify_access_token")
  4. Copy the token and run:

     SPOTIFY_TOKEN="<paste>" npx tsx scripts/seed-unplayable.ts`);
	process.exit(1);
}

// ---------------------------------------------------------------------------
// Spotify API helpers
// ---------------------------------------------------------------------------

const BASE = "https://api.spotify.com/v1";

async function spotifyFetch(path: string, init: RequestInit = {}): Promise<unknown> {
	const url = path.startsWith("http") ? path : `${BASE}${path}`;
	const res = await fetch(url, {
		...init,
		headers: {
			Authorization: `Bearer ${SPOTIFY_TOKEN}`,
			"Content-Type": "application/json",
			...init.headers,
		},
	});

	if (res.status === 429) {
		const retryAfter = Number(res.headers.get("Retry-After") ?? "1");
		console.log(`  Rate limited — waiting ${retryAfter}s...`);
		await new Promise((r) => setTimeout(r, retryAfter * 1000));
		return spotifyFetch(path, init);
	}

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Spotify API error ${res.status}: ${body}`);
	}

	return res.json();
}

function spotifyGet(path: string): Promise<unknown> {
	return spotifyFetch(path);
}

function spotifyPost(path: string, body: unknown): Promise<unknown> {
	return spotifyFetch(path, {
		method: "POST",
		body: JSON.stringify(body),
	});
}

// ---------------------------------------------------------------------------
// Curated region-locked track URIs
// ---------------------------------------------------------------------------

const CURATED_URIS = [
	// Verified unplayable from real library scan (2026-03-07)
	"spotify:track:5fokz1qBifTT3ApPvbpX2p", // Окурки Тем — Лето
	"spotify:track:6Br8Tqm22yA80ymzsjbobI", // Maybeshewill — He Films The Clouds (JP EP Version)
	"spotify:track:6gvgnEM4Ym2y2jC76cmulg", // VoKillz, Frankie Palmeri, Emmure — DEMISE
	"spotify:track:7A1uZaDsXYp4ZXIuGYzVJu", // Подонки — Делай что говорят
	"spotify:track:7oLqoswT2hfCG90crbiToe", // Wildways — Put in
	"spotify:track:4cDx3wwx86kyGE0JAor2Ii", // You Slut! — MyBloodyJesusExplorerOnFire
	"spotify:track:6d0WHhEucRge9Lfm9PHaTf", // Дай Дарогу! — Новый год
	"spotify:track:17ZcL9RcOyvfYq4pknW8Ul", // Maybeshewill — To The Skies From A Hillside
	"spotify:track:25rG28wmO3OqnYNRc72iLS", // Дай Дарогу! — Д.С.П.Г.
	"spotify:track:6zXtqvYnhnVL1TwgeMuZmh", // Дай Дарогу! — Пятая палата
	"spotify:track:18xj8wUjPMCAEaUPxMpmuD", // Дай Дарогу! — По-синему
	"spotify:track:6qFxjoKYRu8r15YhQE5h6x", // BOOM BOOM SATELLITES — On The Painted Desert
	"spotify:track:1EcsJ8rFEOQDX5WSP0XdYC", // El-P — Time Won't Tell
	"spotify:track:2Y7EzpGgXasncf2wtzsSW2", // Maybeshewill — Farewell to Sarajevo
	"spotify:track:5529I0SGNzaulaqtACq0Ud", // Maybeshewill — Red Paper Lanterns
	"spotify:track:2oumU1t3UD0Ji3Z0hW4Acs", // Akute
	"spotify:track:3jfKZJT4pkLLGFfx58OS4r", // Akute
	"spotify:track:4ySRrxXJZHMsBmvlfgbsXK", // Akute
	"spotify:track:2LsXkIRDUKPKGZYFvBRzU6", // Akute
	"spotify:track:41pn4cuZY2IJsiV3AxWYsU", // Maybeshewill — Take This To Heart
	"spotify:track:07nYZZQT49i7yAIs3k3tOe", // Maybeshewill — He Films The Clouds Pt. 2
	"spotify:track:6Gk69OItL49x5MzqpLXh3E", // And So I Watch You from Afar — D is for Django The Bastard
	"spotify:track:1k4bIJNN8d9WrEvQ638b06", // I Am Waiting for You Last Summer — Lights Go Out
	"spotify:track:4CRKFubu0kyq6RyHPzs2y9", // Maybeshewill — Sing the Word Hope in Four Part Harmony
	"spotify:track:5TK5xNWfPQx54bmGfL69yo", // Maybeshewill — Seraphim & Cherubim
	"spotify:track:3q6h93qVhlvIycGOBYmAxO", // Maybeshewill — Not For Want Of Trying
];

// ---------------------------------------------------------------------------
// Playlist management
// ---------------------------------------------------------------------------

const PLAYLIST_NAME = "Spotless Test";

interface SpotifyUser {
	id: string;
	display_name: string;
}

interface SpotifyPlaylist {
	id: string;
	name: string;
	owner: { id: string };
}

interface PlaylistPage {
	items: SpotifyPlaylist[];
	next: string | null;
}

async function getUserId(): Promise<SpotifyUser> {
	const user = (await spotifyGet("/me")) as SpotifyUser;
	console.log(`Logged in as: ${user.display_name} (${user.id})`);
	return user;
}

async function findOrCreatePlaylist(userId: string): Promise<string> {
	let url: string | null = "/me/playlists?limit=50";

	while (url) {
		const page = (await spotifyGet(url)) as PlaylistPage;
		const match = page.items.find((p) => p.name === PLAYLIST_NAME && p.owner.id === userId);
		if (match) {
			console.log(`Found existing playlist: ${PLAYLIST_NAME} (${match.id})`);
			return match.id;
		}
		url = page.next;
	}

	const created = (await spotifyPost(`/users/${userId}/playlists`, {
		name: PLAYLIST_NAME,
		public: true,
		description: "Test playlist for Spotless — contains intentionally unplayable tracks",
	})) as SpotifyPlaylist;

	console.log(`Created new playlist: ${PLAYLIST_NAME} (${created.id})`);
	return created.id;
}

// ---------------------------------------------------------------------------
// Track verification
// ---------------------------------------------------------------------------

interface SpotifyTrack {
	uri: string;
	name: string;
	artists: { name: string }[];
	is_playable: boolean;
}

interface TracksResponse {
	tracks: (SpotifyTrack | null)[];
}

interface VerifyResult {
	unplayable: SpotifyTrack[];
	playable: SpotifyTrack[];
	notFound: string[];
}

function extractId(uri: string): string {
	return uri.split(":")[2] ?? uri;
}

async function verifyPlayability(uris: string[]): Promise<VerifyResult> {
	const result: VerifyResult = { unplayable: [], playable: [], notFound: [] };

	// Spotify allows up to 50 IDs per request
	const BATCH_SIZE = 50;
	for (let i = 0; i < uris.length; i += BATCH_SIZE) {
		const batch = uris.slice(i, i + BATCH_SIZE);
		const ids = batch.map(extractId).join(",");
		const data = (await spotifyGet(`/tracks?ids=${ids}&market=from_token`)) as TracksResponse;

		for (let j = 0; j < batch.length; j++) {
			const track = data.tracks[j];
			const uri = batch[j] ?? "";

			if (!track) {
				result.notFound.push(uri);
			} else if (!track.is_playable) {
				result.unplayable.push(track);
			} else {
				result.playable.push(track);
			}
		}
	}

	return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	console.log("Seed Unplayable Tracks");
	console.log("======================\n");

	// 1. Get user profile
	const user = await getUserId();

	// 2. Find or create the test playlist
	const playlistId = await findOrCreatePlaylist(user.id);

	// 3. Verify playability of curated tracks
	console.log(`\nChecking ${CURATED_URIS.length} curated tracks...\n`);
	const { unplayable, playable, notFound } = await verifyPlayability(CURATED_URIS);

	// 4. Add unplayable tracks to playlist
	if (unplayable.length > 0) {
		const uris = unplayable.map((t) => t.uri);
		await spotifyPost(`/playlists/${playlistId}/tracks`, { uris });
		console.log(`Added ${unplayable.length} unplayable tracks to "${PLAYLIST_NAME}":\n`);
		for (const t of unplayable) {
			const artists = t.artists.map((a) => a.name).join(", ");
			console.log(`  + ${t.name} — ${artists}`);
		}
	} else {
		console.log("No unplayable tracks found in your region.");
		console.log("Try running from a different region (VPN) or update the curated URI list.");
	}

	// 5. Summary report
	console.log("\n--- Summary ---");
	console.log(
		`Checked ${CURATED_URIS.length} tracks: ` +
			`${unplayable.length} unplayable (added), ` +
			`${playable.length} playable (skipped), ` +
			`${notFound.length} not found`,
	);

	if (playable.length > 0) {
		console.log("\nPlayable (skipped):");
		for (const t of playable) {
			console.log(`  - ${t.name} — ${t.artists.map((a) => a.name).join(", ")}`);
		}
	}

	if (notFound.length > 0) {
		console.log("\nNot found (possibly deleted):");
		for (const uri of notFound) {
			console.log(`  ? ${uri}`);
		}
	}
}

main().catch((err) => {
	console.error("\nFatal error:", err instanceof Error ? err.message : err);
	process.exit(1);
});
