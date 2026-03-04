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

async function request(
	path: string,
	options: { method: string; body?: unknown } = { method: "GET" },
): Promise<Response> {
	const token = await getAccessToken();
	const jsonBody = options.body !== undefined ? JSON.stringify(options.body) : undefined;

	function buildHeaders(bearerToken: string): HeadersInit {
		const h: Record<string, string> = { Authorization: `Bearer ${bearerToken}` };
		if (jsonBody !== undefined) h["Content-Type"] = "application/json";
		return h;
	}

	let response = await fetch(`${BASE_URL}${path}`, {
		method: options.method,
		headers: buildHeaders(token),
		body: jsonBody,
	});

	// Handle 401 — refresh token and retry once
	if (response.status === 401) {
		try {
			const refreshed = await refreshAccessToken();
			response = await fetch(`${BASE_URL}${path}`, {
				method: options.method,
				headers: buildHeaders(refreshed.accessToken),
				body: jsonBody,
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
		return request(path, options);
	}

	if (!response.ok) {
		throw new SpotifyApiError(response.status, `Spotify API error: ${response.status}`);
	}

	return response;
}

export async function get<T>(path: string): Promise<T> {
	const response = await request(path);
	return response.json() as Promise<T>;
}

export async function put(path: string, body?: unknown): Promise<void> {
	await request(path, { method: "PUT", body });
}

export async function post(path: string, body?: unknown): Promise<void> {
	await request(path, { method: "POST", body });
}

export async function del(path: string, body?: unknown): Promise<void> {
	await request(path, { method: "DELETE", body });
}
