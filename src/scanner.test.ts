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
