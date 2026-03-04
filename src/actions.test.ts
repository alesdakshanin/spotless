import { describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({
	put: vi.fn(),
	post: vi.fn(),
	del: vi.fn(),
}));

import { addTrack, removeTrack } from "./actions";
import { del, post, put } from "./api";

const mockedPut = vi.mocked(put);
const mockedPost = vi.mocked(post);
const mockedDel = vi.mocked(del);

describe("addTrack", () => {
	it("calls PUT /me/tracks for Liked Songs source", async () => {
		mockedPut.mockResolvedValueOnce(undefined);

		await addTrack("spotify:track:abc123", { type: "liked" });

		expect(mockedPut).toHaveBeenCalledWith("/me/tracks", { ids: ["abc123"] });
	});

	it("calls POST /playlists/{id}/tracks for playlist source", async () => {
		mockedPost.mockResolvedValueOnce(undefined);

		await addTrack("spotify:track:abc123", { type: "playlist", id: "playlist456" });

		expect(mockedPost).toHaveBeenCalledWith("/playlists/playlist456/tracks", {
			uris: ["spotify:track:abc123"],
		});
	});
});

describe("removeTrack", () => {
	it("calls DELETE /me/tracks for Liked Songs source", async () => {
		mockedDel.mockResolvedValueOnce(undefined);

		await removeTrack("spotify:track:abc123", { type: "liked" });

		expect(mockedDel).toHaveBeenCalledWith("/me/tracks", { ids: ["abc123"] });
	});

	it("calls DELETE /playlists/{id}/tracks for playlist source", async () => {
		mockedDel.mockResolvedValueOnce(undefined);

		await removeTrack("spotify:track:abc123", { type: "playlist", id: "playlist456" });

		expect(mockedDel).toHaveBeenCalledWith("/playlists/playlist456/tracks", {
			tracks: [{ uri: "spotify:track:abc123" }],
		});
	});
});
