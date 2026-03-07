import { describe, expect, it, vi } from "vitest";
import type {
	ScanConfig,
	ScanEvent,
	SpotifyPaginatedResponse,
	SpotifyPlaylist,
	SpotifyPlaylistTrack,
	SpotifySavedTrack,
} from "./types";

// Mock the api module before importing scanner
vi.mock("./api", () => ({
	get: vi.fn(),
}));

import { get } from "./api";
import { scan } from "./scanner";

const mockedGet = vi.mocked(get);

function makeTrack(name: string, playable = true) {
	return {
		id: name,
		uri: `spotify:track:${name}`,
		name,
		artists: [{ id: "a1", name: "Artist" }],
		album: {
			id: `${name}-alb`,
			name: `${name} Album`,
			images: [
				{ url: "https://img/large.jpg", height: 640, width: 640 },
				{ url: "https://img/medium.jpg", height: 300, width: 300 },
				{ url: "https://img/small.jpg", height: 64, width: 64 },
			],
		},
		is_playable: playable,
		is_local: false,
	};
}

function makeTrackNoArt(name: string, playable = true) {
	return {
		id: name,
		uri: `spotify:track:${name}`,
		name,
		artists: [{ id: "a1", name: "Artist" }],
		album: { id: `${name}-alb`, name: `${name} Album`, images: [] },
		is_playable: playable,
		is_local: false,
	};
}

function makeSavedTrack(name: string, playable = true): SpotifySavedTrack {
	return { track: makeTrack(name, playable) };
}

function makePlaylistTrack(name: string, playable = true): SpotifyPlaylistTrack {
	return { track: makeTrack(name, playable), is_local: false };
}

function makePage<T>(items: T[], total?: number): SpotifyPaginatedResponse<T> {
	return {
		items,
		total: total ?? items.length,
		limit: 50,
		offset: 0,
		next: null,
	};
}

function makePlaylist(id: string, name: string): SpotifyPlaylist {
	return { id, name, owner: { id: "user1" }, tracks: { total: 1 }, images: [] };
}

function allSources(...playlists: SpotifyPlaylist[]): ScanConfig {
	return { includeLikedSongs: true, playlists };
}

async function collectEvents(gen: AsyncGenerator<ScanEvent>): Promise<ScanEvent[]> {
	const events: ScanEvent[] = [];
	for await (const event of gen) {
		events.push(event);
	}
	return events;
}

describe("scan", () => {
	it("emits sources event with Liked Songs and playlist names", async () => {
		const p1 = makePlaylist("p1", "Road Trip");
		const p2 = makePlaylist("p2", "Chill Vibes");

		mockedGet.mockImplementation((path: string) => {
			if (path.startsWith("/me/tracks"))
				return Promise.resolve(makePage([makeSavedTrack("Song 1")]));
			if (path.startsWith("/playlists/p1/tracks"))
				return Promise.resolve(makePage([makePlaylistTrack("Road Song")]));
			if (path.startsWith("/playlists/p2/tracks"))
				return Promise.resolve(makePage([makePlaylistTrack("Chill Song")]));
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan(allSources(p1, p2)));

		const sourcesEvent = events.find((e) => e.type === "sources");
		expect(sourcesEvent).toEqual({
			type: "sources",
			names: ["Liked Songs", "Road Trip", "Chill Vibes"],
		});
	});

	it("emits sources event as the first event", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path.startsWith("/me/tracks"))
				return Promise.resolve(makePage([makeSavedTrack("Song 1")]));
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan(allSources()));

		expect(events[0]?.type).toBe("sources");
	});

	it("skips Liked Songs when includeLikedSongs is false", async () => {
		const p1 = makePlaylist("p1", "My Playlist");

		mockedGet.mockReset();
		mockedGet.mockImplementation((path: string) => {
			if (path.startsWith("/playlists/p1/tracks"))
				return Promise.resolve(makePage([makePlaylistTrack("Song")]));
			return Promise.resolve(makePage([]));
		});

		const config: ScanConfig = { includeLikedSongs: false, playlists: [p1] };
		const events = await collectEvents(scan(config));

		const sourcesEvent = events.find((e) => e.type === "sources");
		expect(sourcesEvent).toEqual({
			type: "sources",
			names: ["My Playlist"],
		});

		// Should not have fetched /me/tracks
		const calls = mockedGet.mock.calls.map(([p]) => p);
		expect(calls.some((c) => c.startsWith("/me/tracks"))).toBe(false);
	});

	it("scans only Liked Songs when playlists array is empty", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path.startsWith("/me/tracks")) return Promise.resolve(makePage([makeSavedTrack("Song")]));
			return Promise.resolve(makePage([]));
		});

		const config: ScanConfig = { includeLikedSongs: true, playlists: [] };
		const events = await collectEvents(scan(config));

		const sourcesEvent = events.find((e) => e.type === "sources");
		expect(sourcesEvent).toEqual({
			type: "sources",
			names: ["Liked Songs"],
		});
	});

	it("emits found events for unplayable tracks in Liked Songs and playlists", async () => {
		const p1 = makePlaylist("p1", "My Playlist");

		mockedGet.mockImplementation((path: string) => {
			if (path.startsWith("/me/tracks"))
				return Promise.resolve(
					makePage([makeSavedTrack("Good Song"), makeSavedTrack("Dead Song", false)]),
				);
			if (path.startsWith("/playlists/p1/tracks"))
				return Promise.resolve(
					makePage([makePlaylistTrack("Alive"), makePlaylistTrack("Gone", false)]),
				);
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan(allSources(p1)));
		const foundEvents = events.filter((e) => e.type === "found");

		expect(foundEvents).toHaveLength(2);
		expect(foundEvents[0]).toMatchObject({
			type: "found",
			track: { name: "Dead Song", source: "Liked Songs" },
		});
		expect(foundEvents[1]).toMatchObject({
			type: "found",
			track: { name: "Gone", source: "My Playlist" },
		});
	});

	it("done event contains correct summary with unplayable tracks", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path.startsWith("/me/tracks"))
				return Promise.resolve(makePage([makeSavedTrack("OK"), makeSavedTrack("Bad", false)]));
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan(allSources()));
		const doneEvent = events.find((e) => e.type === "done");

		expect(doneEvent).toBeDefined();
		expect(doneEvent?.type === "done" && doneEvent.summary.totalScanned).toBe(2);
		expect(doneEvent?.type === "done" && doneEvent.summary.unplayable).toHaveLength(1);
		expect(doneEvent?.type === "done" && doneEvent.summary.unplayable[0]?.name).toBe("Bad");
	});

	it("done event for a clean library has empty unplayable array", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path.startsWith("/me/tracks"))
				return Promise.resolve(makePage([makeSavedTrack("All Good")]));
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan(allSources()));
		const doneEvent = events.find((e) => e.type === "done");

		expect(doneEvent?.type === "done" && doneEvent.summary.unplayable).toHaveLength(0);
		expect(doneEvent?.type === "done" && doneEvent.summary.totalScanned).toBe(1);
	});

	it("paginates when total exceeds page size", async () => {
		const page1Items = Array.from({ length: 50 }, (_, i) => makeSavedTrack(`Song ${i}`));
		const page2Items = Array.from({ length: 25 }, (_, i) => makeSavedTrack(`Song ${50 + i}`));

		mockedGet.mockImplementation((path: string) => {
			if (path.startsWith("/me/tracks")) {
				const url = new URL(`https://x${path}`);
				const offset = Number(url.searchParams.get("offset") ?? "0");
				if (offset === 0) {
					return Promise.resolve({
						items: page1Items,
						total: 75,
						limit: 50,
						offset: 0,
						next: "http://next",
					});
				}
				return Promise.resolve({
					items: page2Items,
					total: 75,
					limit: 50,
					offset: 50,
					next: null,
				});
			}
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan(allSources()));
		const doneEvent = events.find((e) => e.type === "done");

		expect(doneEvent?.type === "done" && doneEvent.summary.totalScanned).toBe(75);
	});

	it("skips null tracks (deleted playlist tracks)", async () => {
		const p1 = makePlaylist("p1", "Has Deleted");

		mockedGet.mockImplementation((path: string) => {
			if (path.startsWith("/me/tracks")) return Promise.resolve(makePage([]));
			if (path.startsWith("/playlists/p1/tracks"))
				return Promise.resolve(
					makePage([
						{ track: null, is_local: false } as SpotifyPlaylistTrack,
						makePlaylistTrack("Real Song"),
					]),
				);
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan(allSources(p1)));
		const doneEvent = events.find((e) => e.type === "done");

		// Only "Real Song" should be scanned, null track is skipped
		expect(doneEvent?.type === "done" && doneEvent.summary.totalScanned).toBe(1);
	});

	it("skips local tracks", async () => {
		const p1 = makePlaylist("p1", "Has Local");

		mockedGet.mockImplementation((path: string) => {
			if (path.startsWith("/me/tracks")) return Promise.resolve(makePage([]));
			if (path.startsWith("/playlists/p1/tracks"))
				return Promise.resolve(
					makePage([
						{ track: makeTrack("Local File"), is_local: true } as SpotifyPlaylistTrack,
						makePlaylistTrack("Cloud Song"),
					]),
				);
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan(allSources(p1)));
		const doneEvent = events.find((e) => e.type === "done");

		// Only "Cloud Song" should be scanned, local track is skipped
		expect(doneEvent?.type === "done" && doneEvent.summary.totalScanned).toBe(1);
	});

	it("includes smallest album image as thumbnailUrl on unplayable tracks", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path.startsWith("/me/tracks"))
				return Promise.resolve(makePage([makeSavedTrack("Dead Song", false)]));
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan(allSources()));
		const foundEvent = events.find((e) => e.type === "found");

		expect(foundEvent?.type === "found" && foundEvent.track.thumbnailUrl).toBe(
			"https://img/small.jpg",
		);
	});

	it("omits thumbnailUrl when track has no album images", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path.startsWith("/me/tracks"))
				return Promise.resolve(
					makePage([{ track: makeTrackNoArt("No Art", false) } as SpotifySavedTrack]),
				);
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan(allSources()));
		const foundEvent = events.find((e) => e.type === "found");

		expect(foundEvent?.type === "found" && foundEvent.track.thumbnailUrl).toBeUndefined();
	});
});
