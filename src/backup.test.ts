import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({
	get: vi.fn(),
	post: vi.fn(),
	postJson: vi.fn(),
}));

import { get, post, postJson } from "./api";
import { backupTracks, ensureBackupPlaylist } from "./backup";

const mockedGet = vi.mocked(get);
const mockedPost = vi.mocked(post);
const mockedPostJson = vi.mocked(postJson);

function makePage(playlists: { id: string; name: string }[], total: number) {
	return {
		items: playlists.map((p) => ({
			id: p.id,
			name: p.name,
			owner: { id: "user1" },
			tracks: { total: 0 },
			images: null,
		})),
		total,
		limit: 50,
		offset: 0,
		next: null,
	};
}

describe("ensureBackupPlaylist", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns existing playlist ID when found on first page", async () => {
		mockedGet.mockResolvedValueOnce(
			makePage(
				[
					{ id: "pl1", name: "My Playlist" },
					{ id: "pl-backup", name: "Spotless Backup" },
				],
				2,
			),
		);

		const id = await ensureBackupPlaylist("user1");

		expect(id).toBe("pl-backup");
		expect(mockedPostJson).not.toHaveBeenCalled();
	});

	it("paginates and finds playlist on later page", async () => {
		const firstPage = makePage(
			Array.from({ length: 50 }, (_, i) => ({ id: `pl${i}`, name: `Playlist ${i}` })),
			75,
		);
		const secondPage = makePage(
			[
				...Array.from({ length: 24 }, (_, i) => ({
					id: `pl${50 + i}`,
					name: `Playlist ${50 + i}`,
				})),
				{ id: "pl-backup", name: "Spotless Backup" },
			],
			75,
		);

		mockedGet.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

		const id = await ensureBackupPlaylist("user1");

		expect(id).toBe("pl-backup");
		expect(mockedGet).toHaveBeenCalledTimes(2);
	});

	it("creates playlist when not found", async () => {
		mockedGet.mockResolvedValueOnce(makePage([{ id: "pl1", name: "Other" }], 1));
		mockedPostJson.mockResolvedValueOnce({ id: "new-backup-id" });

		const id = await ensureBackupPlaylist("user1");

		expect(id).toBe("new-backup-id");
		expect(mockedPostJson).toHaveBeenCalledWith("/users/user1/playlists", {
			name: "Spotless Backup",
			description: "Tracks removed by Spotless \u2014 your safety net.",
			public: false,
		});
	});

	it("propagates API errors", async () => {
		mockedGet.mockRejectedValueOnce(new Error("Network error"));

		await expect(ensureBackupPlaylist("user1")).rejects.toThrow("Network error");
	});
});

describe("backupTracks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedPost.mockResolvedValue(undefined);
	});

	it("adds tracks in a single batch when <= 100", async () => {
		const uris = Array.from({ length: 3 }, (_, i) => `spotify:track:t${i}`);

		await backupTracks("pl-backup", uris);

		expect(mockedPost).toHaveBeenCalledTimes(1);
		expect(mockedPost).toHaveBeenCalledWith("/playlists/pl-backup/tracks", { uris });
	});

	it("chunks into multiple batches when > 100", async () => {
		const uris = Array.from({ length: 150 }, (_, i) => `spotify:track:t${i}`);

		await backupTracks("pl-backup", uris);

		expect(mockedPost).toHaveBeenCalledTimes(2);
		expect(mockedPost).toHaveBeenNthCalledWith(1, "/playlists/pl-backup/tracks", {
			uris: uris.slice(0, 100),
		});
		expect(mockedPost).toHaveBeenNthCalledWith(2, "/playlists/pl-backup/tracks", {
			uris: uris.slice(100),
		});
	});

	it("propagates API errors", async () => {
		mockedPost.mockRejectedValueOnce(new Error("Rate limited"));

		await expect(backupTracks("pl-backup", ["spotify:track:t1"])).rejects.toThrow("Rate limited");
	});
});
