// src/api.ts — Spotify API client with auth + rate limiting

import { clearTokens, isTokenExpired, loadTokens, refreshAccessToken } from "./auth";

const BASE_URL = "https://api.spotify.com/v1";

export class SpotifyApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = "SpotifyApiError";
	}
}

async function getAccessToken(): Promise<string> {
	const tokens = loadTokens();
	if (!tokens) throw new SpotifyApiError(401, "Not authenticated");
	if (isTokenExpired()) {
		const refreshed = await refreshAccessToken();
		return refreshed.accessToken;
	}
	return tokens.accessToken;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function get<T>(path: string): Promise<T> {
	const token = await getAccessToken();
	let response = await fetch(`${BASE_URL}${path}`, {
		headers: { Authorization: `Bearer ${token}` },
	});

	// Handle 401 — refresh token and retry once
	if (response.status === 401) {
		try {
			const refreshed = await refreshAccessToken();
			response = await fetch(`${BASE_URL}${path}`, {
				headers: { Authorization: `Bearer ${refreshed.accessToken}` },
			});
		} catch {
			clearTokens();
			throw new SpotifyApiError(401, "Session expired");
		}
	}

	// Handle 429 — wait and retry
	if (response.status === 429) {
		const retryAfter = Number(response.headers.get("Retry-After") || "1");
		await sleep(retryAfter * 1000);
		return get<T>(path);
	}

	if (!response.ok) {
		throw new SpotifyApiError(response.status, `Spotify API error: ${response.status}`);
	}

	return response.json() as Promise<T>;
}
