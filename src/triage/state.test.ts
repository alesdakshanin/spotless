import { describe, expect, it, vi } from "vitest";
import type { ReplacementCandidate, UnplayableTrack } from "../types";
import {
	createTriageStore,
	markTracksApplied,
	searchAllReplacements,
	selectCandidate,
	toggleRemove,
} from "./state";

// --- Helpers ---

function makeTrack(overrides: Partial<UnplayableTrack> = {}): UnplayableTrack {
	return {
		name: "Test Track",
		artists: ["Artist A"],
		source: "Liked Songs",
		sourceId: null,
		trackUri: "spotify:track:abc123",
		reason: "market",
		...overrides,
	};
}

function makeCandidate(
	confidence: 1 | 2 | 3,
	uri = "spotify:track:replacement1",
	name = "Replacement",
): ReplacementCandidate {
	return {
		track: {
			id: uri.split(":")[2] ?? "x",
			uri,
			name,
			artists: [{ id: "a1", name: "Artist B" }],
			album: { id: "alb1", name: "Album", images: [] },
		},
		confidence,
	};
}

// --- createTriageStore ---

describe("createTriageStore", () => {
	it("initializes tracks from unplayable list", () => {
		const store = createTriageStore([makeTrack(), makeTrack({ trackUri: "spotify:track:def456" })]);

		expect(store.tracks.value).toHaveLength(2);
		expect(store.tracks.value[0]?.intent).toBe("skip");
		expect(store.tracks.value[0]?.searchStatus).toBe("pending");
		expect(store.tracks.value[0]?.candidates).toEqual([]);
		expect(store.tracks.value[0]?.applied).toBe(false);
	});

	it("initializes search progress", () => {
		const store = createTriageStore([makeTrack(), makeTrack({ trackUri: "spotify:track:def456" })]);
		expect(store.searchProgress.value).toEqual({ completed: 0, total: 2 });
	});

	it("starts with no pending ops", () => {
		const store = createTriageStore([makeTrack()]);
		expect(store.pendingOps.value).toEqual([]);
	});

	it("starts with selectedCount 0", () => {
		const store = createTriageStore([makeTrack()]);
		expect(store.selectedCount.value).toBe(0);
	});
});

// --- selectCandidate ---

describe("selectCandidate", () => {
	it("sets intent to replace with candidate", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			candidates: [makeCandidate(2, "spotify:track:c2")],
			searchStatus: "done" as const,
		}));

		selectCandidate(store, "spotify:track:abc123", "spotify:track:c2");

		const track = store.tracks.value[0];
		expect(track?.intent).toBe("replace");
		expect(track?.selectedCandidateId).toBe("spotify:track:c2");
	});

	it("toggles to skip when same candidate re-clicked", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			candidates: [makeCandidate(2, "spotify:track:c2")],
			searchStatus: "done" as const,
			intent: "replace" as const,
			selectedCandidateId: "spotify:track:c2",
		}));

		selectCandidate(store, "spotify:track:abc123", "spotify:track:c2");

		expect(store.tracks.value[0]?.intent).toBe("skip");
	});

	it("switches candidate when different one clicked", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			candidates: [makeCandidate(3, "spotify:track:c3"), makeCandidate(1, "spotify:track:c1")],
			searchStatus: "done" as const,
			intent: "replace" as const,
			selectedCandidateId: "spotify:track:c3",
		}));

		selectCandidate(store, "spotify:track:abc123", "spotify:track:c1");

		const track = store.tracks.value[0];
		expect(track?.intent).toBe("replace");
		expect(track?.selectedCandidateId).toBe("spotify:track:c1");
	});

	it("does not modify applied tracks", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({ ...t, applied: true }));

		selectCandidate(store, "spotify:track:abc123", "spotify:track:c2");
		expect(store.tracks.value[0]?.intent).toBe("skip");
	});

	it("deselects remove row when candidate selected", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			candidates: [makeCandidate(2, "spotify:track:c2")],
			searchStatus: "done" as const,
			intent: "remove" as const,
		}));

		selectCandidate(store, "spotify:track:abc123", "spotify:track:c2");

		expect(store.tracks.value[0]?.intent).toBe("replace");
	});
});

// --- toggleRemove ---

describe("toggleRemove", () => {
	it("sets intent to remove", () => {
		const store = createTriageStore([makeTrack()]);

		toggleRemove(store, "spotify:track:abc123");
		expect(store.tracks.value[0]?.intent).toBe("remove");
	});

	it("toggles back to skip", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			intent: "remove" as const,
		}));

		toggleRemove(store, "spotify:track:abc123");
		expect(store.tracks.value[0]?.intent).toBe("skip");
	});

	it("deselects candidate when remove toggled on", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			candidates: [makeCandidate(3, "spotify:track:c3")],
			searchStatus: "done" as const,
			intent: "replace" as const,
			selectedCandidateId: "spotify:track:c3",
		}));

		toggleRemove(store, "spotify:track:abc123");

		const track = store.tracks.value[0];
		expect(track?.intent).toBe("remove");
		expect(track?.selectedCandidateId).toBeNull();
	});

	it("does not modify applied tracks", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({ ...t, applied: true }));

		toggleRemove(store, "spotify:track:abc123");
		expect(store.tracks.value[0]?.intent).toBe("skip");
	});
});

// --- pendingOps ---

describe("pendingOps", () => {
	it("generates add + remove for replace intent", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			candidates: [makeCandidate(3, "spotify:track:rep")],
			searchStatus: "done" as const,
			intent: "replace" as const,
			selectedCandidateId: "spotify:track:rep",
		}));

		const ops = store.pendingOps.value;
		expect(ops).toHaveLength(2);
		expect(ops.find((o) => o.type === "add")?.candidateUri).toBe("spotify:track:rep");
		expect(ops.find((o) => o.type === "remove")).toBeDefined();
	});

	it("generates remove only for remove intent", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			searchStatus: "done" as const,
			intent: "remove" as const,
		}));

		const ops = store.pendingOps.value;
		expect(ops).toHaveLength(1);
		expect(ops[0]?.type).toBe("remove");
	});

	it("generates nothing for skip intent", () => {
		const store = createTriageStore([makeTrack()]);
		expect(store.pendingOps.value).toEqual([]);
	});

	it("excludes applied tracks", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			intent: "replace" as const,
			selectedCandidateId: "spotify:track:x",
			candidates: [makeCandidate(3)],
			searchStatus: "done" as const,
			applied: true,
		}));

		expect(store.pendingOps.value).toEqual([]);
	});
});

// --- selectedCount ---

describe("selectedCount", () => {
	it("counts tracks with non-skip intent", () => {
		const store = createTriageStore([
			makeTrack({ trackUri: "spotify:track:a" }),
			makeTrack({ trackUri: "spotify:track:b" }),
			makeTrack({ trackUri: "spotify:track:c" }),
		]);
		store.tracks.value = store.tracks.value.map((t, i) => ({
			...t,
			intent: i === 0 ? ("replace" as const) : i === 1 ? ("remove" as const) : ("skip" as const),
			selectedCandidateId: i === 0 ? "spotify:track:x" : null,
			searchStatus: "done" as const,
		}));

		expect(store.selectedCount.value).toBe(2);
	});

	it("excludes applied tracks", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			intent: "replace" as const,
			selectedCandidateId: "spotify:track:x",
			applied: true,
		}));

		expect(store.selectedCount.value).toBe(0);
	});
});

// --- markTracksApplied ---

describe("markTracksApplied", () => {
	it("marks specified tracks as applied with skip intent", () => {
		const store = createTriageStore([
			makeTrack({ trackUri: "spotify:track:a" }),
			makeTrack({ trackUri: "spotify:track:b" }),
		]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			intent: "replace" as const,
			selectedCandidateId: "spotify:track:x",
		}));

		markTracksApplied(store, ["spotify:track:a"]);

		expect(store.tracks.value[0]?.applied).toBe(true);
		expect(store.tracks.value[0]?.intent).toBe("skip");
		expect(store.tracks.value[1]?.applied).toBe(false);
		expect(store.tracks.value[1]?.intent).toBe("replace");
	});
});

// --- searchAllReplacements ---

describe("searchAllReplacements", () => {
	it("searches for each track and updates store", async () => {
		const store = createTriageStore([
			makeTrack({ trackUri: "spotify:track:a", name: "Track A" }),
			makeTrack({ trackUri: "spotify:track:b", name: "Track B" }),
		]);

		const candidate = makeCandidate(2, "spotify:track:rep");
		const searchFn = vi.fn().mockResolvedValue([candidate]);

		await searchAllReplacements(store, searchFn);

		expect(searchFn).toHaveBeenCalledTimes(2);
		expect(store.tracks.value[0]?.searchStatus).toBe("done");
		expect(store.tracks.value[0]?.candidates).toEqual([candidate]);
		expect(store.searchProgress.value).toEqual({ completed: 2, total: 2 });
	});

	it("auto-proposes confidence 3 matches", async () => {
		const store = createTriageStore([makeTrack()]);
		const c3 = makeCandidate(3, "spotify:track:c3");
		const searchFn = vi.fn().mockResolvedValue([c3]);

		await searchAllReplacements(store, searchFn);

		const track = store.tracks.value[0];
		expect(track?.intent).toBe("replace");
		expect(track?.selectedCandidateId).toBe("spotify:track:c3");
	});

	it("does not auto-propose low confidence matches", async () => {
		const store = createTriageStore([makeTrack()]);
		const searchFn = vi.fn().mockResolvedValue([makeCandidate(1)]);

		await searchAllReplacements(store, searchFn);

		expect(store.tracks.value[0]?.intent).toBe("skip");
		expect(store.tracks.value[0]?.selectedCandidateId).toBeNull();
	});

	it("handles search errors gracefully", async () => {
		const store = createTriageStore([makeTrack()]);
		const searchFn = vi.fn().mockRejectedValue(new Error("network fail"));

		await searchAllReplacements(store, searchFn);

		expect(store.tracks.value[0]?.searchStatus).toBe("done");
		expect(store.tracks.value[0]?.candidates).toEqual([]);
	});

	it("updates progress after each track", async () => {
		const store = createTriageStore([
			makeTrack({ trackUri: "spotify:track:a" }),
			makeTrack({ trackUri: "spotify:track:b" }),
		]);
		const searchFn = vi.fn().mockResolvedValue([]);

		await searchAllReplacements(store, searchFn);

		expect(store.searchProgress.value).toEqual({ completed: 2, total: 2 });
	});
});
