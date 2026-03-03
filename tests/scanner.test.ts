import { describe, expect, it } from "vitest";
import { getRestrictionReason, isLocalTrack, isUnplayable } from "../src/scanner";
import type { SpotifyPlaylistTrack, SpotifySavedTrack, SpotifyTrack } from "../src/types";

// --- Helper factories ---

function makeTrack(overrides: Partial<SpotifyTrack> = {}): SpotifyTrack {
	return {
		id: "track1",
		name: "Test Track",
		artists: [{ id: "a1", name: "Artist" }],
		is_playable: true,
		...overrides,
	};
}

function makeSavedTrack(trackOverrides: Partial<SpotifyTrack> = {}): SpotifySavedTrack {
	return { track: makeTrack(trackOverrides) };
}

function makePlaylistTrack(
	trackOverrides: Partial<SpotifyTrack> = {},
	isLocal = false,
): SpotifyPlaylistTrack {
	return {
		track: makeTrack(trackOverrides),
		is_local: isLocal,
	};
}

// --- Unplayable detection ---

describe("isUnplayable", () => {
	it("returns false for playable track", () => {
		expect(isUnplayable(makeTrack({ is_playable: true }))).toBe(false);
	});

	it("returns true for unplayable track", () => {
		expect(isUnplayable(makeTrack({ is_playable: false }))).toBe(true);
	});

	it("returns false when is_playable is undefined", () => {
		expect(isUnplayable(makeTrack({ is_playable: undefined }))).toBe(false);
	});
});

// --- Restriction reason mapping ---

describe("getRestrictionReason", () => {
	it("maps market restriction", () => {
		const track = makeTrack({ restrictions: { reason: "market" } });
		expect(getRestrictionReason(track)).toBe("Not available in your country");
	});

	it("maps product restriction", () => {
		const track = makeTrack({ restrictions: { reason: "product" } });
		expect(getRestrictionReason(track)).toBe("Not available on your subscription");
	});

	it("maps explicit restriction", () => {
		const track = makeTrack({ restrictions: { reason: "explicit" } });
		expect(getRestrictionReason(track)).toBe("Blocked by explicit content filter");
	});

	it("handles unknown restriction reason", () => {
		const track = makeTrack({ restrictions: { reason: "new_reason" } });
		expect(getRestrictionReason(track)).toBe("Unavailable (new_reason)");
	});

	it("returns generic message when no restrictions field", () => {
		const track = makeTrack({ restrictions: undefined });
		expect(getRestrictionReason(track)).toBe("Unavailable");
	});
});

// --- Local file detection ---

describe("isLocalTrack", () => {
	it("detects local saved tracks via track.is_local", () => {
		const item = makeSavedTrack({ is_local: true });
		expect(isLocalTrack(item)).toBe(true);
	});

	it("returns false for non-local saved tracks", () => {
		const item = makeSavedTrack({ is_local: false });
		expect(isLocalTrack(item)).toBe(false);
	});

	it("detects local playlist tracks via is_local field", () => {
		const item = makePlaylistTrack({}, true);
		expect(isLocalTrack(item)).toBe(true);
	});

	it("returns false for non-local playlist tracks", () => {
		const item = makePlaylistTrack({}, false);
		expect(isLocalTrack(item)).toBe(false);
	});
});
