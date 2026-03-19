import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PendingOp } from "./state";

vi.mock("../actions", () => ({
	addTrack: vi.fn(),
	removeTrack: vi.fn(),
	sourceFromUnplayable: vi.fn((sourceId: string | null) =>
		sourceId === null ? { type: "liked" } : { type: "playlist", id: sourceId },
	),
}));

vi.mock("../backup", () => ({
	ensureBackupPlaylist: vi.fn(),
	backupTracks: vi.fn(),
}));

import { addTrack, removeTrack } from "../actions";
import { backupTracks, ensureBackupPlaylist } from "../backup";
import { executeBatch } from "./batch";

const mockedAddTrack = vi.mocked(addTrack);
const mockedRemoveTrack = vi.mocked(removeTrack);
const mockedEnsureBackup = vi.mocked(ensureBackupPlaylist);
const mockedBackupTracks = vi.mocked(backupTracks);

function makeOp(overrides: Partial<PendingOp> = {}): PendingOp {
	return {
		type: "add",
		trackId: "t1",
		trackName: "Track",
		artistNames: "Artist",
		source: "Liked Songs",
		sourceId: null,
		trackUri: "spotify:track:old1",
		candidateUri: "spotify:track:new1",
		candidateName: "Replacement",
		confidence: 3,
		...overrides,
	};
}

const USER_ID = "user123";

describe("executeBatch", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedAddTrack.mockResolvedValue(undefined);
		mockedRemoveTrack.mockResolvedValue(undefined);
		mockedEnsureBackup.mockResolvedValue("backup-playlist-id");
		mockedBackupTracks.mockResolvedValue(undefined);
	});

	it("executes add operations", async () => {
		const ops = [makeOp({ type: "add", candidateUri: "spotify:track:new1" })];

		const result = await executeBatch(ops, USER_ID);

		expect(mockedAddTrack).toHaveBeenCalledWith("spotify:track:new1", { type: "liked" });
		expect(result.succeeded).toHaveLength(1);
		expect(result.failed).toHaveLength(0);
	});

	it("executes remove operations", async () => {
		const ops = [makeOp({ type: "remove", trackUri: "spotify:track:old1" })];

		const result = await executeBatch(ops, USER_ID);

		expect(mockedRemoveTrack).toHaveBeenCalledWith("spotify:track:old1", { type: "liked" });
		expect(result.succeeded).toHaveLength(1);
	});

	it("orders adds before removes", async () => {
		const callOrder: string[] = [];
		mockedAddTrack.mockImplementation(async () => {
			callOrder.push("add");
		});
		mockedRemoveTrack.mockImplementation(async () => {
			callOrder.push("remove");
		});

		const ops = [
			makeOp({ type: "remove", trackId: "t1", trackUri: "spotify:track:old1" }),
			makeOp({ type: "add", trackId: "t1", candidateUri: "spotify:track:new1" }),
		];

		await executeBatch(ops, USER_ID);

		expect(callOrder).toEqual(["add", "remove"]);
	});

	it("skips remove when add fails for same track", async () => {
		mockedAddTrack.mockRejectedValue(new Error("API error"));

		const ops = [
			makeOp({ type: "add", trackId: "t1", candidateUri: "spotify:track:new1" }),
			makeOp({ type: "remove", trackId: "t1", trackUri: "spotify:track:old1" }),
		];

		const result = await executeBatch(ops, USER_ID);

		expect(mockedRemoveTrack).not.toHaveBeenCalled();
		expect(result.failed).toHaveLength(2);
		expect(result.failed[1]?.error).toBe("Skipped because add failed");
	});

	it("does not skip remove for a different track when one add fails", async () => {
		mockedAddTrack.mockRejectedValueOnce(new Error("fail"));
		mockedAddTrack.mockResolvedValueOnce(undefined);

		const ops = [
			makeOp({ type: "add", trackId: "t1", candidateUri: "spotify:track:new1" }),
			makeOp({ type: "add", trackId: "t2", candidateUri: "spotify:track:new2" }),
			makeOp({ type: "remove", trackId: "t1", trackUri: "spotify:track:old1" }),
			makeOp({ type: "remove", trackId: "t2", trackUri: "spotify:track:old2" }),
		];

		const result = await executeBatch(ops, USER_ID);

		// t1 add failed → t1 remove skipped
		// t2 add succeeded → t2 remove should execute
		expect(mockedRemoveTrack).toHaveBeenCalledTimes(1);
		expect(mockedRemoveTrack).toHaveBeenCalledWith("spotify:track:old2", { type: "liked" });
		expect(result.succeeded).toHaveLength(2); // t2 add + t2 remove
		expect(result.failed).toHaveLength(2); // t1 add + t1 remove skipped
	});

	it("reports progress", async () => {
		const progressCalls: [number, number][] = [];
		const ops = [makeOp({ type: "add", trackId: "t1" }), makeOp({ type: "remove", trackId: "t1" })];

		await executeBatch(ops, USER_ID, (completed, total) => {
			progressCalls.push([completed, total]);
		});

		expect(progressCalls).toEqual([
			[1, 2],
			[2, 2],
		]);
	});

	it("handles non-Error throws", async () => {
		mockedAddTrack.mockRejectedValue("string error");

		const ops = [makeOp({ type: "add" })];
		const result = await executeBatch(ops, USER_ID);

		expect(result.failed[0]?.error).toBe("Unknown error");
	});

	it("uses playlist source when sourceId is present", async () => {
		const ops = [
			makeOp({ type: "add", sourceId: "playlist123", candidateUri: "spotify:track:new1" }),
		];

		await executeBatch(ops, USER_ID);

		expect(mockedAddTrack).toHaveBeenCalledWith("spotify:track:new1", {
			type: "playlist",
			id: "playlist123",
		});
	});

	// --- Backup phase tests ---

	it("backs up tracks before executing removes", async () => {
		const callOrder: string[] = [];
		mockedEnsureBackup.mockImplementation(async () => {
			callOrder.push("ensureBackup");
			return "backup-id";
		});
		mockedBackupTracks.mockImplementation(async () => {
			callOrder.push("backupTracks");
		});
		mockedRemoveTrack.mockImplementation(async () => {
			callOrder.push("remove");
		});

		const ops = [makeOp({ type: "remove", trackUri: "spotify:track:old1" })];

		await executeBatch(ops, USER_ID);

		expect(callOrder).toEqual(["ensureBackup", "backupTracks", "remove"]);
		expect(mockedEnsureBackup).toHaveBeenCalledWith(USER_ID);
		expect(mockedBackupTracks).toHaveBeenCalledWith("backup-id", ["spotify:track:old1"]);
	});

	it("aborts all ops when backup fails", async () => {
		mockedEnsureBackup.mockRejectedValue(new Error("Playlist creation failed"));

		const ops = [
			makeOp({ type: "add", trackId: "t1", candidateUri: "spotify:track:new1" }),
			makeOp({ type: "remove", trackId: "t1", trackUri: "spotify:track:old1" }),
		];

		const result = await executeBatch(ops, USER_ID);

		expect(mockedAddTrack).not.toHaveBeenCalled();
		expect(mockedRemoveTrack).not.toHaveBeenCalled();
		expect(result.failed).toHaveLength(2);
		expect(result.failed[0]?.error).toBe("Backup failed: Playlist creation failed");
	});

	it("skips backup when backup flag is false", async () => {
		const ops = [makeOp({ type: "remove", trackUri: "spotify:track:old1" })];

		await executeBatch(ops, USER_ID, undefined, false);

		expect(mockedEnsureBackup).not.toHaveBeenCalled();
		expect(mockedBackupTracks).not.toHaveBeenCalled();
		expect(mockedRemoveTrack).toHaveBeenCalled();
	});

	it("skips backup when no remove ops exist", async () => {
		const ops = [makeOp({ type: "add", candidateUri: "spotify:track:new1" })];

		await executeBatch(ops, USER_ID);

		expect(mockedEnsureBackup).not.toHaveBeenCalled();
		expect(mockedBackupTracks).not.toHaveBeenCalled();
	});

	it("deduplicates track URIs for backup", async () => {
		const ops = [
			makeOp({ type: "remove", trackId: "t1", trackUri: "spotify:track:same" }),
			makeOp({ type: "remove", trackId: "t2", trackUri: "spotify:track:same" }),
		];

		await executeBatch(ops, USER_ID);

		expect(mockedBackupTracks).toHaveBeenCalledWith("backup-playlist-id", ["spotify:track:same"]);
	});
});
