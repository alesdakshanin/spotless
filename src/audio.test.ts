import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	_initForTesting,
	disconnect,
	dismiss,
	nowPlaying,
	play,
	playingUri,
	sdkReady,
	stop,
	togglePlay,
} from "./audio";

vi.mock("./api", () => ({
	put: vi.fn().mockResolvedValue(undefined),
}));

import { put } from "./api";

function createMockPlayer() {
	return {
		connect: vi.fn().mockResolvedValue(true),
		disconnect: vi.fn(),
		pause: vi.fn().mockResolvedValue(undefined),
		resume: vi.fn().mockResolvedValue(undefined),
		togglePlay: vi.fn().mockResolvedValue(undefined),
		addListener: vi.fn(),
	} as unknown as Spotify.Player;
}

describe("audio", () => {
	let mockPlayer: Spotify.Player;

	beforeEach(() => {
		mockPlayer = createMockPlayer();
		_initForTesting(mockPlayer, "test-device-123");
		vi.mocked(put).mockClear();
	});

	afterEach(() => {
		disconnect();
	});

	it("play calls PUT /me/player/play with the track URI", async () => {
		await play("spotify:track:abc123");

		expect(put).toHaveBeenCalledWith("/me/player/play?device_id=test-device-123", {
			uris: ["spotify:track:abc123"],
		});
	});

	it("play pauses when called with the currently playing URI", async () => {
		playingUri.value = "spotify:track:abc123";
		await play("spotify:track:abc123");

		expect(mockPlayer.pause).toHaveBeenCalled();
		expect(put).not.toHaveBeenCalled();
	});

	it("play is a no-op when SDK is not connected", async () => {
		disconnect();
		await play("spotify:track:abc123");

		expect(put).not.toHaveBeenCalled();
	});

	it("stop pauses the player and clears playingUri", async () => {
		playingUri.value = "spotify:track:abc123";
		await stop();

		expect(mockPlayer.pause).toHaveBeenCalled();
		expect(playingUri.value).toBeNull();
	});

	it("stop is a no-op when no player exists", async () => {
		disconnect();
		await stop();

		expect(playingUri.value).toBeNull();
	});

	it("togglePlay delegates to player.togglePlay", async () => {
		await togglePlay();

		expect(mockPlayer.togglePlay).toHaveBeenCalled();
	});

	it("dismiss stops playback and clears nowPlaying", async () => {
		playingUri.value = "spotify:track:abc123";
		nowPlaying.value = {
			uri: "spotify:track:abc123",
			name: "Test",
			artists: [{ name: "Artist", uri: "spotify:artist:a1" }],
			paused: false,
		};

		await dismiss();

		expect(mockPlayer.pause).toHaveBeenCalled();
		expect(playingUri.value).toBeNull();
		expect(nowPlaying.value).toBeNull();
	});

	it("disconnect cleans up player and resets all state", () => {
		playingUri.value = "spotify:track:abc123";
		nowPlaying.value = {
			uri: "spotify:track:abc123",
			name: "Test",
			artists: [{ name: "Artist", uri: "spotify:artist:a1" }],
			paused: false,
		};
		sdkReady.value = true;

		disconnect();

		expect(mockPlayer.disconnect).toHaveBeenCalled();
		expect(playingUri.value).toBeNull();
		expect(nowPlaying.value).toBeNull();
		expect(sdkReady.value).toBe(false);
	});
});
