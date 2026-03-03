import { describe, expect, it, vi } from "vitest";
import type {
	ScanEvent,
	SpotifyPaginatedResponse,
	SpotifyPlaylist,
	SpotifyPlaylistTrack,
	SpotifySavedTrack,
	SpotifyUser,
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
		name,
		artists: [{ id: "a1", name: "Artist" }],
		album: {
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
		name,
		artists: [{ id: "a1", name: "Artist" }],
		album: { name: `${name} Album`, images: [] },
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

function makePlaylist(id: string, name: string, ownerId: string): SpotifyPlaylist {
	return { id, name, owner: { id: ownerId }, tracks: { total: 1 } };
}

const user: SpotifyUser = { id: "user1", display_name: "Test User", images: [] };

async function collectEvents(gen: AsyncGenerator<ScanEvent>): Promise<ScanEvent[]> {
	const events: ScanEvent[] = [];
	for await (const event of gen) {
		events.push(event);
	}
	return events;
}

describe("scan", () => {
	it("emits sources event with Liked Songs and owned playlist names before scanning", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path === "/me") return Promise.resolve(user);
			if (path.startsWith("/me/playlists"))
				return Promise.resolve(
					makePage([
						makePlaylist("p1", "Road Trip", "user1"),
						makePlaylist("p2", "Chill Vibes", "user1"),
						makePlaylist("p3", "Not Mine", "other"),
					]),
				);
			if (path.startsWith("/me/tracks"))
				return Promise.resolve(makePage([makeSavedTrack("Song 1")]));
			if (path.startsWith("/playlists/p1/tracks"))
				return Promise.resolve(makePage([makePlaylistTrack("Road Song")]));
			if (path.startsWith("/playlists/p2/tracks"))
				return Promise.resolve(makePage([makePlaylistTrack("Chill Song")]));
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan());

		const sourcesEvent = events.find((e) => e.type === "sources");
		expect(sourcesEvent).toEqual({
			type: "sources",
			names: ["Liked Songs", "Road Trip", "Chill Vibes"],
		});
	});

	it("emits sources event as the first event", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path === "/me") return Promise.resolve(user);
			if (path.startsWith("/me/playlists")) return Promise.resolve(makePage([]));
			if (path.startsWith("/me/tracks"))
				return Promise.resolve(makePage([makeSavedTrack("Song 1")]));
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan());

		expect(events[0]?.type).toBe("sources");
	});

	it("excludes non-owned playlists from sources event", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path === "/me") return Promise.resolve(user);
			if (path.startsWith("/me/playlists"))
				return Promise.resolve(
					makePage([makePlaylist("p1", "Mine", "user1"), makePlaylist("p2", "Followed", "other")]),
				);
			if (path.startsWith("/me/tracks")) return Promise.resolve(makePage([]));
			if (path.startsWith("/playlists/p1/tracks")) return Promise.resolve(makePage([]));
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan());

		const sourcesEvent = events.find((e) => e.type === "sources");
		expect(sourcesEvent).toEqual({
			type: "sources",
			names: ["Liked Songs", "Mine"],
		});
	});

	it("emits found events for unplayable tracks in Liked Songs and playlists", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path === "/me") return Promise.resolve(user);
			if (path.startsWith("/me/playlists"))
				return Promise.resolve(makePage([makePlaylist("p1", "My Playlist", "user1")]));
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

		const events = await collectEvents(scan());
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
			if (path === "/me") return Promise.resolve(user);
			if (path.startsWith("/me/playlists")) return Promise.resolve(makePage([]));
			if (path.startsWith("/me/tracks"))
				return Promise.resolve(makePage([makeSavedTrack("OK"), makeSavedTrack("Bad", false)]));
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan());
		const doneEvent = events.find((e) => e.type === "done");

		expect(doneEvent).toBeDefined();
		expect(doneEvent?.type === "done" && doneEvent.summary.totalScanned).toBe(2);
		expect(doneEvent?.type === "done" && doneEvent.summary.unplayable).toHaveLength(1);
		expect(doneEvent?.type === "done" && doneEvent.summary.unplayable[0]?.name).toBe("Bad");
	});

	it("done event for a clean library has empty unplayable array", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path === "/me") return Promise.resolve(user);
			if (path.startsWith("/me/playlists")) return Promise.resolve(makePage([]));
			if (path.startsWith("/me/tracks"))
				return Promise.resolve(makePage([makeSavedTrack("All Good")]));
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan());
		const doneEvent = events.find((e) => e.type === "done");

		expect(doneEvent?.type === "done" && doneEvent.summary.unplayable).toHaveLength(0);
		expect(doneEvent?.type === "done" && doneEvent.summary.totalScanned).toBe(1);
	});

	it("paginates when total exceeds page size", async () => {
		const page1Items = Array.from({ length: 50 }, (_, i) => makeSavedTrack(`Song ${i}`));
		const page2Items = Array.from({ length: 25 }, (_, i) => makeSavedTrack(`Song ${50 + i}`));

		mockedGet.mockImplementation((path: string) => {
			if (path === "/me") return Promise.resolve(user);
			if (path.startsWith("/me/playlists")) return Promise.resolve(makePage([]));
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

		const events = await collectEvents(scan());
		const doneEvent = events.find((e) => e.type === "done");

		expect(doneEvent?.type === "done" && doneEvent.summary.totalScanned).toBe(75);
	});

	it("skips null tracks (deleted playlist tracks)", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path === "/me") return Promise.resolve(user);
			if (path.startsWith("/me/playlists"))
				return Promise.resolve(makePage([makePlaylist("p1", "Has Deleted", "user1")]));
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

		const events = await collectEvents(scan());
		const doneEvent = events.find((e) => e.type === "done");

		// Only "Real Song" should be scanned, null track is skipped
		expect(doneEvent?.type === "done" && doneEvent.summary.totalScanned).toBe(1);
	});

	it("skips local tracks", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path === "/me") return Promise.resolve(user);
			if (path.startsWith("/me/playlists"))
				return Promise.resolve(makePage([makePlaylist("p1", "Has Local", "user1")]));
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

		const events = await collectEvents(scan());
		const doneEvent = events.find((e) => e.type === "done");

		// Only "Cloud Song" should be scanned, local track is skipped
		expect(doneEvent?.type === "done" && doneEvent.summary.totalScanned).toBe(1);
	});

	it("includes smallest album image as thumbnailUrl on unplayable tracks", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path === "/me") return Promise.resolve(user);
			if (path.startsWith("/me/playlists")) return Promise.resolve(makePage([]));
			if (path.startsWith("/me/tracks"))
				return Promise.resolve(makePage([makeSavedTrack("Dead Song", false)]));
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan());
		const foundEvent = events.find((e) => e.type === "found");

		expect(foundEvent?.type === "found" && foundEvent.track.thumbnailUrl).toBe(
			"https://img/small.jpg",
		);
	});

	it("omits thumbnailUrl when track has no album images", async () => {
		mockedGet.mockImplementation((path: string) => {
			if (path === "/me") return Promise.resolve(user);
			if (path.startsWith("/me/playlists")) return Promise.resolve(makePage([]));
			if (path.startsWith("/me/tracks"))
				return Promise.resolve(
					makePage([{ track: makeTrackNoArt("No Art", false) } as SpotifySavedTrack]),
				);
			return Promise.resolve(makePage([]));
		});

		const events = await collectEvents(scan());
		const foundEvent = events.find((e) => e.type === "found");

		expect(foundEvent?.type === "found" && foundEvent.track.thumbnailUrl).toBeUndefined();
	});

	it("prefetches playlists before emitting any progress events", async () => {
		const callOrder: string[] = [];

		mockedGet.mockImplementation((path: string) => {
			callOrder.push(path);
			if (path === "/me") return Promise.resolve(user);
			if (path.startsWith("/me/playlists")) return Promise.resolve(makePage([]));
			if (path.startsWith("/me/tracks")) return Promise.resolve(makePage([makeSavedTrack("Song")]));
			return Promise.resolve(makePage([]));
		});

		await collectEvents(scan());

		const playlistFetchIndex = callOrder.findIndex((p) => p.startsWith("/me/playlists"));
		const trackFetchIndex = callOrder.findIndex((p) => p.startsWith("/me/tracks"));
		expect(playlistFetchIndex).toBeLessThan(trackFetchIndex);
	});
});
