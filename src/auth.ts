// src/auth.ts — PKCE OAuth flow for Spotify

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const SCOPES =
	"user-library-read playlist-read-private user-library-modify playlist-modify-public playlist-modify-private";

function getClientId(): string {
	const id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
	if (!id) throw new Error("Missing VITE_SPOTIFY_CLIENT_ID");
	return id;
}

function getRedirectUri(): string {
	return window.location.origin + window.location.pathname;
}

// --- PKCE helpers ---

export function generateCodeVerifier(): string {
	const array = new Uint8Array(64);
	crypto.getRandomValues(array);
	return base64UrlEncode(array);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
	const data = new TextEncoder().encode(verifier);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
	const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join("");
	return btoa(binString).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// --- Login redirect ---

export async function login(): Promise<void> {
	const verifier = generateCodeVerifier();
	const challenge = await generateCodeChallenge(verifier);

	sessionStorage.setItem("pkce_code_verifier", verifier);

	const params = new URLSearchParams({
		client_id: getClientId(),
		response_type: "code",
		redirect_uri: getRedirectUri(),
		code_challenge_method: "S256",
		code_challenge: challenge,
		scope: SCOPES,
	});

	window.location.href = `${AUTHORIZE_URL}?${params.toString()}`;
}

// --- Callback handling ---

export interface TokenResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
}

export async function handleCallback(code: string): Promise<TokenResponse> {
	const verifier = sessionStorage.getItem("pkce_code_verifier");
	if (!verifier) throw new Error("Missing PKCE code verifier");

	sessionStorage.removeItem("pkce_code_verifier");

	const response = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: getClientId(),
			grant_type: "authorization_code",
			code,
			redirect_uri: getRedirectUri(),
			code_verifier: verifier,
		}),
	});

	if (!response.ok) {
		throw new Error(`Token exchange failed: ${response.status}`);
	}

	return response.json() as Promise<TokenResponse>;
}

// --- Token storage ---

const STORAGE_KEYS = {
	accessToken: "spotify_access_token",
	refreshToken: "spotify_refresh_token",
	expiresAt: "spotify_expires_at",
} as const;

export interface StoredTokens {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
}

export function saveTokens(response: TokenResponse): void {
	const expiresAt = Date.now() + response.expires_in * 1000;
	sessionStorage.setItem(STORAGE_KEYS.accessToken, response.access_token);
	sessionStorage.setItem(STORAGE_KEYS.refreshToken, response.refresh_token);
	sessionStorage.setItem(STORAGE_KEYS.expiresAt, String(expiresAt));
}

export function loadTokens(): StoredTokens | null {
	const accessToken = sessionStorage.getItem(STORAGE_KEYS.accessToken);
	const refreshToken = sessionStorage.getItem(STORAGE_KEYS.refreshToken);
	const expiresAt = sessionStorage.getItem(STORAGE_KEYS.expiresAt);

	if (!accessToken || !refreshToken || !expiresAt) return null;

	return { accessToken, refreshToken, expiresAt: Number(expiresAt) };
}

export function clearTokens(): void {
	sessionStorage.removeItem(STORAGE_KEYS.accessToken);
	sessionStorage.removeItem(STORAGE_KEYS.refreshToken);
	sessionStorage.removeItem(STORAGE_KEYS.expiresAt);
}

export function isTokenExpired(): boolean {
	const tokens = loadTokens();
	if (!tokens) return true;
	// Treat as expired 60s early to avoid edge cases
	return Date.now() >= tokens.expiresAt - 60_000;
}

// --- Token refresh ---

export async function refreshAccessToken(): Promise<StoredTokens> {
	const tokens = loadTokens();
	if (!tokens) throw new Error("No tokens to refresh");

	const response = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: getClientId(),
			grant_type: "refresh_token",
			refresh_token: tokens.refreshToken,
		}),
	});

	if (!response.ok) {
		clearTokens();
		throw new Error(`Token refresh failed: ${response.status}`);
	}

	const data = (await response.json()) as TokenResponse;
	saveTokens(data);
	const refreshed = loadTokens();
	if (!refreshed) throw new Error("Failed to load tokens after refresh");
	return refreshed;
}
