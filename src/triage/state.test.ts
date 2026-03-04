import { describe, expect, it, vi } from "vitest";
import type { ReplacementCandidate, UnplayableTrack } from "../types";
import {
	createTriageStore,
	deselectAllVisible,
	markTracksApplied,
	searchAllReplacements,
	selectAllVisible,
	selectCandidate,
	setFilter,
	toggleCheck,
	toggleExpanded,
	toggleRemoveOriginal,
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
			album: { name: "Album", images: [] },
		},
		confidence,
	};
}

// --- createTriageStore ---

describe("createTriageStore", () => {
	it("initializes tracks from unplayable list", () => {
		const store = createTriageStore([makeTrack(), makeTrack({ trackUri: "spotify:track:def456" })]);

		expect(store.tracks.value).toHaveLength(2);
		expect(store.tracks.value[0]?.checked).toBe(false);
		expect(store.tracks.value[0]?.searchStatus).toBe("pending");
		expect(store.tracks.value[0]?.candidates).toEqual([]);
		expect(store.tracks.value[0]?.applied).toBe(false);
	});

	it("initializes search progress", () => {
		const store = createTriageStore([makeTrack(), makeTrack({ trackUri: "spotify:track:def456" })]);
		expect(store.searchProgress.value).toEqual({ completed: 0, total: 2 });
	});

	it("computes filter counts", () => {
		const store = createTriageStore([makeTrack()]);
		expect(store.counts.value).toEqual({
			all: 1,
			autoProposed: 0,
			needsReview: 0,
			noMatch: 0,
		});
	});

	it("starts with no pending ops", () => {
		const store = createTriageStore([makeTrack()]);
		expect(store.pendingOps.value).toEqual([]);
	});

	it("starts with selectAllState none", () => {
		const store = createTriageStore([makeTrack()]);
		expect(store.selectAllState.value).toBe("none");
	});
});

// --- toggleCheck ---

describe("toggleCheck", () => {
	it("checks a track and auto-selects best candidate", () => {
		const store = createTriageStore([makeTrack()]);
		const c3 = makeCandidate(3, "spotify:track:c3");
		const c1 = makeCandidate(1, "spotify:track:c1");
		// Manually set candidates (simulating search completion)
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			candidates: [c3, c1],
			searchStatus: "done" as const,
		}));

		toggleCheck(store, "spotify:track:abc123");

		const track = store.tracks.value[0];
		expect(track?.checked).toBe(true);
		expect(track?.selectedCandidateId).toBe("spotify:track:c3");
		// confidence 3 → auto-set removeOriginal
		expect(track?.removeOriginal).toBe(true);
	});

	it("unchecking clears selection and removeOriginal", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			checked: true,
			selectedCandidateId: "spotify:track:x",
			removeOriginal: true,
			candidates: [makeCandidate(3)],
			searchStatus: "done" as const,
		}));

		toggleCheck(store, "spotify:track:abc123");

		const track = store.tracks.value[0];
		expect(track?.checked).toBe(false);
		expect(track?.selectedCandidateId).toBeNull();
		expect(track?.removeOriginal).toBe(false);
	});

	it("does not toggle applied tracks", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			applied: true,
		}));

		toggleCheck(store, "spotify:track:abc123");
		expect(store.tracks.value[0]?.checked).toBe(false);
	});

	it("does not auto-set removeOriginal for low confidence", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			candidates: [makeCandidate(2)],
			searchStatus: "done" as const,
		}));

		toggleCheck(store, "spotify:track:abc123");
		expect(store.tracks.value[0]?.removeOriginal).toBe(false);
	});
});

// --- selectCandidate ---

describe("selectCandidate", () => {
	it("selects a candidate and checks the track", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			candidates: [makeCandidate(2, "spotify:track:c2")],
			searchStatus: "done" as const,
		}));

		selectCandidate(store, "spotify:track:abc123", "spotify:track:c2");

		const track = store.tracks.value[0];
		expect(track?.checked).toBe(true);
		expect(track?.selectedCandidateId).toBe("spotify:track:c2");
	});
});

// --- toggleRemoveOriginal ---

describe("toggleRemoveOriginal", () => {
	it("toggles removeOriginal flag", () => {
		const store = createTriageStore([makeTrack()]);

		toggleRemoveOriginal(store, "spotify:track:abc123");
		expect(store.tracks.value[0]?.removeOriginal).toBe(true);

		toggleRemoveOriginal(store, "spotify:track:abc123");
		expect(store.tracks.value[0]?.removeOriginal).toBe(false);
	});
});

// --- setFilter ---

describe("setFilter", () => {
	it("updates filter and clears expanded track", () => {
		const store = createTriageStore([makeTrack()]);
		store.expandedTrackId.value = "spotify:track:abc123";

		setFilter(store, "no-match");

		expect(store.filter.value).toBe("no-match");
		expect(store.expandedTrackId.value).toBeNull();
	});
});

// --- filteredTracks ---

describe("filteredTracks", () => {
	it("filters by auto-proposed (confidence 3)", () => {
		const store = createTriageStore([
			makeTrack({ trackUri: "spotify:track:a" }),
			makeTrack({ trackUri: "spotify:track:b" }),
		]);
		store.tracks.value = store.tracks.value.map((t, i) => ({
			...t,
			candidates: i === 0 ? [makeCandidate(3)] : [makeCandidate(1)],
			searchStatus: "done" as const,
		}));

		setFilter(store, "auto-proposed");
		expect(store.filteredTracks.value).toHaveLength(1);
		expect(store.filteredTracks.value[0]?.id).toBe("spotify:track:a");
	});

	it("filters by needs-review (confidence 1-2)", () => {
		const store = createTriageStore([
			makeTrack({ trackUri: "spotify:track:a" }),
			makeTrack({ trackUri: "spotify:track:b" }),
		]);
		store.tracks.value = store.tracks.value.map((t, i) => ({
			...t,
			candidates: i === 0 ? [makeCandidate(3)] : [makeCandidate(2)],
			searchStatus: "done" as const,
		}));

		setFilter(store, "needs-review");
		expect(store.filteredTracks.value).toHaveLength(1);
		expect(store.filteredTracks.value[0]?.id).toBe("spotify:track:b");
	});

	it("filters by no-match", () => {
		const store = createTriageStore([
			makeTrack({ trackUri: "spotify:track:a" }),
			makeTrack({ trackUri: "spotify:track:b" }),
		]);
		store.tracks.value = store.tracks.value.map((t, i) => ({
			...t,
			candidates: i === 0 ? [makeCandidate(2)] : [],
			searchStatus: "done" as const,
		}));

		setFilter(store, "no-match");
		expect(store.filteredTracks.value).toHaveLength(1);
		expect(store.filteredTracks.value[0]?.id).toBe("spotify:track:b");
	});
});

// --- selectAllVisible / deselectAllVisible ---

describe("selectAllVisible / deselectAllVisible", () => {
	function storeWithCandidates() {
		const store = createTriageStore([
			makeTrack({ trackUri: "spotify:track:a" }),
			makeTrack({ trackUri: "spotify:track:b" }),
			makeTrack({ trackUri: "spotify:track:c" }),
		]);
		store.tracks.value = store.tracks.value.map((t, i) => ({
			...t,
			candidates: i < 2 ? [makeCandidate(3, `spotify:track:r${i}`)] : [],
			searchStatus: "done" as const,
		}));
		return store;
	}

	it("selects all visible tracks with candidates", () => {
		const store = storeWithCandidates();

		selectAllVisible(store);

		expect(store.tracks.value[0]?.checked).toBe(true);
		expect(store.tracks.value[1]?.checked).toBe(true);
		// Track c has no candidates — should stay unchecked
		expect(store.tracks.value[2]?.checked).toBe(false);
	});

	it("does not select applied tracks", () => {
		const store = storeWithCandidates();
		store.tracks.value = store.tracks.value.map((t, i) => (i === 0 ? { ...t, applied: true } : t));

		selectAllVisible(store);

		expect(store.tracks.value[0]?.checked).toBe(false);
		expect(store.tracks.value[1]?.checked).toBe(true);
	});

	it("deselects all visible tracks", () => {
		const store = storeWithCandidates();
		selectAllVisible(store);

		deselectAllVisible(store);

		expect(store.tracks.value[0]?.checked).toBe(false);
		expect(store.tracks.value[1]?.checked).toBe(false);
	});

	it("computes selectAllState correctly", () => {
		const store = storeWithCandidates();

		expect(store.selectAllState.value).toBe("none");

		toggleCheck(store, "spotify:track:a");
		expect(store.selectAllState.value).toBe("some");

		toggleCheck(store, "spotify:track:b");
		expect(store.selectAllState.value).toBe("all");
	});
});

// --- toggleExpanded ---

describe("toggleExpanded", () => {
	it("expands and collapses", () => {
		const store = createTriageStore([makeTrack()]);

		toggleExpanded(store, "spotify:track:abc123");
		expect(store.expandedTrackId.value).toBe("spotify:track:abc123");

		toggleExpanded(store, "spotify:track:abc123");
		expect(store.expandedTrackId.value).toBeNull();
	});
});

// --- pendingOps ---

describe("pendingOps", () => {
	it("generates add op for checked track with candidate", () => {
		const store = createTriageStore([makeTrack()]);
		const candidate = makeCandidate(3, "spotify:track:rep");
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			candidates: [candidate],
			searchStatus: "done" as const,
		}));

		toggleCheck(store, "spotify:track:abc123");

		const ops = store.pendingOps.value;
		const addOp = ops.find((o) => o.type === "add");
		expect(addOp).toBeDefined();
		expect(addOp?.candidateUri).toBe("spotify:track:rep");
	});

	it("generates remove op when removeOriginal is set", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			candidates: [makeCandidate(3)],
			searchStatus: "done" as const,
		}));

		toggleCheck(store, "spotify:track:abc123");
		// confidence 3 auto-sets removeOriginal, so we should have both add and remove
		const ops = store.pendingOps.value;
		expect(ops.find((o) => o.type === "add")).toBeDefined();
		expect(ops.find((o) => o.type === "remove")).toBeDefined();
	});

	it("excludes applied tracks from pending ops", () => {
		const store = createTriageStore([makeTrack()]);
		store.tracks.value = store.tracks.value.map((t) => ({
			...t,
			checked: true,
			selectedCandidateId: "spotify:track:x",
			candidates: [makeCandidate(3)],
			searchStatus: "done" as const,
			applied: true,
		}));

		expect(store.pendingOps.value).toEqual([]);
	});
});

// --- markTracksApplied ---

describe("markTracksApplied", () => {
	it("marks specified tracks as applied and unchecked", () => {
		const store = createTriageStore([
			makeTrack({ trackUri: "spotify:track:a" }),
			makeTrack({ trackUri: "spotify:track:b" }),
		]);
		store.tracks.value = store.tracks.value.map((t) => ({ ...t, checked: true }));

		markTracksApplied(store, ["spotify:track:a"]);

		expect(store.tracks.value[0]?.applied).toBe(true);
		expect(store.tracks.value[0]?.checked).toBe(false);
		expect(store.tracks.value[1]?.applied).toBe(false);
		expect(store.tracks.value[1]?.checked).toBe(true);
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
		expect(track?.checked).toBe(true);
		expect(track?.selectedCandidateId).toBe("spotify:track:c3");
		expect(track?.removeOriginal).toBe(true);
	});

	it("does not auto-propose low confidence matches", async () => {
		const store = createTriageStore([makeTrack()]);
		const searchFn = vi.fn().mockResolvedValue([makeCandidate(1)]);

		await searchAllReplacements(store, searchFn);

		expect(store.tracks.value[0]?.checked).toBe(false);
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
		const progressValues: { completed: number; total: number }[] = [];
		const searchFn = vi.fn().mockImplementation(async () => {
			progressValues.push({ ...store.searchProgress.value });
			return [];
		});

		await searchAllReplacements(store, searchFn);

		// After final search, progress should be 2/2
		expect(store.searchProgress.value).toEqual({ completed: 2, total: 2 });
	});
});
