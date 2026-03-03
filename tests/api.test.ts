import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get, SpotifyApiError } from "../src/api";
import { saveTokens, type TokenResponse } from "../src/auth";

function setupValidTokens() {
	saveTokens({
		access_token: "valid_token",
		refresh_token: "refresh_token",
		expires_in: 3600,
	});
}

function mockFetch(response: Partial<Response>) {
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			headers: new Headers(),
			json: () => Promise.resolve({}),
			...response,
		}),
	);
}

describe("api.get", () => {
	beforeEach(() => {
		sessionStorage.clear();
		vi.stubEnv("VITE_SPOTIFY_CLIENT_ID", "test_client_id");
	});

	afterEach(() => {
		sessionStorage.clear();
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it("attaches Bearer token to requests", async () => {
		setupValidTokens();
		mockFetch({ json: () => Promise.resolve({ id: "user123" }) });

		const result = await get<{ id: string }>("/me");

		expect(result.id).toBe("user123");
		const fetchCall = vi.mocked(fetch).mock.calls[0];
		expect(fetchCall?.[0]).toBe("https://api.spotify.com/v1/me");
		const headers = fetchCall?.[1]?.headers as Record<string, string>;
		expect(headers.Authorization).toBe("Bearer valid_token");
	});

	it("throws SpotifyApiError when not authenticated", async () => {
		// No tokens stored
		mockFetch({});

		await expect(get("/me")).rejects.toThrow(SpotifyApiError);
		await expect(get("/me")).rejects.toThrow("Not authenticated");
	});

	it("retries with refreshed token on 401", async () => {
		setupValidTokens();

		// First call returns 401, refresh succeeds, retry returns data
		const refreshResponse: TokenResponse = {
			access_token: "new_access",
			refresh_token: "new_refresh",
			expires_in: 3600,
		};

		let callCount = 0;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockImplementation((url: string) => {
				callCount++;
				// Call 1: original request → 401
				if (callCount === 1) {
					return Promise.resolve({
						ok: false,
						status: 401,
						headers: new Headers(),
					});
				}
				// Call 2: token refresh
				if (callCount === 2) {
					expect(url).toBe("https://accounts.spotify.com/api/token");
					return Promise.resolve({
						ok: true,
						status: 200,
						json: () => Promise.resolve(refreshResponse),
					});
				}
				// Call 3: retried request with new token
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers(),
					json: () => Promise.resolve({ retried: true }),
				});
			}),
		);

		const result = await get<{ retried: boolean }>("/me");
		expect(result.retried).toBe(true);
		expect(callCount).toBe(3);

		// Verify retry used the new token
		const retryCall = vi.mocked(fetch).mock.calls[2];
		const headers = retryCall?.[1]?.headers as Record<string, string>;
		expect(headers.Authorization).toBe("Bearer new_access");
	});

	it("clears tokens and throws on failed refresh after 401", async () => {
		setupValidTokens();

		let callCount = 0;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					return Promise.resolve({
						ok: false,
						status: 401,
						headers: new Headers(),
					});
				}
				// Refresh call fails
				return Promise.resolve({
					ok: false,
					status: 400,
				});
			}),
		);

		await expect(get("/me")).rejects.toThrow("Session expired");

		// Tokens should be cleared
		expect(sessionStorage.getItem("spotify_access_token")).toBeNull();
	});

	it("handles 429 rate limiting with Retry-After", async () => {
		setupValidTokens();

		let callCount = 0;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					return Promise.resolve({
						ok: false,
						status: 429,
						headers: new Headers({ "Retry-After": "1" }),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers(),
					json: () => Promise.resolve({ success: true }),
				});
			}),
		);

		// Use fake timers to avoid actual delay
		vi.useFakeTimers();
		const promise = get<{ success: boolean }>("/me/tracks");
		await vi.advanceTimersByTimeAsync(1000);
		const result = await promise;
		vi.useRealTimers();

		expect(result.success).toBe(true);
		expect(callCount).toBe(2);
	});

	it("throws SpotifyApiError on other error statuses", async () => {
		setupValidTokens();
		mockFetch({ ok: false, status: 500 });

		await expect(get("/me")).rejects.toThrow(SpotifyApiError);
		await expect(get("/me")).rejects.toThrow("Spotify API error: 500");
	});

	it("proactively refreshes expired tokens before request", async () => {
		setupValidTokens();
		// Set token as expired
		sessionStorage.setItem("spotify_expires_at", String(Date.now() - 1000));

		const refreshResponse: TokenResponse = {
			access_token: "refreshed_token",
			refresh_token: "new_refresh",
			expires_in: 3600,
		};

		let callCount = 0;
		vi.stubGlobal(
			"fetch",
			vi.fn().mockImplementation(() => {
				callCount++;
				if (callCount === 1) {
					// First call should be the refresh
					return Promise.resolve({
						ok: true,
						status: 200,
						json: () => Promise.resolve(refreshResponse),
					});
				}
				// Second call is the actual API request
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers(),
					json: () => Promise.resolve({ data: "ok" }),
				});
			}),
		);

		await get("/me");

		// Should have refreshed first, then made the API call
		expect(callCount).toBe(2);
		const apiCall = vi.mocked(fetch).mock.calls[1];
		const headers = apiCall?.[1]?.headers as Record<string, string>;
		expect(headers.Authorization).toBe("Bearer refreshed_token");
	});
});
